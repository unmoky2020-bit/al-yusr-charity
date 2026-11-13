<?php

namespace App\Http\Controllers\Api\V1\Mail;

use App\Http\Controllers\Controller;
use App\Support\Mail\MailOutbox;
use App\Support\Mail\MailRenderer;
use App\Support\Mail\MailTemplates;
use App\Support\Mail\MisbahaMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Public mail endpoints (no login):
 *   GET  /mail/o/{token}.gif                       open pixel
 *   GET  /mail/c/{token}?u=&s=                     click counter → redirect (signed: no open redirect)
 *   POST /misbaha-rooms/{slug}/subscribe           {email, name?, goal?, weekly?}  follow a shared misbaha
 *   POST /misbaha-subscriptions/confirm            {token}
 *   POST /misbaha-subscriptions/unsubscribe        {token}
 *   POST /misbaha-subscriptions/unsubscribe/{token}   one-click (mail apps' "unsubscribe" button)
 *   POST /newsletter/one-click/{token}                 one-click for the newsletter
 */
class MailPublicController extends Controller
{
    public function open(string $token)
    {
        if (preg_match('/^[A-Za-z0-9]{32}$/', $token)) {
            DB::table('mail_outbox')->where('token', $token)->whereNull('opened_at')->update(['opened_at' => now()]);
        }

        return response(base64_decode('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'), 200, [
            'Content-Type' => 'image/gif', 'Cache-Control' => 'no-store, max-age=0',
        ]);
    }

    public function click(Request $request, string $token)
    {
        $url = base64_decode(strtr((string) $request->query('u', ''), '-_', '+/'), true) ?: '';
        $ok = $url !== '' && hash_equals(MailRenderer::sign($url), (string) $request->query('s', '')) && preg_match('#^https?://#i', $url);
        if (! $ok) {
            return redirect()->away(MailRenderer::site());
        }
        if (preg_match('/^[A-Za-z0-9]{32}$/', $token)) {
            DB::table('mail_outbox')->where('token', $token)->whereNull('clicked_at')->update(['clicked_at' => now(), 'opened_at' => DB::raw('COALESCE(opened_at, NOW())')]);
        }
        // Visits from emails show up in analytics as coming from the email.
        if (str_starts_with($url, MailRenderer::site()) && ! str_contains($url, 'utm_')) {
            $kind = DB::table('mail_outbox')->where('token', $token)->value('kind') ?: 'email';
            $url .= (str_contains($url, '?') ? '&' : '?') . 'utm_source=email&utm_medium=email&utm_campaign=' . rawurlencode($kind);
        }

        return redirect()->away($url, 302);
    }

    public function misbahaSubscribe(Request $request, string $slug)
    {
        $room = DB::table('misbaha_rooms')->where('slug', $slug)->first();
        abort_if(! $room || $room->is_hidden, 404, 'السبحة دي مش موجودة.');
        $data = $request->validate([
            'email' => ['required', 'email:rfc', 'max:190'],
            'name' => ['nullable', 'string', 'max:120'],
            'goal' => ['sometimes', 'boolean'],
            'weekly' => ['sometimes', 'boolean'],
        ], ['email.*' => 'اكتب بريد إلكتروني صحيح.']);
        $email = Str::lower(trim($data['email']));
        $user = $request->user('sanctum');
        $trusted = $user && Str::lower((string) $user->email) === $email && ! empty($user->email_verified_at);

        $row = DB::table('misbaha_mail_subscriptions')->where('misbaha_room_id', $room->id)->where('email', $email)->first();
        $values = [
            'name' => $data['name'] ?? ($row->name ?? null),
            'want_goal' => (bool) ($data['goal'] ?? true),
            'want_weekly' => (bool) ($data['weekly'] ?? true),
            'unsubscribed_at' => null,
            'updated_at' => now(),
        ];
        if ($row) {
            DB::table('misbaha_mail_subscriptions')->where('id', $row->id)->update($values + ($trusted && ! $row->confirmed_at ? ['confirmed_at' => now()] : []));
            $token = $row->token;
            $confirmed = $row->confirmed_at || $trusted;
        } else {
            $token = Str::random(64);
            DB::table('misbaha_mail_subscriptions')->insert($values + [
                'misbaha_room_id' => $room->id, 'email' => $email, 'token' => $token,
                'confirmed_at' => $trusted ? now() : null, 'created_at' => now(),
            ]);
            $confirmed = $trusted;
        }
        if (! $confirmed) {
            [$subject, $mail] = MailTemplates::misbahaConfirm($room, MailRenderer::site() . '/misbaha/confirm?token=' . $token, MisbahaMail::unsubscribeUrl($token));
            MailOutbox::queue($email, $subject, $mail, 'misbaha_confirm', 2, 'misbaha_confirm:' . $room->id . ':' . md5($email) . ':' . now()->format('YmdH'), ['ref_type' => 'misbaha_room', 'ref_id' => $room->id]);
        }

        return response()->json([
            'message' => $confirmed ? 'تمام، هنبعتلك لما نوصل للهدف وكل جمعة.' : 'بعتنالك رسالة تأكيد. افتحها واضغط «تأكيد المتابعة».',
            'data' => ['confirmed' => (bool) $confirmed],
        ], 201);
    }

    public function misbahaConfirm(Request $request)
    {
        $row = $this->subscription($request);
        if (! $row->confirmed_at || $row->unsubscribed_at) {
            DB::table('misbaha_mail_subscriptions')->where('id', $row->id)->update(['confirmed_at' => now(), 'unsubscribed_at' => null, 'updated_at' => now()]);
        }
        $room = DB::table('misbaha_rooms')->find($row->misbaha_room_id);

        return response()->json(['message' => 'تم تأكيد المتابعة', 'data' => ['room' => $room ? ['slug' => $room->slug, 'name' => $room->name] : null]]);
    }

    public function misbahaUnsubscribe(Request $request, ?string $token = null)
    {
        $row = $this->subscription($request, $token);
        DB::table('misbaha_mail_subscriptions')->where('id', $row->id)->update(['unsubscribed_at' => now(), 'updated_at' => now()]);
        $room = DB::table('misbaha_rooms')->find($row->misbaha_room_id);

        return response()->json(['message' => 'تم إلغاء المتابعة', 'data' => ['room' => $room ? ['slug' => $room->slug, 'name' => $room->name] : null]]);
    }

    public function newsletterOneClick(string $token)
    {
        abort_unless(preg_match('/^[A-Za-z0-9]{64}$/', $token), 404);
        DB::table('newsletter_subscribers')->where('confirmation_token', $token)->where('status', '!=', 'unsubscribed')
            ->update(['status' => 'unsubscribed', 'unsubscribed_at' => now(), 'updated_at' => now()]);

        return response()->json(['message' => 'تم إلغاء اشتراكك']);
    }

    private function subscription(Request $request, ?string $token = null): object
    {
        $token = $token ?? (string) $request->input('token', '');
        abort_unless(preg_match('/^[A-Za-z0-9]{64}$/', $token), 422, 'الرابط ده مش صحيح.');
        $row = DB::table('misbaha_mail_subscriptions')->where('token', $token)->first();
        abort_unless($row, 404, 'الرابط ده مش صحيح أو قديم.');

        return $row;
    }
}
