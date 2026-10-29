<?php

namespace App\Http\Controllers\Api\V1\Push;

use App\Http\Controllers\Controller;
use App\Models\PushSubscription;
use Illuminate\Http\Request;

/**
 *   GET    /push/public-key       public  → { public_key } (VAPID, used by the browser to subscribe)
 *   POST   /push/subscriptions    auth    → save this browser's subscription for the signed-in user
 *   DELETE /push/subscriptions    auth    → remove it (by endpoint)
 */
class PushSubscriptionController extends Controller
{
    public function publicKey()
    {
        return response()->json(['public_key' => config('webpush.public_key')]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'endpoint' => 'required|url|max:500',
            'keys.p256dh' => 'required|string|max:255',
            'keys.auth' => 'required|string|max:255',
            'content_encoding' => 'nullable|string|max:20',
        ]);

        // One row per endpoint; if another user subscribed this browser before, it now belongs to this user.
        $sub = PushSubscription::updateOrCreate(
            ['endpoint' => $data['endpoint']],
            [
                'user_id' => $request->user()->id,
                'public_key' => $data['keys']['p256dh'],
                'auth_token' => $data['keys']['auth'],
                'content_encoding' => $data['content_encoding'] ?? 'aes128gcm',
                'user_agent' => substr((string) $request->userAgent(), 0, 255),
            ]
        );

        return response()->json(['message' => 'Subscribed', 'id' => $sub->id], 201);
    }

    public function destroy(Request $request)
    {
        $data = $request->validate(['endpoint' => 'required|string|max:500']);
        PushSubscription::where('endpoint', $data['endpoint'])->where('user_id', $request->user()->id)->delete();

        return response()->json(['message' => 'Unsubscribed']);
    }
}
