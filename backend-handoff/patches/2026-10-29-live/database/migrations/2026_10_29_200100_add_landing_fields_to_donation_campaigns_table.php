<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Campaign landing page content edited from the dashboard. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('donation_campaigns', function (Blueprint $table) {
            $table->json('page_content')->nullable()->after('description_en');
            $table->json('seo')->nullable()->after('page_content');
            $table->json('faqs')->nullable()->after('seo');
            $table->string('landing_slug', 120)->nullable()->after('slug')->index();
        });
    }

    public function down(): void
    {
        Schema::table('donation_campaigns', function (Blueprint $table) {
            $table->dropColumn(['page_content', 'seo', 'faqs', 'landing_slug']);
        });
    }
};
