/**
 * Internal links between the pages that own our search keywords (docs/seo-keywords.csv, column
 * «الصفحة المالكة»). Each owner page links to 4 related owners, with that owner's main keyword as the
 * anchor text, so every owner gets links from its neighbours with the words it should rank for.
 * Shown as a visible block above the footer (RelatedOwnerLinks); never hidden text.
 */
export type OwnerPage = { path: string; ar: string; en: string };

export const OWNER_PAGES: Record<string, OwnerPage> = {
  "/": { path: "/", ar: "مؤسسة اليسر الخيرية", en: "Al-Yusr Charity Foundation" },
  "/contact": { path: "/contact", ar: "رقم وعنوان مؤسسة اليسر الخيرية", en: "Contact Al-Yusr" },
  "/charity-mansoura": { path: "/charity-mansoura", ar: "جمعية خيرية في المنصورة", en: "A charity in Mansoura" },
  "/charity-egypt": { path: "/charity-egypt", ar: "جمعيات خيرية موثوقة في مصر", en: "Trusted charities in Egypt" },
  "/zakat": { path: "/zakat", ar: "حاسبة الزكاة وزكاة المال", en: "Zakat calculator" },
  "/water": { path: "/water", ar: "صدقة جارية: سقيا الماء", en: "Sadaqah jariyah: water" },
  "/food-box": { path: "/food-box", ar: "كرتونة رمضان وإطعام الطعام", en: "Ramadan food box" },
  "/programs/orphans": { path: "/programs/orphans", ar: "كفالة يتيم في مصر", en: "Sponsor an orphan in Egypt" },
  "/programs/treatment": { path: "/programs/treatment", ar: "التبرع لعلاج مريض", en: "Help a patient's treatment" },
  "/programs/bride": { path: "/programs/bride", ar: "تجهيز عرائس يتيمات", en: "Help a bride's trousseau" },
  "/qurbani": { path: "/qurbani", ar: "صك الأضحية أونلاين", en: "Qurbani share online" },
  "/cases": { path: "/cases", ar: "حالات إنسانية تحتاج مساعدة", en: "Cases that need help" },
  "/misbaha": { path: "/misbaha", ar: "مسبحة إلكترونية جماعية", en: "Shared online tasbih" },
  "/volunteer": { path: "/volunteer", ar: "فرص تطوع في المنصورة", en: "Volunteer in Mansoura" },
  "/trust": { path: "/trust", ar: "هل مؤسسة اليسر موثوقة؟", en: "Is Al-Yusr trustworthy?" },
  "/donate-from-abroad": { path: "/donate-from-abroad", ar: "التبرع لمصر من الخارج", en: "Give to Egypt from abroad" },
  "/donate": { path: "/donate", ar: "تبرع أونلاين بالفيزا أو المحفظة", en: "Donate online" },
  "/mosques": { path: "/mosques", ar: "إعمار مسجد في مصر", en: "Build a mosque in Egypt" },
  "/nurseries": { path: "/nurseries", ar: "تحفيظ القرآن وحضانات خيرية", en: "Quran nurseries" },
  "/athar": { path: "/athar", ar: "شنطة مدرسية وتعليم الأيتام", en: "School bags & orphans' education" },
  "/farm": { path: "/farm", ar: "وقف خيري: مزرعة اليسر", en: "Charity endowment farm" },
};

/** Related owners per owner page (by topic and by the donor's next question). */
export const OWNER_RELATED: Record<string, string[]> = {
  "/": ["/charity-mansoura", "/trust", "/cases", "/donate-from-abroad"],
  "/contact": ["/trust", "/charity-mansoura", "/volunteer", "/donate"],
  "/charity-mansoura": ["/nurseries", "/volunteer", "/trust", "/charity-egypt"],
  "/charity-egypt": ["/trust", "/donate-from-abroad", "/charity-mansoura", "/zakat"],
  "/zakat": ["/farm", "/programs/orphans", "/programs/treatment", "/food-box"],
  "/water": ["/mosques", "/misbaha", "/programs/bride", "/donate-from-abroad"],
  "/food-box": ["/zakat", "/farm", "/qurbani", "/charity-mansoura"],
  "/programs/orphans": ["/programs/bride", "/athar", "/water", "/trust"],
  "/programs/treatment": ["/cases", "/zakat", "/trust", "/donate-from-abroad"],
  "/programs/bride": ["/programs/orphans", "/cases", "/zakat", "/charity-mansoura"],
  "/qurbani": ["/food-box", "/donate-from-abroad", "/trust", "/zakat"],
  "/cases": ["/programs/treatment", "/zakat", "/trust", "/charity-mansoura"],
  "/misbaha": ["/water", "/mosques", "/nurseries", "/programs/orphans"],
  "/volunteer": ["/charity-mansoura", "/athar", "/misbaha", "/contact"],
  "/trust": ["/charity-egypt", "/contact", "/cases", "/donate"],
  "/donate-from-abroad": ["/trust", "/zakat", "/mosques", "/qurbani"],
  "/donate": ["/trust", "/cases", "/zakat", "/donate-from-abroad"],
  "/mosques": ["/water", "/nurseries", "/donate-from-abroad", "/zakat"],
  "/nurseries": ["/mosques", "/athar", "/programs/orphans", "/charity-mansoura"],
  "/athar": ["/programs/orphans", "/nurseries", "/zakat", "/volunteer"],
  "/farm": ["/water", "/mosques", "/food-box", "/zakat"],
};

/** The related owner pages for a path (empty when the path owns no keywords). */
export function relatedOwners(pathname: string): OwnerPage[] {
  const key = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return (OWNER_RELATED[key] ?? []).map((p) => OWNER_PAGES[p]).filter((p): p is OwnerPage => !!p && p.path !== key);
}
