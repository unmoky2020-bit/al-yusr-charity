<?php

namespace App\Support\Mail;

use App\Support\BrandMail;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

/**
 * Every email the site sends goes through here.
 *
 *   MailOutbox::queue($to, $subject, $data, kind: 'receipt', priority: 2, dedupe: "receipt:42")
 *       → a row in mail_outbox; the pump sends it within the daily limit.
 *   MailOutbox::sendNow(...)  → codes and tests: sent at once, logged as sent.
 *   MailOutbox::pump(10)      → sends what is due. Runs every minute from the scheduler, and a few
 *                               at a time after web requests (so mail still moves if cron stops).
 *
 * Daily budget (MailSettings): daily_limit in any 24 hours. Bulk kinds (newsletter, weekly
 * digests) stop at daily_limit − reserve so codes and receipts always have room.
 */
final class MailOutbox
{
    public const BULK = ['newsletter', 'misbaha_weekly'];

    public const KIND_LABELS = [
        'code' => 'رمز تأكيد/استعادة',
        'welcome' => 'ترحيب',
        'receipt' => 'إيصال تبرع',
        'delivery' => 'رحلة التبرع',
        'failed' => 'تبرع لم يكتمل',
        'case_update' => 'تحديث حالة',
        'volunteer' => 'طلب تطوع',
        'newsletter' => 'نشرة بريدية',
        'newsletter_confirm' => 'تأكيد اشتراك النشرة',
        'misbaha_goal' => 'المسبحة وصلت الهدف',
        'misbaha_weekly' => 'ملخص المسبحة الأسبوعي',
        'misbaha_confirm' => 'اشتراك المسبحة',
        'test' => 'تجربة',
    ];

    /** Set when this request queued something that should not wait (confirmations, receipts). */
    public static bool $urgent = false;

    public static function mailerReady(): bool
    {
        return ! in_array(config('mail.default'), ['log', 'array', null], true);
    }

