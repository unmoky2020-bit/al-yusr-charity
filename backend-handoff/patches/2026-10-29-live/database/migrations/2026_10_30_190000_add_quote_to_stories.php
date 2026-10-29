<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The short story (about two lines) shown in the home section «أثرنا في حياة أسرة».
 * The dashboard already had the field («القصة القصيرة»); without a column it was dropped on save.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stories', function (Blueprint $table) {
            $table->string('quote_ar', 300)->nullable()->after('title_en');
            $table->string('quote_en', 300)->nullable()->after('quote_ar');
        });
    }

    public function down(): void
    {
        Schema::table('stories', function (Blueprint $table) {
            $table->dropColumn(['quote_ar', 'quote_en']);
        });
    }
};
