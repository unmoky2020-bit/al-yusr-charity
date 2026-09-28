/**
 * Al-Yusr Seasons — central data for the six annual campaigns.
 *
 * Each season has a slug used for routing `/seasons/:slug`, bilingual copy,
 * detailed pillars/items, donate target, and an `enabled` flag that controls
 * whether the campaign accepts new donations. The flag has a default value
 * (`defaultEnabled`) but admins can override it at runtime via localStorage
 * using `setSeasonEnabled(slug, value)` — read with `isSeasonEnabled(slug)`.
 * No backend migration needed; the override syncs across tabs via the
 * `storage` event.
 */

import { Snowflake, Sun, Moon, Sparkles, Beef, GraduationCap, type LucideIcon } from "lucide-react";

export type SeasonSlug = "ster" | "thill" | "ramadan" | "ashr" | "qurbani" | "school";

export type SeasonItem = {
  ar: string;
  en: string;
  /** Optional short description */
  arD?: string;
  enD?: string;
};

export type Season = {
  slug: SeasonSlug;
  icon: LucideIcon;
  /** True by default = active campaign accepting donations */
  defaultEnabled: boolean;
  /** Hero image (relative path under src/assets — imported by detail page) */
  heroImage?: string;
  /** Gallery images */
  gallery?: string[];
  /** Months it runs (display only) */
  monthsAr: string;
  monthsEn: string;
  /** Numeric months it is "current" (Hijri-approx by Gregorian) */
  currentMonths: number[];
  tagAr: string;
  tagEn: string;
  titleAr: string;
  titleEn: string;
  taglineAr: string;
  taglineEn: string;
  descriptionAr: string;
  descriptionEn: string;
  /** Donate URL — campaign hub for that season */
  donateHref: string;
  /** Bullet items / what's included */
  items: SeasonItem[];
  /** Donation amount tiers (EGP) */
  pricing?: { labelAr: string; labelEn: string; amount: number; tagAr?: string; tagEn?: string }[];
  /** SEO */
  metaTitleAr: string;
  metaTitleEn: string;
  metaDescAr: string;
  metaDescEn: string;
  keywordsAr: string[];
  keywordsEn: string[];
};

