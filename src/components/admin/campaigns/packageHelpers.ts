/** Pure helpers for CampaignPackagesManager (kept apart so the component file only exports components). */
import { donationCampaignsAdminApi, type CampaignPackage, type PackageInput } from "@/data/api/donationCampaignsAdminApi";
import { describeWriteError } from "@/data/api/backendPending";
import type { L } from "@/data/campaignPages/types";

export type PackagePriceKey = { id: string; label: L };

export type Draft = { name_ar: string; name_en: string; amount: string; key: string; is_active: boolean };

export const rowKey = (p: CampaignPackage, idx: number) => (p.id !== undefined && p.id !== null ? String(p.id) : `row-${idx}`);

export const toDraft = (p: CampaignPackage): Draft => ({
  name_ar: p.name_ar || "",
  name_en: p.name_en || "",
  amount: p.amount === undefined || p.amount === null ? "" : String(Number(p.amount)),
  key: p.key || "",
  is_active: p.is_active !== false,
});

export const toInput = (d: Draft, sortOrder: number): PackageInput => ({
  name_ar: d.name_ar.trim(),
  name_en: d.name_en.trim() || null,
  amount: Number(d.amount),
  is_active: d.is_active,
  sort_order: sortOrder,
  key: d.key.trim() || null,
});

export const validDraft = (d: Draft) => !!d.name_ar.trim() && Number.isFinite(Number(d.amount)) && Number(d.amount) > 0;

/** Default packages offered for a NEW campaign (sent with POST after the campaign is created). */
export const DEFAULT_NEW_CAMPAIGN_PACKAGES: CampaignPackage[] = [
  { id: "draft-1", name_ar: "سهم الخير", name_en: "Goodness share", amount: 100, is_active: true, sort_order: 1, key: null },
  { id: "draft-2", name_ar: "سهم البركة", name_en: "Blessing share", amount: 250, is_active: true, sort_order: 2, key: null },
  { id: "draft-3", name_ar: "سهم الإحسان", name_en: "Ihsan share", amount: 500, is_active: true, sort_order: 3, key: null },
];

/** POST every draft package to a freshly created campaign. Returns what was created and what failed (with the reason). */
export async function createPackagesForCampaign(campaignId: number | string, drafts: CampaignPackage[]) {
  const created: CampaignPackage[] = [];
  const failed: Array<{ name: string; error: string }> = [];
  let order = 1;
  for (const p of drafts) {
    const d = toDraft(p);
    if (!validDraft(d)) continue;
    try {
      created.push(await donationCampaignsAdminApi.createPackage(campaignId, toInput(d, order++)));
    } catch (e) {
      failed.push({ name: d.name_ar, error: describeWriteError(e, "POST /donation-campaigns/{id}/donation-packages") });
    }
  }
  return { created, failed };
}

export function sortPackages(list: CampaignPackage[] | undefined | null): CampaignPackage[] {
  return [...(list || [])]
    .map((p, i) => ({ p, i }))
    .sort((a, b) => (a.p.sort_order ?? a.i + 1) - (b.p.sort_order ?? b.i + 1) || a.i - b.i)
    .map(({ p }) => p);
}

