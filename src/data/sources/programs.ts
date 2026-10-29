/**
 * Programs content source.
 *   static: `programs` / `getProgram` from src/data/programs.ts — also the offline fallback when the API
 *           cannot be reached.
 *   api:    GET /programs — exactly the public (active, not hidden) backend programs, in sort_order, every
 *           field from the record. A program that is missing or inactive on the backend is not listed and its
 *           page shows «البرنامج غير متاح حالياً»; static copies never add programs or fill backend fields.
 */
import { programs as STATIC_PROGRAMS, type ProgramContent } from "@/data/programs";
import { CONTENT_SOURCE, type ContentSource } from "@/lib/contentSource";
import {
  type ApiRecord,
  fetchPublicList,
  image,
  isPublicRecord,
  num,
  paragraphs,
  pick,
  resolveRecordKey,
  strList,
  useSourced,
  withExtra,
} from "./_shared";

/** Backend slug -> public slug, for records whose backend slug differs (also read from the record's `aliases`). */
export const PROGRAM_SLUG_ALIASES: Record<string, string> = {
  "general-donation": "general",
};

const STATIC_SLUGS = new Set(STATIC_PROGRAMS.map((p) => p.slug));

/** Public slug of a /programs record (matches a static slug through slug / aliases when possible). */
export function programSlugOf(r: ApiRecord): string {
  return resolveRecordKey(r, STATIC_SLUGS, PROGRAM_SLUG_ALIASES);
}

function minPackageAmount(r: ApiRecord): number | undefined {
  const amounts = (Array.isArray(r.donation_packages) ? r.donation_packages : [])
    .filter((p: ApiRecord) => p && p.is_active !== false)
    .map((p: ApiRecord) => num(p.amount))
    .filter((n: number | undefined): n is number => typeof n === "number" && n > 0);
  return amounts.length ? Math.min(...amounts) : undefined;
}

/**
 * Map one /programs record to the static `ProgramContent` shape.
 * `fallback` is the static program with the same slug (used for every missing field).
 */
