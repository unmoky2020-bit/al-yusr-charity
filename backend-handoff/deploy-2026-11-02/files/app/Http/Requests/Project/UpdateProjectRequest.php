<?php

namespace App\Http\Requests\Project;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $project = $this->route('project');
        $projectId = is_object($project) ? $project->id : $project;

        return [
            'faq_category_id' => ['sometimes', 'nullable', 'integer', 'exists:faq_categories,id'],
            'name' => 'sometimes|required|string|max:255',
            'name_en' => 'nullable|string|max:255',
            'slug' => [
                'nullable',
                'string',
                'max:255',
                'alpha_dash',
                Rule::unique('projects', 'slug')->ignore($projectId),
            ],
            'description' => 'nullable|string',
            'short_description' => 'nullable|string',
            'short_description_en' => 'nullable|string',
            'target_amount' => 'sometimes|required|numeric|min:0',
            'collected_amount' => 'nullable|numeric|min:0',
            'starting_price' => 'nullable|numeric|min:0',
            'display_order' => 'sometimes|integer|min:0',
            // An uploaded file, or a URL / storage path (media library).
            'cover_image' => $this->hasFile('cover_image') ? 'sometimes|nullable|image|mimes:jpg,jpeg,png,webp,avif|max:5120' : 'sometimes|nullable|string|max:2048',
            'is_active' => 'sometimes|boolean',
            // Landing-page fields
            'description_en' => 'nullable|string',
            'content_ar' => 'nullable|string',
            'content_en' => 'nullable|string',
            'benefits_ar' => 'nullable|array',
            'benefits_ar.*' => 'string|max:500',
            'benefits_en' => 'nullable|array',
            'benefits_en.*' => 'string|max:500',
            'page_content' => 'sometimes|nullable|array',
            'donation_available' => 'sometimes|boolean',
            'hide_from_audience' => 'sometimes|boolean',
            'meta_title_ar' => 'nullable|string|max:255',
            'meta_title_en' => 'nullable|string|max:255',
            'meta_description_ar' => 'nullable|string',
            'meta_description_en' => 'nullable|string',
            'keywords_ar' => 'nullable|string',
            'keywords_en' => 'nullable|string',
            'canonical_url' => 'nullable|url|max:2048',
            'schema_type' => 'nullable|string|max:100',
            'twitter_card' => 'nullable|string|max:100',
            'noindex' => 'sometimes|boolean',
            'nofollow' => 'sometimes|boolean',
            'geo_region' => 'nullable|string|max:255',
            'geo_placename' => 'nullable|string|max:255',
            'geo_position' => 'nullable|string|max:255',
            'geo_position_label' => 'nullable|string|max:255',
            'ai_summary_ar' => 'nullable|string',
            'ai_summary_en' => 'nullable|string',
            'ai_faq_ar' => 'nullable|array',
            'ai_faq_en' => 'nullable|array',
        ];
    }
}