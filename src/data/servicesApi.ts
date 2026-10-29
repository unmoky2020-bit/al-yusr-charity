/**
 * servicesApi.ts — service pages (/services/:slug, cards on /services-map, AdminServices).
 *
 * Source of truth: Laravel `/services` (NEW — proposed, see src/data/api/servicesRemoteApi.ts and
 * backend-handoff/01-replace-supabase-public.md). Supabase and the localStorage "overrides"
 * are gone: admin edits are saved on the server or fail with a real error.
 *
 * Public reads follow the content-source flag (src/lib/contentSource.ts):
 *   - "static" (default): static SERVICE_PAGES / SERVICE_PAGE_LIST — same as today.
 *   - "api" / "auto":     Laravel first; on error / empty response the static data is used,
 *                         and a slug the API does not have keeps its static page.
 */
import { SERVICE_PAGES, SERVICE_PAGE_LIST } from "@/data/servicePagesConfig";
import { useApiContent } from "@/lib/contentSource";
import { formatServerImageUrl } from "@/data/laravelApi";
import {
  fetchServices, fetchService, saveService, patchService, deleteService, reorderServices,
  type RawService,
} from "@/data/api/servicesRemoteApi";

export type ServiceCard = {
  id: string;
  slug: string;
  programSlug: string;
  sector: string;       // food | health | kafala | housing | odhya | water | general
  hero: string;
  badge_ar: string;
  badge_en: string;
  title_ar: string;
  title_en: string;
  intro_ar: string;
  intro_en: string;
  active: boolean;
  sort_order: number;
};

export type DonationTier = {
  amount: number;
  unit_ar: string;
  unit_en: string;
  desc_ar: string;
  desc_en: string;
  highlight?: boolean;
};

export type ServiceDetail = ServiceCard & {
  seo_title_ar: string;
  seo_title_en: string;
  seo_desc_ar: string;
  seo_desc_en: string;
  bullets_ar: string[];
  bullets_en: string[];
  stats: { ar: string; en: string; arL: string; enL: string }[];
  features: { icon: string; t_ar: string; t_en: string; d_ar: string; d_en: string }[];
  tiers: DonationTier[];
  related: { to: string; ar: string; en: string }[];
};

const s = (v: unknown, fb = ""): string => (v === null || v === undefined ? fb : String(v));
const list = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

/** Map a Laravel /services record to ServiceCard. */
function rowToCard(r: RawService): ServiceCard {
  const hero = s(r.hero_image ?? r.hero ?? r.image ?? r.cover_image);
  return {
    id: s(r.id ?? r.slug),
    slug: s(r.slug),
    programSlug: s(r.program_slug ?? r.slug),
    sector: s(r.sector, "general") || "general",
    hero: hero ? formatServerImageUrl(hero) || hero : "",
    badge_ar: s(r.badge_ar),
    badge_en: s(r.badge_en),
    title_ar: s(r.title_ar ?? r.title),
    title_en: s(r.title_en),
    intro_ar: s(r.intro_ar ?? r.description_ar),
    intro_en: s(r.intro_en ?? r.description_en),
    active: r.is_active === undefined && r.active === undefined ? true : Boolean(r.is_active ?? r.active),
    sort_order: Number(r.sort_order ?? 0) || 0,
  };
}

