<?php

namespace App\Support;

use Illuminate\Http\Request;

/**
 * Who is looking at a public endpoint. Public GET routes have no auth middleware, but an admin
 * screen still sends its Sanctum token — staff then get the full record, visitors a safe subset.
 */
class Viewer
{
    /** Roles that only ever see the public view. */
    private const PUBLIC_ROLES = ['donor'];

    public static function isStaff(Request $request): bool
    {
        // Asked once per request, however many records a response embeds.
        if ($request->attributes->has('viewer.is_staff')) {
            return $request->attributes->get('viewer.is_staff');
        }

        $user = $request->user('sanctum');
        $staff = $user ? $user->roles()->whereNotIn('slug', self::PUBLIC_ROLES)->exists() : false;
        $request->attributes->set('viewer.is_staff', $staff);

        return $staff;
    }

    /** Group beneficiaries (villages, families, students…) are not a person's name: shown as written. */
    private const GROUP_WORDS = ['أهالي', 'أسر', 'أسرة', 'طلاب', 'مشروع', 'مجموعة', 'قرية', 'قرى', 'مسجد', 'مدرسة'];

    /**
     * "محمد أحمد خليل" -> "محمد أ. خ." (same style as the site's static cases).
     * Text in brackets (age, notes) and digits are dropped; group names are kept.
     */
    public static function maskName(?string $name): ?string
    {
        $clean = trim(preg_replace(['/\([^)]*\)/u', '/[0-9٠-٩]+/u', '/\s+/u'], ['', '', ' '], (string) $name));
        $parts = preg_split('/\s+/u', $clean, -1, PREG_SPLIT_NO_EMPTY);

        if (!$parts) {
            return null;
        }

        if (in_array($parts[0], self::GROUP_WORDS, true)) {
            return $clean;
        }

        // "الشاب محمود" / "الحاج سعيد": keep the title word and the first name.
        $titles = ['الشاب', 'الشابة', 'الطفل', 'الطفلة', 'الحاج', 'الحاجة', 'السيدة', 'الأم', 'الأب', 'أم', 'أبو'];
        $head = array_shift($parts);
        if (in_array($head, $titles, true) && $parts) {
            $head .= ' ' . array_shift($parts);
        }

        $initials = array_map(fn ($p) => mb_substr($p, 0, 1) . '.', array_slice($parts, 0, 2));

        return trim($head . ' ' . implode(' ', $initials));
    }
}
