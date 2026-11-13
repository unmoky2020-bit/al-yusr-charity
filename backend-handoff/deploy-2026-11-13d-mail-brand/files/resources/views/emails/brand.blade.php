{{-- The foundation's email: table layout and inline styles so it holds in Gmail, Outlook and Apple Mail. --}}
<!DOCTYPE html>
<html lang="ar" dir="rtl" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light">
<title>{{ $m['title'] }}</title>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">
<style>
  body { margin:0; padding:0; background:#eef2ea; }
  a { color:#104c30; }
  @media (max-width: 620px) {
    .wrap { width:100% !important; }
    .pad { padding-left:22px !important; padding-right:22px !important; }
    .code { font-size:30px !important; letter-spacing:8px !important; }
    .h1 { font-size:22px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:#eef2ea;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#eef2ea;font-size:1px;line-height:1px;">{{ $m['preheader'] }}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#eef2ea;">
<tr><td align="center" style="padding:28px 12px;">
  <table role="presentation" class="wrap" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;font-family:'Cairo',Tahoma,'Segoe UI',Arial,sans-serif;direction:rtl;text-align:right;">

    {{-- Header --}}
    <tr><td style="background:#071d13;background-image:linear-gradient(135deg,#071d13 0%,#104c30 100%);border-radius:20px 20px 0 0;padding:28px 32px;" class="pad">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td width="64" valign="middle" style="width:64px;">
          <a href="{{ $m['site'] }}" target="_blank" style="text-decoration:none;"><img src="{{ $m['logo'] }}" width="56" height="56" alt="مؤسسة اليسر الخيرية" style="display:block;width:56px;height:56px;border-radius:50%;border:2px solid #c4f042;background:#ffffff;"></a>
        </td>
        <td valign="middle" style="padding-right:14px;">
          <div style="font-size:12px;line-height:18px;color:#c4f042;font-weight:700;">مؤسسة</div>
          <div style="font-size:22px;line-height:28px;color:#ffffff;font-weight:900;">اليسر الخيرية</div>
          <div style="font-size:12px;line-height:18px;color:rgba(255,255,255,.72);">أمانة في العطاء وأثرٌ يدوم</div>
        </td>
      </tr></table>
    </td></tr>
    <tr><td style="height:4px;line-height:4px;font-size:0;background:#c4f042;">&nbsp;</td></tr>

    {{-- Card --}}
    <tr><td class="pad" style="background:#ffffff;padding:34px 40px 30px;">
      <div class="h1" style="font-size:24px;line-height:34px;font-weight:900;color:#104c30;margin:0 0 6px;">{{ $m['title'] }}</div>
      @if ($m['greeting'] !== '')
        <p style="margin:14px 0 0;font-size:16px;line-height:28px;color:#1f2a24;font-weight:700;">{{ $m['greeting'] }}</p>
      @endif
      @foreach ($m['lines'] as $line)
        <p style="margin:10px 0 0;font-size:15px;line-height:27px;color:#3d4a43;">{!! nl2br(e($line)) !!}</p>
      @endforeach

      @if ($m['code'])
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 8px;"><tr>
          <td align="center" style="background:#f6fbe6;border:2px dashed #c4f042;border-radius:16px;padding:22px 12px;">
            <div style="font-size:12px;line-height:18px;color:#5b6b61;font-weight:700;margin-bottom:6px;">رمزك</div>
            <div class="code" dir="ltr" style="font-family:'Courier New',Consolas,monospace;font-size:38px;line-height:44px;letter-spacing:12px;font-weight:700;color:#104c30;">{{ $m['code'] }}</div>
          </td>
        </tr></table>
      @endif

      @if ($m['cta'])
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 6px;"><tr>
          <td style="border-radius:12px;background:#f27b36;">
            <a href="{{ $m['cta']['url'] }}" target="_blank" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:900;color:#ffffff;text-decoration:none;border-radius:12px;">{{ $m['cta']['label'] }}</a>
          </td>
        </tr></table>
      @endif

      @foreach ($m['after'] as $line)
        <p style="margin:10px 0 0;font-size:14px;line-height:25px;color:#3d4a43;">{!! nl2br(e($line)) !!}</p>
      @endforeach

      @if ($m['note'] !== '')
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 0;"><tr>
          <td style="background:#f4f6f3;border-radius:12px;padding:12px 14px;font-size:12px;line-height:21px;color:#5b6b61;">&#128274;&nbsp; {{ $m['note'] }}</td>
        </tr></table>
      @endif
    </td></tr>

    {{-- Footer --}}
    <tr><td class="pad" style="background:#f7f8f4;border-top:1px solid #e3e8df;border-radius:0 0 20px 20px;padding:22px 40px 26px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="font-size:12px;line-height:21px;color:#5b6b61;">
          <strong style="color:#104c30;">مؤسسة اليسر الخيرية</strong> · مشهرة برقم 2665 لسنة 2019 بوزارة التضامن الاجتماعي<br>
          المنصورة، تقسيم خطاب، بجوار وكالة المنصورة<br>
          <a href="tel:+201097000137" style="color:#5b6b61;text-decoration:none;" dir="ltr">+20 109 700 0137</a>
          &nbsp;·&nbsp; <a href="mailto:info@elyusr.org" style="color:#5b6b61;text-decoration:none;">info@elyusr.org</a>
        </td>
      </tr>
      <tr><td style="padding-top:14px;">
        <a href="{{ $m['site'] }}" target="_blank" style="display:inline-block;margin-left:6px;padding:7px 14px;border-radius:999px;background:#104c30;color:#ffffff;font-size:12px;font-weight:700;text-decoration:none;">elyusr.org</a>
        <a href="https://www.facebook.com/Elyosr.Charity/" target="_blank" style="display:inline-block;margin-left:6px;padding:7px 14px;border-radius:999px;border:1px solid #d6ddd2;color:#104c30;font-size:12px;font-weight:700;text-decoration:none;">فيسبوك</a>
        <a href="https://instagram.com/elyosr.charity" target="_blank" style="display:inline-block;padding:7px 14px;border-radius:999px;border:1px solid #d6ddd2;color:#104c30;font-size:12px;font-weight:700;text-decoration:none;">إنستجرام</a>
      </td></tr></table>
    </td></tr>

    <tr><td align="center" style="padding:16px 12px 0;font-size:11px;line-height:18px;color:#8a978e;font-family:Tahoma,Arial,sans-serif;">
      الرسالة دي اتبعتت تلقائيًا من موقع مؤسسة اليسر الخيرية. لو عندك سؤال، رد عليها أو كلّمنا.
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>
