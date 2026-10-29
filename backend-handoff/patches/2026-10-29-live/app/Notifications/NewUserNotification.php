<?php

namespace App\Notifications;

class NewUserNotification extends AppNotification
{
    public function __construct(
        public int $userId,
        public string $userName
    ) {
    }

    protected function type(): string
    {
        return 'new_user';
    }

    protected function title(): string
    {
        return 'مستخدم جديد';
    }

    protected function message(): string
    {
        return "سجّل مستخدم جديد: {$this->userName}";
    }

    protected function url(): ?string
    {
        return '/admin/users';
    }

    protected function extra(): array
    {
        return ['user_id' => $this->userId];
    }
}
