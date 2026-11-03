<?xml version="1.0" encoding="UTF-8"?>
<!-- Human view of /sitemap.xml (search engines read the XML; browsers show this page). -->
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:s="http://www.sitemaps.org/schemas/sitemap/0.9" exclude-result-prefixes="s">
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html lang="ar" dir="rtl">
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <meta name="robots" content="noindex"/>
        <title>خريطة الموقع — مؤسسة اليسر الخيرية</title>
        <style>
          :root{--g:#0b4429;--g2:#06301c;--lime:#a3e635;--bg:#f7f9f4;--line:#e3eadc;--muted:#5d6b62}
          *{box-sizing:border-box}
          body{margin:0;background:var(--bg);color:#13261a;font:15px/1.6 system-ui,-apple-system,"Segoe UI",Tahoma,sans-serif}
          header{background:linear-gradient(135deg,var(--g2),var(--g));color:#fff;padding:32px 16px 40px;text-align:center}
          header h1{margin:0;font-size:26px} header p{margin:8px auto 0;max-width:640px;opacity:.85}
          .stat{display:inline-block;margin-top:14px;background:rgba(255,255,255,.12);padding:6px 14px;border-radius:999px;font-weight:800}
          .stat b{color:var(--lime);font-size:18px}
          main{max-width:1100px;margin:-22px auto 40px;padding:0 16px}
          .card{background:#fff;border:1px solid var(--line);border-radius:18px;overflow:hidden;box-shadow:0 10px 30px -20px rgba(6,48,28,.35)}
          table{width:100%;border-collapse:collapse}
          th{background:#eef5e6;color:var(--g);font-size:12px;text-align:right;padding:10px 14px;position:sticky;top:0}
          td{padding:9px 14px;border-top:1px solid var(--line);font-size:13.5px;vertical-align:top}
          td a{display:inline-block;color:var(--g);text-decoration:none;font-weight:700;word-break:break-all;direction:ltr;unicode-bidi:isolate}
          td a:hover{text-decoration:underline}
          tr:nth-child(even) td{background:#fbfdf9}
          .muted{color:var(--muted);font-size:12px;white-space:nowrap}
          .p{display:inline-block;min-width:38px;text-align:center;border-radius:999px;background:#eef5e6;color:var(--g);font-weight:800;font-size:12px;padding:1px 8px}
          footer{text-align:center;color:var(--muted);font-size:12px;margin:24px 0}
          @media (max-width:640px){.hide-sm{display:none}}
        </style>
      </head>
      <body>
        <header>
          <h1>خريطة موقع مؤسسة اليسر الخيرية</h1>
          <p>كل صفحات الموقع اللي محركات البحث بتأرشفها: البرامج، الحالات، المقالات، القصص وصفحات المدن. بتتحدّث لوحدها كل ما ننشر حاجة جديدة.</p>
          <span class="stat"><b><xsl:value-of select="count(s:urlset/s:url)"/></b> صفحة</span>
        </header>
        <main>
          <div class="card">
            <table>
              <thead><tr><th>الصفحة</th><th class="hide-sm">آخر تحديث</th><th class="hide-sm">التكرار</th><th>الأولوية</th></tr></thead>
              <tbody>
                <xsl:for-each select="s:urlset/s:url">
                  <xsl:sort select="s:priority" order="descending" data-type="number"/>
                  <tr>
                    <td><a href="{s:loc}"><xsl:value-of select="substring-after(s:loc,'https://elyusr.org')"/><xsl:if test="substring-after(s:loc,'https://elyusr.org')='/'"> (الرئيسية)</xsl:if></a></td>
                    <td class="muted hide-sm"><xsl:value-of select="s:lastmod"/></td>
                    <td class="muted hide-sm"><xsl:value-of select="s:changefreq"/></td>
                    <td><span class="p"><xsl:value-of select="s:priority"/></span></td>
                  </tr>
                </xsl:for-each>
              </tbody>
            </table>
          </div>
          <footer><a href="https://elyusr.org/">elyusr.org</a> · ملف XML للمحركات — العرض ده للزوار بس</footer>
        </main>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
