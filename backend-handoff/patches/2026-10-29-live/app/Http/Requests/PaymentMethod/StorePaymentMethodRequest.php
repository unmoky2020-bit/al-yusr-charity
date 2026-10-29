<?php

namespace App\Http\Requests\PaymentMethod;

use App\Support\PaymentDetailsRules;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePaymentMethodRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return PaymentDetailsRules::for($this->input('type')) + [
            'name_ar' => ['required', 'string', 'max:255'],
            'name_en' => ['required', 'string', 'max:255'],

            'slug' => [
                'required',
                'string',
                'max:100',
                'alpha_dash',
                'unique:payment_methods,slug',
            ],

            'type' => ['required', 'string', 'in:card,bank_transfer,wallet,instant_payment,cash_pickup'],

            'provider_ar' => ['nullable', 'string', 'max:255'],
            'provider_en' => ['nullable', 'string', 'max:255'],

            'description_ar' => ['nullable', 'string'],
            'description_en' => ['nullable', 'string'],

            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return PaymentDetailsRules::messages();
    }
}
