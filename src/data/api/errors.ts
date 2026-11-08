import { ApiError } from "@/data/laravelApi";

export const NEEDS_BACKEND_AR = "يحتاج تفعيل من الباك إند";

/** Arabic, human-readable reason for a failed request (API error, network error or thrown Error). */
export function apiErrorMessageAr(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 404 || err.status === 405) return `${NEEDS_BACKEND_AR} (HTTP ${err.status})`;
    if (err.status === 0) return err.message || "تعذر الاتصال بالخادم";
    if (err.status === 401) return "انتهت الجلسة، سجّل الدخول مرة أخرى";
    if (err.status === 403) return "ليس لديك صلاحية لهذا الإجراء";
    if (err.status === 422) return `بيانات غير مقبولة من الخادم: ${err.message}`;
    if (err.status >= 500) return `خطأ في الخادم (HTTP ${err.status}): ${err.message}`;
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return "حدث خطأ غير معروف";
}
