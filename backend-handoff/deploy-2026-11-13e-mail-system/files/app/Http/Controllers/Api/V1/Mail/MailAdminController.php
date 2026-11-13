<?php

namespace App\Http\Controllers\Api\V1\Mail;

use App\Http\Controllers\Controller;
use App\Support\Mail\MailOutbox;
use App\Support\Mail\MailRenderer;
use App\Support\Mail\MailSettings;
use App\Support\Mail\MailTemplates;
use App\Support\Mail\MisbahaMail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Dashboard → «مركز البريد»:
 *   GET  /admin/mail/overview                    budget, queue, automations, subscribers, cron
 *   GET  /admin/mail/log?status=&kind=&q=        every email (no content)
 *   GET  /admin/mail/log/{id}/preview            what that email looked like (HTML)
 *   POST /admin/mail/log/{id}/retry | /cancel
 *   POST /admin/mail/pump                        send what is due now
 *   PUT  /admin/mail/settings                    automations on/off, daily limit, reserve
 *   GET  /admin/mail/templates/{kind}/preview    sample of an automatic email (HTML)
 *   POST /admin/mail/templates/{kind}/test       {email}  send the sample to yourself
 *   POST /admin/mail/preview                     {title, preheader, eyebrow, hero, items} → HTML (editor live preview)
 *   GET  /admin/mail/misbaha-subscriptions       followers of shared misbahas
 *   DELETE /admin/mail/misbaha-subscriptions/{id}
 */
class MailAdminController extends Controller
{
    public function overview(): JsonResponse
    {
        MailOutbox::finishCampaigns();
        $byStatus = DB::table('mail_outbox')->select('status', DB::raw('count(*) c'))->groupBy('status')->pluck('c', 'status');
        $queuedByKind = DB::table('mail_outbox')->where('status', 'queued')->select('kind', DB::raw('count(*) c'))->groupBy('kind')->pluck('c', 'kind');
        $last7 = DB::table('mail_outbox')->where('status', 'sent')->where('sent_at', '>=', now()->subDays(7))
            ->selectRaw("DATE(sent_at) d, COUNT(*) c, SUM(opened_at IS NOT NULL) o, SUM(clicked_at IS NOT NULL) k")->groupBy('d')->orderBy('d')->get();
        $lastCron = Cache::get('mail-cron-last');
        $lastPump = Cache::get('mail-pump-last');
        $nl = DB::table('newsletter_subscribers')->select('status', DB::raw('count(*) c'))->groupBy('status')->pluck('c', 'status');

        return response()->json(['data' => [
            'mailer' => config('mail.default'),
            'ready' => MailOutbox::mailerReady(),
            'from' => config('mail.from.address'),
            'reply_to' => \App\Support\BrandMail::REPLY_TO,
            'budget' => MailOutbox::budget(),
            'by_status' => $byStatus,
            'queued_by_kind' => $queuedByKind,
            'last7' => $last7,
            'cron' => ['last_run' => $lastCron, 'ok' => $lastCron && now()->diffInMinutes(\Carbon\Carbon::parse($lastCron), true) <= 5],
            'last_pump' => $lastPump,
            'settings' => MailSettings::all(),
            'kinds' => MailOutbox::KIND_LABELS,
            'newsletter' => ['confirmed' => (int) ($nl['confirmed'] ?? 0), 'pending' => (int) ($nl['pending'] ?? 0), 'unsubscribed' => (int) ($nl['unsubscribed'] ?? 0)],
            'misbaha' => [
                'active' => DB::table('misbaha_mail_subscriptions')->whereNotNull('confirmed_at')->whereNull('unsubscribed_at')->count(),
                'pending' => DB::table('misbaha_mail_subscriptions')->whereNull('confirmed_at')->whereNull('unsubscribed_at')->count(),
            ],
        ]]);
    }

    public function log(Request $request): JsonResponse
    {
        $q = DB::table('mail_outbox')->select('id', 'to_email', 'kind', 'subject', 'status', 'attempts', 'error', 'campaign_id', 'send_after', 'sent_at', 'opened_at', 'clicked_at', 'created_at', DB::raw('payload IS NOT NULL as has_preview'));
        if ($s = $request->query('status')) {
            $q->where('status', $s);
        }
        if ($k = $request->query('kind')) {
            $q->where('kind', $k);
        }
        if ($c = $request->query('campaign_id')) {
            $q->where('campaign_id', (int) $c);
        }
        if ($term = trim((string) $request->query('q', ''))) {
            $q->where(fn ($w) => $w->where('to_email', 'like', "%{$term}%")->orWhere('subject', 'like', "%{$term}%"));
        }

        return response()->json($q->orderByDesc('id')->paginate(min(100, max(10, (int) $request->query('per_page', 30)))));
    }

    public function logPreview(int $id)
    {
        $row = DB::table('mail_outbox')->find($id);
        abort_unless($row && $row->payload, 404, 'الرسالة دي ما اتحفظش محتواها (الرموز مش بتتحفظ).');
        $data = json_decode($row->payload, true) ?: [];
        unset($data['track']);

        return $this->html(MailRenderer::render($data)['html']);
    }

