<?php

namespace App\Notifications;

class NewContactMessageNotification extends AppNotification
{
    public function __construct(
        public int $messageId,
        public string $name,
        public string $section
    ) {
    }

    protected function type(): string
    {
        return 'new_contact_message';
    }

    protected function title(): string
    {
        return 'رسالة جديدة من «تواصل معنا»';
    }

    protected function message(): string
    {
        return "{$this->name} بعت رسالة ({$this->section})";
    }

    protected function url(): ?string
    {
        return '/admin/inbox';
    }

    protected function severity(): string
    {
        return 'warning';
    }

    protected function extra(): array
    {
        return ['contact_message_id' => $this->messageId];
    }
}
