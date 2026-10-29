<?php

namespace App\Observers;

use App\Http\Controllers\SitemapController;
use App\Support\IndexNow;
use App\Support\PublicUrls;
use Illuminate\Contracts\Events\ShouldHandleEventsAfterCommit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

/**
 * Programs, axes, cases, stories and articles: when one becomes public or changes while public,
 * refresh the content sitemap and ping IndexNow (after the response, so saving stays fast).
 */
class PublicContentObserver implements ShouldHandleEventsAfterCommit
{
    public function saved(Model $model): void
    {
        Cache::forget(SitemapController::CACHE_KEY);

        $path = PublicUrls::pathOf($model);
        if ($path && ($model->wasRecentlyCreated || $model->wasChanged())) {
            app()->terminating(fn () => IndexNow::submit([$path]));
        }
    }

    public function deleted(Model $model): void
    {
        Cache::forget(SitemapController::CACHE_KEY);
    }
}
