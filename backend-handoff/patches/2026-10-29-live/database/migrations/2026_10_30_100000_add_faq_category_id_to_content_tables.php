<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Programs, projects and donation campaigns each show the questions of one FAQ category. */
return new class extends Migration
{
    private const TABLES = ['programs', 'projects', 'donation_campaigns'];

    public function up(): void
    {
        foreach (self::TABLES as $name) {
            Schema::table($name, function (Blueprint $table) {
                $table->foreignId('faq_category_id')->nullable()->constrained('faq_categories')->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        foreach (self::TABLES as $name) {
            Schema::table($name, function (Blueprint $table) {
                $table->dropConstrainedForeignId('faq_category_id');
            });
        }
    }
};
