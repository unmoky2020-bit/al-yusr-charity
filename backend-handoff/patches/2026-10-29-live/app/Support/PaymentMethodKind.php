<?php

namespace App\Support;

use App\Models\Donation;
use App\Models\PaymentMethod;

/**
 * Card payments (Kashier / Paymob) are confirmed by the gateway callback; every other method
 * (bank transfer, wallets, InstaPay, home pickup…) waits for the team to confirm it.
 * Decided by the payment method record (payment_methods.type), never by the free-text
 * donations.payment_method column, which older clients filled inconsistently.
 */
final class PaymentMethodKind
{
    public const GATEWAY_TYPES = ['card'];

    public static function isGateway(Donation $donation): bool
    {
        $method = $donation->relationLoaded('paymentMethod') ? $donation->paymentMethod : $donation->paymentMethod()->first();
        // No payment method on record (old rows) = manual, same as the "channel" filter.
        return $method !== null && in_array($method->type, self::GATEWAY_TYPES, true);
    }

    /** @return int[] ids of the gateway payment methods */
    public static function gatewayMethodIds(): array
    {
        static $ids = null;

        return $ids ??= PaymentMethod::query()->whereIn('type', self::GATEWAY_TYPES)->pluck('id')->map(fn ($id) => (int) $id)->all();
    }
}
