<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;
use App\Models\CaseModel;


class Program extends Model
{
    /** Every response shows its linked FAQ category: load it with the record (one query per list). */
    protected $with = ['faqCategory'];

    protected $fillable = [
        'faq_category_id',
        'axis_id',
        'slug',
        'top_section',
        'name',
        'name_ar',
        'name_en',
        'period_ar',
        'period_en',
        'tagline_ar',
        'tagline_en',
        'donation_available',
        'description',
        'description_ar',
        'description_en',
        'content_ar',
        'content_en',
        'benefits_ar',
        'benefits_en',
        'hero_h1_ar',
        'hero_h1_en',
        'hero_h3_ar',
        'hero_h3_en',
        'hero_image',
        'image',
        'target_amount',
        'minimum_amount',
        'status',
        'sort_order',
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
        'is_active',
        'hide_from_audience',
    ];

    protected $casts = [
        'top_section' => 'array',
        'benefits_ar' => 'array',
        'benefits_en' => 'array',
        'target_amount' => 'decimal:2',
        'minimum_amount' => 'decimal:2',
        'sort_order' => 'integer',
        'donation_available' => 'boolean',
        'noindex' => 'boolean',
        'nofollow' => 'boolean',
        'is_active' => 'boolean',
        'hide_from_audience' => 'boolean',
    ];


    public function seasons(): BelongsToMany
    {
        return $this->belongsToMany(Season::class, 'program_season');
    }


    public function axis()
    {
        return $this->belongsTo(Axis::class);
    }
    
    
    public function donationPackages(): HasMany
{
    return $this->hasMany(ProgramDonationPackage::class);
}


public function donations(): HasMany
{
    return $this->hasMany(Donation::class)
        ->where('status', 'paid');
}


    public function getImageUrlAttribute()
    {
        return $this->image
            ? Storage::disk('public')->url($this->image)
            : null;
    }
    
    
    public function cases(): HasMany
{
    return $this->hasMany(
        CaseModel::class,
        'program_id'
    );
}


public function pageSections(): HasMany
{
    return $this->hasMany(ProgramPageSection::class)
        ->orderBy('sort_order');
}


    /** The FAQ category whose questions this page shows. */
    public function faqCategory()
    {
        return $this->belongsTo(FaqCategory::class, 'faq_category_id');
    }
}
