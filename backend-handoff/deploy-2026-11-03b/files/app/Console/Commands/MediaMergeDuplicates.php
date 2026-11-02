<?php

namespace App\Console\Commands;

use App\Support\MediaUsage;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Throwable;

/**
 * Merge identical images: every reference to a copy is pointed at one original, then the copies
 * (now unused) are moved to the private trash. Nothing is hard-deleted.
 *
 *   php artisan media:merge-duplicates          → dry run: what would change (changes nothing)
 *   php artisan media:merge-duplicates --apply  → do it (a JSON log of every change is written)
 *
 * "Identical" = same size and same SHA-256. The original of a group is the copy under media/ if any,
 * else the oldest file. References are rewritten in every text / JSON column (same tables MediaUsage
 * scans), in all the forms they are stored: full URL, "/storage/…", "storage/…", disk-relative path,
 * JSON-escaped ("\/"), with or without the file extension.
 */
class MediaMergeDuplicates extends Command
{
    protected $signature = 'media:merge-duplicates {--apply : write the changes}';

    protected $description = 'Point every use of an identical image copy at one original and move the copies to the trash';

    private const FOLDERS = ['media', 'articles', 'axes', 'cases', 'contents', 'donation-campaigns', 'gallery', 'homepage', 'programs', 'projects', 'stories'];

    private const SKIP_TABLES = [
        'migrations', 'sessions', 'cache', 'cache_locks', 'jobs', 'job_batches', 'failed_jobs',
        'password_reset_tokens', 'password_resets', 'personal_access_tokens', 'telescope_entries',
        'telescope_entries_tags', 'telescope_monitoring', 'activity_log', 'activity_logs', 'audit_logs', 'notifications',
    ];

    private const PRIVATE_TABLES_RE = '/(document|receipt|donation(?!_campaign)|attachment|case_media|identity)/i';

