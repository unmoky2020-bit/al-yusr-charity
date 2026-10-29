<?php

namespace App\Http\Controllers\Api\V1\Volunteer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Volunteer\StoreVolunteerRequest;
use App\Http\Requests\Volunteer\UpdateVolunteerRequest;
use App\Http\Resources\VolunteerResource;
use App\Models\Volunteer;
use Illuminate\Http\Request;

class VolunteerController extends Controller
{
    public function index(Request $request)
    {
        $query = Volunteer::query()->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('governorate')) {
            $query->where('governorate', $request->governorate);
        }

        if ($request->filled('city')) {
            $query->where('city', $request->city);
        }

        if ($request->filled('search')) {
            $search = $request->search;

            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('city', 'like', "%{$search}%")
                  ->orWhere('governorate', 'like', "%{$search}%");
            });
        }

        return VolunteerResource::collection(
            $query->paginate(\App\Support\PerPage::from(request(), 15))
        );
    }

    public function store(StoreVolunteerRequest $request)
    {
        return new VolunteerResource(
            Volunteer::create($request->validated())
        );
    }

    public function show(Volunteer $volunteer)
    {
        return new VolunteerResource($volunteer);
    }

    public function update(
        UpdateVolunteerRequest $request,
        Volunteer $volunteer
    ) {
        $volunteer->update($request->validated());

        return new VolunteerResource(
            $volunteer->fresh()
        );
    }

    public function destroy(Volunteer $volunteer)
    {
        $volunteer->delete();

        return response()->json([
            'message' => 'Volunteer deleted successfully'
        ]);
    }

    public function statistics()
    {
        return response()->json([
            'total' => Volunteer::count(),
            'pending' => Volunteer::where('status', 'pending')->count(),
            'approved' => Volunteer::where('status', 'approved')->count(),
            'rejected' => Volunteer::where('status', 'rejected')->count(),
            'inactive' => Volunteer::where('status', 'inactive')->count(),
        ]);
    }
}
