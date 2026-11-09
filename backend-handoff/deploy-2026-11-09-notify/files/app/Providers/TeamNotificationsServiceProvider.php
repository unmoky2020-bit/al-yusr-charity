<?php

namespace App\Providers;

use App\Models\ContentChangeRequest;
use App\Models\Volunteer;
use App\Models\VolunteerCampaignApplication;
use App\Observers\ContentChangeRequestObserver;
use App\Observers\VolunteerCampaignApplicationObserver;
use App\Observers\VolunteerObserver;
use Illuminate\Support\ServiceProvider;

/**
 * The team's notifications (9 Nov 2026): the approval flow of the editors and the volunteers'
 * sign-ups. Kept apart from AppServiceProvider so it can be removed in one line (bootstrap/providers.php).
 */
class TeamNotificationsServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        ContentChangeRequest::observe(ContentChangeRequestObserver::class);
        Volunteer::observe(VolunteerObserver::class);
        VolunteerCampaignApplication::observe(VolunteerCampaignApplicationObserver::class);
    }
}
