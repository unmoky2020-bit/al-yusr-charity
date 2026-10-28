import { uploadToSupabaseStorage } from "@/integrations/supabase/client";
import { compressImage } from "@/lib/image-compress";
import { galleryApi as laravelGalleryApi, type LaravelGalleryItem } from "@/data/laravelApi";

export type GalleryRow = {
  id: string;
  title_ar: string;
  title_en: string;
  caption_ar: string | null;
  caption_en: string | null;
  alt_ar?: string | null;
  alt_en?: string | null;
  image_url: string;
  storage_path: string | null;
  program_slug: string;
  city: string | null;
  is_published: boolean;
  is_featured: boolean;
  sort_order: number;
  donate_program: string | null;
  width: number | null;
  height: number | null;
  created_at: string;
  updated_at: string;
};

export type GalleryProgram = {
  slug: string;
  label_ar: string;
  label_en: string;
};

/** Catalogue of programs used as filter chips and admin dropdowns. */
export const GALLERY_PROGRAMS: GalleryProgram[] = [
  { slug: "odhya", label_ar: "صكوك الأضحية", label_en: "Qurbani" },
  { slug: "box", label_ar: "كرتونة عزومة", label_en: "Food box" },
  { slug: "water", label_ar: "وصلات مياه", label_en: "Water" },
  { slug: "bride", label_ar: "تيسير زواج اليتيمات", label_en: "Bride trousseau" },
  { slug: "education", label_ar: "كفالة التعليم", label_en: "Education" },
  { slug: "kitchen", label_ar: "مطبخ اليسر", label_en: "Hot meals" },
  { slug: "treatment", label_ar: "علاج ودواء", label_en: "Treatment" },
  { slug: "zakat", label_ar: "زكاة المال", label_en: "Zakat" },
  { slug: "khabia", label_ar: "خابية الخير", label_en: "Khabia" },
  { slug: "markoun", label_ar: "حملة مَرْكون", label_en: "Markoun campaign" },
  { slug: "volunteer", label_ar: "تطوع وقوافل", label_en: "Volunteer" },
  { slug: "general", label_ar: "عام", label_en: "General" },
];

export const programLabel = (slug: string, lang: "ar" | "en") => {
  const p = GALLERY_PROGRAMS.find((x) => x.slug === slug);
  return p ? (lang === "ar" ? p.label_ar : p.label_en) : slug;
};

const BUCKET = "gallery-media";

const safeName = (s: string) =>
  s.toLowerCase().replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "image";

