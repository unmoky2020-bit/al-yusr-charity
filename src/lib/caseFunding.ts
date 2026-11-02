/**
 * Small, pure helpers the cases list and the case page share: funding numbers, deadline,
 * suggested amounts, search / filter / sort. Kept free of React so they are easy to test.
 */
import type { CaseRow } from "@/data/casesApi";

export type CaseFunding = {
  need: number;
  raised: number;
  remaining: number;
  pct: number;
  /** Fully funded, or closed / completed by the team. */
  done: boolean;
};

export function caseFunding(c: Pick<CaseRow, "needed_amount" | "raised_amount" | "status">): CaseFunding {
  const need = Math.max(0, Number(c.needed_amount) || 0);
  const raised = Math.max(0, Number(c.raised_amount) || 0);
  const remaining = Math.max(0, need - raised);
  const pct = need > 0 ? Math.min(100, Math.floor((raised / need) * 100)) : 0;
  const status = String(c.status || "");
  const done = status === "completed" || status === "closed" || (need > 0 && remaining === 0);
  return { need, raised, remaining, pct, done };
}

/**
 * Calendar days from today to the deadline: 0 = today, negative = passed, null = none / invalid.
 */
export function daysLeft(deadline?: string | null, now: Date = new Date()): number | null {
  if (!deadline) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(deadline));
  if (!m) return null;
  const end = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((end.getTime() - today.getTime()) / 86_400_000);
}

/**
 * Amount chips for a case: three round amounts below what is left, plus «complete the case»
 * when what is left is small enough for one donor to close it.
 */
export function suggestedAmounts(remaining: number): { amounts: number[]; closing: number | null } {
  const base = [100, 250, 500, 1000, 2500];
  if (remaining <= 0) return { amounts: [], closing: null };
  const amounts = base.filter((a) => a < remaining).slice(0, 3);
  const closing = remaining <= 15000 ? Math.ceil(remaining) : null;
  if (!amounts.length && !closing) amounts.push(100);
  return { amounts, closing };
}

export type CaseSort = "urgent" | "closest" | "newest" | "remaining";
export type CaseStatusFilter = "open" | "done" | "all";

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[ً-ْـ]/g, "") // tashkeel + tatweel
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .trim();

export function filterCases(
  rows: CaseRow[],
  f: { q?: string; cat?: string; status?: CaseStatusFilter },
): CaseRow[] {
  const q = f.q ? norm(f.q) : "";
  return rows.filter((c) => {
    if (f.cat && c.category_slug !== f.cat) return false;
    const { done } = caseFunding(c);
    if (f.status === "open" && done) return false;
    if (f.status === "done" && !done) return false;
    if (!q) return true;
    const hay = norm(
      [c.title, c.story, c.ref_code, c.governorate, c.city, c.category_name_ar, c.program_name, c.project_name, c.donation_campaign_name]
        .filter(Boolean)
        .join(" "),
    );
    return q.split(/\s+/).every((w) => hay.includes(w));
  });
}

const URG_RANK: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

export function sortCases(rows: CaseRow[], sort: CaseSort): CaseRow[] {
  const list = [...rows];
  const t = (c: CaseRow) => new Date(c.created_at || 0).getTime() || 0;
  list.sort((a, b) => {
    const fa = caseFunding(a);
    const fb = caseFunding(b);
    // Funded cases always sink to the end: the donor's money is needed elsewhere first.
    if (fa.done !== fb.done) return fa.done ? 1 : -1;
    switch (sort) {
      case "closest":
        return fb.pct - fa.pct || fa.remaining - fb.remaining;
      case "newest":
        return t(b) - t(a);
      case "remaining":
        return fb.remaining - fa.remaining;
      case "urgent":
      default: {
        const ua = URG_RANK[String(a.urgency)] ?? 2;
        const ub = URG_RANK[String(b.urgency)] ?? 2;
        if (ua !== ub) return ua - ub;
        const da = daysLeft(a.deadline);
        const db = daysLeft(b.deadline);
        const ka = da !== null && da >= 0 ? da : 1e9;
        const kb = db !== null && db >= 0 ? db : 1e9;
        if (ka !== kb) return ka - kb;
        return t(b) - t(a);
      }
    }
  });
  return list;
}
