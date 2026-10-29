<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * Fills the database once with the static content exported from the frontend.
 *
 *   php artisan db:seed --class=ContentSeeder
 *
 * Safe to re-run: missing rows are inserted, existing rows only get their EMPTY columns filled.
 * Order matters: categories before items, parents (programs/projects/campaigns) before packages and sections.
 */
class ContentSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            // FAQs
            FaqCategoriesSeeder::class,
            FaqsSeeder::class,

            // donation targets, then their children
            ProgramsSeeder::class,
            ProjectsSeeder::class,
            DonationCampaignsSeeder::class,
            ProgramPageSectionsSeeder::class,
            DonationPackagesSeeder::class,
            SeasonsSeeder::class,

            // services (new tables)
            ServiceCategoriesSeeder::class,
            ServicesSeeder::class,
            ServicesMapAxesSeeder::class,

            // blog
            BlogCategoriesSeeder::class,
            BlogAuthorsSeeder::class,
            BlogPostsSeeder::class,

            // media & stories
            GallerySeeder::class,
            StoriesSeeder::class,

            // homepage + local SEO pages
            HomepageCampaignsSectionSeeder::class,
            GeoPagesSeeder::class,
            DakahliaCitiesSeeder::class,
        ]);
    }
}
