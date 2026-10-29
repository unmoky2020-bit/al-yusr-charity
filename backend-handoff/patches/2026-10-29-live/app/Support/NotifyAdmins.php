<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Notifications\Notification;

/** Send a notification to every super-admin; a failure never breaks the request that triggered it. */
class NotifyAdmins
{
    public static function send(Notification $notification): void
    {
        try {
            User::whereHas('roles', fn ($q) => $q->where('slug', 'super-admin'))
                ->get()
                ->each(fn (User $admin) => $admin->notify($notification));
        } catch (\Throwable $e) {
            report($e);
        }
    }
}
