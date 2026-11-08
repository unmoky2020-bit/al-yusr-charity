import type { ReactNode } from "react";
import { toast as sonner, type ExternalToast } from "sonner";
import { apiErrorMessageAr } from "@/data/api/errors";

/**
 * The site's ONE way to show a short message (toast). Nothing else imports the toast library:
 * pages and dashboards call this module, so the look (src/components/ui/sonner.tsx), the RTL close
 * button and the wording of errors are decided in one place.
 *
 *   toast.success("تم الحفظ")                    toast.error("تعذّر الحفظ", { description })
 *   notifyError(err, "تعذّر الحفظ")              → readable Arabic reason from any API error
 */
type Message = ReactNode;

export const toast = {
  success: (message: Message, opts?: ExternalToast) => sonner.success(message, opts),
  error: (message: Message, opts?: ExternalToast) => sonner.error(message, opts),
  info: (message: Message, opts?: ExternalToast) => sonner.info(message, opts),
  warning: (message: Message, opts?: ExternalToast) => sonner.warning(message, opts),
  loading: (message: Message, opts?: ExternalToast) => sonner.loading(message, opts),
  dismiss: (id?: string | number) => sonner.dismiss(id),
};

/** A readable reason for any failure (API error, network error, thrown string). */
export function errorReason(err: unknown): string {
  return apiErrorMessageAr(err);
}

/** Error toast with a readable reason: `notifyError(err, "تعذّر الحفظ")`. */
export function notifyError(err: unknown, title: Message = "حدث خطأ") {
  return sonner.error(title, { description: errorReason(err) });
}
