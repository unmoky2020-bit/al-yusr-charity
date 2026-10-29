<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NewsletterCampaign extends Model
{
    protected $fillable = [
        'subject',
        'preheader',
        'html',
        'text_body',
        'from_name',
        'from_email',
        'reply_to',
        'status',
        'scheduled_at',
        'sent_at',
        'recipients_count',
        'sent_count',
        'failed_count',
        'opened_count',
        'clicked_count',
        'created_by',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'sent_at' => 'datetime',
    ];

    /** Sent (or being sent) campaigns are history: they can't be edited or sent again. */
    public function isLocked(): bool
    {
        return in_array($this->status, ['sending', 'sent'], true);
    }
}
