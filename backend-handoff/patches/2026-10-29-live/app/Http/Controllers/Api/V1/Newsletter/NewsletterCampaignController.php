<?php

namespace App\Http\Controllers\Api\V1\Newsletter;

use App\Http\Controllers\Controller;
use App\Models\NewsletterCampaign;
use App\Models\NewsletterSubscriber;
use App\Support\PublicUrls;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Newsletter campaigns (staff):
 *   GET/POST /newsletter-campaigns, GET/PUT/DELETE /newsletter-campaigns/{id}
 *   POST /newsletter-campaigns/{id}/send-test {email}   one copy to check the design
 *   POST /newsletter-campaigns/{id}/send               every confirmed subscriber, once
 * Every e-mail carries the subscriber's own unsubscribe link (token) and a List-Unsubscribe header.
 * Sending needs a real mailer (MAIL_MAILER=smtp…); with "log"/"array" nothing would reach anyone,
 * so the send is refused with a clear message instead of reporting a fake success.
 */
class NewsletterCampaignController extends Controller
{
    private const CHUNK = 50;

    public function index(Request $request): JsonResponse
    {
        $perPage = min(200, max(1, (int) $request->input('per_page', 50)));

        return response()->json(NewsletterCampaign::query()->latest()->paginate($perPage));
    }

    public function show(NewsletterCampaign $newsletterCampaign): JsonResponse
    {
        return response()->json(['data' => $newsletterCampaign]);
    }

    public function store(Request $request): JsonResponse
    {
        $campaign = NewsletterCampaign::create($this->validated($request) + ['created_by' => $request->user()?->id]);

        return response()->json(['data' => $campaign], 201);
    }

    public function update(Request $request, NewsletterCampaign $newsletterCampaign): JsonResponse
    {
        if ($newsletterCampaign->isLocked()) {
            return response()->json(['message' => 'الحملة اتبعتت بالفعل ومينفعش تتعدل. اعمل نسخة جديدة.'], 422);
        }
        $newsletterCampaign->update($this->validated($request, partial: true));

        return response()->json(['data' => $newsletterCampaign->fresh()]);
    }

    public function destroy(NewsletterCampaign $newsletterCampaign): JsonResponse
    {
        if ($newsletterCampaign->status === 'sending') {
            return response()->json(['message' => 'الحملة بتتبعت دلوقتي.'], 422);
        }
        $newsletterCampaign->delete();

        return response()->json(['message' => 'تم الحذف']);
    }

    public function sendTest(Request $request, NewsletterCampaign $newsletterCampaign): JsonResponse
    {
        $data = $request->validate(['email' => ['required', 'email', 'max:255']]);
        if ($refusal = $this->mailerRefusal()) {
            return $refusal;
        }

        try {
            $this->mailTo($newsletterCampaign, $data['email'], null, test: true);
        } catch (\Throwable $e) {
            Log::warning('Newsletter test send failed: ' . $e->getMessage());

            return response()->json(['message' => 'تعذر إرسال النسخة التجريبية: ' . $e->getMessage()], 502);
        }

        return response()->json(['message' => 'تم إرسال نسخة تجريبية', 'data' => ['sent' => 1, 'failed' => 0]]);
    }

