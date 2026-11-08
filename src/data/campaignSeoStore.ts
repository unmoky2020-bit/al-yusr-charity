/**
 * Campaign SEO Store & Preset Data (from Official Campaign Landing Pages PDF)
 * Provides curated SEO metadata used as defaults for an empty SEO form. Not a storage layer.
 */

export interface CampaignSeoData {
  meta_title_ar: string;
  meta_title_en: string;
  meta_description_ar: string;
  meta_description_en: string;
  focus_keywords_ar: string;
  focus_keywords_en: string;
  canonical_url?: string;
  noindex?: boolean;
  nofollow?: boolean;
  og_image?: string;
  suggested_articles?: Array<{
    title_ar: string;
    title_en: string;
    target_keyword_ar: string;
    target_keyword_en: string;
  }>;
  impact_regions_ar?: string;
  impact_regions_en?: string;
  impact_stats_ar?: string;
  impact_stats_en?: string;
}

export const OFFICIAL_CAMPAIGN_SEO_PRESETS: Record<string, CampaignSeoData> = {
  // 01 — Zell Campaign (حملة ظل)
  zell: {
    meta_title_ar: "حملة ظل | أسقف ووصلات مياه صدقة جارية للأسر المستحقة — مؤسسة اليسر",
    meta_title_en: "Zell Campaign | Roofs & Clean Water as Ongoing Charity — Al-Yusr Charity Foundation",
    meta_description_ar: "ساهم في حملة ظل من مؤسسة اليسر الخيرية: أسقف منازل ووصلات مياه نقية وأبواب وشبابيك ومراوح لأسر مستحقة، بأسهم تبدأ من 500 جنيه وصدقة جارية.",
    meta_description_en: "Support the Zell campaign by Al-Yusr Charity Foundation: roofs, clean-water connections, doors, windows and fans for families in need. Shares start at EGP 500 — all ongoing charity.",
    focus_keywords_ar: "حملة ظل، تسقيف منازل، تبرع لبناء سقف، وصلة مياه صدقة جارية، سقيا الماء، صدقة جارية، مؤسسة اليسر الخيرية",
    focus_keywords_en: "Zell campaign, donate a roof, clean water connection, sadaqah jariyah, Al-Yusr Charity Foundation",
    canonical_url: "https://elyusr.org/campaigns/zell",
    noindex: false,
    nofollow: false,
    impact_regions_ar: "الدقهلية، كفر الشيخ، الشرقية، الفيوم، الإسماعيلية، الوادي الجديد، سوهاج، قنا",
    impact_regions_en: "Dakahlia, Kafr El-Sheikh, Sharqia, Fayoum, Ismailia, New Valley, Sohag, Qena",
    impact_stats_ar: "8 محافظات وصلها الدعم منذ 2021",
    impact_stats_en: "8 governorates reached since 2021",
    suggested_articles: [
      {
        title_ar: "فضل سقيا الماء: لماذا تُعد وصلات المياه من أفضل الصدقات الجارية؟",
        title_en: "The virtue of giving water: why water connections are among the best ongoing charities",
        target_keyword_ar: "سقيا الماء صدقة جارية",
        target_keyword_en: "water as sadaqah jariyah",
      },
      {
        title_ar: "تكلفة تسقيف منزل لأسرة فقيرة وكيف تشارك بسهم 500 جنيه",
        title_en: "The cost of roofing a poor family's home and how to contribute with a EGP 500 share",
        target_keyword_ar: "تبرع لتسقيف منزل",
        target_keyword_en: "donate to roof a house",
      },
      {
        title_ar: "أفكار صدقة جارية عن الوالدين المتوفين",
        title_en: "Ongoing charity ideas on behalf of deceased parents",
        target_keyword_ar: "صدقة جارية عن الوالدين",
        target_keyword_en: "sadaqah jariyah for parents",
      },
    ],
  },

  // 02 — Sitr Campaign (حملة ستر)
  sitr: {
    meta_title_ar: "حملة ستر | دفء الشتاء للأسر المستحقة — مؤسسة اليسر الخيرية",
    meta_title_en: "Sitr Campaign | Winter Warmth for Families in Need — Al-Yusr Charity Foundation",
    meta_description_ar: "تبرع لحملة ستر من مؤسسة اليسر الخيرية: أسقف وأبواب وشبابيك وأسِرّة ومراتب وألحفة فايبر وكسوة شتوية للأسر المستحقة. تنطلق في أكتوبر وتمتد حتى فبراير.",
    meta_description_en: "Donate to the Sitr campaign by Al-Yusr Charity Foundation: roofs, doors, windows, beds, mattresses, fiber quilts and winter clothing for families in need. Runs from October to February.",
    focus_keywords_ar: "حملة ستر، صدقة الشتاء، تبرع بألحفة وبطاطين، كسوة الشتاء للفقراء، مساعدة الأسر المحتاجة في الشتاء، مؤسسة اليسر الخيرية",
    focus_keywords_en: "Sitr campaign, winter charity Egypt, donate quilts, winter clothing for the poor, Al-Yusr Charity Foundation",
    canonical_url: "https://elyusr.org/campaigns/sitr",
    noindex: false,
    nofollow: false,
    impact_regions_ar: "محافظات الدلتا والصعيد وقرى الدقهلية الأكثر برودة",
    impact_regions_en: "Delta and Upper Egypt villages in need of winter insulation",
    impact_stats_ar: "تنطلق سنويًا من أكتوبر وتمتد حتى فبراير لمواجهة موجات البرد",
    impact_stats_en: "Runs annually from October to February",
    suggested_articles: [
      {
        title_ar: "فضل ستر المسلم وكسوة الفقير في الشتاء",
        title_en: "The virtue of shielding a Muslim and clothing the poor in winter",
        target_keyword_ar: "فضل كسوة الفقير",
        target_keyword_en: "virtue of clothing the poor",
      },
      {
        title_ar: "كيف تساعد أسرة محتاجة على مواجهة برد الشتاء؟",
        title_en: "How can you help a family in need face winter cold?",
        target_keyword_ar: "مساعدة الأسر المحتاجة في الشتاء",
        target_keyword_en: "helping needy families in winter",
      },
      {
        title_ar: "أفكار صدقات الشتاء: من الألحفة إلى الأسقف",
        title_en: "Winter charity ideas: from quilts to roofs",
        target_keyword_ar: "صدقات الشتاء",
        target_keyword_en: "winter charity ideas",
      },
    ],
  },

  // 03 — Markoon Campaign (حملة مركون)
  markoon: {
    meta_title_ar: "حملة مركون | تبرع بالأثاث والأجهزة والملابس والأدوية والكتب — اليسر",
    meta_title_en: "Markoon Campaign | Donate Furniture, Appliances, Clothes, Medicine & Books — Al-Yusr",
    meta_description_ar: "تبرع بما هو مركون في بيتك: أثاث وأجهزة كهربائية وملابس وأدوية وكتب. مندوب المؤسسة يصلك حتى باب المنزل لاستلام تبرعاتك وتوثيقها. اتصل 01097000137.",
    meta_description_en: "Donate what is stored away at home: furniture, appliances, clothes, medicine and books. Our representative comes to your door to collect and document your donation. Call 01097000137.",
    focus_keywords_ar: "حملة مركون، تبرع بالأثاث، تبرع بالأجهزة الكهربائية، تبرع بالملابس المستعملة، تبرع بالأدوية، تبرع بالكتب، مندوب لاستلام التبرعات",
    focus_keywords_en: "Markoon campaign, donate furniture Egypt, donate used clothes, donate medicine, donate books, donation pickup",
    canonical_url: "https://elyusr.org/campaigns/markoon",
    noindex: false,
    nofollow: false,
    impact_regions_ar: "المنصورة، طلخا، ومراكز الدقهلية الكبرى مع أسطول سيارات مجهز",
    impact_regions_en: "Mansoura, Talkha, and Dakahlia centers with dedicated pickup vehicles",
    impact_stats_ar: "أول حملة مصرية تُحيي أسرًا بالمركون في البيوت",
    impact_stats_en: "First Egyptian campaign reviving families with surplus household items",
    suggested_articles: [
      {
        title_ar: "ماذا تفعل بالأثاث والأجهزة القديمة؟ تبرع بها لأسرة محتاجة",
        title_en: "What to do with old furniture and appliances? Donate them to a family in need",
        target_keyword_ar: "التبرع بالأثاث المستعمل",
        target_keyword_en: "donate used furniture",
      },
      {
        title_ar: "التبرع بالملابس المستعملة: كيف تصل بكرامة لمن يحتاجها؟",
        title_en: "Donating used clothes: how do they reach those in need with dignity?",
        target_keyword_ar: "التبرع بالملابس المستعملة",
        target_keyword_en: "donate used clothes",
      },
      {
        title_ar: "التبرع بالأدوية الفائضة: ما الذي يجب أن تعرفه؟",
        title_en: "Donating surplus medicine: what you should know",
        target_keyword_ar: "التبرع بالأدوية",
        target_keyword_en: "donate medicine",
      },
    ],
  },

  // 04 — Season of Goodness (Ramadan) (موسم الخير - رمضان)
  ramadan: {
    meta_title_ar: "موسم الخير في رمضان | كرتونة الخير وإفطار صائم وزكاة الفطر — اليسر",
    meta_title_en: "Season of Goodness in Ramadan | Food Boxes, Iftar Meals & Zakat — Al-Yusr",
    meta_description_ar: "رمضانك في اليسر إحسان لا ينقطع: كرتونة الخير 25 كيلو، وجبات إفطار ساخنة، ذبائح، تيسير زواج، كسوة وكعك العيد، وزكاة المال وزكاة الفطر.",
    meta_description_en: "Your Ramadan with Al-Yusr is endless giving: 25 kg food boxes, hot iftar meals, meat distribution, marriage support, Eid clothes and cookies, plus Zakat al-Mal and Zakat al-Fitr.",
    focus_keywords_ar: "تبرعات رمضان، كرتونة رمضان، إفطار صائم، زكاة الفطر، زكاة المال، كسوة العيد، كعك العيد، مؤسسة اليسر الخيرية",
    focus_keywords_en: "Ramadan donations, Ramadan food box, feed a fasting person, Zakat al-Fitr, Zakat al-Mal, Eid clothes, Al-Yusr Charity Foundation",
    canonical_url: "https://elyusr.org/campaigns/ramadan",
    noindex: false,
    nofollow: false,
    impact_regions_ar: "المنصورة ومحافظات الدلتا والمستشفيات وعابري السبيل",
    impact_regions_en: "Mansoura, Delta governorates, hospitals and passers-by",
    impact_stats_ar: "أكثر من 2 طن لحوم بلدي وآلاف وجبات الإفطار والكراتين في رمضان",
    impact_stats_en: "Over 2 tons of meat and thousands of hot meals and food boxes",
    suggested_articles: [
      {
        title_ar: "أفضل أفكار الصدقة في رمضان: كيف تضاعف أجرك؟",
        title_en: "The best charity ideas in Ramadan: how to multiply your reward",
        target_keyword_ar: "صدقة رمضان",
        target_keyword_en: "Ramadan charity ideas",
      },
      {
        title_ar: "الفرق بين زكاة المال وزكاة الفطر ومتى تُخرج كل منهما",
        title_en: "The difference between Zakat al-Mal and Zakat al-Fitr and when to pay each",
        target_keyword_ar: "زكاة المال وزكاة الفطر",
        target_keyword_en: "Zakat al-Mal vs Zakat al-Fitr",
      },
      {
        title_ar: "فضل إطعام الصائم وطرق المشاركة في الإفطار",
        title_en: "The virtue of feeding a fasting person and ways to take part",
        target_keyword_ar: "إفطار صائم",
        target_keyword_en: "feed a fasting person",
      },
    ],
  },

  // 05 — Athar Campaign (حملة أثر)
  athar: {
    meta_title_ar: "حملة أثر | حقيبة وأدوات مدرسية ومصروفات لطلاب محتاجين — اليسر",
    meta_title_en: "Athar Campaign | School Bags, Supplies & Fees for Students in Need — Al-Yusr",
    meta_description_ar: "شنطة وقلم النهاردة.. أثر يعيش ويغيّر بكرا. ادعم طالبًا بحقيبة وأدوات وزي مدرسي ومصروفات، وشارك في مبادرة استدامة وحضانات ودور تحفيظ القرآن.",
    meta_description_en: "A bag and a pencil today… an impact that lives and changes tomorrow. Support a student with a bag, supplies, uniform and fees, and join Istidama, nurseries and Quran memorisation centres.",
    focus_keywords_ar: "حملة أثر، تبرع للتعليم، شنطة مدرسية للأيتام، مصاريف دراسية للطلاب المحتاجين، الزي المدرسي، دور تحفيظ القرآن، حضانات",
    focus_keywords_en: "Athar campaign, donate for education, school bags for orphans, school fees for students in need, school uniform, Quran memorisation centre, nurseries",
    canonical_url: "https://elyusr.org/campaigns/athar",
    noindex: false,
    nofollow: false,
    impact_regions_ar: "مدارس وقرى محافظة الدقهلية وحضانات أبي بكر الصديق والفاروق عمر وحضانة أثر",
    impact_regions_en: "Schools and nurseries in Dakahlia (Abu Bakr, Al-Farouq, and Athar)",
    impact_stats_ar: "كفالة مئات الطلاب ومنع تسربهم من التعليم سنويًا",
    impact_stats_en: "Sponsoring hundreds of needy students annually",
    suggested_articles: [
      {
        title_ar: "كيف تدعم تعليم طفل يتيم؟ خطوات عملية للمساهمة",
        title_en: "How to support an orphan's education? Practical ways to contribute",
        target_keyword_ar: "دعم تعليم الأيتام",
        target_keyword_en: "support orphan education",
      },
      {
        title_ar: "الاستعداد للعام الدراسي: كيف تساعد طالبًا غير قادر؟",
        title_en: "Back to school: how can you help a student in need?",
        target_keyword_ar: "مساعدة الطلاب المحتاجين",
        target_keyword_en: "help students in need",
      },
      {
        title_ar: "فضل رعاية اليتيم وتعليم القرآن للأطفال",
        title_en: "The virtue of caring for orphans and teaching children the Quran",
        target_keyword_ar: "فضل كفالة اليتيم",
        target_keyword_en: "virtue of orphan sponsorship",
      },
    ],
  },

  // 06 — Arboun Kheir (عربون خير)
  "arboun-kheir": {
    meta_title_ar: "عربون خير | مبادرة الفريلانسرز للصدقة من أرباح المشاريع — اليسر",
    meta_title_en: "Arboun Kheir | The Freelancers' Initiative to Give from Project Earnings — Al-Yusr",
    meta_description_ar: "اتصدق النهاردة وخليه عربون لرزق بكرة: مبادرة للفريلانسرز لإخراج جزء من أرباح كل مشروع لدعم الأيتام وتيسير الزواج والصدقات الجارية.",
    meta_description_en: "Give today and make it a down payment for tomorrow's provision: an initiative for freelancers to give a part of each project's earnings to support orphans, marriages and ongoing charity.",
    focus_keywords_ar: "عربون خير، صدقة للفريلانسر، زكاة المهنة، صدقة من أرباح المشروع، كفالة يتيم، صدقة جارية، تيسير الزواج",
    focus_keywords_en: "Arboun Kheir, freelancer charity, professional zakat, give from project earnings, orphan sponsorship, sadaqah jariyah",
    canonical_url: "https://elyusr.org/campaigns/arboun-kheir",
    noindex: false,
    nofollow: false,
    impact_regions_ar: "الدقهلية، الشرقية، كفر الشيخ، الفيوم، والمنيا",
    impact_regions_en: "Dakahlia, Sharqia, Kafr El-Sheikh, Fayoum, and Minya",
    impact_stats_ar: "تحويل التبرعات الرقمية لمشاريع تنموية ملموسة وأصول ثابتة",
    impact_stats_en: "Transforming digital donations into real physical assets and impact",
    suggested_articles: [
      {
        title_ar: "زكاة المهنة للفريلانسر: كيف تُبارك في رزقك وعملك الحر؟",
        title_en: "Professional Zakat for freelancers: blessing your remote work earnings",
        target_keyword_ar: "صدقة الفريلانسر",
        target_keyword_en: "freelancer charity",
      },
      {
        title_ar: "أثر الصدقة في تيسير المشاريع والتعامل مع العملاء",
        title_en: "The impact of charity on closing projects and easing client relations",
        target_keyword_ar: "بركة العمل الحر",
        target_keyword_en: "freelancing blessings",
      },
    ],
  },
};

