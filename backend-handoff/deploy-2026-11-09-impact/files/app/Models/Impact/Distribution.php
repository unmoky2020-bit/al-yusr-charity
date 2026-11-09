<?php

namespace App\Models\Impact;

use App\Models\Donation;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * A distribution day: one record that moved many paid donations one delivery step at once (each
 * donation's own trail gets a line pointing here), with the photos and the number of families.
 */
class Distribution extends Model
{
    protected $fillable = [
        'client_key', 'title', 'happened_on', 'governorate', 'city', 'stage', 'note', 'photos',
        'families_count', 'target_kind', 'target_id', 'donations_count', 'is_public', 'created_by',
    ];

    protected $casts = [
        'happened_on' => 'date:Y-m-d',
        'photos' => 'array',
        'families_count' => 'integer',
        'donations_count' => 'integer',
        'is_public' => 'boolean',
    ];

    public function donations(): BelongsToMany
    {
        return $this->belongsToMany(Donation::class, 'distribution_donation');
    }

    public function place(): ?string
    {
        $p = trim(implode('، ', array_filter([$this->city, $this->governorate])));

        return $p !== '' ? $p : null;
    }
}
