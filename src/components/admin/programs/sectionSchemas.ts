/**
 * Known `section_key` values for /programs/{id}/page-sections and the shape of their
 * content_ar / content_en items and settings.
 *
 * Source of truth: live records of program 35 (GET /programs/35/page-sections), the Postman
 * examples, and the sections rendered by the public page src/pages/ProgramDetail.tsx
 * (benefits, how-it-works, details, impact, testimonials, faq, related + the in-page TOC).
 * Keys whose item shape is not proven by a live record are marked `proposed`.
 */

export type ItemFieldType = "text" | "textarea" | "icon" | "number" | "switch";

export interface ItemField {
  name: string;
  labelAr: string;
  type: ItemFieldType;
  /** Text direction override (e.g. URLs are always ltr). */
  dir?: "ltr" | "rtl";
  width?: "full" | "half";
}

export type SectionContentKind = "items" | "none";

export interface SectionSchema {
  key: string;
  labelAr: string;
  labelEn: string;
  /** Anchor id on the public page. */
  anchor?: string;
  content: SectionContentKind;
  itemFields?: ItemField[];
  /** Default new item for the content list. */
  newItem?: () => Record<string, unknown>;
  /** settings.top_section navigation list (only for the "top_section" key). */
  navSettings?: boolean;
  /** Shape inferred from the public page, no live record yet. */
  proposed?: boolean;
  hintAr?: string;
}

const textIcon: ItemField[] = [
  { name: "text", labelAr: "النص", type: "textarea", width: "full" },
  { name: "icon", labelAr: "الأيقونة", type: "icon", width: "half" },
];

const steps: ItemField[] = [
  { name: "step", labelAr: "رقم الخطوة", type: "number", width: "half" },
  { name: "icon", labelAr: "الأيقونة", type: "icon", width: "half" },
  { name: "title", labelAr: "العنوان", type: "text", width: "full" },
  { name: "description", labelAr: "الوصف", type: "textarea", width: "full" },
];

export const NAV_ITEM_FIELDS: ItemField[] = [
  { name: "key", labelAr: "مفتاح القسم", type: "text", dir: "ltr", width: "half" },
  { name: "url", labelAr: "الرابط (مثال: #faq)", type: "text", dir: "ltr", width: "half" },
  { name: "title_ar", labelAr: "العنوان بالعربية", type: "text", dir: "rtl", width: "half" },
  { name: "title_en", labelAr: "العنوان بالإنجليزية", type: "text", dir: "ltr", width: "half" },
  { name: "is_enabled", labelAr: "ظاهر", type: "switch", width: "half" },
];

/** Default in-page navigation, identical to the live record of program 35 and the public TOC. */
export const DEFAULT_NAV_ITEMS: Array<Record<string, unknown>> = [
  { key: "benefits", title_ar: "المزايا", title_en: "Benefits", url: "#benefits", is_enabled: true, sort_order: 1 },
  { key: "how_it_works", title_ar: "كيف يعمل البرنامج", title_en: "How It Works", url: "#how-it-works", is_enabled: true, sort_order: 2 },
  { key: "details", title_ar: "التفاصيل", title_en: "Details", url: "#details", is_enabled: true, sort_order: 3 },
  { key: "impact", title_ar: "الأثر", title_en: "Impact", url: "#impact", is_enabled: true, sort_order: 4 },
  { key: "testimonials", title_ar: "آراء المتبرعين", title_en: "Testimonials", url: "#testimonials", is_enabled: true, sort_order: 5 },
  { key: "faq", title_ar: "أسئلة شائعة", title_en: "FAQ", url: "#faq", is_enabled: true, sort_order: 6 },
  { key: "related", title_ar: "برامج مشابهة", title_en: "Related Programs", url: "#related", is_enabled: true, sort_order: 7 },
];

export const SECTION_SCHEMAS: SectionSchema[] = [
  {
    key: "top_section",
    labelAr: "روابط الأقسام (شريط التنقل)",
    labelEn: "Section navigation",
    content: "none",
    navSettings: true,
    hintAr: "قائمة الروابط التي تظهر أعلى صفحة البرنامج للتنقل بين الأقسام. تُحفظ داخل settings.top_section.",
  },
  {
    key: "benefits",
    labelAr: "مزايا البرنامج",
    labelEn: "Benefits",
    anchor: "benefits",
    content: "items",
    itemFields: textIcon,
    newItem: () => ({ text: "", icon: "check-circle" }),
  },
  {
    key: "how_it_works",
    labelAr: "كيف يعمل البرنامج",
    labelEn: "How it works",
    anchor: "how-it-works",
    content: "items",
    itemFields: steps,
    newItem: () => ({ step: 1, title: "", description: "", icon: "hand-heart" }),
  },
  {
    key: "details",
    labelAr: "التفاصيل (فقرات)",
    labelEn: "Details",
    anchor: "details",
    content: "items",
    itemFields: [{ name: "text", labelAr: "الفقرة", type: "textarea", width: "full" }],
    newItem: () => ({ text: "" }),
  },
  {
    key: "impact",
    labelAr: "الأثر / رحلة التبرع",
    labelEn: "Impact",
    anchor: "impact",
    content: "items",
    itemFields: steps,
    newItem: () => ({ step: 1, title: "", description: "", icon: "hand-heart" }),
  },
  {
    key: "donor_testimonials",
    labelAr: "آراء المتبرعين",
    labelEn: "Donor testimonials",
    anchor: "testimonials",
    content: "items",
    proposed: true,
    itemFields: [
      { name: "name", labelAr: "اسم المتبرع", type: "text", width: "half" },
      { name: "location", labelAr: "المدينة / الصفة", type: "text", width: "half" },
      { name: "text", labelAr: "نص الرأي", type: "textarea", width: "full" },
    ],
    newItem: () => ({ name: "", location: "", text: "" }),
  },
  {
    key: "faq",
    labelAr: "أسئلة شائعة",
    labelEn: "FAQ",
    anchor: "faq",
    content: "items",
    proposed: true,
    itemFields: [
      { name: "question", labelAr: "السؤال", type: "text", width: "full" },
      { name: "answer", labelAr: "الإجابة", type: "textarea", width: "full" },
    ],
    newItem: () => ({ question: "", answer: "" }),
  },
  {
    key: "related_programs",
    labelAr: "برامج مشابهة",
    labelEn: "Related programs",
    anchor: "related",
    content: "none",
    proposed: true,
    hintAr: "يعرض برامج أخرى. لتحديدها يدوياً اكتب في الإعدادات: {\"program_slugs\": [\"box\", \"water\"]}",
  },
];

export function getSectionSchema(key: string): SectionSchema | undefined {
  return SECTION_SCHEMAS.find((s) => s.key === key);
}
