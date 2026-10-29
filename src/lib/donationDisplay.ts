/**
 * How a donation is shown in the dashboard: status label/tone, target label, money and month formatting.
 * One place for the three donation screens (list, home, analytics).
 */
import type { AdminDonation } from "@/data/api/donationsAdminApi";

type Lang = "ar" | "en";

/**
 * Status label. "pending" means two different things: an online card payment the donor has not finished
 * (the gateway will confirm it by itself), or a manual method (transfer, wallet, pickup) waiting for the team.
 */
export function donationStatusLabel(status: string, isGateway: boolean, lang: Lang): string {
  const s = String(status || "").toLowerCase();
  const ar = lang === "ar";
  switch (s) {
    case "paid":
    case "completed":
      return ar ? "مدفوع" : "Paid";
    case "pending":
      return isGateway ? (ar ? "لم يكتمل الدفع أونلاين" : "Online payment not completed") : ar ? "بانتظار تأكيدك" : "Awaiting confirmation";
    case "failed":
      return ar ? "فشل" : "Failed";
    case "refunded":
      return ar ? "مسترد" : "Refunded";
    case "cancelled":
      return ar ? "ملغي" : "Cancelled";
    default:
      return status || "—";
  }
}

/** Plain status name (no online/manual nuance) — for breakdowns by status. */
export function donationStatusName(status: string, lang: Lang): string {
  return String(status).toLowerCase() === "pending" ? (lang === "ar" ? "معلق" : "Pending") : donationStatusLabel(status, false, lang);
}

export function donationStatusTone(status: string, isGateway = false): string {
  switch (String(status || "").toLowerCase()) {
    case "paid":
    case "completed":
      return "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30";
    case "pending":
      return isGateway
        ? "bg-muted text-muted-foreground border border-border"
        : "bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30";
    case "failed":
      return "bg-rose-500/15 text-rose-800 dark:text-rose-300 border border-rose-500/30";
    default:
      return "bg-muted text-muted-foreground border border-border";
  }
}

/** What the donation was for: case › project › campaign › program › general. */
export function donationTargetLabel(d: AdminDonation, lang: Lang): string {
  const ar = lang === "ar";
  if (d.case) return `${ar ? "حالة" : "Case"}: ${d.case.title || d.case.code || `#${d.case.id}`}`;
  if (d.project) return `${ar ? "مشروع" : "Project"}: ${(ar ? d.project.name : d.project.name_en || d.project.name) || `#${d.project.id}`}`;
  if (d.donation_campaign) return `${ar ? "حملة" : "Campaign"}: ${(ar ? d.donation_campaign.name_ar : d.donation_campaign.name_en || d.donation_campaign.name_ar) || `#${d.donation_campaign.id}`}`;
  if (d.program) return (ar ? d.program.name_ar || d.program.name : d.program.name_en || d.program.name) || `#${d.program.id}`;
  return ar ? "تبرع عام" : "General donation";
}

export function donationMethodLabel(d: AdminDonation, lang: Lang): string {
  const m = d.payment_method_details;
  if (m) return (lang === "ar" ? m.name_ar : m.name_en || m.name_ar) || "—";
  return lang === "ar" ? "غير محدد" : "Unknown";
}

const locale = (lang: Lang) => (lang === "ar" ? "ar-EG" : "en-US");

export const formatNumber = (n: number, lang: Lang) => new Intl.NumberFormat(locale(lang)).format(Math.round(Number(n) || 0));

export const formatMoney = (n: number, lang: Lang) => `${formatNumber(n, lang)} ${lang === "ar" ? "ج.م" : "EGP"}`;

/** Short axis labels: 1.2 مليون / 350 ألف. */
export const formatCompact = (n: number, lang: Lang) =>
  new Intl.NumberFormat(locale(lang), { notation: "compact", maximumFractionDigits: 1 }).format(Number(n) || 0);

/** "2026-10" → "أكتوبر 2026" / "Oct 2026". */
export function formatMonth(month: string, lang: Lang, withYear = true): string {
  const [y, m] = month.split("-").map(Number);
  if (!y || !m) return month;
  return new Intl.DateTimeFormat(locale(lang), { month: lang === "ar" ? "long" : "short", ...(withYear ? { year: "numeric" } : {}) }).format(
    new Date(y, m - 1, 1),
  );
}

export function formatDateTime(iso: string, lang: Lang): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(locale(lang), {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}
