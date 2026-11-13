<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Original email/phone of deleted accounts that gave them up for a new sign-up (App\Support\IdentityRelease). */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('released_identities', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('user_id')->index();
            $t->string('email')->nullable();
            $t->string('phone')->nullable();
            $t->timestamp('released_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('released_identities');
    }
};
