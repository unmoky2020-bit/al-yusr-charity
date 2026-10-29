<?php

namespace App\Http\Requests\Story;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $storyId = $this->route('story')?->id ?? $this->route('story');

        return [
            'quote_ar' => ['sometimes', 'nullable', 'string', 'max:300'],
            'quote_en' => ['sometimes', 'nullable', 'string', 'max:300'],
            'program_id' => ['sometimes', 'nullable', 'integer', 'exists:programs,id'],
            'slug' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('stories','slug')->ignore($storyId),
            ],
            'title_ar' => ['sometimes','required','string','max:255'],
            'title_en' => ['nullable','string','max:255'],
            'category_ar' => ['nullable','string','max:255'],
            'category_en' => ['nullable','string','max:255'],
            'beneficiary_name' => ['nullable','string','max:255'],
            'location_ar' => ['nullable','string','max:255'],
            'location_en' => ['nullable','string','max:255'],
            'description_ar' => ['nullable','string'],
            'description_en' => ['nullable','string'],
            'cover_image' => ['nullable','image','max:5120'],
            'cover_image_url' => ['nullable','url','max:2048'],
            'sort_order' => ['nullable','integer'],
            'status' => ['nullable',Rule::in(['draft','published'])],
            'is_featured' => ['nullable','boolean'],
        ];
    }
}
