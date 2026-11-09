<?php

namespace App\Notifications;

/** To the reviewers: an editor sent a change (or signed up as an editor) that waits for approval. */
class ChangeRequestSubmittedNotification extends AppNotification
{
    public function __construct(
        public int $requestId,
        public string $editorName,
        public string $what,
        public bool $signUp = false
    ) {
    }

    protected function type(): string
    {
        return 'change_request_new';
    }

    protected function title(): string
    {
        return $this->signUp ? 'طلب حساب محرر جديد' : 'تعديل جديد مستني مراجعتك';
    }

    protected function message(): string
    {
        return $this->signUp
            ? "{$this->editorName} سجّل كمحرر، والحساب مستني موافقتك."
            : "{$this->editorName} بعت {$this->what}.";
    }

    protected function url(): ?string
    {
        return '/admin/review';
    }

    protected function severity(): string
    {
        return 'warning';
    }

    protected function extra(): array
    {
        return ['change_request_id' => $this->requestId];
    }
}
