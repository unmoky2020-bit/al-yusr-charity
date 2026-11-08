<?php

namespace App\Notifications;

/** To every donor who paid for a case: a new update was posted on it. */
class DonorCaseUpdateNotification extends AppNotification
{
    public function __construct(
        public int $caseId,
        public string $caseTitle,
        public string $excerpt,
        public string $caseRef
    ) {
    }

    protected function type(): string
    {
        return 'donor_case_update';
    }

    protected function title(): string
    {
        return 'جديد عن الحالة التي دعمتها';
    }

    protected function message(): string
    {
        $head = $this->caseTitle !== '' ? "{$this->caseTitle}: " : '';

        return $head . ($this->excerpt !== '' ? $this->excerpt : 'أضفنا تحديثًا جديدًا على الحالة.');
    }

    protected function url(): ?string
    {
        return '/cases/' . rawurlencode($this->caseRef);
    }

    protected function extra(): array
    {
        return ['case_id' => $this->caseId];
    }
}
