<?php

namespace Database\Seeders;

/** Seeds the NEW table `geo_pages` (one row per governorate × program) from geo_pages.json. */
class GeoPagesSeeder extends ContentSeederBase
{
    public const TABLE = 'geo_pages';

    public function run(): void
    {
        if (! $this->tableReady(self::TABLE)) {
            return;
        }

        foreach ($this->json('geo_pages') as $row) {
            $this->upsertFillEmpty(
                self::TABLE,
                ['governorate_slug' => $row['governorate_slug'], 'program_slug' => $row['program_slug']],
                $row,
            );
        }

        $this->report(self::TABLE);
    }
}
