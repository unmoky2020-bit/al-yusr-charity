<?php

namespace App\Support;

use App\Models\Donor;
use App\Models\User;

/**
 * Finds or creates the donor of a new donation from what the donor typed (and the signed-in user).
 *
 * - Signed-in user: matched by the account email.
 * - Guest: matched by email when a real one is given, otherwise by phone.
 * - An existing donor is never renamed or re-phoned by a donation request (anyone can type a phone):
 *   only missing fields are filled. What was typed for a donation is kept on the donation itself
 *   (donations.donor_name / donor_phone — see snapshot()).
 * - No name typed: the donation is shown as «فاعل خير», and the phone identifies the donor.
 *
 * A guest who types a member's email gets a separate donor record (the member's is never changed).
 * A client can never choose a donor id: that would let anyone attach donations to another account.
 */
final class DonorResolver
{
    public const ANONYMOUS_NAME = 'فاعل خير';

    /** Old frontends sent these when a field was left empty; they are not real contact data. */
    private const PLACEHOLDER_EMAILS = ['donor@elyusr.org'];
    private const PLACEHOLDER_PHONES = ['01000000000'];
    private const PLACEHOLDER_NAMES = ['متبرع فاعل خير', 'فاعل خير', 'anonymous', 'anonymous donor'];

    public static function resolve(?User $user, ?string $name, ?string $email, ?string $phone, ?string $address = null): Donor
    {
        $name = self::cleanName($name);
        $email = self::cleanEmail($email);
        $phone = self::cleanPhone($phone);

        if ($user) {
            $email = self::cleanEmail($user->email) ?? $email;
            $name ??= self::cleanName($user->name);
            $phone ??= self::cleanPhone($user->phone ?? null);
        }

        // A guest typing a member's email must not rename or take over that member's donor record.
        $guestUsesMemberEmail = ! $user && $email && User::query()->where('email', $email)->exists();

        $donor = null;
        if ($email && ! $guestUsesMemberEmail) {
            $donor = Donor::query()->where('email', $email)->latest('id')->first();
        }
        if (! $donor && $phone && ! $email) {
            $donor = Donor::query()->where('phone', $phone)->whereNull('email')->latest('id')->first();
        }

        if (! $donor) {
            return Donor::create([
                'name' => $name ?? self::ANONYMOUS_NAME,
                'email' => $email,
                'phone' => $phone,
                'address' => $address,
            ]);
        }

        $missing = array_filter([
            'phone' => $donor->phone ? null : $phone,
            'address' => $donor->address ? null : $address,
        ], fn ($v) => $v !== null && $v !== '');
        if ($missing) {
            $donor->forceFill($missing)->save();
        }

        return $donor;
    }

    /**
     * What to store on the donation: the name / phone typed for it (null name = «فاعل خير»).
     *
     * @return array{donor_name: ?string, donor_phone: ?string}
     */
    public static function snapshot(?string $name, ?string $phone): array
    {
        return ['donor_name' => self::cleanName($name), 'donor_phone' => self::cleanPhone($phone)];
    }

    private static function cleanName(?string $v): ?string
    {
        $v = trim(preg_replace('/\s+/u', ' ', (string) $v));
        if ($v === '' || in_array(mb_strtolower($v), self::PLACEHOLDER_NAMES, true)) {
            return null;
        }

        return mb_substr($v, 0, 255);
    }

    private static function cleanEmail(?string $v): ?string
    {
        $v = mb_strtolower(trim((string) $v));
        if ($v === '' || in_array($v, self::PLACEHOLDER_EMAILS, true) || ! filter_var($v, FILTER_VALIDATE_EMAIL)) {
            return null;
        }

        return $v;
    }

    /** Digits only, keeping a leading "+" for international numbers; Arabic-Indic digits are converted. */
    private static function cleanPhone(?string $v): ?string
    {
        $v = strtr(trim((string) $v), ['٠' => '0', '١' => '1', '٢' => '2', '٣' => '3', '٤' => '4', '٥' => '5', '٦' => '6', '٧' => '7', '٨' => '8', '٩' => '9']);
        $plus = str_starts_with($v, '+') ? '+' : '';
        $digits = preg_replace('/\D/', '', $v);
        if ($digits === '' || in_array($digits, self::PLACEHOLDER_PHONES, true)) {
            return null;
        }

        return $plus . $digits;
    }
}
