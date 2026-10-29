<?php

namespace App\Http\Controllers\Api\V1\VolunteerCampaign;

use App\Http\Controllers\Controller;
use App\Models\Volunteer;
use App\Models\VolunteerCampaign;
use App\Models\VolunteerCampaignApplication;
use App\Support\Viewer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Volunteers applying to field campaigns, on the existing volunteers +
 * volunteer_campaign_applications tables (no schema change).
 *
 *   POST   /volunteer-campaigns/{id}/apply      public (throttled) — find-or-create the volunteer by email/phone
 *   GET    /volunteer-applications?mine=1       signed-in user's applications (matched by email/phone)
 *   GET    /volunteer-applications              staff: all (filters campaign_id, status)
 *   PATCH  /volunteer-applications/{id}         staff: status / notes
 *   DELETE /volunteer-applications/{id}         staff, or the applicant while pending
 */
class VolunteerApplicationController extends Controller
{
    /** Other spellings that map onto the stored enum. */
    private const STATUS_ALIASES = ['cancelled' => 'withdrawn', 'waitlisted' => 'waitlist', 'no_show' => 'noshow'];

    /** waitlist = قائمة انتظار, attended = حضر, noshow = لم يحضر (after the field day). */
    private const STATUSES = ['invited', 'pending', 'approved', 'rejected', 'withdrawn', 'waitlist', 'attended', 'noshow'];

    public function apply(Request $request, VolunteerCampaign $volunteerCampaign)
    {
        $data = $request->validate([
            'full_name' => 'required|string|min:2|max:120',
            'email' => 'nullable|email|max:255',
            'phone' => ['required', 'regex:/^01\d{9}$/'],
            'city' => 'nullable|string|max:80',
            'governorate' => 'nullable|string|max:80',
            'skills' => 'nullable|array',
            'skills.*' => 'string|max:60',
            'notes' => 'nullable|string|max:1000',
        ]);

        // A signed-in applicant always applies as themself.
        if ($user = $request->user('sanctum')) {
            $data['email'] = $user->email;
        }

        $application = DB::transaction(function () use ($data, $volunteerCampaign) {
            $volunteer = Volunteer::query()
                ->when($data['email'] ?? null, fn ($q, $email) => $q->where('email', $email))
                ->when(empty($data['email']), fn ($q) => $q->where('phone', $data['phone']))
                ->first();

            if (!$volunteer) {
                $volunteer = Volunteer::create([
                    'name' => $data['full_name'],
                    'email' => $data['email'] ?? null,
                    'phone' => $data['phone'],
                    'governorate' => $data['governorate'] ?? null,
                    'city' => $data['city'] ?? null,
                    'skills' => $data['skills'] ?? [],
                    'status' => 'pending',
                ]);
            }

            $existing = VolunteerCampaignApplication::where('campaign_id', $volunteerCampaign->id)
                ->where('volunteer_id', $volunteer->id)
                ->first();

            if ($existing && $existing->status !== 'withdrawn') {
                return $existing;
            }

            return VolunteerCampaignApplication::updateOrCreate(
                ['campaign_id' => $volunteerCampaign->id, 'volunteer_id' => $volunteer->id],
                ['status' => 'pending', 'applied_at' => now(), 'notes' => $data['notes'] ?? null]
            );
        });

        return response()->json([
            'message' => $application->wasRecentlyCreated ? 'تم تسجيل طلبك' : 'طلبك مسجل بالفعل',
            'data' => $this->present($application->load(['volunteer', 'campaign'])),
        ], $application->wasRecentlyCreated ? 201 : 200);
    }

    public function index(Request $request)
    {
        $query = VolunteerCampaignApplication::with(['volunteer', 'campaign'])->latest();

        if ($request->boolean('mine') || !Viewer::isStaff($request)) {
            $volunteerIds = $this->volunteerIdsOf($request);
            $query->whereIn('volunteer_id', $volunteerIds ?: [0]);
        }

        if ($request->filled('campaign_id')) {
            $query->where('campaign_id', $request->integer('campaign_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', self::STATUS_ALIASES[$request->status] ?? $request->status);
        }

        $perPage = min(max($request->integer('per_page', 50), 1), 200);
        $page = $query->paginate($perPage);
        $page->getCollection()->transform(fn ($a) => $this->present($a));

        return response()->json($page);
    }

    public function update(Request $request, VolunteerCampaignApplication $application)
    {
        abort_unless(Viewer::isStaff($request), 403, 'Forbidden');

        $request->merge(['status' => self::STATUS_ALIASES[$request->status] ?? $request->status]);

        $data = $request->validate([
            'status' => 'sometimes|in:' . implode(',', self::STATUSES),
            'notes' => 'sometimes|nullable|string|max:2000',
        ]);

        $application->update($data);

        return response()->json(['message' => 'Updated successfully', 'data' => $this->present($application->fresh()->load(['volunteer', 'campaign']))]);
    }

    public function destroy(Request $request, VolunteerCampaignApplication $application)
    {
        $staff = Viewer::isStaff($request);
        $own = in_array($application->volunteer_id, $this->volunteerIdsOf($request), true);

        abort_unless($staff || ($own && $application->status === 'pending'), 403, 'Forbidden');

        $application->delete();

        return response()->json(['message' => 'Deleted Successfully']);
    }

    /** Volunteer rows that belong to the signed-in user (same email or phone). */
    private function volunteerIdsOf(Request $request): array
    {
        $user = $request->user();

        return Volunteer::query()
            ->where(fn ($q) => $q->where('email', $user->email)
                ->when($user->phone, fn ($qq) => $qq->orWhere('phone', $user->phone)))
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();
    }

    /** Flat shape the admin and "My tasks" screens read. */
    private function present(VolunteerCampaignApplication $a): array
    {
        $v = $a->volunteer;

        return [
            'id' => $a->id,
            'campaign_id' => $a->campaign_id,
            'volunteer_id' => $a->volunteer_id,
            'full_name' => $v?->name,
            'email' => $v?->email,
            'phone' => $v?->phone,
            'city' => $v?->city,
            'skills' => $v?->skills ?? [],
            'status' => $a->status,
            'notes' => $a->notes,
            'invited_at' => $a->invited_at,
            'applied_at' => $a->applied_at,
            'created_at' => $a->created_at,
            'campaign' => $a->campaign,
        ];
    }
}
