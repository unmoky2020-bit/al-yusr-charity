<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Axis extends Model
{
    /** Every response shows its linked FAQ category: load it with the record (one query per list). */
    protected $with = ['faqCategory'];

    use HasFactory;

    protected $fillable = [
        'faq_category_id',
        'slug',
        'name_ar',
        'name_en',
        'description_ar',
        'description_en',
        'image',
        'badge_ar',
        'badge_en',
        'statistics',
        'features_ar',
        'features_en',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'statistics' => 'array',
        'features_ar' => 'array',
        'features_en' => 'array',
        'sort_order' => 'integer',
        'is_active' => 'boolean',
    ];

    public function programs()
    {
        return $this->hasMany(Program::class);
    }

    public function cases()
    {
        return $this->hasMany(CaseModel::class);
    }

    public function volunteerCampaigns()
    {
        return $this->hasMany(VolunteerCampaign::class);
    }

    public function getImageUrlAttribute()
    {
        return $this->image
            ? Storage::disk('public')->url($this->image)
            : null;
    }

    /** The FAQ category whose questions the axis page shows. */
    public function faqCategory()
    {
        return $this->belongsTo(FaqCategory::class, 'faq_category_id');
    }
}
