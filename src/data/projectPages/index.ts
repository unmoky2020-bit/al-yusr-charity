import { imagesColumn, l, type CampaignPageContent, type L } from "@/data/campaignPages/types";

/**
 * Project landing pages whose content is editable from the dashboard (المشاريع → محتوى الصفحة).
 * Same content model as the campaign pages; the override is saved on the project record as
 * `page_content` (JSON) — see backend-handoff/04-programs-projects.md.
 */
export type ProjectPageMeta = {
  /** Slug of the backend project record. */
  projectSlug: string;
  /** Public path of the landing page. */
  path: string;
  name: L;
  /** Lazy default-content loader so the dashboard bundle stays small. */
  load: () => Promise<CampaignPageContent>;
};

export const PROJECT_PAGES: ProjectPageMeta[] = [
  { projectSlug: "waqf", path: "/farm", name: l("المزرعة الوقفية", "Waqf farm"), load: () => import("./farm").then((m) => m.default) },
  { projectSlug: "nurseries", path: "/nurseries", name: l("الحضانات ودور التحفيظ", "Nurseries & Qur'an houses"), load: () => import("./nurseries").then((m) => m.default) },
  { projectSlug: "water", path: "/water", name: l("سقيا الماء", "Clean water"), load: () => import("./water").then((m) => m.default) },
  { projectSlug: "mosques", path: "/mosques", name: l("عمارة المساجد", "Mosques"), load: () => import("./mosques").then((m) => m.default) },
];

export const getProjectPageMeta = (projectSlug: string | null | undefined) =>
  projectSlug ? PROJECT_PAGES.find((p) => p.projectSlug === projectSlug) : undefined;

/** What is stored in `projects.page_content`: everything except prices (= donation packages), FAQ (= linked FAQ category) and SEO (= the project's SEO fields). */
export function projectPageColumn(c: CampaignPageContent): Omit<CampaignPageContent, "prices" | "faq" | "seo"> {
  const { prices: _p, faq: _f, seo: _s, images, ...rest } = c;
  // Pictures: only each slot's list is stored (labels and limits stay in the page code).
  return (images ? { ...rest, images: imagesColumn(images) } : rest) as Omit<CampaignPageContent, "prices" | "faq" | "seo">;
}

/** Parse a JSON column that may arrive as an object or a JSON string. */
export function parsePageContent(v: unknown): Record<string, unknown> | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "string") {
    try {
      const o = JSON.parse(v);
      return o && typeof o === "object" ? (o as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }
  return typeof v === "object" ? (v as Record<string, unknown>) : null;
}
