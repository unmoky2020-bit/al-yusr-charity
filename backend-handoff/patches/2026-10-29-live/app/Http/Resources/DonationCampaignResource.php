<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class DonationCampaignResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        
        
$collectedAmount = (float) $this->donations()
    ->where('status', 'paid')
    ->sum('amount');

$targetAmount = (float) $this->target_amount;

$remainingAmount = $targetAmount > 0
    ? max(0, $targetAmount - $collectedAmount)
    : null;

// نسبة الإنجاز.
$completionPercentage = $targetAmount > 0
    ? min(100, round(
        ($collectedAmount / $targetAmount) * 100,
        2
    ))
    : null;
        $data = [
            'id' => $this->id,

            'category_id' => $this->category_id,

            'category' => $this->when(
                $this->relationLoaded('category') && $this->category,
                fn () => [
                    'id' => $this->category->id,
                    'name_ar' => $this->category->name_ar,
                    'name_en' => $this->category->name_en,
                    'slug' => $this->category->slug,
                ]
            ),

            'name_ar' => $this->name_ar,
            'name_en' => $this->name_en,
            'slug' => $this->slug,
            'faq_category_id' => $this->faq_category_id,
            'faq_category' => $this->faqCategory ? ['id' => $this->faqCategory->id, 'slug' => $this->faqCategory->slug, 'name_ar' => $this->faqCategory->name_ar] : null,

            'subtitle_ar' => $this->subtitle_ar,
            'subtitle_en' => $this->subtitle_en,

            'description_ar' => $this->description_ar,
            'description_en' => $this->description_en,

            'image' => $this->image
                ? (preg_match('#^https?://#', $this->image) ? $this->image : Storage::disk('public')->url($this->image))
                : null,
            'landing_slug' => $this->landing_slug,
            // Landing-page content is large: lists (index) send it only with ?include=content;
            // a single campaign (show / by-slug) always has it.
            $this->mergeWhen(
                $request->route()?->getActionMethod() !== 'index' || str_contains((string) $request->query('include'), 'content'),
                fn () => [
                    'page_content' => $this->page_content,
                    'seo' => $this->seo,
                    'faqs' => $this->faqs,
                ]
            ),
                
                'target_amount' => $this->target_amount,
'collected_amount' => number_format($collectedAmount, 2, '.', ''),
'remaining_amount' => $remainingAmount !== null
    ? number_format($remainingAmount, 2, '.', '')
    : null,
'completion_percentage' => $completionPercentage,
'is_completed' => $targetAmount > 0
    && $collectedAmount >= $targetAmount,
            'minimum_amount' => $this->minimum_amount,

            'donation_available' => $this->donation_available,
            'is_active' => $this->is_active,
            'sort_order' => $this->sort_order,

            /*
            |--------------------------------------------------------------------------
            | Benefits
            |--------------------------------------------------------------------------
            */

            'benefits' => $this->when(
                $this->relationLoaded('benefits'),
                fn () => $this->benefits->map(
                    fn ($benefit) => array_filter([
                        'id' => $benefit->id,
                        'title_ar' => $benefit->title_ar,
                        'title_en' => $benefit->title_en,
                        'sort_order' => $benefit->sort_order,
                        'is_active' => $benefit->is_active,
                    ], static fn ($value) => $value !== null)
                )->values()
            ),

            /*
            |--------------------------------------------------------------------------
            | Donation Packages
            |--------------------------------------------------------------------------
            */

            'donation_packages' => $this->when(
                $this->relationLoaded('donationPackages'),
                fn () => $this->donationPackages->map(
                    fn ($package) => array_filter([
                        'id' => $package->id,
                        'donation_campaign_id' => $package->donation_campaign_id,
                        'name_ar' => $package->name_ar,
                        'name_en' => $package->name_en,
                        'amount' => $package->amount,
                        'sort_order' => $package->sort_order,
                        'is_active' => $package->is_active,
                    ], static fn ($value) => $value !== null)
                )->values()
            ),

            /*
            |--------------------------------------------------------------------------
            | Cases
            |--------------------------------------------------------------------------
            */

            'cases' => $this->when(
                $this->relationLoaded('cases'),
                fn () => \App\Support\LinkedCases::visible($this->cases, $request)->map(
                    fn ($case) => array_filter([
                        'id' => $case->id,
                        'donation_campaign_id' => $case->donation_campaign_id,
                        'category_id' => $case->category_id,
                        'code' => $case->code,
                        'title' => $case->title,
                        'beneficiary_name' => \App\Support\LinkedCases::name($case, $request),
                        'target_amount' => $case->target_amount,
                        'deadline' => $case->deadline,
                        'priority' => $case->priority,
                        'governorate' => $case->governorate,
                        'city' => \App\Support\LinkedCases::city($case, $request),
                        'cover_image' => \App\Support\LinkedCases::cover($case->cover_image),
                        'description' => $case->description,
                        'status' => $case->status,
                    ], static fn ($value) => $value !== null)
                )->values()
            ),

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];

        return array_filter(
            $data,
            static fn ($value) => $value !== null
        );
    }
}