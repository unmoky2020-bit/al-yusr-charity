<?php

namespace App\Http\Controllers\Api\V1\Newsletter;

use App\Http\Controllers\Controller;
use App\Models\NewsletterSubscriber;
use App\Support\PublicUrls;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

/**
 * Public newsletter sign-up from the website (no login).
 *   POST /newsletter/subscribe { email, language?, source? }  (throttled)
 *
 * Before this, the site posted to POST /newsletter, which sits behind auth:sanctum and
 * permission:newsletter.create, so every visitor got 401 and nobody could subscribe.
 *
 * Double opt-in: the subscriber is "pending" until they click the link in the confirmation
 * email (handled by NewsletterTokenController@confirm). When no real mailer is configured
 * (MAIL_MAILER=log) the row is still saved as pending; `php artisan newsletter:send-confirmations`
 * sends the emails once SMTP is set.
 */
class NewsletterPublicController extends Controller
{
    public function subscribe(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email:rfc', 'max:190'],
            'language' => ['nullable', 'in:ar,en'],
            'source' => ['nullable', 'string', 'max:40'],
        ]);
        $email = Str::lower(trim($data['email']));

        $subscriber = NewsletterSubscriber::firstOrNew(['email' => $email]);
        if ($subscriber->exists && $subscriber->status === 'confirmed') {
            // Same answer as a new sign-up: never reveal whether an address is on the list.
            return response()->json(['data' => ['status' => 'pending', 'email_sent' => true]], 200);
        }

        // forceFill: works whatever the model's $fillable lists.
        $subscriber->forceFill([
            'status' => 'pending',
            'language' => $data['language'] ?? 'ar',
            'source' => $data['source'] ?? 'website',
            'unsubscribed_at' => null,
        ]);
        if (!$subscriber->confirmation_token) {
            $subscriber->confirmation_token = Str::random(64);
        }
        $subscriber->save();

        $sent = self::sendConfirmation($subscriber);

        return response()->json(['data' => ['status' => 'pending', 'email_sent' => $sent]], 201);
    }

    /** Sends the confirmation email. Returns false (and keeps the row pending) when mail is not configured or fails. */
    public static function sendConfirmation(NewsletterSubscriber $s): bool
    {
        if (in_array(config('mail.default'), ['log', 'array', null], true)) {
            return false;
        }
        $link = PublicUrls::site('/newsletter/confirm?token=' . $s->confirmation_token);
        $ar = ($s->language ?? 'ar') !== 'en';
        $subject = $ar ? 'أكّد اشتراكك في نشرة مؤسسة اليسر' : 'Confirm your Al-Yusr newsletter subscription';
        $html = $ar
            ? '<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;font-size:16px;line-height:1.8;color:#0b4429">'
                . '<p>أهلًا بيك،</p><p>اضغط على الزرار علشان تأكد اشتراكك في نشرة مؤسسة اليسر الخيرية. هيوصلك منها رسالة كل أسبوعين: صور من التوزيع، والحالات اللي اكتملت، والحملة الجاية.</p>'
                . '<p style="margin:28px 0"><a href="' . e($link) . '" style="background:#f58220;color:#fff;padding:12px 26px;border-radius:12px;text-decoration:none;font-weight:bold">تأكيد الاشتراك</a></p>'
                . '<p style="font-size:13px;color:#666">لو ما طلبتش الاشتراك، تجاهل الإيميل ده ومش هيوصلك حاجة.</p></div>'
            : '<div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.7;color:#0b4429">'
                . '<p>Hello,</p><p>Click the button to confirm your subscription to the Al-Yusr Charity newsletter.</p>'
                . '<p style="margin:28px 0"><a href="' . e($link) . '" style="background:#f58220;color:#fff;padding:12px 26px;border-radius:12px;text-decoration:none;font-weight:bold">Confirm subscription</a></p>'
                . '<p style="font-size:13px;color:#666">If you did not ask for this, ignore this email.</p></div>';
        try {
            Mail::send([], [], fn ($m) => $m->to($s->email)->subject($subject)->html($html));
            return true;
        } catch (\Throwable $e) {
            Log::warning('newsletter confirmation mail failed', ['id' => $s->id, 'error' => $e->getMessage()]);
            return false;
        }
    }
}
