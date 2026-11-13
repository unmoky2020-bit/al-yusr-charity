<?php

namespace App\Support;

use Illuminate\Support\Facades\Mail;

/**
 * Every email the site sends goes out in the foundation's look: logo header, white card, footer
 * with the registration number. HTML for mail apps, plain text for the rest.
 *
 * BrandMail::send($to, $subject, [
 *   'title'    => 'رمز تأكيد البريد',            // headline in the card
 *   'greeting' => 'أهلًا محمد،',
 *   'lines'    => ['…', '…'],                   // paragraphs before the code / button
 *   'code'     => '123456',                     // optional: shown large in a box
 *   'cta'      => ['label' => '…', 'url' => '…'], // optional button
 *   'after'    => ['…'],                        // paragraphs after the code / button
 *   'note'     => '…',                          // small grey line (security note)
 * ]);
 */
class BrandMail
{
    public static function send(string $to, string $subject, array $data): void
    {
        $data = self::normalize($subject, $data);
        Mail::send(
            ['html' => 'emails.brand', 'text' => 'emails.brand-text'],
            ['m' => $data],
            fn ($message) => $message->to($to)->subject($subject)
        );
    }

    private static function normalize(string $subject, array $d): array
    {
        $list = fn ($v) => array_values(array_filter(array_map('trim', (array) ($v ?? [])), fn ($s) => $s !== ''));

        return [
            'title' => trim((string) ($d['title'] ?? $subject)),
            'preheader' => trim((string) ($d['preheader'] ?? ($d['title'] ?? $subject))),
            'greeting' => trim((string) ($d['greeting'] ?? '')),
            'lines' => $list($d['lines'] ?? []),
            'code' => isset($d['code']) ? (string) $d['code'] : null,
            'cta' => (isset($d['cta']['label'], $d['cta']['url'])) ? $d['cta'] : null,
            'after' => $list($d['after'] ?? []),
            'note' => trim((string) ($d['note'] ?? '')),
            'site' => 'https://elyusr.org',
            'logo' => 'https://elyusr.org/icons/icon-192.png',
            'year' => date('Y'),
        ];
    }
}
