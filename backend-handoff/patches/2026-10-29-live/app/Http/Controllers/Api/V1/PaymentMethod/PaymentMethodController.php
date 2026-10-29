<?php

namespace App\Http\Controllers\Api\V1\PaymentMethod;

use App\Http\Controllers\Controller;
use App\Http\Requests\PaymentMethod\StorePaymentMethodRequest;
use App\Http\Requests\PaymentMethod\UpdatePaymentMethodRequest;
use App\Notifications\PayoutDetailsChangedNotification;
use App\Services\ActivityLogService;
use App\Support\NotifyAdmins;
use App\Support\PaymentDetailsRules;
use App\Http\Resources\PaymentMethodResource;
use App\Models\PaymentMethod;

class PaymentMethodController extends Controller
{
    public function index()
    {
        $query = PaymentMethod::query()
            ->orderBy('sort_order')
            ->latest();

        if (request()->has('is_active')) {
            $query->where('is_active', request()->boolean('is_active'));
        }

        return PaymentMethodResource::collection(
            $query->paginate(\App\Support\PerPage::from(request(), 10))
        );
    }
    
    public function publicIndex()
{
    return PaymentMethodResource::collection(
        PaymentMethod::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get()
    );
}

    public function store(StorePaymentMethodRequest $request)
    {
        $paymentMethod = PaymentMethod::create(
            $request->validated()
        );

        // A new method with payout details is a new place donors send money: logged and alerted.
        $this->audit($request, $paymentMethod, ['name_ar' => null, 'is_active' => null, 'details' => []]);

        return new PaymentMethodResource($paymentMethod);
    }

    public function show(PaymentMethod $paymentMethod)
    {
        return new PaymentMethodResource($paymentMethod);
    }

    public function update(
        UpdatePaymentMethodRequest $request,
        PaymentMethod $paymentMethod
    ) {
        $before = $paymentMethod->only(['name_ar', 'is_active', 'details']);
        $paymentMethod->update($request->validated());
        $this->audit($request, $paymentMethod, $before);

        return new PaymentMethodResource(
            $paymentMethod->fresh()
        );
    }

    /**
     * Every change is logged; a change to where donors send money (numbers / accounts / IPA) also
     * alerts every super-admin, so a misused dashboard account cannot redirect donations silently.
     */
    private function audit(\Illuminate\Http\Request $request, PaymentMethod $method, array $before): void
    {
        $after = $method->only(['name_ar', 'is_active', 'details']);
        if ($before == $after) {
            return;
        }

        $payout = fn ($d) => array_intersect_key(is_array($d) ? $d : [], array_flip(PaymentDetailsRules::PAYOUT_KEYS));
        $payoutChanged = $payout($before['details'] ?? null) != $payout($after['details'] ?? null);

        app(ActivityLogService::class)->custom(
            $payoutChanged ? 'payment_payout_changed' : 'payment_method_updated',
            $method,
            ($payoutChanged ? 'تغيير حسابات استلام التبرعات: ' : 'تعديل طريقة دفع: ') . $method->name_ar,
            ['before' => $before, 'after' => $after]
        );

        if ($payoutChanged) {
            NotifyAdmins::send(new PayoutDetailsChangedNotification(
                (int) $method->id,
                (string) $method->name_ar,
                (string) ($request->user()?->name ?? 'مستخدم')
            ));
        }
    }
    
    // active
    public function active()
{
    return response()->json([
        'data' => \App\Models\PaymentMethod::where('is_active', true)->get()
    ]);
}

    public function destroy(PaymentMethod $paymentMethod)
    {
        $paymentMethod->delete();

        return response()->json([
            'message' => 'Payment method deleted successfully'
        ]);
    }
}