export const SEASONS: Season[] = [
  {
    slug: "ster",
    icon: Snowflake,
    defaultEnabled: true,
    monthsAr: "أكتوبر — فبراير",
    monthsEn: "October — February",
    currentMonths: [10, 11, 12, 1, 2],
    tagAr: "موسم الشتاء",
    tagEn: "Winter season",
    titleAr: "حملة ستر — موسم الشتاء",
    titleEn: "Ster Campaign — Winter Season",
    taglineAr: "«من ستر مسلمًا ستره الله في الدنيا والآخرة»",
    taglineEn: "“Whoever shields a Muslim, Allah shields him in this life and the next.”",
    descriptionAr:
      "بنحمي أهالينا من البرد قبل ما يجي. لحاف فايبر، أسقف منازل، مراتب، كسوة شتاء، سراير، وبنية أساسية (باب وشباك) تحبس الريح وتدفّي البيت. كل تبرع يصل لمستحقه بالاسم والتوثيق.",
    descriptionEn:
      "We shield our people from the cold before it arrives — fiber blankets, roofs, mattresses, winter clothes, beds, and basic infrastructure (doors & windows) that hold back the wind. Every donation reaches a named beneficiary, fully documented.",
    donateHref: "/donate?campaign=ster",
    items: [
      { ar: "لحاف فايبر مقاوم للبرد", en: "Cold-resistant fiber blanket" },
      { ar: "كسوة شتاء كاملة للأطفال والكبار", en: "Full winter clothing — kids & adults" },
      { ar: "مراتب وسراير لمن لا يجد", en: "Mattresses and beds for those who lack them" },
      { ar: "إصلاح/تركيب أبواب وشبابيك", en: "Door & window repair or installation" },
      { ar: "إصلاح وتركيب أسقف منازل", en: "Roof repair and installation" },
    ],
    pricing: [
      { labelAr: "لحاف فايبر", labelEn: "Fiber blanket", amount: 350, tagAr: "الأكثر طلباً", tagEn: "Most needed" },
      { labelAr: "كسوة شتاء فرد", labelEn: "Winter outfit (1 person)", amount: 500 },
      { labelAr: "مرتبة + سرير", labelEn: "Mattress + bed", amount: 1800 },
      { labelAr: "سقف بيت أسرة", labelEn: "Roof for a family home", amount: 9500 },
    ],
    metaTitleAr: "حملة ستر للشتاء | بطاطين وأسقف وكسوة شتاء — مؤسسة اليسر",
    metaTitleEn: "Ster Winter Campaign | Blankets, Roofs & Winter Aid — Al-Yusr",
    metaDescAr: "ساهم في حملة ستر الشتوية مع مؤسسة اليسر: بطاطين فايبر، كسوة شتاء، أسقف منازل، وأبواب وشبابيك للأسر الأولى بالرعاية في الدقهلية. توثيق كامل وتوصيل مجاني.",
    metaDescEn: "Support the Ster winter campaign by Al-Yusr Foundation: fiber blankets, winter clothing, home roofs, and door/window repair for vulnerable families in Dakahlia. Fully documented with free delivery.",
    keywordsAr: ["حملة ستر", "كسوة الشتاء", "بطاطين للفقراء", "أسقف منازل", "تبرعات الشتاء", "اليسر الدقهلية"],
    keywordsEn: ["winter campaign egypt", "blankets donation", "roof repair charity", "ster yusr", "dakahlia winter aid"],
  },
  {
    slug: "thill",
    icon: Sun,
    defaultEnabled: true,
    monthsAr: "يونيو — سبتمبر",
    monthsEn: "June — September",
    currentMonths: [6, 7, 8, 9],
    tagAr: "موسم الصيف",
    tagEn: "Summer season",
    titleAr: "حملة ظل — رحمة من الشمس",
    titleEn: "Thill Campaign — Mercy from the Sun",
    taglineAr: "ظل ومياه ونفس بارد للي بيشتغل تحت الشمس",
    taglineEn: "Shade, water, and cool relief for those working under the sun",
    descriptionAr:
      "في عز الحر بنوصل وصلات مياه نظيفة للمنازل والقرى، وبنركّب أسقف تحمي من الشمس، وبنجدّد ونوزّع أجهزة مستعملة (مراوح وثلاجات)، وبنوزّع مياه ومشروبات باردة للعمال في الشوارع.",
    descriptionEn:
      "At the peak of summer we install clean water lines for homes and whole villages, install sun-proof roofs, refurbish and distribute used appliances (fans, fridges), and hand out cold water and drinks to outdoor workers.",
    donateHref: "/donate?campaign=thill",
    items: [
      { ar: "وصلة مياه نظيفة لبيت", en: "Clean water connection for a home" },
      { ar: "خط مياه رئيسي لقرية", en: "Main water line for a village" },
      { ar: "سقف يحمي من الشمس", en: "A sun-proof roof" },
      { ar: "مروحة أو ثلاجة مجدَّدة", en: "Refurbished fan or fridge" },
      { ar: "مياه ومشروبات باردة للعمال", en: "Cold water & drinks for outdoor workers" },
    ],
    pricing: [
      { labelAr: "وصلة مياه لبيت", labelEn: "Water line for a home", amount: 1200, tagAr: "الأكثر طلباً", tagEn: "Most needed" },
      { labelAr: "مروحة مجدّدة", labelEn: "Refurbished fan", amount: 450 },
      { labelAr: "ثلاجة مجدّدة", labelEn: "Refurbished fridge", amount: 3500 },
      { labelAr: "خط مياه لقرية", labelEn: "Village water line", amount: 25000 },
    ],
    metaTitleAr: "حملة ظل للصيف | مياه نظيفة ومراوح وأسقف — مؤسسة اليسر",
    metaTitleEn: "Thill Summer Campaign | Water, Fans & Roofs — Al-Yusr",
    metaDescAr: "احمِ أسرة من حرارة الصيف: وصلات مياه نظيفة، أسقف، تجديد أجهزة، ومشروبات باردة للعمال. حملة ظل من اليسر في الدقهلية وقرى مصر.",
    metaDescEn: "Shield a family from summer heat: clean water lines, roofs, refurbished appliances, and cold drinks for outdoor workers. Al-Yusr’s Thill campaign across Dakahlia.",
    keywordsAr: ["حملة ظل", "مياه نظيفة للقرى", "تبرعات الصيف", "تجديد أجهزة", "اليسر الدقهلية"],
    keywordsEn: ["summer charity egypt", "clean water donation", "village water line", "thill yusr"],
  },
  {
    slug: "ramadan",
    icon: Moon,
    defaultEnabled: false,
    monthsAr: "شهر رمضان",
    monthsEn: "Ramadan",
    currentMonths: [3, 4],
    tagAr: "شهر الخير",
    tagEn: "Holy Ramadan",
    titleAr: "موسم رمضان — إحسان العطاء",
    titleEn: "Ramadan Season — Excellence in Giving",
    taglineAr: "«أحسن العطاء» — كل المكونات بلدي وطازجة من شركات موثوقة",
    taglineEn: "“The best of giving” — local, fresh ingredients from trusted suppliers",
    descriptionAr:
      "موسم متكامل: كرتونة الخير 25 كجم، مشروع الإفطار اليومي، تيسير زواج عروسة من بناتنا اليتيمات كل يوم، أكثر من 3 طن ذبائح طازجة، مسابقات للقرآن بجوائز قيّمة، وزكاة المال والفطر للأسر المستحقة في العشر الأواخر. وفي ليلة العيد: صلاة العيد بمسجد الصديق بالمنصورة.",
    descriptionEn:
      "A full season: 25kg Goodness box, the daily Iftar project, a wedding for an orphaned bride every day, 3+ tons of fresh meat, Quran contests with valuable prizes, and timely Zakat money & Fitr in the last ten nights — all topped with Eid prayer at Al-Siddiq Mosque, Mansoura.",
    donateHref: "/donate?campaign=ramadan",
    items: [
      { ar: "كرتونة الخير 25 كجم", en: "25kg Goodness food box", arD: "بقوليات، حبوب، جبنة، مكرونة، سكر، أرز، دقيق، صلصة، حلاوة، طحينة…", enD: "Legumes, grains, dairy, pasta, sugar, rice, flour, sauce, tahini…" },
      { ar: "مشروع الإفطار اليومي", en: "Daily Iftar project", arD: "وجبات يومية للصائمين، مرافقي المرضى، والمسافرين على الطرق.", enD: "Daily meals for fasters, hospital companions, travelers." },
      { ar: "تيسير الزواج", en: "Wedding facilitation", arD: "كل يوم عروسة من بناتنا الأيتام.", enD: "An orphaned bride married every day of Ramadan." },
      { ar: "ذبائح رمضان", en: "Ramadan slaughter", arD: "+3 طن لحوم طازجة من مزارعنا.", enD: "3+ tons of fresh meat from our farms." },
      { ar: "مسابقات القرآن", en: "Quran contests", arD: "جوائز قيّمة لحفظة كتاب الله.", enD: "Valuable prizes for memorizers." },
      { ar: "زكاة المال والفطر", en: "Zakat Mal & Fitr", arD: "موصّلة للمستحقين في العشر الأواخر.", enD: "Delivered to the deserving in the last 10 nights." },
    ],
    pricing: [
      { labelAr: "كرتونة الخير 25 كجم", labelEn: "25kg Goodness box", amount: 850, tagAr: "الأكثر طلباً", tagEn: "Most needed" },
      { labelAr: "وجبة إفطار صائم", labelEn: "Iftar meal", amount: 35 },
      { labelAr: "زكاة الفطر فرد", labelEn: "Zakat al-Fitr (1 person)", amount: 50 },
      { labelAr: "تيسير زواج يتيمة", labelEn: "Sponsor an orphan wedding", amount: 15000 },
    ],
    metaTitleAr: "حملة رمضان | كرتونة الخير، إفطار، زكاة وتيسير زواج — اليسر",
    metaTitleEn: "Ramadan Campaign | Food Box, Iftar, Zakat & Wedding Aid — Al-Yusr",
    metaDescAr: "أحسن العطاء مع مؤسسة اليسر في رمضان: كرتونة 25 كجم، إفطار صائم، تيسير زواج اليتيمات، ذبائح طازجة، زكاة المال والفطر. توثيق كامل وتوصيل مجاني.",
    metaDescEn: "Excellence in giving with Al-Yusr this Ramadan: 25kg food box, Iftar meals, orphan weddings, fresh meat, Zakat money & Fitr. Fully documented with free delivery.",
    keywordsAr: ["حملة رمضان", "كرتونة رمضان", "زكاة الفطر", "إفطار صائم", "تيسير زواج اليتيمات", "اليسر الدقهلية"],
    keywordsEn: ["ramadan food box egypt", "iftar donation", "zakat al fitr", "orphan wedding charity"],
  },
  {
    slug: "ashr",
    icon: Sparkles,
    defaultEnabled: false,
    monthsAr: "العشر الأوائل من ذي الحجة",
    monthsEn: "First 10 Days of Dhul Hijjah",
    currentMonths: [5],
    tagAr: "أحب الأيام إلى الله",
    tagEn: "Most beloved days",
    titleAr: "العشر الأوائل من ذي الحجة",
    titleEn: "The First Ten Days of Dhul Hijjah",
    taglineAr: "أعمال صالحة في أحب أيام السنة إلى الله",
    taglineEn: "Best deeds in the days most beloved to Allah",
    descriptionAr:
      "عشرة أيام تكثيف للعمل الميداني: وجبات إفطار يومية للصائمين والمساكين، ذبح عجل كل يوم لتوزيع لحوم طازجة، تكثيف وصلات المياه وإصلاح أسقف منازل، إعادة إعمار وتأهيل مساجد، وصلاة العيد بمسجد الصديق بالمنصورة.",
    descriptionEn:
      "Ten days of intensified field work: daily Iftar meals for fasters and the poor, a calf slaughtered every day, more water lines and roof fixes, mosque restoration, and Eid prayer at Al-Siddiq Mosque, Mansoura.",
    donateHref: "/donate?campaign=ashr",
    items: [
      { ar: "وجبة إفطار يومية", en: "Daily Iftar meal" },
      { ar: "ذبح عجل يومي وتوزيع لحومه طازجة", en: "Daily calf slaughter — fresh meat distribution" },
      { ar: "وصلات مياه وأسقف منازل", en: "Water lines and home roofing" },
      { ar: "إعادة إعمار وتأهيل مساجد", en: "Mosque restoration & maintenance" },
      { ar: "صلاة العيد بمسجد الصديق", en: "Eid prayer at Al-Siddiq Mosque" },
    ],
    pricing: [
      { labelAr: "وجبة إفطار صائم", labelEn: "Iftar meal", amount: 35 },
      { labelAr: "سهم ذبح يوم", labelEn: "Day-slaughter share", amount: 1500, tagAr: "الأكثر طلباً", tagEn: "Most needed" },
      { labelAr: "إعمار جزء من مسجد", labelEn: "Mosque-restoration share", amount: 5000 },
    ],
    metaTitleAr: "العشر الأوائل من ذي الحجة | إفطار وذبائح وإعمار مساجد — اليسر",
    metaTitleEn: "First 10 Days of Dhul Hijjah | Iftar, Slaughter & Mosques — Al-Yusr",
    metaDescAr: "أعمال صالحة في العشر الأوائل: إفطار يومي، ذبح عجل كل يوم، وصلات مياه، أسقف، وإعادة إعمار مساجد. تبرع الآن مع مؤسسة اليسر.",
    metaDescEn: "Best deeds in the First Ten Days: daily Iftar, daily calf slaughter, water lines, roofs, and mosque restoration. Donate now with Al-Yusr.",
    keywordsAr: ["العشر من ذي الحجة", "إعمار مساجد", "ذبائح", "إفطار يومي", "اليسر الدقهلية"],
    keywordsEn: ["dhul hijjah charity", "mosque restoration", "daily iftar", "yusr"],
  },
  {
    slug: "qurbani",
    icon: Beef,
    defaultEnabled: false,
    monthsAr: "موسم الأضاحي",
    monthsEn: "Qurbani Season",
    currentMonths: [5, 6],
    tagAr: "تيسير الأضاحي",
    tagEn: "Qurbani made easy",
    titleAr: "موسم الأضاحي — تيسير الأضاحي بدون استغلال",
    titleEn: "Qurbani Season — No Exploitation",
    taglineAr: "أضحيتك بسعر السوق… مقابل 5 كيلو للفقراء",
    taglineEn: "Your Qurbani at market price — for 5kg to the poor",
    descriptionAr:
      "بنشتغل طول العام في مزارع اليسر الوقفية: مواشي محصّنة بأفضل أعلاف لضمان أعلى تصفية وأقل دهون. المضحي يأخذ أضحيته بسعر السوق بدون ربح للمؤسسة، مقابل التبرع بـ 5 كيلو من الصك للفقراء. أكتر من 2 طن لحوم سنوياً للمستحقين.",
    descriptionEn:
      "Year-round work at Al-Yusr endowment farms: vaccinated cattle, top feed for highest yield and lowest fat. You take your Qurbani at market price with zero markup, in exchange for donating 5kg from each share to the poor. 2+ tons distributed yearly.",
    donateHref: "/qurbani",
    items: [
      { ar: "صك أضحية كامل (سعر السوق)", en: "Full Qurbani share (market price)" },
      { ar: "تبرع بـ 5 كيلو للفقراء", en: "5kg donation back to the poor" },
      { ar: "أعلاف وتحصين طول السنة", en: "Year-round feed & vaccination" },
      { ar: "ذبح حلال وتوثيق صور وفيديو", en: "Halal slaughter with photo & video proof" },
      { ar: "توصيل مجاني لباب البيت", en: "Free doorstep delivery" },
    ],
    metaTitleAr: "حملة الأضاحي 2026 | تيسير الأضاحي بدون استغلال — مزارع اليسر",
    metaTitleEn: "Qurbani 2026 | Market-Price Qurbani, No Exploitation — Al-Yusr",
    metaDescAr: "احجز أضحيتك بسعر السوق من مزارع اليسر الوقفية: مواشي محصّنة، تصفية أعلى، توثيق كامل، وتوصيل مجاني. مقابل تبرعك بـ 5 كيلو للفقراء.",
    metaDescEn: "Book your Qurbani at market price from Al-Yusr endowment farms: vaccinated cattle, higher yield, full documentation, free delivery — for 5kg donated back to the poor.",
    keywordsAr: ["أضحية", "حملة الأضاحي", "صك أضحية", "مزارع اليسر", "اليسر الدقهلية"],
    keywordsEn: ["qurbani 2026", "udhiya egypt", "qurbani share", "yusr farms"],
  },
  {
    slug: "school",
    icon: GraduationCap,
    defaultEnabled: true,
    monthsAr: "أغسطس — سبتمبر",
    monthsEn: "August — September",
    currentMonths: [8, 9],
    tagAr: "العودة للمدارس",
    tagEn: "Back to school",
    titleAr: "موسم العودة للمدارس — الجهل هو الفقر الأول",
    titleEn: "Back-to-School — Ignorance is the First Poverty",
    taglineAr: "علِّم طفل، تعلِّم جيل",
    taglineEn: "Educate a child, change a generation",
    descriptionAr:
      "بنجهّز كل طالب مستحق ليبدأ سنته الدراسية بكرامة: شنطة مدرسية، أدوات كاملة، زي مدرسي جديد، ودفع مصروفات دراسية لمن لا يستطيع.",
    descriptionEn:
      "We prepare every needy student to start the school year with dignity: school bag, full supplies, a new uniform, and tuition fees paid for those who cannot afford them.",
    donateHref: "/donate?campaign=school",
    items: [
      { ar: "شنطة مدرسية لكل طالب مستحق", en: "School bag for every needy student" },
      { ar: "طقم أدوات مدرسية كامل", en: "Full school supplies kit" },
      { ar: "زي مدرسي جديد", en: "Brand-new school uniform" },
      { ar: "دفع مصروفات دراسية", en: "Tuition fees coverage" },
    ],
    pricing: [
      { labelAr: "شنطة + أدوات لطفل", labelEn: "Bag + supplies (1 child)", amount: 450, tagAr: "الأكثر طلباً", tagEn: "Most needed" },
      { labelAr: "زي مدرسي كامل", labelEn: "Full school uniform", amount: 600 },
      { labelAr: "مصروفات دراسية لسنة", labelEn: "One year tuition", amount: 2500 },
    ],
    metaTitleAr: "العودة للمدارس | شنط وأدوات وزي ومصروفات — مؤسسة اليسر",
    metaTitleEn: "Back-to-School | Bags, Supplies, Uniforms & Tuition — Al-Yusr",
    metaDescAr: "ساهم في تجهيز طالب مستحق: شنطة مدرسية، أدوات كاملة، زي جديد، ودفع مصروفات. موسم العودة للمدارس مع مؤسسة اليسر بالدقهلية.",
    metaDescEn: "Help equip a needy student: school bag, supplies, new uniform, and tuition. Back-to-school season with Al-Yusr in Dakahlia.",
    keywordsAr: ["العودة للمدارس", "شنطة مدرسية", "كفالة طالب", "مصروفات دراسية", "اليسر الدقهلية"],
    keywordsEn: ["back to school egypt", "school bag donation", "tuition fees charity", "yusr"],
  },
];

