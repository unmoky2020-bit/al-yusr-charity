<?php

namespace App\Http\Controllers;

use App\Support\PublicUrls;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;

/**
 * GET /sitemap-content.xml — every public program, axis, case, story and article, live from the
 * database (the website's own sitemap.xml lists the fixed pages). Linked from elyusr.org/robots.txt.
 * Each URL carries its Arabic (default) and English (?lang=en) alternates.
 */
class SitemapController extends Controller
{
    public const CACHE_KEY = 'sitemap-content.xml';

    public function __invoke(): Response
    {
        $xml = Cache::remember(self::CACHE_KEY, now()->addHour(), fn () => $this->build());

        return response($xml, 200, [
            'Content-Type' => 'application/xml; charset=UTF-8',
            'Cache-Control' => 'public, max-age=900',
        ]);
    }

    private function build(): string
    {
        $e = fn (string $s) => htmlspecialchars($s, ENT_XML1 | ENT_QUOTES, 'UTF-8');
        $out = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
        ];
        foreach (PublicUrls::all() as $row) {
            $ar = PublicUrls::site($row['path']);
            $en = $ar . '?lang=en';
            $out[] = '  <url>';
            $out[] = '    <loc>' . $e($ar) . '</loc>';
            $out[] = '    <lastmod>' . $row['lastmod'] . '</lastmod>';
            $out[] = '    <changefreq>' . $row['changefreq'] . '</changefreq>';
            $out[] = '    <priority>' . $row['priority'] . '</priority>';
            $out[] = '    <xhtml:link rel="alternate" hreflang="ar-EG" href="' . $e($ar) . '" />';
            $out[] = '    <xhtml:link rel="alternate" hreflang="en" href="' . $e($en) . '" />';
            $out[] = '    <xhtml:link rel="alternate" hreflang="x-default" href="' . $e($ar) . '" />';
            $out[] = '  </url>';
        }
        $out[] = '</urlset>';

        return implode("\n", $out) . "\n";
    }
}
