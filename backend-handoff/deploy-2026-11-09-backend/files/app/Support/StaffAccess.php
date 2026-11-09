<?php

namespace App\Support;

use App\Models\User;

/**
 * What a team account may see, checked inside a controller (the routes' permission middleware
 * decides who may call an endpoint; this decides what part of the answer they get).
 * The super admin may do everything; everyone else through the permissions of their roles.
 */
final class StaffAccess
{
    public static function isSuperAdmin(?User $user): bool
    {
        return $user !== null && $user->roles()->where('slug', 'super-admin')->exists();
    }

    /** Super admin or admin: the accounts that see every donor's donations. */
    public static function seesAllDonations(?User $user): bool
    {
        return $user !== null && $user->roles()->whereIn('slug', ['super-admin', 'admin'])->exists();
    }

    public static function has(?User $user, string $permission): bool
    {
        if ($user === null) {
            return false;
        }
        if (self::isSuperAdmin($user)) {
            return true;
        }

        return $user->roles()
            ->whereHas('permissions', fn ($q) => $q->where('slug', $permission)->orWhere('name', $permission))
            ->exists();
    }
}
