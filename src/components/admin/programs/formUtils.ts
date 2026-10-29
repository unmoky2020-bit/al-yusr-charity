/**
 * Pure helpers shared by the program / project admin editors (no JSX here so the
 * component files only export components).
 */
import type { FaqItem } from "@/data/api/programsAdminApi";

// ─────────────────────────────────────────────────────────────────────────────
// Value coercion
// ─────────────────────────────────────────────────────────────────────────────

/** Any API value → string for an <input>. */
export function str(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return "";
}

/** "1400.00" → "1400", "" stays "". */
export function numStr(v: unknown): string {
  if (v === null || v === undefined || v === "") return "";
  const n = Number(v);
  return Number.isFinite(n) ? String(n) : "";
}

export function nullableString(s: string): string | null {
  const t = (s ?? "").trim();
  return t ? t : null;
}

export function nullableNumber(s: string): number | null {
  const t = (s ?? "").trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export function cleanList(list: string[]): string[] {
  return (list || []).map((s) => (s ?? "").trim()).filter(Boolean);
}

export function toStringList(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => str(x)).filter((x) => x !== "");
  if (typeof v === "string" && v.trim()) {
    try {
      const parsed = JSON.parse(v);
      if (Array.isArray(parsed)) return parsed.map((x) => str(x));
    } catch {
      /* plain text */
    }
    return v.split("\n").map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

/**
 * ai_faq_* may come back as an array of {question, answer}, a JSON string, or the legacy
 * "question | answer" text (one per line) written by the old project editor.
 */
export function normalizeFaq(raw: unknown): FaqItem[] {
  if (Array.isArray(raw)) {
    return raw
      .map((it) => {
        if (!it || typeof it !== "object") return null;
        const o = it as Record<string, unknown>;
        return { question: str(o.question ?? o.q), answer: str(o.answer ?? o.a) };
      })
      .filter((x): x is FaqItem => !!x);
  }
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return normalizeFaq(parsed);
    } catch {
      /* legacy text */
    }
    return raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [q, ...rest] = line.split("|");
        return { question: (q || "").trim(), answer: rest.join("|").trim() };
      });
  }
  return [];
}

export function cleanFaq(list: FaqItem[]): FaqItem[] {
  return (list || [])
    .map((f) => ({ question: (f.question || "").trim(), answer: (f.answer || "").trim() }))
    .filter((f) => f.question || f.answer);
}

// ─────────────────────────────────────────────────────────────────────────────
// Payload diffing
// ─────────────────────────────────────────────────────────────────────────────

function sameValue(a: unknown, b: unknown): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

/**
 * Keep only the keys whose value changed between the payload built from the loaded record (`prev`)
 * and the payload built from the current form (`next`). A cleared field becomes `null`, so the
 * admin can really empty a column, while untouched empty columns are not sent at all.
 */
export function diffPayload(next: Record<string, unknown>, prev: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(next)) {
    if (v === undefined) continue;
    if (!sameValue(v, prev[k])) out[k] = v;
  }
  return out;
}

/** For a create: drop null / empty values so required-only validation is not tripped. */
export function compactPayload(p: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(p)) {
    if (v === undefined || v === null || v === "") continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  return out;
}

/**
 * Keys we sent that the backend response does not contain at all: the column does not exist yet,
 * so Laravel silently dropped them. Used to warn instead of showing a fake "saved".
 */
export function keysMissingFromResponse(sent: Record<string, unknown>, returned: unknown, ignore: string[] = []): string[] {
  if (!returned || typeof returned !== "object") return [];
  const rec = returned as Record<string, unknown>;
  // A response without an id is not a record (e.g. {message: "ok"}): we cannot judge.
  if (!("id" in rec)) return [];
  return Object.keys(sent).filter((k) => !ignore.includes(k) && !(k in rec));
}

// ─────────────────────────────────────────────────────────────────────────────
// Icons: the picker returns PascalCase, the stored data uses kebab-case ("hand-heart").
// ─────────────────────────────────────────────────────────────────────────────

export function toKebabIcon(name: string): string {
  return (name || "")
    .replace(/([a-z])([A-Z0-9])/g, "$1-$2")
    .replace(/([0-9])([A-Za-z])/g, "$1-$2")
    .toLowerCase();
}

// ─────────────────────────────────────────────────────────────────────────────
// SEO / Geo / AI block (identical column names on programs and, proposed, on projects)
// ─────────────────────────────────────────────────────────────────────────────

export interface SeoFormState {
  meta_title_ar: string;
  meta_title_en: string;
  meta_description_ar: string;
  meta_description_en: string;
  keywords_ar: string;
  keywords_en: string;
  canonical_url: string;
  schema_type: string;
  twitter_card: string;
  noindex: boolean;
  nofollow: boolean;
  geo_region: string;
  geo_placename: string;
  geo_position: string;
  geo_position_label: string;
  ai_summary_ar: string;
  ai_summary_en: string;
  ai_faq_ar: FaqItem[];
  ai_faq_en: FaqItem[];
}

