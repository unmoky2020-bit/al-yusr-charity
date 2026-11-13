<?php

namespace App\Providers;

use App\Models\Donation;
use App\Support\DeliverySteps;
use App\Support\Mail\MailOutbox;
use App\Support\Mail\MailSettings;
use App\Support\Mail\MailTemplates;
use App\Support\Mail\MisbahaMail;
use Illuminate\Notifications\Events\NotificationSent;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;

/**
 * Wires the automatic emails without touching the existing controllers:
 *  - welcome / case update: when the in-app notification is saved for an account, the email is queued;
 *  - receipt / failed / delivery steps: from the donation itself, so guest donors with an email get them too;
 *  - volunteer: when a volunteer request is created;
 *  - after every web response, a small pump sends what is due (mail keeps moving even without cron).
 * Every hook is wrapped: an email problem never breaks the request that triggered it.
 */
class MailSystemServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Event::listen(NotificationSent::class, function (NotificationSent $e) {
            if ($e->channel !== 'database' || empty($e->notifiable->email)) {
                return;
            }
            self::guard(function () use ($e) {
                $n = $e->notification;
                $user = $e->notifiable;
                if ($n instanceof \App\Notifications\WelcomeNotification && MailSettings::on('welcome')) {
                    [$s, $d] = MailTemplates::welcome((string) ($n->userName ?: $user->name));
                    MailOutbox::queue($user->email, $s, $d, 'welcome', 3, 'welcome:' . $user->id, ['ref_type' => 'user', 'ref_id' => $user->id]);
                } elseif ($n instanceof \App\Notifications\DonorCaseUpdateNotification && MailSettings::on('case_update')) {
                    [$s, $d] = MailTemplates::caseUpdate((string) $user->name, (string) $n->caseTitle, (string) $n->excerpt, (string) $n->caseRef);
                    MailOutbox::queue($user->email, $s, $d, 'case_update', 4, 'case_update:' . $n->caseId . ':' . $user->id . ':' . md5($n->excerpt), ['ref_type' => 'case', 'ref_id' => $n->caseId]);
                }
            });
        });

        Donation::updated(function (Donation $donation) {
            self::guard(fn () => self::donationChanged($donation));
        });

        if (class_exists(\App\Models\Volunteer::class)) {
            \App\Models\Volunteer::created(function ($v) {
                self::guard(function () use ($v) {
                    if (MailSettings::on('volunteer') && ! empty($v->email)) {
                        [$s, $d] = MailTemplates::volunteer((string) $v->name);
                        MailOutbox::queue($v->email, $s, $d, 'volunteer', 3, 'volunteer:' . $v->id, ['ref_type' => 'volunteer', 'ref_id' => $v->id]);
                    }
                });
            });
        }

        // Sign-up with the email/phone of a deleted account: the deleted account gives them up first.
        $this->app->resolving(\App\Http\Requests\Auth\RegisterRequest::class, function () {
            self::guard(fn () => \App\Support\IdentityRelease::free(request()->input('email'), request()->input('phone')));
        });
        \App\Models\User::creating(function ($user) {
            self::guard(fn () => \App\Support\IdentityRelease::free($user->email, $user->phone));
        });

        if (! $this->app->runningInConsole()) {
            $this->app->terminating(function () {
                // When the scheduler runs (cron), it sends everything every minute: web requests stay light.
                try {
                    $cron = \Illuminate\Support\Facades\Cache::get('mail-cron-last');
                    if ($cron && now()->diffInMinutes(\Carbon\Carbon::parse($cron), true) <= 3) {
                        return;
                    }
                } catch (\Throwable $e) {
                    return;
                }
                // No cron: a confirmation or receipt queued by this very request goes out right after the response.
                if (MailOutbox::$urgent) {
                    MailOutbox::$urgent = false;
                    self::guard(fn () => MailOutbox::pump(3));
                }
                // At most once a minute (not on every request): keeps the database calm on shared hosting.
                try {
                    if (! \Illuminate\Support\Facades\Cache::add('mail-hooks-minute', 1, 60)) {
                        return;
                    }
                } catch (\Throwable $e) {
                    return;
                }
                self::guard(fn () => \App\Http\Controllers\Api\V1\Newsletter\NewsletterCampaignController::dispatchDue());
                MisbahaMail::due();
                MailOutbox::tickAfterRequest();
            });
        }
    }

    private static function donationChanged(Donation $donation): void
    {
        $statusChanged = $donation->wasChanged('status');
        if ($statusChanged && $donation->status === 'paid' && MailSettings::on('receipt')) {
            if ($to = MailTemplates::recipientOf($donation)) {
                [$s, $d] = MailTemplates::receipt($donation, $to['name']);
                MailOutbox::queue($to['email'], $s, $d, 'receipt', 2, 'receipt:' . $donation->id, ['ref_type' => 'donation', 'ref_id' => $donation->id]);
            }
        } elseif ($statusChanged && in_array($donation->status, ['failed', 'cancelled', 'canceled'], true) && MailSettings::on('failed')) {
            if ($to = MailTemplates::recipientOf($donation)) {
                [$s, $d] = MailTemplates::failed($donation, $to['name']);
                MailOutbox::queue($to['email'], $s, $d, 'failed', 4, 'failed:' . $donation->id, ['ref_type' => 'donation', 'ref_id' => $donation->id]);
            }
        }

        if ($donation->wasChanged('tracking_data') && $donation->status === 'paid' && MailSettings::on('delivery')) {
            // The team can save a step without telling the donor (notify=false on the delivery form).
            $req = app()->bound('request') ? request() : null;
            if ($req && $req->has('notify') && ! $req->boolean('notify')) {
                return;
            }
            $trail = DeliverySteps::of($donation);
            $history = $trail['history'] ?? [];
            $last = $history ? end($history) : null;
            if (! $last || empty($last['stage'])) {
                return;
            }
            // Only a step added just now (undo/edits of old lines send nothing).
            if (! empty($last['at']) && \Carbon\Carbon::parse($last['at'])->lt(now()->subMinutes(10))) {
                return;
            }
            if ($to = MailTemplates::recipientOf($donation)) {
                [$s, $d] = MailTemplates::delivery($donation, $to['name'], (string) $last['stage'], $last['note'] ?? null, (array) ($last['photos'] ?? []));
                MailOutbox::queue($to['email'], $s, $d, 'delivery', 3, 'delivery:' . $donation->id . ':' . $last['stage'] . ':' . count($history), ['ref_type' => 'donation', 'ref_id' => $donation->id]);
            }
        }
    }

    private static function guard(callable $fn): void
    {
        try {
            $fn();
        } catch (\Throwable $e) {
            report($e);
        }
    }
}
