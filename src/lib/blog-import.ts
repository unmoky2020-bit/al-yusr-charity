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
  title_en: string;
  excerpt_ar: string;
  excerpt_en: string;
  category_ar: string;
  category_en: string;
  focus_keyword: string;
  tags_ar: string[];
  tags_en: string[];
  body_ar: string[];
  body_en: string[];
  /** «تاريخ النشر المقترح» as written, when the file has one */
  suggested_date?: string;
  words: number;
  problems: string[];
};

const KEYS: Record<string, keyof ImportedArticle | "skip"> = {
  "العنوان": "title_ar",
  "العنوان بالإنجليزية": "title_en",
  "English title": "title_en",
  "الرابط": "slug",
  "الوصف": "excerpt_ar",
  "الوصف بالإنجليزية": "excerpt_en",
  "English description": "excerpt_en",
  "التصنيف": "category_ar",
  "التصنيف بالإنجليزية": "category_en",
  "English category": "category_en",
  "الكلمة الأساسية": "focus_keyword",
  "الكلمة المفتاحية": "focus_keyword",
  "كلمات قريبة": "tags_ar",
  "الكلمات المفتاحية": "tags_ar",
  "كلمات قريبة بالإنجليزية": "tags_en",
  "English related keywords": "tags_en",
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
  const bodyLines = lines.slice(i);
  const englishMarker = bodyLines.findIndex((line) => /^##\s+(?:english version|النسخة الإنجليزية)\s*$/i.test(line.trim()));
  const arabicLines = englishMarker >= 0 ? bodyLines.slice(0, englishMarker) : bodyLines;
  const englishLines = englishMarker >= 0 ? bodyLines.slice(englishMarker + 1) : [];
  const extractBody = (source: string[]) => {
    let title = "";
    const h1 = source.findIndex((line) => /^#\s+/.test(line.trim()));
    if (h1 >= 0 && source.slice(0, h1).every((line) => !line.trim())) {
      title = source[h1].replace(/^#\s+/, "").trim();
      source = source.slice(h1 + 1);
    }
    const body = source.join("\n").trim();
    return {
      title,
      paragraphs: body.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean),
      words: body.replace(/[#*|>\-[\]()]/g, " ").split(/\s+/).filter(Boolean).length,
    };
  };
  const arabic = extractBody(arabicLines);
  const english = extractBody(englishLines);
  const title = meta.title_ar || arabic.title;
  const titleEn = meta.title_en || english.title;
  const slug = slugify(meta.slug || file.replace(/\.[^.]+$/, "").replace(/^\d+\s*/, "")) || slugify(title);
  const tags = (meta.tags_ar || "").split(/[،,]/).map((t) => t.trim()).filter(Boolean);
  const tagsEn = (meta.tags_en || "").split(/[،,]/).map((t) => t.trim()).filter(Boolean);
  const out: ImportedArticle = {
    file,
    slug,
    title_ar: title,
    title_en: titleEn,
    excerpt_ar: meta.excerpt_ar || "",
    excerpt_en: meta.excerpt_en || "",
    category_ar: meta.category_ar || "مقالات",
    category_en: meta.category_en || "",
    focus_keyword: meta.focus_keyword || "",
    tags_ar: meta.focus_keyword && !tags.includes(meta.focus_keyword) ? [meta.focus_keyword, ...tags] : tags,
    tags_en: tagsEn,
    body_ar: arabic.paragraphs,
    body_en: english.paragraphs,
    words: arabic.words + english.words,
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
