<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Payment methods get the structured details the donation form reads (see App\Support\PaymentDetailsRules):
 *   bank-transfer  → CIB account 100043605733 (the seed said «بنك مصر» with an empty account)
 *   vodafone-cash  → numbers [01097000137], hidden for now (owner's request, 2026-10-29)
 *   instapay       → addresses [elyusr@cib], hidden for now (owner's request, 2026-10-29)
 *   orange-cash    → hidden: its seed number 01234567890 is not a real wallet
 * The old flat keys (wallet_number, ipa, iban, account_number, bank_name) are removed.
 */
return new class extends Migration
{
    public function up(): void
    {
        $set = function (string $slug, array $values) {
            if (isset($values['details'])) {
                $values['details'] = json_encode($values['details'], JSON_UNESCAPED_UNICODE);
            }
            DB::table('payment_methods')->where('slug', $slug)->update($values + ['updated_at' => now()]);
        };

        $set('bank-transfer', [
            'provider_ar' => 'البنك التجاري الدولي CIB',
            'provider_en' => 'CIB',
            'details' => ['accounts' => [[
                'bank_code' => 'cib',
                'bank_name' => 'البنك التجاري الدولي (CIB)',
                'account_name' => 'مؤسسة اليسر الخيرية',
                'account_number' => '100043605733',
            ]]],
        ]);
        $set('vodafone-cash', ['details' => ['numbers' => [['number' => '01097000137']]], 'is_active' => false]);
        $set('instapay', ['details' => ['addresses' => [['ipa' => 'elyusr@cib']]], 'is_active' => false]);
        $set('orange-cash', ['details' => ['numbers' => []], 'is_active' => false]);
    }

    public function down(): void
    {
        // Data migration: the previous values were placeholders (empty account, fake wallet), nothing to restore.
    }
};
