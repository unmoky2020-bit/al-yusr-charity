/**
 * Media library (`/media`): images for articles, pages and OG cards, stored on the backend's
 * public disk under media/{collection}/. Separate from the public photo gallery (`/gallery`).
 *
 * Backend: MediaController (deployed 2026-10-29), permissions media.view / media.upload / media.delete.
 *   GET    /media?collection=&search=   -> { data: MediaFile[], total, collections }
 *   POST   /media  (multipart: file, collection)  -> { data: MediaFile, url, path }
 *   POST   /upload (same as POST /media; kept for the blog editor)
 *   DELETE /media  { path }
 * Writes throw the ApiError; screens show it with `describeWriteError`.
 */
import { apiFetch, formatServerImageUrl, invalidateApiCache } from "@/data/laravelApi";

export const MEDIA_COLLECTIONS = ["blog", "og", "pages", "programs", "campaigns", "cases", "general"] as const;
export type MediaCollection = (typeof MEDIA_COLLECTIONS)[number];

export const MEDIA_COLLECTION_LABELS_AR: Record<MediaCollection, string> = {
  blog: "المقالات",
  og: "صور المشاركة (OG)",
  pages: "الصفحات",
  programs: "البرامج",
  campaigns: "الحملات",
  cases: "الحالات",
  general: "عام",
};

export interface MediaFile {
  path: string;
  url: string;
  name: string;
  collection: MediaCollection | string;
  size: number;
  mime_type?: string | null;
  last_modified: string;
}

export const MEDIA_MAX_BYTES = 5 * 1024 * 1024;
export const MEDIA_ACCEPT = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

export async function listMedia(params: { collection?: MediaCollection | ""; search?: string } = {}): Promise<MediaFile[]> {
  const res = await apiFetch<{ data?: MediaFile[] }>("/media", { method: "GET", params, useCache: false });
  const rows = Array.isArray(res?.data) ? res.data : [];
  return rows.map((f) => ({ ...f, url: formatServerImageUrl(f.url) || f.url }));
}

export async function uploadMedia(file: Blob, fileName: string, collection: MediaCollection = "general"): Promise<MediaFile> {
  const body = new FormData();
  body.append("file", file, fileName);
  body.append("collection", collection);
  const res = await apiFetch<{ data: MediaFile; url?: string }>("/media", { method: "POST", body });
  invalidateApiCache("/media");
  const f = res.data;
  return { ...f, url: formatServerImageUrl(f?.url || res.url) || f?.url || res.url || "" };
}

export async function deleteMedia(path: string): Promise<void> {
  await apiFetch("/media", { method: "DELETE", body: { path } });
  invalidateApiCache("/media");
}
