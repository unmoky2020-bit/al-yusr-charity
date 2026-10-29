/**
 * Gallery images content source (/gallery).
 *   static: exactly today's behaviour of Gallery.tsx — `listPublishedGalleryImages()` (Laravel /gallery first,
 *           static rows as fallback) mapped the same way, then merged with `GALLERY_STATIC_IMAGES`.
 *   api:    GET /gallery (EXISTS, public) mapped with `mapApiGalleryImage` to the static `GalleryImage` type;
 *           API images first, then every static image the API does not have (by id / `key`).
 */
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { GALLERY_PROGRAMS, listPublishedGalleryImages, programLabel, type GalleryRow } from "@/data/galleryApi";
import { GALLERY_STATIC_IMAGES, type GalleryImage } from "@/data/galleryImages";
import { CONTENT_SOURCE, useApiContent, type ContentSource } from "@/lib/contentSource";
import { type ApiRecord, fetchPublicList, image, isPublicRecord, num, pick, useSourced, withExtra } from "./_shared";

const CATEGORIES: GalleryImage["category"][] = ["families", "qurbani", "education", "health", "water", "campaigns"];

/** Program slug -> gallery category, used when the record has no explicit `category`. */
const PROGRAM_CATEGORY: Record<string, GalleryImage["category"]> = {
  odhya: "qurbani",
  qurbani: "qurbani",
  education: "education",
  orphans: "families",
  treatment: "health",
  medical: "health",
  water: "water",
  box: "families",
  kitchen: "families",
  bride: "families",
};

/** "odhya, box" -> "odhya"; "عام" (an Arabic label) -> "general"; unknown -> as-is. */
export function gallerySlug(v: unknown): string | undefined {
  const first = pick(typeof v === "string" ? v.split(",")[0] : undefined);
  if (!first) return undefined;
  const byLabel = GALLERY_PROGRAMS.find((p) => p.label_ar === first || p.label_en.toLowerCase() === first.toLowerCase());
  return byLabel ? byLabel.slug : first.toLowerCase();
}

/** Public id: `static_id` / `key` / `slug` when present (matches GALLERY_STATIC_IMAGES ids), else the numeric id. */
export function galleryIdOf(raw: ApiRecord): string | undefined {
  const r = withExtra(raw);
  return pick(r.static_id, r.key, r.slug) ?? (r.id !== undefined && r.id !== null ? String(r.id) : undefined);
}

/** Map one /gallery record to the static `GalleryImage`. `fallback` = static image with the same id. */
export function mapApiGalleryImage(raw: ApiRecord, fallback?: GalleryImage): GalleryImage {
  const r = withExtra(raw);
  const fb = fallback;
  // The seeders store the static `category` in `program`; a real program slug goes to `program_slug`.
  const programIsCategory = CATEGORIES.includes(r.program);
  const programSlug =
    gallerySlug(r.program_slug) ?? (programIsCategory ? undefined : gallerySlug(r.program)) ?? fb?.programSlug;
  const donateProgram = gallerySlug(r.donation_program) ?? gallerySlug(r.donate_program) ?? fb?.donateProgram ?? programSlug;
  const city = pick(r.city, fb?.city);
  const progAr = programSlug ? programLabel(programSlug, "ar") : "";
  const progEn = programSlug ? programLabel(programSlug, "en") : "";
  const baseAr = pick(r.title_ar, r.title_en) ?? "صورة من ميدان مؤسسة اليسر";
  const baseEn = pick(r.title_en, r.title_ar) ?? "Al-Yusr field photo";
  const category: GalleryImage["category"] =
    (CATEGORIES.includes(r.category) ? r.category : undefined) ??
    (programIsCategory ? r.program : undefined) ??
    fb?.category ??
    PROGRAM_CATEGORY[donateProgram ?? ""] ??
    PROGRAM_CATEGORY[programSlug ?? ""] ??
    "campaigns";
  const out: GalleryImage = {
    id: galleryIdOf(r) ?? fb?.id ?? "",
    src: image(r.external_url, r.image, r.image_url) ?? fb?.src ?? "/placeholder.svg",
    alt: pick(r.alt_en, fb?.alt) ?? [baseEn, progEn, city].filter(Boolean).join(" — "),
    altAr: pick(r.alt_ar, fb?.altAr) ?? [baseAr, progAr, city].filter(Boolean).join(" — "),
    category,
  };
  if (programSlug) out.programSlug = programSlug;
  if (city) out.city = city;
  if (donateProgram) out.donateProgram = donateProgram;
  return out;
}

