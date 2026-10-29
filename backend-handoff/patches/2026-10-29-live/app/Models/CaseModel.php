<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CaseModel extends Model
{
    protected $fillable = [
        'code',
        'title',
        'category',
        'axis_id',
        'program_id',
        'project_id',
        'donation_campaign_id',
        'category_id',
        'beneficiary_name',
        'age',
        'governorate',
        'city',
        'target_amount',
        'deadline',
        'priority',
        'cover_image',
        'description',
        'status',
    ];

    protected $casts = [
        'age' => 'integer',
        'target_amount' => 'decimal:2',
        'deadline' => 'date',
    ];

    public function axis(): BelongsTo
    {
        return $this->belongsTo(Axis::class);
    }

    public function categoryRelation(): BelongsTo
    {
        return $this->belongsTo(
            CaseCategory::class,
            'category_id'
        );
    }

    public function donations(): HasMany
    {
        return $this->hasMany(
            Donation::class,
            'case_id'
        );
    }

    // الحالة التابعة للبرنامج
    public function program(): BelongsTo
    {
        return $this->belongsTo(
            Program::class,
            'program_id'
        );
    }

    // الحالة التابعة للمشروع
    public function project(): BelongsTo
    {
        return $this->belongsTo(
            Project::class,
            'project_id'
        );
    }

    // الحالة التابعة لحملة التبرع
    public function donationCampaign(): BelongsTo
    {
        return $this->belongsTo(
            DonationCampaign::class,
            'donation_campaign_id'
        );
    }
}