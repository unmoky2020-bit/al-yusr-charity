/**
 * Shared helpers for admin API wrappers (agent A2).
 *
 * Unlike `resource().list()` in laravelApi.ts, these helpers do NOT swallow errors:
 * a failing request throws, so the screen can show a real error / "pending backend" state
 * instead of an empty list that looks like success.
 */
import { ApiError, apiFetch, getApiToken } from "@/data/laravelApi";

/** Shown when a proposed endpoint does not exist yet on the Laravel backend (404/405). */
export const FEATURE_PENDING_MSG = "هذه الميزة تحتاج تفعيل من الباك إند";

/** True when the error means "this route is not implemented on the backend yet". */
export function isEndpointMissing(err: unknown): boolean {
  const status = (err as { status?: number } | null)?.status;
  return status === 404 || status === 405 || status === 501;
}

/** Human readable Arabic error message for a failed request. */
export function apiErrorMessage(err: unknown, fallback = "تعذر تنفيذ العملية، حاول مرة أخرى"): string {
  if (isEndpointMissing(err)) return FEATURE_PENDING_MSG;
  if (err instanceof ApiError) {
    if (err.status === 403) return "ليس لديك صلاحية لتنفيذ هذه العملية";
    if (err.status === 401) return "انتهت الجلسة، سجّل الدخول مرة أخرى";
    return err.message || fallback;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

/** Extracts an array from the usual Laravel shapes: `[...]`, `{data: [...]}`, `{data: {data: [...]}}`. */
export function unwrapList<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[];
  const obj = res as { data?: unknown } | null;
  if (obj && Array.isArray(obj.data)) return obj.data as T[];
  const inner = obj?.data as { data?: unknown } | undefined;
  if (inner && Array.isArray(inner.data)) return inner.data as T[];
  return [];
}

/** Extracts a single record from `{data: {...}}` or returns the object itself. */
export function unwrapItem<T>(res: unknown): T {
  const obj = res as { data?: unknown } | null;
  if (obj && typeof obj === "object" && "data" in obj && obj.data && typeof obj.data === "object" && !Array.isArray(obj.data)) {
    return obj.data as T;
  }
  return res as T;
}

/**
 * Admin reads always carry the signed-in user's token (so drafts / private rows are returned).
 * Note: for paths listed as "public" in laravelApi.ts (e.g. /stories) apiFetch currently drops the
 * token on GET; see backend-handoff/02-replace-supabase-admin.md for the one-line fix.
 */
const authOpts = () => ({ token: getApiToken() });

/** GET a list; throws on failure (no silent empty array). */
export async function fetchList<T>(path: string, params?: Record<string, unknown>): Promise<T[]> {
  const res = await apiFetch<unknown>(path, { method: "GET", params, useCache: false, ...authOpts() });
  return unwrapList<T>(res);
}

/** GET a single record; throws on failure. */
export async function fetchItem<T>(path: string): Promise<T> {
  const res = await apiFetch<unknown>(path, { method: "GET", useCache: false, ...authOpts() });
  return unwrapItem<T>(res);
}

/** POST/PUT/PATCH/DELETE with a JSON (or FormData) body; throws on failure. */
export async function sendJson<T>(
  path: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  body?: unknown,
): Promise<T> {
  const res = await apiFetch<unknown>(path, { method, body, useCache: false });
  return unwrapItem<T>(res);
}
