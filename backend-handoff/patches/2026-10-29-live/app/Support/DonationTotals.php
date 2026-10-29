<?php

namespace App\Support;

use App\Models\Donation;
use App\Models\Program;
use App\Models\Project;

/**
 * Keeps programs.collected_amount / projects.collected_amount in step with paid donations when the
 * team changes a status by hand (the Kashier / Paymob callbacks do the same for gateway payments).
 * Call inside the transaction that changes the donation's status.
 */
final class DonationTotals
{
    /** The donation just became paid. */
    public static function added(Donation $donation): void
    {
        self::shift($donation, (float) $donation->amount);
    }

    /** A paid donation was refunded. */
    public static function removed(Donation $donation): void
    {
        self::shift($donation, -(float) $donation->amount);
    }

    private static function shift(Donation $donation, float $delta): void
    {
        foreach ([[Program::class, $donation->program_id], [Project::class, $donation->project_id]] as [$model, $id]) {
            if (! $id) {
                continue;
            }
            $record = $model::whereKey($id)->lockForUpdate()->first();
            if ($record) {
                $record->collected_amount = max(0, (float) ($record->collected_amount ?? 0) + $delta);
                $record->save();
            }
        }
    }
}