export const getSeason = (slug: string): Season | undefined =>
  SEASONS.find((s) => s.slug === slug);

/* ---------------- Enable/disable mechanism (localStorage-backed) ---------------- */

const STORAGE_KEY = (slug: SeasonSlug) => `alyusr:season:${slug}:enabled`;

export const isSeasonEnabled = (slug: SeasonSlug): boolean => {
  if (typeof window === "undefined") return SEASONS.find((s) => s.slug === slug)?.defaultEnabled ?? false;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY(slug));
    if (v === "1") return true;
    if (v === "0") return false;
  } catch {}
  return SEASONS.find((s) => s.slug === slug)?.defaultEnabled ?? false;
};

export const setSeasonEnabled = (slug: SeasonSlug, enabled: boolean) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY(slug), enabled ? "1" : "0");
    // Notify same-tab listeners (storage event only fires cross-tab).
    window.dispatchEvent(new CustomEvent("alyusr:season-toggle", { detail: { slug, enabled } }));
  } catch {}
};

/** React hook — subscribes to enable/disable changes. */
import { useEffect, useState } from "react";
export const useSeasonEnabled = (slug: SeasonSlug): boolean => {
  const [enabled, setEnabled] = useState<boolean>(() => isSeasonEnabled(slug));
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY(slug)) setEnabled(isSeasonEnabled(slug));
    };
    const onCustom = (e: Event) => {
      const d = (e as CustomEvent).detail as { slug?: string };
      if (d?.slug === slug) setEnabled(isSeasonEnabled(slug));
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("alyusr:season-toggle", onCustom as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("alyusr:season-toggle", onCustom as EventListener);
    };
  }, [slug]);
  return enabled;
};

/** Detect the current season based on Gregorian month (approximation). */
export const currentSeasonSlug = (): SeasonSlug => {
  const m = new Date().getMonth() + 1;
  const hit = SEASONS.find((s) => s.currentMonths.includes(m));
  return (hit?.slug ?? "ster") as SeasonSlug;
};