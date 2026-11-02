<?php

namespace App\Console\Commands;

use App\Http\Controllers\Api\V1\Newsletter\NewsletterPublicController;
use App\Models\NewsletterSubscriber;
use Illuminate\Console\Command;

/** Sends the confirmation email to everyone still "pending" (e.g. people who signed up before SMTP was set). */
class SendNewsletterConfirmations extends Command
{
    protected $signature = 'newsletter:send-confirmations {--limit=200}';
    protected $description = 'Email the confirmation link to pending newsletter subscribers';

    public function handle(): int
    {
        $sent = 0;
        NewsletterSubscriber::where('status', 'pending')->whereNotNull('confirmation_token')
            ->orderBy('id')->limit((int) $this->option('limit'))->get()
            ->each(function ($s) use (&$sent) {
                if (NewsletterPublicController::sendConfirmation($s)) $sent++;
            });
        $this->info("Sent {$sent} confirmation emails.");

        return self::SUCCESS;
    }
}
