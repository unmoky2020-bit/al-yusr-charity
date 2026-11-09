<?php

namespace App\Observers;

use App\Models\ContentChangeRequest;
use App\Notifications\ChangeRequestReviewedNotification;
use App\Notifications\ChangeRequestSubmittedNotification;
use App\Support\ChangeRequestLabel;
use App\Support\NotifyAdmins;
use Illuminate\Contracts\Events\ShouldHandleEventsAfterCommit;

/**
 * Notifications of the editors' approval flow (EditorApprovalMiddleware, editor sign-up):
 *   - a change, or a new editor account, waits for approval → the reviewers (super admins)
 *   - it was approved / rejected                            → the editor who sent it, with the note
 * Runs after the transaction commits; a failure never breaks the request (NotifyAdmins / report()).
 */
class ContentChangeRequestObserver implements ShouldHandleEventsAfterCommit
{
    public function created(ContentChangeRequest $request): void
    {
        if ($request->status !== 'pending') {
            return;
        }

        NotifyAdmins::send(new ChangeRequestSubmittedNotification(
            (int) $request->id,
            $request->user?->name ?? 'عضو في الفريق',
            ChangeRequestLabel::describe($request),
            ChangeRequestLabel::isEditorSignUp($request)
        ));
    }

    public function updated(ContentChangeRequest $request): void
    {
        if (! $request->wasChanged('status') || ! in_array($request->status, ['approved', 'rejected'], true)) {
            return;
        }
        $editor = $request->user;
        if (! $editor || (int) $editor->id === (int) $request->reviewed_by) {
            return;
        }

        try {
            $editor->notify(new ChangeRequestReviewedNotification(
                (int) $request->id,
                $request->status === 'approved',
                ChangeRequestLabel::describe($request),
                $request->review_note,
                ChangeRequestLabel::sectionUrl($request),
                ChangeRequestLabel::isEditorSignUp($request)
            ));
        } catch (\Throwable $e) {
            report($e);
        }
    }
}
