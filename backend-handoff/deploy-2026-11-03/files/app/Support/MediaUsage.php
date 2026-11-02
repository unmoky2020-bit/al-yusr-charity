<?php

namespace App\Support;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Throwable;

/**
 * Which stored images are used by the site, and where.
 *
 * Scans every text / JSON column of the app's tables once (cached 10 minutes) and collects the image
 * file names it finds. A file is "in use" when its name appears anywhere: a case cover, a program
 * image, a gallery row, an article body, a setting… File names are unique (time + random suffix),
 * so the name alone identifies the file.
 */
final class MediaUsage
{
    private const CACHE_KEY = 'media-usage-v1';

    /** Framework / log tables: never hold site images. */
    private const SKIP_TABLES = [
        'migrations', 'sessions', 'cache', 'cache_locks', 'jobs', 'job_batches', 'failed_jobs',
        'password_reset_tokens', 'password_resets', 'personal_access_tokens', 'telescope_entries',
        'telescope_entries_tags', 'telescope_monitoring', 'activity_log', 'notifications',
    ];

    private const IMAGE_RE = '/([A-Za-z0-9_\-.%]+\.(?:jpe?g|png|webp|gif|avif|svg))/i';

    /** Any ".../storage/<path>" reference, also ones saved without a file extension. */
    private const STORAGE_RE = '#storage/([A-Za-z0-9_\-./%]+)#i';

    /** @return array<string, string[]> lower-case file name => ["table#id", …] (max 5 per file) */
    public static function map(): array
    {
        return Cache::remember(self::CACHE_KEY, 600, fn () => self::scan());
    }

    public static function forget(): void
    {
        Cache::forget(self::CACHE_KEY);
    }

    /** @return string[] where the file is used (empty = unused) */
    public static function usesOf(string $path): array
    {
        return self::lookup(self::map(), $path);
    }

    /** Uses of a file in a scanned map: by its file name, or by its name without the extension. */
    public static function lookup(array $map, string $path): array
    {
        $name = strtolower(rawurldecode(basename($path)));
        $stem = 'stem:' . pathinfo($name, PATHINFO_FILENAME);

        return array_values(array_unique(array_merge($map[$name] ?? [], $map[$stem] ?? [])));
    }

    private static function scan(): array
    {
        $found = [];
        $db = DB::getDatabaseName();
        $columns = DB::select(
            "SELECT TABLE_NAME AS t, COLUMN_NAME AS c FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = ? AND DATA_TYPE IN ('char','varchar','tinytext','text','mediumtext','longtext','json')",
            [$db]
        );
        $byTable = [];
        foreach ($columns as $col) {
            if (in_array($col->t, self::SKIP_TABLES, true)) {
                continue;
            }
            $byTable[$col->t][] = $col->c;
        }

        foreach ($byTable as $table => $cols) {
            $hasId = Schema::hasColumn($table, 'id');
            foreach ($cols as $col) {
                try {
                    $q = DB::table($table)->select(array_filter([$hasId ? 'id' : null, $col]))
                        ->where($col, 'REGEXP', '\\.(jpe?g|png|webp|gif|avif|svg)|storage');
                    foreach ($q->cursor() as $row) {
                        $value = str_replace('\\/', '/', (string) ($row->{$col} ?? ''));
                        if ($value === '') {
                            continue;
                        }
                        $keys = [];
                        if (preg_match_all(self::IMAGE_RE, $value, $m)) {
                            foreach ($m[1] as $name) {
                                $keys[] = strtolower(rawurldecode(basename($name)));
                            }
                        }
                        if (preg_match_all(self::STORAGE_RE, $value, $m)) {
                            foreach ($m[1] as $ref) {
                                $stem = pathinfo(strtolower(rawurldecode(basename($ref))), PATHINFO_FILENAME);
                                if (strlen($stem) >= 6) {
                                    $keys[] = 'stem:' . $stem;
                                }
                            }
                        }
                        if (! $keys) {
                            continue;
                        }
                        $ref = $hasId ? $table . '#' . $row->id : $table;
                        foreach (array_unique($keys) as $key) {
                            $list = $found[$key] ?? [];
                            if (count($list) < 5 && ! in_array($ref, $list, true)) {
                                $list[] = $ref;
                            }
                            $found[$key] = $list;
                        }
                    }
                } catch (Throwable $e) {
                    // A view or an odd column type: skip it, the rest still counts.
                    continue;
                }
            }
        }

        return $found;
    }
}
