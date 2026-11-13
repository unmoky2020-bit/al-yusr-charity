<?php
/* Email pump (13 Nov 2026), loaded from routes/console.php. Needs one cron line on the server:
 *   * * * * * cd ~/domains/api.elyusr.org/public_html && php artisan schedule:run >> /dev/null 2>&1
 */
use Illuminate\Support\Facades\Schedule;

Schedule::command('mail:pump --max=20')->everyMinute()->withoutOverlapping(5)->runInBackground();