export function mapApiProgram(raw: ApiRecord, fallback?: ProgramContent): ProgramContent {
  const r = withExtra(raw);
  const top: ApiRecord = r.top_section && typeof r.top_section === "object" ? r.top_section : {};
  const fb = fallback;
  const lang = (l: "ar" | "en") => {
    const f = fb?.[l];
    return {
      name: pick(r[`name_${l}`], r[`title_${l}`], top[`title_${l}`], l === "ar" ? r.name : undefined, f?.name) ?? "",
      tagline: pick(r[`tagline_${l}`], top[`subtitle_${l}`], f?.tagline) ?? "",
      desc: pick(r[`description_${l}`], top[`description_${l}`], l === "ar" ? r.description : undefined, f?.desc) ?? "",
      benefits: strList(r[`benefits_${l}`]) ?? f?.benefits ?? [],
      longContent: paragraphs(r[`content_${l}`]) ?? f?.longContent ?? [],
    };
  };
  const out: ProgramContent = {
    slug: programSlugOf(r) || fb?.slug || "",
    image: image(r.image, r.hero_image, top.image) ?? fb?.image ?? "/placeholder.svg",
    priceFrom: num(r.minimum_amount) ?? num(top.minimum_amount) ?? minPackageAmount(r) ?? fb?.priceFrom ?? 0,
    ar: lang("ar"),
    en: lang("en"),
  };
  const gallery = Array.isArray(r.gallery)
    ? (r.gallery as unknown[])
        .map((g) => image(typeof g === "string" ? g : (g as ApiRecord)?.image))
        .filter((g): g is string => !!g)
    : [];
  if (gallery.length) out.gallery = gallery;
  else if (fb?.gallery) out.gallery = fb.gallery;
  // Card badge: the seeders store the static `season` in period_ar/en.
  const seasonAr = pick(r.period_ar, fb?.season?.ar);
  const seasonEn = pick(r.period_en, fb?.season?.en);
  if (seasonAr || seasonEn) out.season = { ar: seasonAr ?? seasonEn ?? "", en: seasonEn ?? seasonAr ?? "" };

  // Detail-page hero (dashboard tab «أعلى الصفحة»): hero_h1/h3 + hero_image, badge from top_section.
  const heroLang = (l: "ar" | "en") => ({
    title: pick(r[`hero_h1_${l}`]),
    subtitle: pick(r[`hero_h3_${l}`]),
    badge: pick(top[`badge_${l}`]),
  });
  const heroImage = image(r.hero_image);
  const heroAr = heroLang("ar");
  const heroEn = heroLang("en");
  if (heroImage || Object.values(heroAr).some(Boolean) || Object.values(heroEn).some(Boolean)) {
    out.hero = { ...(heroImage ? { image: heroImage } : {}), ar: heroAr, en: heroEn };
  }

  // Page sections («أقسام الصفحة»): only active sections with real items override the defaults.
  const sectionsByKey = new Map<string, ApiRecord>(
    (Array.isArray(r.page_sections) ? (r.page_sections as ApiRecord[]) : [])
      .filter((s) => s && s.is_active !== false && s.is_enabled !== false)
      .map((s) => [String(s.section_key), s]),
  );
  const items = (key: string, l: "ar" | "en"): ApiRecord[] => {
    const s = sectionsByKey.get(key);
    const v = s?.[`content_${l}`];
    return Array.isArray(v) ? (v as ApiRecord[]).filter((x) => x && typeof x === "object") : [];
  };
  const texts = (key: string, l: "ar" | "en") => items(key, l).map((x) => pick(x.text, x.title) ?? "").filter(Boolean);
  const pairs = (key: string, l: "ar" | "en") =>
    items(key, l)
      .map((x) => ({ t: pick(x.title) ?? "", d: pick(x.description, x.text) ?? "" }))
      .filter((x) => x.t || x.d);
  const bilingual = <T,>(ar: T[], en: T[]) => (ar.length ? { ar, en: en.length ? en : ar } : undefined);
  const sections = {
    benefits: bilingual(texts("benefits", "ar"), texts("benefits", "en")),
    steps: bilingual(pairs("how_it_works", "ar"), pairs("how_it_works", "en")),
    details: bilingual(texts("details", "ar"), texts("details", "en")),
    impact: bilingual(pairs("impact", "ar"), pairs("impact", "en")),
  };
  if (Object.values(sections).some(Boolean)) out.sections = sections;

  const seoLang = (l: "ar" | "en") => ({ title: pick(r[`meta_title_${l}`]), description: pick(r[`meta_description_${l}`]) });
  const seoAr = seoLang("ar");
  const seoEn = seoLang("en");
  if (seoAr.title || seoAr.description || seoEn.title || seoEn.description) out.seo = { ar: seoAr, en: seoEn };

  const apiId = num(r.id);
  if (apiId) out.apiId = apiId;

  const packages = (Array.isArray(r.donation_packages) ? (r.donation_packages as ApiRecord[]) : [])
    .filter((p) => p && p.is_active !== false && num(p.id))
    .sort((a, b) => (num(a.sort_order) ?? 0) - (num(b.sort_order) ?? 0))
    .map((p) => ({
      id: num(p.id) as number,
      slug: pick(p.key) ?? String(p.id),
      nameAr: pick(p.name_ar, p.name) ?? "",
      nameEn: pick(p.name_en, p.name_ar, p.name) ?? "",
      amount: num(p.amount) ?? 0,
    }));
  if (packages.length) out.packages = packages;

  // FAQ category linked in the dashboard (programs.faq_category_id → resource `faq_category`).
  const linkedFaq = r.faq_category;
  const faqCategory = linkedFaq && typeof linkedFaq === "object" ? pick((linkedFaq as ApiRecord).slug) : undefined;
  if (faqCategory) out.faqCategory = faqCategory;
  return out;
}

/**
 * Final programs list from raw /programs records (pure; used by the hook and the tests).
 * Static only for the static source or when the API answered nothing at all (offline / empty database).
 */
export function resolvePrograms(records: ApiRecord[] | undefined, source: ContentSource = CONTENT_SOURCE): ProgramContent[] {
  if (source === "static" || !records || !records.length) return STATIC_PROGRAMS;
  return records
    .filter((r) => programSlugOf(r) && isPublicRecord(r))
    .sort((a, b) => (num(a.sort_order) ?? 0) - (num(b.sort_order) ?? 0))
    .map((r) => mapApiProgram(r));
}

export async function fetchProgramRecords(): Promise<ApiRecord[]> {
  return fetchPublicList("/programs", { per_page: 100 });
}

/** All programs (static by default). */
export function usePrograms(): { programs: ProgramContent[]; isLoading: boolean } {
  const { data, isLoading } = useSourced(["programs"], fetchProgramRecords, STATIC_PROGRAMS, (raw) => resolvePrograms(raw));
  return { programs: data, isLoading };
}

/** One program by public slug (static by default). */
export function useProgram(slug: string | undefined): { program: ProgramContent | undefined; isLoading: boolean } {
  const { programs, isLoading } = usePrograms();
  return { program: slug ? programs.find((p) => p.slug === slug) : undefined, isLoading };
}
