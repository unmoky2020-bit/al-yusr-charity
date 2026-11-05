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
/**
 * A titled list. By default its items are fixed by the page code (the dashboard edits their words only).
 * A `dynamic` section is a free list: the dashboard can add, remove and reorder items (e.g. the
 * ingredients of a food carton); `extraLabel` names what the `extra` field of each item holds.
 */
export type Section = { title: L; lead?: L; items: SectionItem[]; dynamic?: boolean; extraLabel?: L };
export type FaqItem = { q: L; a: L };

/**
 * One picture on a landing page. `src` is an uploaded image URL, or `asset:<file>` for a picture bundled
 * with the site (the code defaults, see src/data/pageImages.ts): those names stay valid across builds.
 */
export type PageImage = { src: string; alt: L; caption?: L };
/**
 * A picture slot of a page (its main image, a gallery…). The dashboard replaces `items`; `label`, `hint`,
 * `max` and `captions` (the page shows a short caption per picture) are fixed by the page code.
 * `max: 1` = a single image.
 */
export type ImageSlot = { label: L; hint?: L; max?: number; captions?: boolean; items: PageImage[] };

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
  /** Picture slots keyed by a stable key (e.g. "hero", "gallery"). Pages without pictures leave it out. */
  images?: Record<string, ImageSlot>;
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

/**
 * Items of a dynamic section: the saved list IS the list (its order, additions and removals all count).
 * A saved item with a known id fills blanks from the default; an item is dropped only when malformed.
 * A saved list that is not an array leaves the defaults; an empty array means "no items".
 */
function mergeDynamicItems(defaults: SectionItem[], saved: unknown): SectionItem[] {
  if (!Array.isArray(saved)) return defaults;
  const byId = new Map(defaults.map((d) => [d.id, d]));
  const out: SectionItem[] = [];
  for (const raw of saved) {
    if (!raw || typeof raw !== "object" || typeof (raw as SectionItem).id !== "string" || !(raw as SectionItem).id.trim()) continue;
    const s = raw as Partial<SectionItem> & { id: string };
    const d = byId.get(s.id);
    const title = d ? mergeL(d.title, s.title) : (isL(s.title) ? s.title : null);
    const desc = d ? mergeL(d.desc, s.desc) : (isL(s.desc) ? s.desc : { ar: "", en: "" });
    if (!title) continue;
    const extra = d?.extra ? mergeL(d.extra, s.extra) : (isL(s.extra) ? s.extra : undefined);
    out.push({ id: s.id, title, desc, ...(extra ? { extra } : {}) });
  }
  return out;
}

const EMPTY_L: L = { ar: "", en: "" };

/**
 * Pictures of one slot: the saved list replaces the defaults when it holds at least one valid picture
 * (an empty or unreadable list keeps the defaults, so a page is never left without its pictures).
 */
function mergeImageItems(d: ImageSlot, saved: unknown): PageImage[] {
  const raw = saved && typeof saved === "object" ? (saved as { items?: unknown }).items : undefined;
  if (!Array.isArray(raw)) return d.items;
  const out: PageImage[] = [];
  for (const it of raw) {
    if (!it || typeof it !== "object") continue;
    const src = typeof (it as PageImage).src === "string" ? (it as PageImage).src.trim() : "";
    if (!src) continue;
    const alt = mergeL(EMPTY_L, (it as PageImage).alt);
    const caption = isL((it as PageImage).caption) ? (it as PageImage).caption : undefined;
    out.push({ src, alt, ...(caption ? { caption } : {}) });
  }
  if (!out.length) return d.items;
  return d.max ? out.slice(0, d.max) : out;
}

/** What is stored for the picture slots: only each slot's pictures (labels and limits stay in the code). */
export function imagesColumn(images: CampaignPageContent["images"]): Record<string, { items: PageImage[] }> | undefined {
  if (!images) return undefined;
  const out: Record<string, { items: PageImage[] }> = {};
  for (const [k, slot] of Object.entries(images)) out[k] = { items: slot.items };
  return out;
}

/** True when the page has picture slots (the dashboard shows its «الصور» tab only then). */
export const hasImageSlots = (c: CampaignPageContent | null | undefined) => !!c?.images && Object.keys(c.images).length > 0;

/** Deep-merge a saved override onto the code defaults. Unknown ids/keys in the override are ignored (except in dynamic sections). */
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
          ...(d.dynamic ? { dynamic: true } : {}),
          ...(d.extraLabel ? { extraLabel: d.extraLabel } : {}),
          title: mergeL(d.title, o.title),
          lead: d.lead ? mergeL(d.lead, o.lead) : (isL(o.lead) ? o.lead : undefined),
          items: d.dynamic
            ? mergeDynamicItems(d.items, o.items)
            : mergeById(d.items, o.items, (di, si) => ({
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

  const si = (s.images && typeof s.images === "object" ? s.images : {}) as Record<string, unknown>;
  const images = defaults.images
    ? Object.fromEntries(Object.entries(defaults.images).map(([k, d]) => [k, { ...d, items: mergeImageItems(d, si[k]) }]))
    : undefined;

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
    ...(images ? { images } : {}),
    ...(seo ? { seo } : {}),
  };
}
