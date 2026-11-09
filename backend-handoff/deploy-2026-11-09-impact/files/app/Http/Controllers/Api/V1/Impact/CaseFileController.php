<?php

namespace App\Http\Controllers\Api\V1\Impact;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\CaseModel;
use App\Models\Impact\CaseFollower;
use App\Models\Impact\CaseItem;
use App\Models\Impact\CaseOutcome;
use App\Models\User;
use App\Notifications\CaseFollowerAssignedNotification;
use App\Services\ActivityLogService;
use App\Support\Impact\ImpactNumbers;
use App\Support\Impact\People;
use App\Support\Viewer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * A case's transparency file: what it needs and what each line cost (with receipts and photos), who
 * follows it, how it ended, and the log of every change.
 *
 *   GET    /cases/{case}/file              public (visitors: approved/completed cases only)
 *   POST   /cases/{case}/items             PUT /case-items/{item}   DELETE /case-items/{item}
 *   POST   /cases/{case}/items/reorder     { ids }
 *   PUT    /cases/{case}/follower          { user_id|null, note? }
 *   PUT    /cases/{case}/outcome           { result, summary, before_url?, after_url?, transfer_note?, completed_on? }
 *   DELETE /cases/{case}/outcome
 *   GET    /cases/{case}/history           the activity log of this case
 *   GET    /impact/team                    team members who can follow a case
 *   GET    /impact/my-cases                cases the signed-in member follows
 * Writes need cases.update (routes); every write is logged against the case.
 */
class CaseFileController extends Controller
{
    private const PUBLIC_STATUSES = ['approved', 'completed'];

    public function __construct(private ActivityLogService $log)
    {
    }

    /* ── read ─────────────────────────────────────────────────────────────── */

    public function show(Request $request, string $case): JsonResponse
    {
        $model = $this->findCase($request, $case);
        $staff = Viewer::isStaff($request);

        return response()->json(['data' => $this->file($model, $staff)]);
    }

    public function history(Request $request, string $case): JsonResponse
    {
        $model = $this->findCase($request, $case);
        $rows = ActivityLog::with('user:id,name')
            ->where('entity_type', class_basename($model))
            ->where('entity_id', $model->id)
            ->latest('id')->limit(100)->get()
            ->map(fn ($l) => [
                'id' => $l->id,
                'action' => $l->action,
                'summary' => $l->summary ?? $l->description,
                'by' => $l->user?->name,
                'at' => optional($l->created_at)->toIso8601String(),
            ]);

        return response()->json(['data' => $rows]);
    }

    public function team(): JsonResponse
    {
        $following = CaseFollower::selectRaw('user_id, count(*) as c')->groupBy('user_id')->pluck('c', 'user_id');
        $users = User::query()
            ->whereHas('roles', fn ($q) => $q->where('slug', '!=', 'donor'))
            ->with('roles:id,name,slug')
            ->orderBy('name')->limit(300)->get()
            ->map(fn ($u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'avatar_url' => People::avatarUrl($u),
                'roles' => $u->roles->pluck('slug')->values(),
                'following' => (int) ($following[$u->id] ?? 0),
            ]);

        return response()->json(['data' => $users]);
    }

    public function myCases(Request $request): JsonResponse
    {
        $ids = CaseFollower::where('user_id', $request->user()->id)->pluck('case_id');
        $cases = CaseModel::whereIn('id', $ids)->latest('updated_at')->get()
            ->map(fn (CaseModel $c) => ['id' => $c->id, 'code' => $c->code, 'title' => $c->title, 'status' => $c->status, 'city' => $c->city, 'file' => $this->file($c, true)]);

        return response()->json(['data' => $cases]);
    }

    /* ── items ────────────────────────────────────────────────────────────── */

