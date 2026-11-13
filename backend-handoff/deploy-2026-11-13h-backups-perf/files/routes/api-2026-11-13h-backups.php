<?php
/* Backups (13 Nov 2026, h), loaded from the last line of routes/api.php. Super admin only (checked in the controller). */
use App\Http\Controllers\Api\V1\Backup\BackupController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->middleware(['auth:sanctum', 'throttle:60,1'])->group(function () {
    Route::get('admin/backups', [BackupController::class, 'index']);
    Route::post('admin/backups', [BackupController::class, 'store'])->middleware('throttle:6,1');
    Route::get('admin/backups/{id}/download', [BackupController::class, 'download'])->whereNumber('id');
    Route::delete('admin/backups/{id}', [BackupController::class, 'destroy'])->whereNumber('id');
});
