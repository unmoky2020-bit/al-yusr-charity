<?php

namespace App\Http\Controllers\Api\V1\Reports;

use App\Http\Controllers\Controller;
use App\Models\Donation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * GET /reports/donors?from=&to=&paid_only=1 — the customer sheet: one row per donor with contact
 * details and giving totals (9 Nov 2026). Money counts PAID donations only; pending ones are
 * counted separately. Permission: donors.view. The dashboard turns it into an Excel file.
 */
class DonorsReportController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
            'paid_only' => ['sometimes', 'boolean'],
        ]);
        $from = $request->date('from')?->startOfDay();
        $to = $request->date('to')?->endOfDay();

        $totals = DB::table('donations')
            ->selectRaw("donor_id,
                COUNT(*) AS donations_count,
                SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) AS paid_count,
                SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS paid_total,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
                MIN(created_at) AS first_donation_at,
                MAX(created_at) AS last_donation_at,
                MAX(id) AS last_donation_id")
            ->whereNotNull('donor_id')
            ->when($from, fn ($q) => $q->where('created_at', '>=', $from))
            ->when($to, fn ($q) => $q->where('created_at', '<=', $to))
            ->groupBy('donor_id');

        $donorColumns = array_flip(Schema::getColumnListing('donors'));
        $optional = array_values(array_filter(['address', 'city', 'governorate', 'notes'], fn ($c) => isset($donorColumns[$c])));

        $rows = DB::table('donors')
            ->joinSub($totals, 't', 't.donor_id', '=', 'donors.id')
            ->when($request->boolean('paid_only'), fn ($q) => $q->where('t.paid_count', '>', 0))
            ->orderByDesc('t.paid_total')
            ->orderByDesc('t.last_donation_at')
            ->get(array_merge(
                ['donors.id', 'donors.name', 'donors.email', 'donors.phone', 'donors.created_at'],
                array_map(fn ($c) => "donors.$c", $optional),
                ['t.donations_count', 't.paid_count', 't.paid_total', 't.pending_count', 't.first_donation_at', 't.last_donation_at', 't.last_donation_id'],
            ));

        // Last donation of each donor: its method and what it went to.
        $last = Donation::with(['program:id,name_ar', 'donationCampaign:id,name_ar', 'project:id,name_ar', 'case:id,title'])
            ->whereIn('id', $rows->pluck('last_donation_id')->filter()->all())
            ->get(['id', 'payment_method', 'program_id', 'donation_campaign_id', 'project_id', 'case_id', 'pickup_city', 'pickup_governorate'])
            ->keyBy('id');

        // Accounts on the site (same email).
        $emails = $rows->pluck('email')->filter()->map(fn ($e) => mb_strtolower($e))->unique()->values();
        $accounts = $emails->isEmpty() ? collect() : DB::table('users')
            ->whereIn(DB::raw('LOWER(email)'), $emails->all())
            ->whereNull('deleted_at')
            ->get(['id', 'email'])
            ->keyBy(fn ($u) => mb_strtolower((string) $u->email));

        $data = $rows->map(function ($r) use ($last, $accounts) {
            $d = $last->get($r->last_donation_id);
            $target = $d?->program?->name_ar ?? $d?->donationCampaign?->name_ar ?? $d?->project?->name_ar ?? $d?->case?->title;

            return [
                'id' => $r->id,
                'name' => $r->name,
                'email' => $r->email,
                'phone' => $r->phone,
                'address' => $r->address ?? null,
                'city' => $r->city ?? $d?->pickup_city,
                'governorate' => $r->governorate ?? $d?->pickup_governorate,
                'has_account' => $r->email ? $accounts->has(mb_strtolower($r->email)) : false,
                'donations_count' => (int) $r->donations_count,
                'paid_count' => (int) $r->paid_count,
                'paid_total' => round((float) $r->paid_total, 2),
                'pending_count' => (int) $r->pending_count,
                'first_donation_at' => $r->first_donation_at,
                'last_donation_at' => $r->last_donation_at,
                'last_payment_method' => $d?->payment_method,
                'last_target' => $target,
                'donor_since' => $r->created_at,
            ];
        })->values();

        return response()->json([
            'data' => $data,
            'meta' => [
                'count' => $data->count(),
                'paid_total' => round((float) $data->sum('paid_total'), 2),
                'from' => $from?->toDateString(),
                'to' => $to?->toDateString(),
                'generated_at' => now()->toIso8601String(),
            ],
        ]);
    }
}
