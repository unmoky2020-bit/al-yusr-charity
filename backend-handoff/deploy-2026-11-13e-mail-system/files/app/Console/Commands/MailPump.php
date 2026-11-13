<?php

namespace App\Console\Commands;

use App\Http\Controllers\Api\V1\Newsletter\NewsletterCampaignController;
use App\Support\Mail\MailOutbox;
use App\Support\Mail\MisbahaMail;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

/** Every minute (scheduler): scheduled campaigns, misbaha goal/weekly, then send what is due. */
class MailPump extends Command
{
    protected $signature = 'mail:pump {--max=20}';

    protected $description = 'Send due emails from mail_outbox within the daily limit';

    public function handle(): int
    {
        Cache::put('mail-cron-last', now()->toIso8601String(), 86400 * 7);
        NewsletterCampaignController::dispatchDue();
        MisbahaMail::due();
        [$sent, $failed] = MailOutbox::pump((int) $this->option('max'));
        if ($sent || $failed) {
            $this->info("sent {$sent}, failed {$failed}");
        }

        return self::SUCCESS;
    }
}
