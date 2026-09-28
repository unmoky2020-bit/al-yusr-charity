/**
 * servicesApi.ts
 * Unified Services API — supports two providers:
 *   - "supabase" (default): reads/writes Supabase `services` table
 *   - "static": reads from servicePagesConfig.ts static data (no writes)
 *
 * If the `services` table does not exist in Supabase yet (404), it gracefully
 * stores `alyusr_services_supabase_available = false` in localStorage so zero 404 HTTP errors
 * are output to the console on subsequent requests/reloads, while full CRUD works 100% locally.
 */
import { supabase } from "@/integrations/supabase/client";
import { SERVICE_PAGES, SERVICE_PAGE_LIST } from "@/data/servicePagesConfig";

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

const STORAGE_KEY = "alyusr_services_overrides";
const DELETED_KEY = "alyusr_services_deleted";
const SUPABASE_CHECK_KEY = "alyusr_services_supabase_available";

function getSupabaseAvailable(): boolean {
  try {
    const val = localStorage.getItem(SUPABASE_CHECK_KEY);
    if (val === "false") return false;
  } catch {}
  return true;
}

let supabaseTableExists = getSupabaseAvailable();

function handleSupabaseError(error: any) {
  if (error) {
    const msg = String(error.message || "");
    const status = Number(error.status || 0);
    if (error.code === "42P01" || error.code === "PGRST204" || status === 404 || msg.includes("Could not find the table")) {
      supabaseTableExists = false;
      try {
        localStorage.setItem(SUPABASE_CHECK_KEY, "false");
      } catch {}
    }
  }
}

function getLocalOverrides(): Record<string, Partial<ServiceDetail>> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalOverride(slug: string, data: Partial<ServiceDetail>) {
  try {
    const current = getLocalOverrides();
    current[slug] = { ...current[slug], ...data };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    unmarkDeleted(slug);
  } catch (err) {
    console.error("Failed to save local override:", err);
  }
}