    public function send(NewsletterCampaign $newsletterCampaign): JsonResponse
    {
        if ($refusal = $this->mailerRefusal()) {
            return $refusal;
        }

        // Claim the campaign atomically so two clicks can never send it twice.
        $claimed = NewsletterCampaign::query()
            ->whereKey($newsletterCampaign->id)
            ->whereIn('status', ['draft', 'scheduled', 'failed'])
            ->update(['status' => 'sending']);
        if (! $claimed) {
            return response()->json(['message' => 'الحملة اتبعتت أو بتتبعت بالفعل.'], 422);
        }

        @set_time_limit(0);
        $recipients = NewsletterSubscriber::query()->where('status', 'confirmed')->whereNotNull('confirmation_token');
        $total = (clone $recipients)->count();
        $sent = 0;
        $failed = 0;

        $recipients->orderBy('id')->chunkById(self::CHUNK, function ($chunk) use ($newsletterCampaign, &$sent, &$failed) {
            foreach ($chunk as $subscriber) {
                try {
                    $this->mailTo($newsletterCampaign, $subscriber->email, $subscriber->confirmation_token);
                    $sent++;
                } catch (\Throwable $e) {
                    $failed++;
                    Log::warning("Newsletter send failed for subscriber {$subscriber->id}: " . $e->getMessage());
                }
            }
        });

        $newsletterCampaign->forceFill([
            'status' => $sent > 0 || $total === 0 ? 'sent' : 'failed',
            'sent_at' => now(),
            'recipients_count' => $total,
            'sent_count' => $sent,
            'failed_count' => $failed,
        ])->save();

        return response()->json([
            'message' => "اتبعتت لـ {$sent} مشترك" . ($failed ? " — فشل {$failed}" : ''),
            'data' => ['sent' => $sent, 'failed' => $failed, 'campaign' => $newsletterCampaign],
        ]);
    }

    /* ───────────── helpers ───────────── */

    private function validated(Request $request, bool $partial = false): array
    {
        $req = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'subject' => [$req, 'string', 'max:255'],
            'preheader' => ['sometimes', 'nullable', 'string', 'max:255'],
            'html' => [$req, 'string'],
            'text_body' => ['sometimes', 'nullable', 'string'],
            'from_name' => ['sometimes', 'nullable', 'string', 'max:120'],
            'from_email' => ['sometimes', 'nullable', 'email', 'max:255'],
            'reply_to' => ['sometimes', 'nullable', 'email', 'max:255'],
            'status' => ['sometimes', 'in:draft,scheduled'],
            'scheduled_at' => ['sometimes', 'nullable', 'date'],
        ]);
    }

    private function mailerRefusal(): ?JsonResponse
    {
        if (in_array(config('mail.default'), ['log', 'array', null], true)) {
            return response()->json([
                'message' => 'الإيميل مش متظبط على السيرفر (MAIL_MAILER=' . config('mail.default') . '). لازم بيانات SMTP لإيميل المؤسسة في ملف .env على السيرفر قبل الإرسال.',
            ], 422);
        }

        return null;
    }

    private function mailTo(NewsletterCampaign $campaign, string $email, ?string $token, bool $test = false): void
    {
        $unsubscribe = $token ? PublicUrls::site('/newsletter/unsubscribe?token=' . $token) : null;
        $footer = $unsubscribe
            ? '<p style="font-size:12px;color:#777;text-align:center;margin-top:24px">وصلك الإيميل ده لأنك مشترك في نشرة مؤسسة اليسر الخيرية. '
                . '<a href="' . e($unsubscribe) . '">إلغاء الاشتراك</a></p>'
            : '';
        $preheader = $campaign->preheader
            ? '<div style="display:none;max-height:0;overflow:hidden">' . e($campaign->preheader) . '</div>'
            : '';
        $html = $preheader . $campaign->html . $footer;
        $subject = ($test ? '[تجربة] ' : '') . $campaign->subject;

        Mail::send([], [], function ($message) use ($campaign, $email, $html, $subject, $unsubscribe) {
            $message->to($email)->subject($subject)->html($html);
            if ($campaign->text_body) {
                $message->text($campaign->text_body);
            }
            $fromEmail = $campaign->from_email ?: config('mail.from.address');
            $message->from($fromEmail, $campaign->from_name ?: config('mail.from.name'));
            if ($campaign->reply_to) {
                $message->replyTo($campaign->reply_to);
            }
            if ($unsubscribe) {
                $message->getHeaders()->addTextHeader('List-Unsubscribe', '<' . $unsubscribe . '>');
            }
        });
    }
}
