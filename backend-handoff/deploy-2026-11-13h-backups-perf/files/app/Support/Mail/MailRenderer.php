<?php

namespace App\Support\Mail;

/**
 * Builds the foundation's email (HTML + plain text) from a list of blocks.
 * Table layout and inline styles only, so it holds in Gmail, Outlook, Apple Mail and phone apps.
 *
 * Input (all optional except title):
 *   title, preheader, eyebrow (small orange line above the title), badge (pill in the header),
 *   hero ['image' => url, 'alt' => '', 'link' => url],
 *   blocks [ ['type' => 'text', 'text' => '…'], … ]  (see block() for the types),
 *   reason (why the person got this email), unsubscribe (url), track (outbox token → open pixel + click links)
 * Legacy keys from the first BrandMail (greeting, lines, code, cta, after, note) are turned into blocks.
 */
final class MailRenderer
{
    public const GREEN = '#104c30';
    public const DEEP = '#0b3622';
    public const LIME = '#c4f042';
    public const ORANGE = '#f27b36';
    public const INK = '#14261c';
    public const BODY = '#3a4a41';
    public const MUTED = '#6b7a71';
    public const LINE = '#e6ebe2';
    public const PAPER = '#f3f1ea';

    private const FONT = "'Cairo','Tajawal',Tahoma,'Segoe UI',Arial,sans-serif";

    private ?string $track = null;

    /** Contact data from the dashboard («بيانات الموقع العامة» → org_info), built-in copy for any empty field. */
    public static function org(): array
    {
        static $org = null;
        if ($org !== null) {
            return $org;
        }
        $saved = [];
        try {
            $raw = \Illuminate\Support\Facades\Cache::remember('mail-org-info', 300, fn () => \Illuminate\Support\Facades\DB::table('site_blocks')->where('key', 'org_info')->value('value'));
            $saved = is_string($raw) ? (json_decode($raw, true) ?: []) : (is_array($raw) ? $raw : []);
        } catch (\Throwable $e) {
            $saved = [];
        }
        $pick = fn (string $k, string $d) => is_string($saved[$k] ?? null) && trim($saved[$k]) !== '' ? trim($saved[$k]) : $d;
        $phone = preg_replace('/\D+/', '', $pick('phone', '+201097000137'));

        return $org = [
            'name' => $pick('name_ar', 'مؤسسة اليسر الخيرية'),
            'license' => $pick('license_ar', 'مشهرة برقم 2665 لسنة 2019 بوزارة التضامن الاجتماعي'),
            'address' => $pick('address_ar', 'المنصورة، تقسيم خطاب، بجوار وكالة المنصورة'),
            'phone_e164' => '+' . ltrim($phone, '+'),
            'phone_display' => $pick('phone_display', '+20 109 700 0137'),
            'whatsapp' => preg_replace('/\D+/', '', $pick('whatsapp', $phone)),
            'facebook' => $pick('facebook', 'https://www.facebook.com/Elyosr.Charity/'),
            'instagram' => $pick('instagram', 'https://instagram.com/elyosr.charity'),
        ];
    }

    public static function site(): string
    {
        return rtrim((string) (config('seo.site_url') ?: 'https://elyusr.org'), '/');
    }

    public static function api(): string
    {
        return rtrim((string) (config('app.url') ?: 'https://api.elyusr.org'), '/') . '/api/v1';
    }

    public static function asset(string $file): string
    {
        return self::site() . '/email/' . ltrim($file, '/');
    }

    /** @return array{html:string,text:string,data:array} */
    public static function render(array $data): array
    {
        $r = new self();
        $d = self::normalize($data);
        $r->track = $d['track'];

        return ['html' => $r->html($d), 'text' => $r->text($d), 'data' => $d];
    }

