/**
 * Donation campaigns: admin wrappers for the parts `donationCampaignsApi` (laravelApi.ts) does not cover.
 *
 * EXISTING on the backend:  GET/POST /donation-campaigns, PUT/DELETE /donation-campaigns/{id},
 *                           GET/POST /donation-campaigns/{id}/donation-packages,
 *                           GET/POST /donation-campaign-categories, DELETE /donation-campaign-categories/{id}.
 * PROPOSED (backend-handoff/05-campaigns-seasons-section.md):
 *                           PUT/DELETE /donation-campaigns/{id}/donation-packages/{packageId},
 *                           POST /donation-campaigns/{id}/donation-packages/reorder,
 *                           GET /donation-campaigns/by-slug/{slug}, PUT /donation-campaign-categories/{id},
 *                           `key` on donation_packages, `page_content` / `seo` / `faqs` / `subtitle_*` / `category_id` / `image` in the campaign resource.
 * Every function throws the ApiError on failure; callers show it (see `describeWriteError`).
 */
import {
  apiFetch,
  invalidateApiCache,
  type LaravelDonationCampaign,
  type LaravelDonationCampaignCategory,
  type LaravelDonationPackage,
} from "@/data/laravelApi";
import type { CampaignPageContent, L } from "@/data/campaignPages/types";

export type CampaignPackage = LaravelDonationPackage & {
  /** Stable link to a landing-page price item (`prices[].id` in src/data/campaignPages/<slug>.ts). PROPOSED column. */
  key?: string | null;
};

export type CampaignSeo = {
  title: L;
  description: L;
  keywords: L;
  canonical?: string;
  noindex?: boolean;
  nofollow?: boolean;
};

export type CampaignFaq = { question_ar: string; answer_ar: string; question_en?: string | null; answer_en?: string | null };

/** Landing content stored on the campaign (`page_content`): everything except prices (= packages), faq (= `faqs`) and seo (= `seo`). */
export type CampaignPageContentColumn = Partial<Omit<CampaignPageContent, "prices" | "faq" | "seo">>;

export type CampaignRecord = LaravelDonationCampaign & {
  page_content?: CampaignPageContentColumn | null;
  seo?: CampaignSeo | null;
  faqs?: CampaignFaq[] | null;
  /** FAQ category whose questions the landing page shows (wins over `faqs`). */
  faq_category_id?: number | null;
  faq_category?: { id: number; slug: string; name_ar?: string } | null;
  donation_packages?: CampaignPackage[];
};

export type PackageInput = {
  name_ar: string;
  name_en?: string | null;
  amount: number;
  sort_order?: number;
  is_active?: boolean;
  key?: string | null;
};

const unwrap = <T,>(res: unknown): T => {
  const r = res as { data?: T } | null;
  return (r && typeof r === "object" && "data" in r && r.data !== undefined ? r.data : res) as T;
};

/** JSON columns may come back as a string when the model has no cast: accept both. */
export function parseJsonColumn<T>(v: unknown): T | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      return parsed && typeof parsed === "object" ? (parsed as T) : null;
    } catch {
      return null;
    }
  }
  return typeof v === "object" ? (v as T) : null;
}

const base = "/donation-campaigns";

