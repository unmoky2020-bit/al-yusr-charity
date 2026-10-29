<?php

namespace App\Http\Controllers\Api\V1\Donation;

use App\Http\Controllers\Controller;
use App\Models\CaseModel;
use App\Models\Donation;
use App\Models\DonationCampaign;
use App\Models\PaymentMethod;
use App\Models\Program;
use App\Models\Project;
use App\Support\DonationFilters;
use App\Support\PaymentMethodKind;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * GET /api/v1/donations/stats — totals for the dashboard, computed by the database over ALL
 * matching donations (not the current page). Accepts the same filters as GET /donations.
 *
 * Money figures only ever count paid donations; pending / failed / refunded are reported as counts
 * (and their amounts separately) so they can never inflate the "received" total.
 */
class DonationStatsController extends Controller
{
    private const MONTHS = 12;

    public function __invoke(Request $request): JsonResponse
    {
        $filtered = fn (array $except = []) => DonationFilters::apply(Donation::query(), $request, $except);

        // Status breakdown ignores the status filter, so the cards still show every status.
        $byStatus = $filtered(['status'])
            ->selectRaw('status, COUNT(*) AS count, COALESCE(SUM(amount), 0) AS amount')
            ->groupBy('status')
            ->get()
            ->mapWithKeys(fn ($r) => [$r->status => ['count' => (int) $r->count, 'amount' => (float) $r->amount]]);

        $paid = $filtered()->where('status', 'paid');
        $paidCount = (clone $paid)->count();
        $paidAmount = (float) (clone $paid)->sum('amount');
        $finished = ($byStatus['paid']['count'] ?? 0) + ($byStatus['failed']['count'] ?? 0);

        return response()->json(['data' => [
            'currency' => 'EGP',
            'total_count' => $filtered()->count(),
            'paid' => [
                'count' => $paidCount,
                'amount' => $paidAmount,
                'average' => $paidCount ? round($paidAmount / $paidCount, 2) : 0,
                'donors' => (clone $paid)->distinct()->count('donor_id'),
            ],
            'by_status' => $byStatus,
            // Paid ÷ (paid + failed): pending donations are still undecided, so they are left out.
            'success_rate' => $finished ? round(($byStatus['paid']['count'] ?? 0) / $finished * 100, 1) : null,
            'by_channel' => $this->byChannel($filtered),
            'by_method' => $this->byMethod($filtered),
            'by_target' => $this->byTarget($filtered),
            'monthly' => $this->monthly($filtered),
        ]]);
    }

    private function byChannel(callable $filtered): array
    {
        $gateway = PaymentMethodKind::gatewayMethodIds();
        $row = fn (bool $isGateway) => $filtered(['channel'])
            ->where('status', 'paid')
            ->when($isGateway,
                fn ($q) => $q->whereIn('payment_method_id', $gateway),
                fn ($q) => $q->where(fn ($w) => $w->whereNotIn('payment_method_id', $gateway)->orWhereNull('payment_method_id')))
            ->selectRaw('COUNT(*) AS count, COALESCE(SUM(amount), 0) AS amount')
            ->first();

        $g = $row(true);
        $m = $row(false);

        return [
            'gateway' => ['count' => (int) $g->count, 'amount' => (float) $g->amount],
            'manual' => ['count' => (int) $m->count, 'amount' => (float) $m->amount],
        ];
    }

    private function byMethod(callable $filtered): array
    {
        $names = PaymentMethod::query()->get(['id', 'name_ar', 'name_en', 'type'])->keyBy('id');

        return $filtered()
            ->selectRaw("payment_method_id, COUNT(*) AS count, COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) AS paid_amount, SUM(status = 'paid') AS paid_count")
            ->groupBy('payment_method_id')
            ->orderByDesc('paid_amount')
            ->get()
            ->map(fn ($r) => [
                'payment_method_id' => $r->payment_method_id ? (int) $r->payment_method_id : null,
                'name_ar' => $names[$r->payment_method_id]->name_ar ?? 'غير محدد',
                'name_en' => $names[$r->payment_method_id]->name_en ?? 'Unknown',
                'type' => $names[$r->payment_method_id]->type ?? null,
                'count' => (int) $r->count,
                'paid_count' => (int) $r->paid_count,
                'paid_amount' => (float) $r->paid_amount,
            ])
            ->values()
            ->all();
    }

    /** Paid money per program / project / campaign / case (top 10 of each kind). */
    private function byTarget(callable $filtered): array
    {
        $kinds = [
            'program' => ['program_id', Program::class, fn ($m) => $m->name_ar ?: $m->name],
            'project' => ['project_id', Project::class, fn ($m) => $m->name],
            'campaign' => ['donation_campaign_id', DonationCampaign::class, fn ($m) => $m->name_ar],
            'case' => ['case_id', CaseModel::class, fn ($m) => $m->title],
        ];

        $out = [];
        foreach ($kinds as $kind => [$column, $model, $label]) {
            $rows = $filtered()
                ->where('status', 'paid')
                ->whereNotNull($column)
                ->selectRaw("{$column} AS target_id, COUNT(*) AS count, SUM(amount) AS amount")
                ->groupBy($column)
                ->orderByDesc('amount')
                ->limit(10)
                ->get();
            $records = $model::query()->whereIn('id', $rows->pluck('target_id'))->get()->keyBy('id');
            $out[$kind] = $rows->map(fn ($r) => [
                'id' => (int) $r->target_id,
                'name' => isset($records[$r->target_id]) ? (string) $label($records[$r->target_id]) : "#{$r->target_id}",
                'count' => (int) $r->count,
                'amount' => (float) $r->amount,
            ])->values()->all();
        }

        return $out;
    }

    /** Paid amount and count per month for the last 12 months (months without donations are 0). */
    private function monthly(callable $filtered): array
    {
        $start = now()->startOfMonth()->subMonths(self::MONTHS - 1);
        $rows = $filtered(['from', 'to'])
            ->where('status', 'paid')
            ->where('created_at', '>=', $start)
            ->selectRaw("DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS count, SUM(amount) AS amount")
            ->groupBy('month')
            ->get()
            ->keyBy('month');

        $series = [];
        for ($i = 0; $i < self::MONTHS; $i++) {
            $month = $start->copy()->addMonths($i)->format('Y-m');
            $series[] = [
                'month' => $month,
                'count' => (int) ($rows[$month]->count ?? 0),
                'amount' => (float) ($rows[$month]->amount ?? 0),
            ];
        }

        return $series;
    }
}
