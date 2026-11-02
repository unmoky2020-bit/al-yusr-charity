<?php
/*
 | Routes added on 2 Nov 2026: public newsletter subscribe and shared misbaha rooms.
 | 3 Nov 2026: GET media/find (media library dedupe).
 | Loaded from the last line of routes/api.php:  require __DIR__.'/api-2026-11.php';
 | Kept in their own file so nobody has to edit the big routes file by hand.
 */

use App\Http\Controllers\Api\V1\Media\MediaController;
use App\Http\Controllers\Api\V1\Misbaha\MisbahaRoomController;
use App\Http\Controllers\Api\V1\Newsletter\NewsletterPublicController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // ── Public ──
    Route::post('newsletter/subscribe', [NewsletterPublicController::class, 'subscribe'])
        ->middleware('throttle:5,1');

    Route::get('misbaha-rooms', [MisbahaRoomController::class, 'index']);
    Route::get('misbaha-rooms/stats', [MisbahaRoomController::class, 'stats']); // before {slug}
    Route::post('misbaha-rooms', [MisbahaRoomController::class, 'store'])->middleware('throttle:5,1');
    Route::get('misbaha-rooms/{slug}', [MisbahaRoomController::class, 'show']);
    Route::post('misbaha-rooms/{slug}/count', [MisbahaRoomController::class, 'count'])->middleware('throttle:120,1');

    // ── Team ──
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('admin/misbaha-rooms', [MisbahaRoomController::class, 'adminIndex'])
            ->middleware('permission:content.view');
        Route::patch('admin/misbaha-rooms/{misbahaRoom}', [MisbahaRoomController::class, 'adminUpdate'])
            ->middleware('permission:content.update');

        // 3 Nov 2026: media library — is this exact image already stored? (dedupe before upload)
        Route::get('media/find', [MediaController::class, 'find'])
            ->middleware('permission:media.upload');
    });
});
