<?php

/*
 | Sign in with Google / Facebook (App\Http\Controllers\Api\V1\Auth\SocialAuthController).
 | Leave a value empty and its button stays hidden on the site.
 |   GOOGLE_CLIENT_ID     — Google Cloud console → APIs & Services → Credentials → OAuth client (Web)
 |   FACEBOOK_APP_ID      — developers.facebook.com → your app → Settings → Basic
 |   FACEBOOK_APP_SECRET  — same page (never sent to the browser)
 */
return [
    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
    ],
    'facebook' => [
        'app_id' => env('FACEBOOK_APP_ID'),
        'app_secret' => env('FACEBOOK_APP_SECRET'),
    ],
];
