import { compressImage } from "@/lib/image-compress";
import { absoluteMediaUrl, findIdenticalMedia } from "@/data/api/mediaApi";
import {
  apiFetch, formatServerImageUrl, invalidateApiCache,
  galleryApi as laravelGalleryApi, type LaravelGalleryItem,
} from "@/data/laravelApi";

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

/**
 * Image URL → id of the draft gallery row created when that image was uploaded.
 * The admin form uploads first (uploadGalleryImage) and saves later (upsertGalleryImage);
 * the save then UPDATES that draft row instead of creating a duplicate.
 */
const uploadedDraftIds = new Map<string, string>();

/** Image URLs taken from the media library (picked, or an identical file found): saved as the row's link. */
const libraryUrls = new Set<string>();

/** Use an image that is already stored (media library) for a gallery row, without uploading it again. */
export function takeLibraryImage(url: string): string {
  const abs = absoluteMediaUrl(url);
  libraryUrls.add(abs);
  return abs;
}

/**
 * Upload a (compressed) image to Laravel (EXISTING endpoint POST /gallery, multipart `image`).
 * The row is created unpublished (is_public = 0) and becomes the record that the admin form
 * saves into. Throws on failure — never returns a local/blob URL.
 */
export async function uploadGalleryImage(file: File): Promise<{ url: string; path: string; width?: number; height?: number; reused?: boolean }> {
  const compressed = await compressImage(file, { maxEdge: 1600, quality: 0.82 });
  // The same picture is stored once: reuse an identical file that is already on the server.
  const existing = (await findIdenticalMedia(compressed)) || (compressed !== file ? await findIdenticalMedia(file) : null);
  if (existing) return { url: takeLibraryImage(existing.url), path: existing.path, reused: true };
  const title = file.name.replace(/\.[^.]+$/, "").slice(0, 120) || "صورة";
  const fd = new FormData();
  fd.append("image", compressed);
  fd.append("title_ar", title);
  fd.append("title_en", title);
  fd.append("is_public", "0");
  const res = await apiFetch<{ data?: LaravelGalleryItem } | LaravelGalleryItem>("/gallery", { method: "POST", body: fd });
  invalidateApiCache("/gallery");
  const item = ((res as { data?: LaravelGalleryItem })?.data ?? res) as LaravelGalleryItem | null;
  const raw = item?.image || item?.external_url || "";
  if (!item?.id || !raw) throw new Error("لم يرجع الخادم بيانات الصورة المرفوعة");
  const url = formatServerImageUrl(raw) || raw;
  uploadedDraftIds.set(url, String(item.id));
  const path = raw.split("/").pop() || "image";

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

/** Stored files are deleted by Laravel together with the gallery row (DELETE /gallery/{id}). */
export async function deleteGalleryStorageObject(_path: string | null | undefined) {
  // Nothing to do on the client.
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

/** Map the admin form row to the Laravel /gallery field names (see _live_api_field_shapes.md). */
function toLaravelGalleryPayload(row: GalleryUpsertInput, keepImage: boolean): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    title_ar: row.title_ar,
    title_en: row.title_en,
    alt_ar: row.alt_ar,
    alt_en: row.alt_en,
    description_ar: row.caption_ar,
    description_en: row.caption_en,
    city: row.city,
    program: row.program_slug,
    donation_program: row.donate_program,
    sort_order: row.sort_order,
    is_featured: row.is_featured,
    is_public: row.is_published,
  };
  // A pasted link is stored as external_url; an image already stored on the backend is left untouched.
  const url = row.image_url?.trim();
  if (url && !keepImage && (!/\/storage\//.test(url) || libraryUrls.has(url))) payload.external_url = url;
  Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
  return payload;
}

/** Create or update a gallery row on Laravel. Throws on failure (no optimistic/fake row). */
export async function upsertGalleryImage(row: GalleryUpsertInput): Promise<GalleryRow> {
  const draftId = row.image_url ? uploadedDraftIds.get(row.image_url) : undefined;
  const existingId = row.id && !row.id.startsWith("gal-") ? row.id : undefined;
  const targetId = existingId ?? draftId;
  const payload = toLaravelGalleryPayload(row, Boolean(draftId));
  const result = targetId
    ? await laravelGalleryApi.update(targetId, payload as Partial<LaravelGalleryItem>)
    : await laravelGalleryApi.create(payload as Partial<LaravelGalleryItem>);
  if (draftId && row.image_url) uploadedDraftIds.delete(row.image_url);
  return mapLaravelGallery(result, 0);
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
  const results = await Promise.allSettled([
    laravelGalleryApi.update(a.id, { sort_order: b.sort_order } as Partial<LaravelGalleryItem>),
    laravelGalleryApi.update(b.id, { sort_order: a.sort_order } as Partial<LaravelGalleryItem>),
  ]);
  const failed = results.find((r): r is PromiseRejectedResult => r.status === "rejected");
  if (failed) throw failed.reason instanceof Error ? failed.reason : new Error(String(failed.reason));
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
  const results = await Promise.allSettled(toDelete.map((id) => laravelGalleryApi.remove(id)));
  const deleted = results.filter((r) => r.status === "fulfilled").length;
  if (deleted === 0) throw new Error("تعذّر حذف الصور المكررة من الخادم");
  return { kept: seen.size + (toDelete.length - deleted), deleted };
}