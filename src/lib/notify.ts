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
 *
 * The same message shown again while it is still on screen (a button pressed twice) replaces the
 * visible toast instead of stacking a copy under it.
 */
type Message = ReactNode;
type Kind = "success" | "error" | "info" | "warning";

/** A stable id for a plain-text message, so a repeat updates the toast already on screen. */
function sameMessageId(kind: Kind, message: Message, opts?: ExternalToast): ExternalToast | undefined {
  if (opts?.id !== undefined || typeof message !== "string") return opts;
  const description = typeof opts?.description === "string" ? opts.description : "";
  return { ...opts, id: `${kind}:${message}:${description}` };
}

export const toast = {
  success: (message: Message, opts?: ExternalToast) => sonner.success(message, sameMessageId("success", message, opts)),
  error: (message: Message, opts?: ExternalToast) => sonner.error(message, sameMessageId("error", message, opts)),
  info: (message: Message, opts?: ExternalToast) => sonner.info(message, sameMessageId("info", message, opts)),
  warning: (message: Message, opts?: ExternalToast) => sonner.warning(message, sameMessageId("warning", message, opts)),
  loading: (message: Message, opts?: ExternalToast) => sonner.loading(message, opts),
  dismiss: (id?: string | number) => sonner.dismiss(id),
};

/** A readable reason for any failure (API error, network error, thrown string). */
export function errorReason(err: unknown): string {
  return apiErrorMessageAr(err);
}

/** Error toast with a readable reason: `notifyError(err, "تعذّر الحفظ")`. */
export function notifyError(err: unknown, title: Message = "حدث خطأ") {
  return toast.error(title, { description: errorReason(err) });
}
