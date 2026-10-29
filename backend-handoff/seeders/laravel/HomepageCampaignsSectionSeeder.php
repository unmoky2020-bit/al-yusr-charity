<?php

namespace Database\Seeders;

/** Seeds the single-row NEW table `homepage_campaigns_sections` (homepage "campaigns" strip settings + default cards). */
class HomepageCampaignsSectionSeeder extends ContentSeederBase
{
    public const TABLE = 'homepage_campaigns_sections';

    public function run(): void
    {
        if (! $this->tableReady(self::TABLE)) {
            return;
        }
        $row = $this->json('homepage_campaigns_section');
        if (! $row) {
            return;
        }
        $this->upsertFillEmpty(self::TABLE, ['id' => 1], $row);

        $this->report(self::TABLE);
    }
}
