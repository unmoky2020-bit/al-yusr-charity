<?php
// Add to routes/api.php in the PUBLIC part, next to newsletter/confirm and newsletter/unsubscribe:
use App\Http\Controllers\Api\V1\Newsletter\NewsletterPublicController;

Route::post('newsletter/subscribe', [NewsletterPublicController::class, 'subscribe'])
    ->middleware('throttle:5,1');
