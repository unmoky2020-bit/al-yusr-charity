/**
 * Editable content model for campaign landing pages (/setr, /dhill, /athar, /ramadan, /markoun, /arboun).
 *
 * Each page keeps its bespoke layout in code and reads its *content* through this model:
 * the defaults live in `src/data/campaignPages/<slug>.ts`, and an optional override saved from
 * the dashboard (as one `/content` item of type "page") is merged on top at runtime.
 * Merging is defensive: a missing or malformed override always yields the defaults.
 */

/** Bilingual string. */
export type L = { ar: string; en: string };
export const l = (ar: string, en: string): L => ({ ar, en });

export type PriceItem = { id: string; label: L; amount: number; note?: L };
export type StatItem = { id: string; label: L; value: number | null; unit?: L; note?: L };
export type SectionItem = { id: string; title: L; desc: L; extra?: L };
export type Section = { title: L; lead?: L; items: SectionItem[] };
export type FaqItem = { q: L; a: L };

export interface CampaignPageContent {
  hero: { eyebrow: L; title: L; title2: L; lead: L; donateLabel: L };
  hadith: { text: L; source: L };
  /** Priced items. Ids are fixed by the page code; the dashboard edits labels, amounts and notes. */
  prices: PriceItem[];
  /** Figures such as last season's achievements. Ids are fixed by the page code. */
  stats: StatItem[];
  /** Titled lists keyed by a stable section key (e.g. "tracks", "steps", "cycle"). */
  sections: Record<string, Section>;
  faq: FaqItem[];
  cta: { title: L; sub: L };
  /** Optional SEO override (dashboard "SEO & Meta" tab). Empty strings mean "use the page's static meta". */
  seo?: { title: L; description: L; keywords: L; canonical?: string; noindex?: boolean; nofollow?: boolean };
}

const isL = (v: unknown): v is L =>
  !!v && typeof v === "object" && typeof (v as L).ar === "string" && typeof (v as L).en === "string";

const mergeL = (d: L, s?: unknown): L => (isL(s) ? { ar: s.ar || d.ar, en: s.en || d.en } : d);

function mergeById<T extends { id: string }>(defaults: T[], saved: unknown, mergeItem: (d: T, s: Partial<T>) => T): T[] {
  if (!Array.isArray(saved)) return defaults;
  const byId = new Map<string, Partial<T>>();
  for (const it of saved) if (it && typeof it === "object" && typeof (it as T).id === "string") byId.set((it as T).id, it as Partial<T>);
  return defaults.map((d) => (byId.has(d.id) ? mergeItem(d, byId.get(d.id)!) : d));
}

/** Deep-merge a saved override onto the code defaults. Unknown ids/keys in the override are ignored. */
export function mergeCampaignContent(defaults: CampaignPageContent, saved: unknown): CampaignPageContent {
  if (!saved || typeof saved !== "object") return defaults;
  const s = saved as Partial<Record<keyof CampaignPageContent, unknown>>;
  const sh = (s.hero || {}) as Record<string, unknown>;
  const shd = (s.hadith || {}) as Record<string, unknown>;
  const sc = (s.cta || {}) as Record<string, unknown>;
  const ss = (s.sections && typeof s.sections === "object" ? s.sections : {}) as Record<string, Partial<Section>>;

  const sections: Record<string, Section> = {};
  for (const [key, d] of Object.entries(defaults.sections)) {
    const o = ss[key];
    sections[key] = o
      ? {
          title: mergeL(d.title, o.title),
          lead: d.lead ? mergeL(d.lead, o.lead) : (isL(o.lead) ? o.lead : undefined),
          items: mergeById(d.items, o.items, (di, si) => ({
            id: di.id,
            title: mergeL(di.title, si.title),
            desc: mergeL(di.desc, si.desc),
            extra: di.extra ? mergeL(di.extra, si.extra) : (isL(si.extra) ? si.extra : undefined),
          })),
        }
      : d;
  }

  const sseo = (s.seo && typeof s.seo === "object" ? s.seo : null) as Record<string, unknown> | null;
  const empty: L = { ar: "", en: "" };
  const seo = sseo
    ? {
        title: mergeL(defaults.seo?.title ?? empty, sseo.title),
        description: mergeL(defaults.seo?.description ?? empty, sseo.description),
        keywords: mergeL(defaults.seo?.keywords ?? empty, sseo.keywords),
        canonical: typeof sseo.canonical === "string" ? sseo.canonical : defaults.seo?.canonical,
        noindex: typeof sseo.noindex === "boolean" ? sseo.noindex : defaults.seo?.noindex,
        nofollow: typeof sseo.nofollow === "boolean" ? sseo.nofollow : defaults.seo?.nofollow,
      }
    : defaults.seo;

  const faqOk = Array.isArray(s.faq) && s.faq.length > 0 && s.faq.every((f) => f && isL((f as FaqItem).q) && isL((f as FaqItem).a));

  return {
    hero: {
      eyebrow: mergeL(defaults.hero.eyebrow, sh.eyebrow),
      title: mergeL(defaults.hero.title, sh.title),
      title2: mergeL(defaults.hero.title2, sh.title2),
      lead: mergeL(defaults.hero.lead, sh.lead),
      donateLabel: mergeL(defaults.hero.donateLabel, sh.donateLabel),
    },
    hadith: { text: mergeL(defaults.hadith.text, shd.text), source: mergeL(defaults.hadith.source, shd.source) },
    prices: mergeById(defaults.prices, s.prices, (d, o) => ({
      id: d.id,
      label: mergeL(d.label, o.label),
      amount: typeof o.amount === "number" && isFinite(o.amount) && o.amount >= 0 ? o.amount : d.amount,
      note: d.note ? mergeL(d.note, o.note) : (isL(o.note) ? o.note : undefined),
    })),
    stats: mergeById(defaults.stats, s.stats, (d, o) => ({
      id: d.id,
      label: mergeL(d.label, o.label),
      value: o.value === null ? null : typeof o.value === "number" && isFinite(o.value) ? o.value : d.value,
      unit: d.unit ? mergeL(d.unit, o.unit) : (isL(o.unit) ? o.unit : undefined),
      note: d.note ? mergeL(d.note, o.note) : (isL(o.note) ? o.note : undefined),
    })),
    sections,
    faq: faqOk ? (s.faq as FaqItem[]) : defaults.faq,
    cta: { title: mergeL(defaults.cta.title, sc.title), sub: mergeL(defaults.cta.sub, sc.sub) },
    ...(seo ? { seo } : {}),
  };
}