export const SEO_KEYS = [
  "meta_title_ar", "meta_title_en", "meta_description_ar", "meta_description_en",
  "keywords_ar", "keywords_en", "canonical_url", "schema_type", "twitter_card", "noindex", "nofollow",
  "geo_region", "geo_placename", "geo_position", "geo_position_label",
  "ai_summary_ar", "ai_summary_en", "ai_faq_ar", "ai_faq_en",
] as const;

export function emptySeo(): SeoFormState {
  return {
    meta_title_ar: "", meta_title_en: "", meta_description_ar: "", meta_description_en: "",
    keywords_ar: "", keywords_en: "", canonical_url: "", schema_type: "", twitter_card: "",
    noindex: false, nofollow: false,
    geo_region: "", geo_placename: "", geo_position: "", geo_position_label: "",
    ai_summary_ar: "", ai_summary_en: "", ai_faq_ar: [], ai_faq_en: [],
  };
}

export function seoFromRecord(rec: Record<string, unknown> | null | undefined): SeoFormState {
  const r = rec || {};
  return {
    meta_title_ar: str(r.meta_title_ar),
    meta_title_en: str(r.meta_title_en),
    meta_description_ar: str(r.meta_description_ar),
    meta_description_en: str(r.meta_description_en),
    keywords_ar: str(r.keywords_ar),
    keywords_en: str(r.keywords_en),
    canonical_url: str(r.canonical_url),
    schema_type: str(r.schema_type),
    twitter_card: str(r.twitter_card),
    noindex: Boolean(r.noindex),
    nofollow: Boolean(r.nofollow),
    geo_region: str(r.geo_region),
    geo_placename: str(r.geo_placename),
    geo_position: str(r.geo_position),
    geo_position_label: str(r.geo_position_label),
    ai_summary_ar: str(r.ai_summary_ar),
    ai_summary_en: str(r.ai_summary_en),
    ai_faq_ar: normalizeFaq(r.ai_faq_ar),
    ai_faq_en: normalizeFaq(r.ai_faq_en),
  };
}

export function seoToPayload(s: SeoFormState): Record<string, unknown> {
  const faqAr = cleanFaq(s.ai_faq_ar);
  const faqEn = cleanFaq(s.ai_faq_en);
  return {
    meta_title_ar: nullableString(s.meta_title_ar),
    meta_title_en: nullableString(s.meta_title_en),
    meta_description_ar: nullableString(s.meta_description_ar),
    meta_description_en: nullableString(s.meta_description_en),
    keywords_ar: nullableString(s.keywords_ar),
    keywords_en: nullableString(s.keywords_en),
    canonical_url: nullableString(s.canonical_url),
    schema_type: nullableString(s.schema_type),
    twitter_card: nullableString(s.twitter_card),
    noindex: !!s.noindex,
    nofollow: !!s.nofollow,
    geo_region: nullableString(s.geo_region),
    geo_placename: nullableString(s.geo_placename),
    geo_position: nullableString(s.geo_position),
    geo_position_label: nullableString(s.geo_position_label),
    ai_summary_ar: nullableString(s.ai_summary_ar),
    ai_summary_en: nullableString(s.ai_summary_en),
    ai_faq_ar: faqAr.length ? faqAr : null,
    ai_faq_en: faqEn.length ? faqEn : null,
  };
}

export const isValidGeoRegion = (v?: string) => !v || /^[A-Z]{2}(?:-[A-Z0-9]{1,3})?$/.test(v);
export const isValidGeoPosition = (v?: string) => !v || /^-?\d{1,2}(?:\.\d+)?;-?\d{1,3}(?:\.\d+)?$/.test(v);
export const normalizeGeoRegion = (v: string) => v.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 6);
export const normalizeGeoPosition = (v: string) => {
  const cleaned = v.replace(/[,\s]+/g, ";").replace(/[^0-9.;-]/g, "");
  const m = cleaned.match(/^(-?\d{1,2}(?:\.\d+)?);(-?\d{1,3}(?:\.\d+)?)/);
  return m ? `${m[1]};${m[2]}` : cleaned;
};
export const isValidUrlOrEmpty = (v?: string) => {
  if (!v) return true;
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};

/** Validation messages (Arabic) for the SEO block; empty array = valid. */
export function validateSeo(s: SeoFormState): string[] {
  const errs: string[] = [];
  if (!isValidGeoRegion(s.geo_region)) errs.push("صيغة geo.region غير صحيحة (مثال: EG-DK)");
  if (!isValidGeoPosition(s.geo_position)) errs.push("صيغة geo.position غير صحيحة (مثال: 31.0409;31.3785)");
  if (!isValidUrlOrEmpty(s.canonical_url)) errs.push("الرابط الأساسي (Canonical URL) يجب أن يبدأ بـ https://");
  return errs;
}
