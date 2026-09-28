import type { DbBlogPost } from "@/data/blogApi";

export type ScoreCheck = {
  key: string;
  ok: boolean;
  weight: number;     // total points this check is worth
  earned: number;     // earned points (0..weight)
  label: string;
  hint: string;       // why points are missing / how to fix
};

export type ScoreResult = {
  score: number;
  words: number;
  tagsCount: number;
  internalLinks: number;
  checks: ScoreCheck[];
};

export type DraftLike = {
  slug: string;
  category_ar: string;
  title_ar: string;
  excerpt_ar: string;
  body_ar: string;        // joined paragraphs
  tags_ar: string;        // comma-separated
  image_url: string;
  og_image_url: string;
  focus_keyword: string;
};

const range = (n: number, lo: number, hi: number) => n >= lo && n <= hi;
const between = (n: number, lo: number, hi: number, weight: number) => {
  if (range(n, lo, hi)) return weight;
  // partial credit when within ±25% of band
  const span = hi - lo;
  const dist = n < lo ? lo - n : n - hi;
  const ratio = Math.max(0, 1 - dist / Math.max(1, span * 0.5));
  return Math.round(weight * ratio * 0.6); // up to 60% partial
};

export const countInternalLinks = (body: string) =>
  (body.match(/\]\(\/blog\/[^)]+\)|<a[^>]+href=["']\/blog\/[^"']+["']/g) || []).length;

export const scoreDraft = (d?: Partial<DraftLike> | null, isRTL: boolean = true): ScoreResult => {
  const dSafe: DraftLike = {
    slug: d?.slug || "",
    category_ar: d?.category_ar || "",
    title_ar: d?.title_ar || "",
    excerpt_ar: d?.excerpt_ar || "",
    body_ar: d?.body_ar || "",
    tags_ar: d?.tags_ar || "",
    image_url: d?.image_url || "",
    og_image_url: d?.og_image_url || "",
    focus_keyword: d?.focus_keyword || "",
  };
  const tags = dSafe.tags_ar.split(",").map((s) => s.trim()).filter(Boolean);
  const words = dSafe.body_ar.split(/\s+/).filter(Boolean).length;
  const titleLen = dSafe.title_ar.length;
  const excerptLen = dSafe.excerpt_ar.length;
  const internalLinks = countInternalLinks(dSafe.body_ar);
  const fk = dSafe.focus_keyword.trim().toLowerCase();
  const inTitle = Boolean(fk && dSafe.title_ar.toLowerCase().includes(fk));
  const inExcerpt = Boolean(fk && dSafe.excerpt_ar.toLowerCase().includes(fk));
  const inBody = Boolean(fk && dSafe.body_ar.toLowerCase().includes(fk));

  const checks: ScoreCheck[] = [
    { key: "words", weight: 20, earned: words >= 600 ? 20 : between(words, 600, 1500, 20),
      ok: words >= 600,
      label: isRTL ? `عدد الكلمات (${words}/600)` : `Words (${words}/600)`,
      hint: isRTL ? "أضف فقرات أعمق وأمثلة وأسئلة شائعة لرفع الكلمات لـ 600+." : "Expand with examples & FAQs to reach 600+." },
    { key: "title", weight: 12, earned: range(titleLen, 30, 70) ? 12 : between(titleLen, 30, 70, 12),
      ok: range(titleLen, 30, 70),
      label: isRTL ? `طول العنوان (${titleLen} / 30-70)` : `Title length (${titleLen} / 30-70)`,
      hint: isRTL ? "اجعل العنوان بين 30-70 حرف ويبدأ بالكلمة المفتاحية." : "Keep title 30-70 chars, lead with focus keyword." },
    { key: "excerpt", weight: 12, earned: range(excerptLen, 80, 170) ? 12 : between(excerptLen, 80, 170, 12),
      ok: range(excerptLen, 80, 170),
      label: isRTL ? `طول الوصف (${excerptLen} / 80-170)` : `Excerpt length (${excerptLen} / 80-170)`,
      hint: isRTL ? "وصف 80-170 حرف يحوي فائدة + كلمة مفتاحية." : "Write 80-170 chars including the focus keyword." },
    { key: "tags", weight: 8, earned: tags.length >= 3 ? 8 : Math.min(tags.length * 3, 8),
      ok: tags.length >= 3,
      label: isRTL ? `الوسوم (${tags.length}/3)` : `Tags (${tags.length}/3)`,
      hint: isRTL ? "أضف 3 وسوم على الأقل ذات صلة." : "Add at least 3 relevant tags." },
    { key: "cover", weight: 10, earned: d.image_url ? 10 : 0, ok: !!d.image_url,
      label: isRTL ? "صورة الغلاف" : "Cover image",
      hint: isRTL ? "ارفع صورة غلاف بجودة عالية ≥1200px عرض." : "Upload a high-quality cover image (≥1200px wide)." },
    { key: "og", weight: 8, earned: d.og_image_url ? 8 : 0, ok: !!d.og_image_url,
      label: isRTL ? "صورة OG للسوشيال" : "OG image",
      hint: isRTL ? "ولّد صورة OG لمشاركة احترافية." : "Generate an OG image for social sharing." },
    { key: "category", weight: 5, earned: d.category_ar ? 5 : 0, ok: !!d.category_ar,
      label: isRTL ? "تصنيف" : "Category",
      hint: isRTL ? "اختر تصنيفًا مناسبًا." : "Set a category." },
    { key: "fk", weight: 5, earned: fk ? 5 : 0, ok: !!fk,
      label: isRTL ? "كلمة مفتاحية رئيسية" : "Focus keyword",
      hint: isRTL ? "حدّد الكلمة المفتاحية الرئيسية للمقال." : "Set a focus keyword." },
    { key: "fk-title", weight: 6, earned: inTitle ? 6 : 0, ok: !!inTitle,
      label: isRTL ? "الكلمة المفتاحية في العنوان" : "Focus keyword in title",
      hint: isRTL ? "ضع الكلمة المفتاحية في بداية العنوان." : "Include focus keyword in the title." },
    { key: "fk-excerpt", weight: 4, earned: inExcerpt ? 4 : 0, ok: !!inExcerpt,
      label: isRTL ? "الكلمة في الوصف" : "Keyword in excerpt",
      hint: isRTL ? "اذكر الكلمة المفتاحية في الوصف." : "Mention focus keyword in excerpt." },
    { key: "fk-body", weight: 4, earned: inBody ? 4 : 0, ok: !!inBody,
      label: isRTL ? "الكلمة في النص" : "Keyword in body",
      hint: isRTL ? "اذكر الكلمة المفتاحية في أول فقرة." : "Mention focus keyword in body." },
    { key: "links", weight: 6, earned: internalLinks >= 2 ? 6 : Math.min(internalLinks * 3, 6),
      ok: internalLinks >= 2,
      label: isRTL ? `روابط داخلية (${internalLinks}/2+)` : `Internal links (${internalLinks}/2+)`,
      hint: isRTL ? "أضف 2 رابط داخلي على الأقل لمقالات ذات صلة." : "Add at least 2 internal links to related posts." },
  ];

  const score = checks.reduce((s, c) => s + c.earned, 0);
  return { score: Math.min(100, score), words, tagsCount: tags.length, internalLinks, checks };
};