    public function storeItem(Request $request, string $case): JsonResponse
    {
        $model = $this->findCase($request, $case);
        $data = $this->validateItem($request, true);
        $data = $this->stampDates($data);

        $item = CaseItem::create($data + [
            'case_id' => $model->id,
            'sort_order' => (int) CaseItem::where('case_id', $model->id)->max('sort_order') + 1,
            'created_by' => $request->user()->id,
        ]);
        ImpactNumbers::forget();
        $this->log->custom('case_item.create', $model, "أضاف بند «{$item->title}» (" . $this->money($item->estimated_cost) . ')', ['item_id' => $item->id]);

        return response()->json(['data' => $item], 201);
    }

    public function updateItem(Request $request, CaseItem $item): JsonResponse
    {
        $data = $this->stampDates($this->validateItem($request, false), $item);
        $before = $item->only(array_keys($data));
        $item->update($data);

        $changes = array_keys(array_diff_assoc(array_map('strval', $item->only(array_keys($data))), array_map('strval', $before)));
        if ($changes) {
            ImpactNumbers::forget();
            $this->log->custom('case_item.update', $item->caseModel, "عدّل بند «{$item->title}»: " . $this->describe($changes, $item), [
                'item_id' => $item->id, 'before' => $before, 'after' => $item->only($changes),
            ]);
        }

        return response()->json(['data' => $item->fresh()]);
    }

    public function destroyItem(CaseItem $item): JsonResponse
    {
        $case = $item->caseModel;
        $snapshot = $item->toArray();
        $item->delete();
        ImpactNumbers::forget();
        $this->log->custom('case_item.delete', $case, "شال بند «{$snapshot['title']}»", ['item' => $snapshot]);

        return response()->json(['message' => 'اتشال البند.']);
    }

    public function reorderItems(Request $request, string $case): JsonResponse
    {
        $model = $this->findCase($request, $case);
        $ids = $request->validate(['ids' => 'required|array|min:1', 'ids.*' => 'integer'])['ids'];
        DB::transaction(function () use ($ids, $model) {
            foreach (array_values($ids) as $i => $id) {
                CaseItem::where('case_id', $model->id)->whereKey($id)->update(['sort_order' => $i]);
            }
        });

        return response()->json(['data' => $this->file($model, true)]);
    }

    /* ── follower ─────────────────────────────────────────────────────────── */

    public function setFollower(Request $request, string $case): JsonResponse
    {
        $model = $this->findCase($request, $case);
        $data = $request->validate([
            'user_id' => ['nullable', 'integer', Rule::exists('users', 'id')],
            'note' => ['nullable', 'string', 'max:300'],
        ], ['user_id.exists' => 'العضو ده مش موجود.']);

        $current = CaseFollower::where('case_id', $model->id)->first();
        if (empty($data['user_id'])) {
            $current?->delete();
            $this->log->custom('case_follower.remove', $model, 'شال مسؤول المتابعة' . ($current ? ' (' . optional($current->user)->name . ')' : ''));

            return response()->json(['data' => $this->file($model, true)]);
        }

        $user = User::with('roles')->findOrFail($data['user_id']);
        if (! $user->roles->contains(fn ($r) => $r->slug !== 'donor')) {
            return response()->json(['message' => 'مسؤول المتابعة لازم يكون من فريق المؤسسة.'], 422);
        }

        $changed = ! $current || (int) $current->user_id !== (int) $user->id;
        CaseFollower::updateOrCreate(['case_id' => $model->id], [
            'user_id' => $user->id, 'assigned_by' => $request->user()->id, 'note' => $data['note'] ?? null,
        ]);
        if ($changed) {
            $this->log->custom('case_follower.assign', $model, "عيّن {$user->name} مسؤول متابعة" . ($current ? ' بدل ' . optional($current->user)->name : ''), [
                'user_id' => $user->id, 'previous_user_id' => $current?->user_id,
            ]);
            try {
                $user->notify(new CaseFollowerAssignedNotification($model->id, (string) $model->code, (string) $model->title, $data['note'] ?? null));
            } catch (\Throwable $e) {
                report($e);
            }
        }

        return response()->json(['data' => $this->file($model, true)]);
    }

