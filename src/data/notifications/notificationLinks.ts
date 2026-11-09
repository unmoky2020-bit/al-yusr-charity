/**
 * What each notification is: its kind (for the icon and the filters), a label, and where it opens.
 * New notifications carry `url` from the backend; older rows (before 2026-10-29) only have a type
 * and ids, so the link is rebuilt from those.
 */
export type NotificationCategory = "donation" | "case" | "review" | "team" | "user" | "program" | "inbox" | "system";

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
  // Cases followed by a team member (backend: impact bundle + team notifications, 9 Nov 2026).
  case_follower_assigned: { category: "case", labelAr: "حالات بتتابعها", link: (d) => (d.case_id ? `/admin/cases/${d.case_id}` : "/admin/cases") },
  followed_case_donation: { category: "case", labelAr: "تبرعات لحالاتك", link: (d) => (d.case_id ? `/admin/cases/${d.case_id}` : "/admin/cases") },
  // The editors' approval flow.
  change_request_new: { category: "review", labelAr: "تعديلات للمراجعة", link: () => "/admin/review" },
  change_request_approved: { category: "review", labelAr: "تعديلاتك اتقبلت" },
  change_request_rejected: { category: "review", labelAr: "تعديلاتك اترجعت" },
  // Volunteers.
  new_volunteer: { category: "team", labelAr: "طلبات تطوع", link: () => "/admin/volunteers" },
  new_campaign_application: { category: "team", labelAr: "تسجيل في حملات", link: (d) => (d.campaign_id ? `/admin/campaigns/${d.campaign_id}` : "/admin/campaigns") },
  // To the donor's own account (backend: App\Support\NotifyDonor, 8 Nov 2026).
  donor_donation_paid: { category: "donation", labelAr: "تبرعاتي", link: () => "/dashboard?tab=donations" },
  donor_donation_failed: { category: "donation", labelAr: "تبرعاتي", link: () => "/dashboard?tab=donations" },
  donor_case_update: { category: "program", labelAr: "متابعة الحالات", link: (d) => (d.case_id ? `/cases/${d.case_id}` : null) },
};

/** Types named by their start: «donor_delivery_preparing», «donor_delivery_delivered»… */
const TYPE_PREFIXES: Array<[string, NotificationTypeInfo]> = [
  ["donor_delivery_", { category: "donation", labelAr: "رحلة تبرعي", link: () => "/dashboard?tab=donations" }],
];

export function notificationTypeInfo(type: string): NotificationTypeInfo {
  return NOTIFICATION_TYPES[type] ?? TYPE_PREFIXES.find(([p]) => type.startsWith(p))?.[1] ?? { category: "system", labelAr: "النظام" };
}

/** Internal dashboard link only (never an external URL from the payload). */
export function notificationLink(type: string, url: string | null, data: Record<string, unknown>): string | null {
  if (url && url.startsWith("/")) return url;
  return notificationTypeInfo(type).link?.(data) ?? null;
}

/** The kinds a team member can filter by, with the dashboard section that makes each one relevant. */
export const NOTIFICATION_CATEGORIES: Array<{ key: NotificationCategory; labelAr: string; labelEn: string; sections: string[] }> = [
  { key: "donation", labelAr: "التبرعات", labelEn: "Donations", sections: ["/admin/donations"] },
  { key: "case", labelAr: "الحالات", labelEn: "Cases", sections: ["/admin/cases", "/admin/my-cases"] },
  { key: "review", labelAr: "المراجعة والاعتماد", labelEn: "Approvals", sections: ["/admin/review", "/admin/blog", "/admin/content", "/admin/stories"] },
  { key: "team", labelAr: "المتطوعين", labelEn: "Volunteers", sections: ["/admin/volunteers", "/admin/campaigns"] },
  { key: "inbox", labelAr: "الرسائل", labelEn: "Messages", sections: ["/admin/inbox", "/admin/delegates"] },
  { key: "user", labelAr: "المستخدمين", labelEn: "Users", sections: ["/admin/users"] },
  { key: "program", labelAr: "البرامج", labelEn: "Programs", sections: ["/admin/programs"] },
  { key: "system", labelAr: "النظام", labelEn: "System", sections: [] },
];

/** The `types` the server filters by for one kind (a trailing * matches the start). */
export function typesOfCategory(category: NotificationCategory): string[] {
  const exact = Object.entries(NOTIFICATION_TYPES).filter(([, i]) => i.category === category).map(([t]) => t);
  const prefixes = TYPE_PREFIXES.filter(([, i]) => i.category === category).map(([p]) => `${p}*`);
  return [...exact, ...prefixes];
}
