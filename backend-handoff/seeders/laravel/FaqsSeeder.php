<?php

namespace Database\Seeders;

/** Seeds `faqs` from faqs.json. Natural key: (faq_category_id, question_ar). Run after FaqCategoriesSeeder. */
class FaqsSeeder extends ContentSeederBase
{
    public const TABLE = 'faqs';

    public function run(): void
    {
        if (! $this->tableReady(self::TABLE)) {
            return;
        }

        foreach ($this->json('faqs') as $row) {
            $categoryId = $this->idBySlug('faq_categories', $row['faq_category_slug'] ?? null);
            if (! $categoryId) {
                $this->warn("faq category `{$row['faq_category_slug']}` not found — question skipped: " . mb_substr($row['question_ar'], 0, 40));

                continue;
            }
            unset($row['faq_category_slug']);
            $row['faq_category_id'] = $categoryId;

            $this->upsertFillEmpty(self::TABLE, ['faq_category_id' => $categoryId, 'question_ar' => $row['question_ar']], $row);
        }

        $this->report(self::TABLE);
    }
}
