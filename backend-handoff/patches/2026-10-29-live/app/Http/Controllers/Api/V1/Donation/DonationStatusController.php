<?php

namespace App\Http\Controllers\Api\V1\Donation;

use App\Http\Controllers\Controller;
use App\Http\Resources\DonationResource;
use App\Models\Donation;
use App\Services\ActivityLogService;
use App\Support\DonationTotals;
use App\Support\PaymentMethodKind;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * PATCH /api/v1/donations/{donation}/status — the only way the team changes a donation's status
 * (PUT /donations/{id} deliberately ignores status). Rules:
 *   pending  → paid | failed | cancelled
 *   failed   → pending            (donor retried / mistake)
 *   paid     → refunded
 * Marking an ONLINE (card) donation as paid by hand needs confirm_gateway=true: normally the
 * gateway confirms it, so the admin must have checked the money in the Kashier / Paymob account.
 * Program / project collected amounts follow (DonationTotals). Every change is kept in
 * tracking_data.status_history and the activity log; the DonationObserver
 * sends the «تم استلام تبرع مدفوع» notification as usual.
 */
class DonationStatusController extends Controller
{
    private const TRANSITIONS = [
        'pending' => ['paid', 'failed', 'cancelled'],
        'failed' => ['pending'],
        'paid' => ['refunded'],
        'cancelled' => ['pending'],
    ];

    public function __invoke(Request $request, Donation $donation, ActivityLogService $log): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', 'string', Rule::in(['pending', 'paid', 'failed', 'cancelled', 'refunded'])],
            'note' => ['nullable', 'string', 'max:500'],
            'confirm_gateway' => ['sometimes', 'boolean'],
        ]);

        $from = (string) $donation->status;
        $to = $data['status'];

        if ($from === $to) {
            return response()->json(['message' => 'التبرع بالفعل بنفس الحالة.', 'data' => new DonationResource($donation)], 200);
        }
        if (! in_array($to, self::TRANSITIONS[$from] ?? [], true)) {
            return response()->json(['message' => "مينفعش تغيير الحالة من «{$from}» إلى «{$to}»."], 422);
        }
        if ($to === 'paid' && PaymentMethodKind::isGateway($donation) && ! ($data['confirm_gateway'] ?? false)) {
            return response()->json([
                'message' => 'ده دفع أونلاين بيتأكد من بوابة الدفع. أكّد إنك راجعت وصول المبلغ في حساب البوابة (confirm_gateway).',
            ], 422);
        }

        DB::transaction(function () use ($donation, $from, $to, $data, $request) {
            $tracking = is_array($donation->tracking_data) ? $donation->tracking_data : [];
            $tracking['status_history'][] = array_filter([
                'from' => $from,
                'to' => $to,
                'by' => $request->user()?->id,
                'at' => now()->toIso8601String(),
                'note' => $data['note'] ?? null,
                'manual_gateway_confirm' => $to === 'paid' && PaymentMethodKind::isGateway($donation) ? true : null,
            ], fn ($v) => $v !== null);

            $donation->forceFill(['status' => $to, 'tracking_data' => $tracking])->save();

            // Program / project progress follows the money actually received.
            if ($to === 'paid') {
                DonationTotals::added($donation);
            } elseif ($from === 'paid') {
                DonationTotals::removed($donation);
            }
        });

        $log->custom('donation_status', $donation, "تغيير حالة التبرع {$donation->transaction_reference}: {$from} → {$to}", [
            'from' => $from,
            'to' => $to,
            'note' => $data['note'] ?? null,
        ]);

        return response()->json([
            'message' => 'تم تحديث حالة التبرع.',
            'data' => new DonationResource($donation->fresh()->load(['donor', 'paymentMethod', 'program', 'case', 'donationPackage', 'project', 'donationCampaign'])),
        ]);
    }
}
