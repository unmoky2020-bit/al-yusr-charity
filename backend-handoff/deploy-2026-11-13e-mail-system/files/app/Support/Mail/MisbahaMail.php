<?php

namespace App\Support\Mail;

use Illuminate\Support\Facades\DB;

/**
 * Emails for people who follow a shared misbaha:
 *  - goal reached: once, when total_count reaches target_total;
 *  - weekly: every Friday (from 9 am Cairo), the week's count + a dua + ongoing-charity cards.
 * due() is cheap and runs every minute (scheduler) and after web requests.
 */
final class MisbahaMail
{
    public static function unsubscribeUrl(string $token): string
    {
        return MailRenderer::site() . '/misbaha/unsubscribe?token=' . $token;
    }

    public static function oneClickUrl(string $token): string
    {
        return MailRenderer::api() . '/misbaha-subscriptions/unsubscribe/' . $token;
    }

    public static function due(): void
    {
        try {
            if (MailSettings::on('misbaha_goal')) {
                self::goals();
            }
            if (MailSettings::on('misbaha_weekly')) {
                self::weekly();
            }
        } catch (\Throwable $e) {
            report($e);
        }
    }

    private static function goals(): void
    {
        $subs = DB::table('misbaha_mail_subscriptions as s')
            ->join('misbaha_rooms as r', 'r.id', '=', 's.misbaha_room_id')
            ->whereNull('s.unsubscribed_at')->whereNotNull('s.confirmed_at')->where('s.want_goal', true)->whereNull('s.goal_notified_at')
            ->whereNotNull('r.target_total')->whereColumn('r.total_count', '>=', 'r.target_total')
            ->select('s.*')->limit(200)->get();
        foreach ($subs as $s) {
            $room = DB::table('misbaha_rooms')->find($s->misbaha_room_id);
            [$subject, $data] = MailTemplates::misbahaGoal($room, self::unsubscribeUrl($s->token));
            $data['one_click'] = self::oneClickUrl($s->token);
            MailOutbox::queue($s->email, $subject, $data, 'misbaha_goal', 3, "misbaha_goal:{$s->id}:{$room->target_total}", ['ref_type' => 'misbaha_room', 'ref_id' => $room->id]);
            DB::table('misbaha_mail_subscriptions')->where('id', $s->id)->update(['goal_notified_at' => now(), 'updated_at' => now()]);
        }
    }

    private static function weekly(): void
    {
        $cairo = now('Africa/Cairo');
        if (! $cairo->isFriday() || $cairo->hour < 9) {
            return;
        }
        $week = $cairo->format('o-W');
        $subs = DB::table('misbaha_mail_subscriptions')->whereNull('unsubscribed_at')->whereNotNull('confirmed_at')->where('want_weekly', true)
            ->where('created_at', '<', now()->subDays(2))
            ->where(fn ($q) => $q->whereNull('last_weekly_at')->orWhere('last_weekly_at', '<', now()->subDays(6)))
            ->limit(300)->get();
        foreach ($subs as $s) {
            $room = DB::table('misbaha_rooms')->find($s->misbaha_room_id);
            if (! $room || $room->is_hidden) {
                continue;
            }
            $before = $s->last_weekly_total ?? null;
            $delta = $before === null ? (int) $room->total_count : max(0, (int) $room->total_count - (int) $before);
            DB::table('misbaha_mail_subscriptions')->where('id', $s->id)->update(['last_weekly_at' => now(), 'last_weekly_total' => (int) $room->total_count, 'updated_at' => now()]);
            if ($delta === 0 && $before !== null) {
                continue; // quiet week: no email
            }
            [$subject, $data] = MailTemplates::misbahaWeekly($room, $delta, self::unsubscribeUrl($s->token));
            $data['one_click'] = self::oneClickUrl($s->token);
            MailOutbox::queue($s->email, $subject, $data, 'misbaha_weekly', 7, "misbaha_weekly:{$s->id}:{$week}", ['ref_type' => 'misbaha_room', 'ref_id' => $room->id]);
        }
    }
}
