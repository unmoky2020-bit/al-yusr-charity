<?php

namespace App\Http\Controllers\Api\V1\NumbersAchievements;

use App\Http\Controllers\Controller;
use App\Http\Requests\NumbersAchievements\StoreAchievementRequest;
use App\Http\Requests\NumbersAchievements\UpdateAchievementRequest;
use App\Http\Resources\NumbersAchievements\AchievementResource;
use App\Models\Achievement;
use Illuminate\Http\Request;

class AchievementController extends Controller
{
    public function index(Request $request)
    {
        $query = Achievement::query();

        if ($request->has('is_active')) {
            $query->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN));
        }

        return AchievementResource::collection(
            $query->orderBy('sort_order')->latest()->paginate(\App\Support\PerPage::from(request(), 20))
        );
    }

    public function store(StoreAchievementRequest $request)
    {
        $data = $request->validated();
        $data['created_by'] = $request->user()->id;

        return new AchievementResource(Achievement::create($data));
    }

    public function show(Achievement $achievement)
    {
        return new AchievementResource($achievement);
    }

    public function update(UpdateAchievementRequest $request, Achievement $achievement)
    {
        $achievement->update($request->validated());

        return new AchievementResource($achievement->fresh());
    }

    public function destroy(Achievement $achievement)
    {
        $achievement->delete();

        return response()->json(['message' => 'Deleted Successfully']);
    }

    public function statistics()
    {
        return response()->json([
            'total' => Achievement::count(),
            'visible' => Achievement::where('is_active', true)->count(),
            'hidden' => Achievement::where('is_active', false)->count(),
        ]);
    }
}
