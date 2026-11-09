<?php

namespace App\Http\Controllers\Api\V1\Impact;

use App\Http\Controllers\Controller;
use App\Models\CaseModel;
use App\Models\Impact\CaseItem;
use App\Models\Impact\CaseOutcome;
use App\Support\Impact\ImpactNumbers;
use App\Support\Impact\Targets;
use App\Support\Viewer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

/**
 * The public impact report, built only from real records (no donor names anywhere):
 *   GET /impact                    totals, every program / project / campaign with money, recent
 *                                  distribution days and finished cases
 *   GET /impact/{kind}/{key}       one program / project / campaign / case (id, slug or case code)
 */
class ImpactController extends Controller
{
    public function overview(): JsonResponse
    {
        $data = Cache::remember(ImpactNumbers::CACHE_KEY, 120, function () {
            $paid = ImpactNumbers::paid();
            // Numbers count every distribution day; photos and details only come from public ones.
            $all = ImpactNumbers::distributions(null, null, false);
            $distributions = $all->where('is_public', true)->values();
            $cases = ImpactNumbers::cases();

            $targets = [];
            foreach (['program', 'project', 'campaign'] as $kind) {
                $col = Targets::COLUMN[$kind];
                foreach ($paid->whereNotNull($col)->groupBy($col) as $id => $rows) {
                    $card = Targets::card($kind, Targets::find($kind, (int) $id));
                    if (! $card) {
                        continue;
                    }
                    $dist = $all->where('target_kind', $kind)->where('target_id', (int) $id);
                    $targets[] = $card + ImpactNumbers::donations($rows) + [
                        'families' => (int) $dist->sum('families_count'),
                        'distributions' => $dist->count(),
                        'last_distribution_on' => optional($dist->first()?->happened_on)->toDateString(),
                    ];
                }
            }
            usort($targets, fn ($a, $b) => $b['collected'] <=> $a['collected']);

            return [
                'totals' => ImpactNumbers::donations($paid) + [
                    'families' => (int) $all->sum('families_count'),
                    'distributions' => $all->count(),
                ] + ImpactNumbers::casesSummary($cases),
                'targets' => $targets,
                'distributions' => $distributions->take(12)->map(fn ($d) => ImpactNumbers::distributionCard($d))->values(),
                'finished_cases' => $this->finishedCases($cases, 6),
                'updated_at' => now()->toIso8601String(),
            ];
        });

        return response()->json(['data' => $data]);
    }

    public function target(Request $request, string $kind, string $key): JsonResponse
    {
        abort_unless(isset(Targets::COLUMN[$kind]), 404);
        $model = Targets::find($kind, $key);
        abort_unless($model !== null, 404);
        if ($kind === 'case' && ! Viewer::isStaff($request) && ! in_array($model->status, ['approved', 'completed'], true)) {
            abort(404);
        }

        $rows = ImpactNumbers::paid()->where(Targets::COLUMN[$kind], $model->getKey());
        $all = ImpactNumbers::distributions($kind, (int) $model->getKey(), false);
        $distributions = $all->where('is_public', true)->values();
        $cases = ImpactNumbers::cases($kind, (int) $model->getKey());

        return response()->json(['data' => [
            'target' => Targets::card($kind, $model),
            'numbers' => ImpactNumbers::donations($rows) + [
                'families' => (int) $all->sum('families_count'),
                'distributions' => $all->count(),
            ] + ImpactNumbers::casesSummary($cases),
            'monthly' => ImpactNumbers::monthly($rows),
            'distributions' => $distributions->take(30)->map(fn ($d) => ImpactNumbers::distributionCard($d))->values(),
            'cases' => $this->caseCards($cases->take(24)),
        ]]);
    }

    private function finishedCases($cases, int $limit): array
    {
        $done = CaseOutcome::whereIn('case_id', $cases->pluck('id'))->where('result', 'completed')
            ->latest('completed_on')->limit($limit)->get()->keyBy('case_id');

        return $this->caseCards($cases->whereIn('id', $done->keys())->values(), $done);
    }

    private function caseCards($cases, $outcomes = null): array
    {
        $ids = $cases->pluck('id');
        $outcomes ??= CaseOutcome::whereIn('case_id', $ids)->get()->keyBy('case_id');
        $spent = CaseItem::whereIn('case_id', $ids)->get()->groupBy('case_id')
            ->map(fn ($items) => round((float) $items->sum(fn (CaseItem $i) => $i->spent()), 2));
        $collected = ImpactNumbers::paid()->whereIn('case_id', $ids)->groupBy('case_id')->map(fn ($r) => round((float) $r->sum('amount'), 2));

        return $cases->map(function (CaseModel $c) use ($outcomes, $spent, $collected) {
            $o = $outcomes[$c->id] ?? null;
            $cover = $c->cover_image;
            if ($cover && ! preg_match('#^https?://#i', $cover)) {
                $cover = Storage::disk('public')->url(ltrim(preg_replace('#^/?storage/#', '', $cover), '/'));
            }

            return array_filter([
                'code' => $c->code,
                'title' => $c->title,
                'place' => trim(implode('، ', array_filter([$c->city, $c->governorate]))) ?: null,
                'status' => $c->status,
                'cover' => $cover,
                'target' => (float) $c->target_amount,
                'collected' => $collected[$c->id] ?? 0.0,
                'spent' => $spent[$c->id] ?? 0.0,
                'outcome' => $o?->only(['result', 'summary', 'before_url', 'after_url', 'completed_on']),
            ], fn ($v) => $v !== null && $v !== '');
        })->values()->all();
    }
}
