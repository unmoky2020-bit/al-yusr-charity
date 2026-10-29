<?php

namespace App\Http\Requests\DonationCampaign;

use Illuminate\Foundation\Http\FormRequest;

class StoreDonationCampaignCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name_ar' => ['required', 'string', 'max:255'],
            'name_en' => ['nullable', 'string', 'max:255'],
            'slug' => [
                'required',
                'string',
                'max:255',
                'unique:donation_campaign_categories,slug',
            ],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
