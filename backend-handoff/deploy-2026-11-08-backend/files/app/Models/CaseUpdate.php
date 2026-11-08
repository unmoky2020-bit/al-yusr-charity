<?php

namespace App\Models;

use App\Observers\CaseUpdateObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Model;

/** A new update notifies the case's donors (CaseUpdateObserver). */
#[ObservedBy([CaseUpdateObserver::class])]
class CaseUpdate extends Model
{
    protected $fillable = ['case_id', 'body', 'image_url', 'author_id'];

    public function case()
    {
        return $this->belongsTo(CaseModel::class, 'case_id');
    }
}
