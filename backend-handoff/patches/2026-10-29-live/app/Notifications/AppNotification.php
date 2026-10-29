<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use App\Notifications\Channels\WebPushChannel;
use Illuminate\Notifications\Notification;

/**
 * Base for every in-app notification: one payload shape the dashboard can rely on.
 *   { type, title, message, url, severity, ...extra }
 * `url` is the dashboard page the notification opens; `severity` drives colour (info|success|warning).
 */
abstract class AppNotification extends Notification
{
    use Queueable;

    abstract protected function type(): string;

    abstract protected function title(): string;

    abstract protected function message(): string;

    protected function url(): ?string
    {
        return null;
    }

    protected function severity(): string
    {
        return 'info';
    }

    /** Extra ids kept for filtering / older clients (e.g. donation_id). */
    protected function extra(): array
    {
        return [];
    }

    public function via(object $notifiable): array
    {
        // Web push reaches the browser even when the site is closed (no-op without subscriptions / keys).
        return ['database', WebPushChannel::class];
    }

    /** Payload the service worker (public/sw.js) shows as a system notification. */
    public function toWebPush(object $notifiable): array
    {
        return [
            'title' => $this->title(),
            'body' => $this->message(),
            'url' => $this->url() ?? '/admin/notifications',
            'tag' => $this->type(),
        ];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => $this->type(),
            'title' => $this->title(),
            'message' => $this->message(),
            'url' => $this->url(),
            'severity' => $this->severity(),
            ...$this->extra(),
        ];
    }
}
