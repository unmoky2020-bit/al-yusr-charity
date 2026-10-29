/**
 * Service pages content source (/services/:slug and the cards on /services-map).
 *   static: `SERVICE_PAGES` / `SERVICE_PAGE_LIST` from src/data/servicePagesConfig.ts (unchanged).
 *   api:    GET /services (PROPOSED, public) mapped to `ServicePageConfig`; a slug the API does not publish
 *           keeps its static page, and missing fields fall back to the static page with the same slug.
 */
import {
  Activity, Beef, Bed, BookOpen, Building2, Calendar, Construction, Droplets, Gift, GraduationCap, HandCoins,
  Hammer, HardHat, Heart, Home, KeyRound, MapPin, Package, Pipette, Recycle, Refrigerator, ShieldCheck,
  Snowflake, Sparkles, Sprout, Stethoscope, Truck, Users, UtensilsCrossed, Wind, Wrench,
} from "lucide-react";
import type { ServicePageConfig } from "@/components/services/ServicePage";
import { SERVICE_PAGES, SERVICE_PAGE_LIST } from "@/data/servicePagesConfig";
import { CONTENT_SOURCE, type ContentSource } from "@/lib/contentSource";
import {
  type ApiRecord,
  fetchPublicList,
  image,
  isPublicRecord,
  mergeByKey,
  normalizeSlug,
  num,
  pick,
  strList,
  useSourced,
  withExtra,
} from "./_shared";

/** Icon names the backend may send in `features[].icon` (lucide-react component names). */
export const SERVICE_ICON_MAP: Record<string, ServicePageConfig["features"][number]["Icon"]> = {
  Activity, Beef, Bed, BookOpen, Building2, Calendar, Construction, Droplets, Gift, GraduationCap, HandCoins,
  Hammer, HardHat, Heart, Home, KeyRound, MapPin, Package, Pipette, Recycle, Refrigerator, ShieldCheck,
  Snowflake, Sparkles, Sprout, Stethoscope, Truck, Users, UtensilsCrossed, Wind, Wrench,
};

const arr = (v: unknown): ApiRecord[] => (Array.isArray(v) ? (v as ApiRecord[]).filter((x) => x && typeof x === "object") : []);

