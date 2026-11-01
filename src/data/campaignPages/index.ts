import { l, type CampaignPageContent, type L } from "./types";

export type CampaignPageMeta = {
  slug: string;
  path: string;
  name: L;
  /** Lazy default-content loader so the dashboard bundle stays small. */
  load: () => Promise<CampaignPageContent>;
  /** Slugs/ids of the matching `donation-campaigns` record on the backend (several spellings are tolerated). */
  apiSlugs: string[];
  apiIds: number[];
  /** A word that appears in the backend record\'s Arabic name (last-resort match). */
  nameKey: string;
};

/** Registry of campaign pages whose content is editable from the dashboard. */
export const CAMPAIGN_PAGES: CampaignPageMeta[] = [
  { slug: "setr", path: "/setr", name: l("حملة سِتر", "Setr campaign"), load: () => import("./setr").then((m) => m.default), apiSlugs: ["sitr", "setr", "ster"], apiIds: [18], nameKey: "ستر" },
  { slug: "dhill", path: "/dhill", name: l("حملة ظِلّ", "Dhill campaign"), load: () => import("./dhill").then((m) => m.default), apiSlugs: ["zell", "dhill", "zel"], apiIds: [17], nameKey: "ظل" },
  { slug: "athar", path: "/athar", name: l("حملة أَثَر", "Athar campaign"), load: () => import("./athar").then((m) => m.default), apiSlugs: ["athar"], apiIds: [21], nameKey: "أثر" },
  { slug: "ramadan", path: "/ramadan", name: l("موسم الخير (رمضان)", "Ramadan season"), load: () => import("./ramadan").then((m) => m.default), apiSlugs: ["ramadan", "ramadan-season"], apiIds: [20], nameKey: "رمضان" },
  { slug: "markoun", path: "/markoun", name: l("حملة مَرْكون", "Markoun campaign"), load: () => import("./markoun").then((m) => m.default), apiSlugs: ["markoon", "markoun", "markon"], apiIds: [19], nameKey: "مركون" },
  { slug: "arboun", path: "/arboun", name: l("مبادرة عربون خير", "Arboun Khair"), load: () => import("./arboun").then((m) => m.default), apiSlugs: ["arboun-kheir", "arboun", "arboon"], apiIds: [22], nameKey: "عربون" },
  // No backend campaign yet: create one in the dashboard with slug «ten-days» (or a name containing «العشر»).
  { slug: "ashr", path: "/ten-days", name: l("العشر الأوائل من ذي الحجة", "First ten days of Dhul Hijjah"), load: () => import("./ashr").then((m) => m.default), apiSlugs: ["ten-days", "ashr", "al-ashr", "dhul-hijjah"], apiIds: [], nameKey: "العشر" },
  { slug: "food", path: "/food-box", name: l("الغذاء الشهري", "Monthly food"), load: () => import("./food").then((m) => m.default), apiSlugs: ["food", "monthly-food", "food-box"], apiIds: [23], nameKey: "غذاء" },
];

export const getCampaignPageMeta = (slug: string) => CAMPAIGN_PAGES.find((c) => c.slug === slug);

/** Donate-form link of a campaign landing page: the backend campaign slug, so the form opens on that campaign. */
export const campaignDonateHref = (pageSlug: string): string => {
  const meta = getCampaignPageMeta(pageSlug);
  return `/donate?campaign=${encodeURIComponent(meta?.apiSlugs[0] ?? pageSlug)}`;
};

/** Resolve the landing page that belongs to a backend donation-campaign record (by slug, then by id, then by name). */
export const getCampaignPageMetaForCampaign = (c?: { slug?: string | null; id?: number | string | null; name_ar?: string | null } | null) => {
  if (!c) return undefined;
  const slug = (c.slug || "").toLowerCase().trim();
  const id = Number(c.id);
  const name = c.name_ar || "";
  return (
    CAMPAIGN_PAGES.find((m) => slug && (m.slug === slug || m.apiSlugs.includes(slug))) ||
    CAMPAIGN_PAGES.find((m) => Number.isFinite(id) && m.apiIds.includes(id)) ||
    CAMPAIGN_PAGES.find((m) => name.replace(/[\u064B-\u0652\u0640]/g, "").includes(m.nameKey))
  );
};

export * from "./types";
export { campaignPagesApi } from "./api";