    public function handle(): int
    {
        $apply = (bool) $this->option('apply');
        $disk = Storage::disk('public');
        MediaUsage::forget();
        $usage = MediaUsage::map();

        // 1. Groups of identical files.
        $bySize = [];
        foreach (self::FOLDERS as $dir) {
            if (! $disk->exists($dir)) {
                continue;
            }
            foreach ($disk->allFiles($dir) as $p) {
                if (preg_match('/\.(jpe?g|png|webp|gif|avif)$/i', $p)) {
                    $bySize[(string) $disk->size($p)][] = $p;
                }
            }
        }
        $groups = [];
        foreach ($bySize as $paths) {
            if (count($paths) < 2) {
                continue;
            }
            $byHash = [];
            foreach ($paths as $p) {
                $uses = MediaUsage::lookup($usage, $p);
                if ($this->isPrivate($uses)) {
                    continue; // receipts / documents are never touched
                }
                $byHash[hash_file('sha256', $disk->path($p))][] = $p;
            }
            foreach ($byHash as $same) {
                if (count($same) > 1) {
                    usort($same, function ($a, $b) use ($disk) {
                        $am = str_starts_with($a, 'media/') ? 0 : 1;
                        $bm = str_starts_with($b, 'media/') ? 0 : 1;

                        return $am <=> $bm ?: $disk->lastModified($a) <=> $disk->lastModified($b);
                    });
                    $groups[] = $same; // [0] = original
                }
            }
        }

        $copies = array_sum(array_map(fn ($g) => count($g) - 1, $groups));
        $bytes = array_sum(array_map(fn ($g) => (count($g) - 1) * $disk->size($g[0]), $groups));
        $this->info(sprintf('مجموعات صور متطابقة: %d — نسخ زيادة: %d — مساحة هتفضى: %.1f MB', count($groups), $copies, $bytes / 1048576));
        if (! $groups) {
            return self::SUCCESS;
        }

        // 2. Text columns to rewrite.
        $columns = [];
        foreach (DB::select(
            "SELECT TABLE_NAME AS t, COLUMN_NAME AS c FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = ? AND DATA_TYPE IN ('char','varchar','tinytext','text','mediumtext','longtext','json')",
            [DB::getDatabaseName()]
        ) as $col) {
            if (! in_array($col->t, self::SKIP_TABLES, true) && ! preg_match(self::PRIVATE_TABLES_RE, $col->t)) {
                $columns[$col->t][] = $col->c;
            }
        }

        // 3. One regex per copy → original.
        $rules = [];
        foreach ($groups as $g) {
            $original = $g[0];
            foreach (array_slice($g, 1) as $copy) {
                // Only the tables that use this copy are searched (MediaUsage lists them).
                $tables = array_values(array_unique(array_map(fn ($r) => explode('#', $r)[0], MediaUsage::lookup($usage, $copy))));
                $rules[] = [$copy, $original, $this->pattern($copy), pathinfo($copy, PATHINFO_FILENAME), $tables];
            }
        }

        $log = [];
        $changedRows = 0;
        $run = function () use ($columns, $rules, &$log, &$changedRows, $apply) {
            foreach ($rules as [$copy, $original, $re, $stem, $tables]) {
                foreach ($tables as $table) {
                    $cols = $columns[$table] ?? [];
                    if (! $cols || ! Schema::hasColumn($table, 'id')) {
                        continue;
                    }
                    foreach ($cols as $col) {
                        try {
                            $rows = DB::table($table)->select(['id', $col])->where($col, 'like', '%' . $stem . '%')->get();
                        } catch (Throwable $e) {
                            continue; // odd column: skip it
                        }
                        foreach ($rows as $row) {
                            $old = (string) $row->{$col};
                            $new = preg_replace_callback($re, function ($m) use ($original) {
                                $escaped = str_contains($m[0], '\\/');
                                $target = (($m[1] ?? '') !== '' ? 'storage/' : '') . $original;

                                return $escaped ? str_replace('/', '\\/', $target) : $target;
                            }, $old);
                            if ($new === null || $new === $old) {
                                continue;
                            }
                            $log[] = ['table' => $table, 'id' => $row->id, 'column' => $col, 'copy' => $copy, 'original' => $original, 'old' => $old, 'new' => $new];
                            $changedRows++;
                            if ($apply) {
                                DB::table($table)->where('id', $row->id)->update([$col => $new]);
                            }
                        }
                    }
                }
            }
        };

        if ($apply) {
            DB::transaction($run);
        } else {
            $run();
        }

        $perTable = [];
        foreach ($log as $l) {
            $perTable[$l['table'] . '.' . $l['column']] = ($perTable[$l['table'] . '.' . $l['column']] ?? 0) + 1;
        }
        $this->line('روابط هتتغيّر: ' . $changedRows);
        foreach ($perTable as $k => $n) {
            $this->line("  {$k}: {$n}");
        }

        if (! $apply) {
            $this->warn('(تجربة) مفيش حاجة اتغيّرت. للتنفيذ:  php artisan media:merge-duplicates --apply');

            return self::SUCCESS;
        }

        // 4. Copies are unused now → trash (re-checked on fresh usage data).
        MediaUsage::forget();
        Cache::forget('media-hash-index-v1');
        $fresh = MediaUsage::map();
        $stamp = now()->format('Y-m-d-His');
        $trashed = 0;
        $kept = [];
        foreach ($rules as [$copy]) {
            if (MediaUsage::lookup($fresh, $copy)) {
                $kept[] = $copy;
                continue;
            }
            $target = 'media-trash/merge-' . $stamp . '/' . $copy;
            Storage::disk('local')->makeDirectory(dirname($target));
            if (@rename($disk->path($copy), Storage::disk('local')->path($target))) {
                $trashed++;
            } else {
                $kept[] = $copy;
            }
        }
        Storage::disk('local')->put('media-trash/merge-' . $stamp . '/changes.json', json_encode([
            'changes' => $log, 'trashed_from' => 'public disk', 'kept' => $kept,
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT));
        MediaUsage::forget();
        Cache::forget('media-hash-index-v1');

        $this->info("✅ اتغيّر {$changedRows} رابط، واتنقلت {$trashed} نسخة للسلة.");
        if ($kept) {
            $this->warn('نسخ لسه مستخدمة فاتسابت مكانها: ' . count($kept));
        }
        $this->line('سجل التغييرات: ' . Storage::disk('local')->path('media-trash/merge-' . $stamp . '/changes.json'));

        return self::SUCCESS;
    }

    private function isPrivate(array $uses): bool
    {
        foreach ($uses as $ref) {
            if (preg_match(self::PRIVATE_TABLES_RE, explode('#', $ref)[0])) {
                return true;
            }
        }

        return false;
    }

    /**
     * Matches a reference to $copy ("gallery/abc.webp") in any stored form:
     *   [https://host/]storage/gallery/abc.webp, /storage/…, gallery/abc.webp, JSON "storage\/gallery\/abc.webp",
     *   and the same without the extension. Group 1 = the "storage/" prefix when present.
     * The host part of a full URL is kept (only "storage/<path>" is replaced).
     */
    private function pattern(string $copy): string
    {
        $dir = pathinfo($copy, PATHINFO_DIRNAME);
        $stem = pathinfo($copy, PATHINFO_FILENAME);
        $ext = pathinfo($copy, PATHINFO_EXTENSION);
        $slash = '\\\\?/';
        $dirRe = implode($slash, array_map(fn ($s) => preg_quote($s, '#'), explode('/', $dir)));

        return '#(?<![A-Za-z0-9_\-])(storage' . $slash . ')?' . $dirRe . $slash . preg_quote($stem, '#')
            . '(?:\.' . preg_quote($ext, '#') . ')?(?![A-Za-z0-9_\-.])#i';
    }
}
