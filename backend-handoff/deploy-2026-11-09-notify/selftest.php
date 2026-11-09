<?php
// Post-deploy self-test of the team notifications. Nothing is sent: notifications are faked and
// every row written inside the test is rolled back.
$APP = getenv('APP') ?: getenv('HOME') . '/domains/api.elyusr.org/public_html';
require $APP . '/vendor/autoload.php';
$app = require $APP . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\ContentChangeRequest;
use App\Models\User;
use App\Notifications\ChangeRequestReviewedNotification;
use App\Notifications\ChangeRequestSubmittedNotification;
use App\Notifications\FollowedCaseDonationNotification;
use App\Notifications\NewCampaignApplicationNotification;
use App\Notifications\NewVolunteerNotification;
use App\Observers\ContentChangeRequestObserver;
use App\Support\ChangeRequestLabel;
use Illuminate\Support\Facades\Notification;

$ok = true;
$say = function (bool $pass, string $what) use (&$ok) {
    $ok = $ok && $pass;
    echo '  ' . ($pass ? '✓' : '✗') . ' ' . $what . PHP_EOL;
};

$events = app('events');
foreach (['ContentChangeRequest' => ['created', 'updated'], 'Volunteer' => ['created'], 'VolunteerCampaignApplication' => ['created', 'updated']] as $model => $names) {
    foreach ($names as $e) {
        $say($events->hasListeners("eloquent.{$e}: App\\Models\\{$model}"), "observer on {$model} {$e}");
    }
}

$user = new User(['name' => 'تجربة']);
foreach ([
    new ChangeRequestSubmittedNotification(1, 'أحمد', 'تعديل في المدونة'),
    new ChangeRequestSubmittedNotification(2, 'أحمد', '', true),
    new ChangeRequestReviewedNotification(1, true, 'تعديل في المدونة', null, '/admin/blog'),
    new ChangeRequestReviewedNotification(1, false, 'تعديل في المدونة', 'الصورة محتاجة تتغير', '/admin/blog'),
    new NewVolunteerNotification(1, 'سارة', 'المنصورة'),
    new NewCampaignApplicationNotification(1, 3, 'سارة', 'قافلة الشتاء', true),
    new FollowedCaseDonationNotification(5, 'CASE-1', 'علاج طفل', '250', 9),
] as $n) {
    $a = $n->toArray($user);
    $say(! empty($a['type']) && ! empty($a['title']) && ! empty($a['message']), "{$a['type']}: «{$a['title']}» — {$a['message']}");
}

$r = new ContentChangeRequest(['route_uri' => 'api/v1/blog-seo/12', 'module' => 'v1', 'action' => 'update']);
$say(ChangeRequestLabel::describe($r) === 'تعديل في المدونة' && ChangeRequestLabel::sectionUrl($r) === '/admin/blog', 'label: ' . ChangeRequestLabel::describe($r));

// The observer end to end, with fake notifications (nothing reaches anyone).
Notification::fake();
$editor = User::whereHas('roles', fn ($q) => $q->where('slug', 'editor'))->first();
if ($editor) {
    $req = new ContentChangeRequest(['user_id' => $editor->id, 'route_uri' => 'api/v1/blog-seo/1', 'module' => 'v1', 'action' => 'update', 'status' => 'pending']);
    $req->id = 0;
    (new ContentChangeRequestObserver())->created($req);
    $admins = User::whereHas('roles', fn ($q) => $q->where('slug', 'super-admin'))->get();
    $say($admins->isNotEmpty() && Notification::sent($admins->first(), ChangeRequestSubmittedNotification::class)->isNotEmpty(), 'a pending change reaches the reviewers (' . $admins->count() . ')');
    $req->syncOriginal();
    $req->status = 'approved';
    $req->reviewed_by = optional($admins->first())->id;
    $req->syncChanges();
    (new ContentChangeRequestObserver())->updated($req);
    $say(Notification::sent($editor, ChangeRequestReviewedNotification::class)->isNotEmpty(), 'the approval reaches the editor');
} else {
    echo "  (no editor account to test the flow with)\n";
}

echo $ok ? "  selftest ok\n" : "  selftest FAILED\n";
exit($ok ? 0 : 1);
