<?php

namespace App\Observers;

use App\Models\VolunteerCampaignApplication;
use App\Notifications\NewCampaignApplicationNotification;
use App\Support\NotifyAdmins;
use Illuminate\Contracts\Events\ShouldHandleEventsAfterCommit;

/** «تسجيل جديد في حملة تطوع» to the admins: a new application, or a withdrawn one sent again. */
class VolunteerCampaignApplicationObserver implements ShouldHandleEventsAfterCommit
{
    public function created(VolunteerCampaignApplication $application): void
    {
        if ($application->status === 'pending') {
            $this->notify($application);
        }
    }

    public function updated(VolunteerCampaignApplication $application): void
    {
        if ($application->wasChanged('status') && $application->status === 'pending' && $application->getOriginal('status') === 'withdrawn') {
            $this->notify($application);
        }
    }

    private function notify(VolunteerCampaignApplication $application): void
    {
        $application->loadMissing(['volunteer', 'campaign']);
        $volunteer = $application->volunteer;
        $isNew = $volunteer && $volunteer->created_at && $volunteer->created_at->gt(now()->subMinutes(5));

        NotifyAdmins::send(new NewCampaignApplicationNotification(
            (int) $application->id,
            (int) $application->campaign_id,
            $volunteer?->name ?? 'متطوع',
            $application->campaign?->title_ar ?: 'حملة تطوع',
            (bool) $isNew
        ));
    }
}
