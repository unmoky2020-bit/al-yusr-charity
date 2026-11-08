import { describe, expect, it } from "vitest";
import { CONVOY_SHARES, MEDICAL_SOURCES, SECTION_WORDS, sectionShares } from "./medicalShares";
import type { Share } from "./entityShares";

const PROJECT: Share[] = [
  { id: "pkg-89", apiId: 89, nameAr: "سهم روشتة علاج ودواء شهري", nameEn: "Monthly Prescription Share", amount: 200 },
  { id: "pkg-90", apiId: 90, nameAr: "سهم تحاليل وأشعة تشخيصية", nameEn: "Lab & Diagnostics Share", amount: 400 },
  { id: "pkg-92", apiId: 92, nameAr: "كرسي متحرك طبي قياسي كامل", nameEn: "Standard Medical Wheelchair", amount: 2500 },
  { id: "pkg-93", apiId: 93, nameAr: "سهم مساهمة في تركيب طرف صناعي", nameEn: "Prosthetic Limb Share", amount: 3000 },
];

describe("medical page sources", () => {
  it("records every section on the medical project", () => {
    for (const src of Object.values(MEDICAL_SOURCES)) expect(src).toEqual({ kind: "project", slug: "medical" });
  });

  it("gives the disability section the wheelchair and prosthetic packages", () => {
    expect(sectionShares(PROJECT, SECTION_WORDS.disability, []).map((s) => s.apiId)).toEqual([92, 93]);
  });

  it("falls back to the section defaults when no package matches", () => {
    expect(sectionShares(PROJECT, SECTION_WORDS.convoys, CONVOY_SHARES)).toBe(CONVOY_SHARES);
  });
});
