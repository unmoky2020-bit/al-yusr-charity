<?php
/*
 * Permanently removes accounts that were already deleted (soft-deleted) from the dashboard.
 *   php ~/purge-deleted-users.php            → dry run: lists them and what is linked to each
 *   php ~/purge-deleted-users.php --yes      → JSON copy to ~/backups/purged-users-<time>.json (600), then deletes
 * Active accounts are never touched. An account that still owns rows the database won't let go of
 * (a foreign key) is skipped and reported.
 */
$APP = getenv('APP') ?: getenv('HOME') . '/domains/api.elyusr.org/public_html';
require $APP . '/vendor/autoload.php';
$app = require $APP . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

$yes = in_array('--yes', $argv, true);
// --keep=5,9,25 : leave these deleted accounts (their review history / activity log stays readable)
$keep = [];
foreach ($argv as $a) {
    if (str_starts_with($a, '--keep=')) {
        $keep = array_map('intval', explode(',', substr($a, 7)));
    }
}
$users = App\Models\User::onlyTrashed()->with('roles')->whereNotIn('id', $keep ?: [0])->orderBy('id')->get();
echo "حسابات ممسوحة: " . $users->count() . "\n";
$linked = [];
$tables = array_map(fn ($t) => array_values((array) $t)[0], DB::select('SHOW TABLES'));
foreach ($tables as $t) {
    if (Schema::hasColumn($t, 'user_id') && $t !== 'released_identities') {
        $linked[] = $t;
    }
}
foreach ($users as $u) {
    $refs = [];
    foreach ($linked as $t) {
        $n = DB::table($t)->where('user_id', $u->id)->count();
        if ($n) {
            $refs[] = "$t:$n";
        }
    }
    printf("  #%d %s | %s | %s | ممسوح %s | %s\n", $u->id, $u->name, preg_replace('/^(.).*@/', '$1***@', (string) $u->email), $u->roles->pluck('slug')->implode('+') ?: '—', $u->deleted_at, $refs ? implode(' ', $refs) : 'مفيش بيانات مربوطة');
}
if (! $yes) {
    echo "\n(تجربة بس) للحذف النهائي: php ~/purge-deleted-users.php --yes\n";
    exit(0);
}
$dir = getenv('HOME') . '/backups';
@mkdir($dir, 0700, true);
$file = $dir . '/purged-users-' . date('Ymd-His') . '.json';
$dump = $users->map(fn ($u) => $u->makeVisible(['password'])->toArray())->all();
file_put_contents($file, json_encode($dump, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
chmod($file, 0600);
echo "نسخة قبل الحذف: $file\n";
$done = 0;
foreach ($users as $u) {
    try {
        DB::transaction(function () use ($u) {
            $u->roles()->detach();
            $u->tokens()->delete();
            DB::table('notifications')->where('notifiable_type', get_class($u))->where('notifiable_id', $u->id)->delete();
            $u->forceDelete();
        });
        $done++;
    } catch (Throwable $e) {
        echo "  اتساب #{$u->id}: " . substr($e->getMessage(), 0, 160) . "\n";
    }
}
echo "اتحذف نهائي: $done من " . $users->count() . "\n";
