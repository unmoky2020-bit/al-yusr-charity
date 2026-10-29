<?php

namespace Database\Seeders;

use Illuminate\Support\Facades\DB;

/**
 * Seeds the program page sections (GET /programs/{id}/page-sections) from program_page_sections.json.
 * Natural key: (program_id, section_key). Run after ProgramsSeeder.
 * A program that already had ANY section keeps its own layout: no new section keys are added to it, only the empty
 * columns of its existing sections are filled. Programs with no sections get the full default layout.
 */
class ProgramPageSectionsSeeder extends ContentSeederBase
{
    /** Change if the table behind /programs/{id}/page-sections has another name. */
    public const TABLE = 'program_page_sections';

    public function run(): void
    {
        if (! $this->tableReady(self::TABLE)) {
            return;
        }
        /** @var array<int, bool> program id => had sections before this run */
        $hadSections = [];

        foreach ($this->json('program_page_sections') as $row) {
            $programId = $this->idBySlug('programs', $row['program_slug'] ?? null);
            if (! $programId) {
                $this->warn("program `{$row['program_slug']}` not found — section {$row['section_key']} skipped");

                continue;
            }
            unset($row['program_slug']);
            $row['program_id'] = $programId;
            $natural = ['program_id' => $programId, 'section_key' => $row['section_key']];

            $hadSections[$programId] ??= DB::table(self::TABLE)->where('program_id', $programId)->exists();
            if ($hadSections[$programId] && ! DB::table(self::TABLE)->where($natural)->exists()) {
                continue;
            }

            $this->upsertFillEmpty(self::TABLE, $natural, $row);
        }

        $this->report(self::TABLE);
    }
}
