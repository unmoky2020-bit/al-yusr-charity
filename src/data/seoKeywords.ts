/**
 * The keyword plan (docs/seo-keywords.csv, built into the dashboard) and the helpers of «خريطة السيو».
 * Columns: الكلمة, المجموعة, الصفحة المالكة, ظهرنا فيها (GSC), حجم البحث (Semrush), الترتيب الحالي.
 */
import csvRaw from "../../docs/seo-keywords.csv?raw";
import type { SeoProgress, SeoProgressEntry } from "@/data/siteBlocks";

export type SeoKeyword = { keyword: string; group: string; page: string; seenInGsc: boolean; volume: string; note: string };
export type SeoTier = "top3" | "top10" | "top20" | "far" | "untracked";

/** Minimal CSV reader (quotes, commas inside quotes, BOM). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let q = false;
  const t = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (q) {
      if (ch === '"' && t[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') q = false;
      else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && t[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((c) => c.trim())) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim())) rows.push(row);
  return rows;
}

export function keywordsFromCsv(text: string): SeoKeyword[] {
  return parseCsv(text).slice(1).map((r) => ({
    keyword: (r[0] ?? "").trim(),
    group: (r[1] ?? "").trim(),
    page: (r[2] ?? "").trim(),
    seenInGsc: /نعم|yes|✓/i.test(r[3] ?? ""),
    volume: (r[4] ?? "").trim(),
    note: (r[5] ?? "").trim(),
  })).filter((k) => k.keyword);
}

export const SEO_KEYWORDS: SeoKeyword[] = keywordsFromCsv(csvRaw);

export function tierOf(e: SeoProgressEntry | undefined): SeoTier {
  if (!e || e.pos === null || e.pos === undefined) return e && e.date ? "far" : "untracked";
  if (e.pos <= 3) return "top3";
  if (e.pos <= 10) return "top10";
  if (e.pos <= 20) return "top20";
  return "far";
}

export const TIER_AR: Record<SeoTier, string> = {
  top3: "في أول 3",
  top10: "الصفحة الأولى",
  top20: "الصفحة التانية",
  far: "بعيد / مش ظاهر",
  untracked: "لسه ما اتقاسش",
};

/** Counts per tier, overall and per group. */
export function summarize(list: SeoKeyword[], progress: SeoProgress) {
  const blank = (): Record<SeoTier, number> => ({ top3: 0, top10: 0, top20: 0, far: 0, untracked: 0 });
  const all = blank();
  const groups = new Map<string, { page: string; total: number; tiers: Record<SeoTier, number> }>();
  for (const k of list) {
    const t = tierOf(progress[k.keyword]);
    all[t]++;
    const g = groups.get(k.group) ?? { page: k.page, total: 0, tiers: blank() };
    g.total++;
    g.tiers[t]++;
    groups.set(k.group, g);
  }
  return { all, groups };
}
