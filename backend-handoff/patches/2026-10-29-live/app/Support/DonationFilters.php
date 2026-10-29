<?php

namespace App\Support;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

/**
 * The dashboard's donation filters, in one place: the list (GET /donations), the totals
 * (GET /donations/stats) and exports all read the same query-string keys, so a number on the
 * screen always describes exactly the rows below it.
 *
 *   status              paid | pending | failed | refunded … (comma-separated allowed)
 *   payment_method_id   one id or comma-separated ids
 *   channel             gateway | manual
 *   program_id, project_id, donation_campaign_id, case_id
 *   target              program | project | campaign | case  (any donation of that kind)
 *   from, to            Y-m-d (created_at, inclusive)
 *   q                   reference, donor name / phone / email
 */
final class DonationFilters
{
    /** @param string[] $except filter keys to skip (e.g. the stats breakdown by status skips "status") */
    public static function apply(Builder $query, Request $request, array $except = []): Builder
    {
        $use = fn (string $key) => ! in_array($key, $except, true) && $request->filled($key);

        if ($use('status')) {
            $query->whereIn('status', self::list($request->input('status')));
        }
        if ($use('payment_method_id')) {
            $query->whereIn('payment_method_id', array_map('intval', self::list($request->input('payment_method_id'))));
        }
        if ($use('channel')) {
            $gateway = PaymentMethodKind::gatewayMethodIds();
            $request->input('channel') === 'gateway'
                ? $query->whereIn('payment_method_id', $gateway)
                : $query->where(fn ($q) => $q->whereNotIn('payment_method_id', $gateway)->orWhereNull('payment_method_id'));
        }
        foreach (['program_id', 'project_id', 'donation_campaign_id', 'case_id'] as $field) {
            if ($use($field)) {
                $query->where($field, (int) $request->input($field));
            }
        }
        if ($use('target')) {
            $column = ['program' => 'program_id', 'project' => 'project_id', 'campaign' => 'donation_campaign_id', 'case' => 'case_id'][$request->input('target')] ?? null;
            if ($column) {
                $query->whereNotNull($column);
            }
        }
        if ($use('from')) {
            $query->whereDate('created_at', '>=', (string) $request->input('from'));
        }
        if ($use('to')) {
            $query->whereDate('created_at', '<=', (string) $request->input('to'));
        }
        if ($use('q')) {
            $term = '%' . str_replace(['%', '_'], ['\%', '\_'], trim((string) $request->input('q'))) . '%';
            $query->where(fn ($q) => $q
                ->where('transaction_reference', 'like', $term)
                ->orWhere('payment_reference', 'like', $term)
                ->orWhere('donor_name', 'like', $term)
                ->orWhere('donor_phone', 'like', $term)
                ->orWhereHas('donor', fn ($d) => $d
                    ->where('name', 'like', $term)
                    ->orWhere('phone', 'like', $term)
                    ->orWhere('email', 'like', $term)));
        }

        return $query;
    }

    /** @return string[] */
    private static function list(mixed $value): array
    {
        $items = is_array($value) ? $value : explode(',', (string) $value);

        return array_values(array_filter(array_map(fn ($v) => trim((string) $v), $items), fn ($v) => $v !== ''));
    }
}
