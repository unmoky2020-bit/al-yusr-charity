<?php

namespace App\Support\Impact;

use App\Models\CaseModel;
use App\Models\Donation;
use App\Models\Impact\CaseItem;
use App\Models\Impact\CaseOutcome;
use App\Models\Impact\Distribution;
use App\Support\DeliverySteps;
use Illuminate\Support\Collection;

/**
 * The numbers behind the impact report, all from real records: paid donations and their delivery
 * trails, distribution days, case spending lines and case outcomes. Nothing is estimated.
 */
final class ImpactNumbers
{
    public const CACHE_KEY = 'impact.overview.v1';

    /** Drops the cached public report after any change that moves its numbers. */
    public static function forget(): void
    {
        try {
            \Illuminate\Support\Facades\Cache::forget(self::CACHE_KEY);
        } catch (\Throwable $e) {
            report($e);
        }
    }

    /** Paid donations with only the columns the report needs (read once per request). */
    public static function paid(): Collection
    {
        static $rows = null;

        return $rows ??= Donation::where('status', 'paid')
            ->get(['id', 'amount', 'donor_id', 'program_id', 'project_id', 'donation_campaign_id', 'case_id', 'tracking_data', 'created_at']);
    }

    /** Totals of a set of paid donations: money, donors, and where they stand on the way to families. */
    public static function donations(Collection $rows): array
    {
        $stages = $rows->map(fn (Donation $d) => DeliverySteps::stageOf($d));

        return [
            'collected' => round((float) $rows->sum('amount'), 2),
            'donations' => $rows->count(),
            'donors' => $rows->pluck('donor_id')->filter()->unique()->count(),
            'delivered' => $stages->filter(fn ($s) => $s === 'delivered')->count(),
            'on_the_way' => $stages->filter(fn ($s) => in_array($s, ['family_identified', 'preparing'], true))->count(),
        ];
    }

    /** Distribution days (public ones for visitors), newest first. */
    public static function distributions(?string $kind = null, ?int $id = null, bool $publicOnly = true): Collection
    {
        $q = Distribution::query()->latest('happened_on')->latest('id');
        if ($publicOnly) {
            $q->where('is_public', true);
        }
        if ($kind) {
            $q->where('target_kind', $kind)->where('target_id', $id);
        }

        return $q->get();
    }

    /** Cases under a program / project / campaign (or every case), published ones for visitors. */
    public static function cases(?string $kind = null, ?int $id = null): Collection
    {
        $q = CaseModel::query()->whereIn('status', ['approved', 'completed']);
        if ($kind && $kind !== 'case' && isset(Targets::COLUMN[$kind])) {
            $q->where(Targets::COLUMN[$kind], $id);
        } elseif ($kind === 'case') {
            $q->whereKey($id);
        }

        return $q->get(['id', 'code', 'title', 'city', 'governorate', 'status', 'target_amount', 'cover_image', 'updated_at']);
    }

    /** Spending and outcomes of a set of cases. */
    public static function casesSummary(Collection $cases): array
    {
        $ids = $cases->pluck('id');
        $items = CaseItem::whereIn('case_id', $ids)->get();

        return [
            'cases' => $cases->count(),
            'completed' => CaseOutcome::whereIn('case_id', $ids)->where('result', 'completed')->count(),
            'spent' => round((float) $items->sum(fn (CaseItem $i) => $i->spent()), 2),
            'items_delivered' => $items->where('status', 'delivered')->count(),
        ];
    }

    /** One public card of a distribution day (no donor data). */
    public static function distributionCard(Distribution $d): array
    {
        return array_filter([
            'id' => $d->id,
            'title' => $d->title,
            'happened_on' => optional($d->happened_on)->toDateString(),
            'place' => $d->place(),
            'stage' => $d->stage,
            'note' => $d->note,
            'photos' => array_values(array_slice($d->photos ?? [], 0, 6)),
            'families_count' => $d->families_count,
            'donations_count' => $d->donations_count,
            'target' => $d->target_kind ? Targets::card($d->target_kind, Targets::find($d->target_kind, (int) $d->target_id)) : null,
        ], fn ($v) => $v !== null && $v !== '' && $v !== []);
    }

    /** Paid money per month for the last 12 months. */
    public static function monthly(Collection $rows): array
    {
        $out = [];
        for ($i = 11; $i >= 0; $i--) {
            $m = now()->startOfMonth()->subMonths($i)->format('Y-m');
            $out[$m] = ['month' => $m, 'amount' => 0.0, 'count' => 0];
        }
        foreach ($rows as $d) {
            $m = optional($d->created_at)->format('Y-m');
            if ($m && isset($out[$m])) {
                $out[$m]['amount'] += (float) $d->amount;
                $out[$m]['count']++;
            }
        }

        return array_values(array_map(fn ($r) => ['month' => $r['month'], 'amount' => round($r['amount'], 2), 'count' => $r['count']], $out));
    }
}
