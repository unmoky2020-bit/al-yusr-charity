import type { BlogPost } from "@/data/blog";
import { lintArticleSchema, type SchemaIssue } from "./lint-jsonld";
import { readingTime } from "@/data/blogTaxonomy";

export type SeoAudit = {
  slug: string;
  title: string;
  url: string;
  score: number;
  words: number;
  minutes: number;
  titleLen: number;
  descLen: number;
  tagsCount: number;
  hasOg: boolean;
  hasCategory: boolean;
  signals: { name: string; ok: boolean; advice?: string }[];
  schemaIssues: SchemaIssue[];
  openGraph: Record<string, string>;
  generatedAt: string;
};

export const auditPost = (post: BlogPost, baseUrl = "https://elyusr.org"): SeoAudit => {
  const rt = readingTime(post, "ar");
  const titleLen = post.ar.title.length;
  const descLen = post.ar.excerpt.length;
  const tagsCount = post.ar.tags?.length ?? 0;
  const hasOg = !!post.image;
  const hasCategory = !!post.category?.ar;
  const url = `${baseUrl}/blog/${post.slug}`;

  let score = 0;
  if (rt.words >= 600) score += 25; else if (rt.words >= 300) score += 15;
  if (titleLen >= 30 && titleLen <= 70) score += 15;
  if (descLen >= 80 && descLen <= 170) score += 15;
  if (tagsCount >= 3) score += 10;
  if (hasOg) score += 15;
  score += 10; // schema auto-emitted by BlogPost.tsx
  if (hasCategory) score += 10;

  const signals: SeoAudit["signals"] = [
    { name: "WordCount ≥ 600", ok: rt.words >= 600, advice: rt.words < 600 ? `أضِف ${600 - rt.words} كلمة على الأقل.` : undefined },
    { name: "Title length 30–70", ok: titleLen >= 30 && titleLen <= 70, advice: titleLen < 30 ? "العنوان قصير — أَطِله." : titleLen > 70 ? "العنوان طويل — اختصره." : undefined },
    { name: "Description length 80–170", ok: descLen >= 80 && descLen <= 170, advice: descLen < 80 ? "الوصف قصير." : descLen > 170 ? "الوصف طويل." : undefined },
    { name: "Tags ≥ 3", ok: tagsCount >= 3, advice: tagsCount < 3 ? "أضِف وسوماً أكثر." : undefined },
    { name: "OG image present", ok: hasOg, advice: !hasOg ? "ولّد صورة OG." : undefined },
    { name: "Category set", ok: hasCategory },
    { name: "Article + Breadcrumb JSON-LD", ok: true },
  ];

  return {
    slug: post.slug,
    title: post.ar.title,
    url,
    score,
    words: rt.words,
    minutes: rt.minutes,
    titleLen,
    descLen,
    tagsCount,
    hasOg,
    hasCategory,
    signals,
    schemaIssues: lintArticleSchema(post),
    openGraph: {
      "og:title": post.ar.title,
      "og:description": post.ar.excerpt,
      "og:image": post.image,
      "og:url": url,
      "og:type": "article",
      "og:locale": "ar_EG",
      "article:section": post.category.ar,
      "article:tag": (post.ar.tags || []).join(", "),
    },
    generatedAt: new Date().toISOString(),
  };
};

