<?php

namespace App\Observers;

use App\Models\Donation;
use App\Notifications\DonationPaidNotification;
use App\Notifications\NewDonationNotification;
use App\Support\NotifyAdmins;
use App\Support\PaymentMethodKind;
use Illuminate\Contracts\Events\ShouldHandleEventsAfterCommit;

/**
 * The single place donation notifications come from, whoever changed the donation
 * (Kashier / Paymob callbacks, the dashboard, a manual confirmation):
 *   - created with a manual method (cash, bank…) → «تبرع جديد بانتظار تأكيدك»
 *   - status becomes "paid"                       → «تم استلام تبرع مدفوع»
 * Online card payments are confirmed by the gateway, so their pending row (the donor is still
 * on the payment page, or left it) does not notify anyone.
 * Runs after the database transaction commits, so a rolled-back callback never notifies.
 */
class DonationObserver implements ShouldHandleEventsAfterCommit
{
    public function created(Donation $donation): void
    {
        if ($donation->status === 'paid') {
            $this->notifyPaid($donation);

            return;
        }

        if (! PaymentMethodKind::isGateway($donation)) {
            NotifyAdmins::send(new NewDonationNotification(
                $donation->id,
                $donation->donor?->name ?? 'متبرع',
                (string) $donation->amount
            ));
        }
    }

    public function updated(Donation $donation): void
    {
        if ($donation->wasChanged('status') && $donation->status === 'paid') {
            $this->notifyPaid($donation);
        }
    }

    private function notifyPaid(Donation $donation): void
    {
        NotifyAdmins::send(new DonationPaidNotification(
            $donation->id,
            $donation->donor?->name ?? 'متبرع',
            (string) $donation->amount,
            (string) $donation->payment_method
        ));
    }
}
