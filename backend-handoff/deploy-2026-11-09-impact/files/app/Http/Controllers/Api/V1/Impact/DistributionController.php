<?php

namespace App\Http\Controllers\Api\V1\Impact;

use App\Http\Controllers\Controller;
use App\Models\Donation;
use App\Models\Impact\Distribution;
use App\Notifications\DonorDeliveryStageNotification;
use App\Services\ActivityLogService;
use App\Support\DeliverySteps;
use App\Support\Impact\Evidence;
use App\Support\Impact\ImpactNumbers;
use App\Support\Impact\Targets;
use App\Support\NotifyDonor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * Distribution days: one entry moves many paid donations one delivery step at once (each donation's
 * own trail gets a line that points here), with the photos and the number of families.
 *
 *   GET    /distributions                   list (staff)
 *   GET    /distributions/candidates        paid donations of a target that can take the next step
 *   POST   /distributions                   create + apply   { …, donation_ids[], client_key? }
 *   GET    /distributions/{distribution}    one, with its donations (staff)
 *   PUT    /distributions/{distribution}    edit the record (title, note, photos, families, public)
 *   DELETE /distributions/{distribution}    undo it: its lines leave every donation's trail
 * Safe to repeat: the same client_key returns the first result instead of applying twice.
 */
class DistributionController extends Controller
{
    private const MAX_DONATIONS = 1000;

    public function __construct(private ActivityLogService $log)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $q = Distribution::query()->latest('happened_on')->latest('id');
        if ($request->filled('target_kind')) {
            $q->where('target_kind', $request->input('target_kind'))->where('target_id', (int) $request->input('target_id'));
        }
        $page = $q->paginate(min(50, max(1, (int) $request->input('per_page', 20))));

        return response()->json([
            'data' => collect($page->items())->map(fn (Distribution $d) => $this->card($d))->values(),
            'meta' => ['current_page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'total' => $page->total()],
        ]);
    }