/* ----------------- Auto-optimize suggestions ----------------- */

export type Suggestion = {
  field: "title_ar" | "excerpt_ar" | "body_ar";
  reason: string;
  before: string;
  after: string;
};

const trimToBoundary = (s: string, max: number) => {
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const i = Math.max(cut.lastIndexOf(" "), cut.lastIndexOf("،"), cut.lastIndexOf(","));
  return (i > max * 0.6 ? cut.slice(0, i) : cut).trim().replace(/[،,.\-:]+$/, "");
};

export const buildSuggestions = (d: DraftLike, isRTL: boolean): Suggestion[] => {
  const out: Suggestion[] = [];
  const fk = (d.focus_keyword || "").trim();
  const cat = (d.category_ar || "").trim();

  // Title
  const t = d.title_ar.trim();
  if (t.length > 70) {
    out.push({
      field: "title_ar", before: t,
      after: trimToBoundary(t, 65) + (fk && !t.includes(fk) ? ` — ${fk}` : ""),
      reason: isRTL ? "قصّر العنوان إلى ≤70 حرف مع إبقاء الكلمة المفتاحية." : "Trim title to ≤70 chars while keeping focus keyword.",
    });
  } else if (t && t.length < 30) {
    const tail = fk && !t.includes(fk) ? ` — ${fk}` : cat ? ` | ${cat}` : "";
    const filler = isRTL ? " — دليل شامل وخطوات عملية" : " — Complete guide & steps";
    out.push({
      field: "title_ar", before: t,
      after: (t + tail + filler).slice(0, 68),
      reason: isRTL ? "وسّع العنوان لـ 30-70 حرف ليصبح أوضح في نتائج البحث." : "Expand title to 30-70 chars for better SERP CTR.",
    });
  }

  // Excerpt
  const ex = d.excerpt_ar.trim();
  if (ex.length > 170) {
    out.push({
      field: "excerpt_ar", before: ex, after: trimToBoundary(ex, 165) + "…",
      reason: isRTL ? "قصّر الوصف إلى ≤170 حرف عند نهاية جملة طبيعية." : "Trim excerpt to ≤170 chars at a clean sentence break.",
    });
  } else if (ex.length < 80) {
    const padFK = fk && !ex.includes(fk) ? ` ${isRTL ? "تعرف على" : "Learn about"} ${fk}.` : "";
    const padCat = cat ? ` ${isRTL ? "ضمن قسم" : "In"} ${cat}.` : "";
    const tip = isRTL ? " اقرأ الدليل الكامل لاتخاذ قرار صحيح." : " Read the full guide to decide right.";
    let next = (ex + padFK + padCat + tip).trim();
    if (next.length < 80) next = next + (isRTL ? " نصائح، أمثلة، وأسعار محدثة." : " Tips, examples, and updated prices.");
    out.push({
      field: "excerpt_ar", before: ex, after: trimToBoundary(next, 168),
      reason: isRTL ? "وسّع الوصف لـ 80-170 حرف مع تضمين الكلمة المفتاحية." : "Expand excerpt to 80-170 chars including focus keyword.",
    });
  }

  // Body words
  const words = d.body_ar.split(/\s+/).filter(Boolean).length;
  if (words < 600) {
    const need = 600 - words;
    const fkOrTopic = fk || cat || (isRTL ? "هذا الموضوع" : "this topic");
    const extra = isRTL
      ? `\n\n## أسئلة شائعة عن ${fkOrTopic}\n\n**ما أبرز فوائد ${fkOrTopic}؟**\n${fkOrTopic} يقدّم حلولاً عملية تختصر الوقت والتكلفة وتُحسّن النتائج طويلة المدى.\n\n**ما الأخطاء الشائعة؟**\nتجاهل التخطيط المسبق، إهمال المتابعة، وعدم قياس الأثر بعد التنفيذ.\n\n**كيف أبدأ بخطوات بسيطة؟**\nابدأ بهدف واضح وقابل للقياس، ثم نفّذ على دفعات صغيرة وحسّن باستمرار.\n\n## خلاصة\nاستثمار وقتك في ${fkOrTopic} يعطي أثرًا تراكميًا واضحًا. ابدأ اليوم وتابع باستمرار للحصول على أفضل النتائج.`
      : `\n\n## FAQ about ${fkOrTopic}\n\n**Top benefits of ${fkOrTopic}?**\nIt saves time, cuts cost, and improves long-term outcomes.\n\n**Common mistakes?**\nSkipping planning, no follow-up, and no measurement.\n\n**How to start simply?**\nSet a clear measurable goal, ship in small batches, iterate.\n\n## Summary\nInvesting in ${fkOrTopic} compounds. Start today and stay consistent.`;
    out.push({
      field: "body_ar", before: d.body_ar, after: d.body_ar.trimEnd() + extra,
      reason: isRTL ? `أضف قسم أسئلة شائعة وخلاصة لتعويض ~${need} كلمة ناقصة.` : `Append FAQ + summary to add ~${need} words.`,
    });
  }

  // Ensure focus keyword appears in body
  if (fk && !d.body_ar.toLowerCase().includes(fk)) {
    const intro = isRTL
      ? `في هذا الدليل نعرض ${fk} بأسلوب عملي مع أمثلة وخطوات قابلة للتطبيق فورًا.\n\n`
      : `In this guide we cover ${fk} with practical, actionable steps and examples.\n\n`;
    out.push({
      field: "body_ar",
      before: d.body_ar,
      after: intro + d.body_ar,
      reason: isRTL ? "أضف فقرة افتتاحية تذكر الكلمة المفتاحية في بداية النص." : "Add an opening sentence that mentions the focus keyword.",
    });
  }

  return out;
};

