<?php

namespace App\Http\Controllers\Api\V1\Newsletter;

use App\Http\Controllers\Controller;
use App\Models\NewsletterCampaign;
use App\Models\NewsletterSubscriber;
use App\Support\Mail\MailOutbox;
use App\Support\Mail\MailRenderer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Newsletter campaigns (staff), built from blocks in the dashboard editor:
 *   GET/POST /newsletter-campaigns, GET/PUT/DELETE /newsletter-campaigns/{id}
 *   GET  /newsletter-campaigns/{id}/preview            the email as subscribers will see it (HTML)
 *   POST /newsletter-campaigns/{id}/send-test {email}  one copy now, marked [تجربة]
 *   POST /newsletter-campaigns/{id}/send {at?}         queue one email per confirmed subscriber (now or at `at`)
 *   POST /newsletter-campaigns/{id}/cancel             stop what hasn't gone out yet
 *   POST /newsletter-campaigns/{id}/duplicate          a new draft with the same content
 * Sending goes through mail_outbox in batches under the mailbox's daily limit (MailOutbox::pump).
 * `blocks` = { hero?, eyebrow?, items: [ {type…} ] } — see MailRenderer. Old campaigns with only
 * `html` still work (rendered inside the same design).
 */
class NewsletterCampaignController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        MailOutbox::finishCampaigns();
        $perPage = min(200, max(1, (int) $request->input('per_page', 50)));
        $page = NewsletterCampaign::query()->latest()->paginate($perPage);
        $page->getCollection()->transform(fn ($c) => $this->present($c));

        return response()->json($page);
    }

    public function show(NewsletterCampaign $newsletterCampaign): JsonResponse
    {
        return response()->json(['data' => $this->present($newsletterCampaign)]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $campaign = NewsletterCampaign::create($data + ['created_by' => $request->user()?->id]);

        return response()->json(['data' => $this->present($campaign)], 201);
    }

    public function update(Request $request, NewsletterCampaign $newsletterCampaign): JsonResponse
    {
        if ($newsletterCampaign->isLocked()) {
            return response()->json(['message' => 'الحملة اتبعتت بالفعل ومينفعش تتعدل. اعمل منها نسخة جديدة.'], 422);
        }
        $newsletterCampaign->update($this->validated($request, partial: true));

        return response()->json(['data' => $this->present($newsletterCampaign->fresh())]);
    }

    public function destroy(NewsletterCampaign $newsletterCampaign): JsonResponse
    {
        if ($newsletterCampaign->status === 'sending') {
            return response()->json(['message' => 'الحملة بتتبعت دلوقتي. أوقفها الأول.'], 422);
        }
        DB::table('mail_outbox')->where('campaign_id', $newsletterCampaign->id)->where('status', 'queued')->update(['status' => 'cancelled', 'updated_at' => now()]);
        $newsletterCampaign->delete();

        return response()->json(['message' => 'تم الحذف']);
    }

    public function duplicate(NewsletterCampaign $newsletterCampaign): JsonResponse
    {
        $copy = $newsletterCampaign->replicate(['status', 'sent_at', 'scheduled_at', 'recipients_count', 'queued_count', 'sent_count', 'failed_count', 'opened_count', 'clicked_count']);
        $copy->subject = 'نسخة — ' . $newsletterCampaign->subject;
        $copy->status = 'draft';
        $copy->save();

        return response()->json(['data' => $this->present($copy)], 201);
    }

    public function preview(NewsletterCampaign $newsletterCampaign)
    {
        $html = MailRenderer::render($this->mailData($newsletterCampaign, MailRenderer::site() . '/newsletter/unsubscribe?token=preview'))['html'];

        return response($html, 200, ['Content-Type' => 'text/html; charset=utf-8', 'X-Frame-Options' => 'SAMEORIGIN']);
    }

    public function sendTest(Request $request, NewsletterCampaign $newsletterCampaign): JsonResponse
    {
        $data = $request->validate(['email' => ['required', 'email', 'max:255']], ['email.*' => 'اكتب بريد صحيح.']);
        if (! MailOutbox::mailerReady()) {
            return response()->json(['message' => 'الإيميل مش متظبط على السيرفر.'], 422);
        }
        try {
            MailOutbox::sendNow($data['email'], '[تجربة] ' . $newsletterCampaign->subject, $this->mailData($newsletterCampaign, MailRenderer::site() . '/newsletter/unsubscribe?token=test'), 'test');
        } catch (\Throwable $e) {
            Log::warning('Newsletter test send failed: ' . $e->getMessage());

            return response()->json(['message' => 'تعذر إرسال النسخة التجريبية: ' . $e->getMessage()], 502);
        }

        return response()->json(['message' => 'اتبعتت نسخة تجريبية لـ ' . $data['email'], 'data' => ['sent' => 1, 'failed' => 0]]);
    }

    public function send(Request $request, NewsletterCampaign $newsletterCampaign): JsonResponse
    {
        $data = $request->validate(['at' => ['nullable', 'date']]);
        if (! MailOutbox::mailerReady()) {
            return response()->json(['message' => 'الإيميل مش متظبط على السيرفر.'], 422);
        }
        if (! empty($data['at']) && now()->lt($data['at'])) {
            if ($newsletterCampaign->isLocked()) {
                return response()->json(['message' => 'الحملة اتبعتت أو بتتبعت بالفعل.'], 422);
            }
            $newsletterCampaign->forceFill(['status' => 'scheduled', 'scheduled_at' => $data['at']])->save();

            return response()->json(['message' => 'اتجدولت', 'data' => ['scheduled' => true, 'campaign' => $this->present($newsletterCampaign)]]);
        }
        $queued = self::dispatch($newsletterCampaign);
        if ($queued === null) {
            return response()->json(['message' => 'الحملة اتبعتت أو بتتبعت بالفعل.'], 422);
        }
        MailOutbox::pump(3);
        MailOutbox::finishCampaigns();
        $b = MailOutbox::budget();
        $perDay = max(1, $b['limit'] - $b['reserve']);

        return response()->json([
            'message' => "اتجهزت لـ {$queued} مشترك" . ($queued > $b['left_bulk'] ? ' — هتتبعت على دفعات (حوالي ' . (int) ceil($queued / $perDay) . ' يوم) علشان حد الإرسال اليومي.' : ''),
            'data' => ['queued' => $queued, 'sent' => 0, 'failed' => 0, 'campaign' => $this->present($newsletterCampaign->fresh())],
        ]);
    }

    public function cancel(NewsletterCampaign $newsletterCampaign): JsonResponse
    {
        $n = DB::table('mail_outbox')->where('campaign_id', $newsletterCampaign->id)->where('status', 'queued')->update(['status' => 'cancelled', 'updated_at' => now()]);
        if ($newsletterCampaign->status === 'scheduled') {
            $newsletterCampaign->forceFill(['status' => 'draft', 'scheduled_at' => null])->save();
        }
        MailOutbox::finishCampaigns();

        return response()->json(['message' => $n ? "اتلغى إرسال {$n} رسالة لسه ما اتبعتتش." : 'مفيش رسايل مستنية.', 'data' => $this->present($newsletterCampaign->fresh())]);
    }

    /** Queue the campaign for every confirmed subscriber. Null when it was already claimed. */
    public static function dispatch(NewsletterCampaign $campaign): ?int
    {
        $claimed = NewsletterCampaign::query()->whereKey($campaign->id)->whereIn('status', ['draft', 'scheduled', 'failed'])->update(['status' => 'sending', 'updated_at' => now()]);
        if (! $claimed) {
            return null;
        }
        $campaign->refresh();
        // Subscribers confirmed by hand (dashboard / old flow) have no token yet: they need one for their unsubscribe link.
        NewsletterSubscriber::query()->where('status', 'confirmed')->whereNull('confirmation_token')->get()
            ->each(fn ($s) => $s->forceFill(['confirmation_token' => \Illuminate\Support\Str::random(64)])->save());
        $self = new self();
        $count = 0;
        NewsletterSubscriber::query()->where('status', 'confirmed')->whereNotNull('confirmation_token')->orderBy('id')
            ->chunkById(200, function ($chunk) use ($campaign, $self, &$count) {
                foreach ($chunk as $s) {
                    $data = $self->mailData($campaign, MailRenderer::site() . '/newsletter/unsubscribe?token=' . $s->confirmation_token);
                    $data['one_click'] = MailRenderer::api() . '/newsletter/one-click/' . $s->confirmation_token;
                    if (MailOutbox::queue($s->email, $campaign->subject, $data, 'newsletter', 8, 'campaign:' . $campaign->id . ':' . $s->id, ['campaign_id' => $campaign->id])) {
                        $count++;
                    }
                }
            });
        $campaign->forceFill(['recipients_count' => $count, 'queued_count' => $count, 'sent_count' => 0, 'failed_count' => 0])->save();

        return $count;
    }

    /** Scheduled campaigns whose time came (called by the pump). */
    public static function dispatchDue(): void
    {
        foreach (NewsletterCampaign::where('status', 'scheduled')->where('scheduled_at', '<=', now())->get() as $c) {
            self::dispatch($c);
        }
    }

    /* ───────────── helpers ───────────── */

    public function mailData(NewsletterCampaign $c, ?string $unsubscribe): array
    {
        $doc = $this->blocksOf($c);
        $items = $doc['items'] ?? [];
        if (! $items && trim((string) $c->html) !== '') {
            $items = [['type' => 'html', 'html' => (string) $c->html]];
        }

        return [
            'title' => $doc['title'] ?? $c->subject,
            'preheader' => $c->preheader ?: ($doc['title'] ?? $c->subject),
            'eyebrow' => $doc['eyebrow'] ?? 'نشرة اليسر',
            'hero' => ! empty($doc['hero']['image']) ? $doc['hero'] : null,
            'blocks' => $items,
            'reason' => 'وصلتك الرسالة دي لأنك مشترك في نشرة مؤسسة اليسر الخيرية.',
            'unsubscribe' => $unsubscribe,
        ];
    }

    private function blocksOf(NewsletterCampaign $c): array
    {
        $raw = $c->getAttributes()['blocks'] ?? null;
        $doc = is_string($raw) ? json_decode($raw, true) : (is_array($raw) ? $raw : null);

        return is_array($doc) ? $doc : [];
    }

    private function present(NewsletterCampaign $c): array
    {
        $a = $c->toArray();
        $a['blocks'] = $this->blocksOf($c) ?: null;

        return $a;
    }

    private function validated(Request $request, bool $partial = false): array
    {
        $req = $partial ? 'sometimes' : 'required';
        $data = $request->validate([
            'subject' => [$req, 'string', 'max:255'],
            'preheader' => ['sometimes', 'nullable', 'string', 'max:255'],
            'html' => ['sometimes', 'nullable', 'string'],
            'blocks' => ['sometimes', 'nullable', 'array'],
            'blocks.items' => ['sometimes', 'array', 'max:60'],
            'blocks.items.*.type' => ['required_with:blocks.items', 'string', 'in:heading,text,list,image,button,note,quote,divider,spacer,stats,card,cards,receipt,steps,html'],
            'text_body' => ['sometimes', 'nullable', 'string'],
            'from_name' => ['sometimes', 'nullable', 'string', 'max:120'],
            'from_email' => ['sometimes', 'nullable', 'email', 'max:255'],
            'reply_to' => ['sometimes', 'nullable', 'email', 'max:255'],
            'status' => ['sometimes', 'in:draft,scheduled'],
            'scheduled_at' => ['sometimes', 'nullable', 'date'],
        ], [
            'subject.required' => 'اكتب عنوان الرسالة.',
            'blocks.items.max' => 'الرسالة فيها أجزاء كتير (60 بالكتير).',
            'blocks.items.*.type.in' => 'في جزء نوعه مش معروف.',
        ]);
        // validate() keeps only the nested keys that have rules; the blocks are stored as sent.
        if (array_key_exists('blocks', $data)) {
            $blocks = $request->input('blocks');
            $data['blocks'] = is_array($blocks) ? json_encode($blocks, JSON_UNESCAPED_UNICODE) : null;
        }
        // html column is NOT NULL in the table: keep a rendered copy for the archive.
        if (! $partial || (array_key_exists('html', $data) && $data['html'] === null)) {
            $data['html'] = $data['html'] ?? '';
        }
        unset($data['from_email']); // always info@ (the mailbox the server is allowed to send from)

        return $data;
    }
}
