<?php

namespace App\Http\Controllers\Api\V1\Engagement;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * Daily counters for the homepage strips (9 Nov 2026), so «إحصائيات التفاعل» shows every visitor,
 * not only the clicks made in the admin's own browser tab:
 *   POST   /engagement               { scope, slug, kind }        public, rate-limited
 *   GET    /admin/engagement?days=30 → totals and one row per card
 *   DELETE /admin/engagement?scope=  → start counting again
 * No visitor data is stored: only (scope, card, kind, day) → count.
 */
class EngagementController extends Controller
{
    private const SCOPES = ['campaigns'];
    private const KINDS = ['section_view', 'card_view', 'details_click', 'donate_click'];

    public function record(Request $request): JsonResponse
    {
        $data = $request->validate([
            'scope' => ['required', Rule::in(self::SCOPES)],
            'slug' => ['required', 'string', 'max:120', 'regex:/^[A-Za-z0-9_\-]+$/'],
            'kind' => ['required', Rule::in(self::KINDS)],
        ]);

        DB::statement(
            'INSERT INTO engagement_counters (scope, slug, kind, day, count) VALUES (?, ?, ?, ?, 1)
             ON DUPLICATE KEY UPDATE count = count + 1',
            [$data['scope'], mb_strtolower($data['slug']), $data['kind'], now()->toDateString()],
        );

        return response()->json(['ok' => true], 202);
    }

    public function index(Request $request): JsonResponse
    {
        $data = $request->validate([
            'scope' => ['sometimes', Rule::in(self::SCOPES)],
            'days' => ['sometimes', 'integer', 'min:1', 'max:365'],
        ]);
        $scope = $data['scope'] ?? 'campaigns';
        $days = (int) ($data['days'] ?? 30);
        $from = now()->subDays($days - 1)->toDateString();

        $rows = DB::table('engagement_counters')
            ->where('scope', $scope)
            ->where('day', '>=', $from)
            ->selectRaw('slug, kind, SUM(count) AS total')
            ->groupBy('slug', 'kind')
            ->get();

        $bySlug = [];
        $totals = array_fill_keys(self::KINDS, 0);
        foreach ($rows as $r) {
            $bySlug[$r->slug] ??= array_fill_keys(self::KINDS, 0);
            $bySlug[$r->slug][$r->kind] = (int) $r->total;
            $totals[$r->kind] += (int) $r->total;
        }
        $cards = collect($bySlug)
            ->map(fn ($counts, $slug) => ['slug' => (string) $slug] + $counts)
            ->sortByDesc(fn ($c) => $c['donate_click'] * 1000 + $c['details_click'])
            ->values();

        $last = DB::table('engagement_counters')->where('scope', $scope)->max('day');

        return response()->json([
            'data' => [
                'scope' => $scope,
                'from' => $from,
                'to' => now()->toDateString(),
                'totals' => $totals,
                'cards' => $cards,
                'last_event_day' => $last,
            ],
        ]);
    }

    public function reset(Request $request): JsonResponse
    {
        $data = $request->validate(['scope' => ['sometimes', Rule::in(self::SCOPES)]]);
        $deleted = DB::table('engagement_counters')->where('scope', $data['scope'] ?? 'campaigns')->delete();

        return response()->json(['message' => 'اتصفّرت العدادات.', 'deleted' => $deleted]);
    }
}
