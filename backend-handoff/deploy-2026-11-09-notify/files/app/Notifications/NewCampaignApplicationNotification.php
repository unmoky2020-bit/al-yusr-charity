<?php

namespace App\Notifications;

/** To the admins: a volunteer signed up for a field campaign. */
class NewCampaignApplicationNotification extends AppNotification
{
    public function __construct(
        public int $applicationId,
        public int $campaignId,
        public string $volunteerName,
        public string $campaignTitle,
        public bool $newVolunteer = false
    ) {
    }

    protected function type(): string
    {
        return 'new_campaign_application';
    }

    protected function title(): string
    {
        return $this->newVolunteer ? 'متطوع جديد سجّل في حملة' : 'تسجيل جديد في حملة تطوع';
    }

    protected function message(): string
    {
        return "{$this->volunteerName} سجّل في «{$this->campaignTitle}».";
    }

    protected function url(): ?string
    {
        return '/admin/campaigns/' . $this->campaignId;
    }

    protected function extra(): array
    {
        return ['campaign_id' => $this->campaignId, 'application_id' => $this->applicationId];
    }
}
