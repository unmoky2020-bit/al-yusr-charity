<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The email system (13 Nov 2026):
 *  - mail_outbox: every email the site sends or will send. One row per recipient. The pump sends
 *    queued rows within the mailbox's daily limit; codes go out at once and are logged here too.
 *  - misbaha_mail_subscriptions: people who asked to hear about a shared misbaha (goal reached, weekly).
 *  - newsletter_campaigns gets editor blocks and a queued counter.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mail_outbox', function (Blueprint $t) {
            $t->id();
            $t->string('token', 40)->unique();
            $t->string('to_email', 190)->index();
            $t->string('kind', 40)->index();           // code, welcome, receipt, delivery, volunteer, newsletter, newsletter_confirm, misbaha_goal, misbaha_weekly, test
            $t->unsignedTinyInteger('priority')->default(5); // 1 first … 9 last
            $t->string('subject');
            $t->json('payload')->nullable();             // BrandMail data
            $t->string('status', 16)->default('queued')->index(); // queued, sending, sent, failed, cancelled, skipped
            $t->unsignedTinyInteger('attempts')->default(0);
            $t->text('error')->nullable();
            $t->string('dedupe_key', 120)->nullable()->unique();
            $t->unsignedBigInteger('campaign_id')->nullable()->index();
            $t->string('ref_type', 40)->nullable();
            $t->unsignedBigInteger('ref_id')->nullable();
            $t->timestamp('send_after')->nullable();
            $t->timestamp('sent_at')->nullable()->index();
            $t->timestamp('opened_at')->nullable();
            $t->timestamp('clicked_at')->nullable();
            $t->timestamps();
        });

        Schema::create('misbaha_mail_subscriptions', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('misbaha_room_id')->index();
            $t->string('email', 190);
            $t->string('name', 120)->nullable();
            $t->boolean('want_goal')->default(true);
            $t->boolean('want_weekly')->default(true);
            $t->string('token', 64)->unique();
            $t->timestamp('confirmed_at')->nullable();
            $t->timestamp('goal_notified_at')->nullable();
            $t->timestamp('last_weekly_at')->nullable();
            $t->unsignedBigInteger('last_weekly_total')->nullable();
            $t->timestamp('unsubscribed_at')->nullable();
            $t->timestamps();
            $t->unique(['misbaha_room_id', 'email']);
        });

        Schema::table('newsletter_campaigns', function (Blueprint $t) {
            if (! Schema::hasColumn('newsletter_campaigns', 'blocks')) {
                $t->longText('blocks')->nullable()->after('html');
            }
            if (! Schema::hasColumn('newsletter_campaigns', 'queued_count')) {
                $t->unsignedInteger('queued_count')->default(0)->after('recipients_count');
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mail_outbox');
        Schema::dropIfExists('misbaha_mail_subscriptions');
        Schema::table('newsletter_campaigns', function (Blueprint $t) {
            foreach (['blocks', 'queued_count'] as $c) {
                if (Schema::hasColumn('newsletter_campaigns', $c)) {
                    $t->dropColumn($c);
                }
            }
        });
    }
};
