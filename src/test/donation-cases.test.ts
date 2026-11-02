import { describe, expect, it } from "vitest";
import { attachCases, linkedCaseId, ownerOfCase } from "@/data/donationCases";
import type { DonationEntity } from "@/data/donationEntities";
import type { CaseRow } from "@/data/casesApi";

const ent = (id: string, entityType: DonationEntity["entityType"], apiId?: number, cases: DonationEntity["cases"] = []): DonationEntity =>
  ({ id, apiId, entityType, ar: id, en: id, taglineAr: "", taglineEn: "", image: "", donationType: "cash", categoryAr: "", categoryEn: "", priceFrom: 0, shares: [], cases } as DonationEntity);

const row = (id: number, extra: Partial<CaseRow> = {}): CaseRow =>
  ({ id: String(id), ref_code: `CASE-${id}`, title: `حالة ${id}`, beneficiary_name: "", governorate: "", city: null, needed_amount: 1000, raised_amount: 100, status: "approved", is_urgent: false, urgency: "medium", program_id: null, project_id: null, donation_campaign_id: null, ...extra } as unknown as CaseRow);

const sample = { id: "c-sample", refCode: "CAS-GEN-001", titleAr: "عينة", titleEn: "", beneficiaryName: "", governorate: "", neededAmount: 1, raisedAmount: 0 };
const entities = [ent("general", "program", 1, [sample]), ent("zakat", "program", 7), ent("water", "project", 28), ent("zell", "campaign", 5)];

describe("donate form cases", () => {
  it("lists each open case under its owner, and unlinked cases under the general donation", () => {
    const out = attachCases(entities, [row(1, { program_id: "7" }), row(2, { project_id: "28" }), row(3, { donation_campaign_id: "5" }), row(4)]);
    const by = Object.fromEntries(out.map((e) => [e.id, e.cases.map((c) => c.apiId)]));
    expect(by).toEqual({ general: [4], zakat: [1], water: [2], zell: [3] });
  });

  it("drops sample cases and skips funded / unapproved cases", () => {
    const out = attachCases(entities, [row(5, { raised_amount: 1000 }), row(6, { status: "pending_review" as CaseRow["status"] })]);
    expect(out.find((e) => e.id === "general")!.cases).toEqual([]);
  });

  it("always lists the page case first, even when funded or missing from the list", () => {
    const out = attachCases(entities, [row(8), row(9)], row(9, { raised_amount: 1000 }));
    expect(out[0].cases.map((c) => c.id)).toEqual([linkedCaseId(9), linkedCaseId(8)]);
  });

  it("falls back to the general donation for an unknown owner", () => {
    expect(ownerOfCase(entities, row(1, { program_id: "999" }))!.id).toBe("general");
  });
});
