<?php

namespace App\Http\Requests\DonationCampaign;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDonationCampaignRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'faq_category_id' => ['sometimes', 'nullable', 'integer', 'exists:faq_categories,id'],
            'name_ar' => ['required', 'string', 'max:255'],
            'name_en' => ['nullable', 'string', 'max:255'],

            'slug' => [
                'required',
                'string',
                'max:255',
                Rule::unique('donation_campaigns', 'slug')
                    ->ignore($this->donationCampaign),
            ],

            'description_ar' => ['nullable', 'string'],
            'description_en' => ['nullable', 'string'],

            // An uploaded image, or a URL / storage path (media library).
            'image' => $this->hasFile('image')
                ? ['nullable', 'image', 'mimes:jpg,jpeg,png,webp,avif', 'max:5120']
                : ['nullable', 'string', 'max:2048'],

            'target_amount' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'minimum_amount' => [
                'nullable',
                'numeric',
                'min:1',
            ],

            'donation_available' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],

            // Landing page edited from the dashboard.
            'category_id' => ['sometimes', 'nullable', 'integer', 'exists:donation_campaign_categories,id'],
            'subtitle_ar' => ['sometimes', 'nullable', 'string', 'max:500'],
            'subtitle_en' => ['sometimes', 'nullable', 'string', 'max:500'],
            'landing_slug' => ['sometimes', 'nullable', 'string', 'max:120'],
            'page_content' => ['sometimes', 'nullable', 'array'],
            'seo' => ['sometimes', 'nullable', 'array'],
            'faqs' => ['sometimes', 'nullable', 'array', 'max:60'],
            'faqs.*' => ['array'],
        ];
    }
}