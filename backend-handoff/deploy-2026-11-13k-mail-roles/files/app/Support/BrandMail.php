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
    /**
     * Mailbox roles: support@ only sends (codes, receipts, every automated email — set by MAIL_FROM_ADDRESS
     * in .env); info@ is the public contact address, so a reply to any email lands in info@.
     * The dashboard's org_info email wins when set.
     */
    public const REPLY_TO = 'info@elyusr.org';

    public static function replyTo(): string
    {
        return Mail\MailRenderer::org()['email'];
    }

    public static function send(string $to, string $subject, array $data): void
    {
        MailOutbox::sendNow($to, $subject, $data + ['minimal' => true, 'reason' => 'وصلتك الرسالة دي لأن حد طلب رمز بالبريد ده على elyusr.org. لو مش إنت، تجاهلها.'], 'code');
    }
}
