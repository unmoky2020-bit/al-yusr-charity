import { useQuery, useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL, apiFetch } from "@/data/laravelApi";
import { track } from "@/lib/track";

/**
 * Views and clicks of the homepage campaigns strip («إحصائيات التفاعل»).
 * Each event goes to the server (POST /engagement, daily counters, no visitor data), so the
 * dashboard shows every visitor, not only the clicks made in the admin's own tab. It is also sent
 * to the analytics sink (GTM / GA / Pixel) as before.
 */
export type CampaignMetricKind = "details_click" | "donate_click";

export interface CampaignMetricsRow {
  details_click: number;
  donate_click: number;
}

export interface CampaignsMetricsState {
  /** Per-slug counters. The "__cta__" key is the final CTA card. */
  bySlug: Record<string, CampaignMetricsRow>;
  /** Times the section came into view. */
  sectionViews: number;
  /** Last day anything was counted (YYYY-MM-DD). */
  updatedAt?: string;
  from?: string;
  to?: string;
}

const SECTION_SLUG = "__section__";

/** Fire-and-forget: a beacon survives the page change a click starts. Never throws. */
function send(slug: string, kind: "section_view" | CampaignMetricKind) {
  if (typeof window === "undefined") return;
  const url = `${API_BASE_URL.replace(/\/+$/, "")}/engagement`;
  const body = new URLSearchParams({ scope: "campaigns", slug, kind });
  try {
    if (navigator.sendBeacon && navigator.sendBeacon(url, body)) return;
  } catch {
    /* fall through to fetch */
  }
  try {
    void fetch(url, { method: "POST", body, keepalive: true, headers: { Accept: "application/json" } }).catch(() => undefined);
  } catch {
    /* ignore */
  }
}

export const recordCampaignClick = (slug: string, kind: CampaignMetricKind) => {
  send(slug, kind);
  track(kind === "donate_click" ? "campaign_donate_click" : "campaign_details_click", {
    payload: { slug },
    fbEvent: kind === "donate_click" ? "Lead" : undefined,
  });
};

export const recordSectionView = () => {
  send(SECTION_SLUG, "section_view");
  track("campaigns_section_view");
};

type EngagementReply = {
  data?: {
    from?: string;
    to?: string;
    totals?: Record<string, number>;
    cards?: Array<{ slug: string } & Record<string, number | string>>;
    last_event_day?: string | null;
  };
};

async function fetchMetrics(days: number): Promise<CampaignsMetricsState> {
  const res = await apiFetch<EngagementReply>("/admin/engagement", { method: "GET", params: { scope: "campaigns", days }, useCache: false });
  const d = res?.data ?? {};
  const bySlug: Record<string, CampaignMetricsRow> = {};
  for (const c of d.cards ?? []) {
    if (c.slug === SECTION_SLUG) continue;
    bySlug[String(c.slug)] = { details_click: Number(c.details_click || 0), donate_click: Number(c.donate_click || 0) };
  }
  return {
    bySlug,
    sectionViews: Number(d.totals?.section_view || 0),
    updatedAt: d.last_event_day || undefined,
    from: d.from,
    to: d.to,
  };
}

/** Dashboard: the counters of the last `days` days, straight from the server. */
export const useCampaignsMetrics = (days = 30) => {
  const qc = useQueryClient();
  const key = ["admin", "engagement", "campaigns", days] as const;
  const q = useQuery({ queryKey: key, queryFn: () => fetchMetrics(days), staleTime: 60_000 });
  const reset = async () => {
    await apiFetch("/admin/engagement", { method: "DELETE", params: { scope: "campaigns" } });
    await qc.invalidateQueries({ queryKey: ["admin", "engagement", "campaigns"] });
  };
  return {
    metrics: q.data ?? { bySlug: {}, sectionViews: 0 },
    loading: q.isPending,
    error: q.isError,
    refetch: q.refetch,
    reset,
  };
};