/** Map a Laravel /services record to ServiceDetail (accepts both the admin and the reader key styles). */
function rowToDetail(r: RawService): ServiceDetail {
  type R = Record<string, unknown>;
  return {
    ...rowToCard(r),
    seo_title_ar: s(r.seo_title_ar ?? r.meta_title_ar),
    seo_title_en: s(r.seo_title_en ?? r.meta_title_en),
    seo_desc_ar: s(r.seo_desc_ar ?? r.meta_description_ar),
    seo_desc_en: s(r.seo_desc_en ?? r.meta_description_en),
    bullets_ar: list<string>(r.bullets_ar).map(String),
    bullets_en: list<string>(r.bullets_en).map(String),
    stats: list<R>(r.stats).map((x) => ({
      ar: s(x.ar ?? x.value_ar ?? x.value), en: s(x.en ?? x.value_en ?? x.value),
      arL: s(x.arL ?? x.label_ar), enL: s(x.enL ?? x.label_en),
    })),
    features: list<R>(r.features).map((x) => ({
      icon: s(x.icon ?? x.Icon), t_ar: s(x.t_ar ?? x.title_ar), t_en: s(x.t_en ?? x.title_en),
      d_ar: s(x.d_ar ?? x.desc_ar ?? x.description_ar), d_en: s(x.d_en ?? x.desc_en ?? x.description_en),
    })),
    tiers: list<R>(r.tiers).map((x) => {
      const t: DonationTier = {
        amount: Number(x.amount ?? 0) || 0,
        unit_ar: s(x.unit_ar ?? x.name_ar), unit_en: s(x.unit_en ?? x.name_en),
        desc_ar: s(x.desc_ar ?? x.description_ar), desc_en: s(x.desc_en ?? x.description_en),
      };
      if (x.highlight === true || x.is_popular === true) t.highlight = true;
      return t;
    }),
    related: list<R>(r.related).map((x) => ({ to: s(x.to ?? x.url), ar: s(x.ar ?? x.label_ar), en: s(x.en ?? x.label_en) })),
  };
}

/** Static ServicePageConfig → ServiceCard. */
function staticToCard(sp: (typeof SERVICE_PAGE_LIST)[0], idx: number): ServiceCard {
  return {
    id: sp.slug,
    slug: sp.slug,
    programSlug: sp.programSlug || sp.slug,
    sector: (sp as { sector?: string }).sector || "general",
    hero: sp.hero || "",
    badge_ar: sp.badge_ar || "",
    badge_en: sp.badge_en || "",
    title_ar: sp.title_ar || "",
    title_en: sp.title_en || "",
    intro_ar: sp.intro_ar || "",
    intro_en: sp.intro_en || "",
    active: true,
    sort_order: idx + 1,
  };
}

/** Icon component → its name (static features hold lucide components, the API stores names). */
function iconName(icon: unknown): string {
  if (typeof icon === "string") return icon;
  const named = icon as { displayName?: string; name?: string } | null;
  return named?.displayName || named?.name || "Heart";
}

/** Static ServicePageConfig → ServiceDetail. */
function staticToDetail(slug: string): ServiceDetail | null {
  const sp = SERVICE_PAGES[slug];
  if (!sp) return null;
  const idx = SERVICE_PAGE_LIST.findIndex((x) => x.slug === slug);
  return {
    ...staticToCard(sp, idx < 0 ? 0 : idx),
    seo_title_ar: sp.seo_title_ar || sp.title_ar || "",
    seo_title_en: sp.seo_title_en || sp.title_en || "",
    seo_desc_ar: sp.seo_desc_ar || sp.intro_ar || "",
    seo_desc_en: sp.seo_desc_en || sp.intro_en || "",
    bullets_ar: sp.bullets_ar || [],
    bullets_en: sp.bullets_en || [],
    stats: sp.stats || [],
    // `Icon` (the original lucide component) is kept alongside the name so ServiceRouter,
    // which prefers `f.Icon`, renders exactly the same icon as before.
    features: (sp.features || []).map((f) => ({
      icon: iconName((f as { Icon?: unknown }).Icon), t_ar: f.t_ar, t_en: f.t_en, d_ar: f.d_ar, d_en: f.d_en,
      Icon: (f as { Icon?: unknown }).Icon,
    })),
    tiers: (sp.tiers || []) as DonationTier[],
    related: sp.related || [],
  };
}

const staticCards = (): ServiceCard[] => SERVICE_PAGE_LIST.map(staticToCard);

