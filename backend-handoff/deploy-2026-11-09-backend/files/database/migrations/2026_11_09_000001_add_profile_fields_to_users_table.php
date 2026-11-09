<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Profile page (9 Nov 2026): what a person can fill in about themselves, and the confirmed-email
 * date that the email-code endpoints already write when the column exists. Every column is
 * nullable and added only if missing, so the migration is safe to run again.
 */
return new class extends Migration
{
    private const COLUMNS = [
        'email_verified_at' => 'timestamp',
        'bio' => 'text',
        'city' => 'string',
        'governorate' => 'string',
        'job_title' => 'string',
        'preferences' => 'json',
    ];

    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            foreach (self::COLUMNS as $name => $type) {
                if (Schema::hasColumn('users', $name)) {
                    continue;
                }
                match ($type) {
                    'timestamp' => $table->timestamp($name)->nullable(),
                    'text' => $table->text($name)->nullable(),
                    'json' => $table->json($name)->nullable(),
                    default => $table->string($name, 120)->nullable(),
                };
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            foreach (array_keys(self::COLUMNS) as $name) {
                if ($name !== 'email_verified_at' && Schema::hasColumn('users', $name)) {
                    $table->dropColumn($name);
                }
            }
        });
    }
};
