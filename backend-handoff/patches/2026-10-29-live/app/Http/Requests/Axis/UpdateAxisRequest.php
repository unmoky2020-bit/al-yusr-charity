<?php

namespace App\Http\Requests\Axis;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAxisRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $axis = $this->route('axis');

        $id = is_object($axis) ? $axis->id : $axis;

        return [
            'faq_category_id' => ['sometimes', 'nullable', 'integer', 'exists:faq_categories,id'],
            'slug' => ['sometimes','string','max:255',Rule::unique('axes','slug')->ignore($id)],
            'name_ar' => ['sometimes','string','max:255'],
            'name_en' => ['sometimes','string','max:255'],
            'description_ar' => ['nullable','string'],
            'description_en' => ['nullable','string'],
            'image' => ['nullable','image','mimes:jpg,jpeg,png,webp','max:5120'],
            'badge_ar' => ['nullable','string','max:255'],
            'badge_en' => ['nullable','string','max:255'],
            'statistics' => ['nullable','array'],
            'features_ar' => ['nullable','array'],
            'features_en' => ['nullable','array'],
            'sort_order' => ['nullable','integer','min:0'],
            'is_active' => ['nullable','boolean'],
        ];
    }
}
