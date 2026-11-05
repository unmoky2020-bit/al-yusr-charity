import foodBoxImg    from "@/assets/program-food-new.jpg";
import orphansImg    from "@/assets/program-orphans.jpg";
import healthImg     from "@/assets/program-health.webp";
import shelterImg    from "@/assets/brand-poster-frame.jpg";
import waterImg      from "@/assets/program-water-new.jpg";
import waqfFarmImg   from "@/assets/farm-hero.jpg";
import mosquesImg    from "@/assets/brand-poster-frame.jpg";
import takrimImg     from "@/assets/takrim-van.jpg";
import markounImg    from "@/assets/markoun-furniture.webp";
import odhyaImg      from "@/assets/poster-odhya.webp";
import educationImg  from "@/assets/poster-education.png";
import ramadanImg    from "@/assets/yusr-ramadan-box.png";

export type EntityType = "program" | "project" | "campaign";
export type DonationType = "cash" | "in_kind" | "both";

export type DonationShare = {
  id: string;
  nameAr: string;
  nameEn: string;
  price: number; // EGP
  /** Backend package id (donation_packages[].id) — sent as donation_package_id for program packages. */
  apiId?: number;
  descAr?: string;
  descEn?: string;
  popular?: boolean;
};

export type LinkedCase = {
  id: string;
  /** Backend case id — the donation target when the donor picks this case. */
  apiId?: number;
  refCode: string;
  titleAr: string;
  titleEn: string;
  beneficiaryName: string;
  governorate: string;
  city?: string;
  neededAmount: number;
  raisedAmount: number;
  urgent?: boolean;
  storyAr?: string;
};

export type DonationEntity = {
  id: string;         // unique slug
  /** Backend record id + slug (programs / projects / donation-campaigns). Absent on static fallback items. */
  apiId?: number;
  slug?: string;
  ar: string;
  en: string;
  taglineAr: string;
  taglineEn: string;
  image: string;
  entityType: EntityType;
  donationType: DonationType;
  categoryAr: string;
  categoryEn: string;
  priceFrom: number;
  color?: string;
  shares: DonationShare[];
  cases: LinkedCase[];
  isMarkoun?: boolean;
  isSeasonal?: boolean;  // رمضان / أضاحي / مواسم خاصة
};


