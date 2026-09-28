import zakatImg from "@/assets/program-zakat-new.jpg";
import foodBoxImg from "@/assets/program-food-new.jpg";
import kitchenImg from "@/assets/program-food.jpg";
import orphansImg from "@/assets/program-orphans.jpg";
import healthImg from "@/assets/program-health.png";
import prostheticsImg from "@/assets/Prosthetics.jpg";
import shelterImg from "@/assets/brand-poster-frame.jpg";
import waterImg from "@/assets/program-water-new.jpg";
import brideImg from "@/assets/poster-bride.png";
import waqfFarmImg from "@/assets/farm-hero.jpg";
import mosquesImg from "@/assets/brand-poster-frame.jpg";
import takrimImg from "@/assets/takrim-van.jpg";
import markounImg from "@/assets/markoun-furniture.jpg";
import odhyaImg from "@/assets/poster-odhya.png";
import educationImg from "@/assets/poster-education.png";
import arbounImg from "@/assets/banner-girl.png";
import ramadanImg from "@/assets/yusr-ramadan-box.png";
import dhillImg from "@/assets/hero-sad.jpg";

export type EntityType = "program" | "project" | "campaign";
export type DonationType = "cash" | "in_kind" | "both";

export type DonationShare = {
  id: string;
  nameAr: string;
  nameEn: string;
  price: number; // EGP
  descAr?: string;
  descEn?: string;
  popular?: boolean;
};

export type LinkedCase = {
  id: string;
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
  id: string; // unique slug
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
};

