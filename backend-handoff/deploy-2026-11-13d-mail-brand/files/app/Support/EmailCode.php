<?php

namespace App\Support;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;

/**
 * Six-digit codes sent by email, one per purpose ("password", "verify") and address.
 *  - kept hashed in the cache for 15 minutes (no table needed)
 *  - five wrong tries burn the code, so it cannot be guessed
 *  - at most five codes per address and purpose per hour, so nobody can flood an inbox
 */
final class EmailCode
{
    public const TTL_MINUTES = 15;
    private const MAX_TRIES = 5;
    private const MAX_SENDS_PER_HOUR = 5;

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

    /** A new code for this purpose and address (replaces any earlier one). */
    public static function issue(string $purpose, string $email): string
    {
        $code = (string) random_int(100000, 999999);
        $expires = now()->addMinutes(self::TTL_MINUTES);
        Cache::put(self::key($purpose, $email), [
            'hash' => Hash::make($code),
            'tries' => 0,
            'expires' => $expires->getTimestamp(),
        ], $expires);

        return $code;
    }

    /** True once for the right code; a wrong code counts as a try. */
    public static function check(string $purpose, string $email, string $code): bool
    {
        $key = self::key($purpose, $email);
        $entry = Cache::get($key);
        if (! is_array($entry) || empty($entry['hash']) || ($entry['expires'] ?? 0) < time()) {
            Cache::forget($key);

            return false;
        }

        if (Hash::check($code, $entry['hash'])) {
            Cache::forget($key);

            return true;
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
