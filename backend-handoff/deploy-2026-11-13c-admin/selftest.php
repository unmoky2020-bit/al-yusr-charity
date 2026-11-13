<?php
$APP = getenv('APP') ?: getenv('HOME') . '/domains/api.elyusr.org/public_html';
require $APP . '/vendor/autoload.php';
$app = require $APP . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
use App\Http\Controllers\Api\V1\Extras\MisbahaAdminController;
use App\Http\Controllers\Api\V1\Extras\RecordExtrasController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
$ok = true; $say = function ($p, $w) use (&$ok) { $ok = $ok && $p; echo '  ' . ($p ? '✓' : '✗') . " $w\n"; };
$admin = App\Models\User::whereHas('roles', fn ($q) => $q->where('slug', 'super-admin'))->first();
DB::beginTransaction();
try {
    $pid = DB::table('projects')->value('id');
    if ($pid) {
        $r = Request::create('/x', 'PUT', ['ai_summary_ar' => 'ملخص تجربة', 'ai_faq_ar' => '[]']); $r->setUserResolver(fn () => $admin);
        (new RecordExtrasController())->update($r, 'project', (int) $pid);
        $d = (new RecordExtrasController())->show('project', (int) $pid)->getData(true)['data'];
        $say(($d['ai_summary_ar'] ?? '') === 'ملخص تجربة', "ملخص المشروع #$pid اتحفظ واتقرا");
    }
    $id = DB::table('misbaha_rooms')->insertGetId(['slug' => 'selftest-' . uniqid(), 'kind' => 'group', 'name' => 'تجربة', 'total_count' => 5, 'is_hidden' => 0, 'created_at' => now(), 'updated_at' => now()]);
    $r = Request::create('/x', 'PATCH', ['name' => 'تجربة ٢', 'target_total' => 1000, 'reset_count' => true]);
    $row = (new MisbahaAdminController())->update($r, $id)->getData(true)['data'];
    $say($row['name'] === 'تجربة ٢' && (int) $row['total_count'] === 0 && (int) $row['target_total'] === 1000, 'تعديل السبحة وتصفير العداد');
    (new MisbahaAdminController())->destroy($id);
    $say(! DB::table('misbaha_rooms')->where('id', $id)->exists(), 'الحذف الفعلي');
} finally { DB::rollBack(); }
echo $ok ? "  الاختبار الذاتي تمام (ومفيش حاجة اتحفظت)\n" : "  في اختبار فشل\n"; exit($ok ? 0 : 1);
