import { useSyncExternalStore } from "react";

/**
 * The foundation's name, address, phone and hours in one place (NAP). Local search ranks a place
 * higher when these are identical everywhere: this site, Google Business Profile, Facebook and
 * directories. The values below are the built-in copy; the dashboard («بيانات المؤسسة», backend
 * block `org_info`) overrides them at runtime through applyOrgInfo(). Copy the same text to the
 * Google profile whenever it changes.
 */
const DEFAULT_ORG = {
  nameAr: "مؤسسة اليسر الخيرية",
  nameEn: "Al-Yusr Charity Foundation",
  registrationAr: "مشهرة برقم 2665 لسنة 2019 — وزارة التضامن الاجتماعي",
  registrationEn: "Registered NGO No. 2665 of 2019 — Ministry of Social Solidarity",
  addressAr: "المنصورة، تقسيم خطاب، بجوار وكالة المنصورة",
  addressEn: "Mansoura, Khattab District, next to Mansoura Agency",
  cityAr: "المنصورة",
  governorateAr: "الدقهلية",
  postalCode: "35511",
  phoneE164: "+201097000137",
  phoneDisplay: "0109 700 0137",
  whatsapp: "201097000137",
  email: "info@elyusr.org",
  geo: { lat: 31.0298521, lng: 31.3655258 },
  mapsUrl: "https://maps.app.goo.gl/VYc3KdxrU1DQWwFf6",
  mapsEmbed:
    "https://maps.google.com/maps?q=31.0298521,31.3655258+(%D9%85%D8%A4%D8%B3%D8%B3%D8%A9%20%D8%A7%D9%84%D9%8A%D8%B3%D8%B1%20%D8%A7%D9%84%D8%AE%D9%8A%D8%B1%D9%8A%D8%A9)&t=&z=16&ie=UTF8&iwloc=B&output=embed",
  /** Landmark from the Google Business Profile address. */
  landmarkAr: "أمام المصرية الكندية للمطابخ",
  landmarkEn: "opposite Egyptian Canadian Kitchens",
  /** Google Maps plus code of the office. */
  plusCode: "29H8+W6 المنصورة",
  /**
   * Same hours as the Google Business Profile (confirmed 2026-11-03): Saturday to Thursday 10:00–21:00,
   * Friday closed (no opening hours are published for it).
   */
  hours: {
    days: ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"] as string[],
    opens: "10:00",
    closes: "21:00",
    labelAr: "السبت – الخميس: 10 ص – 9 م (الجمعة إجازة)",
    labelEn: "Sat – Thu: 10am – 9pm (closed Friday)",
  },
  /**
   * The «write a review» link from the Google Business Profile (Reviews ← Get more reviews ← copy link).
   * Until it is filled in, the review buttons open the Maps profile, which has a «Write a review» button.
   */
  reviewUrl: "",
  social: {
    facebook: "https://www.facebook.com/Elyosr.Charity/",
    instagram: "https://instagram.com/elyosr.charity",
    youtube: "",
    tiktok: "",
    x: "",
    linkedin: "",
  },
};

export type OrgInfo = {
  -readonly [K in keyof typeof DEFAULT_ORG]: (typeof DEFAULT_ORG)[K] extends object
    ? { -readonly [P in keyof (typeof DEFAULT_ORG)[K]]: (typeof DEFAULT_ORG)[K][P] }
    : (typeof DEFAULT_ORG)[K];
};

const clone = (): OrgInfo => ({
  ...DEFAULT_ORG,
  geo: { ...DEFAULT_ORG.geo },
  hours: { ...DEFAULT_ORG.hours, days: [...DEFAULT_ORG.hours.days] },
  social: { ...DEFAULT_ORG.social },
});

/** The live organisation data (built-in copy + dashboard overrides). Read it inside render through useOrg(). */
export const ORG: OrgInfo = clone();

/** Fields of the backend block `org_info` → where they go in ORG. */
export type RemoteOrgInfo = Partial<Record<
  | "name_ar" | "name_en" | "phone" | "phone_display" | "whatsapp" | "email" | "address_ar" | "address_en"
  | "hours_ar" | "hours_en" | "license_ar" | "license_en" | "maps_url" | "review_url"
  | "facebook" | "instagram" | "youtube" | "tiktok" | "x" | "linkedin",
  string | null
>>;

let version = 0;
const listeners = new Set<() => void>();

const txt = (v: unknown, max = 500) => (typeof v === "string" && v.trim() && v.trim().length <= max ? v.trim() : undefined);
const https = (v: unknown) => { const t = txt(v, 2048); return t && /^https:\/\/\S+$/.test(t) ? t : undefined; };

/**
 * Apply the dashboard's `org_info` over the built-in copy (null / missing = keep the built-in value).
 * Invalid values are ignored, so a bad save can never blank the phone or break a link.
 */
export function applyOrgInfo(remote: RemoteOrgInfo | null | undefined): void {
  const next = clone();
  const r = remote ?? {};
  const set = <K extends keyof OrgInfo>(k: K, v: OrgInfo[K] | undefined) => { if (v !== undefined) next[k] = v; };
  set("nameAr", txt(r.name_ar, 200));
  set("nameEn", txt(r.name_en, 200));
  const phone = txt(r.phone, 30)?.replace(/[\s-]/g, "");
  if (phone && /^\+\d{8,15}$/.test(phone)) next.phoneE164 = phone;
  set("phoneDisplay", txt(r.phone_display, 40));
  const wa = txt(r.whatsapp, 30)?.replace(/\D/g, "");
  if (wa && wa.length >= 8) next.whatsapp = wa;
  const email = txt(r.email, 200);
  if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = email;
  set("addressAr", txt(r.address_ar));
  set("addressEn", txt(r.address_en));
  const hAr = txt(r.hours_ar, 200);
  const hEn = txt(r.hours_en, 200);
  if (hAr) next.hours.labelAr = hAr;
  if (hEn) next.hours.labelEn = hEn;
  set("registrationAr", txt(r.license_ar, 300));
  set("registrationEn", txt(r.license_en, 300));
  set("mapsUrl", https(r.maps_url));
  set("reviewUrl", https(r.review_url));
  for (const k of Object.keys(next.social) as (keyof OrgInfo["social"])[]) {
    const v = https(r[k]);
    if (v) next.social[k] = v;
  }
  if (JSON.stringify(next) === JSON.stringify(ORG)) return;
  Object.assign(ORG, next);
  version += 1;
  listeners.forEach((l) => l());
}

/** The live organisation data; re-renders when the dashboard's copy arrives. */
export function useOrg(): OrgInfo {
  useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => version,
    () => version,
  );
  return ORG;
}

/** Social profile links that are set, in display order. */
export const orgSocialLinks = (o: OrgInfo = ORG) =>
  (Object.entries(o.social) as [keyof OrgInfo["social"], string][]).filter(([, url]) => !!url);

/** Where «قيّمنا على جوجل» goes. */
export const googleReviewLink = () => ORG.reviewUrl || ORG.mapsUrl;

export const whatsappLink = (text: string) => `https://wa.me/${ORG.whatsapp}?text=${encodeURIComponent(text)}`;

/** Open right now? Office hours are Cairo time (ORG.hours), whatever the visitor's clock says. */
export function isOfficeOpen(now = new Date()): boolean {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Cairo", weekday: "long", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const minutes = Number(get("hour")) * 60 + Number(get("minute"));
  const at = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
  return ORG.hours.days.includes(get("weekday")) && minutes >= at(ORG.hours.opens) && minutes < at(ORG.hours.closes);
}
