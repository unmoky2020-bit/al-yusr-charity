<?php

namespace Database\Seeders;

/** Seeds `gallery` from gallery.json. Gallery rows have no slug: natural key = alt_ar (unique per static image). */
class GallerySeeder extends ContentSeederBase
{
    /** Change if the table behind /api/v1/gallery has another name (e.g. gallery_images). */
    public const TABLE = 'gallery';

    public function run(): void
    {
        if (! $this->tableReady(self::TABLE)) {
            return;
        }

        foreach ($this->json('gallery') as $row) {
            if (empty($row['alt_ar'])) {
                continue;
            }
            $this->upsertFillEmpty(self::TABLE, ['alt_ar' => $row['alt_ar']], $row, ['image' => 'gallery']);
        }

        $this->report(self::TABLE);
    }
}
