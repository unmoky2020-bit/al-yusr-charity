/**
 * Media library (`/media`): every image stored on the backend (public disk), with where each one is used.
 * Separate from the public photo gallery (`/gallery`): the gallery is the curated list shown on the
 * site, and a gallery row can point at any file of this library.
 *
 * Backend: MediaController v2 (deploy 2026-11-03), permissions media.view / media.upload / media.delete.
 *   GET    /media?scope=all&folder=&usage=used|unused|duplicates&search=
 *          -> { data: MediaFile[], total, total_size, collections, folders }
 *   GET    /media/find?size=&sha256=   -> { data: MediaFile, duplicate: true } | 404
 *   POST   /media  (multipart: file, collection) -> { data, url, path, duplicate }  (identical file → existing one)
 *   DELETE /media  { paths: [] }  -> { trashed: [], skipped: [{ path, reason, used_in? }] }
 *          moves UNUSED files to a private trash (restorable); used files are never removed.
 * Older backends (before v2) answer without in_use / folders; the screens treat those as unknown.
 */
import { apiFetch, formatServerImageUrl, invalidateApiCache } from "@/data/laravelApi";
import { compressImage } from "@/lib/image-compress";

export const MEDIA_COLLECTIONS = ["blog", "og", "pages", "programs", "campaigns", "cases", "gallery", "general"] as const;
export type MediaCollection = (typeof MEDIA_COLLECTIONS)[number];

export const MEDIA_COLLECTION_LABELS_AR: Record<MediaCollection, string> = {
  blog: "المقالات",
  og: "صور المشاركة (OG)",
  pages: "الصفحات",
  programs: "البرامج",
  campaigns: "الحملات",
  cases: "الحالات",
  gallery: "معرض الصور",
  general: "عام",
};

/** Folders of the whole storage (older uploads live outside media/). */
export const MEDIA_FOLDER_LABELS_AR: Record<string, string> = {
  articles: "المقالات (قديم)",
  axes: "المحاور",
  cases: "الحالات (قديم)",
  contents: "المحتوى",
  "donation-campaigns": "الحملات (قديم)",
  gallery: "معرض الصور (قديم)",
  homepage: "الرئيسية",
  programs: "البرامج (قديم)",
  projects: "المشاريع",
  stories: "القصص",
  ...Object.fromEntries(MEDIA_COLLECTIONS.map((c) => [`media/${c}`, MEDIA_COLLECTION_LABELS_AR[c]])),
};

/** "case_models#56" → «حالة #56». */
const TABLE_LABELS_AR: Record<string, string> = {
  case_models: "حالة",
  programs: "برنامج",
  projects: "مشروع",
  donation_campaigns: "حملة",
  gallery: "معرض الصور",
  galleries: "معرض الصور",
  stories: "قصة",
  articles: "مقال",
  blog_posts: "مقال",
  posts: "مقال",
  contents: "محتوى",
  settings: "إعدادات الموقع",
  site_settings: "إعدادات الموقع",
  homepage_carousel_settings: "كاروسيل الرئيسية",
  homepage_slides: "سلايدر الرئيسية",
  axes: "محور",
  program_donation_packages: "باقة تبرع",
  volunteer_campaigns: "حملة تطوع",
  users: "مستخدم",
};
export function usageLabelAr(ref: string): string {
  const [table, id] = ref.split("#");
  const label = TABLE_LABELS_AR[table] || table.replace(/_/g, " ");
  return id ? `${label} ${id}` : label;
}

export interface MediaFile {
  path: string;
  /** Absolute backend URL — this is what gets saved into a record. */
  url: string;
  /** URL for <img> in this app (proxied in development). */
  preview: string;
  name: string;
  collection: MediaCollection | string;
  folder?: string;
  size: number;
  mime_type?: string | null;
  last_modified: string;
  /** undefined = the backend doesn't report usage yet */
  in_use?: boolean;
  used_in?: string[];
  /** path of the original when this file is an identical copy */
  duplicate_of?: string | null;
}

