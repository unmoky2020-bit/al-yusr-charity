<?php

namespace App\Http\Controllers\Api\V1\Axis;

use App\Http\Controllers\Controller;
use App\Http\Requests\Axis\StoreAxisRequest;
use App\Http\Requests\Axis\UpdateAxisRequest;
use App\Http\Resources\Axis\AxisResource;
use App\Models\Axis;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AxisController extends Controller
{
    public function index(Request $request)
    {
        $query = Axis::query()
            ->orderBy('sort_order')
            ->latest();

        if ($request->has('is_active')) {
            $query->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->filled('search')) {
            $search = $request->search;

            $query->where(function ($q) use ($search) {
                $q->where('name_ar', 'like', "%{$search}%")
                  ->orWhere('name_en', 'like', "%{$search}%")
                  ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        return AxisResource::collection($query->paginate(\App\Support\PerPage::from(request(), 10)));
    }

    public function publicIndex()
    {
        return AxisResource::collection(
            Axis::where('is_active', true)
                ->with(['programs', 'cases', 'volunteerCampaigns'])
                ->orderBy('sort_order')
                ->get()
        );
    }

    public function show(Axis $axis)
    {
        return new AxisResource(
            $axis->load(['programs', 'cases', 'volunteerCampaigns'])
        );
    }

    public function publicShow(string $slug)
    {
        $axis = Axis::where('slug', $slug)
            ->where('is_active', true)
            ->with(['programs', 'cases', 'volunteerCampaigns'])
            ->firstOrFail();

        return new AxisResource($axis);
    }

    public function store(StoreAxisRequest $request)
    {
        $data = $request->validated();

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('axes', 'public');
        }

        $axis = Axis::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Axis created successfully.',
            'data' => new AxisResource($axis),
        ], 201);
    }

    public function update(UpdateAxisRequest $request, Axis $axis)
    {
        $data = $request->validated();

        if ($request->hasFile('image')) {
            if ($axis->image) {
                Storage::disk('public')->delete($axis->image);
            }

            $data['image'] = $request->file('image')->store('axes', 'public');
        }

        $axis->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Axis updated successfully.',
            'data' => new AxisResource(
                $axis->fresh()->load(['programs', 'cases', 'volunteerCampaigns'])
            ),
        ]);
    }

    public function destroy(Axis $axis)
    {
        if ($axis->image) {
            Storage::disk('public')->delete($axis->image);
        }

        $axis->delete();

        return response()->json([
            'success' => true,
            'message' => 'Axis deleted successfully.',
        ]);
    }
}
