<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Field-day statuses for volunteer applications: waitlist (قائمة انتظار), attended (حضر), noshow (لم يحضر).
 * Values match the dashboard's status keys.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE volunteer_campaign_applications MODIFY status ENUM('invited','pending','approved','rejected','withdrawn','waitlist','attended','noshow') NOT NULL DEFAULT 'pending'");
    }

    public function down(): void
    {
        DB::table('volunteer_campaign_applications')->whereIn('status', ['attended', 'noshow'])->update(['status' => 'approved']);
        DB::table('volunteer_campaign_applications')->where('status', 'waitlist')->update(['status' => 'pending']);
        DB::statement("ALTER TABLE volunteer_campaign_applications MODIFY status ENUM('invited','pending','approved','rejected','withdrawn') NOT NULL DEFAULT 'pending'");
    }
};
