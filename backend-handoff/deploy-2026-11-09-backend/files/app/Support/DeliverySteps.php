<?php

namespace App\Support;

use App\Models\Donation;
use App\Models\Donor;
use App\Models\User;
use Illuminate\Support\Facades\Schema;

/** Delivery steps of a donation as shown to its donor, and which donor records belong to an account. */
final class DeliverySteps
{
    /** { stage, history: [{stage, at, note?}] } or null — never the internal tracking data, never who acted. */
    public static function of(Donation $donation): ?array
    {
        $delivery = (is_array($donation->tracking_data) ? $donation->tracking_data : [])['delivery'] ?? null;
        if (! is_array($delivery) || empty($delivery['stage'])) {
            return null;
        }
        $history = array_map(
            fn ($h) => array_filter(['stage' => $h['stage'] ?? null, 'at' => $h['at'] ?? null, 'note' => $h['note'] ?? null], fn ($v) => $v !== null),
            is_array($delivery['history'] ?? null) ? $delivery['history'] : [],
        );

        return ['stage' => $delivery['stage'], 'history' => array_values($history)];
    }

    /** Donor records of an account: same email (DonorResolver matches signed-in donors by email), or linked by user_id. */
    public static function donorIdsOf(User $user): array
    {
        $q = Donor::query()->select('id');
        $email = mb_strtolower(trim((string) $user->email));
        $q->where(function ($w) use ($email, $user) {
            $w->whereRaw('LOWER(email) = ?', [$email !== '' ? $email : '__none__']);
            if (Schema::hasColumn('donors', 'user_id')) {
                $w->orWhere('user_id', $user->id);
            }
        });

        return $q->pluck('id')->all() ?: [0];
    }
}
