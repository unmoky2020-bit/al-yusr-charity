<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Shared misbaha for someone who passed away (/misbaha/{slug} on the site). */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('misbaha_rooms', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 24)->unique();
            $table->string('name', 80);                 // the deceased
            $table->string('created_by', 60)->nullable();
            $table->unsignedBigInteger('total_count')->default(0);
            $table->boolean('is_hidden')->default(false); // team can hide abusive / mistaken rooms
            $table->string('creator_ip_hash', 64)->nullable();
            $table->timestamp('last_activity_at')->nullable()->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('misbaha_rooms');
    }
};
