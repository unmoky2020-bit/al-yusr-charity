<?php
/*
 | Routes added on 8 Nov 2026 (loaded from the last line of routes/api.php:
 |   require __DIR__.'/api-2026-11-08.php';)
 |  - forgotten password by an email code; confirming the email with a code
 |  - sign in with Google / Facebook (buttons hidden until the keys are in .env)
 |  - what the signed-in account may do (the dashboard menu is built from it)
 |  - the super admin sets any user's password
 */

use App\Http\Controllers\Api\V1\Auth\AccessController;
use App\Http\Controllers\Api\V1\Auth\EmailVerificationController;
use App\Http\Controllers\Api\V1\Auth\PasswordResetController;
use App\Http\Controllers\Api\V1\Auth\SocialAuthController;
use App\Http\Controllers\Api\V1\UserManagement\UserPasswordController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // ── Public ──
    Route::post('forgot-password', [PasswordResetController::class, 'send'])->middleware('throttle:3,1');
    Route::post('reset-password', [PasswordResetController::class, 'reset'])->middleware('throttle:5,1');
    Route::get('auth/providers', [SocialAuthController::class, 'providers'])->middleware('throttle:60,1');
    Route::post('auth/google', [SocialAuthController::class, 'google'])->middleware('throttle:10,1');
    Route::post('auth/facebook', [SocialAuthController::class, 'facebook'])->middleware('throttle:10,1');

    // ── Signed in ──
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('me/access', [AccessController::class, 'show']);
        Route::post('email/verification-code', [EmailVerificationController::class, 'send'])->middleware('throttle:3,1');
        Route::post('email/verify', [EmailVerificationController::class, 'verify'])->middleware('throttle:10,1');
        Route::put('users/{user}/password', [UserPasswordController::class, 'update'])->middleware('throttle:10,1');
    });
});
