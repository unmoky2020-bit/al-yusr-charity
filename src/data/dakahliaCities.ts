/** Master list of Dakahlia cities served by Al-Yusr — used by ImpactMap, sitemap, and city pages. */
export type DakahliaCity = {
  slug: string;
  ar: string;
  en: string;
  lat: number;
  lon: number;
  families: number;
  programs: string[];
  highlight: { ar: string; en: string };
  /** Bilingual long copy used on /qurbani/:city pages for SEO. */
  copy: {
    ar: { intro: string; localNote: string; coverage: string };
    en: { intro: string; localNote: string; coverage: string };
  };
};

const c = (slug: string, ar: string, en: string, lat: number, lon: number, families: number, programs: string[], highlightAr: string, highlightEn: string): DakahliaCity => ({
  slug, ar, en, lat, lon, families, programs,
  highlight: { ar: highlightAr, en: highlightEn },
  copy: {
    ar: {
      intro: `نوزّع صكوك الأضحية في ${ar} كل سنة على أفقر الأسر، مع معاينة قبل الذبح وتوثيق بالصور والفيديو. اطمئن، فصك أضحيتك في ${ar} سيصل إلى باب البيت يوم العيد.`,
      localNote: `يتعاون فريق اليسر في ${ar} مع أئمة المساجد والوحدات المحلية لتحديد الأسر المستحقة فعلًا، ونسلّم اللحم طازجًا في يوم الذبح نفسه.`,
      coverage: `تغطية كاملة لقرى ومراكز ${ar} داخل محافظة الدقهلية مع توصيل مجاني للأسر التي لا تستطيع الحضور.`,
    },
    en: {
      intro: `We distribute Qurbani shares in ${en} every Eid to the poorest families, with pre-slaughter inspection and full photo/video documentation. Your Qurbani share in ${en} reaches the family's doorstep on Eid day.`,
      localNote: `Our ${en} team works with mosque imams and local social units to identify truly deserving families, and we deliver the meat fresh on slaughter day.`,
      coverage: `Full coverage of ${en} villages and districts within Dakahlia Governorate with free delivery for families unable to come in person.`,
    },
  },
});

export const DAKAHLIA_CITIES: DakahliaCity[] = [
  c("mansoura",     "المنصورة",   "Mansoura",     31.038, 31.381, 3200, ["odhya","box","education"], "المقر الرئيسي — كل البرامج نشطة", "HQ — all programs active"),
  c("mit-ghamr",    "ميت غمر",    "Mit Ghamr",    30.717, 31.262, 1100, ["odhya","box","water"],            "تركيز على وصلات المياه والكرتونة", "Focus on water lines & food boxes"),
  c("belqas",       "بلقاس",      "Belqas",       31.213, 31.358,  850, ["odhya","box","bride"],          "حملات نشطة لتجهيز العرائس", "Active brides preparation campaigns"),
  c("dikirnis",     "دكرنس",      "Dikirnis",     31.092, 31.589,  620, ["odhya","box","education"],       "20 طفلًا تحت الكفالة التعليمية", "20 children under education sponsorship"),
  c("sherbin",      "شربين",      "Sherbin",      31.181, 31.524,  480, ["odhya","water"],                  "12 وصلة مياه نظيفة", "12 clean water lines installed"),
  c("aga",          "أجا",        "Aga",          30.940, 31.237,  730, ["odhya","box"],            "توزيع شهري للحوم", "Monthly meat distribution"),
  c("sinbillawayn", "السنبلاوين", "Sinbillawayn", 30.881, 31.456,  540, ["odhya","zakat","box"],           "توزيع زكاة المال على المستحقين", "Zakat distribution to eligible families"),
  c("matareya",     "المطرية",    "Matareya",     31.183, 32.033,  410, ["odhya","water"],                  "قرى ساحلية محتاجة", "Coastal villages in need"),
  c("talkha",       "طلخا",       "Talkha",       31.054, 31.378,  390, ["odhya","box"],                    "تخدم القرى الغربية للنيل", "Serves Nile-west villages"),
  c("nabaroh",      "نبروه",      "Nabaroh",      31.107, 31.330,  260, ["odhya","box"],                   "توزيع لحوم شهري", "Monthly meat distribution"),
  c("gamalia",      "الجمالية",   "Gamalia",      31.180, 31.870,  220, ["odhya","box"],                    "قرى زراعية فقيرة", "Poor agricultural villages"),
  c("mit-salsil",   "ميت سلسيل",  "Mit Salsil",   31.241, 31.668,  180, ["odhya","water"],                  "احتياج كبير لمياه نظيفة", "High need for clean water"),
  c("bani-ubaid",   "بني عبيد",   "Bani Ubaid",   30.920, 31.555,  200, ["odhya","box"],                    "توزيع كرتونة العزومة", "Food box distribution"),
  c("manzala",      "المنزلة",    "Manzala",      31.165, 31.940,  340, ["odhya","box","water"],          "قرى الصيادين الفقيرة", "Poor fishermen villages"),
];