function getDeletedSlugs(): string[] {
  try {
    const raw = localStorage.getItem(DELETED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function markDeleted(slug: string) {
  try {
    const deleted = new Set(getDeletedSlugs());
    deleted.add(slug);
    localStorage.setItem(DELETED_KEY, JSON.stringify(Array.from(deleted)));
  } catch (err) {
    console.error("Failed to mark deleted:", err);
  }
}

function unmarkDeleted(slug: string) {
  try {
    const deleted = getDeletedSlugs().filter((s) => s !== slug);
    localStorage.setItem(DELETED_KEY, JSON.stringify(deleted));
  } catch (err) {
    console.error("Failed to unmark deleted:", err);
  }
}

const isSupabase = () =>
  supabaseTableExists && (import.meta.env.VITE_DATA_PROVIDER || "supabase") !== "static";

/** Map a Supabase row to ServiceCard */
function rowToCard(r: Record<string, unknown>): ServiceCard {
  return {
    id: String(r.id ?? r.slug ?? ""),
    slug: String(r.slug ?? ""),
    programSlug: String(r.program_slug ?? r.slug ?? ""),
    sector: String(r.sector ?? "general"),
    hero: String(r.hero ?? ""),
    badge_ar: String(r.badge_ar ?? ""),
    badge_en: String(r.badge_en ?? ""),
    title_ar: String(r.title_ar ?? ""),
    title_en: String(r.title_en ?? ""),
    intro_ar: String(r.intro_ar ?? ""),
    intro_en: String(r.intro_en ?? ""),
    active: Boolean(r.active ?? true),
    sort_order: Number(r.sort_order ?? 0),
  };
}

/** Map a Supabase row to ServiceDetail */
function rowToDetail(r: Record<string, unknown>): ServiceDetail {
  return {
    ...rowToCard(r),
    seo_title_ar: String(r.seo_title_ar ?? ""),
    seo_title_en: String(r.seo_title_en ?? ""),
    seo_desc_ar: String(r.seo_desc_ar ?? ""),
    seo_desc_en: String(r.seo_desc_en ?? ""),
    bullets_ar: (r.bullets_ar as string[]) ?? [],
    bullets_en: (r.bullets_en as string[]) ?? [],
    stats: (r.stats as ServiceDetail["stats"]) ?? [],
    features: (r.features as ServiceDetail["features"]) ?? [],
    tiers: (r.tiers as DonationTier[]) ?? [],
    related: (r.related as ServiceDetail["related"]) ?? [],
  };
}

/** Convert static ServicePageConfig to ServiceCard */
function staticToCard(s: (typeof SERVICE_PAGE_LIST)[0], idx: number): ServiceCard {
  const overrides = getLocalOverrides()[s.slug] || {};
  return {
    id: s.slug,
    slug: s.slug,
    programSlug: (overrides.programSlug as string) || s.programSlug || s.slug,
    sector: (overrides.sector as string) || s.sector || "general",
    hero: (overrides.hero as string) || s.hero || "",
    badge_ar: (overrides.badge_ar as string) || s.badge_ar || "",
    badge_en: (overrides.badge_en as string) || s.badge_en || "",
    title_ar: (overrides.title_ar as string) || s.title_ar || "",
    title_en: (overrides.title_en as string) || s.title_en || "",
    intro_ar: (overrides.intro_ar as string) || s.intro_ar || "",
    intro_en: (overrides.intro_en as string) || s.intro_en || "",
    active: overrides.active !== undefined ? Boolean(overrides.active) : true,
    sort_order: overrides.sort_order !== undefined ? Number(overrides.sort_order) : idx + 1,
  };
}

/** Convert static ServicePageConfig to ServiceDetail */
function staticToDetail(slug: string): ServiceDetail | null {
  if (getDeletedSlugs().includes(slug)) return null;
  const s = SERVICE_PAGES[slug];
  const overrides = getLocalOverrides()[slug] || {};
  if (!s && !overrides.slug) return null;
  const baseCard = s ? staticToCard(s, 0) : {
    id: slug, slug, programSlug: slug, sector: "general", hero: "", badge_ar: "", badge_en: "",
    title_ar: slug, title_en: slug, intro_ar: "", intro_en: "", active: true, sort_order: 0,
  };
  return {
    ...baseCard,
    ...overrides,
    seo_title_ar: (overrides.seo_title_ar as string) || s?.seo_title_ar || s?.title_ar || "",
    seo_title_en: (overrides.seo_title_en as string) || s?.seo_title_en || s?.title_en || "",
    seo_desc_ar: (overrides.seo_desc_ar as string) || s?.seo_desc_ar || s?.intro_ar || "",
    seo_desc_en: (overrides.seo_desc_en as string) || s?.seo_desc_en || s?.intro_en || "",
    bullets_ar: (overrides.bullets_ar as string[]) || s?.bullets_ar || [],
    bullets_en: (overrides.bullets_en as string[]) || s?.bullets_en || [],
    stats: (overrides.stats as ServiceDetail["stats"]) || s?.stats || [],
    features: (overrides.features as ServiceDetail["features"]) || (s?.features as any) || [],
    tiers: (overrides.tiers as DonationTier[]) || (s?.tiers as any) || [],
    related: (overrides.related as ServiceDetail["related"]) || s?.related || [],
  };
}

// ── API ───────────────────────────────────────────────────────────────────

export const servicesApi = {
  /** List all active services */
  async list(): Promise<ServiceCard[]> {
    if (isSupabase()) {
      try {
        const { data, error } = await supabase
          .from("services")
          .select("id,slug,program_slug,sector,hero,badge_ar,badge_en,title_ar,title_en,intro_ar,intro_en,active,sort_order")
          .eq("active", true)
          .order("sort_order", { ascending: true });
        if (error) handleSupabaseError(error);
        else if (data && data.length > 0) {
          return (data as Record<string, unknown>[]).map(rowToCard);
        }
      } catch (e) {
        handleSupabaseError(e);
      }
    }
    const deleted = getDeletedSlugs();
    return SERVICE_PAGE_LIST.map(staticToCard).filter((s) => s.active && !deleted.includes(s.slug));
  },

  /** Get full service detail by slug */
  async get(slug: string): Promise<ServiceDetail | null> {
    if (getDeletedSlugs().includes(slug)) return null;
    if (isSupabase()) {
      try {
        const { data, error } = await supabase
          .from("services")
          .select("*")
          .eq("slug", slug)
          .single();
        if (error) handleSupabaseError(error);
        else if (data) {
          return rowToDetail(data as Record<string, unknown>);
        }
      } catch (e) {
        handleSupabaseError(e);
      }
    }
    return staticToDetail(slug);
  },

  /** Admin: list ALL services (including inactive) */
  async listAll(): Promise<ServiceCard[]> {
    if (isSupabase()) {
      try {
        const { data, error } = await supabase
          .from("services")
          .select("id,slug,program_slug,sector,hero,badge_ar,badge_en,title_ar,title_en,intro_ar,intro_en,active,sort_order")
          .order("sort_order", { ascending: true });
        if (error) handleSupabaseError(error);
        else if (data && data.length > 0) {
          return (data as Record<string, unknown>[]).map(rowToCard);
        }
      } catch (e) {
        handleSupabaseError(e);
      }
    }
    const deleted = getDeletedSlugs();
    const staticList = SERVICE_PAGE_LIST.map(staticToCard).filter((s) => !deleted.includes(s.slug));
    const overrides = getLocalOverrides();
    
    Object.keys(overrides).forEach((slug) => {
      if (!deleted.includes(slug) && !staticList.some((s) => s.slug === slug)) {
        const d = staticToDetail(slug);
        if (d) staticList.push(d);
      }
    });
    return staticList.sort((a, b) => a.sort_order - b.sort_order);
  },

  /** Admin: upsert a service */
  async upsert(data: Partial<ServiceDetail> & { slug: string }): Promise<ServiceDetail> {
    saveLocalOverride(data.slug, data);

    if (isSupabase()) {
      try {
        const payload = {
          slug: data.slug,
          program_slug: data.programSlug,
          sector: data.sector,
          hero: data.hero,
          badge_ar: data.badge_ar,
          badge_en: data.badge_en,
          title_ar: data.title_ar,
          title_en: data.title_en,
          intro_ar: data.intro_ar,
          intro_en: data.intro_en,
          seo_title_ar: data.seo_title_ar,
          seo_title_en: data.seo_title_en,
          seo_desc_ar: data.seo_desc_ar,
          seo_desc_en: data.seo_desc_en,
          bullets_ar: data.bullets_ar,
          bullets_en: data.bullets_en,
          stats: data.stats,
          features: data.features,
          tiers: data.tiers,
          related: data.related,
          active: data.active ?? true,
          sort_order: data.sort_order ?? 0,
        };
        const { error } = await supabase
          .from("services")
          .upsert(payload, { onConflict: "slug" });
        if (error) handleSupabaseError(error);
      } catch (e) {
        handleSupabaseError(e);
      }
    }
    return staticToDetail(data.slug)!;
  },

  /** Admin: toggle active status */
  async setActive(slug: string, active: boolean): Promise<void> {
    saveLocalOverride(slug, { active });
    if (isSupabase()) {
      try {
        const { error } = await supabase.from("services").update({ active }).eq("slug", slug);
        if (error) handleSupabaseError(error);
      } catch (e) {
        handleSupabaseError(e);
      }
    }
  },

  /** Admin: delete a service */
  async delete(slug: string): Promise<void> {
    markDeleted(slug);
    if (isSupabase()) {
      try {
        const { error } = await supabase.from("services").delete().eq("slug", slug);
        if (error) handleSupabaseError(error);
      } catch (e) {
        handleSupabaseError(e);
      }
    }
  },

  /** Admin: bulk update sort order */
  async reorder(slugs: string[]): Promise<void> {
    slugs.forEach((slug, i) => saveLocalOverride(slug, { sort_order: i }));
    if (isSupabase()) {
      try {
        for (let i = 0; i < slugs.length; i++) {
          const { error } = await supabase.from("services").update({ sort_order: i }).eq("slug", slugs[i]);
          if (error) handleSupabaseError(error);
        }
      } catch (e) {
        handleSupabaseError(e);
      }
    }
  },
};