export const downloadJson = (audit: SeoAudit) => {
  // Prepend UTF-8 BOM so Arabic text opens correctly in editors that auto-detect encoding
  const json = JSON.stringify(audit, null, 2);
  const blob = new Blob(["\ufeff" + json], { type: "application/json;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `seo-${audit.slug}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
};

/* Escape HTML special chars to avoid breaking the printable template */
const esc = (v: unknown) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * Build a printable, RTL-aware HTML document with full Arabic shaping.
 * Opens in a new window and triggers the browser's native "Save as PDF"
 * dialog — using system Arabic fonts ensures glyphs render correctly
 * (jsPDF cannot shape/render Arabic without a custom embedded font).
 */
export const downloadPdf = (audit: SeoAudit) => {
  const tone =
    audit.score >= 85 ? "#10b981" : audit.score >= 60 ? "#f59e0b" : "#dc2626";

  const signalsRows = audit.signals
    .map(
      (s) => `
        <tr>
          <td class="ok"><span class="${s.ok ? "tick" : "cross"}">${s.ok ? "✓" : "✗"}</span></td>
          <td><b>${esc(s.name)}</b></td>
          <td class="advice">${esc(s.advice || "—")}</td>
        </tr>`,
    )
    .join("");

  const schemaRows = audit.schemaIssues.length
    ? audit.schemaIssues
        .map(
          (it) => `
        <tr>
          <td><span class="lvl ${it.level}">${esc(it.level.toUpperCase())}</span></td>
          <td><code>${esc(it.field)}</code></td>
          <td>${esc(it.message)}</td>
        </tr>`,
        )
        .join("")
    : `<tr><td colspan="3" class="ok-row">لا توجد مشكلات — السكيمة صحيحة.</td></tr>`;

  const ogRows = Object.entries(audit.openGraph)
    .map(
      ([k, v]) => `
      <tr><th><code>${esc(k)}</code></th><td>${esc(v)}</td></tr>`,
    )
    .join("");

  const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<title>تقرير SEO — ${esc(audit.title || audit.slug)}</title>
<style>
  @page { size: A4; margin: 18mm; }
  :root {
    --ink:#0f172a; --muted:#64748b; --border:#e2e8f0;
    --bg:#ffffff; --card:#f8fafc; --accent:${tone};
  }
  * { box-sizing: border-box; }
  html, body { margin:0; padding:0; background:var(--bg); color:var(--ink); }
  body {
    font-family: "Cairo", "Tajawal", "Noto Naskh Arabic", "IBM Plex Sans Arabic",
                 "Segoe UI", "Tahoma", "Arial", system-ui, sans-serif;
    font-size: 12pt; line-height: 1.7; direction: rtl;
  }
  header { display:flex; justify-content:space-between; align-items:flex-start; gap:16px;
           border-bottom: 2px solid var(--border); padding-bottom: 12px; margin-bottom: 16px; }
  h1 { font-size: 18pt; margin: 0 0 4px; color:#0b3d2e; }
  h2 { font-size: 13pt; margin: 18px 0 8px; color:#0b3d2e; border-bottom:1px solid var(--border); padding-bottom: 4px; }
  .meta { color: var(--muted); font-size: 10pt; }
  .url { direction: ltr; unicode-bidi: bidi-override; word-break: break-all; }
  .score-badge {
    background: var(--accent); color:#fff; padding: 14px 18px; border-radius: 12px;
    text-align:center; min-width: 120px;
  }
  .score-badge .n { font-size: 26pt; font-weight: 800; line-height: 1; }
  .score-badge .l { font-size: 9pt; opacity: .9; letter-spacing: .04em; }
  .stats { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin: 8px 0 16px; }
  .stat { background: var(--card); border:1px solid var(--border); border-radius: 8px; padding: 8px 10px; }
  .stat b { display:block; font-size: 10pt; color: var(--muted); font-weight:600; }
  .stat span { font-size: 14pt; font-weight: 800; color: var(--ink); }
  table { width: 100%; border-collapse: collapse; font-size: 11pt; }
  th, td { border: 1px solid var(--border); padding: 6px 9px; vertical-align: top; text-align: start; }
  th { background: var(--card); font-weight: 700; }
  td.ok { width: 36px; text-align:center; }
  td.advice { color: var(--muted); }
  .tick { color:#16a34a; font-weight: 800; }
  .cross { color:#dc2626; font-weight: 800; }
  .ok-row { color:#16a34a; text-align:center; font-weight: 700; }
  .lvl { display:inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9pt; font-weight: 800; }
  .lvl.error { background:#fee2e2; color:#991b1b; }
  .lvl.warning { background:#fef3c7; color:#92400e; }
  code { font-family: "JetBrains Mono", "Cairo", monospace; direction: ltr; unicode-bidi: bidi-override; }
  .og th { width: 28%; }
  .og td { direction: ltr; unicode-bidi: bidi-override; word-break: break-all; }
  .footer { margin-top: 18px; font-size: 9pt; color: var(--muted); text-align:center; }
  @media print { .no-print { display: none !important; } }
  .no-print {
    position: sticky; top: 0; background: #0b3d2e; color:#fff;
    padding: 8px 14px; display:flex; justify-content:space-between; gap:12px;
    margin: -18mm -18mm 18px; border-radius: 0;
  }
  .no-print button { background:#fff; color:#0b3d2e; border:0; padding:6px 14px;
                     border-radius: 6px; font-weight: 800; cursor:pointer; }
</style>
</head>
<body>
  <div class="no-print">
    <span>اضغط طباعة ثم اختر «حفظ كـ PDF» — يدعم العربية بالكامل.</span>
    <span>
      <button onclick="window.print()">طباعة / حفظ PDF</button>
    </span>
  </div>

  <header>
    <div>
      <h1>تقرير تدقيق SEO — ${esc(audit.title || audit.slug)}</h1>
      <div class="meta">المعرّف: <code>${esc(audit.slug)}</code></div>
      <div class="meta">الرابط: <span class="url">${esc(audit.url)}</span></div>
      <div class="meta">تاريخ التوليد: ${esc(audit.generatedAt)}</div>
    </div>
    <div class="score-badge">
      <div class="n">${audit.score}<span style="font-size:14pt">/100</span></div>
      <div class="l">SEO SCORE</div>
    </div>
  </header>

  <div class="stats">
    <div class="stat"><b>عدد الكلمات</b><span>${audit.words}</span></div>
    <div class="stat"><b>زمن القراءة</b><span>${audit.minutes} د</span></div>
    <div class="stat"><b>عدد الوسوم</b><span>${audit.tagsCount}</span></div>
    <div class="stat"><b>طول العنوان</b><span>${audit.titleLen}</span></div>
    <div class="stat"><b>طول الوصف</b><span>${audit.descLen}</span></div>
    <div class="stat"><b>صورة OG</b><span>${audit.hasOg ? "✓" : "✗"}</span></div>
  </div>

  <h2>الإشارات (Signals)</h2>
  <table>
    <thead><tr><th>الحالة</th><th>المعيار</th><th>الملاحظات</th></tr></thead>
    <tbody>${signalsRows}</tbody>
  </table>

  <h2>مشكلات السكيمة (JSON-LD)</h2>
  <table>
    <thead><tr><th>المستوى</th><th>الحقل</th><th>الرسالة</th></tr></thead>
    <tbody>${schemaRows}</tbody>
  </table>

  <h2>وسوم Open Graph</h2>
  <table class="og">
    <tbody>${ogRows}</tbody>
  </table>

  <div class="footer">© مؤسسة اليُسر الخيرية — تم التوليد بواسطة لوحة تحكم المدوّنة.</div>

  <script>
    // Auto-open print dialog after fonts load for fastest path to "Save as PDF"
    window.addEventListener("load", function () {
      setTimeout(function () { try { window.print(); } catch (e) {} }, 350);
    });
  </script>
</body>
</html>`;

  const w = window.open("", "_blank", "noopener,noreferrer,width=900,height=1100");
  if (!w) {
    // Fallback: download the HTML so the user can open and print it manually
    const blob = new Blob(["\ufeff" + html], { type: "text/html;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `seo-${audit.slug}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
};

/* CSV export with UTF-8 BOM so Excel/Numbers open Arabic correctly */
export const downloadCsv = (audit: SeoAudit) => {
  const q = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows: (string | number)[][] = [
    ["Field", "Value"],
    ["slug", audit.slug],
    ["title", audit.title],
    ["url", audit.url],
    ["score", audit.score],
    ["words", audit.words],
    ["minutes", audit.minutes],
    ["title_length", audit.titleLen],
    ["description_length", audit.descLen],
    ["tags_count", audit.tagsCount],
    ["has_og", audit.hasOg ? "yes" : "no"],
    ["has_category", audit.hasCategory ? "yes" : "no"],
    ["generated_at", audit.generatedAt],
    [],
    ["Signal", "OK", "Advice"],
    ...audit.signals.map((s) => [s.name, s.ok ? "yes" : "no", s.advice || ""]),
    [],
    ["Schema Level", "Field", "Message"],
    ...audit.schemaIssues.map((it) => [it.level, it.field, it.message]),
    [],
    ["OG Key", "OG Value"],
    ...Object.entries(audit.openGraph).map(([k, v]) => [k, v]),
  ];
  const csv = rows.map((r) => r.map(q).join(",")).join("\r\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `seo-${audit.slug}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
};
