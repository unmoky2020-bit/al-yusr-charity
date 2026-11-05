import { useMemo } from "react";
import { useLang } from "@/i18n/LangContext";
import { useProjectDetail } from "@/data/sources/projects";
import { mergeCampaignContent, type CampaignPageContent, type L } from "@/data/campaignPages/types";
import { resolveImages } from "@/data/pageImages";

/**
 * Content of a project landing page (e.g. /farm): code defaults merged with the project's
 * `page_content` saved from the dashboard. Renders defaults at once; a missing column, a failing
 * API or malformed JSON always falls back to the defaults. Also returns the project record
 * (cover image, donation packages, linked FAQ category) for the parts the page reads directly.
 */
export function useProjectPage(projectSlug: string, defaults: CampaignPageContent) {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const { project } = useProjectDetail(projectSlug);

  const c = useMemo(() => mergeCampaignContent(defaults, project?.pageContent ?? null), [defaults, project?.pageContent]);

  const t = (v?: L | null): string => (v ? (isAr ? v.ar || v.en : v.en || v.ar) : "");
  const stat = (id: string) => c.stats.find((s) => s.id === id);
  const section = (key: string) => c.sections[key];
  /** Pictures of a slot (dashboard → الصور), ready for <img>; empty when the page has no such slot. */
  const images = (key: string) => resolveImages(c.images?.[key]?.items);

  return { c, t, isAr, project, stat, section, images };
}
