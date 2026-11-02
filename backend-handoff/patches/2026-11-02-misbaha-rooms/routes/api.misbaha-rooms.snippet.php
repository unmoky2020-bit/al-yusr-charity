<?php
// Add to routes/api.php.
use App\Http\Controllers\Api\V1\Misbaha\MisbahaRoomController;

// 1) In the PUBLIC part (next to the other public routes, e.g. near donations/submit):
Route::get('misbaha-rooms', [MisbahaRoomController::class, 'index']);
Route::post('misbaha-rooms', [MisbahaRoomController::class, 'store'])->middleware('throttle:5,1');
Route::get('misbaha-rooms/{slug}', [MisbahaRoomController::class, 'show']);
Route::post('misbaha-rooms/{slug}/count', [MisbahaRoomController::class, 'count'])->middleware('throttle:120,1');

// 2) Inside the auth:sanctum group (team only):
Route::get('admin/misbaha-rooms', [MisbahaRoomController::class, 'adminIndex'])->middleware('permission:content.view');
Route::patch('admin/misbaha-rooms/{misbahaRoom}', [MisbahaRoomController::class, 'adminUpdate'])->middleware('permission:content.update');
