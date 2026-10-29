<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CaseUpdate extends Model
{
    protected $fillable = ['case_id', 'body', 'image_url', 'author_id'];

    public function case()
    {
        return $this->belongsTo(CaseModel::class, 'case_id');
    }
}
