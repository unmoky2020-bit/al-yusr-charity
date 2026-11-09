<?php

namespace App\Models\Impact;

use App\Models\CaseModel;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** One line of what a case needs: planned → purchased (cost + receipt) → delivered (photo), or cancelled. */
class CaseItem extends Model
{
    public const STATUSES = ['planned', 'purchased', 'delivered', 'cancelled'];

    protected $fillable = [
        'case_id', 'title', 'quantity', 'estimated_cost', 'actual_cost', 'status',
        'receipt_url', 'photo_url', 'note', 'purchased_on', 'delivered_on', 'sort_order', 'created_by',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'estimated_cost' => 'decimal:2',
        'actual_cost' => 'decimal:2',
        'purchased_on' => 'date:Y-m-d',
        'delivered_on' => 'date:Y-m-d',
        'sort_order' => 'integer',
    ];

    public function caseModel(): BelongsTo
    {
        return $this->belongsTo(CaseModel::class, 'case_id');
    }

    /** Money already spent on this line (bought or handed over). */
    public function spent(): float
    {
        return in_array($this->status, ['purchased', 'delivered'], true) ? (float) ($this->actual_cost ?? $this->estimated_cost) : 0.0;
    }
}