    /* ── outcome ──────────────────────────────────────────────────────────── */

    public function saveOutcome(Request $request, string $case): JsonResponse
    {
        $model = $this->findCase($request, $case);
        $data = $request->validate([
            'result' => ['required', Rule::in(CaseOutcome::RESULTS)],
            'summary' => ['required', 'string', 'max:2000'],
            'before_url' => ['nullable', 'string', 'max:2048', 'regex:#^(https://|/storage/)#'],
            'after_url' => ['nullable', 'string', 'max:2048', 'regex:#^(https://|/storage/)#'],
            'transfer_note' => ['nullable', 'string', 'max:500', Rule::requiredIf(fn () => in_array($request->input('result'), ['cancelled', 'transferred'], true))],
            'completed_on' => ['nullable', 'date'],
            'mark_case_completed' => ['sometimes', 'boolean'],
        ], [
            'summary.required' => 'اكتب ملخص النتيجة.',
            'transfer_note.required' => 'اكتب الفلوس راحت فين (لحالة تانية / برنامج / اترجعت للمتبرعين).',
        ]);

        $outcome = CaseOutcome::updateOrCreate(['case_id' => $model->id], [
            'result' => $data['result'],
            'summary' => trim($data['summary']),
            'before_url' => $data['before_url'] ?? null,
            'after_url' => $data['after_url'] ?? null,
            'transfer_note' => $data['transfer_note'] ?? null,
            'completed_on' => $data['completed_on'] ?? now()->toDateString(),
            'created_by' => $request->user()->id,
        ]);
        ImpactNumbers::forget();
        $this->log->custom('case_outcome.save', $model, 'سجّل نتيجة الحالة: ' . $data['result'], ['outcome_id' => $outcome->id]);

        // A finished case is shown as finished everywhere (the public timeline reads the status).
        if ($data['result'] === 'completed' && $request->boolean('mark_case_completed', true) && $model->status !== 'completed') {
            try {
                $model->forceFill(['status' => 'completed'])->save();
                $this->log->custom('case.status', $model, 'الحالة بقت «مكتملة» مع تسجيل النتيجة');
            } catch (\Throwable $e) {
                report($e);
            }
        }

        return response()->json(['data' => $this->file($model->fresh(), true)]);
    }

    public function clearOutcome(Request $request, string $case): JsonResponse
    {
        $model = $this->findCase($request, $case);
        $deleted = CaseOutcome::where('case_id', $model->id)->delete();
        if ($deleted) {
            ImpactNumbers::forget();
            $this->log->custom('case_outcome.delete', $model, 'شال نتيجة الحالة');
        }

        return response()->json(['data' => $this->file($model, true)]);
    }

    /* ── helpers ──────────────────────────────────────────────────────────── */

    /** {case} is the numeric id or the public code; visitors only reach published cases. */
    private function findCase(Request $request, string $case): CaseModel
    {
        $q = ctype_digit($case) ? CaseModel::where('id', $case) : CaseModel::where('code', $case);
        if (! Viewer::isStaff($request)) {
            $q->whereIn('status', self::PUBLIC_STATUSES);
        }

        return $q->firstOrFail();
    }

    private function validateItem(Request $request, bool $creating): array
    {
        $req = $creating ? 'required' : 'sometimes';

        return $request->validate([
            'title' => [$req, 'string', 'max:200'],
            'quantity' => ['sometimes', 'integer', 'min:1', 'max:100000'],
            'estimated_cost' => [$req, 'numeric', 'min:0', 'max:100000000'],
            'actual_cost' => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:100000000'],
            'status' => ['sometimes', Rule::in(CaseItem::STATUSES)],
            'receipt_url' => ['sometimes', 'nullable', 'string', 'max:2048', 'regex:#^(https://|/storage/)#'],
            'photo_url' => ['sometimes', 'nullable', 'string', 'max:2048', 'regex:#^(https://|/storage/)#'],
            'note' => ['sometimes', 'nullable', 'string', 'max:500'],
            'purchased_on' => ['sometimes', 'nullable', 'date'],
            'delivered_on' => ['sometimes', 'nullable', 'date'],
        ], [
            'title.required' => 'اكتب اسم البند.',
            'estimated_cost.required' => 'اكتب التكلفة المتوقعة.',
            'estimated_cost.numeric' => 'التكلفة لازم تكون رقم.',
        ]);
    }

