<?php

namespace App\Notifications;

/** To the admins: someone asked to volunteer. */
class NewVolunteerNotification extends AppNotification
{
    public function __construct(
        public int $volunteerId,
        public string $name,
        public ?string $place = null
    ) {
    }

    protected function type(): string
    {
        return 'new_volunteer';
    }

    protected function title(): string
    {
        return 'طلب تطوع جديد';
    }

    protected function message(): string
    {
        return $this->place ? "{$this->name} من {$this->place} عايز يتطوع معانا." : "{$this->name} عايز يتطوع معانا.";
    }

    protected function url(): ?string
    {
        return '/admin/volunteers';
    }

    protected function extra(): array
    {
        return ['volunteer_id' => $this->volunteerId];
    }
}