    public function retry(int $id): JsonResponse
    {
        $n = DB::table('mail_outbox')->where('id', $id)->whereIn('status', ['failed', 'cancelled'])->whereNotNull('payload')
            ->update(['status' => 'queued', 'attempts' => 0, 'send_after' => null, 'error' => null, 'updated_at' => now()]);

        return response()->json(['message' => $n ? 'رجعت للطابور' : 'مينفعش تتعاد'], $n ? 200 : 422);
    }

    public function cancel(int $id): JsonResponse
    {
        $n = DB::table('mail_outbox')->where('id', $id)->where('status', 'queued')->update(['status' => 'cancelled', 'updated_at' => now()]);

        return response()->json(['message' => $n ? 'اتلغت' : 'مش في الطابور'], $n ? 200 : 422);
    }

    public function pump(): JsonResponse
    {
        if (! MailOutbox::mailerReady()) {
            return response()->json(['message' => 'الإيميل مش متظبط على السيرفر.'], 422);
        }
        @set_time_limit(120);
        \App\Http\Controllers\Api\V1\Newsletter\NewsletterCampaignController::dispatchDue();
        MisbahaMail::due();
        [$sent, $failed] = MailOutbox::pump(15);

        return response()->json(['message' => "اتبعت {$sent}" . ($failed ? " — فشل {$failed}" : ''), 'data' => ['sent' => $sent, 'failed' => $failed, 'budget' => MailOutbox::budget()]]);
    }

    public function settings(Request $request): JsonResponse
    {
        $data = $request->validate([
            'daily_limit' => ['sometimes', 'integer', 'min:1', 'max:2000'],
            'reserve' => ['sometimes', 'integer', 'min:0', 'max:1999'],
            ...collect(MailSettings::DEFAULTS)->filter(fn ($v) => is_bool($v))->keys()->mapWithKeys(fn ($k) => [$k => ['sometimes', 'boolean']])->all(),
        ]);

        return response()->json(['message' => 'اتحفظ', 'data' => MailSettings::save($data)]);
    }

    public function templatePreview(string $kind)
    {
        $t = MailTemplates::sample($kind);
        abort_unless($t, 404, 'النوع ده مش موجود.');

        return $this->html(MailRenderer::render($t[1])['html']);
    }

    public function templateTest(Request $request, string $kind): JsonResponse
    {
        $data = $request->validate(['email' => ['required', 'email', 'max:190']], ['email.*' => 'اكتب بريد صحيح.']);
        $t = MailTemplates::sample($kind);
        abort_unless($t, 404, 'النوع ده مش موجود.');
        try {
            MailOutbox::sendNow($data['email'], '[تجربة] ' . $t[0], $t[1], 'test');
        } catch (\Throwable $e) {
            return response()->json(['message' => 'تعذر الإرسال: ' . $e->getMessage()], 502);
        }

        return response()->json(['message' => 'اتبعتت تجربة لـ ' . $data['email']]);
    }

    public function preview(Request $request)
    {
        $d = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'preheader' => ['nullable', 'string', 'max:255'],
            'eyebrow' => ['nullable', 'string', 'max:120'],
            'hero' => ['nullable', 'array'],
            'items' => ['nullable', 'array', 'max:60'],
        ]);

        return $this->html(MailRenderer::render([
            'title' => $d['title'] ?? 'عنوان الرسالة',
            'preheader' => $d['preheader'] ?? null,
            'eyebrow' => $d['eyebrow'] ?? 'نشرة اليسر',
            'hero' => $d['hero'] ?? null,
            'blocks' => $d['items'] ?? [],
            'reason' => 'وصلتك الرسالة دي لأنك مشترك في نشرة مؤسسة اليسر الخيرية.',
            'unsubscribe' => MailRenderer::site() . '/newsletter/unsubscribe?token=preview',
        ])['html']);
    }

    public function misbahaSubscriptions(Request $request): JsonResponse
    {
        $rows = DB::table('misbaha_mail_subscriptions as s')->leftJoin('misbaha_rooms as r', 'r.id', '=', 's.misbaha_room_id')
            ->select('s.id', 's.email', 's.name', 's.want_goal', 's.want_weekly', 's.confirmed_at', 's.unsubscribed_at', 's.goal_notified_at', 's.last_weekly_at', 's.created_at', 'r.name as room_name', 'r.slug as room_slug', 'r.total_count', 'r.target_total')
            ->orderByDesc('s.id')->paginate(50);

        return response()->json($rows);
    }

    public function misbahaSubscriptionDestroy(int $id): JsonResponse
    {
        DB::table('misbaha_mail_subscriptions')->where('id', $id)->delete();

        return response()->json(['message' => 'اتمسح']);
    }

    private function html(string $html)
    {
        return response($html, 200, ['Content-Type' => 'text/html; charset=utf-8']);
    }
}
