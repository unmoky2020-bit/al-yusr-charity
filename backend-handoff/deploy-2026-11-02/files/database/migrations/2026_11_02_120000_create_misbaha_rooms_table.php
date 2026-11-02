<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Shared misbaha (/misbaha/{slug} on the site): for someone who passed away, someone sick, or a group. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('misbaha_rooms', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 24)->unique();
            $table->string('kind', 12)->default('deceased');   // deceased | sick | group
            $table->string('gender', 1)->nullable();            // m | f (so the duas read «له» / «لها»)
            $table->string('name', 80);                 // the person (or the group's title)
            $table->string('created_by', 60)->nullable();
            $table->unsignedBigInteger('total_count')->default(0);
            $table->unsignedBigInteger('target_total')->nullable();   // optional shared goal (1,000 / 10,000 / 100,000)
            $table->string('dhikr_id', 40)->nullable();               // optional suggested dhikr (ids from the site's adhkar list)
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
