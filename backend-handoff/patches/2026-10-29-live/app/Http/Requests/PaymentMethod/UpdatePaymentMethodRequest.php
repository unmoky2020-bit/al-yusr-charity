<?php

namespace App\Http\Requests\PaymentMethod;

use App\Support\PaymentDetailsRules;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Partial updates: show/hide (`is_active`) or one field can be sent alone. `type` and `slug` decide
 * how the donation form and the gateway treat the method, so they are not editable here.
 * `details` is validated by the method's type (PaymentDetailsRules).
 */
class UpdatePaymentMethodRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $type = $this->route('paymentMethod')?->type;

        return [
            'name_ar' => ['sometimes', 'required', 'string', 'max:255'],
            'name_en' => ['sometimes', 'required', 'string', 'max:255'],
            'slug' => ['prohibited'],
            'type' => ['prohibited'],
            'provider_ar' => ['sometimes', 'nullable', 'string', 'max:255'],
            'provider_en' => ['sometimes', 'nullable', 'string', 'max:255'],
            'description_ar' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'description_en' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'sort_order' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ] + PaymentDetailsRules::for($type);
    }

    public function messages(): array
    {
        return PaymentDetailsRules::messages() + [
            'slug.prohibited' => 'رابط طريقة الدفع مينفعش يتغير.',
            'type.prohibited' => 'نوع طريقة الدفع مينفعش يتغير.',
        ];
    }
}
