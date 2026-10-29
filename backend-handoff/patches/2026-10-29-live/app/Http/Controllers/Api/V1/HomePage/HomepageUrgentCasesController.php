<?php

namespace App\Http\Controllers\Api\V1\HomePage;

use App\Http\Controllers\Controller;
use App\Http\Resources\CaseResource;
use App\Models\CaseModel;
use App\Models\Setting;
use Illuminate\Http\Request;

/**
 * Homepage «حالات عاجلة» carousel. Settings live as one JSON row in `settings`
 * (key homepage_urgent_cases, group homepage):
 *   mode "auto"   → approved cases with priority "high" (= عاجلة), nearest deadline first
 *   mode "manual" → exactly the case ids the admin picked, in that order (approved ones only)
 *
 *   GET /homepage/urgent-cases   public  → { settings, data: [cases] }
 *   PUT /homepage/urgent-cases   homepage.update
 */
class HomepageUrgentCasesController extends Controller
{
    private const KEY = 'homepage_urgent_cases';

    private const DEFAULTS = [
        'is_active' => true,
        'mode' => 'auto',
        'case_ids' => [],
        'limit' => 8,
        'title_ar' => 'حالات عاجلة محتاجة دعمك',
        'title_en' => 'Urgent cases that need you',
        'subtitle_ar' => null,
        'subtitle_en' => null,
    ];

    private function settings(): array
    {
        $row = Setting::where('key', self::KEY)->first();

        return array_merge(self::DEFAULTS, $row ? (json_decode($row->value, true) ?: []) : []);
    }

    public function show()
    {
        $settings = $this->settings();
        $relations = ['categoryRelation', 'program', 'project', 'donationCampaign'];
        $limit = max(1, min((int) $settings['limit'], 24));

        if (!$settings['is_active']) {
            return response()->json(['settings' => $settings, 'data' => []]);
        }

        if ($settings['mode'] === 'manual') {
            $ids = array_values(array_filter(array_map('intval', $settings['case_ids'] ?? [])));
            $cases = CaseModel::with($relations)
                ->whereIn('id', $ids ?: [0])
                ->where('status', 'approved')
                ->get()
                ->sortBy(fn ($c) => array_search($c->id, $ids, true))
                ->take($limit)
                ->values();
        } else {
            $cases = CaseModel::with($relations)
                ->where('status', 'approved')
                ->where('priority', 'high')
                ->orderByRaw('deadline IS NULL, deadline ASC')
                ->latest()
                ->take($limit)
                ->get();
        }

        return response()->json([
            'settings' => $settings,
            'data' => CaseResource::collection($cases),
        ]);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'is_active' => 'required|boolean',
            'mode' => 'required|in:auto,manual',
            'case_ids' => 'nullable|array|max:24',
            'case_ids.*' => 'integer|exists:case_models,id',
            'limit' => 'required|integer|min:1|max:24',
            'title_ar' => 'nullable|string|max:200',
            'title_en' => 'nullable|string|max:200',
            'subtitle_ar' => 'nullable|string|max:400',
            'subtitle_en' => 'nullable|string|max:400',
        ]);

        Setting::updateOrCreate(
            ['key' => self::KEY],
            ['value' => json_encode($data, JSON_UNESCAPED_UNICODE), 'type' => 'json', 'group' => 'homepage']
        );

        return $this->show();
    }
}