/** Upload a (compressed) file to gallery-media and return public URL + storage path. */
export async function uploadGalleryImage(file: File): Promise<{ url: string; path: string; width?: number; height?: number }> {
  const compressed = await compressImage(file, { maxEdge: 1600, quality: 0.82 });
  const url = await uploadToSupabaseStorage(compressed, "gallery");
  const path = url.split("/").pop() || "image";

  let width: number | undefined;
  let height: number | undefined;
  try {
    const dims = await new Promise<{ w: number; h: number } | null>((res) => {
      const img = new Image();
      img.onload = () => res({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = () => res(null);
      img.src = url;
    });
    if (dims) { width = dims.w; height = dims.h; }
  } catch { /* ignore */ }

  return { url, path, width, height };
}

/** Remove a file from storage (best-effort — no-op since managed by Laravel). */
export async function deleteGalleryStorageObject(_path: string | null | undefined) {
  // Storage cleanup handled by Laravel API
}

import { GALLERY_STATIC_IMAGES } from "./galleryImages";

const staticAsRows: GalleryRow[] = GALLERY_STATIC_IMAGES.map((img, idx) => ({
  id: img.id,
  title_ar: img.altAr || "صورة من ميدان مؤسسة اليسر",
  title_en: img.alt || "Al-Yusr field photo",
  caption_ar: img.altAr || null,
  caption_en: img.alt || null,
  alt_ar: img.altAr || null,
  alt_en: img.alt || null,
  image_url: img.src,
  storage_path: null,
  program_slug: img.programSlug || img.donateProgram || "general",
  city: img.city || "المنصورة",
  is_published: true,
  is_featured: idx < 6,
  sort_order: idx + 1,
  donate_program: img.donateProgram || "general",
  width: 1200,
  height: 900,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}));

/** Map a LaravelGalleryItem to GalleryRow shape */
function mapLaravelGallery(item: LaravelGalleryItem, idx: number): GalleryRow {
  const url = item.external_url || item.image || "";
  return {
    id: String(item.id),
    title_ar: item.title_ar || "صورة من ميدان مؤسسة اليسر",
    title_en: item.title_en || item.title_ar || "Al-Yusr field photo",
    caption_ar: item.description_ar || null,
    caption_en: item.description_en || null,
    alt_ar: item.alt_ar || item.title_ar || null,
    alt_en: item.alt_en || item.title_en || null,
    image_url: url,
    storage_path: null,
    program_slug: item.program || item.donation_program || "general",
    city: item.city || null,
    is_published: item.is_public !== false,
    is_featured: Boolean(item.is_featured),
    sort_order: Number(item.sort_order ?? idx + 1),
    donate_program: item.donation_program || null,
    width: 1200,
    height: 900,
    created_at: item.created_at || new Date().toISOString(),
    updated_at: item.updated_at || new Date().toISOString(),
  };
}

export async function listPublishedGalleryImages(): Promise<GalleryRow[]> {
  // 1. Try Laravel API first (primary source)
  try {
    const laravelItems = await laravelGalleryApi.listPublic();
    if (Array.isArray(laravelItems) && laravelItems.length > 0) {
      const mapped = laravelItems
        .filter((item: LaravelGalleryItem) => (item.external_url || item.image) && item.external_url !== "/placeholder.svg" && item.image !== "/placeholder.svg")
        .map((item: LaravelGalleryItem, idx: number) => mapLaravelGallery(item, idx));
      if (mapped.length > 0) return mapped;
    }
  } catch {}

  // 2. Static fallback
  return staticAsRows;
}

export async function listAllGalleryImages(): Promise<GalleryRow[]> {
  try {
    const laravelItems = await laravelGalleryApi.listAll();
    if (Array.isArray(laravelItems) && laravelItems.length > 0) {
      return laravelItems.map((item: LaravelGalleryItem, idx: number) => mapLaravelGallery(item, idx));
    }
  } catch {}
  return staticAsRows;
}

export type GalleryUpsertInput = Partial<Omit<GalleryRow, "id" | "created_at" | "updated_at">> & {
  id?: string;
};

/** UUID v4 pattern — static gallery ids like "gal-1" are NOT uuids. */
const isUuid = (s?: string) =>
  !!s && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

export async function upsertGalleryImage(row: GalleryUpsertInput): Promise<GalleryRow> {
  try {
    const isExisting = row.id && !row.id.startsWith("gal-");
    let result: any;
    if (isExisting) {
      result = await laravelGalleryApi.update(row.id!, row as any);
    } else {
      result = await laravelGalleryApi.create(row as any);
    }
    if (result) return mapLaravelGallery(result, 0) as GalleryRow;
  } catch (e) {
    console.warn("upsertGalleryImage fallback to static:", e);
  }
  // Return optimistic row if API fails
  return { ...staticAsRows[0], ...row, id: row.id || String(Date.now()) } as GalleryRow;
}

export async function deleteGalleryImage(row: GalleryRow) {
  await deleteGalleryStorageObject(row.storage_path);
  try {
    await laravelGalleryApi.remove(row.id);
  } catch (e) {
    throw new Error(String(e));
  }
}

export async function toggleGalleryPublished(id: string, value: boolean) {
  try {
    await laravelGalleryApi.update(id, { is_public: value } as any);
  } catch (e) { throw new Error(String(e)); }
}

export async function toggleGalleryFeatured(id: string, value: boolean) {
  try {
    await laravelGalleryApi.update(id, { is_featured: value } as any);
  } catch (e) { throw new Error(String(e)); }
}

export async function moveGalleryImage(rows: GalleryRow[], id: string, direction: -1 | 1) {
  const idx = rows.findIndex((r) => r.id === id);
  const swap = idx + direction;
  if (idx < 0 || swap < 0 || swap >= rows.length) return;
  const a = rows[idx];
  const b = rows[swap];
  await Promise.allSettled([
    laravelGalleryApi.update(a.id, { sort_order: b.sort_order } as any),
    laravelGalleryApi.update(b.id, { sort_order: a.sort_order } as any),
  ]);
}

/**
 * Deduplicate gallery images (client-side, by image_url).
 * Returns { kept, deleted } counts.
 */
export async function deduplicateGalleryImages(): Promise<{ kept: number; deleted: number }> {
  const items = await listAllGalleryImages();
  const seen = new Map<string, string>();
  const toDelete: string[] = [];
  for (const row of items) {
    const url = row.image_url.trim();
    if (!seen.has(url)) {
      seen.set(url, row.id);
    } else {
      toDelete.push(row.id);
    }
  }
  if (toDelete.length === 0) return { kept: seen.size, deleted: 0 };
  await Promise.allSettled(toDelete.map((id) => laravelGalleryApi.remove(id)));
  return { kept: seen.size, deleted: toDelete.length };
}