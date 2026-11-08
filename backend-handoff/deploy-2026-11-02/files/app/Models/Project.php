<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Project extends Model
{
    /** Every response shows its linked FAQ category: load it with the record (one query per list). */
    protected $with = ['faqCategory'];

    protected $fillable = [
        'faq_category_id',
        'name',
        'name_en',
        'slug',
        'description',
        'short_description',
        'short_description_en',
        'target_amount',
        'collected_amount',
        'starting_price',
        'display_order',
        'cover_image',
        'is_active',
        // Landing-page fields (migration 2026_11_02_100000)
        'description_en',
        'content_ar',
        'content_en',
        'benefits_ar',
        'benefits_en',
        'page_content',
        'donation_available',
        'hide_from_audience',
        'meta_title_ar',
        'meta_title_en',
        'meta_description_ar',
        'meta_description_en',
        'keywords_ar',
        'keywords_en',
        'canonical_url',
        'schema_type',
        'twitter_card',
        'noindex',
        'nofollow',
        'geo_region',
        'geo_placename',
        'geo_position',
        'geo_position_label',
        'ai_summary_ar',
        'ai_summary_en',
        'ai_faq_ar',
        'ai_faq_en',
    ];

    protected $casts = [
        'target_amount' => 'decimal:2',
        'collected_amount' => 'decimal:2',
        'starting_price' => 'decimal:2',
        'is_active' => 'boolean',
        'display_order' => 'integer',
        'benefits_ar' => 'array',
        'benefits_en' => 'array',
        'page_content' => 'array',
        'ai_faq_ar' => 'array',
        'ai_faq_en' => 'array',
        'donation_available' => 'boolean',
        'hide_from_audience' => 'boolean',
        'noindex' => 'boolean',
        'nofollow' => 'boolean',
    ];

    public function donationPackages(): HasMany
    {
        return $this->hasMany(
            ProgramDonationPackage::class,
            'project_id'
        );
    }

    public function cases(): HasMany
    {
        return $this->hasMany(
            CaseModel::class,
            'project_id'
        );
    }

    /** The FAQ category whose questions this page shows. */
    public function faqCategory()
    {
        return $this->belongsTo(FaqCategory::class, 'faq_category_id');
    }
}