    /** Buying or handing over a line stamps today's date when none is given. */
    private function stampDates(array $data, ?CaseItem $item = null): array
    {
        $status = $data['status'] ?? $item?->status;
        if (in_array($status, ['purchased', 'delivered'], true) && empty($data['purchased_on']) && ! $item?->purchased_on) {
            $data['purchased_on'] = now()->toDateString();
        }
        if ($status === 'delivered' && empty($data['delivered_on']) && ! $item?->delivered_on) {
            $data['delivered_on'] = now()->toDateString();
        }

        return $data;
    }

    private function file(CaseModel $case, bool $staff): array
    {
        $items = CaseItem::where('case_id', $case->id)->orderBy('sort_order')->orderBy('id')->get();
        $active = $items->where('status', '!=', 'cancelled');
        $budget = (float) $active->sum(fn (CaseItem $i) => (float) $i->estimated_cost);
        $spent = (float) $items->sum(fn (CaseItem $i) => $i->spent());
        $collected = (float) $case->donations()->where('status', 'paid')->sum('amount');
        $target = (float) $case->target_amount;
        $follower = CaseFollower::with('user')->where('case_id', $case->id)->first();
        $outcome = CaseOutcome::where('case_id', $case->id)->first();

        return [
            'case_id' => $case->id,
            'items' => $items->map(fn (CaseItem $i) => $staff ? $i->toArray() : $i->only([
                'id', 'title', 'quantity', 'estimated_cost', 'actual_cost', 'status', 'receipt_url', 'photo_url', 'note', 'purchased_on', 'delivered_on',
            ]))->values(),
            'totals' => [
                'target' => round($target, 2),
                'collected' => round($collected, 2),
                'budget' => round($budget, 2),
                'spent' => round($spent, 2),
                'balance' => round($collected - $spent, 2),
                'funded_pct' => $target > 0 ? min(999, (int) floor($collected / $target * 100)) : null,
                'items' => [
                    'all' => $active->count(),
                    'purchased' => $items->where('status', 'purchased')->count(),
                    'delivered' => $items->where('status', 'delivered')->count(),
                    'planned' => $items->where('status', 'planned')->count(),
                ],
            ],
            'follower' => $follower ? array_filter([
                'user' => People::card($follower->user, $staff),
                'note' => $staff ? $follower->note : null,
                'since' => optional($follower->created_at)->toDateString(),
            ], fn ($v) => $v !== null) : null,
            'outcome' => $outcome?->only(['result', 'summary', 'before_url', 'after_url', 'transfer_note', 'completed_on']),
        ];
    }

    private function money($n): string
    {
        return number_format((float) $n, 0) . ' ج.م';
    }

    private function describe(array $fields, CaseItem $item): string
    {
        $labels = [
            'status' => 'الحالة → ' . $item->status, 'actual_cost' => 'التكلفة الفعلية → ' . $this->money($item->actual_cost),
            'estimated_cost' => 'التكلفة المتوقعة → ' . $this->money($item->estimated_cost), 'receipt_url' => 'الإيصال',
            'photo_url' => 'صورة التسليم', 'title' => 'الاسم', 'quantity' => 'الكمية', 'note' => 'الملاحظة',
            'purchased_on' => 'تاريخ الشراء', 'delivered_on' => 'تاريخ التسليم',
        ];

        return implode('، ', array_map(fn ($f) => $labels[$f] ?? $f, $fields));
    }
}
