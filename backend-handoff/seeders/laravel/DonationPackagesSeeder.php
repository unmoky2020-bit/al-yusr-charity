<?php

namespace Database\Seeders;

use Illuminate\Support\Facades\DB;

/**
 * Seeds donation packages for programs, projects and donation campaigns:
 *   program_donation_packages.json   -> program_id
 *   project_donation_packages.json   -> project_id
 *   donation_campaign_packages.json  -> donation_campaign_id   (key = landing-page price id, e.g. "blanket")
 *
 * Matching: (parent_id, key) when the new `key` column exists and a row has that key; otherwise (parent_id, name_ar)
 * (an existing package with the same Arabic name gets its empty `key` filled — this is how the frontend matches today).
 * A parent that ALREADY had packages before this run never receives new ones (ONLY_ADD_TO_EMPTY_PARENTS):
 * the admin's price list wins; skipped packages are printed as warnings.
 * Run after ProgramsSeeder, ProjectsSeeder and DonationCampaignsSeeder.
 *
 * The live API exposes packages with program_id / project_id / donation_campaign_id. If your schema uses three
 * separate tables instead of one `donation_packages` table, change the TABLES map.
 */
class DonationPackagesSeeder extends ContentSeederBase
{
    /** json file => [table, parent table, parent fk, slug field in the json] */
    public const TABLES = [
        'program_donation_packages' => ['donation_packages', 'programs', 'program_id', 'program_slug'],
        'project_donation_packages' => ['donation_packages', 'projects', 'project_id', 'project_slug'],
        'donation_campaign_packages' => ['donation_packages', 'donation_campaigns', 'donation_campaign_id', 'donation_campaign_slug'],
    ];

    /** true = only add packages to a program/project/campaign that had none before this run. */
    public const ONLY_ADD_TO_EMPTY_PARENTS = true;

    public function run(): void
    {
        foreach (self::TABLES as $json => [$table, $parentTable, $fk, $slugField]) {
            if (! $this->tableReady($table)) {
                continue;
            }
            if (! $this->hasColumn($table, $fk)) {
                $this->warn("`{$table}` has no `{$fk}` column — {$json} skipped");

                continue;
            }
            $useKey = $this->hasColumn($table, 'key');
            /** @var array<int, bool> parent id => had packages before this run */
            $hadPackages = [];

            foreach ($this->json($json) as $row) {
                $parentSlug = $row[$slugField] ?? null;
                $parentId = $this->idBySlug($parentTable, $parentSlug);
                if (! $parentId) {
                    $this->warn("{$parentTable} `{$parentSlug}` not found — package {$row['key']} skipped");

                    continue;
                }
                unset($row[$slugField]);
                $row[$fk] = $parentId;

                $hadPackages[$parentId] ??= DB::table($table)->where($fk, $parentId)->exists();

                $byKey = [$fk => $parentId, 'key' => $row['key']];
                $byName = [$fk => $parentId, 'name_ar' => $row['name_ar']];
                $natural = ($useKey && DB::table($table)->where($byKey)->exists()) ? $byKey : $byName;
                $exists = DB::table($table)->where($natural)->exists();

                if (! $exists && self::ONLY_ADD_TO_EMPTY_PARENTS && $hadPackages[$parentId]) {
                    $this->warn("{$parentTable} `{$parentSlug}` already has packages — `{$row['key']}` ({$row['name_ar']}) NOT added");

                    continue;
                }

                $this->upsertFillEmpty($table, $natural, $row);
            }

            $this->report("{$table} ({$json})");
        }
    }
}
