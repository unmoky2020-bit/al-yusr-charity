/**
 * What a donation is recorded against on the backend. POST /donations/submit takes ONE target:
 * case_id | program_id | project_id | donation_campaign_id (+ donation_package_id for program packages).
 */
import type { DonationEntity } from "@/data/donationEntities";

export type DonationTargetKind = "case" | "program" | "project" | "campaign";

export interface DonationTarget {
  kind: DonationTargetKind;
  id: number;
  /** Program package (donation_packages.id) when exactly one program package was chosen. */
  packageId?: number;
}

/** The donate-form item fields this module needs (structurally matches DonationItemState). */
export interface TargetItem {
  entityId: string;
  donationMode: "general" | "shares" | "case" | "in_kind";
  selectedShares: Record<string, number>;
  selectedCaseId?: string | null;
}

export const TARGET_FIELD: Record<DonationTargetKind, "case_id" | "program_id" | "project_id" | "donation_campaign_id"> = {
  case: "case_id",
  program: "program_id",
  project: "project_id",
  campaign: "donation_campaign_id",
};

/** Target of one form item, or null when its entity is not a backend record (offline fallback data). */
export function targetOfItem(item: TargetItem, entity: DonationEntity | undefined): DonationTarget | null {
  if (!entity) return null;
  if (item.donationMode === "case" && item.selectedCaseId) {
    const linked = entity.cases.find((c) => c.id === item.selectedCaseId);
    if (linked?.apiId) return { kind: "case", id: linked.apiId };
  }
  if (!entity.apiId) return null;
  const target: DonationTarget = { kind: entity.entityType, id: entity.apiId };
  if (entity.entityType === "program" && item.donationMode === "shares") {
    const chosen = Object.entries(item.selectedShares).filter(([, n]) => n > 0).map(([id]) => id);
    const share = chosen.length === 1 ? entity.shares.find((s) => s.id === chosen[0]) : undefined;
    if (share?.apiId) target.packageId = share.apiId;
  }
  return target;
}

const sameRecord = (a: DonationTarget, b: DonationTarget) => a.kind === b.kind && a.id === b.id;

/**
 * Target of the whole basket. One payment = one backend donation, so:
 * - a case opened from a case page (?case=…) wins;
 * - all items on the same record → that record (a package only when it is the single item's package);
 * - items on different records, or none resolvable → null: the backend books it on the general program and
 *   the per-item breakdown travels in the donation notes.
 */
export function targetOfBasket(
  items: TargetItem[],
  entityOf: (id: string) => DonationEntity | undefined,
  pageCaseId?: string | number | null,
): DonationTarget | null {
  const caseId = Number(pageCaseId);
  if (caseId > 0) return { kind: "case", id: caseId };
  const targets = items.map((it) => targetOfItem(it, entityOf(it.entityId)));
  if (!targets.length || targets.some((t) => !t)) return null;
  const first = targets[0] as DonationTarget;
  if (!targets.every((t) => sameRecord(t as DonationTarget, first))) return null;
  return items.length === 1 ? first : { kind: first.kind, id: first.id };
}
