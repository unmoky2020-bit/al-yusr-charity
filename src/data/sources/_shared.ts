/**
 * Shared helpers for the content-source adapters in src/data/sources.
 *
 * Every adapter follows the same contract:
 *  - CONTENT_SOURCE === "static" -> return the static TS data (same reference, no network).
 *  - otherwise                    -> fetch the Laravel API, map each record to the EXISTING static type,
 *                                    keep the static item for any key the API does not (publicly) have,
 *                                    and return all static data on error / empty response.
 */
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch, formatServerImageUrl } from "@/data/laravelApi";
import { useApiContent, type ContentSource } from "@/lib/contentSource";

// API JSON is loosely typed on purpose: mappers read optional / renamed fields defensively.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ApiRecord = Record<string, any>;

/** Unwraps `[...]`, `{ data: [...] }` and paginated `{ data: { data: [...] } }` responses. */
export function unwrapList(res: unknown): ApiRecord[] {
  if (Array.isArray(res)) return res as ApiRecord[];
  if (res && typeof res === "object") {
    const d = (res as ApiRecord).data;
    if (Array.isArray(d)) return d;
    if (d && typeof d === "object" && Array.isArray((d as ApiRecord).data)) return (d as ApiRecord).data;
  }
  return [];
}

/** Unwraps `{ data: {...} }` or a bare object. */
export function unwrapOne(res: unknown): ApiRecord | null {
  if (!res || typeof res !== "object" || Array.isArray(res)) return null;
  const d = (res as ApiRecord).data;
  if (d && typeof d === "object" && !Array.isArray(d)) return d as ApiRecord;
  return res as ApiRecord;
}

