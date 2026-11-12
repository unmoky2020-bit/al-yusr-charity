<?php

namespace App\Models\Extras;

use Illuminate\Database\Eloquent\Model;

/** One editable site-wide block (org_info, about_milestones, nav_links), its value as JSON. */
class SiteBlock extends Model
{
    protected $table = 'site_blocks';

    protected $fillable = ['key', 'value', 'updated_by'];

    protected $casts = ['value' => 'array'];
}
