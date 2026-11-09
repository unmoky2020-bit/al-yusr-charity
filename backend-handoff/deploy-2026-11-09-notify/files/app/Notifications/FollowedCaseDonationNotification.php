<?php

namespace App\Notifications;

/** To the team member who follows a case: a paid donation reached it. */
class FollowedCaseDonationNotification extends AppNotification
{
    public function __construct(
        public int $caseId,
        public string $caseCode,
        public string $caseTitle,
        public string $amount,
        public int $donationId
    ) {
    }

    protected function type(): string
    {
        return 'followed_case_donation';
    }

    protected function title(): string
    {
        return 'تبرع جديد للحالة اللي بتتابعها';
    }

    protected function message(): string
    {
        $code = $this->caseCode !== '' ? " ({$this->caseCode})" : '';

        return "وصل {$this->amount} ج.م لـ«{$this->caseTitle}»{$code}.";
    }

    protected function url(): ?string
    {
        return '/admin/cases/' . $this->caseId;
    }

    protected function severity(): string
    {
        return 'success';
    }

    protected function extra(): array
    {
        return ['case_id' => $this->caseId, 'donation_id' => $this->donationId];
    }
}
