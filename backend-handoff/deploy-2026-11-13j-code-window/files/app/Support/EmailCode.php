<?php

namespace App\Support;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;

/**
 * Six-digit codes sent by email, one per purpose ("password", "verify") and address.
 *  - kept hashed in the cache for 30 minutes (Gmail may hold the email a few minutes or file it in Spam) (no table needed)
 *  - five wrong tries burn the code, so it cannot be guessed
 *  - at most ten codes per address and purpose per hour, so nobody can flood an inbox
 */
final class EmailCode
{
    public const TTL_MINUTES = 30;
    private const MAX_TRIES = 5;
    private const MAX_SENDS_PER_HOUR = 10;

    /** False when this address already received too many codes for this purpose in the last hour. */
    public static function maySend(string $purpose, string $email): bool
    {
        $key = 'email-code-send:' . self::id($purpose, $email);
        if (RateLimiter::tooManyAttempts($key, self::MAX_SENDS_PER_HOUR)) {
            return false;
        }
        RateLimiter::hit($key, 3600);

        return true;
    }

    /**
     * A new code for this purpose and address. The last 3 codes stay valid until they expire, so a
     * person who pressed «ابعت رمز جديد» and then typed the code from the first email is not refused.
     */
    public static function issue(string $purpose, string $email): string
    {
        $code = (string) random_int(100000, 999999);
        $expires = now()->addMinutes(self::TTL_MINUTES);
        $key = self::key($purpose, $email);
        $entry = Cache::get($key);
        $hashes = [];
        if (is_array($entry) && ($entry['expires'] ?? 0) >= time()) {
            $hashes = array_values(array_filter((array) ($entry['hashes'] ?? (isset($entry['hash']) ? [$entry['hash']] : []))));
        }
        array_unshift($hashes, Hash::make($code));
        Cache::put($key, [
            'hashes' => array_slice($hashes, 0, 3),
            'tries' => (int) (is_array($entry) ? ($entry['tries'] ?? 0) : 0),
            'expires' => $expires->getTimestamp(),
        ], $expires);

        return $code;
    }

    /** True once for a right code (any of the last 3 sent); a wrong code counts as a try. */
    public static function check(string $purpose, string $email, string $code): bool
    {
        $key = self::key($purpose, $email);
        $entry = Cache::get($key);
        $hashes = is_array($entry) ? array_values(array_filter((array) ($entry['hashes'] ?? (isset($entry['hash']) ? [$entry['hash']] : [])))) : [];
        if (! $hashes || ($entry['expires'] ?? 0) < time()) {
            Cache::forget($key);

            return false;
        }
        // Arabic-Indic digits (٠-٩) typed on a phone count as 0-9.
        $code = strtr(trim($code), ['٠' => '0', '١' => '1', '٢' => '2', '٣' => '3', '٤' => '4', '٥' => '5', '٦' => '6', '٧' => '7', '٨' => '8', '٩' => '9']);
        foreach ($hashes as $h) {
            if (Hash::check($code, $h)) {
                Cache::forget($key);

                return true;
            }
        }

        $entry['tries'] = (int) ($entry['tries'] ?? 0) + 1;
        if ($entry['tries'] >= self::MAX_TRIES) {
            Cache::forget($key);
        } else {
            Cache::put($key, $entry, now()->setTimestamp((int) $entry['expires']));
        }

        return false;
    }

    /** Sends a plain Arabic email; a mail failure is reported, never shown to the visitor. */
    /**
     * Sends a code email in the foundation's design. The body is the plain message the callers
     * already build: a greeting line, paragraphs, and the code alone on its own line.
     */
    public static function mail(string $email, string $subject, string $body): void
    {
        try {
            BrandMail::send($email, $subject, self::layout($subject, $body));
        } catch (\Throwable $e) {
            report($e);
            try {
                Mail::raw($body, function ($message) use ($email, $subject) {
                    $message->to($email)->subject($subject);
                });
            } catch (\Throwable $e2) {
                report($e2);
            }
        }
    }

    /** Splits the callers' plain body into the parts of the designed email. */
    private static function layout(string $subject, string $body): array
    {
        $blocks = array_values(array_filter(array_map('trim', preg_split("/\\n\\s*\\n/u", $body)), fn ($b) => $b !== ''));
        $greeting = ''; $code = null; $before = []; $after = [];
        foreach ($blocks as $i => $b) {
            if ($i === 0 && preg_match('/^(أهلًا|أهلا|مرحبًا)/u', $b)) { $greeting = $b; continue; }
            if (preg_match('/^\\d{6}$/', $b)) { $code = $b; continue; }
            if (str_starts_with($b, 'مؤسسة اليسر الخيرية')) continue; // signature: the footer has it
            if ($code === null) $before[] = $b; else $after[] = $b;
        }
        $title = trim(preg_replace('/\\s*—\\s*مؤسسة اليسر الخيرية\\s*$/u', '', $subject));
        $note = '';
        foreach ($after as $k => $p) {
            if (str_contains($p, 'لو لم تطلب')) {
                [$valid, $rest] = array_pad(preg_split('/\\.\\s+/u', $p, 2), 2, '');
                $after[$k] = rtrim($valid, '.') . '.';
                $note = trim($rest);
            }
        }

        return [
            'title' => $title,
            'preheader' => $code ? "رمزك: {$code}" : $title,
            'greeting' => $greeting,
            'lines' => array_map(fn ($l) => rtrim($l, ':：'), $before),
            'code' => $code,
            'after' => $after,
            'note' => $note !== '' ? $note : 'لو ما طلبتش الرمز ده، تجاهل الرسالة؛ حسابك في أمان ومحدش يقدر يستخدمه من غير الرمز.',
        ];
    }

    public static function normalize(string $email): string
    {
        return mb_strtolower(trim($email));
    }

    private static function key(string $purpose, string $email): string
    {
        return 'email-code:' . self::id($purpose, $email);
    }

    private static function id(string $purpose, string $email): string
    {
        return $purpose . ':' . sha1(self::normalize($email));
    }
}
