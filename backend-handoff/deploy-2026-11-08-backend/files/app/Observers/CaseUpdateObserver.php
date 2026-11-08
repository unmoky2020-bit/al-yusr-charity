<?php

namespace App\Observers;

use App\Models\CaseUpdate;
use App\Models\Donation;
use App\Notifications\DonorCaseUpdateNotification;
use App\Support\NotifyDonor;
use Illuminate\Contracts\Events\ShouldHandleEventsAfterCommit;
use Illuminate\Support\Str;

/**
 * A new update on a case (dashboard → الحالات → التحديثات) reaches every signed-up donor who
 * paid for that case: once per account, in their notifications and as a web push.
 */
class CaseUpdateObserver implements ShouldHandleEventsAfterCommit
{
    public function created(CaseUpdate $update): void
    {
        try {
            $case = $update->case;
            if (! $case) {
                return;
            }
            $a = $case->getAttributes();
            $notification = new DonorCaseUpdateNotification(
                (int) $case->getKey(),
                trim((string) ($a['title'] ?? '')),
                Str::limit(trim(preg_replace('/\s+/u', ' ', strip_tags((string) $update->body))), 140),
                (string) ($a['slug'] ?? $case->getKey())
            );

            $notified = [];
            Donation::with('donor')
                ->where('case_id', $case->getKey())
                ->where('status', 'paid')
                ->get()
                ->each(function (Donation $donation) use ($notification, &$notified) {
                    $user = NotifyDonor::accountFor($donation);
                    if ($user && ! isset($notified[$user->id])) {
                        $notified[$user->id] = true;
                        $user->notify($notification);
                    }
                });
        } catch (\Throwable $e) {
            report($e);
        }
    }
}
