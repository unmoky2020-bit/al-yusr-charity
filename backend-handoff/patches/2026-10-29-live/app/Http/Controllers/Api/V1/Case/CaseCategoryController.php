<?php

namespace App\Http\Controllers\Api\V1\Case;

use App\Http\Controllers\Controller;
use App\Http\Requests\Case\StoreCaseCategoryRequest;
use App\Http\Requests\Case\UpdateCaseCategoryRequest;
use App\Http\Resources\CaseCategoryResource;
use App\Models\CaseCategory;
use Illuminate\Http\Request;

class CaseCategoryController extends Controller
{
    public function index(Request $request)
    {
        $query = CaseCategory::query()
            ->withCount('cases')
            ->orderBy('sort_order')
            ->latest();

        if ($request->has('active')) {
            $query->where('is_active', (bool) $request->active);
        }

        if ($request->filled('search')) {
            $search = $request->search;

            $query->where(function ($q) use ($search) {
                $q->where('name_ar', 'like', "%{$search}%")
                    ->orWhere('name_en', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        return CaseCategoryResource::collection(
            $query->get()
        );
    }

    public function store(StoreCaseCategoryRequest $request)
    {
        $data = $request->validated();

        $data['is_active'] = $data['is_active'] ?? true;
        $data['sort_order'] = $data['sort_order'] ?? 0;

        $category = CaseCategory::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Case category created successfully.',
            'data' => new CaseCategoryResource($category),
        ], 201);
    }

    public function show(CaseCategory $caseCategory)
    {
        $caseCategory->loadCount('cases');

        return new CaseCategoryResource($caseCategory);
    }

    public function update(
        UpdateCaseCategoryRequest $request,
        CaseCategory $caseCategory
    ) {
        $caseCategory->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Case category updated successfully.',
            'data' => new CaseCategoryResource(
                $caseCategory->fresh()->loadCount('cases')
            ),
        ]);
    }

    public function destroy(CaseCategory $caseCategory)
    {
        if ($caseCategory->cases()->exists()) {
            return response()->json([
                'message' => 'Cannot delete a category that has cases.',
            ], 422);
        }

        $caseCategory->delete();

        return response()->json([
            'success' => true,
            'message' => 'Case category deleted successfully.',
        ]);
    }
}
