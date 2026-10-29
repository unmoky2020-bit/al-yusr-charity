<?php

namespace App\Notifications\Channels;

use App\Models\PushSubscription;
use Illuminate\Notifications\Notification;
use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\WebPush;

/**
 * Delivers a notification to every browser the user enabled push on (Web Push + VAPID), so it
 * arrives even when the site is closed. Expired subscriptions (404 / 410) are removed.
 * Never throws: a push failure must not break the request that created the notification.
 */
class WebPushChannel
{
    public function send(object $notifiable, Notification $notification): void
    {
        $config = config('webpush');
        if (empty($config['public_key']) || empty($config['private_key']) || !method_exists($notification, 'toWebPush')) {
            return;
        }

        $subscriptions = PushSubscription::where('user_id', $notifiable->getKey())->get();
        if ($subscriptions->isEmpty()) {
            return;
        }

        try {
            $webPush = new WebPush([
                'VAPID' => [
                    'subject' => $config['subject'],
                    'publicKey' => $config['public_key'],
                    'privateKey' => $config['private_key'],
                ],
            ], ['TTL' => $config['ttl']]);

            $payload = json_encode($notification->toWebPush($notifiable), JSON_UNESCAPED_UNICODE);

            foreach ($subscriptions as $sub) {
                $webPush->queueNotification(Subscription::create([
                    'endpoint' => $sub->endpoint,
                    'publicKey' => $sub->public_key,
                    'authToken' => $sub->auth_token,
                    'contentEncoding' => $sub->content_encoding,
                ]), $payload);
            }

            foreach ($webPush->flush() as $report) {
                $endpoint = $report->getRequest()->getUri()->__toString();
                if ($report->isSuccess()) {
                    PushSubscription::where('endpoint', $endpoint)->update(['last_used_at' => now()]);
                } elseif ($report->isSubscriptionExpired()) {
                    PushSubscription::where('endpoint', $endpoint)->delete();
                }
            }
        } catch (\Throwable $e) {
            report($e);
        }
    }
}
