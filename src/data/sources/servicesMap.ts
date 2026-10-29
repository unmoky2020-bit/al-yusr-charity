/**
 * Services-map sectors content source (/services-map).
 *   static: `DONATE_SECTORS` from src/data/servicesMap.ts (unchanged).
 *   api:    GET /service-categories (PROPOSED — seeded from DONATE_SECTORS), falling back to GET /axes (EXISTS)
 *           when that endpoint is missing/empty. One record = one sector (slug = sector id: food, health…).
 *           Nested `programs[]` become the sector programs (each needs a `slug`).
 *           A sector the API does not publish keeps its static copy; missing fields fall back to static.
 */
import { DONATE_SECTORS, type Sector, type SectorProgram } from "@/data/servicesMap";
import { CONTENT_SOURCE, type ContentSource } from "@/lib/contentSource";
import { programSlugOf } from "./programs";
import {
  type ApiRecord,
  fetchPublicList,
  isPublicRecord,
  mergeByKey,
  normalizeSlug,
  num,
  pick,
  useSourced,
  withExtra,
} from "./_shared";

/** Map a nested axis program to a SectorProgram (undefined when it has no slug). */
export function mapApiSectorProgram(p: ApiRecord, fallback?: SectorProgram): SectorProgram | undefined {
  const slug = programSlugOf(p) || fallback?.slug;
  if (!slug) return undefined;
  const title_ar = pick(p.title_ar, p.name_ar, p.name, fallback?.title_ar) ?? "";
  const out: SectorProgram = {
    slug,
    title_ar,
    title_en: pick(p.title_en, p.name_en, fallback?.title_en, title_ar) ?? "",
    desc_ar: pick(p.desc_ar, p.description_ar, p.description, fallback?.desc_ar) ?? "",
    desc_en: pick(p.desc_en, p.description_en, fallback?.desc_en) ?? "",
  };
  const href = pick(p.href, p.url, fallback?.href);
  if (href) out.href = href;
  return out;
}

/** Map one /axes record to a Sector. `fallback` = static sector with the same id. */
export function mapApiSector(raw: ApiRecord, fallback?: Sector): Sector {
  const r = withExtra(raw);
  const fb = fallback;
  const id = normalizeSlug(r.slug) || fb?.id || "";
  const progs = (Array.isArray(r.programs) ? (r.programs as ApiRecord[]) : [])
    .filter((p) => p && isPublicRecord(p))
    .map((p) => mapApiSectorProgram(p, fb?.programs.find((s) => s.slug === programSlugOf(p))))
    .filter((p): p is SectorProgram => !!p);
  const title_ar = pick(r.title_ar, r.name_ar, fb?.title_ar) ?? "";
  return {
    id,
    donate: pick(r.donate_key, fb?.donate) ?? `sector-${id}`,
    title_ar,
    title_en: pick(r.title_en, r.name_en, fb?.title_en, title_ar) ?? "",
    summary_ar: pick(r.summary_ar, fb?.summary_ar, r.badge_ar) ?? "",
    summary_en: pick(r.summary_en, fb?.summary_en, r.badge_en) ?? "",
    intro_ar: pick(r.intro_ar, r.description_ar, fb?.intro_ar) ?? "",
    intro_en: pick(r.intro_en, r.description_en, fb?.intro_en) ?? "",
    programs: progs.length ? progs : fb?.programs ?? [],
  };
}

/** Final sector list (pure; used by the hook and the tests). */
export function resolveSectors(records: ApiRecord[] | undefined, source: ContentSource = CONTENT_SOURCE): Sector[] {
  if (source === "static" || !records || !records.length) return DONATE_SECTORS;
  const byId = new Map(DONATE_SECTORS.map((s) => [s.id, s]));
  const withSlug = records.filter((r) => normalizeSlug(r.slug));
  const hidden = new Set(withSlug.filter((r) => !isPublicRecord(r)).map((r) => normalizeSlug(r.slug)));
  const mapped = withSlug
    .filter(isPublicRecord)
    .sort((a, b) => (num(a.sort_order) ?? 0) - (num(b.sort_order) ?? 0))
    .map((r) => mapApiSector(r, byId.get(normalizeSlug(r.slug))));
  return mergeByKey(DONATE_SECTORS, mapped, (s) => s.id, hidden);
}

export async function fetchSectorRecords(): Promise<ApiRecord[]> {
  const categories = await fetchPublicList("/service-categories", { per_page: 100 }).catch((): ApiRecord[] => []);
  return categories.length ? categories : fetchPublicList("/axes");
}

/** Donate sectors for /services-map (static by default). */
export function useDonateSectors(): { sectors: Sector[]; isLoading: boolean } {
  const { data, isLoading } = useSourced(["service-sectors"], fetchSectorRecords, DONATE_SECTORS, (raw) => resolveSectors(raw));
  return { sectors: data, isLoading };
}
