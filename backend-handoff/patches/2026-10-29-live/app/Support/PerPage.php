<?php

namespace App\Support;

use Illuminate\Http\Request;

/**
 * Page size for list endpoints: the client's ?per_page (1–100), else the endpoint's default.
 * Without it a list silently returned only its first page (e.g. 10 of 16 programs).
 */
final class PerPage
{
    public const MAX = 100;

    public static function from(?Request $request, int $default): int
    {
        $value = (int) ($request ?? request())->input('per_page', $default);

        return max(1, min(self::MAX, $value ?: $default));
    }
}
