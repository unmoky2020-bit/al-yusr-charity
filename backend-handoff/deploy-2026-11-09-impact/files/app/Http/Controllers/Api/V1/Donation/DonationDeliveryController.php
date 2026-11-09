<?php

namespace App\Http\Controllers\Api\V1\Donation;

use App\Http\Controllers\Controller;
use App\Http\Resources\DonationResource;
use App\Models\Donation;
use App\Notifications\DonorDeliveryStageNotification;
use App\Services\ActivityLogService;
use App\Support\DeliverySteps;
use App\Support\Impact\Evidence;
use App\Support\Impact\ImpactNumbers;
use App\Support\NotifyDonor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * The trail of one PAID donation on its way to a family (see DeliverySteps):
 *   PATCH  /donations/{donation}/delivery        { stage, note?, photos?, notify? }
 *   DELETE /donations/{donation}/delivery/last   undo the last line (a mistake)
 *   POST   /impact/upload                        a photo for a line (faces are blurred before upload)
 * Stages: family_identified → preparing → delivered, or on_hold (needs the reason).
 * Every change is written to the activity log; the donor is notified unless notify=false.
 */
class DonationDeliveryController extends Controller
{
    public function update(Request $request, Donation $donation, ActivityLogService $log): JsonResponse
    {
        $data = $request->validate(array_merge([
            'stage' => ['required', Rule::in([...DeliverySteps::STAGES, DeliverySteps::ON_HOLD])],
            'note' => ['nullable', 'string', 'max:500', Rule::requiredIf(fn () => $request->input('stage') === DeliverySteps::ON_HOLD)],
            'notify' => ['sometimes', 'boolean'],
        ], Evidence::photosRules()), array_merge([
            'stage.required' => 'اختار المرحلة.',
            'stage.in' => 'المرحلة دي مش معروفة.',
            'note.required' => 'اكتب سبب التأجيل علشان المتبرع يعرف.',
            'note.max' => 'الملاحظة أطول من 500 حرف.',
        ], Evidence::photosMessages()));

        if ($donation->status !== 'paid') {
            return response()->json(['message' => 'مراحل التسليم بتتسجل بعد ما التبرع يتأكد إنه مدفوع.'], 422);
        }

        $before = DeliverySteps::stageOf($donation);
        DeliverySteps::append($donation, [
            'stage' => $data['stage'],
            'at' => now()->toIso8601String(),
            'note' => isset($data['note']) ? trim($data['note']) : null,
            'photos' => array_values($data['photos'] ?? []),
            'by' => $request->user()?->id,
        ]);

        ImpactNumbers::forget();
        $log->custom('delivery.stage', $donation, "مرحلة تسليم: {$data['stage']}" . (isset($data['note']) ? " — {$data['note']}" : ''), [
            'from' => $before, 'to' => $data['stage'], 'photos' => count($data['photos'] ?? []),
        ]);

        if ($request->boolean('notify', true)) {
            NotifyDonor::send($donation, new DonorDeliveryStageNotification(
                (int) $donation->id, $data['stage'], NotifyDonor::amount($donation), NotifyDonor::targetName($donation), NotifyDonor::followUrl($donation),
                $data['stage'] === DeliverySteps::ON_HOLD ? trim((string) $data['note']) : null,
            ));
        }

        return $this->reply($donation, 'اتسجلت المرحلة.');
    }

    public function undo(Donation $donation, ActivityLogService $log): JsonResponse
    {
        if (! DeliverySteps::undoLast($donation)) {
            return response()->json(['message' => 'مفيش خطوات تتلغي.'], 422);
        }
        ImpactNumbers::forget();
        $log->custom('delivery.undo', $donation, 'اتلغت آخر خطوة تسليم', ['now' => DeliverySteps::stageOf($donation)]);

        return $this->reply($donation, 'اتلغت آخر خطوة.');
    }

    public function upload(Request $request): JsonResponse
    {
        return response()->json(['url' => Evidence::store($request, 'evidence')], 201);
    }

    private function reply(Donation $donation, string $message): JsonResponse
    {
        $donation->refresh()->load(['donor', 'paymentMethod', 'program', 'case', 'donationPackage', 'project', 'donationCampaign']);

        return response()->json(['message' => $message, 'data' => new DonationResource($donation)]);
    }
}
