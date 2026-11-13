<?php
/* Backups and speed (13 Nov 2026, h), loaded from routes/console.php. Runs from the hPanel cron:
 *   * * * * * /bin/bash -c "cd ~/domains/api.elyusr.org/public_html && /usr/bin/php artisan schedule:run"
 */
use Illuminate\Support\Facades\Schedule;

Schedule::command('perf:recache')->everyMinute()->withoutOverlapping(5);
Schedule::command('backup:run --pending')->everyMinute()->withoutOverlapping(30)->runInBackground();
Schedule::command('backup:run --kind=db')->dailyAt('01:15')->withoutOverlapping(30)->runInBackground();   // 03:15 Cairo
Schedule::command('backup:run --kind=full')->weeklyOn(5, '02:00')->withoutOverlapping(60)->runInBackground(); // Friday 04:00 Cairo
// Copy new backups to Google Drive (does nothing until ~/yusr-drive-setup.sh has linked Drive).
Schedule::exec('bash ' . escapeshellarg(dirname(base_path(), 3) . '/yusr-backup-sync.sh'))->everyFifteenMinutes()->withoutOverlapping(30)->runInBackground();
