<?php

namespace App\Support;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Tells IndexNow search engines (Bing, Yandex, Seznam, Naver…) that public URLs changed, so new
 * dashboard content is crawled within minutes instead of waiting for the next sitemap read.
 * Never throws: indexing must not break saving content.
 */
final class IndexNow
{
    private const ENDPOINT = 'https://api.indexnow.org/indexnow';

    /** @param string[] $paths site paths ("/programs/zakat") */
    public static function submit(array $paths): void
    {
        $key = config('seo.indexnow_key');
        $paths = array_values(array_unique(array_filter($paths)));
        if (! $key || ! $paths) {
            return;
        }

        try {
            $res = Http::timeout(5)->acceptJson()->post(self::ENDPOINT, [
                'host' => parse_url(config('seo.site_url'), PHP_URL_HOST),
                'key' => $key,
                'keyLocation' => PublicUrls::site("/{$key}.txt"),
                'urlList' => array_map(fn (string $p) => PublicUrls::site($p), $paths),
            ]);
            if ($res->failed()) {
                Log::warning('IndexNow rejected', ['status' => $res->status(), 'paths' => $paths]);
            }
        } catch (\Throwable $e) {
            Log::warning('IndexNow unreachable: ' . $e->getMessage());
        }
    }
}
