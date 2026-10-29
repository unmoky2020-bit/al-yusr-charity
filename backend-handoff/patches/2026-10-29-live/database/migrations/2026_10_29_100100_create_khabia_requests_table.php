<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('khabia_requests', function (Blueprint $table) {
            $table->id();
            $table->string('ref_code', 20)->unique();
            $table->string('full_name', 80);
            $table->string('phone', 11);
            $table->string('city', 60);
            $table->string('address', 200)->nullable();
            $table->enum('status', ['pending', 'scheduled', 'delivered', 'collected', 'cancelled'])->default('pending');
            $table->timestamp('scheduled_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamp('collected_at')->nullable();
            $table->decimal('amount_collected', 12, 2)->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('assigned_delegate_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('delivery_proof_path')->nullable();
            $table->string('collection_proof_path')->nullable();
            $table->string('source', 60)->nullable();
            $table->string('user_agent', 255)->nullable();
            $table->ipAddress('ip')->nullable();
            $table->timestamps();
            $table->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('khabia_requests');
    }
};
