/**
 * Helpers for admin writes that call endpoints the Laravel backend may not have yet.
 *
 * A 404 / 405 on a write means "the route does not exist yet" (proposed in backend-handoff/05-…md):
 * the screen must say so instead of pretending the change was saved.
 */
import { ApiError } from "@/data/laravelApi";

export const BACKEND_PENDING_AR = "يحتاج تفعيل من الباك إند";

/**
 * Admin screens that still call endpoints missing on the live backend (checked against
 * `php artisan route:list` on 2026-10-29). The sidebar tags them and AdminLayout shows the
 * details on the page. Remove an entry once its endpoints are live.
 * Everything not listed here was verified live on 2026-10-29.
 * `partial`: the screen works, only the listed parts are missing.
 */
export const PENDING_ADMIN_SCREENS: Record<string, { partial: boolean; missing: string[] }> = {
};

/** The pending entry for a pathname (exact match, then the closest parent like /admin/cases/12). */
export function pendingForPath(pathname: string): { href: string; partial: boolean; missing: string[] } | null {
  const clean = pathname.replace(/\/+$/, "");
  const href = Object.keys(PENDING_ADMIN_SCREENS)
    .filter((h) => clean === h || clean.startsWith(h + "/"))
    .sort((a, b) => b.length - a.length)[0];
  return href ? { href, ...PENDING_ADMIN_SCREENS[href] } : null;
}

/** True when the error means the endpoint is missing on the backend (route not found / method not allowed). */
export function isEndpointMissing(err: unknown): boolean {
  const status = (err as { status?: number } | null)?.status;
  return err instanceof ApiError ? err.status === 404 || err.status === 405 : status === 404 || status === 405;
}

/** Arabic description for a failed admin write: a clear "needs backend" note for missing routes, else the server message. */
export function describeWriteError(err: unknown, endpointLabel?: string): string {
  if (isEndpointMissing(err)) {
    return endpointLabel ? `${BACKEND_PENDING_AR}: ${endpointLabel}` : BACKEND_PENDING_AR;
  }
  const msg = (err as { message?: string } | null)?.message;
  return msg || "حدث خطأ غير متوقع أثناء الحفظ";
}
