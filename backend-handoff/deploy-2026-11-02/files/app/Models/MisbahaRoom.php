<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MisbahaRoom extends Model
{
    protected $fillable = ['slug', 'kind', 'gender', 'name', 'created_by', 'total_count', 'target_total', 'dhikr_id', 'is_hidden', 'creator_ip_hash', 'last_activity_at'];

    protected $casts = [
        'total_count' => 'integer',
        'target_total' => 'integer',
        'is_hidden' => 'boolean',
        'last_activity_at' => 'datetime',
    ];

    protected $hidden = ['creator_ip_hash'];
}
