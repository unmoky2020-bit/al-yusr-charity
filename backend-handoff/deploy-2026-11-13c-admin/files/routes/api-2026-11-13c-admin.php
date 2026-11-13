<?php
/*
 | Admin extras (13 Nov 2026, c), loaded from the last line of routes/api.php:
 |   require __DIR__.'/api-2026-11-13c-admin.php';
 */

use App\Http\Controllers\Api\V1\Extras\MisbahaAdminController;
use App\Http\Controllers\Api\V1\Extras\RecordExtrasController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::get('record-extras/{type}/{id}', [RecordExtrasController::class, 'show'])
        ->where(['type' => '[a-z]+', 'id' => '[0-9]+'])->middleware('throttle:120,1');

    Route::middleware(['auth:sanctum', 'throttle:60,1'])->group(function () {
        Route::put('admin/record-extras/{type}/{id}', [RecordExtrasController::class, 'update'])
            ->where(['type' => '[a-z]+', 'id' => '[0-9]+'])->middleware('editor.approval');

        Route::middleware(['permission:content.update', 'editor.approval'])->group(function () {
            Route::post('admin/misbaha-rooms/bulk-delete', [MisbahaAdminController::class, 'bulkDestroy']);
            Route::patch('admin/misbaha-rooms/{id}/details', [MisbahaAdminController::class, 'update'])->whereNumber('id');
            Route::delete('admin/misbaha-rooms/{id}', [MisbahaAdminController::class, 'destroy'])->whereNumber('id');
        });
    });
});
