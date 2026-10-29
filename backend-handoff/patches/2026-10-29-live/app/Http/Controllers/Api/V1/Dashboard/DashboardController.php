<?php

namespace App\Http\Controllers\Api\V1\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\CaseModel;
use App\Models\Donation;
use App\Models\DonationCampaign;
use App\Models\Donor;
use App\Models\Program;
use App\Models\Project;
use App\Models\User;
use App\Models\Volunteer;

/**
 * GET /api/v1/dashboard — headline counts for the dashboard home.
 * Money only counts PAID donations (pending / failed never inflate "received").
 * Detailed donation figures (by month, method, program…) come from GET /donations/stats.
 */
class DashboardController extends Controller
{
    public function index()
    {
        $paid = Donation::query()->where('status', 'paid');

        return response()->json([
            'statistics' => [
                // Donations
                'total_donations' => (float) (clone $paid)->sum('amount'),
                'paid_donations' => (clone $paid)->count(),
                'pending_donations' => Donation::where('status', 'pending')->count(),
                'failed_donations' => Donation::where('status', 'failed')->count(),
                'donations' => Donation::count(),

                // People
                'users' => User::count(),
                'donors' => Donor::count(),
                'paying_donors' => (clone $paid)->distinct()->count('donor_id'),
                'volunteers' => Volunteer::count(),
                'pending_volunteers' => Volunteer::where('status', 'pending')->count(),
                'approved_volunteers' => Volunteer::where('status', 'approved')->count(),
                'rejected_volunteers' => Volunteer::where('status', 'rejected')->count(),

                // Content
                'programs' => Program::count(),
                'active_programs' => Program::where('is_active', 1)->count(),
                'projects' => Project::count(),
                'active_projects' => Project::where('is_active', 1)->count(),
                'campaigns' => DonationCampaign::count(),
                'active_campaigns' => DonationCampaign::where('is_active', 1)->count(),
                'approved_cases' => CaseModel::where('status', 'approved')->count(),
                'pending_cases' => CaseModel::where('status', 'pending_review')->count(),
            ],
        ]);
    }
}
