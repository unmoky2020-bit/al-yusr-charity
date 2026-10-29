<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contact_messages', function (Blueprint $table) {
            $table->id();
            $table->string('ref_code', 20)->unique();
            $table->string('name', 100);
            $table->string('email', 255);
            $table->string('phone', 20)->nullable();
            $table->string('section', 40)->default('general');
            $table->text('message');
            $table->string('source', 60)->nullable();
            $table->string('user_agent', 255)->nullable();
            $table->ipAddress('ip')->nullable();
            $table->enum('status', ['new', 'read', 'replied', 'archived'])->default('new');
            $table->timestamp('replied_at')->nullable();
            $table->foreignId('handled_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contact_messages');
    }
};
