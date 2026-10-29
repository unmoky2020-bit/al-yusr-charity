<?php

namespace App\Support;

/**
 * Validation for payment_methods.details, by method type. Donors transfer money to these values,
 * so each one has a strict format (no free text where a number belongs):
 *   wallet           numbers:   [{number: 01XXXXXXXXX, label?}]              (≤ 5)
 *   bank_transfer    accounts:  [{bank_code, bank_name, account_name, account_number, iban?, swift?}] (≤ 5)
 *   instant_payment  addresses: [{ipa: name@bank, label?}]                   (≤ 5)
 * card / cash_pickup details are not editable from the dashboard (gateway keys live elsewhere).
 */
final class PaymentDetailsRules
{
    public const BANK_CODES = ['cib', 'nbe', 'misr', 'qnb', 'alexbank', 'aaib', 'hsbc', 'adib', 'faisal', 'other'];

    /** The details keys that hold where donors send money (changes to them are logged and alerted). */
    public const PAYOUT_KEYS = ['numbers', 'accounts', 'addresses'];

    public static function for(?string $type): array
    {
        return match ($type) {
            'wallet' => [
                'details' => ['sometimes', 'array:numbers'],
                'details.numbers' => ['present', 'array', 'max:5'],
                'details.numbers.*.number' => ['required', 'string', 'regex:/^01[0125][0-9]{8}$/'],
                'details.numbers.*.label' => ['nullable', 'string', 'max:60'],
            ],
            'bank_transfer' => [
                'details' => ['sometimes', 'array:accounts'],
                'details.accounts' => ['present', 'array', 'max:5'],
                'details.accounts.*.bank_code' => ['required', 'string', 'in:' . implode(',', self::BANK_CODES)],
                'details.accounts.*.bank_name' => ['required', 'string', 'max:120'],
                'details.accounts.*.account_name' => ['required', 'string', 'max:120'],
                'details.accounts.*.account_number' => ['required', 'string', 'regex:/^[0-9]{6,30}$/'],
                'details.accounts.*.iban' => ['nullable', 'string', 'regex:/^EG[0-9]{27}$/'],
                'details.accounts.*.swift' => ['nullable', 'string', 'regex:/^[A-Z0-9]{8}([A-Z0-9]{3})?$/'],
            ],
            'instant_payment' => [
                'details' => ['sometimes', 'array:addresses'],
                'details.addresses' => ['present', 'array', 'max:5'],
                'details.addresses.*.ipa' => ['required', 'string', 'max:80', 'regex:/^[A-Za-z0-9._-]+@[A-Za-z0-9._-]+$/'],
                'details.addresses.*.label' => ['nullable', 'string', 'max:60'],
            ],
            // Card gateways and home pickup: their details are fixed by the system.
            default => ['details' => ['prohibited']],
        };
    }

    public static function messages(): array
    {
        return [
            'details.numbers.*.number.regex' => 'رقم المحفظة لازم يكون رقم موبايل مصري صحيح (01XXXXXXXXX).',
            'details.accounts.*.account_number.regex' => 'رقم الحساب لازم يكون أرقام بس (من 6 لـ 30 رقم).',
            'details.accounts.*.iban.regex' => 'الـ IBAN المصري بيبدأ بـ EG وبعده 27 رقم.',
            'details.accounts.*.swift.regex' => 'كود SWIFT غير صحيح.',
            'details.addresses.*.ipa.regex' => 'عنوان إنستاباي لازم يكون بالشكل name@bank.',
            'details.prohibited' => 'بيانات طريقة الدفع دي بتتظبط من إعدادات البوابة، مش من هنا.',
            'details.*.max' => 'الحد الأقصى 5.',
        ];
    }
}
