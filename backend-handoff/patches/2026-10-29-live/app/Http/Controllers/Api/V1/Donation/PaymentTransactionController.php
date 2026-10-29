<?php

namespace App\Http\Controllers\Api\V1\Donation;

use App\Http\Controllers\Controller;
use App\Models\Donation;
use App\Support\DonationFilters;
use App\Support\PaymentMethodKind;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Online payment attempts (dashboard → معاملات الدفع). Not a separate table: every card donation IS
 * the gateway transaction, so this is a gateway-only view of donations with the payment details the
 * team needs (reference, gateway status, last error) and internal notes kept in tracking_data.
 *
 *   GET   /payment-transactions?status=&method=&search=&per_page=
 *   PATCH /payment-transactions/{donation}        { internal_notes }
 *   POST  /payment-transactions/{donation}/retry  → 422: a Kashier order reference can't be paid twice;
 *                                                  the donor starts a new donation instead.
 */
class PaymentTransactionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->merge(array_filter([
            'channel' => 'gateway',
            'q' => $request->input('search'),
        ], fn ($v) => $v !== null && $v !== ''));

        $query = Donation::query()->with(['donor', 'paymentMethod'])->latest('id');
        DonationFilters::apply($query, $request);
        if ($request->filled('method')) {
            $query->whereHas('paymentMethod', fn ($m) => $m->where('type', (string) $request->input('method')));
        }

        $page = $query->paginate(min(200, max(1, (int) $request->input('per_page', 50))));
        $page->getCollection()->transform(fn (Donation $d) => $this->present($d));

        return response()->json($page);
    }

    public function update(Request $request, Donation $donation): JsonResponse
    {
        abort_unless(PaymentMethodKind::isGateway($donation), 404);
        $data = $request->validate(['internal_notes' => ['nullable', 'string', 'max:2000']]);

        $tracking = is_array($donation->tracking_data) ? $donation->tracking_data : [];
        $tracking['internal_notes'] = $data['internal_notes'] ?? null;
        $donation->forceFill(['tracking_data' => $tracking])->save();

        return response()->json(['data' => $this->present($donation->load(['donor', 'paymentMethod']))]);
    }

    public function retry(Donation $donation): JsonResponse
    {
        abort_unless(PaymentMethodKind::isGateway($donation), 404);

        return response()->json([
            'message' => 'بوابة الدفع مش بتقبل نفس رقم العملية مرتين. ابعت للمتبرع رابط صفحة التبرع يعيد التبرع، وعلّم العملية دي «فشل» من شاشة التبرعات.',
        ], 422);
    }

    private function present(Donation $d): array
    {
        $tracking = is_array($d->tracking_data) ? $d->tracking_data : [];
        $details = is_array($d->payment_details) ? $d->payment_details : [];
        $slug = (string) ($d->paymentMethod?->slug ?? '');

        return [
            'id' => (string) $d->id,
            'ref_code' => $d->transaction_reference,
            'status' => $d->status,
            'amount' => (float) $d->amount,
            'currency' => 'EGP',
            'method' => $d->paymentMethod?->name_ar,
            'provider' => str_contains($slug, 'kashier') ? 'kashier' : (str_contains($slug, 'paymob') || $slug === 'credit-card' ? 'paymob' : $slug),
            'payment_reference' => $d->payment_reference,
            'donor_name' => $d->donor_name ?? $d->donor?->name,
            'donor_email' => $d->donor?->email,
            'donor_phone' => $d->donor_phone ?? $d->donor?->phone,
            'redirect_url' => null,
            'internal_notes' => $tracking['internal_notes'] ?? null,
            'retry_count' => 0,
            'last_error' => $details['message'] ?? $details['error'] ?? $details['data']['message'] ?? null,
            'created_at' => optional($d->created_at)->toIso8601String(),
        ];
    }
}
