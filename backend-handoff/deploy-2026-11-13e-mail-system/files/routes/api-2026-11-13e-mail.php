<?php
/*
 | Email system (13 Nov 2026, e), loaded from the last line of routes/api.php:
 |   require __DIR__.'/api-2026-11-13e-mail.php';
 */

use App\Http\Controllers\Api\V1\Mail\MailAdminController;
use App\Http\Controllers\Api\V1\Mail\MailPublicController;
use App\Http\Controllers\Api\V1\Newsletter\NewsletterCampaignController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::get('mail/o/{token}.gif', [MailPublicController::class, 'open'])->where('token', '[A-Za-z0-9]{32}');
    Route::get('mail/c/{token}', [MailPublicController::class, 'click'])->where('token', '[A-Za-z0-9]{32}');

    Route::post('misbaha-rooms/{slug}/subscribe', [MailPublicController::class, 'misbahaSubscribe'])->middleware('throttle:6,1');
    Route::post('misbaha-subscriptions/confirm', [MailPublicController::class, 'misbahaConfirm'])->middleware('throttle:20,1');
    Route::post('misbaha-subscriptions/unsubscribe', [MailPublicController::class, 'misbahaUnsubscribe'])->middleware('throttle:20,1');
    Route::post('misbaha-subscriptions/unsubscribe/{token}', [MailPublicController::class, 'misbahaUnsubscribe'])->middleware('throttle:20,1');
    Route::post('newsletter/one-click/{token}', [MailPublicController::class, 'newsletterOneClick'])->middleware('throttle:20,1');

    Route::middleware(['auth:sanctum', 'throttle:120,1'])->group(function () {
        Route::middleware('permission:newsletter.view')->group(function () {
            Route::get('admin/mail/overview', [MailAdminController::class, 'overview']);
            Route::get('admin/mail/log', [MailAdminController::class, 'log']);
            Route::get('admin/mail/log/{id}/preview', [MailAdminController::class, 'logPreview'])->whereNumber('id');
            Route::get('admin/mail/templates/{kind}/preview', [MailAdminController::class, 'templatePreview'])->where('kind', '[a-z_]+');
            Route::post('admin/mail/preview', [MailAdminController::class, 'preview']);
            Route::get('admin/mail/misbaha-subscriptions', [MailAdminController::class, 'misbahaSubscriptions']);
            Route::get('newsletter-campaigns/{newsletterCampaign}/preview', [NewsletterCampaignController::class, 'preview']);
        });
        Route::middleware('permission:newsletter.update')->group(function () {
            Route::post('admin/mail/log/{id}/retry', [MailAdminController::class, 'retry'])->whereNumber('id');
            Route::post('admin/mail/log/{id}/cancel', [MailAdminController::class, 'cancel'])->whereNumber('id');
            Route::post('admin/mail/pump', [MailAdminController::class, 'pump'])->middleware('throttle:6,1');
            Route::put('admin/mail/settings', [MailAdminController::class, 'settings']);
            Route::post('admin/mail/templates/{kind}/test', [MailAdminController::class, 'templateTest'])->where('kind', '[a-z_]+')->middleware('throttle:10,1');
            Route::post('newsletter-campaigns/{newsletterCampaign}/cancel', [NewsletterCampaignController::class, 'cancel']);
            Route::post('newsletter-campaigns/{newsletterCampaign}/duplicate', [NewsletterCampaignController::class, 'duplicate']);
        });
        Route::delete('admin/mail/misbaha-subscriptions/{id}', [MailAdminController::class, 'misbahaSubscriptionDestroy'])->whereNumber('id')->middleware('permission:newsletter.delete');
    });
});
