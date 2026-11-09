<?php
/*
 | Routes added on 9 Nov 2026 (loaded from the last line of routes/api.php:
 |   require __DIR__.'/api-2026-11-09.php';)
 |  - the signed-in person's profile: save details, photo
 |  - delivery steps of a paid donation (family chosen → being prepared → delivered)
 |  - the donors (customers) sheet for Excel
 |  - homepage engagement counters (views / clicks of the campaigns strip)
 */

use App\Http\Controllers\Api\V1\Auth\ProfileController;
use App\Http\Controllers\Api\V1\Donation\DonationDeliveryController;
use App\Http\Controllers\Api\V1\Engagement\EngagementController;
use App\Http\Controllers\Api\V1\Reports\DonorsReportController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // ── Public ──
    Route::post('engagement', [EngagementController::class, 'record'])->middleware('throttle:120,1');

    // ── Signed in ──
    Route::middleware('auth:sanctum')->group(function () {
        Route::put('profile', [ProfileController::class, 'update'])->middleware('throttle:20,1');
        Route::post('profile/avatar', [ProfileController::class, 'uploadAvatar'])->middleware('throttle:10,1');
        Route::delete('profile/avatar', [ProfileController::class, 'removeAvatar'])->middleware('throttle:10,1');

        Route::patch('donations/{donation}/delivery', [DonationDeliveryController::class, 'update'])
            ->middleware('permission:donations.update');

        Route::get('reports/donors', [DonorsReportController::class, 'index'])
            ->middleware(['permission:donors.view', 'throttle:20,1']);

        Route::get('admin/engagement', [EngagementController::class, 'index'])
            ->middleware('permission:homepage.update');
        Route::delete('admin/engagement', [EngagementController::class, 'reset'])
            ->middleware('permission:homepage.update');
    });
});
