import { asset } from "@/data/pageImages";

/**
 * Field-convoy & Qurbani photos shown by FieldConvoysGallery (/farm, /qurbani, program pages).
 * These are the defaults: each page's list can be replaced from the dashboard (معارض الصفحات).
 * `src` is an `asset:` name (see data/pageImages.ts).
 */
export type FieldConvoyItem = {
  src: string;
  ar: string;
  en: string;
  year: string;
  tag: "qurbani" | "convoy";
  city: string;
};

export const FIELD_CONVOYS: FieldConvoyItem[] = [
  { src: asset("field/convoy-2026-elder-handover.jpg"), year: "2026", tag: "convoy",  city: "المنصورة",      ar: "متطوع اليسر يسلّم كرتونة العزومة لسيدة كبيرة في السن بكرامة — المنصورة 2026", en: "Al-Yusr volunteer hands a food box to an elderly woman with dignity — Mansoura 2026" },
  { src: asset("field/convoy-2026-night-handover.jpg"), year: "2026", tag: "convoy",  city: "الدقهلية",      ar: "تسليم أكياس مساعدات لسيدة مستحقة من سيارة اليسر ليلًا بقرى الدقهلية 2026",   en: "Night handover of relief bags to an eligible woman from the Al-Yusr van — Dakahlia villages 2026" },
  { src: asset("field/convoy-2026-day-distribution.jpg"), year: "2026", tag: "convoy",  city: "كفر الشيخ",     ar: "توزيع نهاري لكراتين العزومة على أهالي قرى كفر الشيخ — قافلة اليسر فبراير 2026", en: "Daytime food-box distribution to Kafr El-Sheikh village residents — Al-Yusr convoy Feb 2026" },
  { src: asset("field/convoy-2026-night-delivery.jpg"), year: "2026", tag: "convoy",  city: "الدقهلية",      ar: "متطوع اليسر يسلّم المساعدات لأسرة متعففة ليلًا — قرى الدقهلية 2026",       en: "Al-Yusr volunteer delivering aid to a family at night — Dakahlia villages 2026" },
  { src: asset("field/convoy-2026-pickup-loaded.jpg"), year: "2026", tag: "convoy",  city: "المنصورة",      ar: "سيارة اليسر محملة بكراتين العزومة وأكياس الإغاثة 2026",                    en: "Al-Yusr van loaded with food boxes and relief bags — 2026" },
  { src: asset("field/convoy-2026-fuwah-road.jpg"), year: "2026", tag: "convoy",  city: "كفر الشيخ",     ar: "قافلة اليسر 2026 في طريقها من المنصورة إلى كفر الشيخ ورشيد",                en: "Al-Yusr 2026 convoy heading from Mansoura toward Kafr El-Sheikh & Rasheed" },
  { src: asset("field/qurbani-2024-meat-tray.jpg"), year: "2024", tag: "qurbani", city: "المنصورة",      ar: "صكوك أضحية اليسر 2024 — لحم بلدي طازج من المزرعة الوقفية بالدقهلية",   en: "Al-Yusr Qurbani 2024 — fresh local meat from the Dakahlia endowment farm" },
  { src: asset("field/qurbani-2024-cattle-truck.jpg"), year: "2024", tag: "qurbani", city: "المنصورة",      ar: "ماشية الأضحية 2024 محصنة بالكامل قبل النقل للمسلخ بالمنصورة",            en: "Vaccinated Qurbani cattle 2024 en route to the Mansoura slaughterhouse" },
  { src: asset("field/qurbani-2024-packing-area.jpg"), year: "2024", tag: "qurbani", city: "الدقهلية",      ar: "تجهيز وتغليف لحوم الأضحية 2024 بإشراف بيطري بالدقهلية",                  en: "Hygienic Qurbani 2024 cutting & packaging under vet supervision" },
  { src: asset("field/qurbani-2024-cattle-pen.jpg"), year: "2024", tag: "qurbani", city: "المنصورة",      ar: "حظيرة معاينة ماشية الأضحية 2024 — متطوعو اليسر وإشراف بيطري قبل الذبح بالمنصورة", en: "Qurbani 2024 livestock inspection pen — Al-Yusr volunteers and vet supervision before slaughter in Mansoura" },
  { src: asset("field/qurbani-2025-prep-a.jpg"), year: "2025", tag: "qurbani", city: "المنصورة",      ar: "صك أضحية اليسر 2025 جاهز للتسليم لأسرة مستحقة بالمنصورة",                en: "Al-Yusr Qurbani 2025 share ready for delivery to a Mansoura family" },
  { src: asset("field/qurbani-2025-prep-b.jpg"), year: "2025", tag: "qurbani", city: "الدقهلية",      ar: "توزيع لحوم أضحية 2025 على أسر الدقهلية في يوم العيد",                    en: "Qurbani 2025 meat distribution to Dakahlia families on Eid day" },
  { src: asset("field/qurbani-2025-prep-c.jpg"), year: "2025", tag: "qurbani", city: "المنصورة",      ar: "توثيق صك أضحية 2025 — صور وفيديو لكل متبرع",                              en: "Qurbani 2025 voucher documentation — photos & video for every donor" },
];
