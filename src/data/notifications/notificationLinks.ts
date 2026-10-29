/**
 * Where a notification opens in the dashboard. New notifications carry `url` from the backend;
 * older rows (before 2026-10-29) only have a type and ids, so the link is rebuilt from those.
 */
export type NotificationCategory = "donation" | "user" | "program" | "inbox" | "system";

export interface NotificationTypeInfo {
  category: NotificationCategory;
  labelAr: string;
  link?: (data: Record<string, unknown>) => string | null;
}

export const NOTIFICATION_TYPES: Record<string, NotificationTypeInfo> = {
  new_donation: {
    category: "donation",
    labelAr: "تبرعات بانتظار التأكيد",
    link: (d) => (d.donation_id ? `/admin/donations/${d.donation_id}` : "/admin/donations"),
  },
  donation_paid: {
    category: "donation",
    labelAr: "تبرعات مدفوعة",
    link: (d) => (d.donation_id ? `/admin/donations/${d.donation_id}` : "/admin/donations"),
  },
  // Wallet numbers / bank accounts donors pay to were changed (anti-fraud alert).
  payout_details_changed: { category: "system", labelAr: "حسابات الاستلام", link: () => "/admin/payment-methods" },
  new_user: { category: "user", labelAr: "مستخدمين", link: () => "/admin/users" },
  program_target_reached: {
    category: "program",
    labelAr: "برامج",
    link: (d) => (d.program_id ? `/admin/programs/${d.program_id}` : "/admin/programs"),
  },
  new_contact_message: { category: "inbox", labelAr: "رسائل", link: () => "/admin/inbox" },
  new_khabia_request: { category: "inbox", labelAr: "الخبيئة", link: () => "/admin/delegates" },
  welcome: { category: "system", labelAr: "النظام" },
};

export function notificationTypeInfo(type: string): NotificationTypeInfo {
  return NOTIFICATION_TYPES[type] ?? { category: "system", labelAr: "النظام" };
}

/** Internal dashboard link only (never an external URL from the payload). */
export function notificationLink(type: string, url: string | null, data: Record<string, unknown>): string | null {
  if (url && url.startsWith("/")) return url;
  return notificationTypeInfo(type).link?.(data) ?? null;
}
