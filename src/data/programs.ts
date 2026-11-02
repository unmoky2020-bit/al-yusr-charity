import odhya from "@/assets/poster-odhya.webp";
import zakat from "@/assets/program-zakat-new.jpg";
import meat from "@/assets/poster-meat.webp";
import water from "@/assets/program-water-new.jpg";
import box from "@/assets/program-food-new.jpg";
import education from "@/assets/poster-education.png";
import bride from "@/assets/poster-bride.webp";
import volunteer from "@/assets/poster-volunteer.png";
import shelter from "@/assets/brand-poster-frame.jpg";
import orphans from "@/assets/program-orphans.jpg";
import health from "@/assets/program-health.webp";
import Prosthetics from "@/assets/Prosthetics.jpg";
import kitchen from "@/assets/program-food.jpg";
import markounWardrobe from "@/assets/markoun-poster-furniture.webp";
import markounPuzzle from "@/assets/markoun-puzzle.webp";
import posterDelivery from "@/assets/markoun-poster-delivery.png";
import posterMedBottle from "@/assets/markoun-poster-medbottle.png";
import markounFurniture from "@/assets/markoun-furniture.webp";

/**
 * Content taxonomy:
 * - Programs = recurring donation programs and permanent support tracks.
 * - Campaigns = seasonal or time-bound initiatives with a clear mission window.
 * - Services = large infrastructure/development projects and field operations.
 *
 * Keeping these definitions separate prevents duplicate messaging and makes
 * SEO/meta copy more consistent across the site.
 */
export type ProgramContent = {
  slug: string;
  image: string;
  priceFrom: number; // EGP
  ar: { name: string; tagline: string; desc: string; benefits: string[]; longContent: string[] };
  en: { name: string; tagline: string; desc: string; benefits: string[]; longContent: string[] };
  /** Optional secondary gallery (poster/brand visuals) used on detail pages. */
  gallery?: string[];
  /** Optional season/timing badge text shown on cards. */
  season?: { ar: string; en: string };
  /**
   * Detail-page hero overrides edited in the dashboard («أعلى الصفحة»). Only set when the API
   * has them; the page falls back to name / tagline / image.
   */
  hero?: {
    image?: string;
    ar: { title?: string; subtitle?: string; badge?: string };
    en: { title?: string; subtitle?: string; badge?: string };
  };
  /**
   * Page sections edited in the dashboard («أقسام الصفحة»). When a section has items it replaces the
   * matching default on the detail page (benefits list, how-it-works steps, details text, journey).
   */
  sections?: {
    benefits?: { ar: string[]; en: string[] };
    steps?: { ar: { t: string; d: string }[]; en: { t: string; d: string }[] };
    details?: { ar: string[]; en: string[] };
    impact?: { ar: { t: string; d: string }[]; en: { t: string; d: string }[] };
  };
  /** Search title/description from the dashboard SEO tab (meta_title_* / meta_description_*). */
  seo?: { ar: { title?: string; description?: string }; en: { title?: string; description?: string } };
  /** Backend id (API mode) — used to load the program's cases. */
  apiId?: number;
  /** The program's shares (backend donation_packages, active, in order) — its "donation options". */
  packages?: ProgramPackage[];
  /** FAQ category linked in the dashboard (program → «الأسئلة الشائعة» tab, stored on the faq page section). */
  faqCategory?: string;
};

export type ProgramPackage = {
  id: number;
  /** Stable URL part: the package key when set, else its id. */
  slug: string;
  nameAr: string;
  nameEn: string;
  amount: number;
};

