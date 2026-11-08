import type { EntityKind, Share } from "@/data/entityShares";

/**
 * Every section of /medical sells the packages of ONE backend record: the project "medical"
 * (المشاريع → المجمعات الطبية), so every donation on the page is recorded on that project.
 * Each section shows the project's packages whose name matches its words (SECTION_WORDS); when none
 * matches, the section's defaults below are shown and they open the donate form on the project with
 * that amount. Prices and packages are edited in the dashboard; these defaults are only the fallback.
 */
const MEDICAL_PROJECT = { kind: "project" as EntityKind, slug: "medical" };

export const MEDICAL_SOURCES: Record<"complex" | "treatment" | "disability" | "convoys", { kind: EntityKind; slug: string }> = {
  complex: MEDICAL_PROJECT,
  treatment: MEDICAL_PROJECT,
  disability: MEDICAL_PROJECT,
  convoys: MEDICAL_PROJECT,
};

/** Words that pair a project package with a section (matched against the package key and names). */
export const SECTION_WORDS = {
  disability: ["إعاق", "طرف", "كرسي", "علاج طبيعي", "تأهيل", "disab", "prosthe", "wheelchair", "physio", "rehab"],
  convoys: ["قافل", "قوافل", "convoy"],
};

/** The shares of `all` matching one of `words`, or `defaults` when none does. */
export function sectionShares(all: Share[], words: string[], defaults: Share[]): Share[] {
  const ws = words.map((w) => w.toLowerCase());
  const hit = all.filter((s) => {
    const text = `${s.id} ${s.nameAr} ${s.nameEn}`.toLowerCase();
    return ws.some((w) => text.includes(w));
  });
  return hit.length ? hit : defaults;
}

export const COMPLEX_SHARES: Share[] = [
  { id: "mc-checkup", nameAr: "ادفع كشف مريض", nameEn: "Pay for a patient's check-up", amount: 80 },
  { id: "mc-prescription", nameAr: "صرف روشتة مريض", nameEn: "A patient's prescription", amount: 500 },
  { id: "mc-equip", nameAr: "شراء جهاز طبي أو تجهيزات للمبنى", nameEn: "A medical device or equipment for the building", amount: 1000 },
  { id: "mc-surgery", nameAr: "المساهمة في عملية جراحية", nameEn: "Contribute to a surgery", amount: 1000 },
];

export const TREATMENT_SHARES: Share[] = [
  { id: "tr-prescription", nameAr: "صرف روشتة بالمجان", nameEn: "A free prescription", amount: 500 },
  { id: "tr-surgery", nameAr: "المساهمة في عملية جراحية", nameEn: "Contribute to a surgery", amount: 1000 },
  { id: "tr-radiology", nameAr: "أشعة لمريض مستحق", nameEn: "A scan for a patient in need", amount: 500 },
  { id: "tr-labs", nameAr: "تحاليل لمريض مستحق", nameEn: "Lab tests for a patient in need", amount: 500 },
];

export const DISABILITY_SHARES: Share[] = [
  { id: "dis-physio", nameAr: "جلسة علاج طبيعي لطفل", nameEn: "A physiotherapy session for a child", amount: 150 },
  { id: "dis-rehab", nameAr: "شهر تأهيل لطفل من ذوي الإعاقة", nameEn: "A month of rehabilitation for a child", amount: 600 },
];

export const CONVOY_SHARES: Share[] = [
  { id: "cv-share", nameAr: "سهم في قافلة طبية", nameEn: "A share in a medical convoy", amount: 500 },
];
