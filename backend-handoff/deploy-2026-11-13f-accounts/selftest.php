<?php
// Sign-up over a deleted account's email/phone, inside a transaction that is rolled back.
$APP = getenv('APP') ?: getenv('HOME') . '/domains/api.elyusr.org/public_html';
require $APP . '/vendor/autoload.php';
$app = require $APP . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
use Illuminate\Support\Facades\DB;

$ok = true; $say = function ($p, $w) use (&$ok) { $ok = $ok && $p; echo '  ' . ($p ? '✓' : '✗') . " $w\n"; };
DB::beginTransaction();
try {
    $email = 'selftest-' . uniqid() . '@elyusr.org'; $phone = '019' . random_int(10000000, 99999999);
    $id = DB::table('users')->insertGetId(['name' => 'محذوف', 'email' => $email, 'phone' => $phone, 'password' => 'x', 'status' => 'active', 'created_at' => now(), 'updated_at' => now(), 'deleted_at' => now()]);
    $active = DB::table('users')->whereNull('deleted_at')->first();
    $n = App\Support\IdentityRelease::free($email, $phone);
    $row = DB::table('users')->find($id);
    $say($n === 1 && $row->email === "deleted-{$id}@deleted.invalid" && $row->phone === "deleted-{$id}", 'الحساب المحذوف ساب البريد والموبايل');
    $say(DB::table('released_identities')->where('user_id', $id)->where('email', $email)->exists(), 'البريد الأصلي محفوظ');
    $say(App\Support\IdentityRelease::free($active->email, null) === 0 && DB::table('users')->find($active->id)->email === $active->email, 'الحسابات الشغالة ما اتلمستش');

    // Sign-up form over a deleted account's email/phone
    $email2 = 'selftest2-' . uniqid() . '@elyusr.org'; $phone2 = '019' . random_int(10000000, 99999999);
    DB::table('users')->insert(['name' => 'محذوف', 'email' => $email2, 'phone' => $phone2, 'password' => 'x', 'status' => 'active', 'created_at' => now(), 'updated_at' => now(), 'deleted_at' => now()]);
    $req = Illuminate\Http\Request::create('/api/v1/register', 'POST', ['name' => 'تجربة', 'email' => $email2, 'phone' => $phone2, 'password' => 'Aa123456!x', 'password_confirmation' => 'Aa123456!x', 'role' => 'donor']);
    $app->instance('request', $req);
    try {
        $app->make(App\Http\Requests\Auth\RegisterRequest::class); // validates (no account is created here: no notifications go out)
        $say(DB::table('users')->whereNotNull('deleted_at')->where('email', $email2)->doesntExist(), 'فورم التسجيل قبل نفس بريد وموبايل حساب محذوف');
    } catch (Illuminate\Validation\ValidationException $e) {
        $say(false, 'التسجيل اترفض: ' . json_encode($e->errors(), JSON_UNESCAPED_UNICODE));
    }
} finally {
    DB::rollBack();
}
echo $ok ? "  الاختبار تمام (ومفيش حاجة اتحفظت)\n" : "  في اختبار فشل\n";
exit($ok ? 0 : 1);
