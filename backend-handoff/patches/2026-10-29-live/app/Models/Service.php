<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** A service page (/services/:slug) and its card on /services-map. */
class Service extends Model
{
    protected $fillable = [
        'service_category_id',
        'slug',
        'program_slug',
        'sector',
        'title_ar',
        'title_en',
        'badge_ar',
        'badge_en',
        'image_url',
        'short_intro_ar',
        'short_intro_en',
        'seo_title_ar',
        'seo_title_en',
        'seo_description_ar',
        'seo_description_en',
        'bullets_ar',
        'bullets_en',
        'stats',
        'features',
        'tiers',
        'related',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'bullets_ar' => 'array',
        'bullets_en' => 'array',
        'stats' => 'array',
        'features' => 'array',
        'tiers' => 'array',
        'related' => 'array',
        'donation_options' => 'array',
        'details_bullets' => 'array',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(ServiceCategory::class, 'service_category_id');
    }
}
