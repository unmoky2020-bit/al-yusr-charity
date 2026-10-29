<?php

namespace App\Http\Controllers\Api\V1\NumbersAchievements;

use App\Http\Controllers\Controller;
use App\Http\Requests\NumbersAchievements\StoreHomeNumberRequest;
use App\Http\Requests\NumbersAchievements\UpdateHomeNumberRequest;
use App\Http\Resources\NumbersAchievements\HomeNumberResource;
use App\Models\HomeNumber;
use Illuminate\Http\Request;

class HomeNumberController extends Controller
{
    public function index(Request $request)
    {
        $query = HomeNumber::query();

        if ($request->has('is_visible')) {
            $query->where('is_visible', filter_var($request->is_visible, FILTER_VALIDATE_BOOLEAN));
        }

        return HomeNumberResource::collection(
            $query->orderBy('sort_order')->latest()->paginate(\App\Support\PerPage::from(request(), 20))
        );
    }

    public function store(StoreHomeNumberRequest $request)
    {
        $data = $request->validated();
        $data['created_by'] = $request->user()->id;

        return new HomeNumberResource(HomeNumber::create($data));
    }

    public function show(HomeNumber $homeNumber)
    {
        return new HomeNumberResource($homeNumber);
    }

    public function update(UpdateHomeNumberRequest $request, HomeNumber $homeNumber)
    {
        $homeNumber->update($request->validated());

        return new HomeNumberResource($homeNumber->fresh());
    }

    public function destroy(HomeNumber $homeNumber)
    {
        $homeNumber->delete();

        return response()->json(['message' => 'Deleted Successfully']);
    }

    public function statistics()
    {
        return response()->json([
            'total' => HomeNumber::count(),
            'visible' => HomeNumber::where('is_visible', true)->count(),
            'hidden' => HomeNumber::where('is_visible', false)->count(),
        ]);
    }
}
