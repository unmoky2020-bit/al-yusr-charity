<?php

namespace App\Http\Resources\Axis;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class AxisResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $data = [
            'id' => $this->id,
            'slug' => $this->slug,
            'faq_category_id' => $this->faq_category_id,
            'faq_category' => $this->faqCategory ? ['id' => $this->faqCategory->id, 'slug' => $this->faqCategory->slug, 'name_ar' => $this->faqCategory->name_ar] : null,

            'name_ar' => $this->name_ar,
            'name_en' => $this->name_en,

            'description_ar' => $this->description_ar,
            'description_en' => $this->description_en,

            'badge_ar' => $this->badge_ar,
            'badge_en' => $this->badge_en,

            'image' => $this->image
                ? Storage::disk('public')->url($this->image)
                : null,

            'statistics' => $this->statistics ?? [],
            'features_ar' => $this->features_ar ?? [],
            'features_en' => $this->features_en ?? [],

            'sort_order' => $this->sort_order,
            'is_active' => $this->is_active,

            'programs' => $this->when(
                $this->relationLoaded('programs'),
                fn () => $this->programs->map(
                    fn ($program) => array_filter([
                        'id' => $program->id,
                        'slug' => $program->slug,
                        'name' => $program->name,
                        'name_ar' => $program->name_ar,
                        'name_en' => $program->name_en,
                        'tagline_ar' => $program->tagline_ar,
                        'tagline_en' => $program->tagline_en,
                        'description' => $program->description,
                        'image' => \App\Support\LinkedCases::cover($program->image ?: $program->cover_image),
                        'minimum_amount' => $program->minimum_amount,
                        'sort_order' => $program->sort_order,
                        'is_active' => $program->is_active,
                    ], static fn ($value) => $value !== null)
                )->values()
            ),

            'cases' => $this->when(
                $this->relationLoaded('cases'),
                fn () => \App\Support\LinkedCases::visible($this->cases, $request)->map(
                    fn ($case) => array_filter([
                        'id' => $case->id,
                        'code' => $case->code,
                        'title' => $case->title,
                        'category' => $case->category,
                        'beneficiary_name' => \App\Support\LinkedCases::name($case, $request),
                        'age' => $case->age,
                        'governorate' => $case->governorate,
                        'city' => \App\Support\LinkedCases::city($case, $request),
                        'target_amount' => $case->target_amount,
                        'deadline' => $case->deadline,
                        'priority' => $case->priority,
                        'cover_image' => \App\Support\LinkedCases::cover($case->cover_image),
                        'description' => $case->description,
                        'status' => $case->status,
                    ], static fn ($value) => $value !== null)
                )->values()
            ),

            'volunteer_campaigns' => $this->when(
                $this->relationLoaded('volunteerCampaigns'),
                fn () => $this->volunteerCampaigns->values()
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