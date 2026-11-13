<?php

namespace App\Console\Commands;

use App\Support\Backup\BackupRunner;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 *   php artisan backup:run --kind=db     database now
 *   php artisan backup:run --kind=full   database + uploaded files
 *   php artisan backup:run --pending     the oldest one requested from the dashboard (scheduler, every minute)
 */
class BackupRun extends Command
{
    protected $signature = 'backup:run {--kind=db} {--pending}';

    protected $description = 'Make a backup (database, or database + uploads) into storage/app/backups';

    public function handle(): int
    {
        if ($this->option('pending')) {
            $row = DB::table('backup_runs')->where('status', 'requested')->orderBy('id')->first();
            if (! $row) {
                return self::SUCCESS;
            }
            $id = BackupRunner::run($row->kind, $row->trigger, (int) $row->id, $row->requested_by ? (int) $row->requested_by : null);
        } else {
            $id = BackupRunner::run((string) $this->option('kind'), 'schedule');
        }
        $r = DB::table('backup_runs')->find($id);
        $this->line("backup #{$id}: {$r->status} " . ($r->file ?? '') . ' ' . ($r->error ?? ''));

        return $r->status === 'done' ? self::SUCCESS : self::FAILURE;
    }
}
