<?php

namespace App\Support\Backup;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Backups made in PHP (no shell needed, so the dashboard and the scheduler can both start one):
 *   db   → database.sql.gz: every table's CREATE + INSERTs (cache/session/job tables: structure only)
 *   full → the same + uploads.zip (storage/app/public), in one folder per backup
 * Files live in storage/app/backups/<YYYY-MM-DD_HHMM>-<kind>/ with a manifest.json.
 * ~/yusr-backup-sync.sh (cron) copies that folder to Google Drive with rclone.
 * Restore: ~/yusr-restore.sh <folder> (takes a safety backup first).
 */
final class BackupRunner
{
    /** Tables whose rows are throwaway: only their structure is saved. */
    private const STRUCTURE_ONLY = ['cache', 'cache_locks', 'sessions', 'jobs', 'job_batches', 'failed_jobs', 'personal_access_tokens'];

    public const KEEP_DB = 14;
    public const KEEP_FULL = 4;

    public static function dir(): string
    {
        $d = storage_path('app/backups');
        if (! is_dir($d)) {
            @mkdir($d, 0750, true);
            @file_put_contents($d . '/.htaccess', "Require all denied\n");
        }

        return $d;
    }

    /** Start a requested (or new) run. Returns the run id. Only one backup at a time. */
    public static function run(string $kind = 'db', string $trigger = 'schedule', ?int $runId = null, ?int $userId = null): int
    {
        $kind = $kind === 'full' ? 'full' : 'db';
        $lock = Cache::lock('backup-running', 1800);
        if (! $lock->get()) {
            throw new \RuntimeException('في نسخة احتياطية شغالة دلوقتي.');
        }
        @set_time_limit(1500);
        @ini_set('memory_limit', '512M');
        $id = $runId ?? DB::table('backup_runs')->insertGetId([
            'kind' => $kind, 'status' => 'requested', 'trigger' => $trigger, 'requested_by' => $userId,
            'created_at' => now(), 'updated_at' => now(),
        ]);
        DB::table('backup_runs')->where('id', $id)->update(['status' => 'running', 'started_at' => now(), 'error' => null, 'updated_at' => now()]);
        $name = now('Africa/Cairo')->format('Y-m-d_Hi') . '-' . $kind . '-' . $id;
        $folder = self::dir() . '/' . $name;
        try {
            @mkdir($folder, 0750, true);
            $db = self::dumpDatabase($folder . '/database.sql.gz');
            $files = $kind === 'full' ? self::zipUploads($folder . '/uploads.zip') : null;
            $manifest = [
                'app' => 'elyusr-api', 'name' => $name, 'kind' => $kind, 'made_at' => now()->toIso8601String(),
                'database' => config('database.connections.mysql.database'), 'tables' => $db['tables'], 'rows' => $db['rows'],
                'uploads' => $files, 'laravel' => app()->version(), 'php' => PHP_VERSION,
                'restore' => 'bash ~/yusr-restore.sh ' . $name,
            ];
            file_put_contents($folder . '/manifest.json', json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
            $size = self::folderSize($folder);
            DB::table('backup_runs')->where('id', $id)->update([
                'status' => 'done', 'file' => $name, 'size' => $size, 'finished_at' => now(), 'updated_at' => now(),
                'summary' => json_encode(['tables' => count($db['tables']), 'rows' => $db['rows'], 'files' => $files['count'] ?? null], JSON_UNESCAPED_UNICODE),
            ]);
            self::prune();
        } catch (\Throwable $e) {
            DB::table('backup_runs')->where('id', $id)->update(['status' => 'failed', 'error' => Str::limit($e->getMessage(), 900), 'finished_at' => now(), 'updated_at' => now()]);
            self::removeFolder($folder);
            report($e);
        } finally {
            $lock->release();
        }

        return $id;
    }

    /** @return array{tables: array<string,int>, rows: int} */
    private static function dumpDatabase(string $path): array
    {
        $pdo = DB::connection()->getPdo();
        $gz = gzopen($path, 'wb6');
        if (! $gz) {
            throw new \RuntimeException('مش قادر أكتب ملف النسخة.');
        }
        $w = fn (string $s) => gzwrite($gz, $s);
        $w("-- Al-Yusr database backup " . now()->toIso8601String() . "\nSET NAMES utf8mb4;\nSET FOREIGN_KEY_CHECKS=0;\nSET SQL_MODE='NO_AUTO_VALUE_ON_ZERO';\n\n");
        $tables = [];
        $total = 0;
        foreach (DB::select('SHOW FULL TABLES') as $row) {
            $vals = array_values((array) $row);
            [$table, $type] = [$vals[0], $vals[1] ?? 'BASE TABLE'];
            if ($type !== 'BASE TABLE') {
                continue;
            }
            $create = (array) DB::selectOne('SHOW CREATE TABLE `' . str_replace('`', '``', $table) . '`');
            $w("DROP TABLE IF EXISTS `{$table}`;\n" . array_values($create)[1] . ";\n\n");
            $count = 0;
            if (! in_array($table, self::STRUCTURE_ONLY, true)) {
                $stmt = $pdo->query('SELECT * FROM `' . str_replace('`', '``', $table) . '`', \PDO::FETCH_NUM);
                $batch = [];
                while ($r = $stmt->fetch(\PDO::FETCH_NUM)) {
                    $batch[] = '(' . implode(',', array_map(fn ($v) => $v === null ? 'NULL' : $pdo->quote((string) $v), $r)) . ')';
                    $count++;
                    if (count($batch) >= 200) {
                        $w("INSERT INTO `{$table}` VALUES\n" . implode(",\n", $batch) . ";\n");
                        $batch = [];
                    }
                }
                if ($batch) {
                    $w("INSERT INTO `{$table}` VALUES\n" . implode(",\n", $batch) . ";\n");
                }
                $stmt->closeCursor();
            }
            $w("\n");
            $tables[$table] = $count;
            $total += $count;
        }
        $w("SET FOREIGN_KEY_CHECKS=1;\n");
        gzclose($gz);

        return ['tables' => $tables, 'rows' => $total];
    }

    /** @return array{count:int, bytes:int}|null */
    private static function zipUploads(string $path): ?array
    {
        $src = storage_path('app/public');
        if (! is_dir($src)) {
            return null;
        }
        if (! class_exists(\ZipArchive::class)) {
            throw new \RuntimeException('ZipArchive مش متاح على السيرفر، فالملفات ما اتنسختش.');
        }
        $zip = new \ZipArchive();
        if ($zip->open($path, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) !== true) {
            throw new \RuntimeException('مش قادر أعمل ملف الصور.');
        }
        $count = 0;
        $bytes = 0;
        $it = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($src, \FilesystemIterator::SKIP_DOTS));
        foreach ($it as $f) {
            if (! $f->isFile()) {
                continue;
            }
            $rel = substr($f->getPathname(), strlen($src) + 1);
            $zip->addFile($f->getPathname(), $rel);
            $zip->setCompressionName($rel, \ZipArchive::CM_STORE); // images are already compressed
            $count++;
            $bytes += $f->getSize();
        }
        $zip->close();

        return ['count' => $count, 'bytes' => $bytes];
    }

