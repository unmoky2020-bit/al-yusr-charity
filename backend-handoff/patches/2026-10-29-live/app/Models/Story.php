<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Story extends Model
{
    use HasFactory;

    protected $fillable = [
        'program_id',
        'slug',
        'title_ar',
        'title_en',
        'quote_ar',
        'quote_en',
        'category_ar',
        'category_en',
        'beneficiary_name',
        'location_ar',
        'location_en',
        'description_ar',
        'description_en',
        'cover_image',
        'cover_image_url',
        'sort_order',
        'status',
        'is_featured',
        'created_by',
    ];

    protected $casts = [
        'is_featured' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /** The program this story belongs to (optional). */
    public function program()
    {
        return $this->belongsTo(Program::class);
    }
}
