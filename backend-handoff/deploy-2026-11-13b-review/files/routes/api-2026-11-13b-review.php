<?php
/*
 | Review details (13 Nov 2026), loaded from the last line of routes/api.php:
 |   require __DIR__.'/api-2026-11-13b-review.php';
 */

use App\Http\Controllers\Api\V1\Extras\ChangeRequestDetailsController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->middleware(['auth:sanctum', 'throttle:60,1'])->group(function () {
    Route::get('admin/change-requests/details', [ChangeRequestDetailsController::class, 'index']);
});