/** API cards + static cards whose slug the API does not have, sorted by sort_order. */
function mergeWithStatic(apiCards: ServiceCard[]): ServiceCard[] {
  const seen = new Set(apiCards.map((c) => c.slug));
  return [...apiCards, ...staticCards().filter((c) => !seen.has(c.slug))]
    .sort((a, b) => a.sort_order - b.sort_order);
}

/** Admin form → Laravel body (field names shared with src/data/sources/services.ts). */
function toPayload(data: Partial<ServiceDetail>): RawService {
  const payload: RawService = {
    program_slug: data.programSlug,
    sector: data.sector,
    hero_image: data.hero,
    badge_ar: data.badge_ar,
    badge_en: data.badge_en,
    title_ar: data.title_ar,
    title_en: data.title_en,
    intro_ar: data.intro_ar,
    intro_en: data.intro_en,
    // Column names as in backend-handoff/03-seeders.md (services table).
    meta_title_ar: data.seo_title_ar,
    meta_title_en: data.seo_title_en,
    meta_description_ar: data.seo_desc_ar,
    meta_description_en: data.seo_desc_en,
    bullets_ar: data.bullets_ar,
    bullets_en: data.bullets_en,
    stats: data.stats,
    features: data.features,
    tiers: data.tiers,
    related: data.related,
    is_active: data.active,
    sort_order: data.sort_order,
  };
  Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
  return payload;
}

// ── API ───────────────────────────────────────────────────────────────────

export const servicesApi = {
  /** Public: active services for ServicesMap. */
  async list(): Promise<ServiceCard[]> {
    if (!useApiContent) return staticCards();
    try {
      const rows = (await fetchServices()).map(rowToCard).filter((c) => c.slug && c.active);
      if (rows.length > 0) return mergeWithStatic(rows);
    } catch (err) {
      if (import.meta.env.DEV) console.warn("[services] API unavailable, using static list:", err);
    }
    return staticCards();
  },

  /** Public: full service detail by slug. */
  async get(slug: string): Promise<ServiceDetail | null> {
    if (!useApiContent) return staticToDetail(slug);
    try {
      const row = await fetchService(slug);
      if (row) {
        const detail = rowToDetail(row);
        if (detail.active) return detail;
        return null;
      }
    } catch (err) {
      if (import.meta.env.DEV) console.warn("[services] API unavailable, using static page:", err);
    }
    return staticToDetail(slug);
  },

  /**
   * Admin: every service incl. inactive. Services that exist only in the static config are listed
   * too, so the admin can save them into the database. If the API is unreachable the static list
   * is shown (read-only — saving will report the real error).
   */
  async listAll(): Promise<ServiceCard[]> {
    try {
      const rows = (await fetchServices({ all: true })).map(rowToCard).filter((c) => c.slug);
      return mergeWithStatic(rows);
    } catch (err) {
      if (import.meta.env.DEV) console.warn("[services] admin list unavailable, showing static list:", err);
      return staticCards();
    }
  },

  /** Admin: create or update a service (PUT /services/{slug}, POST /services when new). Throws on failure. */
  async upsert(data: Partial<ServiceDetail> & { slug: string }): Promise<ServiceDetail> {
    const saved = await saveService(data.slug, toPayload({ ...data, active: data.active ?? true, sort_order: data.sort_order ?? 0 }));
    return saved ? rowToDetail({ slug: data.slug, ...saved }) : ({ ...staticToDetail(data.slug), ...data } as ServiceDetail);
  },

  /** Admin: toggle active status. Throws on failure. */
  async setActive(slug: string, active: boolean): Promise<void> {
    await patchService(slug, { is_active: active });
  },

  /** Admin: delete a service. Throws on failure. */
  async delete(slug: string): Promise<void> {
    await deleteService(slug);
  },

  /** Admin: bulk update sort order. Throws on failure. */
  async reorder(slugs: string[]): Promise<void> {
    await reorderServices(slugs);
  },
};
