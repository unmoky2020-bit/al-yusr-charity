<?php
/* Backups and speed (13 Nov 2026, h), loaded from routes/console.php. Needs the cron line:
 *   * * * * * cd ~/domains/api.elyusr.org/public_html && php artisan schedule:run >> /dev/null 2>&1
 */
use Illuminate\Support\Facades\Schedule;

Schedule::command('perf:recache')->everyMinute()->withoutOverlapping(5);
Schedule::command('backup:run --pending')->everyMinute()->withoutOverlapping(30)->runInBackground();
Schedule::command('backup:run --kind=db')->dailyAt('01:15')->withoutOverlapping(30)->runInBackground();   // 03:15 Cairo
Schedule::command('backup:run --kind=full')->weeklyOn(5, '02:00')->withoutOverlapping(60)->runInBackground(); // Friday 04:00 Cairo
