<?php

/*
| Web Push (VAPID). Generate the keys once on the server:
|   php artisan webpush:vapid   (writes WEBPUSH_PUBLIC_KEY / WEBPUSH_PRIVATE_KEY to .env)
| The private key never leaves .env.
*/
return [
    'subject' => env('WEBPUSH_SUBJECT', 'mailto:info@elyusr.org'),
    'public_key' => env('WEBPUSH_PUBLIC_KEY'),
    'private_key' => env('WEBPUSH_PRIVATE_KEY'),
    // Seconds the push service keeps an undelivered notification (device offline).
    'ttl' => (int) env('WEBPUSH_TTL', 86400),
];