export const DONATION_ENTITIES: DonationEntity[] = [

  // ═══════════════════════════════════════════════════════════════════
  // ① البرامج المستمرة — Programs (year-round)
  // ═══════════════════════════════════════════════════════════════════

  // 1. تبرع عام
  {
    id: "general",
    ar: "تبرع عام",
    en: "General Donation",
    taglineAr: "صدقة عامة تُوجَّه إلى الحالات الأشد احتياجًا والأكثر إلحاحًا",
    taglineEn: "General charity directed to the most urgent needs",
    image: foodBoxImg,
    entityType: "program",
    donationType: "cash",
    categoryAr: "صدقة عامة",
    categoryEn: "General Charity",
    priceFrom: 50,
    color: "#10b981",
    shares: [
      { id: "gen-50",  nameAr: "سهم صدقة عامة 50 ج",  nameEn: "50 EGP Share",  price: 50 },
      { id: "gen-100", nameAr: "سهم صدقة عامة 100 ج", nameEn: "100 EGP Share", price: 100, popular: true },
      { id: "gen-250", nameAr: "سهم صدقة عامة 250 ج", nameEn: "250 EGP Share", price: 250 },
      { id: "gen-500", nameAr: "سهم بركة عامة 500 ج",  nameEn: "500 EGP Share", price: 500 },
    ],
    cases: [
      {
        id: "case-gen-1",
        refCode: "CAS-GEN-001",
        titleAr: "إغاثة طارئة لأسرة احترق منزلها بميت غمر",
        titleEn: "Emergency relief for a family affected by house fire in Mit Ghamr",
        beneficiaryName: "أسرة عم محمود (6 أفراد)",
        governorate: "الدقهلية",
        city: "ميت غمر",
        neededAmount: 12000,
        raisedAmount: 7500,
        urgent: true,
      },
      {
        id: "case-gen-2",
        refCode: "CAS-GEN-002",
        titleAr: "سلة غذائية ودواء شهري لمسنة وحيدة بالمنصورة",
        titleEn: "Food basket & monthly medication for an elderly woman in Mansoura",
        beneficiaryName: "الحاجة فاطمة (مسنة وحيدة)",
        governorate: "الدقهلية",
        city: "المنصورة",
        neededAmount: 3000,
        raisedAmount: 1800,
      },
    ],
  },

  // 2. إنقاذ — حالات الطوارئ العاجلة (NEW)
  {
    id: "inqadh",
    ar: "إنقاذ — حالات الطوارئ العاجلة",
    en: "Inqadh — Emergency Relief",
    taglineAr: "استجابة فورية للحالات الإنسانية العاجلة التي لا تحتمل التأخير",
    taglineEn: "Immediate response for urgent humanitarian cases that cannot wait",
    image: healthImg,
    entityType: "program",
    donationType: "cash",
    categoryAr: "إغاثة عاجلة",
    categoryEn: "Emergency Aid",
    priceFrom: 100,
    color: "#ef4444",
    shares: [
      { id: "inq-100",  nameAr: "سهم إغاثة عاجلة 100 ج",                nameEn: "Emergency Share 100 EGP",     price: 100 },
      { id: "inq-500",  nameAr: "سهم إنقاذ حالة ميدانية (500 ج)",       nameEn: "Field Case Rescue Share",     price: 500, popular: true },
      { id: "inq-2000", nameAr: "كفالة حالة طوارئ طبية كاملة (2000 ج)", nameEn: "Full Medical Emergency Pack", price: 2000 },
      { id: "inq-5000", nameAr: "سهم تمويل حملة إغاثة ميدانية",          nameEn: "Field Relief Campaign Share", price: 5000 },
    ],
    cases: [
      {
        id: "case-inq-1",
        refCode: "CAS-INQ-001",
        titleAr: "عملية قلب مفتوح وقسطرة عاجلة لطفل عمره 3 سنوات",
        titleEn: "Urgent pediatric open-heart surgery for a 3-year-old",
        beneficiaryName: "الطفل أحمد سامي",
        governorate: "الدقهلية",
        city: "ميت غمر",
        neededAmount: 22000,
        raisedAmount: 14500,
        urgent: true,
      },
      {
        id: "case-inq-2",
        refCode: "CAS-INQ-002",
        titleAr: "إغاثة طارئة لأسرة فقدت منزلها إثر فيضانات محلية بالدقهلية",
        titleEn: "Emergency aid for a family displaced by local flooding in Dakahlia",
        beneficiaryName: "أسرة عم حسن (7 أفراد)",
        governorate: "الدقهلية",
        city: "المنزلة",
        neededAmount: 15000,
        raisedAmount: 7000,
        urgent: true,
      },
      {
        id: "case-inq-3",
        refCode: "CAS-INQ-003",
        titleAr: "توفير علاج شهري لربة منزل مصابة بمرض مزمن خطير",
        titleEn: "Monthly treatment for a chronically ill housewife",
        beneficiaryName: "الحاجة سعاد م.",
        governorate: "الدقهلية",
        city: "السنبلاوين",
        neededAmount: 4200,
        raisedAmount: 2800,
        urgent: true,
      },
    ],
  },

  // 3. كفالة الأيتام
  {
    id: "orphans",
    ar: "كفالة الأيتام",
    en: "Orphan Sponsorship",
    taglineAr: "كن رفيق النبي ﷺ في الجنة بكفالة يتيم شاملة غذاءً ودراسةً",
    taglineEn: "Companion of the Prophet in Jannah through complete orphan care",
    image: orphansImg,
    entityType: "program",
    donationType: "cash",
    categoryAr: "رعاية وتكافل",
    categoryEn: "Orphan Care",
    priceFrom: 150,
    color: "#3b82f6",
    shares: [
      { id: "orph-part",    nameAr: "سهم مساهمة في كفالة يتيم (150 ج)",          nameEn: "Partial Sponsorship Share",  price: 150 },
      { id: "orph-full",    nameAr: "كفالة يتيم شهرية شاملة (غذاء ودراسة)", nameEn: "Full Monthly Sponsorship",   price: 600, popular: true },
      { id: "orph-clothes", nameAr: "سهم كسوة وحقيبة مدرسية ليتيم",          nameEn: "School Bag & Uniform Share", price: 300 },
      { id: "orph-annual",  nameAr: "كفالة يتيم سنوية متكاملة",               nameEn: "Annual Full Sponsorship",    price: 7200 },
    ],
    cases: [
      {
        id: "case-orph-1",
        refCode: "CAS-ORP-201",
        titleAr: "كفالة الطفلين الشقيقين كريم ورنا بعد وفاة والدهما",
        titleEn: "Sponsorship for siblings Karim & Rana after losing their father",
        beneficiaryName: "كريم (8 سنوات) ورنا (6 سنوات)",
        governorate: "الدقهلية",
        city: "بلقاس",
        neededAmount: 7200,
        raisedAmount: 4200,
        urgent: true,
      },
      {
        id: "case-orph-2",
        refCode: "CAS-ORP-202",
        titleAr: "دعم تعليمي ومصاريف مدرسية ليتيم متفوق بالمرحلة الإعدادية",
        titleEn: "Educational support for a high-achieving orphan in middle school",
        beneficiaryName: "يوسف م. (المرحلة الإعدادية)",
        governorate: "الدقهلية",
        city: "شربين",
        neededAmount: 3500,
        raisedAmount: 1800,
      },
      {
        id: "case-orph-3",
        refCode: "CAS-ORP-203",
        titleAr: "كفالة شهرية لأسرة أيتام (أم وثلاثة أطفال) بعد وفاة العائل",
        titleEn: "Monthly sponsorship for a widowed mother and her 3 children",
        beneficiaryName: "أم علي (تعول 3 أطفال)",
        governorate: "الدقهلية",
        city: "أجا",
        neededAmount: 7200,
        raisedAmount: 3600,
        urgent: true,
      },
    ],
  },

  // 4. كفالة شهرية — للأسر والمحتاجين (NEW)
  {
    id: "monthly-sponsorship",
    ar: "كفالة شهرية — رعاية أسرية مستدامة",
    en: "Monthly Sponsorship — Sustainable Family Care",
    taglineAr: "كفالة منتظمة توفر للأسر المحتاجة الغذاء والدواء والستر كل شهر",
    taglineEn: "Regular monthly support covering food, medicine and essentials for needy families",
    image: foodBoxImg,
    entityType: "program",
    donationType: "cash",
    categoryAr: "كفالة شهرية",
    categoryEn: "Monthly Sponsorship",
    priceFrom: 200,
    color: "#0ea5e9",
    shares: [
      { id: "msp-200",  nameAr: "سهم مساهمة شهرية (200 ج)",          nameEn: "Monthly Share (200 EGP)",        price: 200 },
      { id: "msp-500",  nameAr: "كفالة فرد محتاج شهريًا (500 ج)",    nameEn: "Single Person Monthly Care",     price: 500, popular: true },
      { id: "msp-1000", nameAr: "كفالة أسرة صغيرة شهريًا (1000 ج)",  nameEn: "Small Family Monthly Care",      price: 1000 },
      { id: "msp-2000", nameAr: "كفالة شهرية متكاملة لأسرة كبيرة",    nameEn: "Full Large Family Monthly Care", price: 2000 },
    ],
    cases: [
      {
        id: "case-msp-1",
        refCode: "CAS-MSP-001",
        titleAr: "كفالة شهرية لأرملة تعول 5 أطفال بقرية دنجواي",
        titleEn: "Monthly sponsorship for a widow raising 5 children in Danjawy village",
        beneficiaryName: "أم خالد (أرملة تعول 5 أطفال)",
        governorate: "الدقهلية",
        city: "شربين",
        neededAmount: 12000,
        raisedAmount: 5000,
        urgent: true,
      },
      {
        id: "case-msp-2",
        refCode: "CAS-MSP-002",
        titleAr: "دعم شهري لمسن مقعد لا عائل له في دكرنس",
        titleEn: "Monthly support for a bedridden elderly man with no family",
        beneficiaryName: "الحاج عبد الحميد (مُقعَد يعيش وحيدًا)",
        governorate: "الدقهلية",
        city: "دكرنس",
        neededAmount: 4800,
        raisedAmount: 2400,
      },
    ],
  },

  // 5. إعمار مساجد
  {
    id: "mosques",
    ar: "إعمار مساجد — بناء بيوت الله",
    en: "Mosque Building & Renovation",
    taglineAr: "من بنى لله مسجداً بنى الله له بيتاً في الجنة",
    taglineEn: "Whoever builds a mosque for Allah, Allah builds a home for them in Jannah",
    image: mosquesImg,
    entityType: "program",
    donationType: "cash",
    categoryAr: "بيوت الله",
    categoryEn: "Mosques",
    priceFrom: 250,
    color: "#6366f1",
    shares: [
      { id: "msq-carpet",  nameAr: "سهم فرش وسجاد مسجد (متر واحد)",   nameEn: "Mosque Carpet Share (1 Meter)", price: 250, popular: true },
      { id: "msq-cement",  nameAr: "سهم مواد بناء وأسمنت (طن)",       nameEn: "Cement & Building Materials",   price: 500 },
      { id: "msq-meter",   nameAr: "سهم متر مربع إنشائي في المسجد",   nameEn: "1 Sq Meter Construction Share", price: 1000 },
      { id: "msq-minaret", nameAr: "سهم إعمار مئذنة ومصلى نساء",     nameEn: "Minaret & Prayer Hall Share",   price: 2500 },
    ],
    cases: [
      {
        id: "case-msq-1",
        refCode: "PRJ-MSQ-701",
        titleAr: "استكمال صبّ سقف مسجد التوحيد وعزله بمدينة بلقس",
        titleEn: "Roof completion and insulation for Al-Tawheed Mosque in Bilqas",
        beneficiaryName: "أهالي مدينة بلقس",
        governorate: "الدقهلية",
        city: "بلقس",
        neededAmount: 45000,
        raisedAmount: 28000,
        urgent: true,
      },
      {
        id: "case-msq-2",
        refCode: "PRJ-MSQ-702",
        titleAr: "تجديد دورات المياه والميضأة بمسجد الإيمان بكفر غنام",
        titleEn: "Ablution & restroom renovation at Al-Iman Mosque, Kafr Ghanam",
        beneficiaryName: "أهالي قرية كفر غنام",
        governorate: "الدقهلية",
        city: "السنبلاوين",
        neededAmount: 18500,
        raisedAmount: 9200,
      },
      {
        id: "case-msq-3",
        refCode: "PRJ-MSQ-703",
        titleAr: "بناء مسجد جديد يخدم 3000 نسمة في قرية لا مسجد فيها بمركز شربين",
        titleEn: "New mosque construction for a village of 3000 with no place of worship",
        beneficiaryName: "أهالي عزبة عم رجب",
        governorate: "الدقهلية",
        city: "شربين",
        neededAmount: 180000,
        raisedAmount: 62000,
        urgent: true,
      },
    ],
  },

  // 6. وصلة المياة
  {
    id: "water",
    ar: "وصلة المياه — مياه نقية لكل بيت",
    en: "Clean Water Connections",
    taglineAr: "أفضل الصدقة سقي الماء — إيصال المياه النقية لبيوت المحرومين",
    taglineEn: "The best charity is giving water — connecting clean tap water to homes",
    image: waterImg,
    entityType: "program",
    donationType: "cash",
    categoryAr: "سقيا الماء",
    categoryEn: "Clean Water",
    priceFrom: 300,
    color: "#38bdf8",
    shares: [
      { id: "wtr-share",   nameAr: "سهم مساهمة في تكلفة وصلة مياه",                   nameEn: "Water Connection Share",        price: 300 },
      { id: "wtr-meter",   nameAr: "سهم رسوم عداد المياه الرسمي والمواسير",            nameEn: "Official Water Meter Share",     price: 1000 },
      { id: "wtr-full",    nameAr: "وصلة مياه منزلية كاملة شاملة العداد والتركيب",     nameEn: "Full Home Tap Water Connection", price: 3500, popular: true },
      { id: "wtr-station", nameAr: "سهم في محطة معالجة وتنقية مياه لقرية",                nameEn: "Village Water Filtration Unit",  price: 1500 },
    ],
    cases: [
      {
        id: "case-wtr-1",
        refCode: "PRJ-WTR-111",
        titleAr: "توصيل مياه صالحة للشرب لأسرة عائلها مريض بالكلى بقرية دنجواي",
        titleEn: "Clean drinking water connection for a kidney patient family",
        beneficiaryName: "أسرة عم إسماعيل (عاجز عن العمل)",
        governorate: "الدقهلية",
        city: "شربين",
        neededAmount: 3500,
        raisedAmount: 2200,
        urgent: true,
      },
      {
        id: "case-wtr-2",
        refCode: "PRJ-WTR-112",
        titleAr: "مد خط مياه رئيسي لـ 12 منزلًا محرومًا من الشبكة بمنطقة الحفير",
        titleEn: "Main water pipe extension to 12 unconnected homes in Al-Hafeer",
        beneficiaryName: "أهالي منطقة الحفير",
        governorate: "الدقهلية",
        city: "بلقاس",
        neededAmount: 25000,
        raisedAmount: 14000,
        urgent: true,
      },
    ],
  },

  // 7. ذبائح شهرية (NEW)
  {
    id: "monthly-meat",
    ar: "ذبائح شهرية — لحوم طازجة لكل أسرة",
    en: "Monthly Meat Distribution",
    taglineAr: "توزيع لحوم طازجة شهريًا للأسر المحتاجة التي لا تقدر على شراء اللحم",
    taglineEn: "Monthly fresh meat distribution for families who cannot afford meat",
    image: foodBoxImg,
    entityType: "program",
    donationType: "cash",
    categoryAr: "إطعام وغذاء",
    categoryEn: "Food & Nutrition",
    priceFrom: 200,
    color: "#f97316",
    shares: [
      { id: "mmt-kilo",    nameAr: "سهم كيلو لحم طازج لأسرة محتاجة",  nameEn: "1 Kg Fresh Meat Share",     price: 200 },
      { id: "mmt-family",  nameAr: "سهم لحوم لأسرة كاملة (3 كيلو)",   nameEn: "Family Meat Pack (3 Kg)",   price: 600, popular: true },
      { id: "mmt-village", nameAr: "باقة لحوم لـ 10 أسر قروية",       nameEn: "10 Family Meat Package",    price: 2000 },
      { id: "mmt-month",   nameAr: "تمويل توزيع ذبائح شهري كامل",     nameEn: "Full Monthly Distribution", price: 10000 },
    ],
    cases: [
      {
        id: "case-mmt-1",
        refCode: "CAS-MMT-001",
        titleAr: "توزيع لحوم شهرية لـ 50 أسرة فقيرة بقرى مركز شربين",
        titleEn: "Monthly meat distribution for 50 poor families in Sherbin district",
        beneficiaryName: "أسر قرى مركز شربين",
        governorate: "الدقهلية",
        city: "شربين",
        neededAmount: 10000,
        raisedAmount: 4500,
        urgent: true,
      },
      {
        id: "case-mmt-2",
        refCode: "CAS-MMT-002",
        titleAr: "كرتونة لحوم وبروتين شهرية لـ 30 مسنًا وأرملة بالمنصورة",
        titleEn: "Monthly meat parcels for 30 elderly and widows in Mansoura",
        beneficiaryName: "مسنون وأرامل بالمنصورة",
        governorate: "الدقهلية",
        city: "المنصورة",
        neededAmount: 6000,
        raisedAmount: 3200,
      },
    ],
  },

  // 8. تحفيظ القرآن الكريم (NEW)
  {
    id: "quran",
    ar: "تحفيظ القرآن الكريم",
    en: "Quran Memorization Centers",
    taglineAr: "رعاية حلقات التحفيظ ودعم المعلمين والطلاب لحفظ كتاب الله",
    taglineEn: "Supporting Quran memorization circles, teachers and students",
    image: educationImg,
    entityType: "program",
    donationType: "cash",
    categoryAr: "تعليم قرآني",
    categoryEn: "Quran Education",
    priceFrom: 100,
    color: "#8b5cf6",
    shares: [
      { id: "qrn-student", nameAr: "سهم دعم طالب في حفظ القرآن (100 ج)",       nameEn: "Quran Student Support Share",  price: 100 },
      { id: "qrn-teacher", nameAr: "سهم راتب معلم تحفيظ شهري (500 ج)",    nameEn: "Quran Teacher Monthly Salary", price: 500, popular: true },
      { id: "qrn-circle",  nameAr: "سهم تجهيز حلقة تحفيظ (أثاث + ألواح)", nameEn: "Memorization Circle Setup",    price: 1500 },
      { id: "qrn-center",  nameAr: "رعاية مركز تحفيظ كامل لمدة شهر",     nameEn: "Full Center Monthly Patronage",price: 5000 },
    ],
    cases: [
      {
        id: "case-qrn-1",
        refCode: "CAS-QRN-001",
        titleAr: "رعاية حلقة تحفيظ قرآن لـ 40 طفلًا بقرية كفر الشيخ إبراهيم",
        titleEn: "Supporting a Quran circle for 40 children in Kafr Al-Sheikh Ibrahim",
        beneficiaryName: "أطفال قرية كفر الشيخ إبراهيم",
        governorate: "الدقهلية",
        city: "السنبلاوين",
        neededAmount: 6000,
        raisedAmount: 2800,
        urgent: true,
      },
      {
        id: "case-qrn-2",
        refCode: "CAS-QRN-002",
        titleAr: "تجهيز غرفة حلقات التحفيظ بمسجد النور بمنية النصر",
        titleEn: "Furnishing a Quran memorization room at Al-Nour Mosque",
        beneficiaryName: "أهالي منية النصر",
        governorate: "الدقهلية",
        city: "منية النصر",
        neededAmount: 8500,
        raisedAmount: 4100,
      },
    ],
  },

  // 9. سيارات تكريم الإنسان
  {
    id: "takrim",
    ar: "سيارات تكريم الإنسان",
    en: "Takrim Mortuary Vans",
    taglineAr: "غسل وتكفين ونقل الموتى مجانًا لكل الناس دون استثناء",
    taglineEn: "Free washing, shrouding and funeral transport for everyone, without exception",
    image: takrimImg,
    entityType: "program",
    donationType: "cash",
    categoryAr: "خدمة مجتمعية",
    categoryEn: "Community Service",
    priceFrom: 500,
    color: "#64748b",
    shares: [
      { id: "tkr-shroud", nameAr: "كفن شرعي", nameEn: "An Islamic shroud", price: 500 },
      { id: "tkr-running", nameAr: "مصاريف تشغيل السيارة (وقود وصيانة)", nameEn: "Van running costs (fuel & maintenance)", price: 1000 },
      { id: "tkr-washer", nameAr: "مصاريف المغسّل والمكفّن", nameEn: "Washer & shrouder costs", price: 500 },
      { id: "tkr-new-car", nameAr: "مساهمة في شراء سيارة جديدة", nameEn: "Contribution to a new van", price: 10000 },
    ],
    cases: [
      {
        id: "case-tkr-1",
        refCode: "PRJ-TKR-001",
        titleAr: "تغطية نفقات نقل جثمان وتجهيز شرعي كامل من مستشفى الطوارئ",
        titleEn: "Mortuary transport & full Islamic burial kit from the emergency hospital",
        beneficiaryName: "أسرة متوفى بمستشفى الطوارئ بالمنصورة",
        governorate: "الدقهلية",
        city: "المنصورة",
        neededAmount: 2500,
        raisedAmount: 1800,
        urgent: true,
      },
      {
        id: "case-tkr-2",
        refCode: "PRJ-TKR-002",
        titleAr: "صيانة سيارة التكريم وتغيير إطاراتها لضمان جاهزيتها على مدار 24 ساعة",
        titleEn: "Van maintenance & tires to ensure 24/7 readiness across governorate",
        beneficiaryName: "سيارة تكريم الإنسان رقم 1",
        governorate: "الدقهلية",
        city: "طلخا",
        neededAmount: 6000,
        raisedAmount: 3500,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // ② المشاريع التنموية — Projects
  // ═══════════════════════════════════════════════════════════════════

  // 10. المزرعة الوقفية
  {
    id: "waqf",
    ar: "المزرعة الوقفية — وقف إنتاجي",
    en: "Waqf Farm — Productive Endowment",
    taglineAr: "صدقة جارية مستدامة تدر أثرًا وتمويلًا خيريًا دائمًا",
    taglineEn: "Sustainable productive endowment generating perpetual charity",
    image: waqfFarmImg,
    entityType: "project",
    donationType: "cash",
    categoryAr: "وقف إنتاجي",
    categoryEn: "Productive Waqf",
    priceFrom: 500,
    color: "#84cc16",
    shares: [
      { id: "wqf-palm",   nameAr: "سهم نخلة مثمرة صدقة جارية",                 nameEn: "Productive Date Palm Share",    price: 500, popular: true },
      { id: "wqf-irr",    nameAr: "سهم شبكة ري حديثة بالطاقة الشمسية",        nameEn: "Modern Solar Irrigation Share", price: 1000 },
      { id: "wqf-feddan", nameAr: "سهم استصلاح وزراعة ربع فدان وقفي",         nameEn: "Quarter Feddan Reclamation",    price: 2500 },
    ],
    cases: [
      {
        id: "case-wqf-1",
        refCode: "PRJ-WQF-801",
        titleAr: "حفر بئر ارتوازي وتثبيت مضخة طاقة شمسية لمزرعة الوقف",
        titleEn: "Solar-powered well drilling for Al-Yusr Endowment Farm",
        beneficiaryName: "مشروع الوقف الإنتاجي لمؤسسة اليسر",
        governorate: "الدقهلية",
        city: "حزام الحفير",
        neededAmount: 60000,
        raisedAmount: 38000,
        urgent: true,
      },
    ],
  },

  // 11. مجمع اليسر الطبي بالحفير
  {
    id: "medical",
    ar: "مجمع اليسر الطبي بالحفير",
    en: "Al-Yusr Medical Complex, El-Hafir",
    taglineAr: "مجمع طبي يخدم 43 قرية بين الدقهلية وكفر الشيخ",
    taglineEn: "A medical complex serving 43 villages between Dakahlia and Kafr El-Sheikh",
    image: healthImg,
    entityType: "project",
    donationType: "cash",
    categoryAr: "رعاية صحية",
    categoryEn: "Healthcare",
    priceFrom: 80,
    color: "#10b981",
    shares: [
      { id: "mc-checkup",      nameAr: "ادفع كشف مريض",                   nameEn: "Pay for a patient's check-up",                 price: 80, popular: true },
      { id: "mc-prescription", nameAr: "صرف روشتة مريض",                  nameEn: "A patient's prescription",                     price: 500 },
      { id: "mc-equip",        nameAr: "شراء جهاز طبي أو تجهيزات للمبنى", nameEn: "A medical device or equipment for the building", price: 1000 },
      { id: "mc-surgery",      nameAr: "المساهمة في عملية جراحية",        nameEn: "Contribute to a surgery",                      price: 1000 },
    ],
    cases: [
      {
        id: "case-med-2",
        refCode: "CAS-MED-502",
        titleAr: "قافلة طبية مجانية لـ 200 مريض بقرى نائية بالدقهلية",
        titleEn: "Free medical convoy serving 200 patients in remote Dakahlia villages",
        beneficiaryName: "أهالي القرى النائية بالدقهلية",
        governorate: "الدقهلية",
        city: "المنصورة",
        neededAmount: 15000,
        raisedAmount: 8500,
        urgent: true,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // ③ الحملات المستمرة — Campaigns (year-round, activity-based)
  // ═══════════════════════════════════════════════════════════════════

  // 12. مركون — تبرعات عينية
  {
    id: "markoun",
    ar: "حملة مَرْكُون — كنزك المركون حياة لغيرك",
    en: "Markoun — In-Kind Donation Campaign",
    taglineAr: "تبرع بأثاثك وأجهزتك القديمة وملابسك وكتبك لنوزعها على المحتاجين",
    taglineEn: "Donate unused furniture, appliances, clothes and books to families in need",
    image: markounImg,
    entityType: "campaign",
    donationType: "both",
    categoryAr: "تبرع عيني ونقدي",
    categoryEn: "In-Kind & Cash",
    priceFrom: 100,
    color: "#10b981",
    isMarkoun: true,
    shares: [
      {
        id: "mrk-furniture",
        nameAr: "سهم أثاث منزلي (نقل وصيانة وتأثيث منازل الأسر المستحقة)",
        nameEn: "Home Furniture Share (Pickup, Refurbish & Deliver)",
        price: 250,
        popular: true,
        descAr: "تأثيث غرف المعيشة والنوم للأسر الأكثر احتياجًا بأثاث مجدَّد ولائق",
      },
      {
        id: "mrk-appliances",
        nameAr: "سهم أجهزة كهربائية (ثلاجة، غسالة، بوتاجاز)",
        nameEn: "Home Electrical Appliances Share",
        price: 200,
        popular: true,
        descAr: "صيانة وتجهيز أجهزة كهربائية مركونة للتوزيع على غير القادرين",
      },
      {
        id: "mrk-clothes",
        nameAr: "سهم ملابس (فرز وغسيل وتوزيع كسوة للأسر والأيتام)",
        nameEn: "Clothing Collection & Distribution Share",
        price: 150,
        descAr: "فرز وتغليف وتوزيع ملابس صالحة للأطفال والأسر المتعففة",
      },
      {
        id: "mrk-books",
        nameAr: "سهم كتب ومستلزمات دراسية للأطفال والطلاب",
        nameEn: "Books & Study Material Share",
        price: 100,
        descAr: "جمع وإعادة توزيع الكتب المدرسية والجامعية للطلاب المحتاجين",
      },
      {
        id: "mrk-scrap",
        nameAr: "سهم خردة ومعادن (إعادة تدوير لصالح الأسر المحتاجة)",
        nameEn: "Recyclable Scrap Share",
        price: 100,
        descAr: "جمع الخردة وإعادة بيعها وتدويرها لتمويل مشاريع الخير للأسر",
      },
      {
        id: "mrk-medicine",
        nameAr: "سهم أدوية ومستلزمات طبية فائضة صالحة",
        nameEn: "Unused Prescriptions & Medical Supplies Share",
        price: 100,
        descAr: "فحص الأدوية طبيًا للتأكد من صلاحيتها، ثم صرفها للمرضى غير القادرين",
      },
    ],
    cases: [
      {
        id: "case-mrk-1",
        refCode: "CMP-MRK-01",
        titleAr: "تأثيث منزل أسرة احترق بالكامل بأثاث وأجهزة مجدَّدة من مركون",
        titleEn: "Furnishing a fire-damaged house with refurbished Markoun furniture",
        beneficiaryName: "أسرة الحاج فوزي (حريق منزل)",
        governorate: "الدقهلية",
        city: "أجا",
        neededAmount: 9000,
        raisedAmount: 5500,
        urgent: true,
      },
      {
        id: "case-mrk-2",
        refCode: "CMP-MRK-02",
        titleAr: "توزيع ملابس من مركون على 120 طفلًا من أيتام القرى",
        titleEn: "Distributing Markoun clothes to 120 orphaned village children",
        beneficiaryName: "أطفال القرى الأكثر احتياجًا",
        governorate: "الدقهلية",
        city: "السنبلاوين",
        neededAmount: 5000,
        raisedAmount: 3800,
      },
    ],
  },

  // 13. ظل — بنية تحتية ومياه (RESTRUCTURED from winter warmth)
  {
    id: "dhill",
    ar: "حملة ظل — بنية تحتية ومياه للمحرومين",
    en: "Dhill — Infrastructure & Water Campaign",
    taglineAr: "وصلات مياه وأسقف وخطوط مياه وسقيا ماء وبنية أساسية للأسر المحرومة",
    taglineEn: "Water connections, roofing, pipe networks and basic infrastructure for deprived families",
    image: waterImg,
    entityType: "campaign",
    donationType: "cash",
    categoryAr: "حملة بنية تحتية",
    categoryEn: "Infrastructure Campaign",
    priceFrom: 300,
    color: "#0284c7",
    shares: [
      {
        id: "dhl-water-conn",
        nameAr: "سهم وصلات مياه (توصيل شبكة مياه وعداد لكل بيت)",
        nameEn: "Home Water Connection Share",
        price: 3500,
        popular: true,
        descAr: "تكلفة توصيل شبكة المياه من الخط الرئيسي إلى المنزل مع العداد",
      },
      {
        id: "dhl-roof",
        nameAr: "سهم أسقف منازل (إصلاح وعزل سقف منزل كامل)",
        nameEn: "Home Roof Repair Share",
        price: 4500,
        popular: true,
        descAr: "إصلاح الأسقف المتهالكة التي لا تقي من مياه الأمطار ولا من الحر الشديد",
      },
      {
        id: "dhl-pipe",
        nameAr: "سهم خطوط مياه (مد شبكات مواسير للقرى المحرومة)",
        nameEn: "Main Water Pipe Extension Share",
        price: 500,
        descAr: "تمويل مد مواسير المياه في القرى والنجوع البعيدة عن الشبكة",
      },
      {
        id: "dhl-suqya",
        nameAr: "سهم سقيا ماء (توفير مياه شرب نقية ومبردات للقرى)",
        nameEn: "Suqya Water Provision Share",
        price: 300,
        descAr: "توفير خزانات ومبردات ومياه نقية للأماكن الأشد عطشًا",
      },
      {
        id: "dhl-door",
        nameAr: "سهم بنية أساسية (باب وشباك حديد لحماية المنزل)",
        nameEn: "Basic Infrastructure (Door & Window) Share",
        price: 1500,
        descAr: "تركيب أبواب وشبابيك حديد متينة لمنازل بلا أي حماية",
      },
      {
        id: "dhl-vent",
        nameAr: "سهم وسائل تهوية (مراوح وشبابيك تهوية صحية)",
        nameEn: "Home Ventilation Share",
        price: 800,
        descAr: "تركيب مراوح وشبابيك تهوية للمنازل الرطبة والمغلقة",
      },
    ],
    cases: [
      {
        id: "case-dhl-1",
        refCode: "CMP-DHL-201",
        titleAr: "مد خط مياه رئيسي لـ 8 منازل محرومة من الشبكة بقرية الحفير",
        titleEn: "Main water line extension to 8 unconnected homes in Al-Hafeer village",
        beneficiaryName: "أهالي قرية الحفير",
        governorate: "الدقهلية",
        city: "بلقاس",
        neededAmount: 18000,
        raisedAmount: 9000,
        urgent: true,
      },
      {
        id: "case-dhl-2",
        refCode: "CMP-DHL-202",
        titleAr: "إصلاح سقف 3 منازل متهالكة تسقط فيها الأمطار على النائمين",
        titleEn: "Roof repair for 3 deteriorating homes where rain falls on sleeping families",
        beneficiaryName: "أسر قرية كفر الترعة",
        governorate: "الدقهلية",
        city: "شربين",
        neededAmount: 15000,
        raisedAmount: 6500,
        urgent: true,
      },
      {
        id: "case-dhl-3",
        refCode: "CMP-DHL-203",
        titleAr: "تركيب أبواب وشبابيك لـ 5 منازل طينية بلا حماية بمركز أجا",
        titleEn: "Installing doors & windows for 5 mud homes with no protection in Aga",
        beneficiaryName: "أسر بمركز أجا",
        governorate: "الدقهلية",
        city: "أجا",
        neededAmount: 9500,
        raisedAmount: 4200,
      },
    ],
  },

  // 14. ستر — تسقيف وأثاث ومراتب وإيواء (RESTRUCTURED)
  {
    id: "shelter",
    ar: "حملة ستر — تسقيف وأثاث ومراتب وإيواء",
    en: "Sitr — Roofing, Bedding & Shelter Campaign",
    taglineAr: "تسقيف المنازل وتوفير المراتب والألحفة والأثاث المنزلي للأسر الأكثر حرمانًا",
    taglineEn: "Roofing, mattresses, blankets and basic furniture for destitute families",
    image: shelterImg,
    entityType: "campaign",
    donationType: "cash",
    categoryAr: "إيواء ومأوى",
    categoryEn: "Shelter Campaign",
    priceFrom: 200,
    color: "#fbbf24",
    shares: [
      {
        id: "shl-roof",
        nameAr: "سهم تسقيف وإصلاح سقف غرفة كاملة",
        nameEn: "Full Room Roof Repair Share",
        price: 4500,
        popular: true,
        descAr: "صبة أو إصلاح سقف خشبي متهالك مع مواد البناء",
      },
      {
        id: "shl-mattress",
        nameAr: "سهم مرتبة لأسرة تنام على الأرض",
        nameEn: "Foam Mattress Share",
        price: 350,
        descAr: "مرتبة قطن 120×190 جديدة لأسرة تفترش الأرض",
      },
      {
        id: "shl-blanket",
        nameAr: "سهم لحاف شتوي دافئ مزدوج",
        nameEn: "Double Winter Duvet Share",
        price: 250,
        descAr: "لحاف شتوي لأسرة لا تملك دفئًا في الليالي الباردة",
      },
      {
        id: "shl-furniture",
        nameAr: "سهم أثاث منزلي بسيط (طاولة وكراسي ودولاب)",
        nameEn: "Basic Home Furniture Share",
        price: 1500,
        descAr: "أثاث منزلي بسيط لبيت خالٍ من الأثاث",
      },
      {
        id: "shl-full",
        nameAr: "باقة ستر كاملة (سقف + مرتبتين + لحافين + أثاث أساسي)",
        nameEn: "Complete Sitr Package",
        price: 7500,
        descAr: "الحل الكامل لأسرة بلا مأوى لائق",
      },
    ],
    cases: [
      {
        id: "case-shl-1",
        refCode: "CMP-STR-001",
        titleAr: "تسقيف منزل متهالك مسقوف بالجريد يؤوي أرملة وأطفالها الخمسة",
        titleEn: "Replacing a crumbling mud & reed roof over a widow and her 5 children",
        beneficiaryName: "الحاجة أم السعد وأطفالها",
        governorate: "الدقهلية",
        city: "مركز أجا",
        neededAmount: 14000,
        raisedAmount: 9500,
        urgent: true,
      },
      {
        id: "case-shl-2",
        refCode: "CMP-STR-002",
        titleAr: "توفير مراتب وألحفة لأسرة أيتام تنام على بلاط بارد",
        titleEn: "Mattresses & blankets for an orphan family sleeping on a cold floor",
        beneficiaryName: "أسرة أيتام بقرية ميت عاصم",
        governorate: "الدقهلية",
        city: "منية النصر",
        neededAmount: 4500,
        raisedAmount: 2200,
        urgent: true,
      },
      {
        id: "case-shl-3",
        refCode: "CMP-STR-003",
        titleAr: "تأثيث بيت فقير بأثاث بسيط (طاولة وكراسي ودولاب)",
        titleEn: "Furnishing a poor home with basic furniture",
        beneficiaryName: "أسرة عم رمضان (4 أفراد)",
        governorate: "الدقهلية",
        city: "دكرنس",
        neededAmount: 5000,
        raisedAmount: 2500,
      },
    ],
  },

  // 15. أثر — كفالة تعليمية (renamed from education)
  {
    id: "athar",
    ar: "حملة أثر — كفالة تعليمية للطلاب المحتاجين",
    en: "Athar — Education Sponsorship Campaign",
    taglineAr: "زي مدرسي وحقيبة وأدوات مدرسية ومصروفات دراسية للطلاب غير القادرين",
    taglineEn: "School uniforms, bags, stationery and tuition fees for students in need",
    image: educationImg,
    entityType: "campaign",
    donationType: "cash",
    categoryAr: "تعليم وبناء",
    categoryEn: "Education Support",
    priceFrom: 100,
    color: "#818cf8",
    shares: [
      {
        id: "ath-uniform",
        nameAr: "سهم زي مدرسي وحذاء جديد لطالب",
        nameEn: "School Uniform & Shoes Share",
        price: 350,
        popular: true,
        descAr: "زي مدرسي رسمي وحذاء جديد مع بداية العام الدراسي",
      },
      {
        id: "ath-bag",
        nameAr: "سهم حقيبة مدرسية بالأدوات والكراسات",
        nameEn: "School Bag & Full Stationery Kit",
        price: 250,
        descAr: "حقيبة وكراسات وأقلام ومسطرة وباقي الأدوات",
      },
      {
        id: "ath-tuition",
        nameAr: "سهم مساهمة في المصاريف الدراسية الشهرية",
        nameEn: "Monthly School Tuition Share",
        price: 150,
        descAr: "مساهمة في مصروفات المدرسة لأسرة لا تستطيع دفعها",
      },
      {
        id: "ath-annual",
        nameAr: "كفالة دراسية كاملة لطالب لمدة عام دراسي",
        nameEn: "Full Academic Year Student Sponsorship",
        price: 1500,
        descAr: "المصروفات والكتب والزي والأدوات لطالب واحد لمدة عام كامل",
      },
    ],
    cases: [
      {
        id: "case-ath-1",
        refCode: "CMP-ATH-001",
        titleAr: "سداد مصروفات وكتب لـ 3 أشقاء أيتام مهددين بالحرمان من الامتحانات",
        titleEn: "Tuition & books for 3 orphan siblings facing exam disqualification",
        beneficiaryName: "أبناء المرحوم صابر (ابتدائي وإعدادي)",
        governorate: "الدقهلية",
        city: "دكرنس",
        neededAmount: 4500,
        raisedAmount: 3100,
        urgent: true,
      },
      {
        id: "case-ath-2",
        refCode: "CMP-ATH-002",
        titleAr: "توفير لابتوب تعليمي مجدد لطالب هندسة متفوق من أسرة فقيرة",
        titleEn: "Refurbished educational laptop for a high-achieving engineering student",
        beneficiaryName: "الطالب عمر (هندسة المنصورة)",
        governorate: "الدقهلية",
        city: "المنصورة",
        neededAmount: 7000,
        raisedAmount: 4800,
      },
      {
        id: "case-ath-3",
        refCode: "CMP-ATH-003",
        titleAr: "توزيع 80 حقيبة مدرسية مكتملة لطلاب قرى نائية بالدقهلية",
        titleEn: "Distributing 80 complete school bags to students in remote villages",
        beneficiaryName: "طلاب قرى نائية بالدقهلية",
        governorate: "الدقهلية",
        city: "منية النصر",
        neededAmount: 20000,
        raisedAmount: 12000,
        urgent: true,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // ④ المواسم — Seasonal Campaigns
  // ═══════════════════════════════════════════════════════════════════

  // 16. موسم رمضان — 6 أنشطة رئيسية
  {
    id: "ramadan",
    ar: "موسم رمضان — إفطار وخير وزكاة",
    en: "Ramadan Season — Iftar, Food Baskets & Zakat",
    taglineAr: "من فطّر صائماً كان له مثل أجره — إفطار وكرتونة الخير وزكاة الفطر وتيسير زواج",
    taglineEn: "Whoever feeds a fasting person earns a matching reward — join our Ramadan giving",
    image: ramadanImg,
    entityType: "campaign",
    donationType: "cash",
    categoryAr: "موسم رمضان",
    categoryEn: "Ramadan Season",
    priceFrom: 40,
    color: "#f59e0b",
    isSeasonal: true,
    shares: [
      {
        id: "rmd-iftar",
        nameAr: "حملة إفطار صائم — وجبة إفطار ساخنة",
        nameEn: "Hot Iftar Meal Campaign",
        price: 60,
        popular: true,
        descAr: "وجبة إفطار متكاملة ساخنة لصائم محتاج في رمضان",
      },
      {
        id: "rmd-box",
        nameAr: "كرتونة الخير الرمضانية — سلة غذائية لأسرة",
        nameEn: "Ramadan Food Basket — Family Package",
        price: 400,
        descAr: "كرتونة تموينية: زيت وسكر وأرز ومكرونة وبقوليات لأسرة كاملة",
      },
      {
        id: "rmd-bride",
        nameAr: "تيسير زواج — تجهيز عروس يتيمة",
        nameEn: "Marriage Facilitation — Orphan Bride's Trousseau",
        price: 2500,
        descAr: "مساهمة في شراء أجهزة وأثاث لعروس يتيمة مقبلة على الزواج",
      },
      {
        id: "rmd-meat",
        nameAr: "ذبائح رمضان — لحوم طازجة للأسر الفقيرة",
        nameEn: "Ramadan Sacrificial Meat Share",
        price: 500,
        descAr: "توزيع لحوم طازجة في رمضان للأسر التي لا تستطيع شراء اللحم",
      },
      {
        id: "rmd-zakat-mal",
        nameAr: "زكاة المال — تُصرف في مصارفها الشرعية الثمانية",
        nameEn: "Zakat Al-Mal — Distributed to All 8 Recipients",
        price: 100,
        descAr: "طهِّر مالك، ونحن نصرف زكاتك في مصارفها الشرعية الثمانية بدقة وشفافية",
      },
      {
        id: "rmd-zakat-fitr",
        nameAr: "زكاة الفطر — الواجبة عن كل فرد",
        nameEn: "Zakat Al-Fitr / Fidyah",
        price: 40,
        descAr: "زكاة الفطر الواجبة عن كل فرد أو فدية الصيام للعاجز",
      },
    ],
    cases: [
      {
        id: "case-rmd-1",
        refCode: "CMP-RMD-101",
        titleAr: "توفير 150 كرتونة مواد غذائية رمضانية لأسر عمال اليومية بشربين",
        titleEn: "150 Ramadan food parcels for daily wage earner families in Sherbin",
        beneficiaryName: "أسر عمال اليومية بقرى شربين",
        governorate: "الدقهلية",
        city: "شربين",
        neededAmount: 18000,
        raisedAmount: 12400,
        urgent: true,
      },
      {
        id: "case-rmd-2",
        refCode: "CMP-RMD-102",
        titleAr: "مائدة إفطار صائم وتوزيع 300 وجبة يوميًا لعابري السبيل",
        titleEn: "Daily Iftar table distributing 300 meals for the needy",
        beneficiaryName: "مطبخ الخير الرمضاني بالمنصورة",
        governorate: "الدقهلية",
        city: "المنصورة",
        neededAmount: 15000,
        raisedAmount: 9800,
      },
      {
        id: "case-rmd-3",
        refCode: "CMP-RMD-103",
        titleAr: "استكمال جهاز عروس يتيمة يحين زفافها في هذا الشهر الفضيل",
        titleEn: "Completing the trousseau for an orphan bride marrying this Ramadan",
        beneficiaryName: "العروس سمر (يتيمة الأب والأم)",
        governorate: "الدقهلية",
        city: "المنصورة",
        neededAmount: 12500,
        raisedAmount: 8000,
        urgent: true,
      },
    ],
  },

  // 17. موسم الأضاحي
  {
    id: "odhya",
    ar: "موسم الأضاحي — صك الأضحية",
    en: "Qurbani Season — Certified Sacrificial Shares",
    taglineAr: "الوحيدون في مصر الذين يضمنون جودة اللحم وتوزيعه الموثَّق على مستحقيه",
    taglineEn: "The only ones in Egypt guaranteeing meat quality & verified distribution",
    image: odhyaImg,
    entityType: "campaign",
    donationType: "cash",
    categoryAr: "موسم الأضاحي",
    categoryEn: "Qurbani Season",
    priceFrom: 500,
    color: "#ea580c",
    isSeasonal: true,
    shares: [
      {
        id: "odh-share-meat",
        nameAr: "سهم صدقة لحوم أضاحي طازجة",
        nameEn: "Qurbani Fresh Meat Share",
        price: 500,
        descAr: "مساهمة في تكلفة ذبح وتوزيع لحوم الأضاحي للأسر المحتاجة",
      },
      {
        id: "odh-sheep",
        nameAr: "صك خروف بلدي فلاحي كامل",
        nameEn: "Full Local Lamb Qurbani Voucher",
        price: 14500,
        popular: true,
        descAr: "خروف بلدي سليم يُذبح وفق الشريعة ويُوزَّع على الأسر المستحقة",
      },
      {
        id: "odh-calf-share",
        nameAr: "صك سُبع بقري بلدي فاخر",
        nameEn: "One-Seventh Cow Share (Baqari)",
        price: 16000,
        descAr: "سُبع بقرة بلدية أصيلة، تُوزَّع لحومها طازجة مبرَّدة بضمان الجودة",
      },
      {
        id: "odh-buffalo-share",
        nameAr: "صك سُبع جاموسي بلدي",
        nameEn: "One-Seventh Buffalo Share (Gamousi)",
        price: 14000,
        descAr: "سُبع جاموسة بلدية، تُوزَّع لحومها طازجة مبرَّدة بضمان الجودة",
      },
    ],
    cases: [
      {
        id: "case-odh-1",
        refCode: "CMP-ODH-301",
        titleAr: "توزيع لحوم أضاحي طازجة لـ 120 أسرة لم تتذوق اللحم منذ أشهر",
        titleEn: "Fresh Qurbani meat for 120 needy families who haven't had meat in months",
        beneficiaryName: "أسر الأيتام والصيادين المتعثرين",
        governorate: "الدقهلية",
        city: "المنزلة",
        neededAmount: 25000,
        raisedAmount: 17200,
        urgent: true,
      },
      {
        id: "case-odh-2",
        refCode: "CMP-ODH-302",
        titleAr: "ذبح وتجهيز وتعبئة مبرَّدة وتوصيل إلى بيوت الأسر بقرى الحفير",
        titleEn: "Butchering, chilling, packaging & door-to-door delivery in Al-Hafeer",
        beneficiaryName: "أهالي قرى الحفير والستاموني",
        governorate: "الدقهلية",
        city: "بلقاس",
        neededAmount: 18000,
        raisedAmount: 11500,
      },
    ],
  },
];

// ─── Helper lookups ───────────────────────────────────────────────────────────

/** All entities keyed by id for O(1) lookup */
export const ENTITY_MAP = Object.fromEntries(
  DONATION_ENTITIES.map((e) => [e.id, e])
) as Record<string, DonationEntity>;

/** Entities grouped by entityType */
export const ENTITIES_BY_TYPE = {
  program:  DONATION_ENTITIES.filter((e) => e.entityType === "program"),
  project:  DONATION_ENTITIES.filter((e) => e.entityType === "project"),
  campaign: DONATION_ENTITIES.filter((e) => e.entityType === "campaign"),
};

/** Seasonal campaigns (رمضان / أضاحي) */
export const SEASONAL_ENTITIES = DONATION_ENTITIES.filter((e) => e.isSeasonal);

/** Ongoing campaigns (non-seasonal) */
export const CAMPAIGN_ENTITIES = DONATION_ENTITIES.filter(
  (e) => e.entityType === "campaign" && !e.isSeasonal
);
