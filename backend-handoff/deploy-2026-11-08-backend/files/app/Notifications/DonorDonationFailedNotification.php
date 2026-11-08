<?php

namespace App\Notifications;

/** To the donor: the payment did not go through (status became failed / cancelled). */
class DonorDonationFailedNotification extends AppNotification
{
    public function __construct(
        public int $donationId,
        public string $amount,
        public string $followUrl
    ) {
    }

    protected function type(): string
    {
        return 'donor_donation_failed';
    }

    protected function title(): string
    {
        return 'لم يكتمل تبرعك';
    }

    protected function message(): string
    {
        return "لم تكتمل عملية الدفع لتبرعك بمبلغ {$this->amount} ج.م. يمكنك المحاولة مرة أخرى، أو مراسلتنا عبر واتساب ونساعدك.";
    }

    protected function url(): ?string
    {
        return $this->followUrl;
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