export const donationCampaignsAdminApi = {
  /** GET /donation-campaigns/{id} (existing). `fresh` skips the in-memory cache (dashboard reads). */
  async get(id: number | string, opts?: { fresh?: boolean }): Promise<CampaignRecord> {
    const res = await apiFetch<unknown>(`${base}/${id}`, { method: "GET", useCache: !opts?.fresh, ttlMs: opts?.fresh ? 0 : 60_000 });
    return unwrap<CampaignRecord>(res);
  },

  /** GET /donation-campaigns/by-slug/{slug} (live since 2026-10-29). */
  async getBySlug(slug: string, opts?: { fresh?: boolean }): Promise<CampaignRecord> {
    const res = await apiFetch<unknown>(`${base}/by-slug/${encodeURIComponent(slug)}`, {
      method: "GET",
      useCache: !opts?.fresh,
      ttlMs: opts?.fresh ? 0 : 60_000,
      skipAuthClear: true,
    });
    return unwrap<CampaignRecord>(res);
  },

  /** POST /donation-campaigns/{id}/donation-packages (existing; `key` is PROPOSED). */
  async createPackage(campaignId: number | string, body: PackageInput): Promise<CampaignPackage> {
    const res = await apiFetch<unknown>(`${base}/${campaignId}/donation-packages`, { method: "POST", body });
    invalidateApiCache(base);
    return unwrap<CampaignPackage>(res);
  },

  /** PUT /donation-campaigns/{id}/donation-packages/{packageId} (PROPOSED). */
  async updatePackage(campaignId: number | string, packageId: number | string, body: Partial<PackageInput>): Promise<CampaignPackage> {
    const res = await apiFetch<unknown>(`${base}/${campaignId}/donation-packages/${packageId}`, { method: "PUT", body });
    invalidateApiCache(base);
    return unwrap<CampaignPackage>(res);
  },

  /** DELETE /donation-campaigns/{id}/donation-packages/{packageId} (PROPOSED). */
  async deletePackage(campaignId: number | string, packageId: number | string): Promise<void> {
    await apiFetch(`${base}/${campaignId}/donation-packages/${packageId}`, { method: "DELETE" });
    invalidateApiCache(base);
  },

  /** POST /donation-campaigns/{id}/donation-packages/reorder  { items: [{ id, sort_order }] } (PROPOSED). */
  async reorderPackages(campaignId: number | string, items: Array<{ id: number | string; sort_order: number }>): Promise<void> {
    await apiFetch(`${base}/${campaignId}/donation-packages/reorder`, { method: "POST", body: { items } });
    invalidateApiCache(base);
  },

  /** PUT /donation-campaign-categories/{id} (PROPOSED). */
  async updateCategory(id: number | string, body: Partial<LaravelDonationCampaignCategory>): Promise<LaravelDonationCampaignCategory> {
    const res = await apiFetch<unknown>(`/donation-campaign-categories/${id}`, { method: "PUT", body });
    invalidateApiCache("/donation-campaign-categories");
    return unwrap<LaravelDonationCampaignCategory>(res);
  },
};

/**
 * Fields the admin sent but the backend did not return after the save (so it most likely ignored them).
 * `subtitle_ar/en`, `category_id` and `image` are sent by the dashboard but the current resource does not return them.
 */
export function findIgnoredCampaignFields(
  sent: Record<string, unknown>,
  returned: Record<string, unknown> | null | undefined,
): string[] {
  if (!returned) return [];
  const out: string[] = [];
  const has = (k: string) => Object.prototype.hasOwnProperty.call(returned, k);
  for (const k of ["subtitle_ar", "subtitle_en"]) {
    const v = sent[k];
    if (typeof v === "string" && v.trim() && (!has(k) || String(returned[k] ?? "").trim() !== v.trim())) out.push(k);
  }
  if (sent.category_id !== undefined && sent.category_id !== null && sent.category_id !== "") {
    const cat = returned.category as { id?: unknown } | null | undefined;
    const got = has("category_id") ? returned.category_id : cat?.id;
    if (got === undefined || got === null || String(got) !== String(sent.category_id)) out.push("category_id");
  }
  const img = sent.image;
  const sentFile = typeof File !== "undefined" && img instanceof File;
  if ((sentFile || (typeof img === "string" && img.trim())) && !(typeof returned.image === "string" && returned.image.trim())) out.push("image");
  return out;
}

export const CAMPAIGN_FIELD_LABELS_AR: Record<string, string> = {
  subtitle_ar: "العنوان الفرعي (عربي)",
  subtitle_en: "العنوان الفرعي (إنجليزي)",
  category_id: "التصنيف",
  image: "الصورة",
  page_content: "محتوى صفحة الهبوط (page_content)",
  seo: "السيو (seo)",
  faqs: "الأسئلة الشائعة (faqs)",
  key: "مفتاح الباقة (key)",
};