export const programs: ProgramContent[] = [
  {
    slug: "odhya",
    image: odhya,
    priceFrom: 1400,
    ar: {
      name: "صك الأضحية",
      tagline: "الوحيدين في مصر بنديك ضمان جودة الأضحية",
      desc: "صك أضحية بنفس جودة اللحمة اللي بتاكلها — جاموسي، بقري، أو خروف. توزع على أفقر الأسر في الدقهلية ومحافظات مصر.",
      benefits: [
        "جودة مضمونة 100% — معاينة مسبقة وذبح شرعي",
        "توزيع موثّق بالصور والفيديو لكل صك",
        "تغطية أوسع لأسر المنصورة وقرى الدقهلية",
        "إيصال إلكتروني فوري بعد التبرع",
      ],
      longContent: [
        "في مؤسسة اليسر بنؤمن إن الأضحية أمانة قبل ما تكون عبادة. عشان كده بنعاين كل أضحية بنفسنا قبل الذبح ونوثّق العملية بالكامل.",
        "الأسر المستفيدة بتتفلتر على أساس معايير الفقر الفعلي في الدقهلية، وبنوصل اللحمة لباب البيت في يوم العيد بنفس جودة اللي بناكلها في بيوتنا.",
        "تبرعك بصك أضحية مش بس بيفرّح أسرة في يوم العيد — ده بيوصل بروتين عالي الجودة لأطفال محرومين منه طول السنة.",
      ],
    },
    en: {
      name: "Qurbani Voucher",
      tagline: "The only ones in Egypt guaranteeing Qurbani quality",
      desc: "A premium-quality Qurbani share — buffalo, cow, or lamb — distributed to the most deserving families in Dakahlia and across Egypt.",
      benefits: [
        "100% guaranteed quality with prior inspection and Shariah-compliant slaughter",
        "Photo and video documentation for every voucher",
        "Wide coverage of Mansoura families and Dakahlia villages",
        "Instant electronic receipt after donation",
      ],
      longContent: [
        "At Al-Yusr we believe Qurbani is a trust before it is worship. That's why we personally inspect every animal before slaughter and document the entire process.",
        "Beneficiary families are filtered based on real poverty criteria in Dakahlia, and we deliver the meat to their doorstep on Eid day at the same quality we serve in our own homes.",
        "Your Qurbani voucher doesn't just bring joy on Eid — it delivers high-quality protein to children deprived of it all year.",
      ],
    },
  },
  {
    slug: "zakat",
    image: zakat,
    priceFrom: 100,
    ar: {
      name: "زكاة المال",
      tagline: "عليك إخراج زكاة مالك وعلينا توصيلها لمن يستحق",
      desc: "احسب زكاة مالك واتركها لنا — نوزعها على المستحقين الفعليين في مصارفها الشرعية الثمانية بدقة وأمانة.",
      benefits: [
        "توزيع شرعي على المصارف الثمانية",
        "بحث اجتماعي ميداني لكل حالة",
        "تقرير شفاف بكيفية الصرف",
        "إمكانية تخصيص الزكاة لمحافظة معينة",
      ],
      longContent: [
        "زكاة المال عبادة وأمانة. بنتعامل معاها بمنهجية صارمة: بحث اجتماعي، تحقق من الاستحقاق، ثم توزيع موثّق.",
        "بنخصص فريق محاسبي مستقل لمراجعة كل جنيه يدخل تحت بند الزكاة، عشان نضمن إنه يصل بنسبة 100% لمستحقيه.",
      ],
    },
    en: {
      name: "Zakat",
      tagline: "You give your Zakat — we deliver it to who deserves it",
      desc: "Calculate your Zakat and leave the rest to us — we distribute it precisely to its eight Shariah-defined channels.",
      benefits: [
        "Shariah-compliant distribution to the eight channels",
        "Field social research for every case",
        "Transparent reporting on how funds are spent",
        "Option to designate Zakat to a specific governorate",
      ],
      longContent: [
        "Zakat is worship and trust. We handle it with strict methodology: social research, eligibility verification, then documented distribution.",
        "An independent accounting team reviews every pound categorized under Zakat to ensure 100% reaches its rightful recipients.",
      ],
    },
  },
  {
    slug: "water",
    image: water,
    priceFrom: 200,
    ar: {
      name: "وصلة مياه",
      tagline: "وصلة مياه واحدة = آلاف الحسنات يوميًا",
      desc: "ساعدنا نوصل وصلة مياه نظيفة لأسرة في الدقهلية أو الصعيد. السهم من 200 إلى 1000 جنيه — صدقة جارية أثرها يدوم.",
      benefits: [
        "أسهم من 200 / 500 / 1000 جنيه",
        "تنفيذ موثّق بالصور",
        "صدقة جارية مستمرة",
        "تغطية قرى الدقهلية والصعيد",
      ],
      longContent: [
        "في قرى كتيرة لسه الأهالي بيمشوا كيلومترات عشان يجيبوا مياه. وصلة المياه بتختصر الرحلة دي وبتحمي الأطفال من الأمراض.",
        "كل وصلة مياه بنعملها بتفيد أسرة واحدة وأحيانًا أكتر، وبتفضل صدقة جارية ليك ما دامت تنزل منها قطرة.",
      ],
    },
    en: {
      name: "Water Connection",
      tagline: "One water line = thousands of blessings daily",
      desc: "Help us deliver clean water to a family in Dakahlia or Upper Egypt. Shares from 200 to 1000 EGP — a lasting charity whose impact endures.",
      benefits: [
        "Shares of 200 / 500 / 1000 EGP",
        "Implementation documented with photos",
        "Continuous Sadaqah Jariyah",
        "Coverage of Dakahlia and Upper Egypt villages",
      ],
      longContent: [
        "In many villages, families still walk kilometers to fetch water. A water connection eliminates this and protects children from disease.",
        "Every water line we install benefits one or more families and remains a continuous charity for you as long as a drop flows.",
      ],
    },
  },
  {
    slug: "box",
    image: box,
    priceFrom: 350,
    ar: {
      name: "غذاء شهري — كرتونة + لحمة",
      tagline: "غذاء شهري متكامل لأسرة كاملة — مواد جافة وكيلو لحمة بلدي",
      desc: "كرتونة مواد غذائية كاملة (أرز، سكر، زيت، مكرونة، فول، عدس، بقوليات…) ومعها كيلو لحمة بلدي من مزارعنا الوقفية — تكفي أسرة من 5 أفراد لمدة شهر كامل.",
      benefits: [
        "محتوى يكفي شهر كامل لأسرة 5 أفراد",
        "كيلو لحمة بلدي من مزارع اليسر مع كل كرتونة",
        "تغليف بهوية اليسر",
        "تسليم بكرامة لباب البيت",
      ],
      longContent: [
        "الغذاء الشهري عندنا مش مجرد مساعدة، دي رسالة كرامة. بنعبي الكرتونة بمنتجات حقيقية وبكميات واقعية تكفي الأسرة شهر كامل، ومعاها كيلو لحمة بلدي طازج من مزارعنا الوقفية عشان البروتين يبقى جزء من سفرة كل أسرة.",
        "بنوصلها بكرامة كاملة لباب البيت، من غير تجمعات أو مذلة لأي أسرة.",
      ],
    },
    en: {
      name: "Monthly Food — Box + Meat",
      tagline: "A complete monthly food package — dry goods plus a kilo of fresh farm meat",
      desc: "A complete food box (rice, sugar, oil, pasta, beans, lentils, legumes…) bundled with a kilo of fresh meat from our endowment farms — enough for a family of 5 for a full month.",
      benefits: [
        "Contents sufficient for one month for a family of 5",
        "1 kg of fresh farm meat included with every box",
        "Branded Al-Yusr packaging",
        "Dignified doorstep delivery",
      ],
      longContent: [
        "Our monthly food package isn't just aid — it's a message of dignity. We pack the box with real products in realistic quantities to last one full month, and include a kilo of fresh farm meat so protein becomes part of every family's table.",
        "We deliver it with full dignity to the doorstep, without gatherings or humiliation for any family.",
      ],
    },
  },
  {
    slug: "education",
    image: education,
    priceFrom: 100,
    ar: {
      name: "ادفع مصروفه وابني مستقبله",
      tagline: "حملة سبتمبر فقط — تعليم طفل = استثمار في مستقبل مصر",
      desc: "ساهم في مصاريف مدرسة طفل في الدقهلية. أسهم تعليمية من 100 / 250 / 500 جنيه. كفالة تعليمية شاملة (مصروفات، زي مدرسي، أدوات).",
      benefits: [
        "حملة موسمية تُفتح في شهر سبتمبر فقط مع بداية العام الدراسي",
        "أسهم من 100 / 250 / 500 جنيه",
        "تغطية مصروفات + زي + أدوات",
        "تقرير دوري عن مستوى الطفل",
      ],
      longContent: [
        "كل سنة بنخسر آلاف الأطفال من المدارس بسبب المصاريف. حملة «ادفع مصروفه وابني مستقبله» تُطلق سنويًا في شهر سبتمبر فقط مع بداية العام الدراسي عشان نلحق نسجّل الأطفال ونوفّر مصروفاتهم قبل بداية الدراسة.",
        "بنغطي مصاريف المدرسة، الزي، الأدوات، وحتى الدروس الخصوصية للحالات اللي محتاجة، ضمانًا لاستمرارية الطفل في التعليم.",
      ],
    },
    en: {
      name: "Education — Build His Future",
      tagline: "September-only campaign — Educating a child = investing in Egypt's future",
      desc: "Contribute to a child's school tuition in Dakahlia. Education shares from 100 / 250 / 500 EGP. Comprehensive sponsorship (tuition, uniform, supplies).",
      benefits: [
        "Seasonal campaign — opens in September only at the start of the school year",
        "Shares of 100 / 250 / 500 EGP",
        "Tuition + uniform + supplies covered",
        "Periodic report on the child's progress",
      ],
      longContent: [
        "Every year, thousands of children drop out of school due to fees. The “Pay His Tuition, Build His Future” campaign launches every September only — timed with the start of the school year so we can register children and cover their fees before classes begin.",
        "We cover tuition, uniforms, supplies, and even tutoring when needed, ensuring continuity in the child's education.",
      ],
    },
    season: { ar: "حملة سبتمبر فقط", en: "September only" },
  },
  {
    slug: "bride",
    image: bride,
    priceFrom: 250,
    ar: {
      name: "جواز عروسة",
      tagline: "هو جهاز عروسة… بس في الحقيقة جهاز حسنات",
      desc: "عايز تتبرع في العشر الأواخر وخيرك يكون أثره كبير؟ وصلت للمكان الصح. الحسنة بـ 700 ضعف، وإدخال سرور على مسلم، ومن ستر مسلمًا ستره الله يوم القيامة. سعر السهم 250 ج فقط.",
      benefits: [
        "تجهيز كامل لشقة جديدة (غرفة نوم، صالون، مطبخ، أجهزة)",
        "أولوية لبنات الأيتام والأرامل",
        "بحث ميداني دقيق قبل الاختيار",
        "سهمك بـ 250 ج ضمن مشروع متكامل",
        "حسنات لا تنقطع: إدخال سرور وستر",
        "تقرير مصور لكل عروسة بعد التجهيز",
      ],
      longContent: [
        "هو جهاز عروسة… أه. بس في الحقيقة جهاز حسنات لا بيعدّلك حسنات كل ثانية. كل قطعة في الشقة بتفضل صدقة جارية ليك ولأهلك.",
        "عايز تتبرع في العشر الأواخر وخيرك يكون أثره كبير؟ انت وصلت للمكان الصح. الحسنة في العشر الأواخر بـ 700 ضعف، وإدخال السرور على المسلم من أحب الأعمال إلى الله، ومن ستر مسلمًا ستره الله يوم القيامة.",
        "كل الخير ده تقدر تكسبه بتبرع بسيط منك — سعر السهم 250 ج فقط ضمن مشروع تجهيز عروسة كامل (غرفة نوم، صالون، مطبخ، أجهزة كهربائية، ملابس العروسة).",
        "ابعتلنا كلمة «تبرع» على واتساب وسارع قبل فوات الأوان — جمعنا 9 من أصل 15 عروسة، وفاضل 6 بس عشان نكمل الفرحة.",
      ],
    },
    en: {
      name: "Bride's Wedding",
      tagline: "It's a bride's trousseau… but really, it's a trousseau of rewards",
      desc: "Want to donate in the last ten nights with maximum impact? You're in the right place. Reward is multiplied 700x, you bring joy to a Muslim, and Allah shields whoever shields a Muslim. One share is just 250 EGP.",
      benefits: [
        "Complete preparation of a new apartment (bedroom, living room, kitchen, appliances)",
        "Priority for orphan and widow daughters",
        "Detailed field research before selection",
        "Your 250 EGP share inside a full project",
        "Continuous reward: bringing joy & shelter",
        "A photo report for every bride after preparation",
      ],
      longContent: [
        "It is a bride's trousseau… yes. But in reality it's a trousseau of rewards that keeps writing good deeds for you every second. Every piece in that apartment becomes ongoing charity for you and your family.",
        "Want to donate in the last ten nights of Ramadan with the greatest impact? You are exactly in the right place. The reward in those nights is multiplied by 700, bringing joy to a Muslim is among the most beloved deeds, and whoever shields a Muslim, Allah will shield them on the Day of Judgement.",
        "All this good is within reach with a small donation — one share is only 250 EGP, inside a complete bride preparation project (bedroom, living room, kitchen, appliances, bride's clothing).",
        "Send us the word \"Donate\" on WhatsApp and hurry before it's too late — we've gathered 9 out of 15 brides, only 6 left to complete the joy.",
      ],
    },
  },
  {
    slug: "shelter",
    image: shelter,
    priceFrom: 500,
    ar: {
      name: "برنامج ستر — تسقيف وترميم المنازل",
      tagline: "من ستر مسلمًا ستره الله — برنامج حماية الأسرة من البرد والحر",
      desc: "برنامج ميداني يركز على تسقيف وترميم بيوت الأسر الأشد فقرًا في الدقهلية وكفر الشيخ، بأسقف عازلة وأبواب وشبابيك آمنة.",
      benefits: [
        "تسقيف بمواد عازلة من البوتامين والخشب",
        "تركيب أبواب وشبابيك تحفظ كرامة الأسرة",
        "أولوية لقرى الدقهلية والحفير بكفر الشيخ",
        "تقرير صور قبل/بعد لكل بيت",
      ],
      longContent: [
        "برنامج «ستر» يعمل في فترات الشتاء والصيف لتأمين الأسر من تقلبات الجو، مع تركيز واضح على منازل الأسر الأشد احتياجًا. في 2025 سقّفنا 70 منزلًا بمساحة 8361 مترًا.",
        "السهم يبدأ من 500 ج، والبيت الكامل يبدأ من 9000 ج. كل قطعة خشب تتحول لصدقة جارية تحمي الأسرة من برد الشتاء أو حر الصيف.",
      ],
    },
    en: {
      name: "Sitr Shelter Program — Roofing & Repair",
      tagline: "Whoever shields a Muslim, Allah will shield him — a shelter program for families",
      desc: "A field program focused on roofing and repairing the homes of the poorest families in Dakahlia and Kafr El-Sheikh with insulated materials, safe doors and windows.",
      benefits: [
        "Roofing with bitumen and wood insulation",
        "Doors and windows that preserve dignity",
        "Priority for Dakahlia and Hafir villages",
        "Before/after photo report for every home",
      ],
      longContent: [
        "The Sitr program runs across winter and summer to protect families from harsh weather, with a special focus on the most vulnerable homes. In 2025 we roofed 70 homes spanning 8,361 m².",
        "Shares start at 500 EGP and a complete home from 9,000 EGP. Every piece of wood becomes ongoing charity protecting a family from winter cold and summer heat.",
      ],
    },
  },
  {
    slug: "orphans",
    image: orphans,
    priceFrom: 300,
    ar: {
      name: "كفالة يتيم",
      tagline: "كافل اليتيم في الجنة كهاتين — كفالة شاملة شهرية",
      desc: "كفالة مادية ومعنوية وتعليمية شاملة ليتيم في الدقهلية، تشمل المصروف الشهري والمأكل والملبس وفرص التعليم.",
      benefits: [
        "كفالة شهرية ثابتة من 300 ج",
        "متابعة تعليمية وصحية كل 3 شهور",
        "أولوية لأبناء الأرامل وحالات الأشد فقرًا",
        "تقرير دوري عن حال اليتيم",
      ],
      longContent: [
        "كفالة اليتيم عند اليسر مش مجرد مبلغ شهري — دي رعاية متكاملة بنغطي بيها احتياجات الطفل المادية والمعنوية والتعليمية.",
        "في 2025 كفلنا تعليميًا 354 طالبًا، وبنطمح نوصل لكفالات أوسع مع كل متبرع جديد.",
      ],
    },
    en: {
      name: "Orphan Sponsorship",
      tagline: "Sponsor of the orphan is with me in Paradise — full monthly sponsorship",
      desc: "Comprehensive financial, emotional, and educational sponsorship of an orphan in Dakahlia — covering monthly stipend, food, clothing, and schooling.",
      benefits: [
        "Fixed monthly sponsorship from 300 EGP",
        "Educational & health follow-up every 3 months",
        "Priority for widows' children and most urgent cases",
        "Periodic report on the orphan's wellbeing",
      ],
      longContent: [
        "Orphan sponsorship at Al-Yusr isn't just a monthly amount — it's integrated care covering the child's material, emotional, and educational needs.",
        "In 2025 we educationally sponsored 354 students and continue to grow with every new donor.",
      ],
    },
  },
  {
    slug: "treatment",
    image: health,
    priceFrom: 200,
    ar: {
      name: "سهم علاج وقوافل طبية",
      tagline: "دواء، عملية جراحية، أو قافلة طبية — سهمك ينقذ حياة",
      desc: "دعم الحالات الحرجة بالأدوية والعمليات الجراحية، وتشغيل قوافل طبية ومركز غسيل كلوي بالمنزلة لخدمة المناطق النائية.",
      benefits: [
        "تغطية أدوية شهرية للأمراض المزمنة",
        "عمليات جراحية عاجلة بعد بحث طبي",
        "قوافل طبية تخصصية للقرى",
        "مركز غسيل كلوي مجاني بالمنزلة",
      ],
      longContent: [
        "سهم العلاج بيغطي أدوية الأمراض المزمنة، وعمليات قلب وعظام وعيون عاجلة، وجلسات علاج طبيعي للحالات الميؤوس منها.",
        "وراء السهم ده مجمّع طبي كامل بالدقهلية ومركز غسيل كلوي وقوافل تخصصية بتجوب القرى البعيدة.",
      ],
    },
    en: {
      name: "Treatment & Medical Convoys",
      tagline: "Medicine, surgery, or a medical convoy — your share saves a life",
      desc: "Support critical cases with medicine and surgeries, and run medical convoys plus a kidney dialysis center in El-Manzala serving remote areas.",
      benefits: [
        "Monthly medication for chronic diseases",
        "Urgent surgeries after medical screening",
        "Specialty medical convoys to villages",
        "Free kidney dialysis center in El-Manzala",
      ],
      longContent: [
        "The treatment share covers chronic-disease medication, urgent heart, ortho and eye surgeries, and intensive physiotherapy for hopeless cases.",
        "Behind it stands a full medical complex in Dakahlia, a dialysis center, and specialty convoys reaching remote villages.",
      ],
    },
  },
  {
    slug: "prosthetics",
    image: Prosthetics,
    priceFrom: 1000,
    ar: {
      name: "تحدّي الإعاقة — أطراف صناعية وكراسي متحركة",
      tagline: "إعاقة جسد لا تعني نهاية حلم — أطراف صناعية وكراسي متحركة",
      desc: "دعم ذوي الهمم بالأطراف الصناعية والكراسي المتحركة وإعادة دمجهم في المجتمع بشكل كامل.",
      benefits: [
        "أطراف صناعية مخصصة لكل حالة",
        "كراسي متحركة وأجهزة مساعدة",
        "متابعة نفسية ودمج اجتماعي",
        "ربط مع فرص عمل مناسبة",
      ],
      longContent: [
        "مشروع «تحدّي الإعاقة» بيوفّر للأشخاص ذوي الإعاقة الأطراف الصناعية والكراسي والأجهزة اللي ترجّعهم لحياتهم الطبيعية.",
        "بنشتغل على إعادة الدمج المجتمعي وربطهم بفرص عمل تحفظ كرامتهم وتمنحهم استقلال مادي.",
      ],
    },
    en: {
      name: "Overcoming Disability — Prosthetics & Wheelchairs",
      tagline: "A disabled body is not the end of a dream — prosthetics and wheelchairs",
      desc: "Support people of determination with custom prosthetics, wheelchairs, and full reintegration into society.",
      benefits: [
        "Prosthetics tailored to each case",
        "Wheelchairs and assistive devices",
        "Psychological follow-up & social integration",
        "Linkage to suitable employment",
      ],
      longContent: [
        "“Overcoming Disability” provides people with disabilities the prosthetics, wheelchairs, and devices that return them to normal life.",
        "We focus on social reintegration and connecting them with employment that preserves dignity and grants financial independence.",
      ],
    },
  },
  {
    slug: "kitchen",
    image: kitchen,
    priceFrom: 50,
    ar: {
      name: "مطبخ اليسر — وجبة ساخنة",
      tagline: "آلاف الوجبات الساخنة يوميًا للصائمين والمسافرين ومرافقي المرضى",
      desc: "إنتاج وجبات ساخنة طازجة يوميًا من مطبخنا الدائم وتوزيعها على الصائمين، المسافرين، ومرافقي المرضى أمام المستشفيات.",
      benefits: [
        "وجبة ساخنة بـ 50 ج فقط",
        "تشغيل يومي طوال السنة",
        "تركيز على المسافرين ومرافقي المرضى",
        "وجبات إفطار ضخمة في رمضان",
      ],
      longContent: [
        "مطبخ اليسر بيشتغل طول السنة، وبيكثّف خدمته في رمضان لتوصيل الإفطار للصائم في الشارع وأمام المستشفيات.",
        "كل وجبة ساخنة بـ 50 ج بس — تبرعك بيتحول مباشرة لطبق طازج يوصل لمن يحتاجه.",
      ],
    },
    en: {
      name: "Al-Yusr Kitchen — Hot Meal",
      tagline: "Thousands of hot meals daily for fasters, travelers, and patients' companions",
      desc: "Daily fresh hot meals from our permanent kitchen, distributed to fasters, travelers, and patients' companions outside hospitals.",
      benefits: [
        "A hot meal for just 50 EGP",
        "Year-round daily operation",
        "Focus on travelers and patients' companions",
        "Mass iftar meals in Ramadan",
      ],
      longContent: [
        "Al-Yusr Kitchen runs all year, intensifying in Ramadan to deliver iftar to fasters on the street and outside hospitals.",
        "Every hot meal is just 50 EGP — your donation turns directly into a fresh plate reaching someone in need.",
      ],
    },
  },
  {
    slug: "markoun",
    image: markounPuzzle,
    priceFrom: 0,
    gallery: [markounWardrobe, markounFurniture, posterDelivery, posterMedBottle, markounPuzzle],
    ar: {
      name: "حملة مركون — أول حملة مصرية تُحيي أسرة بالمركون في بيتك",
      tagline: "كنزك المركون.. يبني حياة لغيرك!",
      desc: "في زوايا بيوتنا الكثير من الأشياء التي لم نعد نستخدمها ولكنها لأسر أخرى تُمثّل حلماً طال انتظاره. نحن لا نجمع مجرد أغراض فائضة، بل نعيد صياغة الأمل وننقل الدفء والاستقرار من بيوتكم إلى بيوت أهالينا المستحقين.",
      benefits: [
        "الأثاث المنزلي: غرف نوم وأسرة وخزائن لتجهيز بيوت المحتاجين",
        "الأجهزة الكهربائية: ثلاجات وغسالات ومراوح وبوتاجازات",
        "الملابس والكساء: فرز وتنظيف وإعادة تقديم بكرامة تامة",
        "الصيدلية المستدامة: فرز الأدوية الصالحة تحت إشراف طبي وتوزيعها مجاناً",
        "المعرفة والتعليم: كتب مدرسية وثقافية لإعادة تدوير المعرفة",
        "راحة المتبرع: مندوب المؤسسة يصلك حتى باب المنزل (01097000137)",
      ],
      longContent: [
        "«حملة مركون» هي أول حملة مصرية تنطلق برؤية فريدة: أن تبني حياة كريمة وتُعمر بيوتاً من كنزٍ مركون في منزلك. نحن لا نجمع مجرد أغراض فائضة، بل نعيد صياغة الأمل وننقل الدفء والاستقرار من بيوتكم إلى بيوت أهالينا المستحقين.",
        "نعتمد على نظام رقمي وقواعد بيانات دقيقة تضمن ذهاب كل قطعة تبرع عيني إلى مكانها الصحيح والأنسب لاحتياج الأسرة الفعلي، مع فحص وتأهيل وصيانة دقيقة لتصل للمستفيدين وكأنها جديدة تماماً.",
        "وفرنا منظومة حركية متكاملة؛ لست بحاجة للتحرك من منزلك، بمجرد تواصلك معنا (01097000137)، يتوجه مندوبنا الرسمي بمركبات المؤسسة لاستلام التبرعات وتوثيقها بشكل احترافي.",
      ],
    },
    en: {
      name: "Markoun Campaign — Egypt's 1st In-Kind Reuse Initiative",
      tagline: "Your stored items.. build a new life for others!",
      desc: "Transform unused home treasures into dignified essentials for underprivileged families across furniture, appliances, clothing, medicine, and books.",
      benefits: [
        "Home furniture: bedrooms, beds, wardrobes for needy homes",
        "Appliances: fridges, washers, fans, stoves",
        "Clothing: sorted, cleaned, and presented with full dignity",
        "Sustainable Pharmacy: valid medication checked by medical staff",
        "Books & Education: school and cultural books redistributed",
        "Doorstep pickup service by official delegates: 01097000137",
      ],
      longContent: [
        "Markoun is the first Egyptian initiative dedicated to restoring and matching surplus household goods with validated deserving families, preserving donor convenience and recipient dignity.",
      ],
    },
    season: { ar: "حملة مفتوحة على مدار العام", en: "Open year-round" },
  },
  {
    slug: "arboun",
    image: education,
    priceFrom: 150,
    ar: {
      name: "مبادرة عربون خير — للفريلانسرز والمستقلين",
      tagline: "اتصدق النهاردة.. وخليه عربون لرزق بكرة!",
      desc: "مبادرة مبتكرة بتجمع مجتمع الفريلانسرز والمستقلين عشان يستثمروا جزء بسيط من أرباح مشاريعهم في الآخرة كزكاة مهنة وبركة للرزق وتيسير لأبواب الخير.",
      benefits: [
        "علاج القلق وضغط الشغل وتيسير التعامل مع العملاء",
        "زكاة المهنة وشكر نعمة المهارة والوقت",
        "استثمار مضمون في الآخرة ورصيد حسنات دائم",
        "شارة «مستقل داعم» رقمية للبورتفوليو والموقع الشخصي",
        "توجيه التبرعات لتيسير الزواج، كفالة الأيتام، والصدقات الجارية",
      ],
      longContent: [
        "مبادرة «عربون خير» فكرة مبتكرة موجهة لمجتمع الفريلانسرز والشباب العاملين في مجالات العمل الحر والتقني والخدمي. أول ما تقفّل المشروع وتستلم أرباحك، بتحدد نسبة مرنة (1% أو 5% أو أي مبلغ) يخرج كصدقة جارية.",
        "الصدقة بتطمن القلب، بتشيل ضغط وتوتر تسليم المشاريع، وبتفتح أبواب لعملاء جدد تصديقاً لقوله ﷺ «ما نقص مال من صدقة».",
        "كل تبرع بيتحول مباشرة لمشاريع تنموية موثقة: تيسير زواج يتيمات بأجهزة معمرة، كفالة أيتام، بناء أسقف وتركيب وصالت مياه، وإغاثة غذائية تحت إشراف مؤسسة اليسر (مشهرة برقم 2665 لسنة 2019).",
      ],
    },
    en: {
      name: "Arboun Khair — Freelancers Initiative",
      tagline: "Donate today.. make it a pledge for tomorrow's blessing!",
      desc: "An innovative initiative uniting freelancers to dedicate a flexible portion of project earnings to charity — inviting barakah, focus, and peace of mind.",
      benefits: [
        "Relieves client stress and market anxiety",
        "Acts as Zakat on professional craft and skills",
        "Guaranteed eternal impact and ongoing reward",
        "Digital 'Impact Freelancer' badge for your portfolio",
        "Funds bride setups, orphan education, and water taps",
      ],
      longContent: [
        "Arboun Khair empowers remote workers and freelancers to seamlessly link project milestones with charitable giving. Allocate 1-5% of project earnings upon client payout to build lasting community assets.",
        "All donations disburse into registered projects by Al-Yusr Charity Foundation (License No. 2665 of 2019) with transparent digital reports and portfolio verification badges.",
      ],
    },
    season: { ar: "مبادرة مستمرة", en: "Ongoing initiative" },
  },
];

export const getProgram = (slug: string) => programs.find((p) => p.slug === slug);