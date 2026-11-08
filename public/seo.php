<?php
/**
 * SPA entry with real per-page SEO (served for every route that is not a file — see .htaccess).
 *
 * Social apps (WhatsApp, Facebook, X, Telegram) and most AI crawlers do not run JavaScript, so a
 * plain React index.html shows them the homepage title and image for every link. This script
 * serves the same index.html but first puts the page's own title, description, image, canonical,
 * hreflang and JSON-LD in <head>, and a short readable summary inside #root (React replaces it as
 * soon as it starts). Data: GET {API}/seo/page?path=… (cases, programs, axes, stories, articles)
 * or seo-static.json (fixed pages). Any failure → the untouched index.html, never an error page.
 */

declare(strict_types=1);

const SITE = 'https://elyusr.org';
const API = 'https://api.elyusr.org/api/v1/seo/page';
const CACHE_TTL = 300; // seconds; the API caches 5 minutes too
const DYNAMIC = '#^/(cases|programs|axes|stories|blog)/[^/]+$#';
const ROOMS_API = 'https://api.elyusr.org/api/v1/misbaha-rooms/';
const MISBAHA_ROOM = '#^/misbaha/([a-z0-9]{4,24})$#';
/*
 | Templated local pages (same text, another place name) stay reachable but out of search, except
 | the home city: src/data/seoIndexable.ts has the same rule (a test keeps the two in step).
 */
const NOINDEX_LOCAL = '#^/(?:geo/[^/]+/[^/]+|dakahlia/(?!mansoura/)[^/]+/[^/]+|qurbani/(?!mansoura$|confirm$)[^/]+)$#';
/* Account and confirmation pages never belong in search. */
const NOINDEX_PAGES = '#^/(?:login|register(?:/[a-z]+)?|forgot-password|profile|dashboard|donate/track|donation/status|qurbani/confirm)$#';
/*
 | Sections whose pages come from the API or the app (programs, articles, cases…). Any other path
 | without an entry in seo-static.json is not a page of the site (a typo, an old link): crawlers get
 | noindex instead of a copy of the homepage, which Search Console reports as a soft 404.
 */
const APP_SECTIONS = '#^/(?:programs|blog|cases|stories|axes|campaigns|services|projects|donate|qurbani|dakahlia|geo|misbaha|seasons|volunteer)/#';

$index = @file_get_contents(__DIR__ . '/index.html');
if ($index === false) {
    http_response_code(503);
    exit('Service temporarily unavailable');
}

try {
    $path = '/' . trim(rawurldecode((string) parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH)), '/');
    $lang = (($_GET['lang'] ?? '') === 'en') ? 'en' : 'ar';
    $page = null;
    $status = 200;

    if (preg_match(MISBAHA_ROOM, $path, $m)) {
        [$page, $status] = misbaha_room_page($m[1], $lang);
    } elseif (preg_match(DYNAMIC, $path)) {
        [$page, $status] = fetch_page($path, $lang);
    } else {
        $page = static_page($path, $lang);
    }
    $unknown = $page === null && $path !== '/' && ! preg_match(APP_SECTIONS, $path);
    if ($unknown || preg_match(NOINDEX_LOCAL, $path) || preg_match(NOINDEX_PAGES, $path)) {
        $page = ['robots' => 'noindex,follow'] + ($page ?? []);
    }

    http_response_code($status === 404 ? 404 : 200);
    header('Content-Type: text/html; charset=UTF-8');
    header('Cache-Control: no-cache');
    // Every page gets its canonical and the crawlable links, even one without its own entry yet.
    echo render($index, $page ?? [], $path, $lang);
} catch (Throwable $e) {
    header('Content-Type: text/html; charset=UTF-8');
    echo $index;
}

