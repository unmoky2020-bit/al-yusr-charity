<?php
/**
 * Live sitemap for elyusr.org — /sitemap.xml is rewritten here (.htaccess).
 *
 * Starts from the sitemap built with the site (sitemap-base.xml: static pages, geo / city pages,
 * built-in articles), then, from the API:
 *   + every published article (/blog-seo, /content?type=article), story, approved case and published program
 *     that isn't listed yet — so something published in the dashboard is in the sitemap within 30 minutes,
 *     with no rebuild;
 *   − articles the team unpublished or archived (also built-in ones).
 * Cached 30 minutes. If the API is down the built sitemap is served as is.
 */
declare(strict_types=1);

const SITE = 'https://elyusr.org';
const API = 'https://api.elyusr.org/api/v1';
const TTL = 1800;

header('Content-Type: application/xml; charset=utf-8');
header('X-Robots-Tag: noindex');

$base = __DIR__ . '/sitemap-base.xml';
if (!is_file($base)) {
    $base = __DIR__ . '/sitemap.xml';
}
$cache = sys_get_temp_dir() . '/elyusr-sitemap-' . md5((string) @filemtime($base)) . '.xml';
if (is_file($cache) && time() - filemtime($cache) < TTL) {
    readfile($cache);
    exit;
}

/** All rows of a public list endpoint (paginated), [] on any failure. */
function api_list(string $path, array $params = []): array
{
    $out = [];
    for ($page = 1; $page <= 20; $page++) {
        $q = http_build_query($params + ['per_page' => 100, 'page' => $page]);
        $ctx = stream_context_create(['http' => ['timeout' => 6, 'header' => "Accept: application/json\r\n"]]);
        $raw = @file_get_contents(API . $path . (str_contains($path, '?') ? '&' : '?') . $q, false, $ctx);
        if ($raw === false) {
            break;
        }
        $json = json_decode($raw, true);
        $rows = is_array($json['data'] ?? null) ? $json['data'] : (array_is_list($json ?? []) ? $json : []);
        $out = array_merge($out, $rows);
        $last = (int) ($json['meta']['last_page'] ?? $json['last_page'] ?? 1);
        if ($page >= $last || !$rows) {
            break;
        }
    }
    return $out;
}

$day = fn ($v) => substr((string) ($v ?: date('Y-m-d')), 0, 10);
$esc = fn (string $s) => htmlspecialchars($s, ENT_XML1 | ENT_QUOTES, 'UTF-8');

// 1. The built sitemap.
$xml = (string) @file_get_contents($base);
preg_match_all('#<url>.*?</url>#s', $xml, $m);
$urls = [];
foreach ($m[0] as $block) {
    if (preg_match('#<loc>(.*?)</loc>#', $block, $l)) {
        $urls[html_entity_decode($l[1])] = $block;
    }
}

$add = function (string $path, string $lastmod, string $freq, string $prio) use (&$urls, $esc) {
    $loc = SITE . $path;
    if (isset($urls[$loc])) {
        return;
    }
    $urls[$loc] = "<url><loc>{$esc($loc)}</loc><lastmod>{$lastmod}</lastmod><changefreq>{$freq}</changefreq><priority>{$prio}</priority></url>";
};

// 2. Articles: published ones in, unpublished / archived ones out.
$hide = [];
foreach (api_list('/content', ['type' => 'article']) as $a) {
    $slug = (string) ($a['slug'] ?? '');
    if ($slug === '') continue;
    if (($a['status'] ?? 'published') === 'published') {
        $add('/blog/' . rawurlencode($slug), $day($a['updated_at'] ?? null), 'weekly', '0.75');
    } else {
        $hide[$slug] = true;
    }
}
foreach (api_list('/blog-seo') as $a) {
    $slug = (string) ($a['slug'] ?? '');
    if ($slug !== '' && ($a['workflow_status'] ?? '') === 'published') {
        unset($hide[$slug]);
        $add('/blog/' . rawurlencode($slug), $day($a['updated_at'] ?? null), 'weekly', '0.75');
    }
}
foreach (array_keys($hide) as $slug) {
    unset($urls[SITE . '/blog/' . rawurlencode($slug)], $urls[SITE . '/blog/' . $slug], $urls[SITE . '/en/blog/' . $slug]);
}

// 3. Stories, cases, programs.
foreach (api_list('/stories', ['status' => 'published']) as $s) {
    if (!empty($s['slug']) && ($s['status'] ?? '') === 'published') {
        $add('/stories/' . rawurlencode($s['slug']), $day($s['updated_at'] ?? null), 'monthly', '0.6');
    }
}
foreach (api_list('/cases') as $c) {
    $code = (string) ($c['code'] ?? $c['ref_code'] ?? '');
    if (preg_match('/^[A-Z]{2,8}-[A-Z0-9]{3,}$/i', $code) && in_array(strtolower((string) ($c['status'] ?? '')), ['approved', 'completed'], true)) {
        $add('/cases/' . rawurlencode($code), $day($c['updated_at'] ?? null), 'weekly', '0.75');
    }
}
foreach (api_list('/programs') as $p) {
    $slug = (string) ($p['slug'] ?? '');
    if (preg_match('/^[a-z0-9-]+$/', $slug) && ($p['status'] ?? 'published') === 'published' && ($p['is_active'] ?? true) !== false && empty($p['hide_from_audience'])) {
        $add('/programs/' . $slug, $day($p['updated_at'] ?? null), 'weekly', '0.9');
    }
}

$out = '<?xml version="1.0" encoding="UTF-8"?>' . "\n" . '<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>' . "\n"
    . '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">' . "\n"
    . implode("\n", array_values($urls)) . "\n</urlset>\n";
@file_put_contents($cache, $out);
echo $out;
