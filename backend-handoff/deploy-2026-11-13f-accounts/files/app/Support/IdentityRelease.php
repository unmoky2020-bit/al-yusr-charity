<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * A deleted (soft-deleted) account keeps its row, and with it the unique email and phone, so the
 * same person could never sign up again ("already taken"). When someone signs up or an account is
 * created with an email/phone that only a deleted account holds, that deleted account gives them up:
 * its email becomes deleted-{id}@deleted.invalid and its phone deleted-{id}; the originals are kept
 * in released_identities. Active accounts are never touched.
 */
final class IdentityRelease
{
    public static function free(?string $email, ?string $phone): int
    {
        if (! Schema::hasTable('released_identities')) {
            return 0;
        }
        $email = $email !== null ? mb_strtolower(trim($email)) : '';
        $phone = $phone !== null ? trim($phone) : '';
        if ($email === '' && $phone === '') {
            return 0;
        }
        $rows = DB::table('users')->whereNotNull('deleted_at')
            ->where(function ($q) use ($email, $phone) {
                if ($email !== '') {
                    $q->orWhereRaw('LOWER(email) = ?', [$email]);
                }
                if ($phone !== '') {
                    $q->orWhere('phone', $phone);
                }
            })->get(['id', 'email', 'phone']);

        foreach ($rows as $u) {
            DB::table('released_identities')->insert([
                'user_id' => $u->id, 'email' => $u->email, 'phone' => $u->phone, 'released_at' => now(),
            ]);
            DB::table('users')->where('id', $u->id)->update([
                'email' => 'deleted-' . $u->id . '@deleted.invalid',
                'phone' => $u->phone !== null ? 'deleted-' . $u->id : null,
            ]);
        }

        return $rows->count();
    }
}
