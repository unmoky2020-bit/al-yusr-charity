<?php
// Self-test for the email system: writes inside a transaction and rolls back. Sends nothing.
$APP = getenv('APP') ?: getenv('HOME') . '/domains/api.elyusr.org/public_html';
require $APP . '/vendor/autoload.php';
$app = require $APP . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Http\Controllers\Api\V1\Mail\MailPublicController;
use App\Http\Controllers\Api\V1\Newsletter\NewsletterCampaignController;
use App\Models\NewsletterCampaign;
use App\Support\Mail\MailOutbox;
use App\Support\Mail\MailRenderer;
use App\Support\Mail\MailSettings;
use App\Support\Mail\MailTemplates;
use App\Support\Mail\MisbahaMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

$ok = true; $say = function ($p, $w) use (&$ok) { $ok = $ok && $p; echo '  ' . ($p ? '✓' : '✗') . " $w\n"; };

foreach (['code', 'welcome', 'receipt', 'delivery', 'failed', 'case_update', 'volunteer', 'newsletter_confirm', 'misbaha_confirm', 'misbaha_goal', 'misbaha_weekly'] as $k) {
    $t = MailTemplates::sample($k);
    $r = MailRenderer::render($t[1]);
    $say(str_contains($r['html'], 'مؤسسة اليسر الخيرية') && strlen($r['text']) > 50, "قالب «$k» بيترسم (" . strlen($r['html']) . " حرف)");
}
$r = MailRenderer::render(['title' => 't', 'track' => str_repeat('a', 32), 'blocks' => [['type' => 'button', 'label' => 'x', 'url' => 'https://elyusr.org/water']]]);
$say(str_contains($r['html'], '/mail/c/' . str_repeat('a', 32)) && str_contains($r['html'], '/mail/o/'), 'الروابط بتعدّي على عداد الضغطات');
$say(isset(MailSettings::all()['daily_limit']), 'الإعدادات: الحد اليومي ' . MailSettings::get('daily_limit') . '، الاحتياطي ' . MailSettings::get('reserve'));
$b = MailOutbox::budget();
$say($b['limit'] > 0, "اتبعت آخر 24 ساعة: {$b['sent_24h']}، باقي {$b['left']}");

$d = App\Models\Donation::where('status', 'paid')->latest('id')->first();
if ($d) {
    $t = MailTemplates::receipt($d, 'تجربة');
    $say(str_contains(MailRenderer::render($t[1])['html'], 'إيصال'), "إيصال تبرع حقيقي #{$d->id} بيترسم (من غير إرسال)");
}

DB::beginTransaction();
try {
    $id1 = MailOutbox::queue('selftest@example.com', 'x', ['title' => 'x'], 'test', 9, 'selftest:1');
    $id2 = MailOutbox::queue('selftest@example.com', 'x', ['title' => 'x'], 'test', 9, 'selftest:1');
    $say($id1 && ! $id2, 'الطابور ما بيكررش نفس الرسالة');

    $req = Request::create('/x', 'POST', ['subject' => 'تجربة', 'blocks' => ['title' => 'عنوان', 'items' => [['type' => 'text', 'text' => 'فقرة تجربة'], ['type' => 'button', 'label' => 'تبرع', 'url' => '/donate']]]]);
    $res = (new NewsletterCampaignController())->store($req)->getData(true)['data'];
    $c = NewsletterCampaign::find($res['id']);
    $html = (new NewsletterCampaignController())->preview($c)->getContent();
    $say(str_contains($html, 'فقرة تجربة'), 'حملة من بلوكات بتتحفظ وتتعاين');
    $n = NewsletterCampaignController::dispatch($c);
    $confirmed = DB::table('newsletter_subscribers')->where('status', 'confirmed')->count();
    $say($n === $confirmed, "الإرسال بيجهّز رسالة لكل مشترك مؤكد ($n)");
    $say(NewsletterCampaignController::dispatch($c) === null, 'نفس الحملة ما تتبعتش مرتين');

    $roomId = DB::table('misbaha_rooms')->insertGetId(['slug' => 'selftest-' . uniqid(), 'kind' => 'group', 'name' => 'تجربة', 'total_count' => 10, 'target_total' => 1000, 'is_hidden' => 0, 'created_at' => now(), 'updated_at' => now()]);
    $slug = DB::table('misbaha_rooms')->where('id', $roomId)->value('slug');
    (new MailPublicController())->misbahaSubscribe(Request::create('/x', 'POST', ['email' => 'selftest@example.com']), $slug);
    $sub = DB::table('misbaha_mail_subscriptions')->where('misbaha_room_id', $roomId)->first();
    $say($sub && ! $sub->confirmed_at && DB::table('mail_outbox')->where('kind', 'misbaha_confirm')->where('to_email', 'selftest@example.com')->exists(), 'متابعة السبحة بتبعت رسالة تأكيد');
    (new MailPublicController())->misbahaConfirm(Request::create('/x', 'POST', ['token' => $sub->token]));
    DB::table('misbaha_rooms')->where('id', $roomId)->update(['total_count' => 1000]);
    MisbahaMail::due();
    $say(DB::table('mail_outbox')->where('kind', 'misbaha_goal')->where('ref_id', $roomId)->exists(), 'وصول الهدف بيجهّز رسالة');
    MisbahaMail::due();
    $say(DB::table('mail_outbox')->where('kind', 'misbaha_goal')->where('ref_id', $roomId)->count() === 1, 'رسالة الهدف مرة واحدة بس');
} finally {
    DB::rollBack();
}
echo $ok ? "  الاختبار الذاتي تمام (ومفيش حاجة اتحفظت أو اتبعتت)\n" : "  في اختبار فشل\n";
exit($ok ? 0 : 1);
