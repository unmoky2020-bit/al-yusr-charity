<?php

namespace App\Observers;

use App\Models\Volunteer;
use App\Notifications\NewVolunteerNotification;
use App\Support\NotifyAdmins;
use Illuminate\Contracts\Events\ShouldHandleEventsAfterCommit;

/** «طلب تطوع جديد» to the admins when someone asks to volunteer (not when the team adds an approved one). */
class VolunteerObserver implements ShouldHandleEventsAfterCommit
{
    public function created(Volunteer $volunteer): void
    {
        if ($volunteer->status && $volunteer->status !== 'pending') {
            return;
        }
        // Signing up through a field campaign sends one «سجّل في حملة» notification instead.
        $action = (string) optional(request()->route())->getActionName();
        if (str_contains($action, 'VolunteerApplicationController@apply')) {
            return;
        }

        $place = implode('، ', array_filter([$volunteer->city, $volunteer->governorate]));
        NotifyAdmins::send(new NewVolunteerNotification((int) $volunteer->id, (string) $volunteer->name, $place !== '' ? $place : null));
    }
}
