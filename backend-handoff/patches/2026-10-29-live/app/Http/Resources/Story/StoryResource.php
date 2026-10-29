<?php

namespace App\Http\Resources\Story;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'program_id' => $this->program_id,
            'program' => $this->program ? ['id' => $this->program->id, 'slug' => $this->program->slug, 'name_ar' => $this->program->name_ar ?: $this->program->name, 'name_en' => $this->program->name_en] : null,
            'title_ar' => $this->title_ar,
            'title_en' => $this->title_en,
            'quote_ar' => $this->quote_ar,
            'quote_en' => $this->quote_en,
            'category_ar' => $this->category_ar,
            'category_en' => $this->category_en,
            'beneficiary_name' => $this->beneficiary_name,
            'location_ar' => $this->location_ar,
            'location_en' => $this->location_en,
            'description_ar' => $this->description_ar,
            'description_en' => $this->description_en,
            'cover_image' => $this->cover_image
                ? asset('storage/'.$this->cover_image)
                : null,
            'cover_image_url' => $this->cover_image_url,
            'sort_order' => $this->sort_order,
            'status' => $this->status,
            'is_featured' => $this->is_featured,
            'created_by' => $this->created_by,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
