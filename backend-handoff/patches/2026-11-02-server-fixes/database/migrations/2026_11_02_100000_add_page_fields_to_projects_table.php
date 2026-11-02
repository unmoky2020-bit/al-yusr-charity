<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Project landing-page fields the dashboard already sends (projectForm.ts) and the
 * public pages read (/projects/{slug}, /farm). Same shapes as programs / donation_campaigns.
 * Every column is added only if missing, so the migration is safe to re-run.
 */
return new class extends Migration
{
    private array $text = ['description_en', 'content_ar', 'content_en', 'meta_description_ar', 'meta_description_en',
        'keywords_ar', 'keywords_en', 'ai_summary_ar', 'ai_summary_en'];
    private array $strings = ['meta_title_ar', 'meta_title_en', 'canonical_url', 'schema_type', 'twitter_card',
        'geo_region', 'geo_placename', 'geo_position', 'geo_position_label'];
    private array $json = ['page_content', 'benefits_ar', 'benefits_en', 'ai_faq_ar', 'ai_faq_en'];
    private array $bools = ['donation_available' => true, 'hide_from_audience' => false, 'noindex' => false, 'nofollow' => false];

    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            foreach ($this->text as $c) if (!Schema::hasColumn('projects', $c)) $table->text($c)->nullable();
            foreach ($this->strings as $c) if (!Schema::hasColumn('projects', $c)) $table->string($c, 2048)->nullable();
            foreach ($this->json as $c) if (!Schema::hasColumn('projects', $c)) $table->json($c)->nullable();
            foreach ($this->bools as $c => $default) if (!Schema::hasColumn('projects', $c)) $table->boolean($c)->default($default);
        });
    }

    public function down(): void
    {
        $all = array_merge($this->text, $this->strings, $this->json, array_keys($this->bools));
        $existing = array_values(array_filter($all, fn ($c) => Schema::hasColumn('projects', $c)));
        if ($existing) Schema::table('projects', fn (Blueprint $table) => $table->dropColumn($existing));
    }
};
