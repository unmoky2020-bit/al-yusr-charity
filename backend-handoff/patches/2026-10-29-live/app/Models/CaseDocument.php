<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CaseDocument extends Model
{
    protected $fillable = ['case_id', 'url', 'doc_type', 'caption', 'is_public', 'uploaded_by'];

    protected $casts = ['is_public' => 'boolean'];

    public function case()
    {
        return $this->belongsTo(CaseModel::class, 'case_id');
    }
}
