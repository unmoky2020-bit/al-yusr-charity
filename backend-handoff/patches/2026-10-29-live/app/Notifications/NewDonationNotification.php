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
        return 'تبرع جديد';
    }

    protected function message(): string
    {
        return "تبرع جديد من {$this->donorName} بقيمة {$this->amount} جنيه";
    }

    protected function url(): ?string
    {
        return "/admin/donations/{$this->donationId}";
    }

    protected function severity(): string
    {
        return 'success';
    }

    protected function extra(): array
    {
        return ['donation_id' => $this->donationId];
    }
}