/** @return array{0: ?array, 1: int} */
function fetch_page(string $path, string $lang): array
{
    $dir = sys_get_temp_dir() . '/elyusr-seo';
    $file = $dir . '/' . sha1($lang . $path) . '.json';
    if (is_file($file) && time() - filemtime($file) < CACHE_TTL) {
        $cached = json_decode((string) file_get_contents($file), true);
        if (is_array($cached)) {
            return [$cached['page'] ?? null, (int) ($cached['status'] ?? 200)];
        }
    }

    $ch = curl_init(API . '?' . http_build_query(['path' => $path, 'lang' => $lang]));
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 2,
        CURLOPT_TIMEOUT => 3,
        CURLOPT_HTTPHEADER => ['Accept: application/json'],
    ]);
    $body = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($code === 200) {
        $page = json_decode((string) $body, true)['data'] ?? null;
        $result = [is_array($page) ? $page : null, 200];
    } elseif ($code === 404) {
        $result = [null, 404]; // unknown / hidden record: real 404 for crawlers, React shows its own message
    } else {
        return [null, 200]; // API down: plain SPA, not cached
    }

    if (! is_dir($dir)) {
        @mkdir($dir, 0700, true);
    }
    @file_put_contents($file, json_encode(['page' => $result[0], 'status' => $result[1]]), LOCK_EX);

    return $result;
}

/**
 * Shared misbaha (/misbaha/{slug}): the link preview carries the person's name and a picture made
 * for its kind (public/og/misbaha-{kind}.jpg). The page itself stays out of search (noindex).
 * @return array{0: ?array, 1: int}
 */
function misbaha_room_page(string $slug, string $lang): array
{
    $dir = sys_get_temp_dir() . '/elyusr-seo';
    $file = $dir . '/room-' . sha1($slug) . '.json';
    $room = null;
    if (is_file($file) && time() - filemtime($file) < 120) {
        $room = json_decode((string) file_get_contents($file), true);
    } else {
        $ch = curl_init(ROOMS_API . rawurlencode($slug));
        curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_CONNECTTIMEOUT => 2, CURLOPT_TIMEOUT => 3, CURLOPT_HTTPHEADER => ['Accept: application/json']]);
        $body = curl_exec($ch);
        $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($code === 200) {
            $room = json_decode((string) $body, true)['data'] ?? null;
            if (! is_dir($dir)) {
                @mkdir($dir, 0700, true);
            }
            @file_put_contents($file, json_encode($room), LOCK_EX);
        }
    }
    $kind = in_array($room['kind'] ?? '', ['deceased', 'sick', 'group'], true) ? $room['kind'] : 'deceased';
    $image = SITE . '/og/misbaha-' . $kind . '.jpg?v=2026.11';
    if (! is_array($room) || empty($room['name'])) {
        return [['title' => 'سبحة مشتركة | مؤسسة اليسر', 'description' => 'شارك بالتسبيح والاستغفار والصلاة على النبي ﷺ، وكل ذكر بيتضاف لعدّاد واحد.', 'image' => $image, 'robots' => 'noindex,follow'], 200];
    }
    $name = trim((string) $room['name']);
    $female = ($room['gender'] ?? '') === 'f';
    if ($lang === 'en') {
        $title = $kind === 'sick' ? "For the healing of $name" : ($kind === 'group' ? $name : "For the soul of $name");
        $desc = 'Join with tasbih, istighfar and salawat — every dhikr adds to one shared count.';
    } else {
        $title = $kind === 'sick' ? "بنية شفاء $name"
            : ($kind === 'group' ? $name
            : (preg_match('/^(ال)?(مرحوم|مرحومة|فقيد|فقيدة|المغفور)/u', $name) ? "لروح $name" : 'لروح ' . ($female ? 'المرحومة ' : 'المرحوم ') . $name));
        $ask = $kind === 'deceased' ? ($female ? 'ادعولها وشاركوا بتسبيحة أو استغفار' : 'ادعوله وشاركوا بتسبيحة أو استغفار')
            : ($kind === 'sick' ? 'شاركوا بذكر ودعاء بنية الشفاء' : 'شاركونا الذكر');
        $count = (int) ($room['total_count'] ?? 0);
        $desc = $ask . '، وكل ذكر بيتضاف لعدّاد واحد' . ($count > 0 ? ' (اتقال لحد دلوقتي ' . number_format($count) . ' ذكر)' : '') . '. والدال على الخير كفاعله.';
    }

    return [['title' => ($lang === 'en' ? 'Tasbih ' : 'سبحة ') . $title, 'description' => $desc, 'image' => $image, 'robots' => 'noindex,follow'], 200];
}

function static_page(string $path, string $lang): ?array
{
    static $map = null;
    $map ??= json_decode((string) @file_get_contents(__DIR__ . '/seo-static.json'), true) ?: [];
    $entry = $map[$path][$lang] ?? $map[$path]['ar'] ?? null;

    return is_array($entry) ? $entry + ['type' => 'website'] : null;
}

