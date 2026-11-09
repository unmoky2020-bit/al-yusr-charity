<?php

namespace App\Notifications;

/** To the editor who sent a change: it was approved (published) or sent back, with the reviewer's note. */
class ChangeRequestReviewedNotification extends AppNotification
{
    public function __construct(
        public int $requestId,
        public bool $approved,
        public string $what,
        public ?string $note = null,
        public ?string $sectionUrl = null,
        public bool $signUp = false
    ) {
    }

    protected function type(): string
    {
        return $this->approved ? 'change_request_approved' : 'change_request_rejected';
    }

    protected function title(): string
    {
        if ($this->signUp) {
            return $this->approved ? 'حسابك اتفعّل' : 'طلب حسابك ما اتقبلش';
        }

        return $this->approved ? 'اتوافق على تعديلك' : 'تعديلك محتاج مراجعة';
    }

    protected function message(): string
    {
        if ($this->signUp) {
            return $this->approved ? 'أهلًا بيك في فريق اليسر. تقدر تبدأ شغلك من لوحة التحكم.' : 'الإدارة ما وافقتش على الحساب.' . $this->noteText();
        }

        return $this->approved
            ? "{$this->what}: اتوافق عليه واتنشر على الموقع."
            : "{$this->what}: الإدارة رجّعته." . $this->noteText();
    }

    private function noteText(): string
    {
        $note = trim((string) $this->note);

        return $note !== '' ? " الملاحظة: {$note}" : '';
    }

    protected function url(): ?string
    {
        return $this->signUp ? '/admin' : $this->sectionUrl;
    }

    protected function severity(): string
    {
        return $this->approved ? 'success' : 'warning';
    }

    protected function extra(): array
    {
        return ['change_request_id' => $this->requestId];
    }
}