/** API images first, then static images the API does not have. Empty -> static list itself. */
function mergeApiFirst(apiImages: GalleryImage[], staticImages: GalleryImage[]): GalleryImage[] {
  const valid = apiImages.filter((img) => img.src && img.src !== "/placeholder.svg");
  if (!valid.length) return staticImages;
  const ids = new Set(valid.map((d) => d.id));
  return [...valid, ...staticImages.filter((img) => !ids.has(img.id))];
}

/** Final image list from raw /gallery records (pure; used by the hook and the tests). */
export function resolveGalleryImages(records: ApiRecord[] | undefined, source: ContentSource = CONTENT_SOURCE): GalleryImage[] {
  if (source === "static" || !records || !records.length) return GALLERY_STATIC_IMAGES;
  const byId = new Map(GALLERY_STATIC_IMAGES.map((g) => [g.id, g]));
  const mapped = records
    .filter(isPublicRecord)
    .sort((a, b) => (num(a.sort_order) ?? 0) - (num(b.sort_order) ?? 0))
    .map((r) => mapApiGalleryImage(r, byId.get(galleryIdOf(r) ?? "")));
  return mergeApiFirst(mapped, GALLERY_STATIC_IMAGES);
}

/* ── Legacy path (flag = "static"): byte-for-byte the mapping Gallery.tsx used before. ── */

export function legacyRowToImage(r: GalleryRow): GalleryImage {
  // Auto-build descriptive alt text: title + program + city.
  const progAr = r.program_slug ? programLabel(r.program_slug, "ar") : "";
  const progEn = r.program_slug ? programLabel(r.program_slug, "en") : "";
  const baseAr = r.title_ar || r.title_en || "صورة من ميدان مؤسسة اليسر";
  const baseEn = r.title_en || r.title_ar || "Al-Yusr field photo";
  const altAr = r.alt_ar || [baseAr, progAr, r.city].filter(Boolean).join(" — ");
  const altEn = r.alt_en || [baseEn, progEn, r.city].filter(Boolean).join(" — ");
  return {
    id: r.id,
    src: r.image_url || "/placeholder.svg",
    alt: altEn,
    altAr,
    category: "campaigns",
    programSlug: r.program_slug,
    city: r.city || undefined,
    donateProgram: r.donate_program || r.program_slug,
  };
}

export function mergeLegacy(dbImages: GalleryImage[] | null): GalleryImage[] {
  const validDbImages = (dbImages || []).filter((img) => img.src && img.src !== "/placeholder.svg");
  const raw =
    validDbImages.length === 0
      ? GALLERY_STATIC_IMAGES
      : [...validDbImages, ...GALLERY_STATIC_IMAGES.filter((img) => !new Set(validDbImages.map((d) => d.id)).has(img.id))];
  return raw.map((img) => ({ ...img, src: img.src || "/placeholder.svg" }));
}

export async function fetchGalleryRecords(): Promise<ApiRecord[]> {
  return fetchPublicList("/gallery", { per_page: 100 });
}

/** Gallery images for /gallery. With the default flag this is exactly what Gallery.tsx rendered before. */
export function useGalleryImages(): { images: GalleryImage[]; isLoading: boolean } {
  const legacy = useQuery({
    queryKey: ["content-source", "gallery-legacy"],
    queryFn: async () => (await listPublishedGalleryImages()).map(legacyRowToImage),
    enabled: !useApiContent,
  });
  const legacyImages = useMemo(() => mergeLegacy(legacy.isError ? [] : legacy.data ?? null), [legacy.data, legacy.isError]);
  const api = useSourced(["gallery"], fetchGalleryRecords, GALLERY_STATIC_IMAGES, (raw) => resolveGalleryImages(raw));
  if (!useApiContent) return { images: legacyImages, isLoading: legacy.isLoading };
  return { images: api.data, isLoading: api.isLoading };
}