export const DONATION_ENTITIES: DonationEntity[] = [
  // ═══════════════════════════════════════════════════════════════════
  // 1. تبرع عام (General Donation)
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "general",
    ar: "تبرع عام",
    en: "General Donation",
    taglineAr: "صدقة عامة توجه للأشد احتياجاً والأكثر إلحاحاً",
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
    cases: [],
  },

  // ═══════════════════════════════════════════════════════════════════
  // 2. البرامج الدائمة (Programs) — خدمات أساسية دائمة مستمرة
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "zakat",
    ar: "زكاة المال",
    en: "Zakat Al-Mal",
    taglineAr: "تطهير المال وصرفه في مصارفه الشرعية الثمانية المعتمدة",
    taglineEn: "Purify your wealth across verified Shariah channels",
    image: zakatImg,
    entityType: "program",
    donationType: "cash",
    categoryAr: "فريضة شرعية",
    categoryEn: "Obligatory Zakat",
    priceFrom: 100,
    color: "#8b5cf6",
    shares: [
      { id: "zakat-open", nameAr: "سهم زكاة مال عام (مفتوح)", nameEn: "General Zakat Share", price: 100 },
      { id: "zakat-debts", nameAr: "سهم فك كرب غارمين وغارمات", nameEn: "Debt Relief Share", price: 500, descAr: "لسداد ديون أرباب الأسر المتعثرة", popular: true },
      { id: "zakat-housing", nameAr: "سهم إيواء وسكن للأسر العفيفة", nameEn: "Housing Zakat Share", price: 1000 },
      { id: "zakat-fitr", nameAr: "زكاة الفطر / فدية الصيام", nameEn: "Zakat Fitr / Fidyah", price: 40 },
    ],
    cases: [
      {
        id: "case-zakat-1",
        refCode: "CAS-ZKT-401",
        titleAr: "سداد متبقي دين غارمة أم لـ 4 أطفال لتفادي الحبس",
        titleEn: "Debt relief for a mother of 4 to prevent imprisonment",
        beneficiaryName: "أم محمد (عائل وحيد)",
        governorate: "الدقهلية",
        city: "المنصورة",
        neededAmount: 8500,
        raisedAmount: 5200,
        urgent: true,
      },
      {
        id: "case-zakat-2",
        refCode: "CAS-ZKT-402",
        titleAr: "كفالة إيجار ومسكن لأسرة مهددة بالطرد لتعطل العائل",
        titleEn: "Rent sponsorship for a family facing eviction",
        beneficiaryName: "أسرة الحاج رمضان",
        governorate: "الدقهلية",
        city: "طلخا",
        neededAmount: 4800,
        raisedAmount: 2100,
      },
    ],
  },
  {
    id: "orphans",
    ar: "كفالة يتيم",
    en: "Orphan Sponsorship",
    taglineAr: "كن رفيق النبي ﷺ في الجنة بكفالة يتيم شاملة",
    taglineEn: "Companion of the Prophet in Jannah through orphan care",
    image: orphansImg,
    entityType: "program",
    donationType: "cash",
    categoryAr: "رعاية وتكافل",
    categoryEn: "Orphan Care",
    priceFrom: 300,
    color: "#3b82f6",
    shares: [
      { id: "orph-part", nameAr: "سهم مساهمة كفالة يتيم", nameEn: "Partial Sponsorship Share", price: 150 },
      { id: "orph-full", nameAr: "كفالة يتيم شهرية شاملة (غذاء ودراسة)", nameEn: "Full Monthly Sponsorship", price: 600, popular: true },
      { id: "orph-clothes", nameAr: "سهم كسوة وحقيبة مدرسية ليتيم", nameEn: "School Bag & Uniform Share", price: 300 },
      { id: "orph-annual", nameAr: "كفالة يتيم سنوية متكاملة", nameEn: "Annual Full Sponsorship", price: 7200 },
    ],
    cases: [
      {
        id: "case-orph-1",
        refCode: "CAS-ORP-201",
        titleAr: "كفالة الطفلين الشقيقين كريم ورنا بعد وفاة والدهما",
        titleEn: "Sponsorship for siblings Karim & Rana after losing father",
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
        titleAr: "دعم تعليمي ومصروفات مدرسية ليتيم متفوق",
        titleEn: "Educational support for an exceptional orphan student",
        beneficiaryName: "يوسف م. (المرحلة الإعدادية)",
        governorate: "الدقهلية",
        city: "شربين",
        neededAmount: 3500,
        raisedAmount: 1800,
      },
    ],
  },
  {
    id: "box",
    ar: "غذاء شهري — كرتونة + لحمة",
    en: "Monthly Food Box & Meat",
    taglineAr: "إيصال سلات غذائية شهرية لأشد الأسر فقراً وعوزاً",
    taglineEn: "Monthly food parcels and fresh meat delivered to homes",
    image: foodBoxImg,
    entityType: "program",
    donationType: "cash",
    categoryAr: "إطعام وغذاء",
    categoryEn: "Food & Nutrition",
    priceFrom: 350,
    color: "#f97316",
    shares: [
      { id: "box-basic", nameAr: "سهم كرتونة مواد تموينية أساسية", nameEn: "Basic Food Box Share", price: 350, popular: true },
      { id: "box-meat",  nameAr: "سهم كرتونة لحوم وبروتين شهري", nameEn: "Monthly Meat & Protein Share", price: 250 },
      { id: "box-vip",   nameAr: "كرتونة الخير الشاملة (سلع + 2 كجم لحم)", nameEn: "Complete Family Food Package", price: 650 },
    ],
    cases: [
      {
        id: "case-box-1",
        refCode: "CAS-FD-101",
        titleAr: "سلال غذائية شهرية لـ 5 مسنات أرامل بلا عائل",
        titleEn: "Monthly food support for 5 elderly widows",
        beneficiaryName: "مجموعة مسنات بالقرى الأكثر احتياجاً",
        governorate: "الدقهلية",
        city: "مركز المنصورة",
        neededAmount: 3250,
        raisedAmount: 2100,
        urgent: true,
      },
    ],
  },
  {
    id: "kitchen",
    ar: "مطبخ اليسر — وجبة ساخنة",
    en: "Al-Yusr Kitchen (Hot Meals)",
    taglineAr: "وجبات طازجة يومية توزع للأسر المتعففة وعابري السبيل",
    taglineEn: "Fresh cooked hot meals served daily to vulnerable families",
    image: kitchenImg,
    entityType: "program",
    donationType: "cash",
    categoryAr: "إطعام ساخن",
    categoryEn: "Hot Meals",
    priceFrom: 50,
    color: "#f43f5e",
    shares: [
      { id: "ktch-1",  nameAr: "سهم وجبة ساخنة متكاملة (أرز + لحم/دجاج)", nameEn: "1 Nutritious Hot Meal", price: 50 },
      { id: "ktch-5",  nameAr: "باقة إطعام أسرة كاملة (5 وجبات)", nameEn: "Family Meal Pack (5 Meals)", price: 250, popular: true },
      { id: "ktch-20", nameAr: "باقة 20 وجبة ساخنة للمحتاجين", nameEn: "20 Hot Meals Pack", price: 1000 },
      { id: "ktch-day", nameAr: "يوم إطعام كامل في المطبخ (100 وجبة)", nameEn: "Full Kitchen Day (100 Meals)", price: 5000 },
    ],
    cases: [
      {
        id: "case-ktch-1",
        refCode: "CAS-KT-301",
        titleAr: "توفير 150 وجبة يومية لمرضى ومرافقي مستشفى الأورام بالمنصورة",
        titleEn: "Daily meals for oncology hospital patients & companions",
        beneficiaryName: "مرضى ومرافقي المستشفيات الجامعية",
        governorate: "الدقهلية",
        city: "المنصورة",
        neededAmount: 7500,
        raisedAmount: 4900,
        urgent: true,
      },
    ],
  },
  {
    id: "treatment",
    ar: "سهم علاج وقوافل طبية",
    en: "Medical Aid & Convoys",
    taglineAr: "روشتات شهرية، عمليات جراحية، وفحوصات غير القادرين",
    taglineEn: "Monthly prescriptions, surgeries, and rural medical convoys",
    image: healthImg,
    entityType: "program",
    donationType: "cash",
    categoryAr: "رعاية صحية",
    categoryEn: "Healthcare",
    priceFrom: 200,
    color: "#10b981",
    shares: [
      { id: "med-presc", nameAr: "سهم روشتة علاج ودواء شهري", nameEn: "Monthly Prescription Share", price: 200, popular: true },
      { id: "med-tests", nameAr: "سهم تحاليل وأشعة تشخيصية", nameEn: "Lab & Diagnostics Share", price: 400 },
      { id: "med-surg",  nameAr: "سهم مساهمة في عملية جراحية", nameEn: "Surgery Contribution Share", price: 1000 },
    ],
    cases: [
      {
        id: "case-med-1",
        refCode: "CAS-MED-501",
        titleAr: "عملية قلب مفتوح وقسطرة عاجلة لطفل عمره 3 سنوات",
        titleEn: "Urgent pediatric cardiac surgery for 3-year-old child",
        beneficiaryName: "الطفل أحمد سامي",
        governorate: "الدقهلية",
        city: "ميت غمر",
        neededAmount: 22000,
        raisedAmount: 14500,
        urgent: true,
      },
      {
        id: "case-med-2",
        refCode: "CAS-MED-502",
        titleAr: "توفير علاج مناعي شهري لربة منزل مصابة بمرض مزمن",
        titleEn: "Monthly immunotherapy for a chronic patient",
        beneficiaryName: "الحاجة سعاد",
        governorate: "الدقهلية",
        city: "السنبلاوين",
        neededAmount: 4200,
        raisedAmount: 2800,
      },
    ],
  },
  {
    id: "prosthetics",
    ar: "أطراف صناعية وكراسي متحركة",
    en: "Prosthetics & Wheelchairs",
    taglineAr: "إعادة الأمل والحركة لذوي الهمم ومصابي الحوادث",
    taglineEn: "Restoring mobility and hope for people with disabilities",
    image: prostheticsImg,
    entityType: "program",
    donationType: "cash",
    categoryAr: "ذوي الهمم",
    categoryEn: "Mobility Aid",
    priceFrom: 500,
    color: "#06b6d4",
    shares: [
      { id: "prst-share", nameAr: "سهم مساهمة في طرف صناعي", nameEn: "Prosthetic Share", price: 500 },
      { id: "prst-chair", nameAr: "كرسي متحرك طبي قياسي كامل", nameEn: "Standard Medical Wheelchair", price: 2500, popular: true },
      { id: "prst-elec",  nameAr: "كرسي كهربائي لذوي الشلل الرباعي", nameEn: "Electric Wheelchair Pack", price: 15000 },
    ],
    cases: [
      {
        id: "case-prst-1",
        refCode: "CAS-PRS-601",
        titleAr: "تركيب طرف صناعي سفلي ذكي لشاب عائل أسرته بعد حادث",
        titleEn: "Lower prosthetic limb for a young family provider",
        beneficiaryName: "الشاب محمود (24 سنة)",
        governorate: "الدقهلية",
        city: "دكرنس",
        neededAmount: 18000,
        raisedAmount: 11000,
        urgent: true,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // 3. المشاريع التنموية والإنشائية (Projects) — أهداف مالية وإنشائية
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "mosques",
    ar: "عمارة وبناء بيوت الله",
    en: "Mosque Building & Renovation",
    taglineAr: "من بنى لله مسجداً بنى الله له بيتاً في الجنة",
    taglineEn: "Whoever builds a mosque for Allah, Allah builds a home for them in Jannah",
    image: mosquesImg,
    entityType: "project",
    donationType: "cash",
    categoryAr: "بيوت الله",
    categoryEn: "Mosques",
    priceFrom: 250,
    color: "#6366f1",
    shares: [
      { id: "msq-carpet", nameAr: "سهم فرش وسجاد مسجد فاخر", nameEn: "Mosque Carpeting Share", price: 250, descAr: "متر سجاد تركي مخصص للمساجد", popular: true },
      { id: "msq-cement", nameAr: "سهم مواد بناء وأسمنت (طن)", nameEn: "Cement & Building Materials", price: 500 },
      { id: "msq-meter",  nameAr: "سهم متر مربع إنشائي في المسجد", nameEn: "1 Sq Meter Mosque Construction", price: 1000 },
      { id: "msq-minaret", nameAr: "سهم إعمار مئذنة ومصلى نساء", nameEn: "Minaret & Prayer Hall Share", price: 2500 },
    ],
    cases: [
      {
        id: "case-msq-1",
        refCode: "PRJ-MSQ-701",
        titleAr: "استكمال صبة سقف وعزل مسجد التوحيد بمدينة بلقس",
        titleEn: "Roof completion and insulation for Al-Tawheed Mosque",
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
        titleAr: "تجديد دورات المياه وميضأة مسجد الإيمان بقرية كفر غنام",
        titleEn: "Ablution & restroom renovation at Al-Eman Mosque",
        beneficiaryName: "أهالي قرية كفر غنام",
        governorate: "الدقهلية",
        city: "السنبلاوين",
        neededAmount: 18500,
        raisedAmount: 9200,
      },
    ],
  },
  {
    id: "waqf",
    ar: "المزرعة الوقفية — وقف إنتاجي",
    en: "Waqf Farm — Productive Endowment",
    taglineAr: "صدقة جارية مستدامة تدر أثراً وتمويلاً خيرياً دائماً",
    taglineEn: "Sustainable productive endowment generating perpetual charity",
    image: waqfFarmImg,
    entityType: "project",
    donationType: "cash",
    categoryAr: "وقف إنتاجي",
    categoryEn: "Productive Waqf",
    priceFrom: 500,
    color: "#84cc16",
    shares: [
      { id: "wqf-palm",  nameAr: "سهم نخلة مثمرة صدقة جارية", nameEn: "Productive Date Palm Share", price: 500, popular: true },
      { id: "wqf-irr",   nameAr: "سهم شبكة ري حديثة بالطاقة الشمسية", nameEn: "Modern Solar Irrigation Share", price: 1000 },
      { id: "wqf-feddan", nameAr: "سهم استصلاح وزراعة ربع فدان وقفي", nameEn: "Quarter Feddan Reclamation", price: 2500 },
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
  {
    id: "shelter",
    ar: "ستر — تسقيف وترميم المنازل",
    en: "Sitr — Roofing & Home Repair",
    taglineAr: "حماية أسر القرى الفقيرة من برد الشتاء ومياه الأمطار",
    taglineEn: "Protecting vulnerable rural families from winter rain and cold",
    image: shelterImg,
    entityType: "project",
    donationType: "cash",
    categoryAr: "إيواء وتسكين",
    categoryEn: "Shelter & Roofing",
    priceFrom: 500,
    color: "#fbbf24",
    shares: [
      { id: "shlt-wood", nameAr: "سهم خشب وعوازل مائية وحرارية", nameEn: "Wood & Weather Insulation Share", price: 500, popular: true },
      { id: "shlt-conc", nameAr: "سهم صبة خرسانية مسلحة لغرفة", nameEn: "Reinforced Concrete Ceiling", price: 1500 },
      { id: "shlt-finish", nameAr: "سهم تشطيب محارة وأرضيات وباب وشباك", nameEn: "Wall Plastering & Windows Share", price: 800 },
      { id: "shlt-full", nameAr: "تسقيف وترميم غرفة كاملة شامل المواد والمصنعية", nameEn: "Complete Room Restoration", price: 4500 },
    ],
    cases: [
      {
        id: "case-shlt-1",
        refCode: "PRJ-STR-901",
        titleAr: "تسقيف منزل متهالك بالجريد والطين يؤوي أرملة وأطفالها الـ 5",
        titleEn: "Ceiling replacement for a deteriorating mud home",
        beneficiaryName: "الحاجة أم السعد وأطفالها",
        governorate: "الدقهلية",
        city: "مركز أجا",
        neededAmount: 14000,
        raisedAmount: 9500,
        urgent: true,
      },
      {
        id: "case-shlt-2",
        refCode: "PRJ-STR-902",
        titleAr: "بناء جدران آيلة للسقوط وتركيب باب وشباك لمنزل أيتام",
        titleEn: "Rebuilding crumbling walls & door installation for orphans",
        beneficiaryName: "أسرة أيتام بقرية ميت عاصم",
        governorate: "الدقهلية",
        city: "منية النصر",
        neededAmount: 11000,
        raisedAmount: 6200,
      },
    ],
  },
  {
    id: "water",
    ar: "سقيا الماء — وصلة مياه نظيفة",
    en: "Clean Water Connections",
    taglineAr: "أفضل الصدقة سقي الماء — إيصال المياه النقية لبيوت المحرومين",
    taglineEn: "The best charity is giving water — connecting clean tap water to homes",
    image: waterImg,
    entityType: "project",
    donationType: "cash",
    categoryAr: "سقيا الماء",
    categoryEn: "Clean Water",
    priceFrom: 300,
    color: "#38bdf8",
    shares: [
      { id: "wtr-share", nameAr: "سهم مساهمة في تكلفة وصلة مياه", nameEn: "Water Connection Share", price: 300 },
      { id: "wtr-meter", nameAr: "سهم رسوم عداد المياه الرسمي والمواسير", nameEn: "Official Water Meter Share", price: 1000 },
      { id: "wtr-full",  nameAr: "وصلة مياه منزلية نقية كاملة شاملة العداد والتركيب", nameEn: "Full Home Tap Water Connection", price: 3500, popular: true },
      { id: "wtr-station", nameAr: "سهم محطة معالجة وفلترة مياه قروية", nameEn: "Village Water Filtration Unit Share", price: 1500 },
    ],
    cases: [
      {
        id: "case-wtr-1",
        refCode: "PRJ-WTR-111",
        titleAr: "توصيل مياه صالحة للشرب لمنزل أسرة مريضة كلى بقرية دنجواي",
        titleEn: "Clean drinking water connection for a kidney patient family",
        beneficiaryName: "أسرة عم إسماعيل (عاجز عن العمل)",
        governorate: "الدقهلية",
        city: "شربين",
        neededAmount: 3500,
        raisedAmount: 2200,
        urgent: true,
      },
    ],
  },
  {
    id: "bride",
    ar: "تيسير زواج — جهاز عروسة يتيمة",
    en: "Bride's Trousseau (Marriage Aid)",
    taglineAr: "ستر وتجهيز الفتيات اليتيمات والمقبلات على الزواج",
    taglineEn: "Equipping orphan brides with essential household appliances",
    image: brideImg,
    entityType: "project",
    donationType: "cash",
    categoryAr: "تيسير زواج",
    categoryEn: "Marriage Facilitation",
    priceFrom: 250,
    color: "#ec4899",
    shares: [
      { id: "brd-share", nameAr: "سهم مساهمة في جهاز عروسة", nameEn: "Trousseau Contribution Share", price: 250 },
      { id: "brd-cooker", nameAr: "سهم بوتاجاز 4 شعلة وأواني مطبخ", nameEn: "Gas Cooker & Kitchenware Share", price: 2500, popular: true },
      { id: "brd-wash",   nameAr: "سهم غسالة ملابس نصف أوتوماتيك", nameEn: "Washing Machine Share", price: 3500 },
      { id: "brd-fridge", nameAr: "سهم ثلاجة منزلية 12 قدم", nameEn: "Refrigerator Share", price: 6500 },
    ],
    cases: [
      {
        id: "case-brd-1",
        refCode: "PRJ-BRD-221",
        titleAr: "استكمال شراء أجهزة كهربائية لعروسة يتيمة زفافها الشهر القادم",
        titleEn: "Electrical appliances for an orphan bride getting married next month",
        beneficiaryName: "العروسة سمر (يتيمة الأب والأم)",
        governorate: "الدقهلية",
        city: "المنصورة",
        neededAmount: 12500,
        raisedAmount: 8000,
        urgent: true,
      },
    ],
  },
  {
    id: "takrim",
    ar: "سيارات تكريم الإنسان",
    en: "Takrim Mortuary Vans",
    taglineAr: "نقل الموتى وتكريم الإنسان مجاناً لوجه الله لغير القادرين",
    taglineEn: "Free dignified mortuary transport service for underprivileged families",
    image: takrimImg,
    entityType: "project",
    donationType: "cash",
    categoryAr: "خدمة مجتمعية",
    categoryEn: "Community Service",
    priceFrom: 100,
    color: "#64748b",
    shares: [
      { id: "tkr-fuel", nameAr: "سهم وقود وصيانة دورية للسيارة", nameEn: "Van Fuel & Maintenance Share", price: 100, popular: true },
      { id: "tkr-shroud", nameAr: "سهم كفن شرعي ومستلزمات الغُسل", nameEn: "Islamic Shroud & Washing Kit", price: 250 },
      { id: "tkr-trip", nameAr: "كفالة رحلة نقل جثمان لمسافات طويلة", nameEn: "Long-Distance Transit Sponsorship", price: 500 },
    ],
    cases: [],
  },

  // ═══════════════════════════════════════════════════════════════════
  // 4. الحملات التسويقية والموسمية والمستمرة (Campaigns)
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "markoun",
    ar: "حملة مَرْكُون — كنزك المركون حياة لغيرك",
    en: "Markoun Campaign — Upcycling & In-Kind",
    taglineAr: "تبرع بأثاثك وأجهزتك القديمة، أو ادعم تكلفة الصيانة والتوزيع",
    taglineEn: "Donate unused furniture/appliances or support repair and delivery",
    image: markounImg,
    entityType: "campaign",
    donationType: "both", // Supports In-Kind (no gateway) AND Cash Shares!
    categoryAr: "تبرع عيني ونقدي",
    categoryEn: "In-Kind & Cash",
    priceFrom: 100,
    color: "#10b981",
    isMarkoun: true,
    shares: [
      { id: "mrk-repair", nameAr: "سهم صيانة وتجديد جهاز كهربائي مركون (غسالة/ثلاجة)", nameEn: "Appliance Refurbishment Share", price: 150, descAr: "صيانة أجهزة منزلية تبرع بها الأهالي لتوزيعها بحالة ممتازة", popular: true },
      { id: "mrk-transport", nameAr: "سهم نقل وشحن أثاث من المتبرع للأسر المستحقة", nameEn: "Furniture Pickup & Delivery Share", price: 100, descAr: "تغطية سيارات نقل ومندوبي اليسر للاستلام من الباب" },
      { id: "mrk-furnish", nameAr: "سهم باقة تأهيل وتأثيث صالون وغرفة معيشة", nameEn: "Room Furnishing & Upcycling Share", price: 350 },
      { id: "mrk-general", nameAr: "تبرع عام لدعم ورش ومستودعات حملة مركون", nameEn: "General Markoun Campaign Support", price: 200 },
    ],
    cases: [
      {
        id: "case-mrk-1",
        refCode: "CMP-MRK-01",
        titleAr: "تأثيث منزل أسرة احترق بالكامل بأثاث وأجهزة مركون مجددة",
        titleEn: "Furnishing a fire-damaged house with refurbished Markoun furniture",
        beneficiaryName: "أسرة الحاج فوزي (حريق منزل)",
        governorate: "الدقهلية",
        city: "أجا",
        neededAmount: 9000,
        raisedAmount: 5500,
        urgent: true,
      },
    ],
  },
  {
    id: "arboun",
    ar: "مبادرة عَرْبُون خير — المستقلين والشركات",
    en: "Arboun Khair — Freelancers & Companies",
    taglineAr: "اقتطع نسبة بسيطة من كل مشروع أو عقد حر لدعم الأسر المتعففة",
    taglineEn: "Deduct a small percentage from freelance projects for community aid",
    image: arbounImg,
    entityType: "campaign",
    donationType: "cash",
    categoryAr: "مبادرة مستمرة",
    categoryEn: "Continuous Initiative",
    priceFrom: 100,
    color: "#6366f1",
    shares: [
      { id: "arbn-freelance", nameAr: "سهم عربون مشروع عمل حر (100 ج)", nameEn: "Freelance Project Share (100 EGP)", price: 100, popular: true },
      { id: "arbn-monthly",   nameAr: "سهم عربون شهري للمستقلين (300 ج)", nameEn: "Monthly Freelancer Share (300 EGP)", price: 300 },
      { id: "arbn-company",   nameAr: "باقة شراكة شركات ومكاتب الخير (1000 ج)", nameEn: "Company Charity Tier (1000 EGP)", price: 1000 },
    ],
    cases: [],
  },
  {
    id: "ramadan",
    ar: "حملة رمضان — إفطار صائم وسلال الخير",
    en: "Ramadan Campaign — Iftar & Food Baskets",
    taglineAr: "من فطّر صائماً كان له مثل أجره — وجبات وكراتين رمضانية",
    taglineEn: "Whoever feeds a fasting person earns a matching reward",
    image: ramadanImg,
    entityType: "campaign",
    donationType: "cash",
    categoryAr: "حملة موسمية",
    categoryEn: "Seasonal Campaign",
    priceFrom: 60,
    color: "#f59e0b",
    shares: [
      { id: "rmd-iftar", nameAr: "سهم وجبة إفطار صائم ساخنة", nameEn: "Hot Iftar Meal Share", price: 60, popular: true },
      { id: "rmd-box",   nameAr: "كرتونة الخير الرمضانية للأسر المحتاجة", nameEn: "Ramadan Food Parcel", price: 400 },
      { id: "rmd-family", nameAr: "كفالة إفطار عائلة كاملة لمدة أسبوع", nameEn: "Family Week Iftar Sponsorship", price: 1200 },
    ],
    cases: [],
  },
  {
    id: "dhill",
    ar: "حملة ظل — كسوة وتدفئة الشتاء",
    en: "Dhill Campaign — Winter Warmth & Blankets",
    taglineAr: "دفء وكسوة أطفال وأهالي القرى في ليالي الشتاء القارس",
    taglineEn: "Warmth, blankets and winter clothing for rural villages",
    image: dhillImg,
    entityType: "campaign",
    donationType: "cash",
    categoryAr: "حملة موسمية",
    categoryEn: "Seasonal Campaign",
    priceFrom: 150,
    color: "#0284c7",
    shares: [
      { id: "dhl-blanket", nameAr: "سهم بطانية شتوية فاخرة دبل", nameEn: "Heavy Winter Blanket Share", price: 250, popular: true },
      { id: "dhl-heater",  nameAr: "سهم دفاية زيت منزلية آمنة", nameEn: "Safe Room Heater Share", price: 750 },
      { id: "dhl-jacket",  nameAr: "سهم جاكيت وكسوة شتوية لطفل يتيم", nameEn: "Orphan Winter Coat & Shoes", price: 350 },
    ],
    cases: [],
  },
  {
    id: "odhya",
    ar: "حملة الأضاحي — صك الأضحية بضمان الجودة",
    en: "Qurbani Campaign — Certified Sacrificial Shares",
    taglineAr: "الوحيدون في مصر بضمان جودة اللحم والتوزيع الموثق",
    taglineEn: "The only ones in Egypt guaranteeing meat quality & verified distribution",
    image: odhyaImg,
    entityType: "campaign",
    donationType: "cash",
    categoryAr: "حملة موسمية شرعية",
    categoryEn: "Shariah Seasonal",
    priceFrom: 500,
    color: "#ea580c",
    shares: [
      { id: "odh-share-meat", nameAr: "سهم صدقة لحوم أضاحي طازجة", nameEn: "Qurbani Fresh Meat Share", price: 500 },
      { id: "odh-sheep",      nameAr: "صك خروف بلدي فلاحي كامل", nameEn: "Full Local Lamb Qurbani Voucher", price: 6800 },
      { id: "odh-calf-share", nameAr: "صك سُبع عجل بقري بلدي فاخر", nameEn: "One-Seventh Cattle Share (Baqari)", price: 8500, popular: true },
    ],
    cases: [],
  },
  {
    id: "education",
    ar: "حملة ادفع مصروفه — كفالة تعليمية",
    en: "Education Campaign — Pay His Tuition",
    taglineAr: "لا تدع طفلاً محتاجاً يترك مقاعد الدراسة بسبب ضيق الحال",
    taglineEn: "Ensure no needy child drops out of school due to poverty",
    image: educationImg,
    entityType: "campaign",
    donationType: "cash",
    categoryAr: "تعليم وبناء",
    categoryEn: "Education Support",
    priceFrom: 100,
    color: "#818cf8",
    shares: [
      { id: "edu-tuition", nameAr: "سهم مساهمة في المصروفات المدرسية", nameEn: "School Tuition Share", price: 150, popular: true },
      { id: "edu-bag",     nameAr: "سهم شنطة مدرسية بالأدوات والكشاكيل", nameEn: "School Bag & Stationery Kit", price: 250 },
      { id: "edu-uniform", nameAr: "سهم زي مدرسي وحذاء جديد", nameEn: "School Uniform & Shoes Share", price: 350 },
      { id: "edu-annual",  nameAr: "كفالة طالب دراسية كاملة لعام دراسي", nameEn: "Full Academic Year Sponsorship", price: 1500 },
    ],
    cases: [],
  },
];
