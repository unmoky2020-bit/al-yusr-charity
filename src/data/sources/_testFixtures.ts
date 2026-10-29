/**
 * Trimmed records recorded from GET http://localhost:8080/api/v1/<resource> on 2026-10-29
 * (shapes match backend-handoff/_live_api_field_shapes.md). Used only by the *.test.ts files.
 */
export const API_PROGRAM_ORPHANS = {
  id: 41,
  slug: "orphans",
  name: "كفالة يتيم",
  name_ar: "كفالة يتيم",
  name_en: "Orphan Sponsorship",
  title_ar: "كفالة يتيم",
  title_en: "Orphan Sponsorship",
  top_section: {
    badge_ar: "برنامج معتمد",
    subtitle_ar: "كافل اليتيم في الجنة كهاتين — كفالة شاملة شهرية",
    subtitle_en: "Sponsor of the orphan is with me in Paradise — full monthly sponsorship",
    image: null,
    minimum_amount: "300.00",
  },
  axis: { id: 8, slug: "education", name_ar: "التعليم", name_en: "Education" },
  period_ar: "برنامج مستمر طوال العام",
  tagline_ar: "كافل اليتيم في الجنة كهاتين — كفالة شاملة شهرية",
  tagline_en: "Sponsor of the orphan is with me in Paradise — full monthly sponsorship",
  description: "كفالة مادية ومعنوية وتعليمية شاملة ليتيم في الدقهلية، تشمل المصروف الشهري والمأكل والملبس وفرص التعليم.",
  description_ar: "كفالة مادية ومعنوية وتعليمية شاملة ليتيم في الدقهلية، تشمل المصروف الشهري والمأكل والملبس وفرص التعليم.",
  description_en:
    "Comprehensive financial, emotional, and educational sponsorship of an orphan in Dakahlia — covering monthly stipend, food, clothing, and schooling.",
  content_ar:
    "كفالة اليتيم عند اليسر مش مجرد مبلغ شهري — دي رعاية متكاملة.\r\n\r\nبنتابع كل يتيم تابعلنا بزيارات ميدانية منتظمة.\r\n\r\nفي 2025 كفلنا تعليميًا 354 طالبًا.",
  content_en: null,
  benefits_ar: ["كفالة شهرية ثابتة تبدأ من 300 جنيه", "متابعة تعليمية وصحية كل 3 شهور"],
  benefits_en: [],
  image: "https://api.elyusr.org/storage/programs/CG3a64SBRbzP8z7Giwvwk4AgNlkhZeY3YmBg716B.webp",
  minimum_amount: "300.00",
  donation_packages: [
    { id: 42, program_id: 41, name_ar: "سهم مساهمة كفالة يتيم 150 ج", name_en: "Partial Orphan Sponsorship 150 EGP", amount: "150.00", sort_order: 1, is_active: true },
    { id: 43, program_id: 41, name_ar: "كفالة يتيم شهرية شاملة غذاء ودراسة", name_en: "Full Monthly Orphan Sponsorship", amount: "600.00", sort_order: 2, is_active: true },
    { id: 45, program_id: 41, name_ar: "كفالة يتيم سنوية متكاملة", name_en: "Annual Full Orphan Sponsorship", amount: "7200.00", sort_order: 4, is_active: true },
  ],
  cases: [],
  status: "published",
  is_active: true,
  hide_from_audience: false,
  sort_order: 0,
};

/** Unpublished record: must NOT replace the static program. */
export const API_PROGRAM_ZAKAT_INACTIVE = {
  id: 36,
  slug: "zakat",
  name_ar: "زكاة المال (نسخة غير منشورة)",
  status: "published",
  is_active: false,
  hide_from_audience: false,
};

/** A junk slug saved as a URL in the live DB. */
export const API_PROGRAM_URL_SLUG = {
  id: 42,
  slug: "https://elyusr.org/food-box",
  name_ar: "البروتين الشهري",
  status: "published",
  is_active: true,
  hide_from_audience: false,
};

export const API_CAMPAIGN_ZELL = {
  id: 17,
  name_ar: "حملة ظل",
  name_en: "Zell Campaign",
  slug: "zell",
  description_ar: "ساهم في حملة ظل من مؤسسة اليسر الخيرية: أسقف منازل خشبية ووصلات مياه نقية.",
  description_en: "Support the Zell campaign by Al-Yusr Foundation: roofs, clean-water connections.",
  image: "https://api.elyusr.org/storage/donation-campaigns/5Y8hnXILmSLt58eSGMWeWvd7Pyi5sPqIcYgNCkNl.webp",
  minimum_amount: "500.00",
  is_active: true,
  sort_order: 1,
  donation_packages: [
    { id: 48, donation_campaign_id: 17, name_ar: "سهم سقف خشبي", name_en: "Roof Share", amount: "500.00", sort_order: 1, is_active: true },
    { id: 50, donation_campaign_id: 17, name_ar: "وصلة مياه كاملة بالتركيب والموتور", name_en: "Complete Water Connection", amount: "7500.00", sort_order: 3, is_active: true },
    { id: 99, donation_campaign_id: 17, name_ar: "باقة معطلة", name_en: null, amount: "1.00", sort_order: 9, is_active: false },
  ],
  cases: [],
};

