<?php

namespace App\Notifications;

class NewKhabiaRequestNotification extends AppNotification
{
    public function __construct(
        public int $requestId,
        public string $name,
        public string $city
    ) {
    }

    protected function type(): string
    {
        return 'new_khabia_request';
    }

    protected function title(): string
    {
        return 'طلب خبيئة جديد';
    }

    protected function message(): string
    {
        return "{$this->name} طلب خبيئة — {$this->city}";
    }

    protected function url(): ?string
    {
        return '/admin/delegates';
    }

    protected function severity(): string
    {
        return 'warning';
    }

    protected function extra(): array
    {
        return ['khabia_request_id' => $this->requestId];
    }
}
