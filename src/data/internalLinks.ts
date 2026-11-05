/**
 * Auto internal-link engine: turns Egyptian-Arabic keywords inside article
 * bodies into contextual anchor links pointing to programs / donate / about.
 * Improves topical authority + on-page SEO without manual editing per post.
 */

export type LinkRule = {
  match: RegExp;          // first match per article wins (per rule)
  href: string;
  ar: string;             // anchor text override (Egyptian dialect) — optional
};

/** Order matters: more specific rules first. */
export const INTERNAL_LINK_RULES: LinkRule[] = [
  { match: /صك\s*الأضحية/, href: "/qurbani", ar: "صك الأضحية" },
  { match: /كرتونة\s*العزومة|كرتونة\s*رمضان|كرتونة\s*غذائية/, href: "/programs/box", ar: "كرتونة العزومة" },
  { match: /كفالة\s*يتيم|الأيتام/, href: "/programs/orphans", ar: "كفالة يتيم" },
  { match: /زكاة\s*المال|حاسبة\s*الزكاة/, href: "/donate?type=zakat", ar: "احسب زكاتك" },
  { match: /زكاة\s*الفطر/, href: "/donate?type=zakat-fitr", ar: "زكاة الفطر" },
  { match: /قافلة\s*طبية|قوافل\s*طبية|علاج|أدوية/, href: "/programs/treatment", ar: "برنامج الصحة" },
  { match: /مطبخ\s*اليسر|وجبة\s*ساخنة|إفطار\s*صائم/, href: "/programs/kitchen", ar: "مطبخ اليسر" },
  { match: /ادفع\s*مصروفه|كفالة\s*تعليمية|وقفية\s*التعليم/, href: "/programs/education", ar: "ادفع مصروفه" },
  { match: /سقيا\s*الماء|وصلة\s*مياه/, href: "/programs/water", ar: "سقيا الماء" },
  { match: /ستر\s*وتسقيف|ترميم/, href: "/programs/shelter", ar: "ستر وتسقيف" },
  { match: /تيسير\s*زواج|جواز\s*عروسة/, href: "/programs/bride", ar: "تيسير زواج" },
  { match: /شفافية|تقرير\s*سنوي/, href: "/about#transparency", ar: "شفافية اليسر" },
  { match: /مين\s*احنا|عن\s*اليسر|مؤسسة\s*اليسر/, href: "/about", ar: "مؤسسة اليسر" },
  { match: /تبرع|تبرعك|ساهم/, href: "/donate", ar: "تبرع الآن" },
];

/**
 * Inject up to `max` distinct internal links into a paragraph.
 * Returns an array of plain strings + anchor descriptors so React can render.
 */
export type Token = { type: "text"; value: string } | { type: "link"; href: string; text: string };

export function linkifyParagraph(
  text: string,
  used: Set<string>,
  max = 1,
): Token[] {
  let placed = 0;
  let remaining = text;
  const out: Token[] = [];
  for (const rule of INTERNAL_LINK_RULES) {
    if (placed >= max) break;
    if (used.has(rule.href)) continue;
    const m = remaining.match(rule.match);
    if (!m || m.index === undefined) continue;
    const before = remaining.slice(0, m.index);
    const matched = remaining.slice(m.index, m.index + m[0].length);
    if (before) out.push({ type: "text", value: before });
    out.push({ type: "link", href: rule.href, text: matched });
    remaining = remaining.slice(m.index + m[0].length);
    used.add(rule.href);
    placed++;
  }
  if (remaining) out.push({ type: "text", value: remaining });
  return out;
}

/** Linkify an entire body (array of paragraphs). One link per paragraph, max 4 total. */
export function linkifyBody(body: string[], totalMax = 4): Token[][] {
  const used = new Set<string>();
  let placed = 0;
  return body.map((p) => {
    if (placed >= totalMax) return [{ type: "text", value: p }];
    const tokens = linkifyParagraph(p, used, 1);
    if (tokens.some((t) => t.type === "link")) placed++;
    return tokens;
  });
}