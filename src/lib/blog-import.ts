/**
 * Import ready-made articles (Markdown) into the blog.
 *
 * File shape (the team's template):
 *   | الحقل | القيمة |
 *   |---|---|
 *   | العنوان | … |   | الرابط | slug |   | الوصف | … |   | التصنيف | … |
 *   | الكلمة الأساسية | … |   | كلمات قريبة | a، b، c |   | تاريخ النشر المقترح | … |
 *   ---
 *   # Title
 *   body in Markdown (## headings, lists, tables, **bold**, [links](/path), «## أسئلة شائعة», «**المصادر:**»)
 * A file without the table still imports: the first "# " line is the title and the slug is made from the file name.
 */
export type ImportedArticle = {
  file: string;
  slug: string;
  title_ar: string;
  excerpt_ar: string;
  category_ar: string;
  focus_keyword: string;
  tags_ar: string[];
  body_ar: string[];
  /** «تاريخ النشر المقترح» as written, when the file has one */
  suggested_date?: string;
  words: number;
  problems: string[];
};

const KEYS: Record<string, keyof ImportedArticle | "skip"> = {
  "العنوان": "title_ar",
  "الرابط": "slug",
  "الوصف": "excerpt_ar",
  "التصنيف": "category_ar",
  "الكلمة الأساسية": "focus_keyword",
  "الكلمة المفتاحية": "focus_keyword",
  "كلمات قريبة": "tags_ar",
  "الكلمات المفتاحية": "tags_ar",
  "تاريخ النشر المقترح": "suggested_date",
  "الحقل": "skip",
};

export const slugify = (v: string) =>
  v
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9؀-ۿ\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

export function parseArticleMarkdown(text: string, file = ""): ImportedArticle {
  const src = text.replace(/\r\n?/g, "\n").replace(/^\uFEFF/, "");
  const lines = src.split("\n");
  const meta: Record<string, string> = {};
  let i = 0;
  // metadata table at the top
  while (i < lines.length && (lines[i].trim() === "" || lines[i].trim().startsWith("|"))) {
    const row = lines[i].trim();
    if (row.startsWith("|") && !/^\|?\s*:?-{2,}/.test(row)) {
      const [k, ...v] = row.replace(/^\||\|$/g, "").split("|").map((x) => x.trim());
      const key = KEYS[k];
      if (key && key !== "skip") meta[key] = v.join("|").trim();
    }
    i++;
  }
  if (lines[i]?.trim().match(/^-{3,}$/)) i++;
  let bodyLines = lines.slice(i);
  // the first "# Title" is the page title, not body
  const h1 = bodyLines.findIndex((l) => /^#\s+/.test(l.trim()));
  let h1Title = "";
  if (h1 >= 0 && bodyLines.slice(0, h1).every((l) => !l.trim())) {
    h1Title = bodyLines[h1].replace(/^#\s+/, "").trim();
    bodyLines = bodyLines.slice(h1 + 1);
  }
  const body = bodyLines.join("\n").trim();
  const paragraphs = body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const words = body.replace(/[#*|>\-[\]()]/g, " ").split(/\s+/).filter(Boolean).length;

  const title = meta.title_ar || h1Title;
  const slug = slugify(meta.slug || file.replace(/\.[^.]+$/, "").replace(/^\d+\s*/, "")) || slugify(title);
  const tags = (meta.tags_ar || "").split(/[،,]/).map((t) => t.trim()).filter(Boolean);
  const out: ImportedArticle = {
    file,
    slug,
    title_ar: title,
    excerpt_ar: meta.excerpt_ar || "",
    category_ar: meta.category_ar || "مقالات",
    focus_keyword: meta.focus_keyword || "",
    tags_ar: meta.focus_keyword && !tags.includes(meta.focus_keyword) ? [meta.focus_keyword, ...tags] : tags,
    body_ar: paragraphs,
    words,
    problems: [],
  };
  if (meta.suggested_date) out.suggested_date = meta.suggested_date;
  if (!out.title_ar) out.problems.push("مفيش عنوان");
  if (!/^[a-z0-9-]+$/.test(out.slug)) out.problems.push("الرابط لازم يكون حروف إنجليزي صغيرة وأرقام وشرطات");
  if (!out.body_ar.length) out.problems.push("المقال فاضي");
  if (out.excerpt_ar && (out.excerpt_ar.length < 80 || out.excerpt_ar.length > 170)) out.problems.push(`الوصف ${out.excerpt_ar.length} حرف (الأفضل 80–170)`);
  if (out.title_ar.length > 70) out.problems.push(`العنوان ${out.title_ar.length} حرف (الأفضل لحد 70)`);
  return out;
}
