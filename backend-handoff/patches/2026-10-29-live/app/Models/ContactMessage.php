<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContactMessage extends Model
{
    protected $fillable = [
        'ref_code', 'name', 'email', 'phone', 'section', 'message',
        'source', 'user_agent', 'ip', 'status', 'replied_at', 'handled_by',
    ];

    protected $casts = [
        'replied_at' => 'datetime',
    ];

    protected $hidden = ['ip', 'user_agent'];
}
