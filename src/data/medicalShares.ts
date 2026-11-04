import type { EntityKind, Share } from "@/data/entityShares";

/**
 * Backend records behind each tab of /medical, and the shares shown until those records have packages.
 * Prices and packages are edited in the dashboard; these defaults are only the offline fallback.
 */
export const MEDICAL_SOURCES: Record<"complex" | "treatment" | "disability" | "convoys", { kind: EntityKind; slug: string }> = {
  complex: { kind: "project", slug: "medical" },
  treatment: { kind: "program", slug: "treatment" },
  disability: { kind: "program", slug: "prosthetics" },
  convoys: { kind: "program", slug: "medical-convoys" },
};

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
