import { l, type CampaignPageContent, type L } from "./types";

export type CampaignPageMeta = {
  slug: string;
  path: string;
  name: L;
  /** Lazy default-content loader so the dashboard bundle stays small. */
  load: () => Promise<CampaignPageContent>;
};

/** Registry of campaign pages whose content is editable from the dashboard. */
export const CAMPAIGN_PAGES: CampaignPageMeta[] = [
  { slug: "setr", path: "/setr", name: l("حملة سِتر", "Setr campaign"), load: () => import("./setr").then((m) => m.default) },
  { slug: "dhill", path: "/dhill", name: l("حملة ظِلّ", "Dhill campaign"), load: () => import("./dhill").then((m) => m.default) },
  { slug: "athar", path: "/athar", name: l("حملة أَثَر", "Athar campaign"), load: () => import("./athar").then((m) => m.default) },
  { slug: "ramadan", path: "/ramadan", name: l("موسم الخير (رمضان)", "Ramadan season"), load: () => import("./ramadan").then((m) => m.default) },
  { slug: "markoun", path: "/markoun", name: l("حملة مَرْكون", "Markoun campaign"), load: () => import("./markoun").then((m) => m.default) },
  { slug: "arboun", path: "/arboun", name: l("مبادرة عربون خير", "Arboun Khair"), load: () => import("./arboun").then((m) => m.default) },
];

export const getCampaignPageMeta = (slug: string) => CAMPAIGN_PAGES.find((c) => c.slug === slug);

export * from "./types";
export { campaignPagesApi } from "./api";