export interface MediaList {
  files: MediaFile[];
  folders: string[];
  totalSize: number;
  /** the backend reports usage (v2) */
  hasUsage: boolean;
}

/** What the server stores at most (after the browser has shrunk the photo). */
export const MEDIA_MAX_BYTES = 5 * 1024 * 1024;
/** A phone photo may be bigger before upload: it is shrunk in the browser first. */
export const MEDIA_INPUT_MAX_BYTES = 25 * 1024 * 1024;
/** Longest side of a stored photo (enough for a full-width hero on a sharp screen). */
export const MEDIA_MAX_EDGE = 2400;
export const MEDIA_ACCEPT = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
/** Kept exactly as they are (animation / already compact). */
const AS_IS_TYPES = ["image/gif", "image/avif"];

/** The upload rules in one line, for the upload boxes. */
export const MEDIA_RULES_AR = "JPG أو PNG أو WebP لحد 25 ميجا (بتتصغّر لوحدها لـ 2400 بكسل، وبيتشال منها مكان التصوير) — GIF و AVIF لحد 5 ميجا.";

/** Why this file can't be uploaded, or null when it can. */
export function mediaFileProblem(file: Pick<File, "type" | "size" | "name">, lang: "ar" | "en" = "ar"): string | null {
  const ar = lang === "ar";
  if (!MEDIA_ACCEPT.includes(file.type)) {
    return /\.hei[cf]$/i.test(file.name)
      ? (ar ? `«${file.name}» صورة آيفون (HEIC): ارفعها من المتصفح على الموبايل، أو حوّلها JPG الأول.` : `"${file.name}" is HEIC: upload it from the phone's browser or convert it to JPG.`)
      : (ar ? `«${file.name}»: الصيغ المسموحة JPG و PNG و WebP و GIF و AVIF.` : `"${file.name}": use JPG, PNG, WebP, GIF or AVIF.`);
  }
  const limit = AS_IS_TYPES.includes(file.type) ? MEDIA_MAX_BYTES : MEDIA_INPUT_MAX_BYTES;
  if (file.size > limit) {
    const mb = Math.round(limit / 1024 / 1024);
    return ar ? `«${file.name}» أكبر من ${mb} ميجا.` : `"${file.name}" is larger than ${mb} MB.`;
  }
  return null;
}

/**
 * Before upload: a photo is shrunk to MEDIA_MAX_EDGE and under the server limit, and a JPEG loses its
 * camera data (the GPS location of a family's home must never reach the public site).
 * GIF / AVIF and the generated social images ("og") go as they are.
 */
async function prepareForLibrary(file: Blob, fileName: string, collection: MediaCollection): Promise<{ blob: Blob; name: string }> {
  if (collection === "og" || AS_IS_TYPES.includes(file.type) || !file.type.startsWith("image/")) return { blob: file, name: fileName };
  const original = file instanceof File ? file : new File([file], fileName, { type: file.type });
  try {
    const out = await compressImage(original, { maxEdge: MEDIA_MAX_EDGE, quality: 0.86, maxSizeBytes: MEDIA_MAX_BYTES - 256 * 1024, stripMetadata: true });
    if (out === original) return { blob: file, name: fileName };
    const ext = out.name.split(".").pop() || "jpg";
    return { blob: out, name: `${fileName.replace(/\.[^.]+$/, "") || "image"}.${ext}` };
  } catch {
    return { blob: file, name: fileName }; // the browser couldn't read it: the server decides
  }
}

const BACKEND_ORIGIN = (import.meta.env?.VITE_BACKEND_URL as string | undefined) || "https://api.elyusr.org";

/** The URL to SAVE: absolute, one "/storage/" segment. */
export function absoluteMediaUrl(url: string): string {
  let u = (url || "").trim().replace(/\/storage\/(?:storage\/)+/g, "/storage/");
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  u = u.replace(/^\/+/, "");
  return `${BACKEND_ORIGIN}/${u.startsWith("storage/") ? u : `storage/${u}`}`;
}

