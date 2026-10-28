

const SS_KEY = "alyusr.ad.session";
const ATTR_KEY = "alyusr.ad.attr";

export type AdAttribution = {
  campaignId: string;
  slug: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  ts: number;
};

const getSessionId = (): string => {
  if (typeof window === "undefined") return "ssr";
  let id = sessionStorage.getItem(SS_KEY);
  if (!id) {
    id =
      (crypto?.randomUUID && crypto.randomUUID()) ||
      `s-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(SS_KEY, id);
  }
  return id;
};

export const readUtmFromUrl = (search: string = window.location.search) => {
  const sp = new URLSearchParams(search);
  const pick = (k: string) => sp.get(k) || undefined;
  return {
    utm_source: pick("utm_source"),
    utm_medium: pick("utm_medium"),
    utm_campaign: pick("utm_campaign"),
    utm_term: pick("utm_term"),
    utm_content: pick("utm_content"),
  };
};

export const persistAttribution = (a: AdAttribution) => {
  try {
    sessionStorage.setItem(ATTR_KEY, JSON.stringify(a));
    localStorage.setItem(ATTR_KEY, JSON.stringify(a));
  } catch { }
};

export const readAttribution = (): AdAttribution | null => {
  try {
    const raw =
      sessionStorage.getItem(ATTR_KEY) || localStorage.getItem(ATTR_KEY);
    return raw ? (JSON.parse(raw) as AdAttribution) : null;
  } catch {
    return null;
  }
};

type EventType =
  | "page_view"
  | "cta_click"
  | "donation_started"
  | "donation_completed"
  | "impression";

export const trackAdEvent = async (
  eventType: EventType,
  opts: {
    campaignId?: string;
    donationId?: string;
    donationAmount?: number;
    metadata?: Record<string, unknown>;
  } = {},
) => {
  const attr = readAttribution();
  const campaignId = opts.campaignId || attr?.campaignId;
  if (!campaignId) return;
  // Supabase removed - tracking is a no-op; payload kept for future use
  void { campaignId, attr, opts };
};

/** Append the persisted UTM params to a URL so attribution flows to /donate. */
export const appendUtm = (href: string): string => {
  const attr = readAttribution();
  if (!attr) return href;
  try {
    const u = new URL(href, window.location.origin);
    const set = (k: keyof AdAttribution) => {
      const v = attr[k];
      if (typeof v === "string" && v && !u.searchParams.has(k)) u.searchParams.set(k, v);
    };
    (["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const).forEach(set);
    if (!u.searchParams.has("ad")) u.searchParams.set("ad", attr.slug);
    return u.pathname + (u.search ? u.search : "") + (u.hash || "");
  } catch {
    return href;
  }
};