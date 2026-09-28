import { useEffect, useState } from "react";
import { programs } from "@/data/programs";

/**
 * Local settings for the "Al-Yusr Campaigns" horizontal-scroll section on
 * the homepage. Editable from /admin/campaigns-section. Persists in
 * localStorage so editors can curate which programs appear and how fast
 * the horizontal scroll plays.
 */
export interface CampaignsSectionSettings {
  enabled: boolean;
  /** Multiplier for section height (1 = 360vh, 2 = 720vh). Higher = slower scroll. */
  scrollSpeed: number;
  /** Ordered list of program slugs to show. Empty = all programs (default order). */
  enabledSlugs: string[];
  /** Explicitly disabled slugs — hidden from the homepage even if new programs are added later. */
  disabledSlugs?: string[];
  /** Show the final CTA card at the end of the strip. */
  showFinalCta: boolean;
  /** Optional overrides for the section header text. */
  title?: { ar: string; en: string };
  subtitle?: { ar: string; en: string };
}

const KEY = "alyusr_campaigns_section_v1";

export const DEFAULT_CAMPAIGNS_SETTINGS: CampaignsSectionSettings = {
  enabled: true,
  scrollSpeed: 2.6,
  enabledSlugs: [],
  // "volunteer" has its own dedicated /volunteer page — keep it off the strip.
  disabledSlugs: ["volunteer"],
  showFinalCta: true,
};

const load = (): CampaignsSectionSettings => {
  if (typeof window === "undefined") return DEFAULT_CAMPAIGNS_SETTINGS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_CAMPAIGNS_SETTINGS;
    return { ...DEFAULT_CAMPAIGNS_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CAMPAIGNS_SETTINGS;
  }
};

const save = (s: CampaignsSectionSettings) => {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
};

export const useCampaignsSettings = () => {
  const [settings, setSettings] = useState<CampaignsSectionSettings>(() => load());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setSettings(load());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const update = (patch: Partial<CampaignsSectionSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      save(next);
      return next;
    });
  };

  const reset = () => {
    save(DEFAULT_CAMPAIGNS_SETTINGS);
    setSettings(DEFAULT_CAMPAIGNS_SETTINGS);
  };

  return { settings, update, reset };
};

/**
 * Resolve the ordered, enabled program list. Logic:
 *   1. Start from the admin-curated order in `enabledSlugs`.
 *   2. Append any program from `programs.ts` that is NOT in `enabledSlugs`
 *      and NOT in `disabledSlugs` — so newly added programs auto-appear
 *      at the end without admin intervention.
 *   3. Filter out anything in `disabledSlugs`.
 * Result: admin panel + back-end data + homepage stay in sync.
 */
export const getVisibleCampaignPrograms = (settings: CampaignsSectionSettings) => {
  const disabled = new Set(settings.disabledSlugs ?? []);
  const bySlug = new Map(programs.map((p) => [p.slug, p]));
  const ordered = (settings.enabledSlugs ?? [])
    .map((slug) => bySlug.get(slug))
    .filter((p): p is (typeof programs)[number] => Boolean(p));
  const orderedSet = new Set(ordered.map((p) => p.slug));
  const appended = programs.filter((p) => !orderedSet.has(p.slug));
  return [...ordered, ...appended].filter((p) => !disabled.has(p.slug));
};