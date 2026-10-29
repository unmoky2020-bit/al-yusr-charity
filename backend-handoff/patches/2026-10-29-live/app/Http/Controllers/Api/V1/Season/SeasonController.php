<?php

namespace App\Http\Controllers\Api\V1\Season;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSeasonRequest;
use App\Http\Requests\UpdateSeasonRequest;
use App\Http\Resources\SeasonResource;
use App\Models\Season;
use App\Support\Viewer;
use Illuminate\Http\Request;

class SeasonController extends Controller
{
    public function index(Request $request)
    {
        $staff = Viewer::isStaff($request);

        $query = Season::with([
            'programs' => fn ($q) => $this->scopePrograms($q, $staff),
        ])->orderBy('sort_order')->latest();

        if (!$staff) {
            $query->where('is_active', true);
        }

        if ($request->has('is_active')) {
            $query->where('is_active', (bool) $request->is_active);
        }

        if ($request->has('donation_available')) {
            $query->where(
                'donation_available',
                (bool) $request->donation_available
            );
        }

        if ($request->filled('search')) {
            $search = $request->search;

            $query->where(function ($q) use ($search) {
                $q->where('name_ar', 'like', "%{$search}%")
                    ->orWhere('name_en', 'like', "%{$search}%")
                    ->orWhere('tagline_ar', 'like', "%{$search}%")
                    ->orWhere('tagline_en', 'like', "%{$search}%");
            });
        }

        return SeasonResource::collection(
            $query->paginate(\App\Support\PerPage::from(request(), 10))
        );
    }

    public function store(StoreSeasonRequest $request)
    {
        $data = $request->validated();

        $data['is_active'] = $data['is_active'] ?? true;
        $data['donation_available'] = $data['donation_available'] ?? true;
        $data['sort_order'] = $data['sort_order'] ?? 0;

        $season = Season::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Season created successfully',
            'data' => new SeasonResource($season),
        ], 201);
    }

    public function show(Request $request, Season $season)
    {
        $staff = Viewer::isStaff($request);

        abort_if(!$staff && !$season->is_active, 404);

        $season->load([
            'programs' => fn ($q) => $this->scopePrograms($q, $staff),
        ]);

        return new SeasonResource($season);
    }

    /** Visitors only see published, active programs that are not hidden from the audience. */
    private function scopePrograms($query, bool $staff)
    {
        $query->latest();

        if (!$staff) {
            $query->where('status', 'published')
                ->where('is_active', true)
                ->where(fn ($q) => $q->whereNull('hide_from_audience')->orWhere('hide_from_audience', false));
        }

        return $query;
    }

    public function update(UpdateSeasonRequest $request, Season $season)
    {
        $season->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Season updated successfully',
            'data' => new SeasonResource(
                $season->fresh()->load('programs')
            ),
        ]);
    }

    public function destroy(Season $season)
    {
        $season->delete();

        return response()->json([
            'success' => true,
            'message' => 'Season deleted successfully',
        ]);
    }
}
