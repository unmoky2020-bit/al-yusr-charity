<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** One row per backup: requested from the dashboard or made by the schedule (App\Support\Backup\BackupRunner). */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('backup_runs', function (Blueprint $t) {
            $t->id();
            $t->string('kind', 10)->default('db');        // db = database only, full = database + uploaded files
            $t->string('status', 12)->default('requested'); // requested, running, done, failed
            $t->string('trigger', 12)->default('schedule'); // schedule, dashboard, deploy
            $t->string('file')->nullable();                 // name inside storage/app/backups
            $t->unsignedBigInteger('size')->nullable();
            $t->json('summary')->nullable();                // tables, rows, files
            $t->text('error')->nullable();
            $t->unsignedBigInteger('requested_by')->nullable();
            $t->timestamp('started_at')->nullable();
            $t->timestamp('finished_at')->nullable();
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('backup_runs');
    }
};
