<?php

namespace App\Support;

use App\Models\Donation;
use App\Models\Donor;
use App\Models\User;
use Illuminate\Support\Facades\Schema;

/**
 * The trail of a paid donation on its way to a family, kept in donations.tracking_data.delivery:
 *   { stage, hold?: {note, at}, history: [{stage, at, note?, photos?, distribution?, by}] }
 *
 * Progress stages, in order: family_identified → preparing → delivered.
 * "on_hold" is not a step forward: it marks the donation as paused (with the reason) until the next
 * progress line clears it. Every line is kept, so undoing one simply recomputes from what is left.
 */
final class DeliverySteps
{
    public const STAGES = ['family_identified', 'preparing', 'delivered'];
    public const ON_HOLD = 'on_hold';
    private const KEEP = 30;

    /** What the donor and the public tracking page see: no tracking internals, never who acted. */
    public static function of(Donation $donation): ?array
    {
        $delivery = self::read($donation);
        if (empty($delivery['history'])) {
            return null;
        }
        $history = array_map(fn ($h) => array_filter([
            'stage' => $h['stage'] ?? null,
            'at' => $h['at'] ?? null,
            'note' => $h['note'] ?? null,
            'photos' => ! empty($h['photos']) ? array_values($h['photos']) : null,
            'distribution' => isset($h['distribution']['id']) ? array_filter([
                'id' => $h['distribution']['id'],
                'title' => $h['distribution']['title'] ?? null,
                'place' => $h['distribution']['place'] ?? null,
            ]) : null,
        ], fn ($v) => $v !== null && $v !== ''), $delivery['history']);

        return array_filter([
            'stage' => $delivery['stage'] ?? null,
            'hold' => $delivery['hold'] ?? null,
            'history' => array_values($history),
        ], fn ($v) => $v !== null);
    }

    /** Current progress stage (null before the first one). */
    public static function stageOf(Donation $donation): ?string
    {
        return self::read($donation)['stage'] ?? null;
    }

    public static function rank(?string $stage): int
    {
        $i = $stage ? array_search($stage, self::STAGES, true) : false;

        return $i === false ? -1 : (int) $i;
    }

    /** Adds one line and saves. */
    public static function append(Donation $donation, array $entry): void
    {
        $history = self::read($donation)['history'];
        $history[] = array_filter($entry, fn ($v) => $v !== null && $v !== '' && $v !== []);
        self::write($donation, $history);
    }

    /** Removes the last line (a mistaken update) and saves; false when there was nothing to undo. */
    public static function undoLast(Donation $donation): bool
    {
        $history = self::read($donation)['history'];
        if (! $history) {
            return false;
        }
        array_pop($history);
        self::write($donation, $history);

        return true;
    }

    /** Removes every line a distribution added (when that distribution is deleted) and saves. */
    public static function removeDistribution(Donation $donation, int $distributionId): void
    {
        $history = array_values(array_filter(
            self::read($donation)['history'],
            fn ($h) => (int) ($h['distribution']['id'] ?? 0) !== $distributionId,
        ));
        self::write($donation, $history);
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

    /* ── internals ── */

    private static function read(Donation $donation): array
    {
        $tracking = is_array($donation->tracking_data) ? $donation->tracking_data : [];
        $delivery = is_array($tracking['delivery'] ?? null) ? $tracking['delivery'] : [];
        $delivery['history'] = is_array($delivery['history'] ?? null) ? array_values($delivery['history']) : [];

        return $delivery;
    }

    /** Stage = last progress line; hold = an on_hold line with no progress after it. */
    private static function write(Donation $donation, array $history): void
    {
        $history = array_slice(array_values($history), -self::KEEP);
        $stage = null;
        $hold = null;
        foreach ($history as $h) {
            if (($h['stage'] ?? null) === self::ON_HOLD) {
                $hold = array_filter(['note' => $h['note'] ?? null, 'at' => $h['at'] ?? null]);
            } elseif (in_array($h['stage'] ?? null, self::STAGES, true)) {
                $stage = $h['stage'];
                $hold = null;
            }
        }

        $tracking = is_array($donation->tracking_data) ? $donation->tracking_data : [];
        if ($history) {
            $tracking['delivery'] = array_filter(['stage' => $stage, 'hold' => $hold, 'history' => $history], fn ($v) => $v !== null);
        } else {
            unset($tracking['delivery']);
        }
        $donation->forceFill(['tracking_data' => $tracking ?: null])->save();
    }
}