/** Map one /services record to the static `ServicePageConfig`. `fallback` = static page with the same slug. */
export function mapApiService(raw: ApiRecord, fallback?: ServicePageConfig): ServicePageConfig {
  const r = withExtra(raw);
  const fb = fallback;
  const slug = normalizeSlug(r.slug) || fb?.slug || "";
  const title_ar = pick(r.title_ar, r.title, fb?.title_ar) ?? "";
  const title_en = pick(r.title_en, fb?.title_en, title_ar) ?? "";
  const intro_ar = pick(r.intro_ar, r.description_ar, r.description, fb?.intro_ar) ?? "";
  const intro_en = pick(r.intro_en, r.description_en, fb?.intro_en) ?? "";

  const stats = arr(r.stats).map((s) => ({
    ar: pick(s.value_ar, s.ar, s.value) ?? "",
    en: pick(s.value_en, s.en, s.value_ar, s.ar, s.value) ?? "",
    arL: pick(s.label_ar, s.arL) ?? "",
    enL: pick(s.label_en, s.enL, s.label_ar, s.arL) ?? "",
  }));
  const features = arr(r.features).map((f) => ({
    Icon: SERVICE_ICON_MAP[pick(f.icon, f.Icon) ?? ""] ?? Heart,
    t_ar: pick(f.title_ar, f.t_ar) ?? "",
    t_en: pick(f.title_en, f.t_en, f.title_ar, f.t_ar) ?? "",
    d_ar: pick(f.desc_ar, f.description_ar, f.d_ar) ?? "",
    d_en: pick(f.desc_en, f.description_en, f.d_en) ?? "",
  }));
  const tiers = arr(r.tiers ?? r.donation_packages).map((t) => {
    const tier: ServicePageConfig["tiers"][number] = {
      amount: num(t.amount) ?? 0,
      unit_ar: pick(t.unit_ar, t.name_ar) ?? "",
      unit_en: pick(t.unit_en, t.name_en, t.unit_ar, t.name_ar) ?? "",
      desc_ar: pick(t.desc_ar, t.description_ar) ?? "",
      desc_en: pick(t.desc_en, t.description_en) ?? "",
    };
    if (t.highlight === true || t.is_popular === true) tier.highlight = true;
    return tier;
  });
  const related = arr(r.related).map((x) => ({
    to: pick(x.url, x.to) ?? "",
    ar: pick(x.label_ar, x.ar) ?? "",
    en: pick(x.label_en, x.en, x.label_ar, x.ar) ?? "",
  }));
  const faqs = arr(r.faqs).map((q) => ({
    q_ar: pick(q.question_ar, q.q_ar) ?? "",
    a_ar: pick(q.answer_ar, q.a_ar) ?? "",
    q_en: pick(q.question_en, q.q_en) ?? "",
    a_en: pick(q.answer_en, q.a_en) ?? "",
  }));

  const out: ServicePageConfig = {
    slug,
    programSlug: pick(r.program_slug, fb?.programSlug, slug) ?? slug,
    hero: image(r.hero_image, r.image, r.cover_image) ?? fb?.hero ?? "",
    badge_ar: pick(r.badge_ar, fb?.badge_ar) ?? "",
    badge_en: pick(r.badge_en, fb?.badge_en) ?? "",
    title_ar,
    title_en,
    intro_ar,
    intro_en,
    seo_title_ar: pick(r.seo_title_ar, r.meta_title_ar, fb?.seo_title_ar, title_ar) ?? "",
    seo_title_en: pick(r.seo_title_en, r.meta_title_en, fb?.seo_title_en, title_en) ?? "",
    seo_desc_ar: pick(r.seo_desc_ar, r.meta_description_ar, fb?.seo_desc_ar, intro_ar) ?? "",
    seo_desc_en: pick(r.seo_desc_en, r.meta_description_en, fb?.seo_desc_en, intro_en) ?? "",
    bullets_ar: strList(r.bullets_ar) ?? fb?.bullets_ar ?? [],
    bullets_en: strList(r.bullets_en) ?? fb?.bullets_en ?? [],
    stats: stats.length ? stats : fb?.stats ?? [],
    features: features.length ? features : fb?.features ?? [],
    tiers: tiers.length ? tiers : fb?.tiers ?? [],
  };
  const rel = related.length ? related : fb?.related;
  if (rel) out.related = rel;
  const fq = faqs.length ? faqs : fb?.faqs;
  if (fq) out.faqs = fq;
  if (fb?.extra) out.extra = fb.extra;
  return out;
}

/** Final service-page list (pure; used by the hook and the tests). */
export function resolveServicePages(records: ApiRecord[] | undefined, source: ContentSource = CONTENT_SOURCE): ServicePageConfig[] {
  if (source === "static" || !records || !records.length) return SERVICE_PAGE_LIST;
  const withSlug = records.filter((r) => normalizeSlug(r.slug));
  const hidden = new Set(withSlug.filter((r) => !isPublicRecord(r)).map((r) => normalizeSlug(r.slug)));
  const mapped = withSlug
    .filter(isPublicRecord)
    .sort((a, b) => (num(a.sort_order) ?? 0) - (num(b.sort_order) ?? 0))
    .map((r) => mapApiService(r, SERVICE_PAGES[normalizeSlug(r.slug)]));
  return mergeByKey(SERVICE_PAGE_LIST, mapped, (s) => s.slug, hidden);
}

export async function fetchServiceRecords(): Promise<ApiRecord[]> {
  return fetchPublicList("/services", { per_page: 100 });
}

/** All service pages (static by default). */
export function useServicePages(): { servicePages: ServicePageConfig[]; isLoading: boolean } {
  const { data, isLoading } = useSourced(["services"], fetchServiceRecords, SERVICE_PAGE_LIST, (raw) =>
    resolveServicePages(raw),
  );
  return { servicePages: data, isLoading };
}

/** One service page by slug (static by default; `SERVICE_PAGES[slug]`). */
export function useServicePage(slug: string): { servicePage: ServicePageConfig | undefined; isLoading: boolean } {
  const { servicePages, isLoading } = useServicePages();
  if (servicePages === SERVICE_PAGE_LIST) return { servicePage: SERVICE_PAGES[slug], isLoading };
  return { servicePage: servicePages.find((s) => s.slug === slug), isLoading };
}