/* ----------------- Related posts ----------------- */

export type RelatedSuggestion = {
  slug: string;
  title: string;
  reason: string;
  alreadyLinked: boolean;
  score: number;
};

export const suggestRelated = (
  current: DraftLike,
  pool: DbBlogPost[],
  isRTL: boolean,
  limit = 6,
): RelatedSuggestion[] => {
  const myTags = new Set((current.tags_ar || "").split(",").map((t) => t.trim()).filter(Boolean));
  const myCat = (current.category_ar || "").trim();
  const fk = (current.focus_keyword || "").trim().toLowerCase();
  const linked = new Set(
    Array.from(current.body_ar.matchAll(/\/blog\/([a-z0-9-]+)/gi)).map((m) => m[1]),
  );

  const results: RelatedSuggestion[] = pool
    .filter((p) => p.slug !== current.slug)
    .map((p) => {
      let score = 0;
      const reasons: string[] = [];
      const shared = (p.tags_ar || []).filter((t) => myTags.has(t));
      if (shared.length) { score += shared.length * 3; reasons.push(`${shared.length} ${isRTL ? "وسم مشترك" : "shared tags"}`); }
      if (p.category_ar === myCat && myCat) { score += 4; reasons.push(isRTL ? "نفس التصنيف" : "same category"); }
      if (fk && (p.title_ar.toLowerCase().includes(fk) || p.excerpt_ar.toLowerCase().includes(fk))) {
        score += 5; reasons.push(isRTL ? "يطابق الكلمة المفتاحية" : "keyword match");
      }
      return { slug: p.slug, title: p.title_ar || p.slug, reason: reasons.join(" · ") || (isRTL ? "اقتراح عام" : "general"), alreadyLinked: linked.has(p.slug), score };
    })
    .filter((r) => r.score > 0 || true)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return results;
};