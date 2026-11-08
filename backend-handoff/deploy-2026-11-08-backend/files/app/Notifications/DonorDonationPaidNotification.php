<?php

namespace App\Notifications;

/** To the donor: their donation is confirmed (status became "paid"). */
class DonorDonationPaidNotification extends AppNotification
{
    public function __construct(
        public int $donationId,
        public string $amount,
        public ?string $target,
        public string $followUrl
    ) {
    }

    protected function type(): string
    {
        return 'donor_donation_paid';
    }

    protected function title(): string
    {
        return 'وصل تبرعك، جزاك الله خيرًا';
    }

    protected function message(): string
    {
        $for = $this->target ? " لـ«{$this->target}»" : '';

        return "تأكدنا من تبرعك بمبلغ {$this->amount} ج.م{$for}. سنطمئنك بكل خطوة حتى يصل إلى مستحقيه.";
    }

    protected function url(): ?string
    {
        return $this->followUrl;
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
