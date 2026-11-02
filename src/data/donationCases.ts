/**
 * Real backend cases inside the donate form.
 *
 * Every open case (approved, still needs money) is listed under the program / project / campaign it
 * belongs to. A case that belongs to none of them is listed under the general donation, so it can always
 * be picked. The case opened from a case page (?case=…) is always listed, first, even when it is
 * not in the public list yet.
 */
import type { CaseRow } from "@/data/casesApi";
import type { DonationEntity, LinkedCase } from "@/data/donationEntities";
import { caseFunding } from "@/lib/caseFunding";

export const linkedCaseId = (apiId: string | number) => `case-${apiId}`;

export function rowToLinkedCase(c: CaseRow): LinkedCase {
  const out: LinkedCase = {
    id: linkedCaseId(c.id),
    refCode: c.ref_code || String(c.id),
    titleAr: c.title || "",
    titleEn: c.title || "",
    beneficiaryName: c.beneficiary_name || "",
    governorate: c.governorate || "",
    neededAmount: Number(c.needed_amount) || 0,
    raisedAmount: Number(c.raised_amount) || 0,
  };
  const apiId = Number(c.id);
  if (apiId > 0) out.apiId = apiId;
  if (c.city) out.city = c.city;
  if (c.is_urgent || c.urgency === "high") out.urgent = true;
  return out;
}

/** The entity a case belongs to: its program, project or campaign; else the general donation. */
export function ownerOfCase(entities: DonationEntity[], c: Pick<CaseRow, "program_id" | "project_id" | "donation_campaign_id">): DonationEntity | undefined {
  const by = (type: DonationEntity["entityType"], id: string | null | undefined) =>
    id ? entities.find((e) => e.entityType === type && e.apiId && String(e.apiId) === String(id)) : undefined;
  return (
    by("program", c.program_id) ||
    by("project", c.project_id) ||
    by("campaign", c.donation_campaign_id) ||
    entities.find((e) => e.id === "general") ||
    entities[0]
  );
}

const isOpen = (c: CaseRow) => c.status === "approved" && !caseFunding(c).done;

/** Entities with the open backend cases (and the page case) attached to their owners. Pure. */
export function attachCases(entities: DonationEntity[], rows: CaseRow[], pageCase?: CaseRow | null): DonationEntity[] {
  const extra = new Map<string, LinkedCase[]>();
  const add = (row: CaseRow, first = false) => {
    const owner = ownerOfCase(entities, row);
    if (!owner) return;
    const list = extra.get(owner.id) ?? [];
    const lc = rowToLinkedCase(row);
    const at = list.findIndex((x) => x.apiId === lc.apiId);
    if (at >= 0) list.splice(at, 1);
    if (first) list.unshift(lc);
    else list.push(lc);
    extra.set(owner.id, list);
  };
  rows.filter(isOpen).sort((a, b) => Number(!!b.is_urgent) - Number(!!a.is_urgent)).forEach((r) => add(r));
  if (pageCase) add(pageCase, true);
  // Sample cases (no backend id) are never offered: a donation can't be booked on them.
  return entities.map((e) => {
    const more = extra.get(e.id) ?? [];
    const ids = new Set(more.map((x) => x.apiId));
    const own = e.cases.filter((x) => x.apiId && !ids.has(x.apiId));
    if (!more.length && own.length === e.cases.length) return e;
    return { ...e, cases: [...more, ...own] };
  });
}
