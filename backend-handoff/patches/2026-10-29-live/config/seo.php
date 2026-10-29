<?php

return [
    /** Public website (the React app) — every URL in the sitemap / IndexNow points here. */
    'site_url' => rtrim(env('FRONTEND_URL', 'https://elyusr.org'), '/'),

    /** IndexNow key (Bing, Yandex, Seznam…). The same value must be served at {site_url}/{key}.txt. Empty = off. */
    'indexnow_key' => env('INDEXNOW_KEY'),
];