// Aliases
OFFICIAL_CAMPAIGN_SEO_PRESETS["arboun"] = OFFICIAL_CAMPAIGN_SEO_PRESETS["arboun-kheir"];
OFFICIAL_CAMPAIGN_SEO_PRESETS["markoun"] = OFFICIAL_CAMPAIGN_SEO_PRESETS["markoon"];
OFFICIAL_CAMPAIGN_SEO_PRESETS["ramadann"] = OFFICIAL_CAMPAIGN_SEO_PRESETS["ramadan"];

/**
 * Normalizes slug to match preset keys
 */
export function matchCampaignPresetKey(slugOrId?: string): string | null {
  if (!slugOrId) return null;
  const s = slugOrId.toLowerCase().trim().replace(/^\/|\/$/g, "").replace(/^campaigns\//, "");
  if (s.includes("zell") || s.includes("ظل")) return "zell";
  if (s.includes("sitr") || s.includes("ستر")) return "sitr";
  if (s.includes("marko") || s.includes("مركون")) return "markoon";
  if (s.includes("ramadan") || s.includes("رمضان")) return "ramadan";
  if (s.includes("athar") || s.includes("أثر") || s.includes("اثر")) return "athar";
  if (s.includes("arboun") || s.includes("عربون")) return "arboun-kheir";
  return null;
}

/**
 * Hard-coded SEO preset for a campaign (from the official landing-pages PDF), or null.
 * Used ONLY as the initial value of an empty SEO form in the dashboard; the saved SEO lives on the
 * campaign record (`seo` column, PUT /donation-campaigns/{id}). Nothing is read from or written to
 * localStorage any more (the old `alyusr_campaign_seo_*` keys are ignored).
 */
export function getCampaignSeoPreset(campaignIdOrSlug: string | number | null | undefined): CampaignSeoData | null {
  const key = matchCampaignPresetKey(campaignIdOrSlug == null ? "" : String(campaignIdOrSlug));
  return key && OFFICIAL_CAMPAIGN_SEO_PRESETS[key] ? { ...OFFICIAL_CAMPAIGN_SEO_PRESETS[key] } : null;
}

/** @deprecated kept for old imports: returns the hard-coded preset only (no localStorage). */
export const getStoredCampaignSeo = (campaignIdOrSlug: string | number): CampaignSeoData | null =>
  getCampaignSeoPreset(campaignIdOrSlug);