    /** Keep the newest KEEP_DB database backups and KEEP_FULL full ones (Drive keeps its own copies longer). */
    public static function prune(): void
    {
        foreach (['db' => self::KEEP_DB, 'full' => self::KEEP_FULL] as $kind => $keep) {
            $old = DB::table('backup_runs')->where('kind', $kind)->where('status', 'done')->whereNotNull('file')
                ->orderByDesc('id')->skip($keep)->take(100)->get();
            foreach ($old as $r) {
                self::removeFolder(self::dir() . '/' . $r->file);
                DB::table('backup_runs')->where('id', $r->id)->update(['status' => 'pruned', 'updated_at' => now()]);
            }
        }
    }

    public static function folderSize(string $folder): int
    {
        $n = 0;
        foreach (glob($folder . '/*') ?: [] as $f) {
            $n += is_file($f) ? filesize($f) : 0;
        }

        return $n;
    }

    public static function removeFolder(string $folder): void
    {
        if (! is_dir($folder) || ! str_starts_with(realpath($folder) ?: '', realpath(self::dir()) ?: '//')) {
            return;
        }
        foreach (glob($folder . '/*') ?: [] as $f) {
            @unlink($f);
        }
        @rmdir($folder);
    }

    /** What the Drive sync script last reported (written by ~/yusr-backup-sync.sh). */
    public static function driveStatus(): ?array
    {
        $f = self::dir() . '/drive-status.json';
        if (! is_file($f)) {
            return null;
        }
        $j = json_decode((string) file_get_contents($f), true);

        return is_array($j) ? $j : null;
    }
}
