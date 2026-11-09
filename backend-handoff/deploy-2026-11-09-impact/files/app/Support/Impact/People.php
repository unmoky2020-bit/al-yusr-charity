<?php

namespace App\Support\Impact;

use App\Models\User;
use Illuminate\Support\Facades\Storage;

/** How a team member appears on impact records: the full card for staff, a first name for visitors. */
final class People
{
    public static function avatarUrl(?User $user): ?string
    {
        $avatar = trim((string) ($user?->avatar ?? ''));
        if ($avatar === '') {
            return null;
        }
        if (preg_match('#^https?://#i', $avatar)) {
            return $avatar;
        }

        return Storage::disk('public')->url(ltrim(preg_replace('#^/?storage/#', '', $avatar), '/'));
    }

    public static function firstName(?string $name): ?string
    {
        $parts = preg_split('/\s+/u', trim((string) $name), -1, PREG_SPLIT_NO_EMPTY);

        return $parts[0] ?? null;
    }

    /** Staff see who it is; visitors see the first name and photo only. */
    public static function card(?User $user, bool $staff): ?array
    {
        if (! $user) {
            return null;
        }

        return $staff
            ? ['id' => $user->id, 'name' => $user->name, 'email' => $user->email, 'avatar_url' => self::avatarUrl($user)]
            : ['name' => self::firstName($user->name), 'avatar_url' => self::avatarUrl($user)];
    }
}
