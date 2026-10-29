<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class KhabiaRequest extends Model
{
    protected $fillable = [
        'ref_code', 'full_name', 'phone', 'city', 'address', 'status',
        'scheduled_at', 'delivered_at', 'collected_at', 'amount_collected', 'notes',
        'assigned_delegate_id', 'delivery_proof_path', 'collection_proof_path',
        'source', 'user_agent', 'ip',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'delivered_at' => 'datetime',
        'collected_at' => 'datetime',
        'amount_collected' => 'decimal:2',
    ];

    protected $hidden = ['ip', 'user_agent', 'delivery_proof_path', 'collection_proof_path'];

    protected $appends = ['delivery_proof_url', 'collection_proof_url'];

    public function getDeliveryProofUrlAttribute(): ?string
    {
        return $this->delivery_proof_path ? Storage::disk('public')->url($this->delivery_proof_path) : null;
    }

    public function getCollectionProofUrlAttribute(): ?string
    {
        return $this->collection_proof_path ? Storage::disk('public')->url($this->collection_proof_path) : null;
    }

    public function delegate()
    {
        return $this->belongsTo(User::class, 'assigned_delegate_id');
    }
}
