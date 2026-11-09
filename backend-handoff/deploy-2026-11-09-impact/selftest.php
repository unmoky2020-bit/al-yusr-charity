<?php
// Post-deploy self-test of the impact bundle. Everything runs inside a transaction that is rolled
// back, so nothing it writes stays (no rows, no log lines, no notifications).
$APP = getenv('APP') ?: getenv('HOME') . '/domains/api.elyusr.org/public_html';
require $APP . '/vendor/autoload.php';
$app = require $APP . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\CaseModel;
use App\Models\Donation;
use App\Models\Impact\CaseItem;
use App\Models\Impact\Distribution;
use App\Support\DeliverySteps;
use App\Support\Impact\ImpactNumbers;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

$ok = true;
$say = function (bool $pass, string $what) use (&$ok) {
    $ok = $ok && $pass;
    echo '  ' . ($pass ? '✓' : '✗') . ' ' . $what . PHP_EOL;
};

foreach (['case_items', 'case_followers', 'case_outcomes', 'distributions', 'distribution_donation'] as $t) {
    $say(Schema::hasTable($t), "table {$t}");
}

DB::beginTransaction();
try {
    $case = CaseModel::query()->first();
    if ($case) {
        $item = CaseItem::create(['case_id' => $case->id, 'title' => 'selftest', 'estimated_cost' => 100, 'status' => 'purchased', 'actual_cost' => 90]);
        $say(abs($item->fresh()->spent() - 90.0) < 0.001, 'case line: spent() reads the actual cost');
    } else {
        echo "  (no case to test lines on)\n";
    }

    $donation = Donation::where('status', 'paid')->latest('id')->first();
    if ($donation) {
        $before = DeliverySteps::stageOf($donation);
        DeliverySteps::append($donation, ['stage' => 'preparing', 'at' => now()->toIso8601String(), 'note' => 'selftest']);
        $say(DeliverySteps::stageOf($donation->fresh()) === 'preparing', 'delivery: a line moves the stage');
        DeliverySteps::append($donation, ['stage' => 'on_hold', 'at' => now()->toIso8601String(), 'note' => 'selftest hold']);
        $view = DeliverySteps::of($donation->fresh());
        $say(($view['stage'] ?? null) === 'preparing' && ! empty($view['hold']), 'delivery: on hold keeps the stage and shows the reason');
        DeliverySteps::undoLast($donation);
        DeliverySteps::undoLast($donation);
        $say(DeliverySteps::stageOf($donation->fresh()) === $before, 'delivery: undo returns to where it was');

        $d = Distribution::create(['title' => 'selftest', 'happened_on' => now()->toDateString(), 'stage' => 'delivered', 'donations_count' => 1, 'photos' => []]);
        DeliverySteps::append($donation, ['stage' => 'delivered', 'at' => now()->toIso8601String(), 'distribution' => ['id' => $d->id, 'title' => 'selftest']]);
        DeliverySteps::removeDistribution($donation, $d->id);
        $say(DeliverySteps::stageOf($donation->fresh()) === $before, 'distribution: undoing it removes its line');
    } else {
        echo "  (no paid donation to test the trail on)\n";
    }

    $n = ImpactNumbers::donations(ImpactNumbers::paid());
    $say(isset($n['collected'], $n['donors'], $n['delivered']), 'impact numbers: ' . number_format($n['collected']) . ' EGP from ' . $n['donors'] . ' donors');
} catch (\Throwable $e) {
    $say(false, 'exception: ' . $e->getMessage());
} finally {
    DB::rollBack();
}

exit($ok ? 0 : 1);
