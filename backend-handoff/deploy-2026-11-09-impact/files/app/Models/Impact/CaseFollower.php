<?php

namespace App\Models\Impact;

use App\Models\CaseModel;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** The team member who follows a case from study to the final handover (one per case). */
class CaseFollower extends Model
{
    protected $fillable = ['case_id', 'user_id', 'assigned_by', 'note'];

    public function caseModel(): BelongsTo
    {
        return $this->belongsTo(CaseModel::class, 'case_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
