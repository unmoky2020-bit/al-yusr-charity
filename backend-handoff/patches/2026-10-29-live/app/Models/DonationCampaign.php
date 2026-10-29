<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DonationCampaign extends Model
{
    /** Every response shows its linked FAQ category: load it with the record (one query per list). */
    protected $with = ['faqCategory'];

    protected $fillable = [
        'faq_category_id',
        'category_id',
        'name_ar',
        'name_en',
        'slug',
        'subtitle_ar',
        'subtitle_en',
        'description_ar',
        'description_en',
        'image',
        'target_amount',
        'collected_amount',
        'minimum_amount',
        'donation_available',
        'is_active',
        'sort_order',
        'page_content',
        'seo',
        'faqs',
        'landing_slug',
    ];

    protected $casts = [
        'target_amount' => 'decimal:2',
        'collected_amount' => 'decimal:2',
        'minimum_amount' => 'decimal:2',
        'donation_available' => 'boolean',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
        'page_content' => 'array',
        'seo' => 'array',
        'faqs' => 'array',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(
            DonationCampaignCategory::class,
            'category_id'
        );
    }

    public function benefits(): HasMany
    {
        return $this->hasMany(
            DonationCampaignBenefit::class,
            'donation_campaign_id'
        )->orderBy('sort_order');
    }

    public function donations(): HasMany
    {
        return $this->hasMany(Donation::class);
    }

    // باقات التبرع الخاصة بالحملة
    public function donationPackages(): HasMany
    {
        return $this->hasMany(
            ProgramDonationPackage::class,
            'donation_campaign_id'
        );
    }

    // الحالات الخاصة بالحملة
    public function cases(): HasMany
    {
        return $this->hasMany(
            CaseModel::class,
            'donation_campaign_id'
        );
    }

    /** The FAQ category whose questions this page shows. */
    public function faqCategory()
    {
        return $this->belongsTo(FaqCategory::class, 'faq_category_id');
    }
}