/**
 * Links every crawler can follow without running JavaScript: the app builds its menus in the
 * browser, so without these a non-JS crawler (Semrush, Bing, social and AI bots) only finds the
 * page it was given. One list from seo-static.json (the fixed pages) + the main sections.
 */
function site_links(string $path, string $lang): string
{
    static $map = null;
    $map ??= json_decode((string) @file_get_contents(__DIR__ . '/seo-static.json'), true) ?: [];
    $sections = ['/' => ['الرئيسية', 'Home'], '/programs' => ['البرامج', 'Programs'], '/projects' => ['المشاريع', 'Projects'],
        '/campaigns' => ['الحملات', 'Campaigns'], '/cases' => ['الحالات', 'Cases'], '/blog' => ['المدونة', 'Blog'],
        '/donate' => ['تبرع الآن', 'Donate'], '/contact' => ['تواصل معنا', 'Contact']];
    $links = [];
    foreach ($sections as $href => [$ar, $en]) {
        $links[$href] = $lang === 'en' ? $en : $ar;
    }
    foreach ($map as $href => $entry) {
        if (! is_string($href) || isset($links[$href]) || ! str_starts_with($href, '/')) {
            continue;
        }
        $title = (string) ($entry[$lang]['title'] ?? $entry['ar']['title'] ?? '');
        $label = trim((string) preg_split('/\s[|—–-]\s/u', $title)[0]);
        if ($label !== '') {
            $links[$href] = $label;
        }
    }
    // A hub page (/blog, /programs, /qurbani…) also links to every page under it from the sitemap.
    static $locs = null;
    if ($locs === null) {
        $xml = (string) @file_get_contents(__DIR__ . '/sitemap-base.xml');
        preg_match_all('#<loc>https?://[^/<]+(/[^<]*)</loc>#', $xml, $m);
        $locs = array_values(array_unique($m[1] ?? []));
    }
    if ($path !== '/') {
        foreach ($locs as $href) {
            if (str_starts_with($href, $path . '/') && ! isset($links[$href])) {
                $links[$href] = urldecode(str_replace('-', ' ', basename($href)));
            }
        }
    }
    unset($links[$path]);
    $suffix = $lang === 'en' ? '?lang=en' : '';   // same URL scheme as the canonical / hreflang tags
    $items = '';
    foreach ($links as $href => $label) {
        $items .= '<li><a href="' . e($href . $suffix) . '">' . e($label) . '</a></li>';
    }

    return '<nav aria-label="' . ($lang === 'en' ? 'Site pages' : 'صفحات الموقع') . '"><ul>' . $items . '</ul></nav>';
}

function e(?string $v): string
{
    return htmlspecialchars((string) $v, ENT_QUOTES | ENT_HTML5, 'UTF-8');
}

