<?php
// Web-app manifest for one shared misbaha: «add to home screen» from a room page opens that room,
// not the site's home. The room page points its <link rel="manifest"> here.
$main = isset($_GET['main']); // /misbaha itself (the personal counter)
$slug = isset($_GET['slug']) ? (string) $_GET['slug'] : '';
if (!$main && !preg_match('/^[A-Za-z0-9_-]{2,60}$/', $slug)) {
    http_response_code(404);
    exit;
}
$name = isset($_GET['name']) ? trim(preg_replace('/[\x00-\x1F<>"]+/u', ' ', (string) $_GET['name'])) : '';
$name = function_exists('mb_substr') ? mb_substr($name, 0, 40) : substr($name, 0, 80);
$title = $main ? 'السبحة الإلكترونية — اليسر' : ($name !== '' ? 'سبحة ' . $name : 'السبحة المشتركة');
$start = $main ? '/misbaha' : '/misbaha/' . $slug;
// "any": the round logo (transparent corners, shown on background_color in the splash screen);
// "maskable": the logo inside the brand green with a safe margin, so launchers never crop it.
$icon = function ($size, $purpose = null) {
    $file = $purpose === 'maskable' ? "maskable-$size" : "icon-$size";
    $i = ['src' => "/icons/$file.png", 'sizes' => "{$size}x{$size}", 'type' => 'image/png'];
    if ($purpose) $i['purpose'] = $purpose;
    return $i;
};
header('Content-Type: application/manifest+json; charset=utf-8');
header('Cache-Control: public, max-age=3600');
echo json_encode([
    'id' => $start,
    'name' => $title,
    'short_name' => $main ? 'السبحة' : ($name !== '' ? $name : 'السبحة'),
    'description' => 'سبحة مشتركة على موقع مؤسسة اليسر الخيرية',
    'lang' => 'ar',
    'dir' => 'rtl',
    'start_url' => $start . '?src=home',
    'scope' => '/',
    'display' => 'standalone',
    'orientation' => 'portrait',
    'background_color' => '#0E3B2E',
    'theme_color' => '#0E3B2E',
    'icons' => [$icon(192), $icon(512), $icon(192, 'maskable'), $icon(512, 'maskable')],
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
