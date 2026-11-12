<?php
// Web-app manifest for one shared misbaha: «add to home screen» from a room page opens that room,
// not the site's home. The room page points its <link rel="manifest"> here.
$slug = isset($_GET['slug']) ? (string) $_GET['slug'] : '';
if (!preg_match('/^[A-Za-z0-9_-]{2,60}$/', $slug)) {
    http_response_code(404);
    exit;
}
$name = isset($_GET['name']) ? trim(preg_replace('/[\x00-\x1F<>"]+/u', ' ', (string) $_GET['name'])) : '';
$name = function_exists('mb_substr') ? mb_substr($name, 0, 40) : substr($name, 0, 80);
$title = $name !== '' ? 'سبحة ' . $name : 'السبحة المشتركة';
$start = '/misbaha/' . $slug;
$icon = function ($size, $purpose = null) {
    $i = ['src' => "/icons/icon-$size.png", 'sizes' => "{$size}x{$size}", 'type' => 'image/png'];
    if ($purpose) $i['purpose'] = $purpose;
    return $i;
};
header('Content-Type: application/manifest+json; charset=utf-8');
header('Cache-Control: public, max-age=3600');
echo json_encode([
    'id' => $start,
    'name' => $title,
    'short_name' => $name !== '' ? $name : 'السبحة',
    'description' => 'سبحة مشتركة على موقع مؤسسة اليسر الخيرية',
    'lang' => 'ar',
    'dir' => 'rtl',
    'start_url' => $start . '?src=home',
    'scope' => '/',
    'display' => 'standalone',
    'orientation' => 'portrait',
    'background_color' => '#0E3B2E',
    'theme_color' => '#0E3B2E',
    'icons' => [$icon(192, 'any maskable'), $icon(512, 'any maskable'), $icon(144)],
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
