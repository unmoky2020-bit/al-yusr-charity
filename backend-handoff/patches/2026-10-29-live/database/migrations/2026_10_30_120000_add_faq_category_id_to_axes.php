<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** An axis page shows the questions of one FAQ category (like programs, projects and campaigns). */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('axes', function (Blueprint $table) {
            $table->foreignId('faq_category_id')->nullable()->constrained('faq_categories')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('axes', function (Blueprint $table) {
            $table->dropConstrainedForeignId('faq_category_id');
        });
    }
};
