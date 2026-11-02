import { useEffect, useState } from "react";
import { track } from "@/lib/track";

/**
 * Lightweight client-side metrics for the homepage "Al-Yusr Campaigns"
 * carousel. Persists per-slug counters in localStorage so the admin panel
 * at /admin/campaigns-section can show what's viewed/clicked. Also forwards
 * each event to the global `track()` sink (GTM / GA / Pixel).
 */
export type CampaignMetricKind = "details_click" | "donate_click";

export interface CampaignMetricsRow {
  details_click: number;
  donate_click: number;
}

export interface CampaignsMetricsState {
  /** Per-slug counters. The "__cta__" key tracks the final CTA card. */
  bySlug: Record<string, CampaignMetricsRow>;
  /** Total times the section header came into view (once per page load). */
  sectionViews: number;
  /** Last time anything was recorded (ISO). */
  updatedAt?: string;
}

// Wipe legacy localStorage metrics
if (typeof window !== "undefined") {
  try {
    localStorage.removeItem("alyusr_campaigns_metrics_v1");
  } catch {
    /* ignore */
  }
}

const EMPTY_ROW: CampaignMetricsRow = { details_click: 0, donate_click: 0 };

const blank = (): CampaignsMetricsState => ({ bySlug: {}, sectionViews: 0 });

let inMemoryMetrics: CampaignsMetricsState = blank();

const load = (): CampaignsMetricsState => inMemoryMetrics;

const save = (s: CampaignsMetricsState) => {
  inMemoryMetrics = s;
  try {
    // Notify same-tab listeners
    window.dispatchEvent(new CustomEvent("alyusr:campaigns-metrics"));
  } catch { /* ignore */ }
};

const bump = (slug: string, kind: CampaignMetricKind) => {
  const state = load();
  const row = { ...EMPTY_ROW, ...(state.bySlug[slug] || {}) };
  row[kind] = (row[kind] || 0) + 1;
  state.bySlug = { ...state.bySlug, [slug]: row };
  state.updatedAt = new Date().toISOString();
  save(state);
};

export const recordCampaignClick = (slug: string, kind: "details_click" | "donate_click") => {
  bump(slug, kind);
  track(kind === "donate_click" ? "campaign_donate_click" : "campaign_details_click", {
    payload: { slug },
    fbEvent: kind === "donate_click" ? "Lead" : undefined,
  });
};

export const recordSectionView = () => {
  const state = load();
  state.sectionViews = (state.sectionViews || 0) + 1;
  state.updatedAt = new Date().toISOString();
  save(state);
  track("campaigns_section_view");
};

export const resetCampaignsMetrics = () => save(blank());

export const useCampaignsMetrics = () => {
  const [state, setState] = useState<CampaignsMetricsState>(() => load());
  useEffect(() => {
    const refresh = () => setState(load());
    // Metrics live in memory only, so there is no cross-tab "storage" event to follow.
    window.addEventListener("alyusr:campaigns-metrics", refresh as EventListener);
    return () => {
      window.removeEventListener("alyusr:campaigns-metrics", refresh as EventListener);
    };
  }, []);
  return { metrics: state, reset: () => { resetCampaignsMetrics(); setState(blank()); } };
};