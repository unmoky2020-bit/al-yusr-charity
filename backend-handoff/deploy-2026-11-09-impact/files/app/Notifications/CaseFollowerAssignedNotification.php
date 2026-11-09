<?php

namespace App\Notifications;

/** To a team member: they now follow a case. */
class CaseFollowerAssignedNotification extends AppNotification
{
    public function __construct(
        public int $caseId,
        public string $caseCode,
        public string $caseTitle,
        public ?string $note = null
    ) {
    }

    protected function type(): string
    {
        return 'case_follower_assigned';
    }

    protected function title(): string
    {
        return 'بقيت مسؤول متابعة حالة';
    }

    protected function message(): string
    {
        return "اتعيّنت مسؤول متابعة «{$this->caseTitle}» ({$this->caseCode})." . ($this->note ? " ملاحظة: {$this->note}" : '');
    }

    protected function url(): ?string
    {
        return '/admin/cases/' . $this->caseId;
    }

    protected function severity(): string
    {
        return 'info';
    }

    protected function extra(): array
    {
        return ['case_id' => $this->caseId];
    }
}
