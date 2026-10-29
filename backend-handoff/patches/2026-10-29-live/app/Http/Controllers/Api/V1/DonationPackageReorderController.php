<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProgramDonationPackageResource;
use App\Models\DonationCampaign;
use App\Models\Program;
use App\Models\Project;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * POST /{programs|projects|donation-campaigns}/{id}/donation-packages/reorder
 * body: { "packages": [ { "id": 12, "sort_order": 1 }, ... ] }
 * Only packages that belong to the owner are touched.
 */
class DonationPackageReorderController extends Controller
{
    public function program(Request $request, Program $program)
    {
        return $this->reorder($request, $program);
    }

    public function project(Request $request, Project $project)
    {
        return $this->reorder($request, $project);
    }

    public function donationCampaign(Request $request, DonationCampaign $donationCampaign)
    {
        return $this->reorder($request, $donationCampaign);
    }

    private function reorder(Request $request, Model $owner)
    {
        $data = $request->validate([
            'packages' => 'required|array|min:1',
            'packages.*.id' => 'required|integer',
            'packages.*.sort_order' => 'required|integer|min:0',
        ]);

        $ids = collect($data['packages'])->pluck('id');
        $owned = $owner->donationPackages()->whereIn('id', $ids)->pluck('id');

        if ($owned->count() !== $ids->unique()->count()) {
            return response()->json([
                'message' => 'Some packages do not belong to this item.',
                'invalid_ids' => $ids->diff($owned)->values(),
            ], 422);
        }

        DB::transaction(function () use ($owner, $data) {
            foreach ($data['packages'] as $row) {
                $owner->donationPackages()->whereKey($row['id'])->update(['sort_order' => $row['sort_order']]);
            }
        });

        return ProgramDonationPackageResource::collection(
            $owner->donationPackages()->orderBy('sort_order')->get()
        );
    }
}