type RawFile = Omit<MediaFile, "preview">;
const toFile = (f: RawFile): MediaFile => {
  const url = absoluteMediaUrl(f.url || f.path);
  return { ...f, url, preview: formatServerImageUrl(url) || url };
};

export async function listMedia(
  params: { collection?: MediaCollection | ""; search?: string; scope?: "all" | "media"; folder?: string; usage?: "" | "used" | "unused" | "duplicates" } = {},
): Promise<MediaFile[]> {
  return (await listMediaFull(params)).files;
}

export async function listMediaFull(
  params: { collection?: MediaCollection | ""; search?: string; scope?: "all" | "media"; folder?: string; usage?: "" | "used" | "unused" | "duplicates" } = {},
): Promise<MediaList> {
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v !== undefined));
  const res = await apiFetch<{ data?: RawFile[]; folders?: string[]; total_size?: number }>("/media", { method: "GET", params: clean, useCache: false });
  const rows = Array.isArray(res?.data) ? res.data : [];
  const files = rows.map(toFile);
  return {
    files,
    folders: Array.isArray(res?.folders) ? res.folders : [],
    totalSize: Number(res?.total_size) || files.reduce((s, f) => s + (Number(f.size) || 0), 0),
    hasUsage: rows.some((f) => typeof f.in_use === "boolean"),
  };
}

/** SHA-256 of a file, hex (the backend compares size + this hash). */
export async function sha256Hex(blob: Blob): Promise<string | null> {
  try {
    const buf = await blob.arrayBuffer();
    const digest = await crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return null; // no WebCrypto (plain http on a LAN address): the upload still dedupes on the server
  }
}

/** The identical image already stored, or null (also null on an older backend). */
export async function findIdenticalMedia(blob: Blob): Promise<MediaFile | null> {
  const sha256 = await sha256Hex(blob);
  if (!sha256 || !blob.size) return null;
  try {
    const res = await apiFetch<{ data?: RawFile }>("/media/find", { method: "GET", params: { size: blob.size, sha256 }, useCache: false });
    return res?.data?.path ? toFile(res.data) : null;
  } catch {
    return null;
  }
}

export type UploadResult = MediaFile & { duplicate: boolean };

/**
 * Upload to the library (POST /media, permission media.upload). The photo is prepared first
 * (see prepareForLibrary). An identical image that is already stored comes back instead (`duplicate`).
 */
export async function uploadMedia(file: Blob, fileName: string, collection: MediaCollection = "general"): Promise<UploadResult> {
  const { blob, name } = await prepareForLibrary(file, fileName, collection);
  if (blob.size > MEDIA_MAX_BYTES) throw new Error(`«${name}» أكبر من 5 ميجا حتى بعد التصغير — جرّب صورة أصغر.`);
  const body = new FormData();
  body.append("file", blob, name);
  body.append("collection", collection);
  const res = await apiFetch<{ data: RawFile; url?: string; duplicate?: boolean }>("/media", { method: "POST", body });
  invalidateApiCache("/media");
  const f = res.data ?? ({ path: "", url: res.url || "", name, collection, size: blob.size, last_modified: "" } as RawFile);
  return { ...toFile({ ...f, url: f.url || res.url || "" }), duplicate: Boolean(res.duplicate) };
}

export type DeleteResult = { trashed: string[]; skipped: Array<{ path: string; reason: string; used_in?: string[] }> };

/** Move unused files to the backend's trash. Files the site uses are skipped (never removed). */
export async function deleteMedia(paths: string | string[]): Promise<DeleteResult> {
  const list = Array.isArray(paths) ? paths : [paths];
  const res = await apiFetch<Partial<DeleteResult>>("/media", { method: "DELETE", body: list.length === 1 ? { path: list[0], paths: list } : { paths: list } });
  invalidateApiCache("/media");
  return { trashed: res?.trashed ?? (list.length === 1 ? list : []), skipped: res?.skipped ?? [] };
}
