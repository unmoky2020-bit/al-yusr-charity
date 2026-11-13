<?php
// Renders the code email to stdout (HTML) without sending; with an address argument it sends a test.
$base = getenv('HOME') . '/domains/api.elyusr.org/public_html';
require $base . '/vendor/autoload.php';
$app = require $base . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$body = "أهلًا احمد محمد،\n\nرمز استعادة كلمة المرور في موقع مؤسسة اليسر الخيرية:\n\n  104787\n\nالرمز صالح لمدة 15 دقيقة. لو لم تطلب تغيير كلمة المرور، تجاهل هذه الرسالة وحسابك بأمان.\n\nمؤسسة اليسر الخيرية\nhttps://elyusr.org";
$to = $argv[1] ?? null;
if ($to) { App\Support\EmailCode::mail($to, 'رمز استعادة كلمة المرور — مؤسسة اليسر الخيرية', $body); echo "sent to $to\n"; exit; }
$m = (new ReflectionMethod(App\Support\EmailCode::class, 'layout')); $m->setAccessible(true);
$data = $m->invoke(null, 'رمز استعادة كلمة المرور — مؤسسة اليسر الخيرية', $body);
$n = (new ReflectionMethod(App\Support\BrandMail::class, 'normalize')); $n->setAccessible(true);
echo view('emails.brand', ['m' => $n->invoke(null, 'رمز استعادة كلمة المرور — مؤسسة اليسر الخيرية', $data)])->render();
