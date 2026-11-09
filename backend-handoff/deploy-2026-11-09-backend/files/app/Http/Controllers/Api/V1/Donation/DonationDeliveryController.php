<?php

namespace App\Http\Controllers\Api\V1\Donation;

use App\Http\Controllers\Controller;
use App\Http\Resources\DonationResource;
use App\Models\Donation;
use App\Notifications\DonorDeliveryStageNotification;
use App\Support\NotifyDonor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * PATCH /donations/{donation}/delivery { stage, note?, notify? } — where a PAID donation is on its
 * way to the family (9 Nov 2026):
 *   family_identified → «تم تحديد الأسرة المستحقة»
 *   preparing         → «جاري تجهيز التبرع لها»
 *   delivered         → «تم تسليم تبرعك»
 * Kept in donations.tracking_data.delivery = { stage, history: [{stage, at, note?, by}] } (no new
 * column). The donor's account gets a notification at each step unless notify=false.
 */
class DonationDeliveryController extends Controller
{
    public const STAGES = ['family_identified', 'preparing', 'delivered'];

    public function update(Request $request, Donation $donation): JsonResponse
    {
        $data = $request->validate([
            'stage' => ['required', Rule::in(self::STAGES)],
            'note' => ['nullable', 'string', 'max:300'],
            'notify' => ['sometimes', 'boolean'],
        ], [
            'stage.required' => 'اختار المرحلة.',
            'stage.in' => 'المرحلة دي مش معروفة.',
            'note.max' => 'الملاحظة أطول من 300 حرف.',
        ]);

        if ($donation->status !== 'paid') {
            return response()->json([
                'message' => 'مراحل التسليم بتتسجل بعد ما التبرع يتأكد إنه مدفوع.',
            ], 422);
        }

        $tracking = is_array($donation->tracking_data) ? $donation->tracking_data : [];
        $delivery = is_array($tracking['delivery'] ?? null) ? $tracking['delivery'] : [];
        $history = is_array($delivery['history'] ?? null) ? $delivery['history'] : [];
        $history[] = array_filter([
            'stage' => $data['stage'],
            'at' => now()->toIso8601String(),
            'note' => isset($data['note']) ? trim($data['note']) : null,
            'by' => $request->user()?->id,
        ], fn ($v) => $v !== null && $v !== '');

        $tracking['delivery'] = ['stage' => $data['stage'], 'history' => array_slice($history, -20)];
        $donation->forceFill(['tracking_data' => $tracking])->save();

        if ($request->boolean('notify', true)) {
            NotifyDonor::send($donation, new DonorDeliveryStageNotification(
                (int) $donation->id,
                $data['stage'],
                NotifyDonor::amount($donation),
                NotifyDonor::targetName($donation),
                NotifyDonor::followUrl($donation),
            ));
        }

        $donation->load(['donor', 'paymentMethod', 'program', 'case', 'donationPackage', 'project', 'donationCampaign']);

        return response()->json([
            'message' => 'اتسجلت المرحلة.',
            'data' => new DonationResource($donation),
        ]);
    }
}
