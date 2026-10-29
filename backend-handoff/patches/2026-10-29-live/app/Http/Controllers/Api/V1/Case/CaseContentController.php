<?php

namespace App\Http\Controllers\Api\V1\Case;

use App\Http\Controllers\Controller;
use App\Models\CaseDocument;
use App\Models\CaseMedia;
use App\Models\CaseModel;
use App\Models\CaseUpdate;
use App\Support\Viewer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * What happens to a case after it is published: updates, photos / videos, documents and the
 * public timeline (computed from the case and its updates — no table of its own).
 *
 * Visitors only see approved / completed cases and only `is_public` media / documents.
 * Writes need the `cases.update` permission (enforced in routes).
 */
class CaseContentController extends Controller
{
    private const PUBLIC_STATUSES = ['approved', 'completed'];

    private const IMAGE_RULE = 'file|mimes:jpg,jpeg,png,webp,avif,mp4,webm|max:20480';

    /** {case} is the numeric id or the public code (CASE-12345). */
    private function findCase(Request $request, string $case): CaseModel
    {
        $query = ctype_digit($case) ? CaseModel::where('id', $case) : CaseModel::where('code', $case);

        if (!Viewer::isStaff($request)) {
            $query->whereIn('status', self::PUBLIC_STATUSES);
        }

        return $query->firstOrFail();
    }

    private function storeFile(Request $request, CaseModel $case, string $folder): string
    {
        $path = $request->file('file')->store("cases/{$case->id}/{$folder}", 'public');

        return Storage::disk('public')->url($path);
    }

    /** Only files under cases/ are removed; links to the media library or other sites stay. */
    private function deleteOwnedFile(?string $url): void
    {
        $prefix = Storage::disk('public')->url('cases/');
        if ($url && str_starts_with($url, $prefix)) {
            Storage::disk('public')->delete(substr($url, strlen(Storage::disk('public')->url(''))));
        }
    }

    /* ── Updates ─────────────────────────────────────────────────────────── */

    public function updates(Request $request, string $case)
    {
        return response()->json([
            'data' => $this->findCase($request, $case)->hasMany(CaseUpdate::class, 'case_id')->latest()->get(),
        ]);
    }

    public function storeUpdate(Request $request, string $case)
    {
        $model = $this->findCase($request, $case);
        $data = $request->validate([
            'body' => 'required|string|max:5000',
            'image_url' => 'nullable|string|max:2048',
            'file' => 'nullable|' . self::IMAGE_RULE,
        ]);

        if ($request->hasFile('file')) {
            $data['image_url'] = $this->storeFile($request, $model, 'updates');
        }

        $update = CaseUpdate::create([
            'case_id' => $model->id,
            'body' => $data['body'],
            'image_url' => $data['image_url'] ?? null,
            'author_id' => $request->user()->id,
        ]);

        return response()->json(['data' => $update], 201);
    }

    public function updateUpdate(Request $request, CaseUpdate $caseUpdate)
    {
        $data = $request->validate([
            'body' => 'sometimes|string|max:5000',
            'image_url' => 'sometimes|nullable|string|max:2048',
        ]);
        $caseUpdate->update($data);

        return response()->json(['data' => $caseUpdate->fresh()]);
    }

    public function destroyUpdate(CaseUpdate $caseUpdate)
    {
        $this->deleteOwnedFile($caseUpdate->image_url);
        $caseUpdate->delete();

        return response()->json(['message' => 'Deleted Successfully']);
    }

    /* ── Media ───────────────────────────────────────────────────────────── */

    public function media(Request $request, string $case)
    {
        $query = $this->findCase($request, $case)->hasMany(CaseMedia::class, 'case_id')->orderBy('sort_order')->orderBy('id');

        if (!(Viewer::isStaff($request) && $request->boolean('all'))) {
            $query->where('is_public', true);
        }

        return response()->json(['data' => $query->get()]);
    }

    public function storeMedia(Request $request, string $case)
    {
        $model = $this->findCase($request, $case);
        $data = $request->validate([
            'file' => 'required_without:url|' . self::IMAGE_RULE,
            'url' => 'required_without:file|nullable|string|max:2048',
            'kind' => 'nullable|in:before,during,after,report,other',
            'caption_ar' => 'nullable|string|max:300',
            'caption_en' => 'nullable|string|max:300',
            'is_public' => 'nullable|boolean',
            'sort_order' => 'nullable|integer|min:0',
        ]);

        $media = CaseMedia::create([
            'case_id' => $model->id,
            'url' => $request->hasFile('file') ? $this->storeFile($request, $model, 'media') : $data['url'],
            'kind' => $data['kind'] ?? 'other',
            'caption_ar' => $data['caption_ar'] ?? null,
            'caption_en' => $data['caption_en'] ?? null,
            'is_public' => $data['is_public'] ?? true,
            'sort_order' => $data['sort_order'] ?? (int) CaseMedia::where('case_id', $model->id)->max('sort_order') + 1,
            'uploaded_by' => $request->user()->id,
        ]);

        return response()->json(['data' => $media], 201);
    }

