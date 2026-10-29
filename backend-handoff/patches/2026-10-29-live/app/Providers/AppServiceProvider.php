<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        \App\Models\Donation::observe(\App\Observers\DonationObserver::class);

        // Public content: refresh the content sitemap and ping IndexNow when it changes.
        foreach ([\App\Models\Program::class, \App\Models\Axis::class, \App\Models\CaseModel::class, \App\Models\Story::class, \App\Models\Content::class] as $model) {
            $model::observe(\App\Observers\PublicContentObserver::class);
        }
    }
}
