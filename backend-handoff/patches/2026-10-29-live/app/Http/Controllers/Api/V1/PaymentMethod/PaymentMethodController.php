<?php

namespace App\Http\Controllers\Api\V1\PaymentMethod;

use App\Http\Controllers\Controller;
use App\Http\Requests\PaymentMethod\StorePaymentMethodRequest;
use App\Http\Requests\PaymentMethod\UpdatePaymentMethodRequest;
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
        $paymentMethod->update(
            $request->validated()
        );

        return new PaymentMethodResource(
            $paymentMethod->fresh()
        );
        
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
