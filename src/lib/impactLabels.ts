/** Words and colours shared by the dashboard and the public transparency pages. */
import type { CaseItemStatus, CaseResult, ImpactKind, ImpactTarget } from "@/data/api/impactApi";
import { publicUrls } from "@/lib/publicUrls";
import type { DeliveryLineStage } from "@/lib/deliveryJourney";
import { formatNumberEN } from "@/lib/utils";

type L = { ar: string; en: string };

export const ITEM_STATUS: Record<CaseItemStatus, L & { tone: string; hintAr: string }> = {
  planned: { ar: "مطلوب", en: "Needed", tone: "bg-slate-100 text-slate-700", hintAr: "لسه ما اتشتراش" },
  purchased: { ar: "اتشترى", en: "Bought", tone: "bg-sky-100 text-sky-800", hintAr: "اتشترى وفي انتظار التسليم" },
  delivered: { ar: "اتسلّم", en: "Handed over", tone: "bg-emerald-100 text-emerald-800", hintAr: "وصل لأصحاب الحالة" },
  cancelled: { ar: "اتلغى", en: "Cancelled", tone: "bg-rose-50 text-rose-700 line-through decoration-rose-300", hintAr: "مش هيتنفذ" },
};

export const CASE_RESULT: Record<CaseResult, L & { tone: string; descAr: string }> = {
  completed: { ar: "اتنفذت بالكامل", en: "Completed", tone: "bg-emerald-100 text-emerald-800", descAr: "الحالة خلصت والمطلوب اتسلّم." },
  transferred: { ar: "الفلوس اتحولت", en: "Funds moved", tone: "bg-sky-100 text-sky-800", descAr: "المبلغ راح لحالة أو برنامج تاني (مكتوب فين)." },
  cancelled: { ar: "اتلغت", en: "Cancelled", tone: "bg-rose-100 text-rose-800", descAr: "الحالة اتلغت (مكتوب السبب والفلوس راحت فين)." },
};

/** A distribution day moves its donations to one of these. */
export const DISTRIBUTION_STAGE: Record<DeliveryLineStage, L & { tone: string; doneAr: string; descAr: string }> = {
  family_identified: { ar: "تحديد الأسر", en: "Families identified", tone: "bg-violet-100 text-violet-800", doneAr: "اتحددت الأسر", descAr: "بعد البحث الميداني، الأسر المستحقة اتحددت." },
  preparing: { ar: "تجهيز", en: "Preparing", tone: "bg-sky-100 text-sky-800", doneAr: "بيتجهز", descAr: "التبرعات بتتجهز (شراء / تعبئة)." },
  delivered: { ar: "تسليم", en: "Delivered", tone: "bg-emerald-100 text-emerald-800", doneAr: "اتسلّم", descAr: "التبرعات اتسلّمت للأسر." },
  on_hold: { ar: "تأجيل مؤقت", en: "Paused", tone: "bg-amber-100 text-amber-900", doneAr: "اتأجل", descAr: "حصل ظرف أخّر التسليم (لازم تكتب السبب)." },
};

export const KIND_LABEL: Record<ImpactKind, L> = {
  program: { ar: "برنامج", en: "Program" },
  project: { ar: "مشروع", en: "Project" },
  campaign: { ar: "حملة", en: "Campaign" },
  case: { ar: "حالة", en: "Case" },
};

/** Money as on the case pages: Latin digits ("12,500 ج.م"), whole pounds. */
export const egp = (n: number, lang: "ar" | "en" = "ar") => `${formatNumberEN(Math.round(Number(n) || 0))} ${lang === "ar" ? "ج.م" : "EGP"}`;

/** "2026-11-09" → "9 نوفمبر 2026" */
export function formatDay(iso: string | undefined | null, lang: "ar" | "en", withYear = true): string {
  if (!iso) return "";
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB", { day: "numeric", month: "long", ...(withYear ? { year: "numeric" } : {}) });
}

/** Today as yyyy-mm-dd in the device's time zone. */
export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** The report's link for a program / project / campaign / case. */
export const impactPath = (t: Pick<ImpactTarget, "kind" | "id" | "slug">) => `/impact/${t.kind}/${encodeURIComponent(t.slug || String(t.id))}`;

/** The record's own page on the site (program page, campaign landing, case page). */
export function targetPagePath(t: ImpactTarget): string | null {
  if (t.kind === "program" && t.slug) return publicUrls.program(t.slug);
  if (t.kind === "project" && t.slug) return publicUrls.project(t.slug);
  if (t.kind === "case" && t.slug) return publicUrls.case(t.slug);
  if (t.kind === "campaign") return publicUrls.donationCampaign({ slug: t.slug, id: t.id, name_ar: t.name });
  return null;
}