export const getCity = (slug: string) => DAKAHLIA_CITIES.find((x) => x.slug === slug);

/**
 * Districts / neighborhoods per city (Dakahlia governorate).
 * Used by AdminCaseDetail to offer a localized "area" dropdown after picking a city.
 * Names are bilingual; falls back to free-text "Other…" when unmatched.
 */
export const DISTRICTS_BY_CITY: Record<string, { ar: string; en: string }[]> = {
  mansoura: [
    { ar: "وسط البلد",      en: "Downtown" },
    { ar: "توريل",          en: "Toril" },
    { ar: "ميت خميس",       en: "Mit Khamis" },
    { ar: "المختلط",        en: "Mokhtalat" },
    { ar: "حي الجامعة",     en: "University District" },
    { ar: "السكة الجديدة",  en: "New Railway" },
    { ar: "جزيرة الورد",    en: "Rose Island" },
    { ar: "ميت حدر",        en: "Mit Hadr" },
    { ar: "محلة دمنة",      en: "Mahallet Damna" },
  ],
  "mit-ghamr": [
    { ar: "وسط ميت غمر",   en: "Mit Ghamr Center" },
    { ar: "الزنكلون",       en: "Zankalon" },
    { ar: "ميت طريف",       en: "Mit Tarif" },
    { ar: "كفر الجرايدة",   en: "Kafr El-Garayda" },
  ],
  belqas: [
    { ar: "وسط بلقاس",      en: "Belqas Center" },
    { ar: "كفر بلقاس",      en: "Kafr Belqas" },
    { ar: "البصارطة",       en: "El-Basarta" },
    { ar: "شابور",          en: "Shabour" },
  ],
  dikirnis: [
    { ar: "وسط دكرنس",      en: "Dikirnis Center" },
    { ar: "ميت العامل",     en: "Mit El-Amel" },
    { ar: "محلة حسن",       en: "Mahallet Hassan" },
  ],
  sherbin: [
    { ar: "وسط شربين",      en: "Sherbin Center" },
    { ar: "كفر الفقهاء",    en: "Kafr El-Fuqaha" },
    { ar: "محلة قيل",       en: "Mahallet Qeel" },
  ],
  aga: [
    { ar: "وسط أجا",        en: "Aga Center" },
    { ar: "كفر العرب",      en: "Kafr El-Arab" },
    { ar: "ميت بدر حلاوة", en: "Mit Badr Halawa" },
  ],
  sinbillawayn: [
    { ar: "وسط السنبلاوين", en: "Sinbillawayn Center" },
    { ar: "ميت غراب",       en: "Mit Ghorab" },
    { ar: "نوسا الغيط",     en: "Nawasa El-Gheit" },
  ],
  matareya: [
    { ar: "وسط المطرية",    en: "Matareya Center" },
    { ar: "السرو",          en: "El-Saro" },
    { ar: "كفر البدماص",    en: "Kafr El-Badamas" },
  ],
  talkha: [
    { ar: "وسط طلخا",       en: "Talkha Center" },
    { ar: "ميت العز",        en: "Mit El-Ezz" },
    { ar: "كفر الباز",       en: "Kafr El-Baz" },
  ],
  nabaroh: [
    { ar: "وسط نبروه",       en: "Nabaroh Center" },
    { ar: "محلة الأمير",     en: "Mahallet El-Amir" },
  ],
  gamalia: [
    { ar: "وسط الجمالية",    en: "Gamalia Center" },
    { ar: "كفر سعد",         en: "Kafr Saad" },
  ],
  "mit-salsil": [
    { ar: "وسط ميت سلسيل",   en: "Mit Salsil Center" },
    { ar: "البراشية",        en: "El-Barashia" },
  ],
  "bani-ubaid": [
    { ar: "وسط بني عبيد",    en: "Bani Ubaid Center" },
    { ar: "كفر شلشلمون",     en: "Kafr Shalshalmoun" },
  ],
  manzala: [
    { ar: "وسط المنزلة",      en: "Manzala Center" },
    { ar: "العدلية",          en: "El-Adlia" },
    { ar: "البشاتية",         en: "El-Bashatia" },
  ],
};

/** Find a city slug by Arabic or English label (case-insensitive). */
export const cityToSlug = (label: string): string | null => {
  if (!label) return null;
  const v = label.trim().toLowerCase();
  const hit = DAKAHLIA_CITIES.find(
    (c) => c.slug === v || c.ar === label.trim() || c.en.toLowerCase() === v,
  );
  return hit?.slug ?? null;
};