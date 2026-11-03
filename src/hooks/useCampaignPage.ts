import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLang } from "@/i18n/LangContext";
import { apiFetch, getApiToken } from "@/data/laravelApi";
import { getCampaignPageMeta } from "@/data/campaignPages/index";
import { campaignPagesApi } from "@/data/campaignPages/api";
import { mergeCampaignContent, type CampaignPageContent, type L } from "@/data/campaignPages/types";

type Pkg = { key?: string | null; name_ar: string; name_en?: string; amount: number; is_active?: boolean; sort_order?: number };

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

function findPackage(packages: Pkg[], label: { ar: string; en: string }): Pkg | undefined {
  const active = packages.filter((p) => p.is_active !== false).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  // Arabic names only: English package names are short and generic ("Roof Share") and over-match.
  return active.find((p) => normalise(p.name_ar) === normalise(label.ar)) || active.find((p) => namesMatch(p.name_ar, label.ar));
}

async function fetchPackages(apiId?: number, apiSlugs?: string[]): Promise<Pkg[]> {
  const ids = [apiId, ...(apiSlugs || [])].filter((v) => v !== undefined && v !== "");
  for (const id of ids) {
    try {
      const res = await apiFetch<{ data?: { donation_packages?: Pkg[] } } & { donation_packages?: Pkg[] }>(`/donation-campaigns/${id}`, { method: "GET", ttlMs: 60_000, useCache: true, skipAuthClear: true });
      const list = (res as { data?: { donation_packages?: Pkg[] } }).data?.donation_packages ?? (res as { donation_packages?: Pkg[] }).donation_packages;
      if (Array.isArray(list)) return list.map((p) => ({ ...p, amount: Number(p.amount) }));
    } catch { /* try the next identifier */ }
  }
  // A campaign created later in the dashboard has no id in the page registry: find it by its slug.
  for (const s of apiSlugs || []) {
    try {
      const res = await apiFetch<{ data?: { donation_packages?: Pkg[] } } & { donation_packages?: Pkg[] }>(`/donation-campaigns/by-slug/${encodeURIComponent(s)}`, { method: "GET", ttlMs: 60_000, useCache: true, skipAuthClear: true });
      const list = (res as { data?: { donation_packages?: Pkg[] } }).data?.donation_packages ?? (res as { donation_packages?: Pkg[] }).donation_packages;
      if (Array.isArray(list)) return list.map((p) => ({ ...p, amount: Number(p.amount) }));
    } catch (e) {
      if ((e as { status?: number } | null)?.status === 404) continue;
    }
  }
  return [];
}

const pageQuery = (slug: string, isAdmin: boolean) => ({
  queryKey: ["campaign-page", slug],
  queryFn: () => campaignPagesApi.load(slug, { fresh: isAdmin }),
  staleTime: isAdmin ? 0 : 60_000,
  retry: 0,
});

const packagesQuery = (slug: string) => {
  const meta = getCampaignPageMeta(slug);
  return {
    queryKey: ["campaign-packages", slug],
    queryFn: () => fetchPackages(meta?.apiIds[0], meta?.apiSlugs),
    staleTime: 60_000,
    retry: 0,
    enabled: !!meta,
  };
};

/** Longest a visitor waits for the dashboard content before the page shows its built-in copy. */
export const CONTENT_MAX_WAIT_MS = 8000;

/** True once a value has settled, or after `maxWait` (a slow API never keeps the page blank). */
export function useSettled(settled: boolean, maxWait = CONTENT_MAX_WAIT_MS): boolean {
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    if (settled) return;
    const t = window.setTimeout(() => setTimedOut(true), maxWait);
    return () => window.clearTimeout(t);
  }, [settled, maxWait]);
  return settled || timedOut;
}

/**
 * True when the landing page's dashboard content and prices have arrived (or failed), so the page
 * renders once with the real content instead of showing the built-in copy and images first.
 */
export function useCampaignPageReady(slug: string): boolean {
  const isAdmin = !!getApiToken();
  const page = useQuery(pageQuery(slug, isAdmin));
  const pk = useQuery(packagesQuery(slug));
  const pkSettled = !getCampaignPageMeta(slug) || !pk.isLoading;
  return useSettled(!page.isLoading && pkSettled);
}

/**
 * Content for a campaign landing page: code defaults merged with the dashboard override.
 * Routes wrap the page in <CampaignPageGate> (useCampaignPageReady), so it renders once the override arrived.
 * A failing API never breaks the page.
 */
export function useCampaignPage(slug: string, defaults: CampaignPageContent) {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const isAdmin = !!getApiToken();

  const { data } = useQuery(pageQuery(slug, isAdmin));

  // Prices: the backend donation packages of this campaign are the source of truth.
  // A package applies to a price item when their names match (normalised Arabic, either direction).
  const { data: packages } = useQuery(packagesQuery(slug));

  const c = useMemo(() => {
    const merged = mergeCampaignContent(defaults, data?.content ?? null);
    if (!packages?.length) return merged;
    return { ...merged, prices: merged.prices.map((pr) => {
      // Stable `key` (= the page price id) wins; Arabic-name matching stays as the fallback until every package has a key.
      const pkg = packages.find((p) => p.is_active !== false && !!p.key && p.key === pr.id) || findPackage(packages, pr.label);
      return pkg ? { ...pr, amount: pkg.amount } : pr;
    }) };
  }, [defaults, data, packages]);

  const t = (v?: L | null): string => (v ? (isAr ? v.ar || v.en : v.en || v.ar) : "");
  const price = (id: string) => c.prices.find((p) => p.id === id);
  const amount = (id: string, fallback = 0) => price(id)?.amount ?? fallback;
  const stat = (id: string) => c.stats.find((s) => s.id === id);
  const section = (key: string) => c.sections[key];

  return { c, t, isAr, price, amount, stat, section };
}
