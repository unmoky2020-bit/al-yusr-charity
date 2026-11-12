<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Extras (13 Nov 2026), new tables only — nothing existing is altered:
 *  - package_images  one picture per donation package (program_donation_packages.id), kept apart
 *                    from the other developer's packages table.
 *  - site_blocks     editable site-wide content the code used to hard-code: the organisation's
 *                    contact data, the About-page milestones, the header / footer links.
 *                    One row per block, its value as JSON.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('package_images')) {
            Schema::create('package_images', function (Blueprint $t) {
                $t->id();
                // No foreign key: the packages table belongs to someone else and may be renamed.
                $t->unsignedBigInteger('package_id')->unique();
                $t->string('image', 2048);
                $t->string('alt_ar', 300)->nullable();
                $t->string('alt_en', 300)->nullable();
                $t->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
                $t->timestamps();
            });
        }

        if (! Schema::hasTable('site_blocks')) {
            Schema::create('site_blocks', function (Blueprint $t) {
                $t->id();
                $t->string('key', 60)->unique();
                $t->json('value');
                $t->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
                $t->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('site_blocks');
        Schema::dropIfExists('package_images');
    }
};