export const API_PROJECT_WATER_STATION = {
  id: 24,
  name: "محطة مياه الاسماعليه",
  name_en: "Clean Water Station",
  slug: "water-station-dakahlia-39280",
  description: "محطة مياه الاسماعليه",
  short_description: "محطة مياه",
  short_description_en: "Water station",
  target_amount: "80000.00",
  collected_amount: "1000.00",
  starting_price: "100.00",
  display_order: 1,
  cover_image: "https://api.elyusr.org/storage/projects/xR4yqku2jU3apNBtatgl9tfVGJ8uJAu3mWvUq6V9.jpg",
  is_active: true,
  donation_packages: [{ id: 17, project_id: 24, name_ar: "باقة المحطات", name_en: null, amount: "80000.00", sort_order: 0, is_active: true }],
  cases: [
    {
      id: 21,
      project_id: 24,
      category_id: 1,
      code: "hjd0vvn350",
      title: "اسرة محتاجه مياه",
      beneficiary_name: "Ahmed Mohamed Family",
      target_amount: "500000.00",
      status: "approved",
      priority: "medium",
      governorate: "Dakahlia",
    },
  ],
};

export const API_GALLERY = [
  {
    id: 1,
    image: "https://api.elyusr.org/storage/gallery/4EVBiqIycVCsmL8f5CQGeMWuhRgjdRG6z0ZaNbpK.png",
    external_url: null,
    title_ar: "عنوان الصورة",
    title_en: "Image Title",
    alt_ar: "وصف الصورة للبحث",
    alt_en: "Image description for search",
    city: "Mansoura",
    program: "عام",
    donation_program: "odhya, box, water",
    sort_order: 54,
    is_featured: false,
    is_public: true,
  },
  {
    id: 94,
    image: "https://api.elyusr.org/storage/gallery/Cv6vslE0fX78Uiv3nsR3jAhS7pa9uemmoXpeFZyC.webp",
    external_url: null,
    title_ar: "projects",
    title_en: "projects",
    alt_ar: null,
    alt_en: null,
    city: null,
    program: null,
    donation_program: null,
    sort_order: 0,
    is_featured: false,
    is_public: true,
  },
  { id: 95, image: "https://api.elyusr.org/storage/gallery/hidden.webp", title_ar: "مخفية", is_public: false },
];

export const API_BLOG_SEO_PUBLISHED = {
  id: 2,
  content_id: 3,
  slug: "importance-of-zakat",
  title_ar: "عنوان المقال الجديد",
  title_en: "The Importance of Zakat",
  summary_ar: "الملخص الجديد",
  summary_en: "An educational article about the importance of Zakat.",
  content_ar: "الفقرة الأولى.\n\nالفقرة الثانية.",
  content_en: "Article content here...",
  cover_image: null,
  category_ar: "مجتمع",
  category_en: "Zakat",
  tags_ar: ["خير", "تبرعات", "مجتمع"],
  tags_en: ["zakat", "charity", "islam"],
  workflow_status: "published",
  published_at: "2026-09-10T14:23:41.000000Z",
  created_at: "2026-09-10T14:23:41.000000Z",
};

export const API_BLOG_SEO_DRAFT = {
  id: 1,
  slug: "water-project-2026",
  title_ar: "مشروع المياه الجديد في الدقهلية",
  workflow_status: "draft",
  created_at: "2026-09-09T06:45:03.000000Z",
};

export const API_AXIS_FOOD = {
  id: 6,
  slug: "food",
  name_ar: "الغذاء",
  name_en: "Food",
  description_ar: "بنوفّر غذاء كريم لأكثر الأسر احتياجًا",
  description_en: "We provide dignified food",
  badge_ar: "محور الغذاء",
  badge_en: "Food Axis",
  sort_order: 1,
  is_active: true,
  programs: [
    { id: 35, name: "صك الأضحية", description: "صك أضحية بنفس جودة اللحمة.", is_active: false },
    { id: 40, name: "جواز عروسة", description: "سعر السهم 250 ج فقط.", is_active: true },
  ],
};

/** PROPOSED /services record (endpoint does not exist yet) — shape documented in 06-public-content-api.md. */
export const API_SERVICE_WELLS = {
  id: 2,
  slug: "wells",
  program_slug: "water",
  hero_image: null,
  title_ar: "حفر الآبار وشبكات المياه (API)",
  title_en: "Wells & Water Networks (API)",
  intro_ar: "مقدمة من الـ API",
  bullets_ar: ["بند أول", "بند ثاني"],
  stats: [{ value_ar: "750م", value_en: "750m", label_ar: "شبكات", label_en: "pipelines" }],
  features: [{ icon: "Droplets", title_ar: "مياه نظيفة", title_en: "Clean water", desc_ar: "وصف", desc_en: "desc" }],
  tiers: [{ amount: "500", unit_ar: "سهم", unit_en: "Share", desc_ar: "وصف", desc_en: "desc", highlight: true }],
  related: [{ url: "/services/farm", label_ar: "المزرعة", label_en: "Farm" }],
  is_active: true,
  sort_order: 1,
};
