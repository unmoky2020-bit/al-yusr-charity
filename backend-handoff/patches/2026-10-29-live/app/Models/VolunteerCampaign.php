<?php

namespace App\Models;

use App\Models\Axis;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VolunteerCampaign extends Model
{
    use HasFactory;

    protected $fillable = [
        'title_ar',
        'title_en',
        'event_date',
        'event_time',
        'governorate',
        'city',
        'location',
        'required_volunteers',
        'required_skills',
        'description_ar',
        'description_en',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'event_date' => 'date',
            'event_time' => 'datetime:H:i',
            'required_volunteers' => 'integer',
            'required_skills' => 'array',
        ];
    }

    public function applications()
    {
        return $this->hasMany(VolunteerCampaignApplication::class, 'campaign_id');
    }

    public function volunteers()
    {
        return $this->belongsToMany(
            Volunteer::class,
            'volunteer_campaign_applications'
        )->withPivot([
            'status',
            'invited_at',
            'applied_at',
            'notes',
        ])->withTimestamps();
    }

    /** Seats taken: approved volunteers, and after the day the ones who attended or did not show. */
    public function getApprovedVolunteersCountAttribute(): int
    {
        return $this->applications()
            ->whereIn('status', ['approved', 'attended', 'noshow'])
            ->count();
    }

    public function getRemainingVolunteersAttribute(): int
    {
        return max(
            0,
            $this->required_volunteers - $this->approved_volunteers_count
        );
    }

    public function axis()
    {
        return $this->belongsTo(Axis::class);
    }

}
