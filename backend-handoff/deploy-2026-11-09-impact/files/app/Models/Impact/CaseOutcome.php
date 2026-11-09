<?php

namespace App\Models\Impact;

use App\Models\CaseModel;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * How a case ended: completed (with before/after photos), cancelled, or its money moved to another
 * case or program (transfer_note says where) — so a donor always sees what became of their money.
 */
class CaseOutcome extends Model
{
    public const RESULTS = ['completed', 'cancelled', 'transferred'];

    protected $fillable = ['case_id', 'result', 'summary', 'before_url', 'after_url', 'transfer_note', 'completed_on', 'created_by'];

    protected $casts = ['completed_on' => 'date:Y-m-d'];

    public function caseModel(): BelongsTo
    {
        return $this->belongsTo(CaseModel::class, 'case_id');
    }
}
