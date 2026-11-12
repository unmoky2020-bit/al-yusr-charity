<?php

namespace App\Models\Extras;

use Illuminate\Database\Eloquent\Model;

/** The picture of one donation package (program_donation_packages.id). */
class PackageImage extends Model
{
    protected $table = 'package_images';

    protected $fillable = ['package_id', 'image', 'alt_ar', 'alt_en', 'updated_by'];

    protected $casts = ['package_id' => 'integer'];
}
