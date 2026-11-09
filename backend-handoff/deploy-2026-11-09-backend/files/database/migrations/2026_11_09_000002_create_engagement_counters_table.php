<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Daily click / view counters of the homepage strips (EngagementController). No visitor data. */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('engagement_counters')) {
            return;
        }
        Schema::create('engagement_counters', function (Blueprint $table) {
            $table->id();
            $table->string('scope', 40);
            $table->string('slug', 120);
            $table->string('kind', 30);
            $table->date('day');
            $table->unsignedInteger('count')->default(0);
            $table->unique(['scope', 'slug', 'kind', 'day'], 'engagement_counters_unique');
            $table->index(['scope', 'day']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('engagement_counters');
    }
};
