/**
 * Seasons (`/seasons`): the six annual campaigns (ستر، ظل، رمضان، العشر، الأضاحي، المدارس).
 *
 * EXISTING: GET /seasons (auth today, returns 500 at the time of writing), POST /seasons,
 *           PATCH /seasons/{id} { is_active, donation_available }.
 * PROPOSED (backend-handoff/05-campaigns-seasons-section.md): GET /seasons public (no token),
 *           PUT /seasons/{id} (full edit), DELETE /seasons/{id}, and the extra columns
 *           `slug`, `badge_ar/en`, `donate_url`, `items`, `pricing`, `meta_title_*`, `meta_description_*`.
 * Writes throw the ApiError; screens show it with `describeWriteError`.
 */
import { apiFetch, invalidateApiCache } from "@/data/laravelApi";

export type SeasonPricingRow = { label_ar: string; label_en?: string | null; amount: number; tag_ar?: string | null; tag_en?: string | null };
export type SeasonItemRow = { ar: string; en?: string | null; desc_ar?: string | null; desc_en?: string | null };

export interface SeasonRecord {
  id: number;
  /** PROPOSED: stable key (ster | thill | ramadan | ashr | qurbani | school). */
  slug?: string | null;
  name_ar: string;
  name_en?: string | null;
  period_ar?: string | null;
  period_en?: string | null;
  tagline_ar?: string | null;
  tagline_en?: string | null;
  description_ar?: string | null;
  description_en?: string | null;
  is_active: boolean;
  donation_available: boolean;
  sort_order?: number | null;
  /* PROPOSED extra columns */
  badge_ar?: string | null;
  badge_en?: string | null;
  donate_url?: string | null;
  items?: SeasonItemRow[] | null;
  pricing?: SeasonPricingRow[] | null;
  meta_title_ar?: string | null;
  meta_title_en?: string | null;
  meta_description_ar?: string | null;
  meta_description_en?: string | null;
  programs?: unknown[];
  created_at?: string;
  updated_at?: string;
}

export type SeasonInput = Omit<SeasonRecord, "id" | "programs" | "created_at" | "updated_at">;

const listOf = (res: unknown): SeasonRecord[] => {
  const r = res as { data?: unknown } | null;
  const arr = Array.isArray(res) ? res : Array.isArray(r?.data) ? r!.data : [];
  return (arr as SeasonRecord[]).filter((s) => s && typeof s === "object" && s.id !== undefined);
};

const one = (res: unknown): SeasonRecord => ((res as { data?: SeasonRecord } | null)?.data ?? res) as SeasonRecord;

export const seasonsApi = {
  /** Dashboard read (fresh, with the admin token). Throws on failure so the screen can show the error. */
  async listAdmin(): Promise<SeasonRecord[]> {
    return listOf(await apiFetch<unknown>("/seasons", { method: "GET", useCache: false }));
  },

  /** Public read (PROPOSED to be public). Cached 5 min, never clears the session on 401. Throws on failure. */
  async listPublic(): Promise<SeasonRecord[]> {
    return listOf(await apiFetch<unknown>("/seasons", { method: "GET", useCache: true, ttlMs: 5 * 60_000, skipAuthClear: true }));
  },

  /** POST /seasons (existing). */
  async create(body: Partial<SeasonInput>): Promise<SeasonRecord> {
    const res = await apiFetch<unknown>("/seasons", { method: "POST", body });
    invalidateApiCache("/seasons");
    return one(res);
  },

  /** PUT /seasons/{id} (PROPOSED: full edit). */
  async update(id: number | string, body: Partial<SeasonInput>): Promise<SeasonRecord> {
    const res = await apiFetch<unknown>(`/seasons/${id}`, { method: "PUT", body });
    invalidateApiCache("/seasons");
    return one(res);
  },

  /** PATCH /seasons/{id} { is_active, donation_available } (existing). */
  async toggle(id: number | string, body: { is_active: boolean; donation_available: boolean }): Promise<SeasonRecord> {
    const res = await apiFetch<unknown>(`/seasons/${id}`, { method: "PATCH", body });
    invalidateApiCache("/seasons");
    return one(res);
  },

  /** DELETE /seasons/{id} (PROPOSED). */
  async remove(id: number | string): Promise<void> {
    await apiFetch(`/seasons/${id}`, { method: "DELETE" });
    invalidateApiCache("/seasons");
  },
};
