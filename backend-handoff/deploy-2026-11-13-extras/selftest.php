<?php
// Post-deploy self-test of the extras bundle. Every row written here is rolled back.
$APP = getenv('APP') ?: getenv('HOME') . '/domains/api.elyusr.org/public_html';
require $APP . '/vendor/autoload.php';
$app = require $APP . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Http\Controllers\Api\V1\Extras\PackageImageController;
use App\Http\Controllers\Api\V1\Extras\SiteBlockController;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;

$ok = true;
$say = function (bool $pass, string $what) use (&$ok) {
    $ok = $ok && $pass;
    echo '  ' . ($pass ? '✓' : '✗') . ' ' . $what . PHP_EOL;
};

$say(Schema::hasTable('package_images') && Schema::hasTable('site_blocks'), 'الجدولين موجودين');

DB::beginTransaction();
try {
    $pkg = DB::table('program_donation_packages')->whereNotNull('program_id')->first();
    $admin = User::whereHas('roles', fn ($q) => $q->where('slug', 'super-admin'))->first();
    $plain = User::whereDoesntHave('roles')->first();

    if ($pkg && $admin) {
        $c = new PackageImageController();
        $req = Request::create('/x', 'PUT', ['image' => '/storage/media/test.webp']);
        $req->setUserResolver(fn () => $admin);
        $res = $c->update($req, (int) $pkg->id)->getData(true)['data'];
        $say(str_contains($res['image'], 'media/test.webp') && ! str_contains($res['image'], 'storage/storage'), "صورة الباقة #{$pkg->id} اتحفظت: {$res['image']}");
        $say($res['alt_ar'] === $pkg->name_ar, 'الوصف الافتراضي = اسم الباقة');
        $map = $c->index()->getData(true)['data'];
        $say(isset($map[(string) $pkg->id]), 'الخريطة العامة فيها الباقة');

        $bad = Request::create('/x', 'PUT', ['image' => 'javascript:alert(1)']);
        $bad->setUserResolver(fn () => $admin);
        try { $c->update($bad, (int) $pkg->id); $say(false, 'رابط مش صالح اترفض'); } catch (ValidationException) { $say(true, 'رابط مش صالح اترفض'); }

        if ($plain) {
            $no = Request::create('/x', 'PUT', ['image' => '/storage/a.webp']);
            $no->setUserResolver(fn () => $plain);
            try { $c->update($no, (int) $pkg->id); $say(false, 'حساب من غير صلاحية اترفض'); } catch (HttpException $e) { $say($e->getStatusCode() === 403, 'حساب من غير صلاحية اترفض (403)'); }
        }
        try { $c->update($req, 999999999); $say(false, 'باقة مش موجودة → 404'); } catch (HttpException $e) { $say($e->getStatusCode() === 404, 'باقة مش موجودة → 404'); }

        $del = Request::create('/x', 'DELETE');
        $del->setUserResolver(fn () => $admin);
        $c->destroy($del, (int) $pkg->id);
        $map = $c->index()->getData(true)['data'];
        $say(! isset($map[(string) $pkg->id]), 'المسح شال الصورة');
    } else {
        echo "  (مفيش باقة أو مدير عام — اتخطّى اختبار الصور)" . PHP_EOL;
    }

    $s = new SiteBlockController();
    $req = Request::create('/x', 'PUT', ['value' => ['phone' => '01000000000', 'facebook' => 'https://facebook.com/x', 'unknown' => 'ignored']]);
    $res = $s->update($req, 'org_info')->getData(true)['data']['org_info'];
    $say($res === ['phone' => '01000000000', 'facebook' => 'https://facebook.com/x'], 'بيانات المؤسسة: الحقول المعروفة بس');
    try { $s->update(Request::create('/x', 'PUT', ['value' => ['facebook' => 'http://x']]), 'org_info'); $say(false, 'رابط من غير https اترفض'); } catch (ValidationException) { $say(true, 'رابط من غير https اترفض'); }
    $res = $s->update(Request::create('/x', 'PUT', ['value' => [['year' => '2019', 'title_ar' => 'الإشهار']]]), 'about_milestones')->getData(true)['data']['about_milestones'];
    $say(count($res) === 1 && $res[0]['year'] === '2019', 'محطات من نحن اتحفظت');
    try { $s->update(Request::create('/x', 'PUT', ['value' => ['header' => [['label_ar' => 'x', 'href' => 'javascript:1']]]]), 'nav_links'); $say(false, 'رابط قائمة مش صالح اترفض'); } catch (ValidationException) { $say(true, 'رابط قائمة مش صالح اترفض'); }
    $all = $s->index()->getData(true)['data'];
    $say(isset($all['org_info'], $all['about_milestones']), 'GET site-blocks بيرجّع الأقسام');
} finally {
    DB::rollBack();
    Illuminate\Support\Facades\Cache::forget('extras.package_images.v1');
    Illuminate\Support\Facades\Cache::forget('extras.site_blocks.v1');
}
echo $ok ? "  الاختبار الذاتي تمام (ومفيش حاجة اتحفظت)\n" : "  في اختبار فشل\n";
exit($ok ? 0 : 1);