    public function candidates(Request $request): JsonResponse
    {
        $data = $request->validate([
            'target_kind' => ['nullable', Rule::in(array_keys(Targets::COLUMN))],
            'target_id' => ['nullable', 'integer', 'required_with:target_kind'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
            'stage' => ['nullable', Rule::in([...DeliverySteps::STAGES, DeliverySteps::ON_HOLD])],
        ]);

        $q = Donation::with('donor:id,name')->where('status', 'paid')->latest('id');
        if (! empty($data['target_kind'])) {
            $q->where(Targets::COLUMN[$data['target_kind']], $data['target_id']);
        }
        if (! empty($data['from'])) {
            $q->whereDate('created_at', '>=', $data['from']);
        }
        if (! empty($data['to'])) {
            $q->whereDate('created_at', '<=', $data['to']);
        }

        $next = $data['stage'] ?? null;
        $rows = $q->limit(self::MAX_DONATIONS)->get()->map(function (Donation $d) use ($next) {
            $stage = DeliverySteps::stageOf($d);

            return [
                'id' => $d->id,
                'reference' => $d->transaction_reference,
                'amount' => (float) $d->amount,
                'donor' => $d->donor?->name ?: $d->donor_name ?: null,
                'created_at' => optional($d->created_at)->toIso8601String(),
                'stage' => $stage,
                'eligible' => $next ? $this->eligible($stage, $next) : $stage !== 'delivered',
            ];
        });

        return response()->json(['data' => $rows->values(), 'meta' => ['total' => $rows->count(), 'eligible' => $rows->where('eligible', true)->count()]]);
    }

    public function show(Distribution $distribution): JsonResponse
    {
        $donations = $distribution->donations()->with('donor:id,name')->get()->map(fn (Donation $d) => [
            'id' => $d->id,
            'reference' => $d->transaction_reference,
            'amount' => (float) $d->amount,
            'donor' => $d->donor?->name ?: $d->donor_name ?: null,
            'stage' => DeliverySteps::stageOf($d),
        ]);

        return response()->json(['data' => $this->card($distribution) + ['donations' => $donations->values()]]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate(array_merge([
            'client_key' => ['nullable', 'string', 'max:64'],
            'title' => ['required', 'string', 'max:200'],
            'happened_on' => ['required', 'date', 'before_or_equal:' . now()->addDay()->toDateString()],
            'governorate' => ['nullable', 'string', 'max:80'],
            'city' => ['nullable', 'string', 'max:80'],
            'stage' => ['required', Rule::in([...DeliverySteps::STAGES, DeliverySteps::ON_HOLD])],
            'note' => ['nullable', 'string', 'max:1000', Rule::requiredIf(fn () => $request->input('stage') === DeliverySteps::ON_HOLD)],
            'families_count' => ['nullable', 'integer', 'min:0', 'max:1000000'],
            'target_kind' => ['nullable', Rule::in(array_keys(Targets::COLUMN))],
            'target_id' => ['nullable', 'integer', 'required_with:target_kind'],
            'donation_ids' => ['required', 'array', 'min:1', 'max:' . self::MAX_DONATIONS],
            'donation_ids.*' => ['integer'],
            'notify' => ['sometimes', 'boolean'],
            'is_public' => ['sometimes', 'boolean'],
        ], Evidence::photosRules()), array_merge([
            'title.required' => 'اكتب اسم للتوزيعة (مثلاً: توزيع كراتين الغذاء — بلقاس).',
            'happened_on.required' => 'اكتب تاريخ التوزيع.',
            'happened_on.before_or_equal' => 'التاريخ مينفعش يكون في المستقبل.',
            'note.required' => 'اكتب سبب التأجيل علشان المتبرعين يعرفوا.',
            'donation_ids.required' => 'اختار التبرعات اللي اتوزعت.',
            'donation_ids.min' => 'اختار تبرع واحد على الأقل.',
            'donation_ids.max' => 'أقصى عدد في التوزيعة الواحدة ' . self::MAX_DONATIONS . ' تبرع.',
        ], Evidence::photosMessages()));

        // A double tap or a retry after a lost reply returns the first result.
        if (! empty($data['client_key']) && ($done = Distribution::where('client_key', $data['client_key'])->first())) {
            return response()->json(['data' => $this->card($done), 'applied' => $done->donations_count, 'skipped' => [], 'repeated' => true]);
        }

        $donations = Donation::whereIn('id', array_unique($data['donation_ids']))->get();
        $skipped = [];
        $eligible = $donations->filter(function (Donation $d) use ($data, &$skipped) {
            if ($d->status !== 'paid') {
                $skipped[] = ['id' => $d->id, 'reason' => 'not_paid'];

                return false;
            }
            if (! $this->eligible(DeliverySteps::stageOf($d), $data['stage'])) {
                $skipped[] = ['id' => $d->id, 'reason' => 'already_there'];

                return false;
            }

            return true;
        });
        foreach (array_diff($data['donation_ids'], $donations->pluck('id')->all()) as $missing) {
            $skipped[] = ['id' => (int) $missing, 'reason' => 'not_found'];
        }
        if ($eligible->isEmpty()) {
            return response()->json(['message' => 'مفيش ولا تبرع ينفع ياخد الخطوة دي (يا إما مش مدفوع يا إما عدّاها).', 'skipped' => $skipped], 422);
        }

        $day = Carbon::parse($data['happened_on']);
        $at = $day->isToday() ? now() : $day->copy()->setTime(12, 0);

        $distribution = DB::transaction(function () use ($data, $eligible, $request, $at) {
            $d = Distribution::create([
                'client_key' => $data['client_key'] ?? null,
                'title' => trim($data['title']),
                'happened_on' => $data['happened_on'],
                'governorate' => $data['governorate'] ?? null,
                'city' => $data['city'] ?? null,
                'stage' => $data['stage'],
                'note' => isset($data['note']) ? trim($data['note']) : null,
                'photos' => array_values($data['photos'] ?? []),
                'families_count' => (int) ($data['families_count'] ?? 0),
                'target_kind' => $data['target_kind'] ?? null,
                'target_id' => $data['target_id'] ?? null,
                'donations_count' => $eligible->count(),
                'is_public' => $request->boolean('is_public', true),
                'created_by' => $request->user()->id,
            ]);
            $ref = ['id' => $d->id, 'title' => $d->title, 'place' => $d->place()];
            foreach ($eligible as $donation) {
                DeliverySteps::append($donation, [
                    'stage' => $d->stage,
                    'at' => $at->toIso8601String(),
                    'note' => $d->note,
                    'photos' => $d->photos ?? [],
                    'distribution' => $ref,
                    'by' => $request->user()->id,
                ]);
            }
            $d->donations()->attach($eligible->pluck('id')->all());

            return $d;
        });

        ImpactNumbers::forget();
        $this->log->custom('distribution.create', $distribution, "توزيعة «{$distribution->title}»: {$distribution->donations_count} تبرع → {$distribution->stage}", [
            'applied' => $distribution->donations_count, 'skipped' => count($skipped), 'families' => $distribution->families_count,
        ]);

        if ($request->boolean('notify', true)) {
            foreach ($eligible as $donation) {
                NotifyDonor::send($donation, new DonorDeliveryStageNotification(
                    (int) $donation->id, $distribution->stage, NotifyDonor::amount($donation), NotifyDonor::targetName($donation),
                    NotifyDonor::followUrl($donation), $distribution->stage === DeliverySteps::ON_HOLD ? $distribution->note : null,
                ));
            }
        }

        return response()->json(['data' => $this->card($distribution), 'applied' => $distribution->donations_count, 'skipped' => $skipped], 201);
    }

    public function update(Request $request, Distribution $distribution): JsonResponse
    {
        $data = $request->validate(array_merge([
            'title' => ['sometimes', 'string', 'max:200'],
            'governorate' => ['sometimes', 'nullable', 'string', 'max:80'],
            'city' => ['sometimes', 'nullable', 'string', 'max:80'],
            'note' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'families_count' => ['sometimes', 'integer', 'min:0', 'max:1000000'],
            'is_public' => ['sometimes', 'boolean'],
        ], Evidence::photosRules()), Evidence::photosMessages());

        $before = $distribution->only(array_keys($data));
        $distribution->update($data);
        ImpactNumbers::forget();
        $this->log->custom('distribution.update', $distribution, "عدّل توزيعة «{$distribution->title}»", ['before' => $before, 'after' => $distribution->only(array_keys($data))]);

        return response()->json(['data' => $this->card($distribution->fresh())]);
    }

    public function destroy(Distribution $distribution): JsonResponse
    {
        $count = DB::transaction(function () use ($distribution) {
            $donations = $distribution->donations()->get();
            foreach ($donations as $donation) {
                DeliverySteps::removeDistribution($donation, (int) $distribution->id);
            }
            $distribution->donations()->detach();
            $distribution->delete();

            return $donations->count();
        });
        ImpactNumbers::forget();
        $this->log->custom('distribution.delete', null, "اتلغت توزيعة «{$distribution->title}» واترجعت {$count} تبرع لخطوتهم اللي قبلها", [
            'distribution_id' => $distribution->id, 'donations' => $count,
        ]);

        return response()->json(['message' => "اتلغت التوزيعة، و{$count} تبرع رجعوا لخطوتهم اللي قبلها."]);
    }

    /** A progress step only moves forward; "on hold" fits anything not delivered yet. */
    private function eligible(?string $current, string $next): bool
    {
        if ($next === DeliverySteps::ON_HOLD) {
            return $current !== 'delivered';
        }

        return DeliverySteps::rank($next) > DeliverySteps::rank($current);
    }

    private function card(Distribution $d): array
    {
        return ImpactNumbers::distributionCard($d) + [
            'is_public' => (bool) $d->is_public,
            'governorate' => $d->governorate,
            'city' => $d->city,
            'target_kind' => $d->target_kind,
            'target_id' => $d->target_id,
            'photos' => array_values($d->photos ?? []),
            'created_at' => optional($d->created_at)->toIso8601String(),
        ];
    }
}
