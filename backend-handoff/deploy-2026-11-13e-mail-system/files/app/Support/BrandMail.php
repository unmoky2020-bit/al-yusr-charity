<?php

namespace App\Support;

use App\Support\Mail\MailOutbox;

/**
 * Every email the site sends goes out in the foundation's look (App\Support\Mail\MailRenderer).
 * send() is for messages that must leave at once (codes): sent now and logged in mail_outbox.
 * Anything else should be queued: MailOutbox::queue(...).
 *
 * BrandMail::send($to, $subject, [
 *   'title' => '…', 'greeting' => '…', 'lines' => [...], 'code' => '123456',
 *   'cta' => ['label' => '…', 'url' => '…'], 'after' => [...], 'note' => '…',
 *   'blocks' => [...], 'hero' => ['image' => '…'],   // see MailRenderer
 * ]);
 */
class BrandMail
{
    /** Replies from donors land in the support mailbox, not in info@. */
    public const REPLY_TO = 'support@elyusr.org';

    public static function send(string $to, string $subject, array $data): void
    {
        MailOutbox::sendNow($to, $subject, $data + ['reason' => 'وصلتك الرسالة دي لأن حد طلب رمز بالبريد ده على elyusr.org. لو مش إنت، تجاهلها.'], 'code');
    }
}
