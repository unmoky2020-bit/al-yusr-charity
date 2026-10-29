<?php

namespace App\Http\Controllers\Api\V1\Case;

use App\Http\Controllers\Controller;
use App\Http\Requests\Case\StoreCaseModelRequest;
use App\Http\Requests\Case\UpdateCaseModelRequest;
use App\Http\Resources\CaseResource;
use App\Models\CaseModel;
use App\Support\Viewer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CaseModelController extends Controller
{
    public function index(Request $request)
    {
        $query = CaseModel::query()
            ->with([
                'categoryRelation',
                'program',
                'project',
                'donationCampaign',
            ]);

        // Visitors never see cases under review, rejected or closed.
        if (!Viewer::isStaff($request)) {
            $query->whereIn('status', ['approved', 'completed']);
        }

        if ($request->boolean('urgent')) {
            $query->where('priority', 'high');
        }

        if ($request->filled('category_slug')) {
            $query->whereHas('categoryRelation', fn ($q) => $q->where('slug', $request->category_slug));
        }

        if ($request->filled('project_id')) {
            $query->where('project_id', $request->project_id);
        }

        if ($request->filled('donation_campaign_id')) {
            $query->where(
                'donation_campaign_id',
                $request->donation_campaign_id
            );
        }

        if ($request->filled('program_id')) {
            $query->where(
                'program_id',
                $request->program_id
            );
        }

        if ($request->filled('status')) {
            $query->where(
                'status',
                $request->status
            );
        }

        if ($request->filled('category_id')) {
            $query->where(
                'category_id',
                $request->category_id
            );
        }

        if ($request->filled('priority')) {
            $query->where(
                'priority',
                $request->priority
            );
        }

        if ($request->filled('governorate')) {
            $query->where(
                'governorate',
                $request->governorate
            );
        }

        if ($request->filled('search')) {
            $search = $request->search;

            $query->where(function ($q) use ($search) {
                $q->where(
                    'title',
                    'like',
                    "%{$search}%"
                )
                ->orWhere(
                    'beneficiary_name',
                    'like',
                    "%{$search}%"
                )
                ->orWhere(
                    'code',
                    'like',
                    "%{$search}%"
                )
                ->orWhere(
                    'city',
                    'like',
                    "%{$search}%"
                )
                ->orWhere(
                    'governorate',
                    'like',
                    "%{$search}%"
                );
            });
        }

        $perPage = min(
            max(
                (int) $request->get('per_page', 10),
                1
            ),
            100
        );

        return CaseResource::collection(
            $query
                ->latest()
                ->paginate($perPage)
        );
    }

    public function statistics()
    {
        $counts = CaseModel::query()
            ->selectRaw(
                'status, COUNT(*) as total'
            )
            ->groupBy('status')
            ->pluck(
                'total',
                'status'
            );

        return response()->json([
            'total' => CaseModel::count(),

            'pending_review' => (int) (
                $counts['pending_review'] ?? 0
            ),

            'approved' => (int) (
                $counts['approved'] ?? 0
            ),

            'completed' => (int) (
                $counts['completed'] ?? 0
            ),

            'closed' => (int) (
                $counts['closed'] ?? 0
            ),

            'rejected' => (int) (
                $counts['rejected'] ?? 0
            ),
        ]);
    }

    public function store(StoreCaseModelRequest $request)
    {
        $data = $request->validated();
        if (empty($data['status'])) {
    $isAdmin = $request->user()
        ->roles()
        ->whereIn('slug', ['super-admin', 'admin'])
        ->exists();

    $data['status'] = $isAdmin ? 'approved' : 'pending_review';
}

        $category = \App\Models\CaseCategory::findOrFail(
            $data['category_id']
        );

        $data['category'] = $category->name_en
            ?: $category->name_ar;

        if (empty($data['code'])) {
            do {
                $data['code'] = 'CASE-' . random_int(10000, 99999);
            } while (CaseModel::where('code', $data['code'])->exists());
        }

        if ($request->hasFile('cover_image')) {
            $data['cover_image'] = $request
                ->file('cover_image')
                ->store('cases', 'public');
        }

        $case = CaseModel::create($data);

        return response()->json([
            'message' => 'Case created successfully.',

            'data' => new CaseResource(
                $case->load([
                    'categoryRelation',
                    'program',
                    'project',
                    'donationCampaign',
                ])
            ),
        ], 201);
    }

    public function show(Request $request, string $id)
    {
        $query = CaseModel::with([
            'categoryRelation',
            'program',
            'project',
            'donationCampaign',
        ]);

        if (!Viewer::isStaff($request)) {
            $query->whereIn('status', ['approved', 'completed']);
        }

        // Public links use the case code (/cases/CASE-4224); the admin uses the numeric id.
        $case = ctype_digit($id)
            ? (clone $query)->where('id', $id)->first() ?? (clone $query)->where('code', $id)->first()
            : $query->where('code', $id)->first();

        abort_if(!$case, 404);

        return new CaseResource($case);
    }



public function update(
    UpdateCaseModelRequest $request,
    string $id
) {
    // البحث عن الحالة المطلوبة.
    $case = CaseModel::findOrFail($id);

    // جلب الحقول التي اجتازت التحقق.
    $data = $request->validated();


    // تحديث اسم التصنيف إذا أُرسل تصنيف جديد.
    if (isset($data['category_id'])) {
        $category = \App\Models\CaseCategory::findOrFail(
            $data['category_id']
        );

        $data['category'] = $category->name_en
            ?: $category->name_ar;
    }

    // حفظ الصورة الجديدة إذا وصلت بصورة سليمة.
    if ($request->hasFile('cover_image')) {
        $image = $request->file('cover_image');

        if (!$image->isValid()) {
            return response()->json([
                'message' => 'الصورة المرفوعة غير صالحة.',
            ], 422);
        }

        $newPath = $image->store('cases', 'public');

        if (!$newPath) {
            return response()->json([
                'message' => 'فشل حفظ الصورة الجديدة.',
            ], 500);
        }

        // تحديث مسار الصورة في البيانات.
        $data['cover_image'] = $newPath;
    }

    // حفظ التعديلات في قاعدة البيانات.
    $case->fill($data);
    $case->save();

    // إعادة تحميل الحالة من قاعدة البيانات.
    $case->refresh()->load([
        'categoryRelation',
        'program',
        'project',
        'donationCampaign',
    ]);

    // إرجاع البيانات بعد الحفظ.
    return response()->json([
        'message' => 'Case updated successfully.',
        'data' => new CaseResource($case),
    ]);
}

    public function destroy(string $id)
    {
        $case = CaseModel::findOrFail($id);

        if ($case->cover_image && str_starts_with(ltrim($case->cover_image, '/'), 'cases/')) {
            Storage::disk('public')->delete($case->cover_image);
        }

        $case->delete();

        return response()->json([
            'message' => 'Case deleted successfully.',
        ]);
    }
}