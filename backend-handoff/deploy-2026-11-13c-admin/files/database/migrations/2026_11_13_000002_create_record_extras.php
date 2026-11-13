<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Fields the dashboard edits that the other developer's tables don't have yet
 * (projects: ai_summary_ar/en, ai_faq_ar/en). Kept beside the record, never inside its table.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('record_extras')) {
            Schema::create('record_extras', function (Blueprint $t) {
                $t->id();
                $t->string('owner_type', 30);
                $t->unsignedBigInteger('owner_id');
                $t->json('data');
                $t->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
                $t->timestamps();
                $t->unique(['owner_type', 'owner_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('record_extras');
    }
};
