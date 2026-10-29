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
            'name' => 'required|string|max:255',
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
            'target_amount' => 'required|numeric|min:0',
            'collected_amount' => 'nullable|numeric|min:0',
            'starting_price' => 'nullable|numeric|min:0',
            'display_order' => 'sometimes|integer|min:0',
            // An uploaded file, or a URL / storage path (media library).
            'cover_image' => $this->hasFile('cover_image') ? 'sometimes|nullable|image|mimes:jpg,jpeg,png,webp,avif|max:5120' : 'sometimes|nullable|string|max:2048',
            'is_active' => 'sometimes|boolean',
        ];
    }
}