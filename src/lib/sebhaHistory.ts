/**
 * The visitor's dhikr over time, on this device only: a lifetime total and a count per day
 * (the last 60 days are kept). The daily counter on the sebha page still resets every day;
 * this is what lets the visitor see what they have built up.
 */
const KEY = "yusr-sebha-history";
const KEEP_DAYS = 60;

export type SebhaHistory = { total: number; days: Record<string, number> };

/** Local calendar day, `YYYY-MM-DD`. */
export const dayKey = (d: Date = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function readHistory(): SebhaHistory {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || "null") as Partial<SebhaHistory> | null;
    if (!s || typeof s !== "object") return { total: 0, days: {} };
    return { total: Math.max(0, Number(s.total) || 0), days: { ...(s.days || {}) } };
  } catch {
    return { total: 0, days: {} };
  }
}

/** Adds `n` (negative for an undo) to today and to the total; returns the new history. */
export function addToHistory(n: number): SebhaHistory {
  const h = readHistory();
  const today = dayKey();
  h.total = Math.max(0, h.total + n);
  h.days[today] = Math.max(0, (h.days[today] ?? 0) + n);
  const keys = Object.keys(h.days).sort();
  for (const k of keys.slice(0, Math.max(0, keys.length - KEEP_DAYS))) delete h.days[k];
  try {
    localStorage.setItem(KEY, JSON.stringify(h));
  } catch {
    /* private mode: the page still counts */
  }
  return h;
}

/** The last 7 days, oldest first, with today last. */
export function lastWeek(h: SebhaHistory): { day: string; date: Date; count: number }[] {
  const out: { day: string; date: Date; count: number }[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const k = dayKey(d);
    out.push({ day: k, date: d, count: h.days[k] ?? 0 });
  }
  return out;
}
