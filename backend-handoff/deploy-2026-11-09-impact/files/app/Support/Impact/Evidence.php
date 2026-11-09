<?php

namespace App\Support\Impact;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/** Photos attached to impact records: validation rules and storing an uploaded photo. */
final class Evidence
{
    public const MAX_PHOTOS = 6;

    /** Validation rules for a `photos` array of links (our storage or https). */
    public static function photosRules(string $field = 'photos'): array
    {
        return [
            $field => ['sometimes', 'nullable', 'array', 'max:' . self::MAX_PHOTOS],
            "{$field}.*" => ['string', 'max:2048', 'regex:#^(https://|/storage/)#'],
        ];
    }

    public static function photosMessages(string $field = 'photos'): array
    {
        return [
            "{$field}.max" => 'أقصى عدد ' . self::MAX_PHOTOS . ' صور.',
            "{$field}.*.regex" => 'رابط صورة مش صالح.',
        ];
    }

    /** Stores the request's `file` image under impact/{folder}/ on the public disk and returns its URL. */
    public static function store(Request $request, string $folder): string
    {
        $request->validate(
            ['file' => ['required', 'file', 'mimes:jpg,jpeg,png,webp', 'max:8192']],
            ['file.required' => 'اختار صورة.', 'file.mimes' => 'الصورة لازم تكون JPG أو PNG أو WebP.', 'file.max' => 'الصورة أكبر من 8 ميجا.'],
        );
        $path = $request->file('file')->store('impact/' . trim($folder, '/') . '/' . now()->format('Y-m'), 'public');

        return Storage::disk('public')->url($path);
    }
}
