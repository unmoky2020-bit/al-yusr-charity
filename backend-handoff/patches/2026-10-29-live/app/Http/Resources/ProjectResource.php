<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProjectResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $data = [
            'id' => $this->id,
            'name' => $this->name,
            'name_en' => $this->name_en,
            'slug' => $this->slug,
            'faq_category_id' => $this->faq_category_id,
            'faq_category' => $this->faqCategory ? ['id' => $this->faqCategory->id, 'slug' => $this->faqCategory->slug, 'name_ar' => $this->faqCategory->name_ar] : null,
            'description' => $this->description,
            'short_description' => $this->short_description,
            'short_description_en' => $this->short_description_en,
            'target_amount' => $this->target_amount,
            'collected_amount' => $this->collected_amount,
            'starting_price' => $this->starting_price,
            'display_order' => $this->display_order,
            'cover_image' => $this->cover_image
            ? (preg_match('#^https?://#', $this->cover_image) ? $this->cover_image : \Illuminate\Support\Facades\Storage::disk('public')->url(preg_replace('#^/?storage/#', '', $this->cover_image)))
             : null,
            'is_active' => $this->is_active,
            
            'donation_packages' => $this->when(
             $this->relationLoaded('donationPackages'),
             fn () => $this->donationPackages->map(fn ($package) => [
             'id' => $package->id,
             'project_id' => $package->project_id,
             'name_ar' => $package->name_ar,
             'name_en' => $package->name_en,
             'amount' => $package->amount,
             'sort_order' => $package->sort_order,
             'is_active' => $package->is_active,
              ])->values()
              ),


'cases' => $this->when(
    $this->relationLoaded('cases'),
    fn () => \App\Support\LinkedCases::visible($this->cases, $request)->map(fn ($case) => array_filter([
        'id' => $case->id,
        'project_id' => $case->project_id,
        'category_id' => $case->category_id,
        'code' => $case->code,
        'title' => $case->title,
        'beneficiary_name' => \App\Support\LinkedCases::name($case, $request),
        'target_amount' => $case->target_amount,
        'minimum_amount' => $case->minimum_amount,
        'status' => $case->status,
        'priority' => $case->priority,
        'governorate' => $case->governorate,
        'city' => \App\Support\LinkedCases::city($case, $request),
        'cover_image' => \App\Support\LinkedCases::cover($case->cover_image),
    ], static fn ($value) => $value !== null))->values()
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