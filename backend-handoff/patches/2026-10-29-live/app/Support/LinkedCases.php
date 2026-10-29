<?php

namespace App\Support;

use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;

/**
 * Cases embedded in a program / project / campaign response. Same visitor rules as /cases:
 * only approved / completed cases, masked beneficiary name, no city. Staff see everything.
 */
class LinkedCases
{
    public const PUBLIC_STATUSES = ['approved', 'completed'];

    public static function visible(Collection $cases, Request $request): Collection
    {
        return Viewer::isStaff($request)
            ? $cases->values()
            : $cases->whereIn('status', self::PUBLIC_STATUSES)->values();
    }

    public static function name(object $case, Request $request): ?string
    {
        return Viewer::isStaff($request) ? $case->beneficiary_name : Viewer::maskName($case->beneficiary_name);
    }

    public static function city(object $case, Request $request): ?string
    {
        return Viewer::isStaff($request) ? $case->city : null;
    }

    /** A stored path becomes a public URL; a full URL (media library / external) is kept. */
    public static function cover(?string $value): ?string
    {
        if (!$value) {
            return null;
        }

        return preg_match('#^https?://#', $value) ? $value : Storage::disk('public')->url($value);
    }
}
