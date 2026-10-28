import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLang } from "@/i18n/LangContext";
import { getApiToken } from "@/data/laravelApi";
import { campaignPagesApi } from "@/data/campaignPages/api";
import { mergeCampaignContent, type CampaignPageContent, type L } from "@/data/campaignPages/types";

/**
 * Content for a campaign landing page: code defaults merged with the dashboard override.
 * Renders defaults immediately; the override (if any) is applied when it arrives.
 * A failing API never breaks the page.
 */
export function useCampaignPage(slug: string, defaults: CampaignPageContent) {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const isAdmin = !!getApiToken();

  const { data } = useQuery({
    queryKey: ["campaign-page", slug],
    queryFn: () => campaignPagesApi.load(slug, { fresh: isAdmin }),
    staleTime: isAdmin ? 0 : 60_000,
    retry: 0,
  });

  const c = useMemo(() => mergeCampaignContent(defaults, data?.content ?? null), [defaults, data]);

  const t = (v?: L | null): string => (v ? (isAr ? v.ar || v.en : v.en || v.ar) : "");
  const price = (id: string) => c.prices.find((p) => p.id === id);
  const amount = (id: string, fallback = 0) => price(id)?.amount ?? fallback;
  const stat = (id: string) => c.stats.find((s) => s.id === id);
  const section = (key: string) => c.sections[key];

  return { c, t, isAr, price, amount, stat, section };
}