    public static function normalize(array $d): array
    {
        $str = fn ($v) => trim((string) ($v ?? ''));
        $blocks = [];
        if ($str($d['greeting'] ?? '') !== '') {
            $blocks[] = ['type' => 'text', 'text' => '**' . $str($d['greeting']) . '**'];
        }
        foreach ((array) ($d['lines'] ?? []) as $l) {
            if ($str($l) !== '') {
                $blocks[] = ['type' => 'text', 'text' => $str($l)];
            }
        }
        if (! empty($d['code'])) {
            $blocks[] = ['type' => 'code', 'code' => (string) $d['code']];
        }
        foreach ((array) ($d['blocks'] ?? []) as $b) {
            if (is_array($b) && ! empty($b['type'])) {
                $blocks[] = $b;
            }
        }
        if (isset($d['cta']['label'], $d['cta']['url'])) {
            $blocks[] = ['type' => 'button', 'label' => $d['cta']['label'], 'url' => $d['cta']['url']];
        }
        foreach ((array) ($d['after'] ?? []) as $l) {
            if ($str($l) !== '') {
                $blocks[] = ['type' => 'text', 'text' => $str($l), 'small' => true];
            }
        }
        if ($str($d['note'] ?? '') !== '') {
            $blocks[] = ['type' => 'note', 'text' => $str($d['note'])];
        }

        $hero = null;
        if (! empty($d['hero']['image']) && self::safeUrl((string) $d['hero']['image'])) {
            $hero = ['image' => self::absolute((string) $d['hero']['image']), 'alt' => $str($d['hero']['alt'] ?? ''), 'link' => self::safeUrl((string) ($d['hero']['link'] ?? '')) ? (string) $d['hero']['link'] : null];
        }
        $title = $str($d['title'] ?? '') ?: 'مؤسسة اليسر الخيرية';

        return [
            'title' => $title,
            'preheader' => $str($d['preheader'] ?? '') ?: $title,
            'eyebrow' => $str($d['eyebrow'] ?? ''),
            'badge' => $str($d['badge'] ?? ''),
            'hero' => $hero,
            'blocks' => $blocks,
            'reason' => $str($d['reason'] ?? '') ?: 'وصلتك الرسالة دي من موقع مؤسسة اليسر الخيرية. لو عندك سؤال، رد عليها وهنرد عليك.',
            'unsubscribe' => self::safeUrl((string) ($d['unsubscribe'] ?? '')) ? (string) $d['unsubscribe'] : null,
            'track' => isset($d['track']) && preg_match('/^[A-Za-z0-9]{20,40}$/', (string) $d['track']) ? (string) $d['track'] : null,
        ];
    }

    /* ───────────────────────── HTML ───────────────────────── */

