/**
 * Homepage "campaigns" strip settings (`حملات تصنع الأثر`).
 *
 * Live since 2026-10-29 (stored as one JSON row in the backend `settings` table):
 *   GET /homepage/campaigns-section   public, returns the single settings row (+ cards)
 *   PUT /homepage/campaigns-section   admin/editor, upserts it
 * The card texts/images/links/active flag/order are ALSO kept in the existing carousel endpoints
 * (`/admin/homepage/carousel/...`); `cards` here adds what the carousel table cannot hold
 * (price_from, donate_url, details_url, source_type, source_id) keyed by `carousel_item_id`.
 */
import { apiFetch, invalidateApiCache } from "@/data/laravelApi";

export interface CampaignsSectionCardRecord {
  /** id of the matching `/admin/homepage/carousel/items` row (null for a card that only lives here). */
  carousel_item_id?: number | null;
  source_type: "program" | "campaign" | "project" | "custom";
  source_id?: string | null;
  slug: string;
  name_ar: string;
  name_en?: string | null;
  tagline_ar?: string | null;
  tagline_en?: string | null;
  image?: string | null;
  price_from: number;
  details_url?: string | null;
  donate_url?: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface CampaignsSectionRecord {
  is_active: boolean;
  scroll_speed: number;
  show_final_cta: boolean;
  enable_scroll_trigger: boolean;
  show_skip_button: boolean;
  title_ar?: string | null;
  title_en?: string | null;
  subtitle_ar?: string | null;
  subtitle_en?: string | null;
  enabled_slugs?: string[] | null;
  disabled_slugs?: string[] | null;
  cards?: CampaignsSectionCardRecord[] | null;
  updated_at?: string;
}

const PATH = "/homepage/campaigns-section";

const unwrap = (res: unknown): CampaignsSectionRecord | null => {
  // `{ data: null }` = the section was never saved; callers use their defaults.
  if (res && typeof res === "object" && "data" in res && (res as { data: unknown }).data === null) return null;
  const rec = ((res as { data?: unknown } | null)?.data ?? res) as CampaignsSectionRecord | null;
  return rec && typeof rec === "object" && !Array.isArray(rec) ? rec : null;
};

export const campaignsSectionApi = {
  /** GET. `fresh` for the dashboard. Returns null until the section is saved once. Throws the ApiError. */
  async get(opts?: { fresh?: boolean }): Promise<CampaignsSectionRecord | null> {
    const res = await apiFetch<unknown>(PATH, {
      method: "GET",
      useCache: !opts?.fresh,
      ttlMs: opts?.fresh ? 0 : 60_000,
      skipAuthClear: true,
    });
    return unwrap(res);
  },

  /** PUT. Throws the ApiError. */
  async put(body: CampaignsSectionRecord): Promise<CampaignsSectionRecord | null> {
    const res = await apiFetch<unknown>(PATH, { method: "PUT", body });
    invalidateApiCache(PATH);
    return unwrap(res);
  },
};
