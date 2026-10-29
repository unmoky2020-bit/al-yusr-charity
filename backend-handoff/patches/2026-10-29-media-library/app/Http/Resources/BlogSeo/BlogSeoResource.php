<?php

namespace App\Http\Resources\BlogSeo;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class BlogSeoResource extends JsonResource
{
    /** Storage paths become full public URLs; absolute URLs pass through unchanged. */
    private function mediaUrl(?string $value): ?string
    {
        if (!$value || preg_match('#^(https?:)?//|^data:#i', $value)) {
            return $value;
        }

        return Storage::disk('public')->url(ltrim(preg_replace('#^/?storage/#', '', $value), '/'));
    }

    public function toArray(Request $request): array
    {
        $data = [
            'id' => $this->id,
            'content_id' => $this->content_id,

            'slug' => $this->content?->slug,

            'title_ar' => $this->content?->title_ar,
            'title_en' => $this->content?->title_en,

            'summary_ar' => $this->content?->summary_ar,
            'summary_en' => $this->content?->summary_en,

            'content_ar' => $this->content?->content_ar,
            'content_en' => $this->content?->content_en,

            'cover_image' => $this->mediaUrl($this->content?->cover_image),
            'svg' => $this->content?->svg,
            'author_id' => $this->content?->author_id,

            'author' => $this->when(
                $this->content?->relationLoaded('author') && $this->content?->author,
                fn () => [
                    'id' => $this->content->author->id,
                    'name' => $this->content->author->name,
                    // Only signed-in admin requests see the author's email.
                    'email' => $this->when((bool) $request->user('sanctum'), $this->content->author->email),
                ]
            ),

            'primary_keyword' => $this->primary_keyword,

            'category_ar' => $this->category_ar,
            'category_en' => $this->category_en,

            'tags_ar' => $this->tags_ar ?? [],
            'tags_en' => $this->tags_en ?? [],

            'og_image' => $this->og_image,
            'og_image_url' => $this->og_image_url,

            'schema_type' => $this->schema_type,
            'schema_data' => $this->schema_data,
            'og_data' => $this->og_data,

            'seo_score' => $this->seo_score,

            'seo_analysis' => array_filter([
                'word_count_ar' => $this->word_count_ar,
                'word_count_en' => $this->word_count_en,
                'title_length_ar' => $this->title_length_ar,
                'title_length_en' => $this->title_length_en,
                'description_length_ar' => $this->description_length_ar,
                'description_length_en' => $this->description_length_en,
                'has_schema' => $this->has_schema,
                'has_og' => $this->has_og,
                'has_category' => $this->has_category,
                'has_tags' => $this->has_tags,
            ], static fn ($value) => $value !== null),

            'workflow_status' => $this->workflow_status,
            'scheduled_at' => $this->scheduled_at,
            'published_at' => $this->published_at,

            'created_by' => $this->created_by,
            'updated_by' => $this->updated_by,

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];

        return array_filter(
            $data,
            static fn ($value) => $value !== null
        );
    }
}