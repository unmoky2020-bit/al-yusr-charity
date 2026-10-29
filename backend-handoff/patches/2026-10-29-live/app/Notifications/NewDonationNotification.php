<?php

namespace App\Notifications;

class NewDonationNotification extends AppNotification
{
    public function __construct(
        public int $donationId,
        public string $donorName,
        public string $amount
    ) {
    }

    protected function type(): string
    {
        return 'new_donation';
    }

    protected function title(): string
    {
        return 'تبرع جديد بانتظار تأكيدك';
    }

    protected function message(): string
    {
        return "{$this->donorName} سجّل تبرع بـ {$this->amount} جنيه بطريقة دفع يدوية — أكّد الاستلام";
    }

    protected function url(): ?string
    {
        return "/admin/donations/{$this->donationId}";
    }

    protected function severity(): string
    {
        return 'warning';
    }

    protected function extra(): array
    {
        return ['donation_id' => $this->donationId];
    }
}
