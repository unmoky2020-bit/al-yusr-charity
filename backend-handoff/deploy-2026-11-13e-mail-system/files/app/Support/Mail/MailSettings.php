<?php

namespace App\Support\Mail;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Email switches the team controls from the dashboard (stored in site_blocks, key "mail_settings").
 * daily_limit: what the mailbox may send in 24 hours (Hostinger Starter: 100). We stay a few under it.
 * reserve: of that, how many stay free for codes and receipts; bulk mail (newsletter, weekly digests)
 * never eats into it.
 */
final class MailSettings
{
    public const KEY = 'mail_settings';

    public const DEFAULTS = [
        'daily_limit' => 95,
        'reserve' => 30,
        'welcome' => true,
        'receipt' => true,
        'delivery' => true,
        'failed' => false,
        'case_update' => true,
        'volunteer' => true,
        'misbaha_goal' => true,
        'misbaha_weekly' => true,
        'track' => true,
    ];

    public const AUTOMATIONS = ['welcome', 'receipt', 'delivery', 'failed', 'case_update', 'volunteer', 'misbaha_goal', 'misbaha_weekly'];

    public static function all(): array
    {
        return Cache::remember('mail_settings', 60, function () {
            $saved = [];
            try {
                if (Schema::hasTable('site_blocks')) {
                    $raw = DB::table('site_blocks')->where('key', self::KEY)->value('value');
                    $saved = is_string($raw) ? (json_decode($raw, true) ?: []) : [];
                }
            } catch (\Throwable $e) {
                report($e);
            }

            return self::clean(array_merge(self::DEFAULTS, $saved));
        });
    }

    public static function get(string $key)
    {
        return self::all()[$key] ?? self::DEFAULTS[$key] ?? null;
    }

    public static function on(string $automation): bool
    {
        return (bool) self::get($automation);
    }

    public static function save(array $input): array
    {
        $value = self::clean(array_merge(self::all(), array_intersect_key($input, self::DEFAULTS)));
        $now = now();
        $exists = DB::table('site_blocks')->where('key', self::KEY)->exists();
        $row = ['value' => json_encode($value, JSON_UNESCAPED_UNICODE), 'updated_at' => $now];
        $exists ? DB::table('site_blocks')->where('key', self::KEY)->update($row)
            : DB::table('site_blocks')->insert($row + ['key' => self::KEY, 'created_at' => $now]);
        Cache::forget('mail_settings');

        return $value;
    }

    private static function clean(array $s): array
    {
        $out = [];
        foreach (self::DEFAULTS as $k => $default) {
            $v = $s[$k] ?? $default;
            $out[$k] = is_bool($default) ? filter_var($v, FILTER_VALIDATE_BOOLEAN) : (int) $v;
        }
        $out['daily_limit'] = max(1, min(2000, $out['daily_limit']));
        $out['reserve'] = max(0, min($out['daily_limit'] - 1, $out['reserve']));

        return $out;
    }
}
