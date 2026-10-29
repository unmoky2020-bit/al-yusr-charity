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
    ];

    protected $casts = [
        'target_amount' => 'decimal:2',
        'collected_amount' => 'decimal:2',
        'starting_price' => 'decimal:2',
        'is_active' => 'boolean',
        'display_order' => 'integer',
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