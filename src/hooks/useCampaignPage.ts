import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLang } from "@/i18n/LangContext";
import { formatServerImageUrl, getApiToken } from "@/data/laravelApi";
import { campaignPagesApi, type CampaignPagePackage } from "@/data/campaignPages/api";
import { mergeCampaignContent, withCampaignHeroImageSlot, type CampaignPageContent, type L, type PriceItem } from "@/data/campaignPages/types";

export type CampaignDonationPackage = CampaignPagePackage;

const normalise = (v: string) =>
  v.replace(/[ً-ْـ]/g, "").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي")
    .replace(/[^\p{L}\p{N} ]/gu, " ").replace(/\s+/g, " ").trim().toLowerCase();

/** Words of a name, minus filler ("سهم", "share") and leading "ال"/"و" so "وباب" ≈ "باب" ≈ "الباب". */
const tokens = (v: string) =>
  normalise(v).split(" ").map((w) => w.replace(/^(و|ال|وال)/, "")).filter((w) => w.length >= 2 && !["سهم", "share", "of", "a", "the"].includes(w));

/**
 * A package matches a price item only when the names agree at word level: exact match, or EVERY
 * word of the shorter name appears in the longer one (so "وصلة مياه كاملة" never takes the price of
 * "سهم وصلة مياه"). One-word labels ("باب", "شباك") match only a one-word package name, so "باب"
 * never matches "تسقيف وباب وشباك". No match → the code default price is shown.
 */
function namesMatch(a: string, b: string): boolean {
  const na = normalise(a), nb = normalise(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  const ta = tokens(a), tb = tokens(b);
  const [short, long] = ta.length <= tb.length ? [ta, tb] : [tb, ta];
  if (short.length === 0) return false;
  const hits = short.filter((w) => long.includes(w)).length;
  if (short.length === 1) return long.length === 1 && hits === 1;
  return hits === short.length;
}

function findPackage(packages: CampaignDonationPackage[], label: { ar: string; en: string }): CampaignDonationPackage | undefined {
  const active = packages.filter((p) => p.is_active !== false).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  // Arabic names only: English package names are short and generic ("Roof Share") and over-match.
  return active.find((p) => normalise(p.name_ar) === normalise(label.ar)) || active.find((p) => namesMatch(p.name_ar, label.ar));
}

export function findCampaignPackage(packages: CampaignDonationPackage[], item: Pick<PriceItem, "id" | "label" | "backendPackageNames">): CampaignDonationPackage | undefined {
  const active = packages.filter((p) => p.is_active !== false).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const byKey = active.find((p) => !!p.key && p.key === item.id);
  if (byKey) return byKey;
  const names = new Set((item.backendPackageNames || []).map(normalise));
  const byBackendName = active.find((p) => names.has(normalise(p.name_ar)));
  return byBackendName || findPackage(active, item.label);
}

const pageQuery = (slug: string, isAdmin: boolean) => ({
  queryKey: ["campaign-page", slug],
  queryFn: () => campaignPagesApi.load(slug, { fresh: isAdmin }),
  staleTime: isAdmin ? 0 : 60_000,
  retry: 0,
});

/**
 * Content for a campaign landing page: code defaults merged with the dashboard override.
 * Consumers can gate the page while backend content and package data load; a failed API falls
 * back to the designed defaults once loading has finished.
 */
export function useCampaignPage(slug: string, defaults: CampaignPageContent) {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const isAdmin = !!getApiToken();

  const pageResult = useQuery(pageQuery(slug, isAdmin));
  const { data } = pageResult;

  // Prices and page content come from the same campaign record to avoid duplicate requests.
  const packages = useMemo(
    () => data?.campaign?.donation_packages?.map((p) => ({ ...p, amount: Number(p.amount) })) ?? [],
    [data?.campaign?.donation_packages],
  );

  const c = useMemo(() => {
    const pageDefaults = withCampaignHeroImageSlot(defaults);
    const campaign = data?.campaign;
    const campaignFallback: Partial<CampaignPageContent> | null = campaign
      ? {
          hero: {
          eyebrow: { ar: campaign.subtitle_ar || "", en: campaign.subtitle_en || "" },
          title: { ar: campaign.title_ar || campaign.name_ar || "", en: campaign.title_en || campaign.name_en || "" },
          title2: { ar: "", en: "" },
          lead: {
            ar: campaign.description_ar || campaign.description || "",
            en: campaign.description_en || "",
          },
          donateLabel: { ar: "", en: "" },
          },
        }
      : null;
    const saved = data?.content;
    const merged = mergeCampaignContent(
      pageDefaults,
      campaignFallback || saved
        ? { ...campaignFallback, ...saved, hero: { ...campaignFallback?.hero, ...saved?.hero } }
        : null,
    );
    if (!packages.length) return merged;
    return { ...merged, prices: merged.prices.map((pr) => {
      const pkg = findCampaignPackage(packages, pr);
      return pkg ? { ...pr, amount: pkg.amount } : pr;
    }) };
  }, [defaults, data, packages]);

  const pageHeroImage = c.images?.hero?.items[0]?.src;
  const pageImage = pageHeroImage?.startsWith("asset:") ? "" : formatServerImageUrl(pageHeroImage);
  const formattedImage = pageImage && pageImage !== "/placeholder.svg"
    ? pageImage
    : formatServerImageUrl(data?.campaign?.image);
  const campaignImage = formattedImage === "/placeholder.svg" ? "" : formattedImage;
  const t = (v?: L | null): string => (v ? (isAr ? v.ar || v.en : v.en || v.ar) : "");
  const price = (id: string) => c.prices.find((p) => p.id === id);
  const amount = (id: string, fallback = 0) => price(id)?.amount ?? fallback;
  const packageId = (id: string) => {
    const item = price(id);
    if (!item) return undefined;
    return findCampaignPackage(packages, item)?.id;
  };
  const stat = (id: string) => c.stats.find((s) => s.id === id);
  const section = (key: string) => c.sections[key];

  return {
    c,
    t,
    isAr,
    price,
    amount,
    packageId,
    stat,
    section,
    campaignImage,
    isLoading: pageResult.isLoading,
  };
}
