<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;

/**
 * Keeps Laravel's config and route caches fresh (every minute from the scheduler): each request then
 * skips reading ~1,200 lines of route files and every config file. A cache is rebuilt as soon as any of
 * its sources (routes/*.php, config/*.php, .env, bootstrap/providers.php) is newer than it, so an edit
 * made directly on the server shows up within a minute. Config is not cached while app code calls env()
 * directly (that would return null once config is cached).
 */
class PerfRecache extends Command
{
    protected $signature = 'perf:recache {--force}';

    protected $description = 'Rebuild config/route caches when their sources changed';

    public function handle(): int
    {
        $base = base_path();
        $routesNewest = self::newest(array_merge(glob($base . '/routes/*.php') ?: [], [$base . '/bootstrap/providers.php', $base . '/.env']));
        $configNewest = self::newest(array_merge(glob($base . '/config/*.php') ?: [], [$base . '/.env', $base . '/bootstrap/providers.php']));
        $routesCache = app()->getCachedRoutesPath();
        $configCache = app()->getCachedConfigPath();
        $force = (bool) $this->option('force');

        if ($force || ! is_file($routesCache) || filemtime($routesCache) < $routesNewest) {
            $code = Artisan::call('route:cache');
            $this->line('routes: ' . ($code === 0 ? 'cached' : 'failed ' . trim(Artisan::output())));
            if ($code !== 0) {
                Artisan::call('route:clear');
            }
        }

        $envCalls = Cache::remember('perf-env-calls', 3600, fn () => self::envCallsOutsideConfig($base));
        if ($envCalls) {
            if (is_file($configCache)) {
                Artisan::call('config:clear');
            }
            $this->line('config: not cached (env() used in ' . implode(', ', array_slice($envCalls, 0, 3)) . ')');
        } elseif ($force || ! is_file($configCache) || filemtime($configCache) < $configNewest) {
            $code = Artisan::call('config:cache');
            $this->line('config: ' . ($code === 0 ? 'cached' : 'failed'));
            if ($code !== 0) {
                Artisan::call('config:clear');
            }
        }
        Cache::put('perf-recache-last', now()->toIso8601String(), 86400);

        return self::SUCCESS;
    }

    private static function newest(array $files): int
    {
        $t = 0;
        foreach ($files as $f) {
            if (is_file($f)) {
                $t = max($t, (int) filemtime($f));
            }
        }

        return $t;
    }

    /** Files under app/ and routes/ that call env( directly. */
    private static function envCallsOutsideConfig(string $base): array
    {
        $hits = [];
        foreach (['app', 'routes'] as $dir) {
            $it = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($base . '/' . $dir, \FilesystemIterator::SKIP_DOTS));
            foreach ($it as $f) {
                if ($f->getExtension() !== 'php') {
                    continue;
                }
                if (preg_match('/(?<![\w>:$])env\s*\(/', (string) file_get_contents($f->getPathname()))) {
                    $hits[] = substr($f->getPathname(), strlen($base) + 1);
                }
            }
        }

        return $hits;
    }
}
