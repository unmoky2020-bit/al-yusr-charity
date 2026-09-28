/**
 * Classify a donation as "paid" (came from a tracked ad campaign) vs "organic".
 * A donation is considered paid traffic if any of:
 *   - campaign_id is linked to an ad_campaigns row
 *   - utm_source / utm_medium / utm_campaign hold a non-empty, non-direct value
 */

const DIRECT_TOKENS = new Set([
  "", "(direct)", "direct", "(none)", "none", "null", "undefined", "organic",
]);

export const normalizeUtm = (v: unknown): string =>
  String(v ?? "").trim().toLowerCase();

export const isMeaningfulUtm = (v: unknown): boolean => {
  const n = normalizeUtm(v);
  return n.length > 0 && !DIRECT_TOKENS.has(n);
};

export type DonationSource = "paid" | "organic";

export const classifyDonationSource = (d: {
  campaign_id?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
}): DonationSource => {
  if (d.campaign_id) return "paid";
  if (
    isMeaningfulUtm(d.utm_source) ||
    isMeaningfulUtm(d.utm_medium) ||
    isMeaningfulUtm(d.utm_campaign)
  ) {
    return "paid";
  }
  return "organic";
};