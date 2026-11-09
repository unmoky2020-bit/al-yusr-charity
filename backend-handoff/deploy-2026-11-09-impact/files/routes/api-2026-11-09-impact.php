<?php
/*
 | Impact & transparency routes (9 Nov 2026), loaded from the last line of routes/api.php:
 |   require __DIR__.'/api-2026-11-09-impact.php';
 |  - public: the impact report, one target's report, a case's transparency file
 |  - team: case lines / follower / outcome / history, delivery undo + photo upload, distribution days
 */

use App\Http\Controllers\Api\V1\Donation\DonationDeliveryController;
use App\Http\Controllers\Api\V1\Impact\CaseFileController;
use App\Http\Controllers\Api\V1\Impact\DistributionController;
use App\Http\Controllers\Api\V1\Impact\ImpactController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // ── Public ──
    Route::middleware('throttle:60,1')->group(function () {
        Route::get('impact', [ImpactController::class, 'overview']);
        Route::get('impact/{kind}/{key}', [ImpactController::class, 'target'])->whereIn('kind', ['program', 'project', 'campaign', 'case']);
        Route::get('cases/{case}/file', [CaseFileController::class, 'show']);
    });

    // ── Team ──
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('impact/my-cases', [CaseFileController::class, 'myCases']);
        Route::get('impact/team', [CaseFileController::class, 'team'])->middleware('permission:cases.update');

        Route::get('cases/{case}/history', [CaseFileController::class, 'history'])->middleware('permission:cases.view');
        Route::middleware('permission:cases.update')->group(function () {
            Route::post('cases/{case}/items', [CaseFileController::class, 'storeItem']);
            Route::post('cases/{case}/items/reorder', [CaseFileController::class, 'reorderItems']);
            Route::put('case-items/{item}', [CaseFileController::class, 'updateItem']);
            Route::delete('case-items/{item}', [CaseFileController::class, 'destroyItem']);
            Route::put('cases/{case}/follower', [CaseFileController::class, 'setFollower']);
            Route::put('cases/{case}/outcome', [CaseFileController::class, 'saveOutcome']);
            Route::delete('cases/{case}/outcome', [CaseFileController::class, 'clearOutcome']);
        });

        Route::middleware('permission:donations.update')->group(function () {
            Route::delete('donations/{donation}/delivery/last', [DonationDeliveryController::class, 'undo']);
            Route::post('impact/upload', [DonationDeliveryController::class, 'upload'])->middleware('throttle:60,1');
            Route::post('distributions', [DistributionController::class, 'store'])->middleware('throttle:30,1');
            Route::put('distributions/{distribution}', [DistributionController::class, 'update']);
            Route::delete('distributions/{distribution}', [DistributionController::class, 'destroy']);
        });
        Route::middleware('permission:donations.view')->group(function () {
            Route::get('distributions', [DistributionController::class, 'index']);
            Route::get('distributions/candidates', [DistributionController::class, 'candidates']);
            Route::get('distributions/{distribution}', [DistributionController::class, 'show']);
        });
    });
});
