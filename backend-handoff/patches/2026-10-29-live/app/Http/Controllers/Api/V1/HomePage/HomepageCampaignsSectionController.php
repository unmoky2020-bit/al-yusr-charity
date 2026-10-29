<?php

namespace App\Http\Controllers\Api\V1\HomePage;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

/**
 * Homepage "حملات تصنع الأثر" strip settings, stored as one JSON row in `settings`
 * (key homepage_campaigns_section, group homepage) — no extra table.
 *   GET /homepage/campaigns-section  public; { data: null } until an admin saves it (the site then uses its defaults)
 *   PUT /homepage/campaigns-section  homepage.update
 */
class HomepageCampaignsSectionController extends Controller
{
    private const KEY = 'homepage_campaigns_section';

    public function show()
    {
        $row = Setting::where('key', self::KEY)->first();

        // Not saved yet: the site and the dashboard fall back to their defaults.
        if (!$row) {
            return response()->json(['data' => null]);
        }

        return response()->json([
            'data' => [...(json_decode($row->value, true) ?: []), 'updated_at' => $row->updated_at],
        ]);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'is_active' => 'required|boolean',
            'scroll_speed' => 'required|numeric|min:0|max:100',
            'show_final_cta' => 'required|boolean',
            'enable_scroll_trigger' => 'required|boolean',
            'show_skip_button' => 'required|boolean',
            'title_ar' => 'nullable|string|max:200',
            'title_en' => 'nullable|string|max:200',
            'subtitle_ar' => 'nullable|string|max:500',
            'subtitle_en' => 'nullable|string|max:500',
            'enabled_slugs' => 'nullable|array',
            'enabled_slugs.*' => 'string|max:120',
            'disabled_slugs' => 'nullable|array',
            'disabled_slugs.*' => 'string|max:120',
            'cards' => 'nullable|array|max:60',
            'cards.*.carousel_item_id' => 'nullable|integer',
            'cards.*.source_type' => 'required_with:cards|in:program,campaign,project,custom',
            'cards.*.source_id' => 'nullable|string|max:60',
            'cards.*.slug' => 'required_with:cards|string|max:120',
            'cards.*.name_ar' => 'required_with:cards|string|max:200',
            'cards.*.name_en' => 'nullable|string|max:200',
            'cards.*.tagline_ar' => 'nullable|string|max:300',
            'cards.*.tagline_en' => 'nullable|string|max:300',
            'cards.*.image' => 'nullable|string|max:2048',
            'cards.*.price_from' => 'required_with:cards|numeric|min:0',
            'cards.*.details_url' => 'nullable|string|max:500',
            'cards.*.donate_url' => 'nullable|string|max:500',
            'cards.*.is_active' => 'required_with:cards|boolean',
            'cards.*.sort_order' => 'required_with:cards|integer|min:0',
        ]);

        $row = Setting::updateOrCreate(
            ['key' => self::KEY],
            ['value' => json_encode($data, JSON_UNESCAPED_UNICODE), 'type' => 'json', 'group' => 'homepage']
        );

        return response()->json([
            'message' => 'Saved successfully',
            'data' => [...$data, 'updated_at' => $row->updated_at],
        ]);
    }
}
