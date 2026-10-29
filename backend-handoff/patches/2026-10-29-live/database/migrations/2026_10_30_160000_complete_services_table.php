<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Service pages (/services/:slug): the page sections the table was missing. Existing columns are
 * reused (image_url = hero image, short_intro_* = intro, seo_* = meta).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->string('program_slug')->nullable()->after('slug');
            $table->string('sector')->nullable()->after('program_slug');
            $table->json('bullets_ar')->nullable();
            $table->json('bullets_en')->nullable();
            $table->json('stats')->nullable();
            $table->json('features')->nullable();
            $table->json('tiers')->nullable();
            $table->json('related')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->dropColumn(['program_slug', 'sector', 'bullets_ar', 'bullets_en', 'stats', 'features', 'tiers', 'related']);
        });
    }
};
