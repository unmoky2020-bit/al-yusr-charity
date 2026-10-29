<?php

namespace App\Http\Controllers\Api\V1\VolunteerCampaign;

use App\Http\Controllers\Controller;
use App\Http\Requests\VolunteerCampaign\InviteVolunteersRequest;
use App\Http\Requests\VolunteerCampaign\StoreVolunteerCampaignRequest;
use App\Http\Requests\VolunteerCampaign\UpdateApplicationRequest;
use App\Http\Requests\VolunteerCampaign\UpdateVolunteerCampaignRequest;
use App\Http\Resources\VolunteerCampaignApplicationResource;
use App\Http\Resources\VolunteerCampaignResource;
use App\Models\Volunteer;
use App\Models\VolunteerCampaign;
use App\Models\VolunteerCampaignApplication;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class VolunteerCampaignController extends Controller
{
    public function index(Request $request)
    {
        $query = VolunteerCampaign::query()
            ->withCount('applications')
            ->orderByDesc('event_date')
            ->orderByDesc('id');

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
                $q->where('title_ar', 'like', "%{$search}%")
                  ->orWhere('title_en', 'like', "%{$search}%")
                  ->orWhere('city', 'like', "%{$search}%")
                  ->orWhere('governorate', 'like', "%{$search}%");
            });
        }

        return VolunteerCampaignResource::collection(
            $query->paginate(\App\Support\PerPage::from(request(), 15))
        );
    }

    public function store(StoreVolunteerCampaignRequest $request)
    {
        return new VolunteerCampaignResource(
            VolunteerCampaign::create($request->validated())
        );
    }

    public function show(VolunteerCampaign $volunteerCampaign)
    {
        return new VolunteerCampaignResource(
            $volunteerCampaign
        );
    }

    public function update(
        UpdateVolunteerCampaignRequest $request,
        VolunteerCampaign $volunteerCampaign
    ) {
        $volunteerCampaign->update($request->validated());

        return new VolunteerCampaignResource(
            $volunteerCampaign->fresh()
        );
    }

    public function destroy(VolunteerCampaign $volunteerCampaign)
    {
        $volunteerCampaign->delete();

        return response()->json([
            'message' => 'Volunteer campaign deleted successfully'
        ]);
    }

    public function statistics()
    {
        return response()->json([
            'total' => VolunteerCampaign::count(),
            'open' => VolunteerCampaign::where('status', 'open')->count(),
            'draft' => VolunteerCampaign::where('status', 'draft')->count(),
            'closed' => VolunteerCampaign::where('status', 'closed')->count(),
            'cancelled' => VolunteerCampaign::where('status', 'cancelled')->count(),
        ]);
    }

    public function applications(
        VolunteerCampaign $volunteerCampaign
    ) {
        return VolunteerCampaignApplicationResource::collection(
            $volunteerCampaign->applications()
                ->with('volunteer')
                ->latest()
                ->paginate(\App\Support\PerPage::from(request(), 15))
        );
    }

    public function invite(
        InviteVolunteersRequest $request,
        VolunteerCampaign $volunteerCampaign
    ) {
        $created = [];

        DB::transaction(function () use (
            $request,
            $volunteerCampaign,
            &$created
        ) {
            foreach ($request->validated('volunteer_ids') as $volunteerId) {
                $volunteer = Volunteer::findOrFail($volunteerId);

                $application = VolunteerCampaignApplication::updateOrCreate(
                    [
                        'campaign_id' => $volunteerCampaign->id,
                        'volunteer_id' => $volunteer->id,
                    ],
                    [
                        'status' => 'invited',
                        'invited_at' => now(),
                    ]
                );

                $created[] = $application;
            }
        });

        return VolunteerCampaignApplicationResource::collection(
            collect($created)->load('volunteer')
        );
    }

    public function updateApplication(
        UpdateApplicationRequest $request,
        VolunteerCampaign $volunteerCampaign,
        VolunteerCampaignApplication $application
    ) {
        abort_unless(
            $application->campaign_id === $volunteerCampaign->id,
            404
        );

        $application->update(
            $request->validated()
        );

        return new VolunteerCampaignApplicationResource(
            $application->fresh()->load([
                'volunteer',
                'campaign',
            ])
        );
    }

    public function removeApplication(
        VolunteerCampaign $volunteerCampaign,
        VolunteerCampaignApplication $application
    ) {
        abort_unless(
            $application->campaign_id === $volunteerCampaign->id,
            404
        );

        $application->delete();

        return response()->json([
            'message' => 'Volunteer removed from campaign successfully'
        ]);
    }
}