    /** Queue one email. Returns the row id, or null when it was a duplicate / invalid. */
    public static function queue(string $to, string $subject, array $data, string $kind, int $priority = 5, ?string $dedupe = null, array $extra = []): ?int
    {
        $to = Str::lower(trim($to));
        if (! filter_var($to, FILTER_VALIDATE_EMAIL) || self::undeliverable($to)) {
            return null;
        }
        if ($dedupe && DB::table('mail_outbox')->where('dedupe_key', $dedupe)->exists()) {
            return null;
        }
        if ($priority <= 2) {
            self::$urgent = true;
        }
        try {
            return DB::table('mail_outbox')->insertGetId([
                'token' => Str::random(32),
                'to_email' => $to,
                'kind' => $kind,
                'priority' => max(1, min(9, $priority)),
                'subject' => Str::limit($subject, 250, ''),
                'payload' => json_encode($data, JSON_UNESCAPED_UNICODE),
                'status' => 'queued',
                'dedupe_key' => $dedupe,
                'campaign_id' => $extra['campaign_id'] ?? null,
                'ref_type' => $extra['ref_type'] ?? null,
                'ref_id' => $extra['ref_id'] ?? null,
                'send_after' => $extra['send_after'] ?? null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } catch (\Illuminate\Database\QueryException $e) {
            return null; // unique dedupe_key raced
        }
    }

    /** Test and placeholder addresses never get mail (they only bounce and hurt the mailbox's reputation). */
    public static function undeliverable(string $email): bool
    {
        return (bool) preg_match('/@(example\.(com|org|net)|test\.com|.*\.(test|invalid|local|example))$/i', $email);
    }

    /** Send at once (codes, tests) and log it. Throws when the mail server refuses. */
    public static function sendNow(string $to, string $subject, array $data, string $kind = 'code', bool $track = false): void
    {
        $token = Str::random(32);
        $id = null;
        try {
            $id = DB::table('mail_outbox')->insertGetId([
                'token' => $token, 'to_email' => Str::lower(trim($to)), 'kind' => $kind, 'priority' => 1,
                'subject' => Str::limit($subject, 250, ''), 'payload' => null, 'status' => 'sending',
                'attempts' => 1, 'created_at' => now(), 'updated_at' => now(),
            ]);
        } catch (\Throwable $e) {
            report($e); // logging must never block a code
        }
        try {
            try {
                self::deliver($to, $subject, $data + ($track ? ['track' => $token] : []));
            } catch (\Symfony\Component\Mailer\Exception\TransportExceptionInterface $first) {
                // The SMTP server sometimes drops the first connection: one quick retry, so a code still arrives.
                usleep(800000);
                app('mail.manager')->forgetMailers();
                self::deliver($to, $subject, $data + ($track ? ['track' => $token] : []));
            }
            if ($id) {
                DB::table('mail_outbox')->where('id', $id)->update(['status' => 'sent', 'sent_at' => now(), 'updated_at' => now()]);
            }
        } catch (\Throwable $e) {
            if ($id) {
                DB::table('mail_outbox')->where('id', $id)->update(['status' => 'failed', 'error' => Str::limit($e->getMessage(), 500), 'updated_at' => now()]);
            }
            throw $e;
        }
    }

    /** The actual SMTP call: HTML + text, Reply-To support@, List-Unsubscribe when there is a link. */
    public static function deliver(string $to, string $subject, array $data): void
    {
        $r = MailRenderer::render($data);
        $unsub = $r['data']['unsubscribe'];
        $oneClick = $data['one_click'] ?? null;
        Mail::send([], [], function ($m) use ($to, $subject, $r, $unsub, $oneClick) {
            $m->to($to)->subject($subject)->html($r['html'])->text($r['text']);
            $m->replyTo(BrandMail::REPLY_TO, 'دعم مؤسسة اليسر');
            if ($unsub) {
                $h = $m->getHeaders();
                $h->addTextHeader('List-Unsubscribe', '<' . ($oneClick ?: $unsub) . '>, <mailto:' . BrandMail::REPLY_TO . '?subject=unsubscribe>');
                if ($oneClick) {
                    $h->addTextHeader('List-Unsubscribe-Post', 'List-Unsubscribe=One-Click');
                }
            }
        });
    }

    /* ───────────── budget ───────────── */

    public static function sentLast24h(): int
    {
        return DB::table('mail_outbox')->where('status', 'sent')->where('sent_at', '>=', now()->subDay())->count();
    }

    public static function budget(): array
    {
        $limit = (int) MailSettings::get('daily_limit');
        $reserve = (int) MailSettings::get('reserve');
        $sent = self::sentLast24h();

        return [
            'limit' => $limit,
            'reserve' => $reserve,
            'sent_24h' => $sent,
            'left' => max(0, $limit - $sent),
            'left_bulk' => max(0, $limit - $reserve - $sent),
        ];
    }

    /* ───────────── pump ───────────── */

    /** Send up to $max due emails. Returns [sent, failed]. Only one pump runs at a time. */
    public static function pump(int $max = 20): array
    {
        if (! self::mailerReady()) {
            return [0, 0];
        }
        $lock = Cache::lock('mail-outbox-pump', 120);
        if (! $lock->get()) {
            return [0, 0];
        }
        $sent = 0;
        $failed = 0;
        try {
            Cache::put('mail-pump-last', now()->toIso8601String(), 86400 * 7);
            // A row stuck in "sending" (process killed mid-send) goes back to the queue after 10 minutes.
            DB::table('mail_outbox')->where('status', 'sending')->whereNotNull('payload')->where('updated_at', '<', now()->subMinutes(10))
                ->update(['status' => 'queued', 'updated_at' => now()]);

            $b = self::budget();
            $max = min($max, $b['left']);
            if ($max <= 0) {
                return [0, 0];
            }
            $rows = DB::table('mail_outbox')->where('status', 'queued')
                ->where(fn ($q) => $q->whereNull('send_after')->orWhere('send_after', '<=', now()))
                ->orderBy('priority')->orderBy('id')->limit($max)->get();

            $bulkLeft = $b['left_bulk'];
            foreach ($rows as $row) {
                $isBulk = in_array($row->kind, self::BULK, true);
                if ($isBulk && $bulkLeft <= 0) {
                    continue;
                }
                $claimed = DB::table('mail_outbox')->where('id', $row->id)->where('status', 'queued')
                    ->update(['status' => 'sending', 'attempts' => DB::raw('attempts + 1'), 'updated_at' => now()]);
                if (! $claimed) {
                    continue;
                }
                $data = json_decode((string) $row->payload, true) ?: [];
                if (MailSettings::on('track') && in_array($row->kind, ['newsletter', 'misbaha_weekly', 'misbaha_goal', 'delivery', 'receipt', 'welcome'], true)) {
                    $data['track'] = $row->token;
                }
                try {
                    self::deliver($row->to_email, $row->subject, $data);
                    DB::table('mail_outbox')->where('id', $row->id)->update(['status' => 'sent', 'sent_at' => now(), 'error' => null, 'updated_at' => now()]);
                    $sent++;
                    if ($isBulk) {
                        $bulkLeft--;
                    }
                } catch (\Throwable $e) {
                    $failed++;
                    $msg = Str::limit($e->getMessage(), 500);
                    Log::warning('mail outbox send failed', ['id' => $row->id, 'error' => $msg]);
                    // Daily quota reached on the provider side: stop this run, retry later.
                    $quota = (bool) preg_match('/(quota|limit|too many|rate|451|452|421|550 5\.4\.6)/i', $msg);
                    DB::table('mail_outbox')->where('id', $row->id)->update([
                        'status' => $row->attempts + 1 >= 4 && ! $quota ? 'failed' : 'queued',
                        'send_after' => now()->addMinutes($quota ? 60 : 10 * ($row->attempts + 1)),
                        'error' => $msg,
                        'updated_at' => now(),
                    ]);
                    if ($quota) {
                        break;
                    }
                }
            }
            self::finishCampaigns();
        } finally {
            $lock->release();
        }

        return [$sent, $failed];
    }

    /** A campaign is "sent" once none of its rows are waiting; its counters come from the outbox. */
    public static function finishCampaigns(): void
    {
        $ids = DB::table('newsletter_campaigns')->where('status', 'sending')->pluck('id');
        foreach ($ids as $id) {
            $c = DB::table('mail_outbox')->where('campaign_id', $id)
                ->selectRaw("SUM(status='sent') s, SUM(status='failed') f, SUM(status IN ('queued','sending')) q, SUM(opened_at IS NOT NULL) o, SUM(clicked_at IS NOT NULL) k, COUNT(*) n")->first();
            $update = ['sent_count' => (int) $c->s, 'failed_count' => (int) $c->f, 'queued_count' => (int) $c->q, 'opened_count' => (int) $c->o, 'clicked_count' => (int) $c->k, 'updated_at' => now()];
            if ((int) $c->q === 0) {
                $update['status'] = (int) $c->s > 0 || (int) $c->n === 0 ? 'sent' : 'failed';
                $update['sent_at'] = now();
            }
            DB::table('newsletter_campaigns')->where('id', $id)->update($update);
        }
    }

    /** Small pump after a web response has gone out, at most once every 45 seconds. */
    public static function tickAfterRequest(): void
    {
        try {
            if (! self::mailerReady() || ! Cache::add('mail-tick', 1, 45)) {
                return;
            }
            if (! DB::table('mail_outbox')->where('status', 'queued')->where(fn ($q) => $q->whereNull('send_after')->orWhere('send_after', '<=', now()))->exists()) {
                return;
            }
            @set_time_limit(60);
            self::pump(4);
        } catch (\Throwable $e) {
            report($e);
        }
    }
}
