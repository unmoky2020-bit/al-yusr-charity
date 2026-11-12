<?php
/*
 | Extras (13 Nov 2026), loaded from the last line of routes/api.php:
 |   require __DIR__.'/api-2026-11-13-extras.php';
 |  - package pictures: public map + team set / remove (owner's update permission, checked inside)
 |  - site blocks: organisation data, About milestones, header / footer links
 */

use App\Http\Controllers\Api\V1\Extras\PackageImageController;
use App\Http\Controllers\Api\V1\Extras\SiteBlockController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // ── Public ──
    Route::middleware('throttle:120,1')->group(function () {
        Route::get('package-images', [PackageImageController::class, 'index']);
        Route::get('site-blocks', [SiteBlockController::class, 'index']);
    });

    // ── Team ──
    Route::middleware(['auth:sanctum', 'throttle:60,1'])->group(function () {
        // The owner's permission is checked inside; an editor's change still waits for approval.
        Route::middleware('editor.approval')->group(function () {
            Route::put('admin/package-images/{package}', [PackageImageController::class, 'update'])->whereNumber('package');
            Route::delete('admin/package-images/{package}', [PackageImageController::class, 'destroy'])->whereNumber('package');
        });

        Route::middleware(['permission:settings.update', 'editor.approval'])->group(function () {
            Route::put('admin/site-blocks/{key}', [SiteBlockController::class, 'update'])->where('key', '[a-z_]+');
            Route::delete('admin/site-blocks/{key}', [SiteBlockController::class, 'destroy'])->where('key', '[a-z_]+');
        });
    });
});
