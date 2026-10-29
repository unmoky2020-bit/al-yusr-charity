<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Case updates, media and documents. The public timeline is computed, so it has no table. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('case_updates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('case_id')->constrained('case_models')->cascadeOnDelete();
            $table->text('body');
            $table->string('image_url', 2048)->nullable();
            $table->foreignId('author_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index(['case_id', 'created_at']);
        });

        Schema::create('case_media', function (Blueprint $table) {
            $table->id();
            $table->foreignId('case_id')->constrained('case_models')->cascadeOnDelete();
            $table->string('url', 2048);
            $table->enum('kind', ['before', 'during', 'after', 'report', 'other'])->default('other');
            $table->string('caption_ar', 300)->nullable();
            $table->string('caption_en', 300)->nullable();
            $table->boolean('is_public')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index(['case_id', 'sort_order']);
        });

        Schema::create('case_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('case_id')->constrained('case_models')->cascadeOnDelete();
            $table->string('url', 2048);
            $table->string('doc_type', 40)->default('other');
            $table->string('caption', 300)->nullable();
            $table->boolean('is_public')->default(false);
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('case_documents');
        Schema::dropIfExists('case_media');
        Schema::dropIfExists('case_updates');
    }
};
