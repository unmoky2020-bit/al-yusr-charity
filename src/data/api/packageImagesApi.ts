/**
 * Pictures of the donation packages (الأسهم / الباقات), kept in their own table on the backend
 * (bundle backend-handoff/deploy-2026-11-13-extras):
 *   GET    /package-images                   public map package_id → { image, alt_ar, alt_en }
 *   PUT    /admin/package-images/{package}   { image, alt_ar?, alt_en? }
 *   DELETE /admin/package-images/{package}
 * Before the bundle is deployed GET answers 404: the map is empty and the site shows no pictures.
 */
import { useQuery } from "@tanstack/react-query";
import { apiFetch, formatServerImageUrl, invalidateApiCache } from "@/data/laravelApi";

export type PackageImage = { image: string; altAr?: string; altEn?: string };
export type PackageImageMap = Record<number, PackageImage>;

type Raw = { image?: unknown; alt_ar?: unknown; alt_en?: unknown };

const s = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);

/** Parse the backend answer ({ data: { "12": {...} } } or the bare map); bad rows are dropped. */
export function parsePackageImages(res: unknown): PackageImageMap {
  const body = res && typeof res === "object" && "data" in (res as object) ? (res as { data: unknown }).data : res;
  const out: PackageImageMap = {};
  if (!body || typeof body !== "object" || Array.isArray(body)) return out;
  for (const [k, v] of Object.entries(body as Record<string, Raw>)) {
    const id = Number(k);
    const image = formatServerImageUrl(s(v?.image) ?? null);
    if (!Number.isInteger(id) || id <= 0 || !image || image === "/placeholder.svg") continue;
    const row: PackageImage = { image };
    const altAr = s(v?.alt_ar);
    const altEn = s(v?.alt_en);
    if (altAr) row.altAr = altAr;
    if (altEn) row.altEn = altEn;
    out[id] = row;
  }
  return out;
}

/** Public map; any failure (bundle not deployed, network) = no pictures. */
export async function fetchPackageImages(): Promise<PackageImageMap> {
  try {
    return parsePackageImages(await apiFetch<unknown>("/package-images", { method: "GET", ttlMs: 60_000 }));
  } catch {
    return {};
  }
}

export const packageImagesAdminApi = {
  async list(): Promise<PackageImageMap> {
    return parsePackageImages(await apiFetch<unknown>("/package-images", { method: "GET", useCache: false }));
  },
  async set(packageId: number, body: { image: string; alt_ar?: string | null }): Promise<void> {
    await apiFetch(`/admin/package-images/${packageId}`, { method: "PUT", body });
    invalidateApiCache("/package-images");
  },
  async remove(packageId: number): Promise<void> {
    await apiFetch(`/admin/package-images/${packageId}`, { method: "DELETE" });
    invalidateApiCache("/package-images");
  },
};

/** Public hook: the package pictures (empty until the backend bundle is live). */
export function usePackageImages(): PackageImageMap {
  const q = useQuery({ queryKey: ["package-images"], queryFn: fetchPackageImages, staleTime: 5 * 60_000, retry: false });
  return q.data ?? EMPTY;
}
const EMPTY: PackageImageMap = {};
