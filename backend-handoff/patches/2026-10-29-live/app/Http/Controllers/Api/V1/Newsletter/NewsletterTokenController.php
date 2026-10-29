<?php

namespace App\Http\Controllers\Api\V1\Newsletter;

use App\Http\Controllers\Controller;
use App\Models\NewsletterSubscriber;
use Illuminate\Http\Request;

/**
 * Email-link actions for the newsletter (no login):
 *   POST /newsletter/confirm      { token }
 *   POST /newsletter/unsubscribe  { token }
 * Only the secret token from the email identifies the subscriber — an email address alone is
 * not accepted, so nobody can unsubscribe someone else. The token is kept after confirming so the
 * same link family can later unsubscribe.
 */
class NewsletterTokenController extends Controller
{
    private function find(Request $request): NewsletterSubscriber
    {
        $data = $request->validate([
            'token' => 'required|string|size:64',
        ]);

        return NewsletterSubscriber::where('confirmation_token', $data['token'])->firstOrFail();
    }

    public function confirm(Request $request)
    {
        $subscriber = $this->find($request);

        if ($subscriber->status !== 'confirmed') {
            $subscriber->update([
                'status' => 'confirmed',
                'confirmed_at' => now(),
                'unsubscribed_at' => null,
            ]);
        }

        return response()->json([
            'message' => 'تم تأكيد اشتراكك',
            'data' => ['status' => $subscriber->status, 'email' => $subscriber->email],
        ]);
    }

    public function unsubscribe(Request $request)
    {
        $subscriber = $this->find($request);

        if ($subscriber->status !== 'unsubscribed') {
            $subscriber->update([
                'status' => 'unsubscribed',
                'unsubscribed_at' => now(),
            ]);
        }

        return response()->json([
            'message' => 'تم إلغاء اشتراكك',
            'data' => ['status' => $subscriber->status, 'email' => $subscriber->email],
        ]);
    }
}
