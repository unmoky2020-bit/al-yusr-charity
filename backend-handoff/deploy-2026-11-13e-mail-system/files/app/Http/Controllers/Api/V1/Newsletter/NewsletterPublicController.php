<?php

namespace App\Http\Controllers\Api\V1\Newsletter;

use App\Http\Controllers\Controller;
use App\Models\NewsletterSubscriber;
use App\Support\PublicUrls;
use Illuminate\Http\Request;
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

    /**
     * Queues the confirmation email in the foundation's design (it leaves within a minute, right after
     * this request). Returns false when mail is not configured.
     */
    public static function sendConfirmation(NewsletterSubscriber $s): bool
    {
        if (! \App\Support\Mail\MailOutbox::mailerReady()) {
            return false;
        }
        $link = PublicUrls::site('/newsletter/confirm?token=' . $s->confirmation_token);
        [$subject, $data] = \App\Support\Mail\MailTemplates::newsletterConfirm($link);
        // One confirmation per subscriber per hour at most (dedupe key changes every hour).
        \App\Support\Mail\MailOutbox::queue($s->email, $subject, $data, 'newsletter_confirm', 2, 'nl_confirm:' . $s->id . ':' . now()->format('YmdH'), ['ref_type' => 'newsletter_subscriber', 'ref_id' => $s->id]);

        return true;
    }
}
