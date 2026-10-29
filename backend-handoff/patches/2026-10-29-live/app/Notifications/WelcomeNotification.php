<?php

namespace App\Notifications;

/** Sent once, when the account is created (never on login). */
class WelcomeNotification extends AppNotification
{
    public function __construct(
        public string $userName
    ) {
    }

    protected function type(): string
    {
        return 'welcome';
    }

    protected function title(): string
    {
        return 'أهلاً بيك في اليسر';
    }

    protected function message(): string
    {
        return "أهلاً {$this->userName}، حسابك اتعمل بنجاح.";
    }
}
