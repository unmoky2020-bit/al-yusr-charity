<?php

namespace App\Http\Controllers\Api\V1\Backup;

use App\Http\Controllers\Controller;
use App\Support\Backup\BackupRunner;
use App\Support\StaffAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Dashboard → «النسخ الاحتياطية» (super admin only):
 *   GET    /admin/backups                    runs, Drive status, deploy backups, schedule health
 *   POST   /admin/backups {kind: db|full}    take one now (by the scheduler within a minute; at once if cron is off and kind=db)
 *   GET    /admin/backups/{id}/download?part=database|uploads|manifest
 *   DELETE /admin/backups/{id}               delete the copy on the server (Drive keeps its own)
 */
class BackupController extends Controller
{
    private function guard(Request $request): void
    {
        abort_unless(StaffAccess::isSuperAdmin($request->user()), 403, 'النسخ الاحتياطية للمدير العام بس.');
    }

    public function index(Request $request): JsonResponse
    {
        $this->guard($request);
        $runs = DB::table('backup_runs')->orderByDesc('id')->limit(60)->get()->map(function ($r) {
            $r->summary = $r->summary ? json_decode($r->summary, true) : null;
            $r->on_server = $r->file && is_dir(BackupRunner::dir() . '/' . $r->file);
            $r->parts = $r->on_server ? array_values(array_filter(['database', is_file(BackupRunner::dir() . '/' . $r->file . '/uploads.zip') ? 'uploads' : null])) : [];

            return $r;
        });
        $cron = Cache::get('mail-cron-last');
        $home = dirname(base_path(), 3);
        $deploys = [];
        foreach (glob($home . '/backups/*', GLOB_ONLYDIR) ?: [] as $d) {
            $deploys[] = ['name' => basename($d), 'at' => date('c', (int) filemtime($d)), 'rollback' => is_file($d . '/rollback.sh')];
        }
        usort($deploys, fn ($a, $b) => strcmp($b['at'], $a['at']));
        $free = @disk_free_space(BackupRunner::dir());

        return response()->json(['data' => [
            'runs' => $runs,
            'drive' => BackupRunner::driveStatus(),
            'deploys' => array_slice($deploys, 0, 40),
            'cron_ok' => $cron && now()->diffInMinutes(\Carbon\Carbon::parse($cron), true) <= 5,
            'cron_last' => $cron,
            'keep' => ['db' => BackupRunner::KEEP_DB, 'full' => BackupRunner::KEEP_FULL],
            'schedule' => ['db' => 'كل يوم 3:15 الفجر', 'full' => 'كل جمعة 4 الفجر'],
            'disk_free' => $free !== false ? (int) $free : null,
            'restore_cmd' => 'bash ~/yusr-restore.sh <اسم النسخة>',
        ]]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->guard($request);
        $kind = $request->validate(['kind' => ['required', 'in:db,full']])['kind'];
        if (DB::table('backup_runs')->whereIn('status', ['requested', 'running'])->exists()) {
            return response()->json(['message' => 'في نسخة شغالة أو مستنية بالفعل.'], 422);
        }
        $cron = Cache::get('mail-cron-last');
        $cronOk = $cron && now()->diffInMinutes(\Carbon\Carbon::parse($cron), true) <= 5;
        $id = DB::table('backup_runs')->insertGetId([
            'kind' => $kind, 'status' => 'requested', 'trigger' => 'dashboard', 'requested_by' => $request->user()->id,
            'created_at' => now(), 'updated_at' => now(),
        ]);
        if (! $cronOk && $kind === 'db') {
            BackupRunner::run('db', 'dashboard', $id, $request->user()->id);

            return response()->json(['message' => 'النسخة اتعملت.', 'data' => DB::table('backup_runs')->find($id)]);
        }

        return response()->json(['message' => $cronOk ? 'النسخة هتبدأ خلال دقيقة.' : 'المهمة المجدولة مش شغالة، فالنسخة الكاملة مستنية لما تشتغل.', 'data' => DB::table('backup_runs')->find($id)], 202);
    }

    public function download(Request $request, int $id)
    {
        $this->guard($request);
        $r = DB::table('backup_runs')->find($id);
        abort_unless($r && $r->file, 404, 'النسخة دي مش موجودة.');
        $part = (string) $request->query('part', 'database');
        $file = ['database' => 'database.sql.gz', 'uploads' => 'uploads.zip', 'manifest' => 'manifest.json'][$part] ?? null;
        $path = BackupRunner::dir() . '/' . $r->file . '/' . $file;
        abort_unless($file && is_file($path), 404, 'الملف ده مش موجود على السيرفر.');

        return response()->download($path, $r->file . '-' . $file);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->guard($request);
        $r = DB::table('backup_runs')->find($id);
        abort_unless($r, 404);
        $kept = DB::table('backup_runs')->where('status', 'done')->where('id', '!=', $id)->count();
        abort_if($r->status === 'done' && $kept === 0, 422, 'دي آخر نسخة على السيرفر، مش هتتمسح.');
        abort_if(in_array($r->status, ['running'], true), 422, 'النسخة لسه شغالة.');
        if ($r->file) {
            BackupRunner::removeFolder(BackupRunner::dir() . '/' . $r->file);
        }
        DB::table('backup_runs')->where('id', $id)->update(['status' => $r->status === 'requested' ? 'failed' : 'pruned', 'error' => $r->status === 'requested' ? 'اتلغت من اللوحة' : $r->error, 'updated_at' => now()]);

        return response()->json(['message' => 'اتمسحت من السيرفر.']);
    }
}
