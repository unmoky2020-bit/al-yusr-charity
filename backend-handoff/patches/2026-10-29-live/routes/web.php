<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Live sitemap of database content (programs, axes, cases, stories, articles) for elyusr.org.
Route::get('/sitemap-content.xml', \App\Http\Controllers\SitemapController::class);
