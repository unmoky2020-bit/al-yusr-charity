<?php

namespace App\Support;

use App\Models\Donation;
use App\Models\User;
use Illuminate\Notifications\Notification;

/**
 * Notifications to the donor's own account (the twin of NotifyAdmins).
 * A donation points to a Donor record; the account behind it is the donor's user_id, else the
 * account with the same email. Guest donors (no account) are skipped.
 * A failure never breaks the request that triggered it.
 */
class NotifyDonor
{
    public static function accountFor(Donation $donation): ?User
    {
        $donor = $donation->donor;
        if (! $donor) {
            return null;
        }
        $attrs = $donor->getAttributes();
        if (! empty($attrs['user_id'])) {
            return User::find($attrs['user_id']);
        }
        if (! empty($attrs['email'])) {
            return User::where('email', $attrs['email'])->first();
        }

        return null;
    }

    public static function send(Donation $donation, Notification $notification): void
    {
        try {
            self::accountFor($donation)?->notify($notification);
        } catch (\Throwable $e) {
            report($e);
        }
    }

    /** What the donation went to (program, campaign, project or case), for the message; null if unknown. */
    public static function targetName(Donation $donation): ?string
    {
        try {
            foreach (['program', 'donationCampaign', 'project', 'case'] as $relation) {
                if (! method_exists($donation, $relation)) {
                    continue;
                }
                $target = $donation->{$relation};
                if (! $target) {
                    continue;
                }
                $a = $target->getAttributes();
                $name = $a['name_ar'] ?? $a['title_ar'] ?? $a['title'] ?? $a['name'] ?? null;
                if (is_string($name) && trim($name) !== '') {
                    return trim($name);
                }
            }
        } catch (\Throwable $e) {
            report($e);
        }

        return null;
    }

    /** "500.00" → "500", "250.5" → "250.50". */
    public static function amount(Donation $donation): string
    {
        $n = (float) $donation->amount;

        return number_format($n, floor($n) == $n ? 0 : 2);
    }

    /** Where the donor follows this donation: its tracking page, else their account. */
    public static function followUrl(Donation $donation): string
    {
        $ref = $donation->getAttributes()['transaction_reference'] ?? null;

        return $ref ? '/donate/track/' . rawurlencode((string) $ref) : '/dashboard?tab=donations';
    }
}
