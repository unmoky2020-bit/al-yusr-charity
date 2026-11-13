<?php
$APP = getenv('APP') ?: getenv('HOME') . '/domains/api.elyusr.org/public_html';
require $APP . '/vendor/autoload.php';
$app = require $APP . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Http\Controllers\Api\V1\Extras\ChangeRequestDetailsController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

$ok = true;
$admin = App\Models\User::whereHas('roles', fn ($q) => $q->where('slug', 'super-admin'))->first();
$ids = DB::table('content_change_requests')->orderByDesc('id')->limit(5)->pluck('id')->implode(',');
$req = Request::create('/x', 'GET', ['ids' => $ids]);
$req->setUserResolver(fn () => $admin);
$data = (new ChangeRequestDetailsController())->index($req)->getData(true)['data'];
foreach ($data as $id => $d) {
    $changed = collect($d['changes'])->where('changed', true)->count();
    echo "  #$id {$d['target']['table']}#{$d['target']['id']} «" . mb_substr((string) $d['target']['title'], 0, 40) . "» من " . ($d['author']['name'] ?? '—') . " — {$changed} حقل متغير من " . count($d['changes']) . PHP_EOL;
}
$ok = count($data) > 0 && collect($data)->every(fn ($d) => array_key_exists('changes', $d));
$editor = App\Models\User::whereHas('roles', fn ($q) => $q->where('slug', 'editor'))->first();
if ($editor) {
    $r2 = Request::create('/x', 'GET', ['ids' => $ids]);
    $r2->setUserResolver(fn () => $editor);
    try { (new ChangeRequestDetailsController())->index($r2); echo "  ✗ المحرر شاف التفاصيل\n"; $ok = false; }
    catch (Symfony\Component\HttpKernel\Exception\HttpException $e) { echo "  ✓ المحرر ممنوع ({$e->getStatusCode()})\n"; }
}
echo $ok ? "  الاختبار الذاتي تمام\n" : "  في اختبار فشل\n";
exit($ok ? 0 : 1);