    /** Upload a file only (no media row) — e.g. the photo attached to an update. */
    public function upload(Request $request, string $case)
    {
        $model = $this->findCase($request, $case);
        $request->validate(['file' => 'required|' . self::IMAGE_RULE]);
        $url = $this->storeFile($request, $model, 'uploads');

        return response()->json(['url' => $url, 'path' => $url], 201);
    }

    public function updateMedia(Request $request, CaseMedia $caseMedia)
    {
        $data = $request->validate([
            'url' => 'sometimes|string|max:2048',
            'kind' => 'sometimes|in:before,during,after,report,other',
            'caption_ar' => 'sometimes|nullable|string|max:300',
            'caption_en' => 'sometimes|nullable|string|max:300',
            'is_public' => 'sometimes|boolean',
            'sort_order' => 'sometimes|integer|min:0',
        ]);
        $caseMedia->update($data);

        return response()->json(['data' => $caseMedia->fresh()]);
    }

    public function destroyMedia(CaseMedia $caseMedia)
    {
        $this->deleteOwnedFile($caseMedia->url);
        $caseMedia->delete();

        return response()->json(['message' => 'Deleted Successfully']);
    }

    public function reorderMedia(Request $request, string $case)
    {
        $model = $this->findCase($request, $case);
        $ids = $request->validate(['ids' => 'required|array|min:1', 'ids.*' => 'integer'])['ids'];

        DB::transaction(function () use ($ids, $model) {
            foreach (array_values($ids) as $i => $id) {
                CaseMedia::where('case_id', $model->id)->whereKey($id)->update(['sort_order' => $i]);
            }
        });

        return $this->media($request, $case);
    }

    /* ── Documents ───────────────────────────────────────────────────────── */

    public function documents(Request $request, string $case)
    {
        $query = $this->findCase($request, $case)->hasMany(CaseDocument::class, 'case_id')->latest();

        if (!Viewer::isStaff($request)) {
            $query->where('is_public', true);
        }

        return response()->json(['data' => $query->get()]);
    }

    public function storeDocument(Request $request, string $case)
    {
        $model = $this->findCase($request, $case);
        $data = $request->validate([
            'file' => 'required|file|mimes:pdf,jpg,jpeg,png,webp|max:10240',
            'doc_type' => 'nullable|string|max:40',
            'caption' => 'nullable|string|max:300',
            'is_public' => 'nullable|boolean',
        ]);

        $doc = CaseDocument::create([
            'case_id' => $model->id,
            'url' => $this->storeFile($request, $model, 'documents'),
            'doc_type' => $data['doc_type'] ?? 'other',
            'caption' => $data['caption'] ?? null,
            'is_public' => $data['is_public'] ?? false,
            'uploaded_by' => $request->user()->id,
        ]);

        return response()->json(['data' => $doc], 201);
    }

    public function destroyDocument(CaseDocument $caseDocument)
    {
        $this->deleteOwnedFile($caseDocument->url);
        $caseDocument->delete();

        return response()->json(['message' => 'Deleted Successfully']);
    }

    /* ── Timeline ────────────────────────────────────────────────────────── */

    /** Public timeline: created → approved → each update → completed. */
    public function journey(Request $request, string $case)
    {
        $model = $this->findCase($request, $case);
        $step = fn (string $key, string $ar, string $en, $at, ?string $note = null, ?string $media = null) => [
            'id' => "{$key}-" . md5((string) $at . $note),
            'case_id' => $model->id,
            'step_key' => $key,
            'title_ar' => $ar,
            'title_en' => $en,
            'note_ar' => $note,
            'note_en' => null,
            'media_url' => $media,
            'occurred_at' => $at,
            'is_public' => true,
        ];

        $steps = [$step('created', 'تسجيل الحالة وبدء البحث الميداني', 'Case registered, field study started', $model->created_at)];

        if (in_array($model->status, self::PUBLIC_STATUSES, true)) {
            $steps[] = $step('received', 'اعتماد الحالة بعد البحث', 'Case approved after the field study', $model->updated_at);
        }

        foreach ($model->hasMany(CaseUpdate::class, 'case_id')->oldest()->get() as $u) {
            $steps[] = $step('executing', 'تحديث من الميدان', 'Field update', $u->created_at, $u->body, $u->image_url);
        }

        if ($model->status === 'completed') {
            $steps[] = $step('completed', 'اكتمال الحالة', 'Case completed', $model->updated_at);
        }

        return response()->json(['data' => $steps]);
    }
}
