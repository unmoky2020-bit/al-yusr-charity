/**
 * Service pages (/services/:slug, cards on /services-map) → Laravel.
 *
 * Endpoints (NEW — proposed; documented in backend-handoff/01-replace-supabase-public.md).
 * Field names match the public reader in src/data/sources/services.ts (mapApiService).
 *   GET    /services                 public  → active services, sorted by sort_order
 *   GET    /services?all=1           staff   → also inactive ones (admin list)
 *   GET    /services/{slug}          public  → one service (full detail)
 *   POST   /services                 staff   → create
 *   PUT    /services/{slug}          staff   → update (partial body allowed)
 *   DELETE /services/{slug}          staff
 *   POST   /services/reorder         staff   { slugs: string[] }
 *   GET    /service-categories       public  (sector chips / admin select)
 *
 * All functions throw ApiError on non-2xx — callers decide about static fallbacks.
 */
import { ApiError, apiFetch, invalidateApiCache } from "@/data/laravelApi";

export type RawService = Record<string, unknown>;

function unwrapList(res: unknown): RawService[] {
  if (Array.isArray(res)) return res as RawService[];
  const d = (res as { data?: unknown } | null)?.data;
  if (Array.isArray(d)) return d as RawService[];
  const dd = (d as { data?: unknown } | null)?.data;
  return Array.isArray(dd) ? (dd as RawService[]) : [];
}

function unwrapOne(res: unknown): RawService | null {
  const d = (res as { data?: unknown } | null)?.data ?? res;
  return d && typeof d === "object" && !Array.isArray(d) ? (d as RawService) : null;
}

const enc = (slug: string) => encodeURIComponent(slug);

export async function fetchServices(opts: { all?: boolean } = {}): Promise<RawService[]> {
  const res = await apiFetch<unknown>("/services", {
    method: "GET",
    params: { per_page: 100, ...(opts.all ? { all: 1 } : {}) },
    useCache: !opts.all,
    ttlMs: 60_000,
  });
  return unwrapList(res);
}

export async function fetchService(slug: string): Promise<RawService | null> {
  try {
    const res = await apiFetch<unknown>(`/services/${enc(slug)}`, { method: "GET", ttlMs: 60_000 });
    return unwrapOne(res);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

/** Update by slug; when the service does not exist yet (404) create it. */
export async function saveService(slug: string, payload: RawService): Promise<RawService | null> {
  try {
    const res = await apiFetch<unknown>(`/services/${enc(slug)}`, { method: "PUT", body: payload });
    invalidateApiCache("/services");
    return unwrapOne(res);
  } catch (err) {
    if (!(err instanceof ApiError) || err.status !== 404) throw err;
  }
  const res = await apiFetch<unknown>("/services", { method: "POST", body: { slug, ...payload } });
  invalidateApiCache("/services");
  return unwrapOne(res);
}

export async function patchService(slug: string, payload: RawService): Promise<void> {
  await apiFetch<unknown>(`/services/${enc(slug)}`, { method: "PUT", body: payload });
  invalidateApiCache("/services");
}

export async function deleteService(slug: string): Promise<void> {
  await apiFetch<unknown>(`/services/${enc(slug)}`, { method: "DELETE" });
  invalidateApiCache("/services");
}

export async function reorderServices(slugs: string[]): Promise<void> {
  await apiFetch<unknown>("/services/reorder", { method: "POST", body: { slugs } });
  invalidateApiCache("/services");
}

export interface ServiceCategory {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string;
  sort_order: number;
  is_active: boolean;
}

export async function fetchServiceCategories(): Promise<ServiceCategory[]> {
  const res = await apiFetch<unknown>("/service-categories", { method: "GET", ttlMs: 5 * 60_000 });
  return unwrapList(res).map((r) => ({
    id: String(r.id ?? r.slug ?? ""),
    slug: String(r.slug ?? ""),
    name_ar: String(r.title_ar ?? r.name_ar ?? r.name ?? ""),
    name_en: String(r.title_en ?? r.name_en ?? r.title_ar ?? r.name_ar ?? r.name ?? ""),
    sort_order: Number(r.sort_order ?? 0) || 0,
    is_active: r.is_active === undefined ? true : Boolean(r.is_active),
  }));
}
