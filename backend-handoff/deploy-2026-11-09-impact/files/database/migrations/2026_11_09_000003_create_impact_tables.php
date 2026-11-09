<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Impact & transparency (9 Nov 2026):
 *  - case_items      what a case needs, what each line cost, its receipt and delivery photo
 *  - case_followers  the team member who follows a case
 *  - case_outcomes   how a case ended (done / cancelled / money moved), with before & after photos
 *  - distributions   a distribution day that moved many paid donations one step at once
 *    (+ distribution_donation, which donations it covered)
 * New tables only; nothing existing is altered.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('case_items')) {
            Schema::create('case_items', function (Blueprint $t) {
                $t->id();
                $t->foreignId('case_id')->constrained('case_models')->cascadeOnDelete();
                $t->string('title', 200);
                $t->unsignedInteger('quantity')->default(1);
                $t->decimal('estimated_cost', 12, 2)->default(0);
                $t->decimal('actual_cost', 12, 2)->nullable();
                $t->string('status', 20)->default('planned');
                $t->string('receipt_url', 2048)->nullable();
                $t->string('photo_url', 2048)->nullable();
                $t->string('note', 500)->nullable();
                $t->date('purchased_on')->nullable();
                $t->date('delivered_on')->nullable();
                $t->unsignedInteger('sort_order')->default(0);
                $t->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $t->timestamps();
                $t->index(['case_id', 'sort_order']);
            });
        }

        if (! Schema::hasTable('case_followers')) {
            Schema::create('case_followers', function (Blueprint $t) {
                $t->id();
                $t->foreignId('case_id')->unique()->constrained('case_models')->cascadeOnDelete();
                $t->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $t->foreignId('assigned_by')->nullable()->constrained('users')->nullOnDelete();
                $t->string('note', 300)->nullable();
                $t->timestamps();
            });
        }

        if (! Schema::hasTable('case_outcomes')) {
            Schema::create('case_outcomes', function (Blueprint $t) {
                $t->id();
                $t->foreignId('case_id')->unique()->constrained('case_models')->cascadeOnDelete();
                $t->string('result', 20);
                $t->text('summary');
                $t->string('before_url', 2048)->nullable();
                $t->string('after_url', 2048)->nullable();
                $t->string('transfer_note', 500)->nullable();
                $t->date('completed_on')->nullable();
                $t->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $t->timestamps();
            });
        }

        if (! Schema::hasTable('distributions')) {
            Schema::create('distributions', function (Blueprint $t) {
                $t->id();
                $t->string('client_key', 64)->nullable()->unique();
                $t->string('title', 200);
                $t->date('happened_on');
                $t->string('governorate', 80)->nullable();
                $t->string('city', 80)->nullable();
                $t->string('stage', 20);
                $t->text('note')->nullable();
                $t->longText('photos')->nullable();
                $t->unsignedInteger('families_count')->default(0);
                $t->string('target_kind', 20)->nullable();
                $t->unsignedBigInteger('target_id')->nullable();
                $t->unsignedInteger('donations_count')->default(0);
                $t->boolean('is_public')->default(true);
                $t->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $t->timestamps();
                $t->index(['target_kind', 'target_id']);
                $t->index('happened_on');
            });
        }

        if (! Schema::hasTable('distribution_donation')) {
            Schema::create('distribution_donation', function (Blueprint $t) {
                $t->foreignId('distribution_id')->constrained('distributions')->cascadeOnDelete();
                $t->foreignId('donation_id')->constrained('donations')->cascadeOnDelete();
                $t->primary(['distribution_id', 'donation_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('distribution_donation');
        Schema::dropIfExists('distributions');
        Schema::dropIfExists('case_outcomes');
        Schema::dropIfExists('case_followers');
        Schema::dropIfExists('case_items');
    }
};
