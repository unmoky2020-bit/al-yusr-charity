<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Minishlink\WebPush\VAPID;

/** php artisan webpush:vapid — creates the VAPID key pair once and stores it in .env (never printed). */
class GenerateVapidKeys extends Command
{
    protected $signature = 'webpush:vapid {--force : Replace existing keys (every browser must subscribe again)}';

    protected $description = 'Generate Web Push VAPID keys into .env';

    public function handle(): int
    {
        $envPath = base_path('.env');
        $env = file_get_contents($envPath);

        if (str_contains($env, 'WEBPUSH_PUBLIC_KEY=') && !$this->option('force')) {
            $this->info('VAPID keys already exist (use --force to replace).');

            return self::SUCCESS;
        }

        $keys = VAPID::createVapidKeys();
        $env = preg_replace('/^WEBPUSH_(PUBLIC|PRIVATE)_KEY=.*\R?/m', '', $env);
        $env = rtrim($env) . PHP_EOL . PHP_EOL
            . 'WEBPUSH_PUBLIC_KEY=' . $keys['publicKey'] . PHP_EOL
            . 'WEBPUSH_PRIVATE_KEY=' . $keys['privateKey'] . PHP_EOL;
        file_put_contents($envPath, $env);

        $this->info('VAPID keys written to .env');

        return self::SUCCESS;
    }
}