function render(string $html, array $p, string $path, string $lang): string
{
    $ar = SITE . ($path === '/' ? '/' : $path);
    $en = $ar . '?lang=en';
    $canonical = $lang === 'en' ? $en : $ar;
    $title = (string) ($p['title'] ?? '');
    $desc = (string) ($p['description'] ?? '');
    $image = (string) ($p['image'] ?? '') ?: SITE . '/og-cover.jpg?v=2026.1';

    // Replace the defaults of index.html (they carry data-rh, so react-helmet takes them over later).
    // A page without its own title keeps the defaults; the canonical and links below are always set.
    $set = [];
    if ($title !== '') {
        $set['#<title[^>]*>.*?</title>#s'] = '<title data-rh="true">' . e($title) . '</title>';
        foreach (['og:title' => $title, 'og:image:alt' => $title] as $prop => $val) {
            $set['#<meta\b[^>]*\bproperty="' . preg_quote($prop, '#') . '"[^>]*>#s'] = '<meta data-rh="true" property="' . $prop . '" content="' . e($val) . '" />';
        }
        foreach (['twitter:title' => $title, 'twitter:image:alt' => $title] as $name => $val) {
            $set['#<meta\b[^>]*\bname="' . preg_quote($name, '#') . '"[^>]*>#s'] = '<meta data-rh="true" name="' . $name . '" content="' . e($val) . '" />';
        }
    }
    if ($desc !== '') {
        $set['#<meta\b[^>]*\bname="description"[^>]*>#s'] = '<meta data-rh="true" name="description" content="' . e($desc) . '" />';
        $set['#<meta\b[^>]*\bproperty="og:description"[^>]*>#s'] = '<meta data-rh="true" property="og:description" content="' . e($desc) . '" />';
        $set['#<meta\b[^>]*\bname="twitter:description"[^>]*>#s'] = '<meta data-rh="true" name="twitter:description" content="' . e($desc) . '" />';
    }
    foreach (['og:url' => $canonical, 'og:image' => $image, 'og:image:secure_url' => $image, 'og:type' => $p['type'] ?? 'website'] as $prop => $val) {
        $set['#<meta\b[^>]*\bproperty="' . preg_quote($prop, '#') . '"[^>]*>#s'] = '<meta data-rh="true" property="' . $prop . '" content="' . e((string) $val) . '" />';
    }
    $set['#<meta\b[^>]*\bname="twitter:image"[^>]*>#s'] = '<meta data-rh="true" name="twitter:image" content="' . e($image) . '" />';
    if (! empty($p['robots'])) {
        $set['#<meta\b[^>]*\bname="robots"[^>]*>#s'] = '<meta data-rh="true" name="robots" content="' . e((string) $p['robots']) . '" />';
    }
    foreach ($set as $re => $tag) {
        $html = preg_replace($re, str_replace(['\\', '$'], ['\\\\', '\\$'], $tag), $html, 1);
    }

    $head = '<link data-rh="true" rel="canonical" href="' . e($canonical) . '" />'
        . '<link data-rh="true" rel="alternate" hreflang="ar-EG" href="' . e($ar) . '" />'
        . '<link data-rh="true" rel="alternate" hreflang="ar" href="' . e($ar) . '" />'
        . '<link data-rh="true" rel="alternate" hreflang="en" href="' . e($en) . '" />'
        . '<link data-rh="true" rel="alternate" hreflang="x-default" href="' . e($ar) . '" />';
    foreach ((array) ($p['jsonld'] ?? []) as $ld) {
        $head .= '<script type="application/ld+json" data-ssr="page">'
            . json_encode($ld, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG) . '</script>';
    }
    $html = str_replace('</head>', $head . "\n</head>", $html);

    // Readable snapshot for crawlers that do not run JavaScript (replaced by the app on start):
    // the page's heading and summary when known, and always the links to the rest of the site.
    $h1 = (string) ($p['h1'] ?? '') ?: trim((string) preg_split('/\s[|—–]\s/u', $title)[0]);
    $summary = (string) ($p['summary'] ?? '') ?: $desc;
    $body = '<main dir="' . ($lang === 'en' ? 'ltr' : 'rtl') . '" style="max-width:760px;margin:40px auto;padding:0 16px;font-family:system-ui,sans-serif;line-height:1.8;color:#0E3B2E">'
        . ($h1 !== '' ? '<h1>' . e($h1) . '</h1>' : '');
    if (! empty($p['image'])) {
        $body .= '<img src="' . e($p['image']) . '" alt="' . e($h1) . '" style="max-width:100%;height:auto;border-radius:12px" />';
    }
    if ($summary !== '') {
        $body .= '<p>' . e(mb_substr($summary, 0, 1200)) . '</p>';
    }
    foreach (array_slice((array) ($p['sections'] ?? []), 0, 12) as $section) {
        $body .= '<h2>' . e((string) $section) . '</h2>';
    }
    if (! empty($p['facts']) && is_array($p['facts'])) {
        $body .= '<ul>';
        foreach ($p['facts'] as $k => $v) {
            $body .= '<li><strong>' . e((string) $k) . ':</strong> ' . e((string) $v) . '</li>';
        }
        $body .= '</ul>';
    }
    if (! empty($p['donate_url'])) {
        $body .= '<p><a href="' . e($p['donate_url']) . '">' . ($lang === 'en' ? 'Donate now' : 'تبرع الآن') . '</a></p>';
    }
    $body .= site_links($path, $lang) . '</main>';
    $html = preg_replace('#<div id="root">\s*</div>#', '<div id="root">' . str_replace(['\\', '$'], ['\\\\', '\\$'], $body) . '</div>', $html, 1);

    return $html;
}
