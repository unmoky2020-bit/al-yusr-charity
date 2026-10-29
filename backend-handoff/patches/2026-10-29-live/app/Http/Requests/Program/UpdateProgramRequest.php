<?php

namespace App\Http\Requests\Program;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProgramRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $programId = $this->route('program')?->id ?? $this->route('program');

        return [
            'faq_category_id' => ['sometimes', 'nullable', 'integer', 'exists:faq_categories,id'],
            'axis_id' => 'sometimes|nullable|exists:axes,id',
            'season_ids' => 'sometimes|nullable|array',
            'season_ids.*' => 'integer|exists:seasons,id',

            'slug' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('programs', 'slug')->ignore($programId),
            ],

            'title_ar' => 'sometimes|required|string|max:255',
            'title_en' => 'nullable|string|max:255',

            'name_ar' => 'nullable|string|max:255',
            'name_en' => 'nullable|string|max:255',

            'period_ar' => 'nullable|string|max:255',
            'period_en' => 'nullable|string|max:255',

            'tagline_ar' => 'nullable|string|max:255',
            'tagline_en' => 'nullable|string|max:255',
            'top_section' => 'sometimes|nullable|array',
            'top_section.*.key' => 'required|string|max:50',
            'top_section.*.title_ar' => 'required|string|max:255',
            'top_section.*.title_en' => 'nullable|string|max:255',
            'top_section.*.url' => 'nullable|string|max:500',
            'top_section.*.icon' => 'nullable|string|max:100',
            'top_section.*.is_enabled' => 'sometimes|boolean',
            'top_section.*.sort_order' => 'sometimes|integer|min:0',
            'donation_available' => 'nullable|boolean',

            'description_ar' => 'sometimes|required|string',
            'description_en' => 'nullable|string',

            'content_ar' => 'nullable|string',
            'content_en' => 'nullable|string',

            'benefits_ar' => 'nullable|array',
            'benefits_ar.*' => 'string',

            'benefits_en' => 'nullable|array',
            'benefits_en.*' => 'string',
            'hero_h1_ar' => 'sometimes|nullable|string|max:255',
            'hero_h1_en' => 'sometimes|nullable|string|max:255',
            'hero_h3_ar' => 'sometimes|nullable|string|max:255',
            'hero_h3_en' => 'sometimes|nullable|string|max:255',
            // Each image: an uploaded file, or a URL / storage path (media library).
            'hero_image' => $this->hasFile('hero_image') ? 'sometimes|nullable|image|mimes:jpg,jpeg,png,webp,avif|max:5120' : 'sometimes|nullable|string|max:2048',

            'image' => $this->hasFile('image') ? 'sometimes|nullable|image|mimes:jpg,jpeg,png,webp,avif|max:5120' : 'sometimes|nullable|string|max:2048',

            'target_amount' => 'nullable|numeric|min:0',
            'minimum_amount' => 'nullable|numeric|min:0',

            'status' => 'nullable|in:draft,published',
            'sort_order' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
            'hide_from_audience' => 'nullable|boolean',

            'meta_title_ar' => 'nullable|string|max:255',
            'meta_title_en' => 'nullable|string|max:255',
            'meta_description_ar' => 'nullable|string',
            'meta_description_en' => 'nullable|string',

            'keywords_ar' => 'nullable|string',
            'keywords_en' => 'nullable|string',

            'canonical_url' => 'nullable|url|max:2048',

            'schema_type' => 'nullable|string|max:100',
            'twitter_card' => 'nullable|string|max:100',

            'noindex' => 'nullable|boolean',
            'nofollow' => 'nullable|boolean',

            'geo_region' => 'nullable|string|max:255',
            'geo_placename' => 'nullable|string|max:255',
            'geo_position' => 'nullable|string|max:255',
            'geo_position_label' => 'nullable|string|max:255',

            'ai_summary_ar' => 'nullable|string',
            'ai_summary_en' => 'nullable|string',
            'ai_faq_ar' => 'nullable|string',
            'ai_faq_en' => 'nullable|string',
        ];
    }
}