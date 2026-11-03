/**
 * Article text clean-up shared by the article page (render-time, non-destructive) and the editor
 * («نظّف المقال», writes the result back after the editor confirms).
 *
 *  - «صفحة التبرع: /donate?program=shade»     → «[صفحة التبرع](/donate?program=shade)»
 *  - a bare site path «… على /cases …»         → «… على [الحالات المفتوحة](/cases) …»
 *  - «https://elyusr.org/…» written as text    → a relative link
 * Paths already inside a Markdown link are left alone.
 */

/** Friendly names for site paths written bare in older articles. */
const PATH_LABELS: Array<[RegExp, string]> = [
  [/^\/donate\/track/, "تتبع تبرعك"],
  [/^\/donate\?program=([a-z0-9-]+)/, "صفحة التبرع"],
  [/^\/donate\?campaign=([a-z0-9-]+)/, "صفحة التبرع للحملة"],
  [/^\/donate/, "صفحة التبرع"],
  [/^\/cases\/[A-Z0-9-]+/i, "صفحة الحالة"],
  [/^\/cases/, "الحالات المفتوحة"],
  [/^\/programs\/([a-z0-9-]+)/, "صفحة البرنامج"],
  [/^\/programs/, "برامج اليسر"],
  [/^\/campaigns/, "حملات اليسر"],
  [/^\/zakat/, "حاسبة الزكاة"],
  [/^\/qurbani/, "صكوك الأضاحي"],
  [/^\/blog\//, "اقرأ المقال"],
  [/^\/contact/, "تواصل معنا"],
  [/^\/volunteer/, "التطوع معنا"],
  [/^\/stories/, "قصص الأثر"],
  [/^\/trust/, "الشفافية"],
];

export const labelForPath = (path: string) => PATH_LABELS.find(([re]) => re.test(path))?.[1] || path;

const PATH = String.raw`\/[a-z0-9][a-z0-9\-\/]*(?:\?[a-z0-9=&\-_]+)?`;

/** Turns bare site paths in one line into Markdown links. Pure; idempotent. */
export function linkifyBarePaths(line: string): string {
  if (!line.includes("/")) return line;
  let out = line
    // absolute links to the site written as plain text
    .replace(/(^|[\s(:：،])https?:\/\/(?:www\.)?elyusr\.org(\/[^\s)،,]*)/gi, (_m, pre, path) => `${pre}${path || "/"}`)
    // «صفحة التبرع: /donate?…» → the phrase becomes the link
    .replace(new RegExp(String.raw`(صفحة\s+[^\s:：،.]+(?:\s+[^\s:：،.]+)?)\s*[:：]\s*(${PATH})`, "gi"), (_m, phrase, path) => `[${phrase}](${path})`);
  // remaining bare paths (not inside "](" … ")" and not part of a URL)
  out = out.replace(new RegExp(String.raw`(^|[\s:：،])(${PATH})(?=$|[\s.,،؛)!?؟])`, "gi"), (m, pre, path, offset: number, whole: string) => {
    const before = whole.slice(0, offset + pre.length);
    if (/\]\($/.test(before) || /https?:\/\/\S*$/.test(before)) return m;
    return `${pre}[${labelForPath(path)}](${path})`;
  });
  return out;
}

export type ContentIssue = { id: string; level: "fix" | "warn"; text: string };

/** What to fix in an article body before publishing (shown in the editor). */
export function auditArticleBody(body: string, slug: string, focus: string): ContentIssue[] {
  const issues: ContentIssue[] = [];
  const lines = body.split(/\r?\n/);
  const bare = lines.filter((l) => linkifyBarePaths(l) !== l).length;
  if (bare) issues.push({ id: "bare-links", level: "fix", text: `${bare} سطر فيه رابط مكتوب كنص (زي /donate?program=…) — اضغط «نظّف المقال» يتحوّل لرابط` });
  if (slug && slug.includes("-")) {
    const asText = body.split(/\[[^\]]*\]\([^)]*\)/).join(" ").split(slug).length - 1;
    if (asText) issues.push({ id: "slug-as-text", level: "fix", text: `الرابط «${slug}» مكتوب ${asText} مرة كأنه كلمة في النص — حط مكانه الكلمة المفتاحية` });
  }
  if (slug && focus === slug) issues.push({ id: "focus-is-slug", level: "warn", text: "الكلمة المفتاحية لسه هي الرابط نفسه — اكتب الكلمة اللي الناس بتدوّر بيها (زي «سقيا الماء في الصيف»)" });
  if (!/^\*\*(الإجابة السريعة|الخلاصة|باختصار)/m.test(body)) issues.push({ id: "quick", level: "warn", text: "مفيش «**الإجابة السريعة:**» في الأول — دي اللي جوجل والذكاء الاصطناعي بيقتبسوها" });
  if (!/^##\s+(أسئلة شائعة|الأسئلة الشائعة)/m.test(body)) issues.push({ id: "faq", level: "warn", text: "مفيش قسم «## أسئلة شائعة» — الأسئلة بتظهر في نتايج البحث" });
  if (!/\]\(\/(donate|programs|cases|campaigns|food-box|zakat|qurbani)/.test(body)) issues.push({ id: "cta", level: "warn", text: "مفيش رابط لصفحة تبرع أو برنامج — المقال مش هيجيب تبرعات" });
  if (focus && !body.slice(0, 600).includes(focus)) issues.push({ id: "focus-early", level: "warn", text: `الكلمة المفتاحية «${focus}» مش موجودة في أول فقرة` });
  if (/(.)\1{4,}/.test(body)) issues.push({ id: "repeat", level: "warn", text: "في حروف متكررة كتير ورا بعض — راجع الكتابة" });
  return issues;
}

/** «نظّف المقال»: bare links → links, the slug written as a word → the focus keyword. */
export function cleanArticleBody(body: string, slug: string, focus: string): string {
  let out = body.split(/\r?\n/).map(linkifyBarePaths).join("\n");
  if (slug && slug.includes("-") && focus && focus !== slug) {
    // only outside Markdown links
    out = out.split(/(\[[^\]]*\]\([^)]*\))/).map((part) => (part.startsWith("[") ? part : part.split(slug).join(focus))).join("");
  }
  return out;
}
