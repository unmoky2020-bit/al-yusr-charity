<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CaseMedia extends Model
{
    protected $table = 'case_media';

    protected $fillable = ['case_id', 'url', 'kind', 'caption_ar', 'caption_en', 'is_public', 'sort_order', 'uploaded_by'];

    protected $casts = ['is_public' => 'boolean', 'sort_order' => 'integer'];

    public function case()
    {
        return $this->belongsTo(CaseModel::class, 'case_id');
    }
}
