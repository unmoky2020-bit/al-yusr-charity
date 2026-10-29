<?php

namespace App\Notifications;

class ProgramTargetReachedNotification extends AppNotification
{
    public function __construct(
        public int $programId,
        public string $programName,
        public string $targetAmount,
        public string $collectedAmount
    ) {
    }

    protected function type(): string
    {
        return 'program_target_reached';
    }

    protected function title(): string
    {
        return 'البرنامج وصل لهدفه';
    }

    protected function message(): string
    {
        return "برنامج {$this->programName} وصل لهدفه: {$this->collectedAmount} من {$this->targetAmount} جنيه.";
    }

    protected function url(): ?string
    {
        return "/admin/programs/{$this->programId}";
    }

    protected function severity(): string
    {
        return 'success';
    }

    protected function extra(): array
    {
        return ['program_id' => $this->programId];
    }
}