    private function html(array $d): string
    {
        $F = self::FONT;
        $e = fn ($s) => htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8');
        $site = self::site();
        $body = '';
        foreach ($d['blocks'] as $b) {
            $body .= $this->block($b);
        }
        $hero = '';
        if ($d['hero']) {
            $img = '<img src="' . $e($d['hero']['image']) . '" width="600" alt="' . $e($d['hero']['alt']) . '" style="display:block;width:100%;max-width:600px;height:auto;border:0;" class="full">';
            if ($d['hero']['link']) {
                $img = '<a href="' . $e($this->link($d['hero']['link'])) . '" target="_blank">' . $img . '</a>';
            }
            $hero = '<tr><td style="padding:0;line-height:0;font-size:0;background:' . self::DEEP . ';">' . $img . '</td></tr>';
        }
        $badge = $d['badge'] !== ''
            ? '<td align="left" valign="middle" style="padding-left:0;"><span style="display:inline-block;padding:6px 14px;border-radius:999px;background:' . self::LIME . ';color:' . self::DEEP . ';font-family:' . $F . ';font-size:12px;line-height:16px;font-weight:800;white-space:nowrap;">' . $e($d['badge']) . '</span></td>'
            : '';
        $eyebrow = $d['eyebrow'] !== ''
            ? '<div style="font-family:' . $F . ';font-size:13px;line-height:20px;font-weight:800;color:' . self::ORANGE . ';margin:0 0 8px;">' . $e($d['eyebrow']) . '</div>'
            : '';
        $unsub = $d['unsubscribe']
            ? ' &nbsp;·&nbsp; <a href="' . $e($d['unsubscribe']) . '" target="_blank" style="color:' . self::LIME . ';text-decoration:underline;">إلغاء الاشتراك</a>'
            : '';
        $pixel = $this->track
            ? '<img src="' . $e(self::api() . '/mail/o/' . $this->track . '.gif') . '" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;opacity:0;">'
            : '';
        $logo = self::asset('logo-circle-120.png');
        $year = date('Y');
        $social = '';
        $org = self::org();
        foreach ([['الموقع', $site], ['فيسبوك', $org['facebook']], ['إنستجرام', $org['instagram']], ['واتساب', 'https://wa.me/' . $org['whatsapp']]] as [$label, $url]) {
            $social .= '<a href="' . $e($this->link($url)) . '" target="_blank" style="display:inline-block;margin:0 0 6px 6px;padding:7px 14px;border-radius:999px;border:1px solid rgba(196,240,66,.45);color:#ffffff;font-family:' . $F . ';font-size:12px;line-height:16px;font-weight:700;text-decoration:none;">' . $label . '</a>';
        }

        return '<!DOCTYPE html>
<html lang="ar" dir="rtl" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="x-apple-disable-message-reformatting">
<meta name="format-detection" content="telephone=no,address=no,email=no,date=no">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light">
<title>' . $e($d['title']) . '</title>
<!--[if mso]><style>* { font-family: Tahoma, Arial, sans-serif !important; }</style><![endif]-->
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
<style>
  body,table,td,a { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
  table,td { mso-table-lspace:0pt; mso-table-rspace:0pt; }
  img { -ms-interpolation-mode:bicubic; border:0; outline:none; text-decoration:none; }
  body { margin:0 !important; padding:0 !important; width:100% !important; background:' . self::PAPER . '; }
  a { color:' . self::GREEN . '; }
  u + #body a, #MessageViewBody a { color:inherit; text-decoration:none; }
  @media screen and (max-width: 620px) {
    .wrap { width:100% !important; max-width:100% !important; }
    .shell { padding:12px 8px !important; }
    .pad { padding-left:22px !important; padding-right:22px !important; }
    .h1 { font-size:23px !important; line-height:34px !important; }
    .full { width:100% !important; height:auto !important; }
    .stack { display:block !important; width:100% !important; max-width:100% !important; }
    .stack-pad { padding:0 0 12px 0 !important; }
    .code { font-size:30px !important; letter-spacing:8px !important; }
    .btn a { display:block !important; text-align:center !important; }
    .stat { font-size:22px !important; }
  }
</style>
</head>
<body id="body" style="margin:0;padding:0;background:' . self::PAPER . ';">
<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;color:' . self::PAPER . ';">' . $e($d['preheader']) . str_repeat('&#847;&zwnj;&nbsp;', 40) . '</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:' . self::PAPER . ';" dir="rtl">
<tr><td align="center" class="shell" style="padding:26px 12px 30px;">
  <table role="presentation" class="wrap" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;">
    <tr><td style="padding:0 6px 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td align="right" style="font-family:' . $F . ';font-size:12px;line-height:18px;color:' . self::MUTED . ';">مؤسسة اليسر الخيرية · المنصورة</td>
        <td align="left" style="font-family:' . $F . ';font-size:12px;line-height:18px;"><a href="' . $e($this->link($site)) . '" target="_blank" style="color:' . self::GREEN . ';font-weight:700;text-decoration:none;">elyusr.org</a></td>
      </tr></table>
    </td></tr>
    <tr><td style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 10px 30px rgba(16,76,48,.08);">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" dir="rtl">
        <tr><td class="pad" style="background:' . self::GREEN . ';background-image:linear-gradient(135deg,' . self::DEEP . ' 0%,' . self::GREEN . ' 70%);padding:22px 32px;border-radius:24px 24px 0 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            <td width="58" valign="middle" style="width:58px;"><a href="' . $e($this->link($site)) . '" target="_blank"><img src="' . $e($logo) . '" width="52" height="52" alt="مؤسسة اليسر الخيرية" style="display:block;width:52px;height:52px;border-radius:50%;"></a></td>
            <td valign="middle" style="padding-right:12px;font-family:' . $F . ';">
              <div style="font-size:20px;line-height:26px;font-weight:900;color:#ffffff;">مؤسسة اليسر الخيرية</div>
              <div style="font-size:12px;line-height:18px;font-weight:700;color:' . self::LIME . ';">قوة · أمانة · إحسان</div>
            </td>' . $badge . '
          </tr></table>
        </td></tr>
        ' . $hero . '
        <tr><td class="pad" style="padding:34px 40px 10px;font-family:' . $F . ';">
          ' . $eyebrow . '
          <h1 class="h1" style="margin:0;font-family:' . $F . ';font-size:27px;line-height:40px;font-weight:900;color:' . self::INK . ';">' . $e($d['title']) . '</h1>
        </td></tr>
        <tr><td class="pad" style="padding:6px 40px 34px;font-family:' . $F . ';">' . $body . '</td></tr>
        <tr><td class="pad" style="background:' . self::DEEP . ';padding:28px 40px 30px;border-radius:0 0 24px 24px;font-family:' . $F . ';">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            <td style="font-size:12px;line-height:22px;color:rgba(255,255,255,.78);">
              <div style="font-size:15px;line-height:24px;font-weight:900;color:#ffffff;margin-bottom:4px;">' . $e($org['name']) . '</div>
              ' . $e($org['license']) . '<br>
              ' . $e($org['address']) . '<br>
              <a href="tel:' . $e($org['phone_e164']) . '" dir="ltr" style="color:rgba(255,255,255,.78);text-decoration:none;">' . $e($org['phone_display']) . '</a> &nbsp;·&nbsp; <a href="mailto:support@elyusr.org" style="color:rgba(255,255,255,.78);text-decoration:none;">support@elyusr.org</a>
            </td>
          </tr>
          <tr><td style="padding-top:16px;">' . $social . '</td></tr>
          <tr><td style="padding-top:14px;border-top:1px solid rgba(255,255,255,.12);font-size:11px;line-height:19px;color:rgba(255,255,255,.6);">' . $e($d['reason']) . $unsub . '</td></tr>
          </table>
        </td></tr>
      </table>
    </td></tr>
    <tr><td align="center" style="padding:16px 12px 0;font-family:' . $F . ';font-size:11px;line-height:18px;color:#8f9a92;">© ' . $year . ' مؤسسة اليسر الخيرية — أمانة في العطاء وأثرٌ يدوم' . $pixel . '</td></tr>
  </table>
</td></tr>
</table>
</body>
</html>';
    }

    private function block(array $b): string
    {
        $F = self::FONT;
        $e = fn ($s) => htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8');
        $type = (string) ($b['type'] ?? '');

        switch ($type) {
            case 'heading':
                return '<h2 style="margin:26px 0 4px;font-family:' . $F . ';font-size:20px;line-height:30px;font-weight:900;color:' . self::GREEN . ';">' . $e($b['text'] ?? '') . '</h2>';

            case 'text':
                $small = ! empty($b['small']);
                return '<p style="margin:14px 0 0;font-family:' . $F . ';font-size:' . ($small ? '14px' : '16px') . ';line-height:' . ($small ? '25px' : '30px') . ';color:' . ($small ? self::MUTED : self::BODY) . ';">' . $this->inline((string) ($b['text'] ?? '')) . '</p>';

            case 'list':
                $items = '';
                foreach ((array) ($b['items'] ?? []) as $it) {
                    $items .= '<tr><td valign="top" width="22" style="width:22px;padding:6px 0 0;font-size:14px;line-height:26px;color:' . self::ORANGE . ';font-weight:900;">●</td><td style="padding:6px 0 0;font-family:' . $F . ';font-size:15px;line-height:26px;color:' . self::BODY . ';">' . $this->inline((string) $it) . '</td></tr>';
                }
                return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:10px 0 0;">' . $items . '</table>';

            case 'image':
                $url = (string) ($b['url'] ?? '');
                if (! self::safeUrl($url)) {
                    return '';
                }
                $img = '<img src="' . $e(self::absolute($url)) . '" width="520" alt="' . $e($b['alt'] ?? '') . '" class="full" style="display:block;width:100%;max-width:520px;height:auto;border-radius:16px;">';
                if (! empty($b['link']) && self::safeUrl((string) $b['link'])) {
                    $img = '<a href="' . $e($this->link((string) $b['link'])) . '" target="_blank">' . $img . '</a>';
                }
                $cap = ! empty($b['caption']) ? '<div style="padding-top:8px;font-family:' . $F . ';font-size:12px;line-height:20px;color:' . self::MUTED . ';text-align:center;">' . $e($b['caption']) . '</div>' : '';
                return '<div style="margin:20px 0 4px;">' . $img . $cap . '</div>';

            case 'button':
                if (empty($b['label']) || ! self::safeUrl((string) ($b['url'] ?? ''))) {
                    return '';
                }
                $secondary = ($b['variant'] ?? '') === 'secondary';
                $bg = $secondary ? '#ffffff' : self::ORANGE;
                $fg = $secondary ? self::GREEN : '#ffffff';
                $border = $secondary ? 'border:2px solid ' . self::GREEN . ';' : '';
                $align = ($b['align'] ?? '') === 'center' ? 'center' : 'right';
                return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 6px;"><tr><td align="' . $align . '" class="btn">'
                    . '<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-radius:999px;background:' . $bg . ';' . $border . '">'
                    . '<a href="' . $e($this->link((string) $b['url'])) . '" target="_blank" style="display:inline-block;padding:15px 34px;font-family:' . $F . ';font-size:16px;line-height:20px;font-weight:900;color:' . $fg . ';text-decoration:none;border-radius:999px;">' . $e($b['label']) . ' &larr;</a>'
                    . '</td></tr></table></td></tr></table>';

            case 'code':
                return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 8px;"><tr>'
                    . '<td align="center" style="background:#f6fbe6;border:2px dashed ' . self::LIME . ';border-radius:18px;padding:22px 12px;">'
                    . '<div style="font-family:' . $F . ';font-size:12px;line-height:18px;color:' . self::MUTED . ';font-weight:700;margin-bottom:6px;">' . $e($b['label'] ?? 'رمزك') . '</div>'
                    . '<div class="code" dir="ltr" style="font-family:\'Courier New\',Consolas,monospace;font-size:40px;line-height:46px;letter-spacing:12px;font-weight:700;color:' . self::GREEN . ';">' . $e($b['code'] ?? '') . '</div>'
                    . '</td></tr></table>';

            case 'note':
                return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 0;"><tr>'
                    . '<td style="background:#f4f6f2;border-radius:14px;padding:13px 16px;font-family:' . $F . ';font-size:13px;line-height:22px;color:' . self::MUTED . ';">' . $this->inline((string) ($b['text'] ?? '')) . '</td></tr></table>';

            case 'quote':
                $by = ! empty($b['by']) ? '<div style="padding-top:8px;font-size:12px;line-height:18px;color:' . self::MUTED . ';font-weight:700;">' . $e($b['by']) . '</div>' : '';
                return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 4px;"><tr>'
                    . '<td style="background:#f6fbe6;border-right:5px solid ' . self::LIME . ';border-radius:14px;padding:18px 20px;font-family:' . $F . ';">'
                    . '<div style="font-size:18px;line-height:32px;font-weight:800;color:' . self::GREEN . ';">' . nl2br($e($b['text'] ?? '')) . '</div>' . $by
                    . '</td></tr></table>';

            case 'html':
                // Staff-written HTML from older campaigns (trusted: only newsletter editors can save it).
                return '<div style="margin:14px 0 0;font-family:' . $F . ';font-size:16px;line-height:30px;color:' . self::BODY . ';">' . (string) ($b['html'] ?? '') . '</div>';

            case 'divider':
                return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0 6px;"><tr><td style="height:1px;line-height:1px;font-size:0;background:' . self::LINE . ';">&nbsp;</td></tr></table>';

            case 'spacer':
                $h = max(4, min(60, (int) ($b['size'] ?? 16)));
                return '<div style="height:' . $h . 'px;line-height:' . $h . 'px;font-size:0;">&nbsp;</div>';

            case 'stats':
                $items = array_slice(array_values(array_filter((array) ($b['items'] ?? []), fn ($i) => trim((string) ($i['value'] ?? '')) !== '')), 0, 3);
                if (! $items) {
                    return '';
                }
                $w = (int) floor(100 / count($items));
                $cells = '';
                foreach ($items as $i => $it) {
                    $pad = $i < count($items) - 1 ? 'padding-left:8px;' : '';
                    $cells .= '<td width="' . $w . '%" valign="top" style="' . $pad . '">'
                        . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="background:' . self::GREEN . ';border-radius:16px;padding:16px 8px;font-family:' . $F . ';">'
                        . '<div class="stat" style="font-size:26px;line-height:32px;font-weight:900;color:' . self::LIME . ';">' . $e($it['value'] ?? '') . '</div>'
                        . '<div style="font-size:12px;line-height:18px;font-weight:700;color:rgba(255,255,255,.85);">' . $e($it['label'] ?? '') . '</div>'
                        . '</td></tr></table></td>';
                }
                return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 4px;"><tr>' . $cells . '</tr></table>';

            case 'receipt':
                $rows = '';
                foreach ((array) ($b['rows'] ?? []) as $row) {
                    [$k, $v] = [(string) ($row[0] ?? $row['label'] ?? ''), (string) ($row[1] ?? $row['value'] ?? '')];
                    if ($k === '' && $v === '') {
                        continue;
                    }
                    $rows .= '<tr><td style="padding:11px 0;border-bottom:1px dashed ' . self::LINE . ';font-family:' . $F . ';font-size:14px;line-height:22px;color:' . self::MUTED . ';">' . $e($k) . '</td>'
                        . '<td align="left" style="padding:11px 0;border-bottom:1px dashed ' . self::LINE . ';font-family:' . $F . ';font-size:15px;line-height:22px;color:' . self::INK . ';font-weight:800;">' . $e($v) . '</td></tr>';
                }
                $total = ! empty($b['total']) ? '<tr><td style="padding:14px 0 2px;font-family:' . $F . ';font-size:15px;color:' . self::GREEN . ';font-weight:900;">الإجمالي</td><td align="left" style="padding:14px 0 2px;font-family:' . $F . ';font-size:22px;color:' . self::GREEN . ';font-weight:900;">' . $e($b['total']) . '</td></tr>' : '';
                return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 4px;"><tr><td style="background:#fbfcf9;border:1px solid ' . self::LINE . ';border-radius:18px;padding:8px 20px 14px;">'
                    . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">' . $rows . $total . '</table></td></tr></table>';

            case 'steps':
                $out = '';
                foreach ((array) ($b['items'] ?? []) as $it) {
                    $done = ! empty($it['done']);
                    $now = ! empty($it['current']);
                    $dot = $done ? '<span style="display:inline-block;width:26px;height:26px;line-height:26px;border-radius:50%;background:' . self::GREEN . ';color:' . self::LIME . ';font-size:14px;font-weight:900;text-align:center;">✓</span>'
                        : '<span style="display:inline-block;width:22px;height:22px;line-height:22px;border-radius:50%;border:2px solid ' . ($now ? self::ORANGE : '#cfd8cb') . ';background:#fff;"></span>';
                    $out .= '<tr><td width="36" valign="top" style="width:36px;padding:7px 0;">' . $dot . '</td>'
                        . '<td style="padding:8px 0;font-family:' . $F . ';font-size:15px;line-height:24px;font-weight:' . ($done || $now ? '800' : '600') . ';color:' . ($done ? self::INK : ($now ? self::ORANGE : self::MUTED)) . ';">' . $e($it['label'] ?? '') . (! empty($it['note']) ? '<div style="font-size:12px;line-height:20px;font-weight:600;color:' . self::MUTED . ';">' . $e($it['note']) . '</div>' : '') . '</td></tr>';
                }
                return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:18px 0 4px;">' . $out . '</table>';

            case 'card':
                return '<div style="margin:22px 0 4px;">' . $this->card($b) . '</div>';

            case 'cards':
                $items = array_slice(array_values((array) ($b['items'] ?? [])), 0, 4);
                $rows = '';
                foreach (array_chunk($items, 2) as $pair) {
                    $cells = '';
                    foreach ($pair as $i => $it) {
                        $cells .= '<td class="stack stack-pad" width="50%" valign="top" style="' . ($i === 0 && count($pair) === 2 ? 'padding-left:10px;' : '') . '">' . $this->card($it, true) . '</td>';
                    }
                    if (count($pair) === 1) {
                        $cells .= '<td class="stack" width="50%">&nbsp;</td>';
                    }
                    $rows .= '<tr>' . $cells . '</tr><tr><td colspan="2" style="height:12px;line-height:12px;font-size:0;">&nbsp;</td></tr>';
                }
                return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 0;">' . $rows . '</table>';
        }

        return '';
    }

    private function card(array $c, bool $compact = false): string
    {
        $F = self::FONT;
        $e = fn ($s) => htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8');
        $url = self::safeUrl((string) ($c['url'] ?? '')) ? (string) $c['url'] : null;
        $img = '';
        if (! empty($c['image']) && self::safeUrl((string) $c['image'])) {
            $tag = '<img src="' . $e(self::absolute((string) $c['image'])) . '" width="' . ($compact ? 250 : 520) . '" alt="' . $e($c['title'] ?? '') . '" class="full" style="display:block;width:100%;height:auto;border-radius:16px 16px 0 0;">';
            $img = '<tr><td style="line-height:0;font-size:0;">' . ($url ? '<a href="' . $e($this->link($url)) . '" target="_blank">' . $tag . '</a>' : $tag) . '</td></tr>';
        }
        $badge = ! empty($c['badge']) ? '<span style="display:inline-block;margin-bottom:8px;padding:3px 10px;border-radius:999px;background:#fff1e8;color:' . self::ORANGE . ';font-size:11px;line-height:16px;font-weight:800;">' . $e($c['badge']) . '</span><br>' : '';
        $progress = '';
        $raised = (float) ($c['raised'] ?? 0);
        $target = (float) ($c['target'] ?? 0);
        if ($target > 0) {
            $pct = max(0, min(100, (int) round($raised / $target * 100)));
            $fill = max(2, $pct);
            $progress = '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:12px 0 6px;"><tr>'
                . '<td width="' . $fill . '%" style="height:8px;line-height:8px;font-size:0;background:' . self::LIME . ';border-radius:999px;">&nbsp;</td>'
                . ($pct < 100 ? '<td style="height:8px;line-height:8px;font-size:0;background:#e9eee5;border-radius:999px;">&nbsp;</td>' : '')
                . '</tr></table>'
                . '<div style="font-size:12px;line-height:18px;color:' . self::MUTED . ';font-weight:700;">' . $pct . '% · اتجمع ' . number_format($raised) . ' من ' . number_format($target) . ' ج.م</div>';
        }
        $cta = $url ? '<div style="padding-top:12px;"><a href="' . $e($this->link($url)) . '" target="_blank" style="font-size:14px;line-height:20px;font-weight:900;color:' . self::ORANGE . ';text-decoration:none;">' . $e($c['cta'] ?? 'اعرف أكتر') . ' &larr;</a></div>' : '';
        $text = ! empty($c['text']) ? '<div style="padding-top:6px;font-size:' . ($compact ? '13px' : '14px') . ';line-height:' . ($compact ? '22px' : '24px') . ';color:' . self::BODY . ';">' . $this->inline((string) $c['text']) . '</div>' : '';

        return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ' . self::LINE . ';border-radius:18px;background:#ffffff;">'
            . $img
            . '<tr><td style="padding:' . ($compact ? '14px 16px 16px' : '18px 20px 20px') . ';font-family:' . $F . ';">' . $badge
            . '<div style="font-size:' . ($compact ? '15px' : '18px') . ';line-height:' . ($compact ? '24px' : '28px') . ';font-weight:900;color:' . self::INK . ';">' . $e($c['title'] ?? '') . '</div>'
            . $text . $progress . $cta . '</td></tr></table>';
    }

    /** Escapes text, then allows **bold**, [label](https://…) links and line breaks. */
    private function inline(string $s): string
    {
        $h = htmlspecialchars($s, ENT_QUOTES, 'UTF-8');
        $h = preg_replace('/\*\*(.+?)\*\*/u', '<strong style="color:' . self::INK . ';font-weight:800;">$1</strong>', $h);
        $h = preg_replace_callback('/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/u', function ($m) {
            $url = html_entity_decode($m[2], ENT_QUOTES, 'UTF-8');

            return '<a href="' . htmlspecialchars($this->link($url), ENT_QUOTES, 'UTF-8') . '" target="_blank" style="color:' . self::GREEN . ';font-weight:800;text-decoration:underline;">' . $m[1] . '</a>';
        }, $h);

        return nl2br($h);
    }

    /** With a tracking token, links go through the click counter (signed, so it can't be used as an open redirect). */
    private function link(string $url): string
    {
        $url = self::absolute($url);
        if (! $this->track || str_starts_with($url, 'mailto:') || str_starts_with($url, 'tel:')) {
            return $url;
        }

        return self::api() . '/mail/c/' . $this->track . '?u=' . rtrim(strtr(base64_encode($url), '+/', '-_'), '=') . '&s=' . self::sign($url);
    }

    public static function sign(string $url): string
    {
        return substr(hash_hmac('sha256', $url, (string) config('app.key')), 0, 16);
    }

    public static function safeUrl(string $url): bool
    {
        return $url !== '' && (bool) preg_match('#^(https?://[^\s<>"]+|/[^\s<>"]*|mailto:[^\s<>"]+|tel:[+0-9]+)$#i', $url);
    }

    public static function absolute(string $url): string
    {
        return str_starts_with($url, '/') && ! str_starts_with($url, '//') ? self::site() . $url : $url;
    }

    /* ───────────────────────── text ───────────────────────── */

    private function text(array $d): string
    {
        $out = [$d['title'], str_repeat('—', 20)];
        foreach ($d['blocks'] as $b) {
            $t = (string) ($b['type'] ?? '');
            $line = match ($t) {
                'heading' => "\n" . ($b['text'] ?? ''),
                'text', 'note' => self::plain((string) ($b['text'] ?? '')),
                'quote' => '«' . ($b['text'] ?? '') . '»' . (! empty($b['by']) ? ' — ' . $b['by'] : ''),
                'code' => ($b['label'] ?? 'رمزك') . ': ' . ($b['code'] ?? ''),
                'button' => ($b['label'] ?? '') . ': ' . self::absolute((string) ($b['url'] ?? '')),
                'image' => ! empty($b['link']) ? self::absolute((string) $b['link']) : '',
                'list' => implode("\n", array_map(fn ($i) => '• ' . self::plain((string) $i), (array) ($b['items'] ?? []))),
                'stats' => implode(' · ', array_map(fn ($i) => ($i['value'] ?? '') . ' ' . ($i['label'] ?? ''), (array) ($b['items'] ?? []))),
                'receipt' => implode("\n", array_map(fn ($r) => ($r[0] ?? '') . ': ' . ($r[1] ?? ''), (array) ($b['rows'] ?? []))) . (! empty($b['total']) ? "\nالإجمالي: " . $b['total'] : ''),
                'steps' => implode("\n", array_map(fn ($i) => (! empty($i['done']) ? '✓ ' : '○ ') . ($i['label'] ?? ''), (array) ($b['items'] ?? []))),
                'card' => self::cardText($b),
                'cards' => implode("\n\n", array_map([self::class, 'cardText'], (array) ($b['items'] ?? []))),
                'html' => trim(html_entity_decode(strip_tags(preg_replace('/<(br|\/p|\/h\d|\/li)[^>]*>/i', "\n", (string) ($b['html'] ?? ''))), ENT_QUOTES, 'UTF-8')),
                'divider' => '',
                default => '',
            };
            if (trim($line) !== '') {
                $out[] = $line;
            }
        }
        $out[] = "\n" . str_repeat('—', 20);
        $org = self::org();
        $out[] = $org['name'] . ' · ' . $org['license'];
        $out[] = $org['phone_display'] . ' · support@elyusr.org · ' . self::site();
        $out[] = $d['reason'];
        if ($d['unsubscribe']) {
            $out[] = 'إلغاء الاشتراك: ' . $d['unsubscribe'];
        }

        return implode("\n\n", $out);
    }

    private static function cardText(array $c): string
    {
        return trim(($c['title'] ?? '') . "\n" . self::plain((string) ($c['text'] ?? '')) . (! empty($c['url']) ? "\n" . self::absolute((string) $c['url']) : ''));
    }

    private static function plain(string $s): string
    {
        $s = preg_replace('/\*\*(.+?)\*\*/u', '$1', $s);

        return preg_replace('/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/u', '$1 ($2)', $s);
    }
}
