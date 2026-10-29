<?php

namespace App\Notifications;

/**
 * Sent to every super-admin when the numbers / accounts donors transfer money to change — so a
 * compromised dashboard account cannot silently redirect donations.
 */
class PayoutDetailsChangedNotification extends AppNotification
{
    public function __construct(
        public int $paymentMethodId,
        public string $methodName,
        public string $changedBy
    ) {
    }

    protected function type(): string
    {
        return 'payout_details_changed';
    }

    protected function title(): string
    {
        return 'تغيير في حسابات استلام التبرعات';
    }

    protected function message(): string
    {
        return "{$this->changedBy} غيّر أرقام أو حسابات «{$this->methodName}». لو مش إنت اللي طالب التغيير، راجعه فوراً.";
    }

    protected function url(): ?string
    {
        return '/admin/payment-methods';
    }

    protected function severity(): string
    {
        return 'warning';
    }

    protected function extra(): array
    {
        return ['payment_method_id' => $this->paymentMethodId];
    }
}