/** Number from "1400.00" / 1400 / null. Returns undefined when not a finite number. */
export function num(v: unknown): number | undefined {
  if (v === null || v === undefined || v === "") return undefined;
  const n = typeof v === "number" ? v : Number(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : undefined;
}

/** Trimmed non-empty string, else undefined. */
export function str(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t ? t : undefined;
}

/** First non-empty string among the candidates. */
export function pick(...vals: unknown[]): string | undefined {
  for (const v of vals) {
    const s = str(v);
    if (s) return s;
  }
  return undefined;
}

/** Non-empty array of non-empty strings, else undefined. */
export function strList(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out = v.map((x) => (typeof x === "string" ? x.trim() : "")).filter(Boolean);
  return out.length ? out : undefined;
}

/** Long text -> paragraphs (split on blank lines). Arrays pass through. */
export function paragraphs(v: unknown): string[] | undefined {
  if (Array.isArray(v)) return strList(v);
  const s = str(v);
  if (!s) return undefined;
  const parts = s.split(/\r?\n\s*\r?\n/).map((p) => p.trim()).filter(Boolean);
  return parts.length ? parts : undefined;
}

/** API image -> usable URL, or undefined (placeholder / empty are treated as missing). */
export function image(...vals: unknown[]): string | undefined {
  for (const v of vals) {
    const u = formatServerImageUrl(typeof v === "string" ? v : null);
    if (u && u !== "/placeholder.svg") return u;
  }
  return undefined;
}

/** "https://elyusr.org/food-box" -> "food-box"; "  Box " -> "box". */
export function normalizeSlug(v: unknown): string {
  const s = str(typeof v === "number" ? String(v) : v);
  if (!s) return "";
  let out = s;
  if (/^https?:\/\//i.test(out) || out.includes("/")) {
    out = out.replace(/[?#].*$/, "").replace(/\/+$/, "");
    out = out.slice(out.lastIndexOf("/") + 1);
  }
  return out.trim().toLowerCase();
}

/**
 * Policy switch: a record that EXISTS in the API but is unpublished / inactive / hidden
 *   true  -> the static copy of that item is still shown (safe while the DB is being filled);
 *   false -> the item is removed from the public list (the admin's "hide" wins).
 * Flip to false once the seeded pages have been compared and approved.
 */
export const HIDDEN_RECORDS_FALL_BACK_TO_STATIC = true;

/** Active + published (ignores `hide_from_audience`). Used for donate-form entities. */
export function isActiveRecord(r: ApiRecord): boolean {
  if (r.is_active === false || r.is_active === 0) return false;
  if (r.is_public === false || r.is_public === 0) return false;
  const status = str(r.status) ?? str(r.workflow_status);
  if (status && status !== "published" && status !== "active") return false;
  return true;
}

/** Active + published + not hidden from the audience. Used for public listings and pages. */
export function isPublicRecord(r: ApiRecord): boolean {
  if (!isActiveRecord(r)) return false;
  if (r.hide_from_audience === true || r.hide_from_audience === 1) return false;
  return true;
}

/**
 * Seeder rows keep frontend-only values under an `extra` JSON column. Lift them to the top level when the
 * top-level column is missing/empty, so mappers can read `r.color` whether or not the column exists yet.
 */
export function withExtra(r: ApiRecord): ApiRecord {
  const extra = r && typeof r.extra === "object" && r.extra && !Array.isArray(r.extra) ? (r.extra as ApiRecord) : null;
  if (!extra) return r;
  const out: ApiRecord = { ...r };
  for (const [k, v] of Object.entries(extra)) {
    if (out[k] === undefined || out[k] === null || out[k] === "") out[k] = v;
  }
  return out;
}

/**
 * Public key of a record: the first of [explicit key fields, slug, landing_slug, aliases[]] that matches a
 * static key; otherwise `aliasMap[slug]`; otherwise the normalized slug.
 */
export function resolveRecordKey(
  raw: ApiRecord,
  staticKeys: Set<string>,
  aliasMap: Record<string, string> = {},
  explicitFields: string[] = [],
): string {
  const r = withExtra(raw);
  const slug = normalizeSlug(r.slug);
  const aliases = Array.isArray(r.aliases) ? (r.aliases as unknown[]) : [];
  const candidates = [...explicitFields.map((f) => r[f]), r.slug, r.landing_slug, ...aliases].map(normalizeSlug).filter(Boolean);
  const hit = candidates.find((c) => staticKeys.has(c));
  if (hit) return hit;
  if (slug && aliasMap[slug]) return aliasMap[slug];
  return slug;
}

/**
 * Merge API items over static items by key.
 *  - static order is kept; a static item is replaced by the API item with the same key;
 *  - static items the API does not have stay (per-item fallback);
 *  - API-only items are appended at the end;
 *  - an empty API list returns the static list itself (same reference);
 *  - keys in `hiddenKeys` (records the API has but does not publish) are dropped when
 *    HIDDEN_RECORDS_FALL_BACK_TO_STATIC is false.
 */
export function mergeByKey<T>(
  staticItems: T[],
  apiItems: T[],
  keyOf: (x: T) => string,
  hiddenKeys: Set<string> = new Set(),
): T[] {
  const base =
    !HIDDEN_RECORDS_FALL_BACK_TO_STATIC && hiddenKeys.size ? staticItems.filter((s) => !hiddenKeys.has(keyOf(s))) : staticItems;
  if (!apiItems.length) return base;
  const apiByKey = new Map<string, T>();
  for (const it of apiItems) {
    const k = keyOf(it);
    if (k && !apiByKey.has(k)) apiByKey.set(k, it);
  }
  const used = new Set<string>();
  const out: T[] = base.map((s) => {
    const k = keyOf(s);
    const a = apiByKey.get(k);
    if (a) {
      used.add(k);
      return a;
    }
    return s;
  });
  for (const [k, a] of apiByKey) if (!used.has(k)) out.push(a);
  return out;
}

/** GET a public list endpoint and unwrap it. Throws on network / HTTP errors. */
export async function fetchPublicList(path: string, params?: Record<string, unknown>): Promise<ApiRecord[]> {
  const res = await apiFetch<unknown>(path, { method: "GET", params, ttlMs: 60_000 });
  return unwrapList(res);
}

/**
 * Generic hook: returns `staticValue` when the flag is "static" (no request is made),
 * otherwise fetches with `fetcher` and resolves the final value with `resolve`.
 * While loading or on error the static value is returned so pages never render empty.
 */
export function useSourced<TRaw, TOut>(
  key: readonly unknown[],
  fetcher: () => Promise<TRaw>,
  staticValue: TOut,
  resolve: (raw: TRaw) => TOut,
  opts: { enabled?: boolean; source?: ContentSource } = {},
): { data: TOut; isLoading: boolean; fromApi: boolean } {
  const enabled = (opts.source ? opts.source !== "static" : useApiContent) && opts.enabled !== false;
  const q = useQuery({
    queryKey: ["content-source", ...key],
    queryFn: fetcher,
    enabled,
    staleTime: 5 * 60_000,
    retry: 1,
  });
  const raw = enabled && !q.isError ? q.data : undefined;
  // `resolve` is a pure mapper; only the fetched payload (and the static value) can change the result.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const resolved = useMemo(() => (raw === undefined ? undefined : resolve(raw)), [raw, staticValue]);
  if (resolved === undefined) {
    return { data: staticValue, isLoading: enabled && q.isLoading, fromApi: false };
  }
  return { data: resolved, isLoading: false, fromApi: true };
}
