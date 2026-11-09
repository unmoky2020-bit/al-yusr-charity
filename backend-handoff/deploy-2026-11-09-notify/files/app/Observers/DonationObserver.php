<?php

namespace App\Observers;

use App\Models\Donation;
use App\Models\Impact\CaseFollower;
use App\Notifications\DonationPaidNotification;
use App\Notifications\DonorDonationFailedNotification;
use App\Notifications\DonorDonationPaidNotification;
use App\Notifications\FollowedCaseDonationNotification;
use App\Notifications\NewDonationNotification;
use App\Support\NotifyAdmins;
use App\Support\NotifyDonor;
use App\Support\PaymentMethodKind;
use Illuminate\Contracts\Events\ShouldHandleEventsAfterCommit;

/**
 * The single place donation notifications come from, whoever changed the donation
 * (Kashier / Paymob callbacks, the dashboard, a manual confirmation):
 *   - created with a manual method (cash, bank…) → «تبرع جديد بانتظار تأكيدك»
 *   - status becomes "paid"                       → «تم استلام تبرع مدفوع»
 *                                                   + to the donor's account: «وصل تبرعك»
 *                                                   + to the case's follower: «تبرع جديد للحالة اللي بتتابعها»
 *   - status becomes failed / cancelled           → to the donor's account: «لم يكتمل تبرعك»
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
        if (! $donation->wasChanged('status')) {
            return;
        }
        if ($donation->status === 'paid') {
            $this->notifyPaid($donation);
        } elseif (in_array($donation->status, ['failed', 'cancelled', 'canceled'], true)) {
            NotifyDonor::send($donation, new DonorDonationFailedNotification(
                $donation->id,
                NotifyDonor::amount($donation),
                NotifyDonor::followUrl($donation)
            ));
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

        NotifyDonor::send($donation, new DonorDonationPaidNotification(
            $donation->id,
            NotifyDonor::amount($donation),
            NotifyDonor::targetName($donation),
            NotifyDonor::followUrl($donation)
        ));

        $this->notifyCaseFollower($donation);
    }

    /** The team member following the case hears about every paid donation to it (super admins already did). */
    private function notifyCaseFollower(Donation $donation): void
    {
        if (! $donation->case_id) {
            return;
        }
        try {
            $user = CaseFollower::with('user')->where('case_id', $donation->case_id)->first()?->user;
            if (! $user || $user->roles()->where('slug', 'super-admin')->exists()) {
                return;
            }
            $case = $donation->case;
            $user->notify(new FollowedCaseDonationNotification(
                (int) $donation->case_id,
                (string) ($case->code ?? ''),
                (string) ($case->title ?? 'الحالة'),
                NotifyDonor::amount($donation),
                (int) $donation->id
            ));
        } catch (\Throwable $e) {
            report($e);
        }
    }
}
