/** Full services & resources map for Al-Yusr (Al-Islah) charity.
 *  Structured into 3 service axes + 1 resources axis. */

export type ServiceItem = { t: string; d?: string };
export type ServiceGroup = { id: string; title: string; intro?: string; items: ServiceItem[]; href?: string; cta_ar?: string; cta_en?: string };
export type Axis = { id: string; title: string; subtitle?: string; groups: ServiceGroup[] };

/** 7 sectors mirroring the donate form (سبع قطاعات في فورم التبرع).
 *  Each sector has a short chip-style summary + a list of programs that maps
 *  to a node slug in the donation tree. Used by /services-map. */
export type SectorProgram = {
  slug: string;          // donate program slug (e.g. "box", "markoun")
  title_ar: string;
  title_en: string;
  desc_ar: string;
  desc_en: string;
  href?: string;         // optional dedicated detail page
};

export type Sector = {
  id: string;                    // axis id used in URL hash
  donate: string;                // /donate?sector={donate}
  title_ar: string;
  title_en: string;
  summary_ar: string;            // chip-style short list like "كرتونة، لحوم، وجبات ساخنة"
  summary_en: string;
  intro_ar: string;
  intro_en: string;
  programs: SectorProgram[];
};

export const DONATE_SECTORS: Sector[] = [
  {
    id: "odhya",
    donate: "sector-odhya",
    title_ar: "صك الأضحية",
    title_en: "Udhiya voucher",
    summary_ar: "أضحية موثّقة، توزيع لحوم على المستحقين",
    summary_en: "Documented Udhiya — meat distributed to needy families",
    intro_ar: "صك أضحية مضمون يُذبح في موعده ويُوزَّع لحمه على الأسر المتعففة في الدقهلية وكفر الشيخ — موثّق بالصور والفيديو.",
    intro_en: "A guaranteed Udhiya voucher — slaughtered on time and distributed to needy families in Dakahlia & Kafr El Sheikh, documented with photos and video.",
    programs: [
      { slug: "odhya", title_ar: "صك الأضحية", title_en: "Udhiya voucher", desc_ar: "صك أضحية كامل عن المتبرع، يُوثَّق بالصور والفيديو.", desc_en: "A full Udhiya voucher on behalf of the donor — photo & video documented.", href: "/qurbani" },
    ],
  },
  {
    id: "food",
    donate: "sector-food",
    title_ar: "الغذاء",
    title_en: "Food",
    summary_ar: "كرتونة، لحوم، وجبات ساخنة، خبز يومي",
    summary_en: "Food box, meat, hot meals, daily bread",
    intro_ar: "تبرع مباشر — من كرتونة الـ25 كيلو إلى مطبخ اليسر ومخبز اليسر بالدقهلية.",
    intro_en: "Direct giving — from the 25kg box to Al-Yusr kitchen and bakery in Dakahlia.",
    programs: [
      { slug: "box", title_ar: "كرتونة 25 كيلو", title_en: "25kg food box", desc_ar: "بقوليات ومعلبات وأساسيات شهرية لأسرة.", desc_en: "Pantry staples for a family for a month." },
      { slug: "kitchen", title_ar: "مطبخ اليسر — وجبة ساخنة", title_en: "Al-Yusr kitchen — hot meal", desc_ar: "وجبات يومية لمرافقي المرضى والصائمين.", desc_en: "Daily hot meals for hospital companions and fasting people." },
      { slug: "bakery", title_ar: "مخبز اليسر — خبز يومي", title_en: "Al-Yusr bakery — daily bread", desc_ar: "خبز ساخن مجاني للأسر المتعففة كل يوم.", desc_en: "Free hot bread for needy families every day." },
      { slug: "qurbani", title_ar: "صك الأضحية", title_en: "Udhiya voucher", desc_ar: "صك أضحية موثّق بالصور والفيديو يُوزَّع لحمها على الأسر المتعففة في الدقهلية وكفر الشيخ.", desc_en: "A documented Udhiya voucher — meat distributed to needy families in Dakahlia & Kafr El Sheikh with photo & video proof.", href: "/qurbani" },
      { slug: "general", title_ar: "لحوم المزرعة الوقفية", title_en: "Endowment farm meat", desc_ar: "أكثر من 2 طن لحوم سنويًا من المزرعة الوقفية للأسر المتعففة.", desc_en: "2+ tons of meat yearly from our endowment farm.", href: "/farm" },
    ],
  },
  {
    id: "health",
    donate: "sector-health",
    title_ar: "الصحة",
    title_en: "Health",
    summary_ar: "علاج، عمليات، أطراف صناعية، قوافل طبية",
    summary_en: "Treatment, surgeries, prosthetics, medical convoys",
    intro_ar: "مجمع المنصورة الطبي ومركز الغسيل الكلوي بالمنزلة + قوافل ومشروع تحدّي الإعاقة.",
    intro_en: "Mansoura Medical Complex, Manzala dialysis center, mobile medical convoys & Prosthetics program.",
    programs: [
      { slug: "treatment", title_ar: "سهم علاج وقوافل طبية", title_en: "Treatment & medical convoys", desc_ar: "دواء وعمليات وقوافل بيطرية وبشرية.", desc_en: "Medication, surgeries, vet & human convoys." },
      { slug: "prosthetics", title_ar: "تحدّي الإعاقة — أطراف صناعية وكراسي", title_en: "Overcoming Disability — prosthetics & wheelchairs", desc_ar: "أطراف صناعية وكراسي متحركة وجلسات تأهيل.", desc_en: "Prosthetics, wheelchairs and rehabilitation sessions." },
    ],
  },
  {
    id: "kafala",
    donate: "sector-kafala",
    title_ar: "التكافل",
    title_en: "Family Care",
    summary_ar: "كفالة أيتام، جواز عرايس",
    summary_en: "Orphan sponsorship, bride trousseau",
    intro_ar: "354 يتيمًا تحت الكفالة و9 عرائس جُهّزن في 2025.",
    intro_en: "354 sponsored orphans and 9 brides equipped in 2025.",
    programs: [
      { slug: "orphans", title_ar: "كفالة يتيم", title_en: "Sponsor an orphan", desc_ar: "كفالة شهرية شاملة تعليم وعلاج للأيتام.", desc_en: "Monthly sponsorship covering schooling & care." },
      { slug: "bride", title_ar: "جواز عروسة", title_en: "Bride trousseau", desc_ar: "أجهزة وأثاث ومفروشات لعروس يتيمة.", desc_en: "Appliances, furniture and linens for an orphan bride." },
    ],
  },
  {
    id: "housing",
    donate: "sector-housing",
    title_ar: "الإسكان",
    title_en: "Housing",
    summary_ar: "تسقيف وترميم، مياه نظيفة، فرش بيوت",
    summary_en: "Roofing & repair, clean water, home essentials",
    intro_ar: "حملة ستر لتسقيف 70 منزلًا في 2025 ومشروع سقيا الماء بـ100 وصلة منزلية.",
    intro_en: "Sotra campaign roofed 70 homes in 2025 and our Water program delivered 100 home connections.",
    programs: [
      { slug: "shelter", title_ar: "حملة ستر — تسقيف وترميم", title_en: "Sotra — roofing & repair", desc_ar: "سقف وأبواب وشبابيك ومراتب ولحف.", desc_en: "Roofs, doors, windows, mattresses and quilts." },
      { slug: "water", title_ar: "وصلة مياه نظيفة", title_en: "Clean water connection", desc_ar: "خطوط مياه رئيسية ووصلات بيت في القرى.", desc_en: "Main pipelines and home water taps for villages." },
    ],
  },
  {
    id: "education",
    donate: "sector-education",
    title_ar: "التعليم",
    title_en: "Education",
    summary_ar: "مصاريف، أدوات مدرسية، تعليم أيتام",
    summary_en: "Tuition, school supplies, orphan education",
    intro_ar: "ادفع مصروفه وابني مستقبله — كفالة تعليمية حتى الجامعة وحلقات تحفيظ القرآن.",
    intro_en: "Pay tuition, build a future — sponsorship up to university plus Quran circles.",
    programs: [
      { slug: "education", title_ar: "ادفع مصروفه وابني مستقبله", title_en: "Pay tuition, build a future", desc_ar: "مصاريف وكتب وأدوات حتى الجامعة.", desc_en: "Tuition, books and supplies through university." },
    ],
  },
  {
    id: "tanmia",
    donate: "sector-tanmia",
    title_ar: "التنمية",
    title_en: "Development",
    summary_ar: "مشاريع صغيرة، حملة مَرْكون، حملات موسمية",
    summary_en: "Small projects, Markoun campaign, seasonal drives",
    intro_ar: "تمكين الأسر المنتجة وحملة مَرْكون لتجديد وتوزيع الأجهزة والأثاث.",
    intro_en: "Empowering productive families and the Markoun refurbish-and-deliver campaign.",
    programs: [
      { slug: "markoun", title_ar: "حملة مَرْكون", title_en: "Markoun campaign", desc_ar: "مرتبة، جهاز كهربائي بسيط، علاج شهري أو مرتب لأم معيلة.", desc_en: "Mattress, basic appliance, monthly meds or stipend for a widowed mother.", href: "/markoun" },
      { slug: "farm", title_ar: "المزرعة الوقفية", title_en: "Endowment farm", desc_ar: "ادعم تطوير المزرعة الوقفية: أعلاف، رعاية بيطرية، توسعة الحظائر — لإنتاج لحوم سنوية للأسر المتعففة.", desc_en: "Support the endowment farm: feed, vet care and barn expansion — producing yearly meat for needy families.", href: "/farm" },
      { slug: "general", title_ar: "تبرع عام للتنمية", title_en: "General development donation", desc_ar: "يوجَّه لأكثر حالات التنمية إلحاحًا.", desc_en: "Directed to the most urgent development cases." },
    ],
  },
  {
    id: "zakat",
    donate: "sector-zakat",
    title_ar: "الزكاة",
    title_en: "Zakat",
    summary_ar: "زكاة المال على المصارف الشرعية",
    summary_en: "Zakat al-mal across the 8 legitimate channels",
    intro_ar: "احسب زكاة مالك وادفعها للمستحقين فقط في الدقهلية وكفر الشيخ — بإشراف لجنة شرعية.",
    intro_en: "Calculate and pay your Zakat to deserving recipients only in Dakahlia & Kafr El Sheikh — under a Sharia committee.",
    programs: [
      { slug: "zakat", title_ar: "زكاة المال", title_en: "Zakat al-mal", desc_ar: "تُصرف على المصارف الشرعية الثمانية.", desc_en: "Spent on the 8 Sharia-approved channels.", href: "/zakat" },
    ],
  },
];

export const SERVICES_AXES_AR: Axis[] = [
  {
    id: "social",
    title: "الخدمات الاجتماعية",
    subtitle: "نلامس احتياجات الأسرة من الإطعام للإيواء وتيسير الزواج",
    groups: [
      {
        id: "feeding",
        title: "الإطعام وسقيا الماء",
        intro: "خدمات إطعام موسمية ومياه نظيفة لأهلنا في الدقهلية وقرى مصر.",
        href: "/programs/kitchen",
        cta_ar: "ادعم مطبخ اليسر",
        cta_en: "Support kitchen",
        items: [
          { t: "مطبخ اليسر — وجبات ساخنة يومية", d: "آلاف الوجبات الساخنة يوميًا للصائمين والمسافرين ومرافقي المرضى." },
          { t: "إطعام رمضان", d: "إفطار وسحور وإفطار طريق." },
          { t: "توزيع لحوم الأضاحي", d: "أكثر من 2 طن لحوم سنويًا للأسر المتعففة من مزارعنا الوقفية." },
          { t: "كرتونة الـ 25 كيلو الرمضانية", d: "بقوليات ومعلبات وأساسيات بجودة بلدي طازجة." },
          { t: "حفر الآبار وتوصيل المياه", d: "حفر آبار ومد خطوط مياه رئيسية ووصلات منزلية في القرى النائية." },
        ],
      },
      {
        id: "small-projects",
        title: "المشاريع الصغيرة",
        intro: "نحوّل الأسرة الفقيرة إلى منتجة بأدوات ومعدات صغيرة (قصة \"أم الصابرين\").",
        href: "/cases?cat=small-projects",
        cta_ar: "حالات مشاريع صغيرة",
        cta_en: "Small-project cases",
        items: [
          { t: "أدوات وبضائع لمشروع منزلي" },
          { t: "تمكين الأسر المنتجة" },
        ],
      },
      {
        id: "financial",
        title: "المساعدات المالية",
        intro: "دعم نقدي للأسر المتعففة (700 أسرة في 2025).",
        href: "/programs/zakat",
        cta_ar: "احسب زكاتك",
        cta_en: "Calculate Zakat",
        items: [
          { t: "دعم نقدي شهري للأسر" },
          { t: "زكاة المال للمستحقين" },
        ],
      },
      {
        id: "infrastructure",
        title: "البنية الأساسية للمنازل",
        intro: "ضروريات لا يُستغنى عنها لإيواء الأسرة — حملة \"ستر\".",
        href: "/programs/shelter",
        cta_ar: "ادعم حملة ستر",
        cta_en: "Support Shelter",
        items: [
          { t: "تسقيف المنازل (بوتامين وخشب)", d: "حماية الأسر من تقلبات الجو ضمن حملة \"ستر\"." },
          { t: "توصيل المياه للمنازل" },
          { t: "تركيب الأبواب والشبابيك" },
          { t: "اللحاف الفاير والمراتب والكسوة", d: "تدفئة الأسر في موسم الشتاء." },
          { t: "أساسيات المنزل (أثاث وأجهزة)", d: "ضمن حملة \"مركون\" لتجديد الأجهزة." },
        ],
      },
      {
        id: "marriage",
        title: "تيسير زواج اليتيمات — الفرحة بقت فرحتين",
        intro: "تجهيز عرائس الأيتام بأفضل الخامات (9 عرائس في 2025).",
        href: "/programs/bride",
        cta_ar: "جهّز عروسة",
        cta_en: "Sponsor a bride",
        items: [
          { t: "أجهزة كهربائية (ثلاجة، غسالة، بتوجاز، أنبوبة)" },
          { t: "أثاث ومفروشات للعروس" },
          { t: "قطعة مطبخ حسب الحاجة" },
        ],
      },
      {
        id: "orphans",
        title: "رفيق النبي ﷺ — كفالة الأيتام",
        intro: "رعاية تربوية وتعليمية وصحية ومادية — 354 طالبًا تحت الكفالة في 2025.",
        href: "/programs/orphans",
        cta_ar: "اكفل يتيم",
        cta_en: "Sponsor an orphan",
        items: [
          { t: "كفالة شهرية للأيتام" },
          { t: "كفالة تعليمية حتى الجامعة" },
          { t: "كفالة شاملة لكل لوازم اليتيم" },
        ],
      },
      {
        id: "convoys",
        title: "القوافل",
        intro: "خدمات مكثفة ومؤقتة للأماكن النائية.",
        href: "/campaigns",
        cta_ar: "حملات وقوافل مفتوحة",
        cta_en: "Open campaigns",
        items: [
          { t: "قوافل الخدمات الاجتماعية" },
          { t: "قوافل الشتاء (عطاؤكم دفء)" },
          { t: "قوافل الكوارث والنكبات" },
          { t: "قوافل طبية متخصصة" },
          { t: "قوافل شاملة (اجتماعية وطبية)" },
        ],
      },
      {
        id: "recycle",
        title: "الصيانة وإعادة التدوير — حملة \"مركون\"",
        intro: "مبادرة استدامة لإعادة تجديد الأجهزة المستعملة وتوزيعها بدلًا من بيعها كخردة.",
        href: "/donate?intent=markoun",
        cta_ar: "ادعم حملة مركون",
        cta_en: "Support Markoun",
        items: [
          { t: "تجديد ثلاجات ومراوح وأجهزة كهربائية", d: "حملة \"مركون\" — جهاز مجدّد لكل أسرة محتاجة." },
          { t: "تركيب الأجهزة المجدّدة في بيوت الأسر المحتاجة" },
        ],
      },
      {
        id: "summer",
        title: "حملة \"ظل\" الصيفية",
        intro: "نبرّد لهيب الصيف عن العمال والأسر تحت شعار \"ارحموا من في الأرض\".",
        href: "/donate?intent=summer",
        cta_ar: "ادعم حملة ظل",
        cta_en: "Support Shade",
        items: [
          { t: "تركيب المراوح المجدّدة في المنازل" },
          { t: "توزيع المشروبات الباردة على العمال" },
          { t: "توصيلات مياه إضافية للقرى" },
        ],
      },
    ],
  },
  {
    id: "medical",
    title: "الخدمات الطبية",
    subtitle: "مجمع المنصورة الطبي والتعليمي ومركز الغسيل الكلوي بالمنزلة + قوافل طبية.",
    groups: [
      {
        id: "care",
        title: "رعاية المرضى",
        href: "/programs/treatment",
        cta_ar: "ادعم العلاج",
        cta_en: "Support treatment",
        items: [
          { t: "العلاج الدوائي والعلاج الشهري" },
          { t: "العمليات الجراحية العاجلة" },
          { t: "الأجهزة الطبية والمستلزمات" },
          { t: "جلسات علاج طبيعي وتخاطب" },
        ],
      },
      {
        id: "med-convoys",
        title: "القوافل الطبية",
        href: "/campaigns",
        cta_ar: "قوافل طبية مفتوحة",
        cta_en: "Open medical campaigns",
        items: [
          { t: "قوافل طبية متخصصة" },
          { t: "قوافل شاملة بشرية وبيطرية" },
        ],
      },
      {
        id: "centers",
        title: "المراكز الطبية",
        href: "/projects",
        cta_ar: "مشاريع المراكز الطبية",
        cta_en: "Medical centers",
        items: [
          { t: "مجمع المنصورة الطبي والتعليمي", d: "مبنى من 4 طوابق يخدم أهالي الدقهلية." },
          { t: "مركز غسيل كلوي بالمنزلة", d: "خدمة المناطق النائية بجلسات غسيل كلوي مجانية." },
        ],
      },
      {
        id: "disabilities",
        title: "تحدّي الإعاقة — أطراف صناعية ودعم ذوي الهمم",
        intro: "دعم ذوي الإعاقة بالأطراف الصناعية والكراسي المتحركة ودمجهم في المجتمع.",
        href: "/programs/prosthetics",
        cta_ar: "ادعم تحدّي الإعاقة",
        cta_en: "Support Prosthetics",
        items: [
          { t: "أطراف صناعية وأجهزة تعويضية" },
          { t: "كراسي متحركة وعكازات" },
          { t: "جلسات تأهيل وعلاج طبيعي" },
          { t: "جلسات تخاطب للأطفال" },
        ],
      },
      {
        id: "honor-dead",
        title: "إكرام الموتى — سيارة تكريم الإنسان",
        href: "/donate?intent=honor",
        cta_ar: "ادعم سيارة التكريم",
        cta_en: "Support honor service",
        items: [
          { t: "سيارة نقل الموتى تحت الطلب" },
          { t: "تغسيل وتكفين بكرامة" },
        ],
      },
    ],
  },
  {
    id: "educational",
    title: "الخدمات العلمية",
    subtitle: "كفالة تعليمية لـ354 طالبًا وحلقات تحفيظ في مساجدنا.",
    groups: [
      {
        id: "students",
        title: "كفالة الطلاب",
        intro: "354 طالبًا تحت الكفالة التعليمية في 2025.",
        href: "/programs/education",
        cta_ar: "اكفل طالبًا",
        cta_en: "Sponsor a student",
        items: [
          { t: "كفالة دراسية حتى الجامعة" },
          { t: "أدوات وكتب مدرسية" },
        ],
      },
      {
        id: "quran",
        title: "حلقات تحفيظ القرآن",
        intro: "ركن مكتبة وحلقة تحفيظ في كل مسجد جديد بنبنيه.",
        href: "/donate?intent=quran",
        cta_ar: "ادعم حلقات التحفيظ",
        cta_en: "Support Quran circles",
        items: [
          { t: "حلقات تحفيظ داخل مساجد اليسر" },
          { t: "مكتبات صغيرة لخدمة المجتمع" },
        ],
      },
    ],
  },
  {
    id: "infra-projects",
    title: "المنشآت والمشاريع الكبرى",
    subtitle: "بنية تحتية تخدم آلاف الأسر — مساجد، مياه، ومزارع وقفية.",
    groups: [
      {
        id: "mosques",
        title: "بناء وإعادة إعمار المساجد",
        intro: "لا نكتفي بالبناء، بل نجعل المسجد منارة خدمية لمحيطه.",
        href: "/projects",
        cta_ar: "مشاريع المساجد",
        cta_en: "Mosque projects",
        items: [
          { t: "إعادة إعمار 20 مسجدًا في 2025" },
          { t: "بناء مسجد الفيوم (2022)" },
          { t: "ربط المسجد بمجمع طبي وتعليمي" },
        ],
      },
      {
        id: "water-projects",
        title: "مشروع \"سقيا الماء\"",
        intro: "من خطوط المياه الرئيسية إلى عداد كل بيت.",
        href: "/programs/water",
        cta_ar: "ادعم سقيا الماء",
        cta_en: "Support water",
        items: [
          { t: "مد خطوط مياه رئيسية بقطر 4 بوصة" },
          { t: "100 وصلة مياه منزلية في 2025" },
          { t: "خط مياه بطول 750م بالمنزلة (2023)" },
          { t: "حفر آبار في الصعيد والمنيا" },
        ],
      },
      {
        id: "farm",
        title: "مزرعة اليسر الوقفية",
        intro: "إنتاجنا الخاص يضمن جودة اللحم بلا وسطاء وبلا ربح.",
        href: "/farm",
        cta_ar: "زر المزرعة الوقفية",
        cta_en: "Visit endowment farm",
        items: [
          { t: "ذبح أكثر من 3 طن لحم شهريًا في رمضان" },
          { t: "مواشي محصنة لصكوك الأضاحي" },
          { t: "أعلاف وإنتاج حيواني وقفي" },
        ],
      },
      {
        id: "housing",
        title: "مشروع \"سكن كريم\"",
        intro: "تسقيف وترميم المنازل في كفر الشيخ والدقهلية وما حولهما.",
        href: "/programs/shelter",
        cta_ar: "ادعم سكن كريم",
        cta_en: "Support Shelter",
        items: [
          { t: "تسقيف 70 منزلًا (8361م²) في 2025" },
          { t: "تسقيف 11 منزلًا بالحفير (2024)" },
          { t: "ترميم منازل العاصفرة (2019-2021)" },
        ],
      },
    ],
  },
];

export const RESOURCES_AR: Axis = {
  id: "resources",
  title: "موارد المؤسسة",
  subtitle: "ينتفع المحتاجون بكل شيء، حتى أبسط الموارد.",
  groups: [
    {
      id: "money",
      title: "تبرعات مادية",
      items: [
        { t: "الصدقات العامة" },
        { t: "زكاة المال" },
        { t: "زكاة عروض التجارة" },
        { t: "النذور" },
        { t: "الكفارات بأنواعها" },
        { t: "زكاة الفطر" },
      ],
    },
    {
      id: "real-estate",
      title: "عقارات",
      items: [
        { t: "أراضٍ" },
        { t: "مبانٍ" },
        { t: "مقرات إدارية وفروع" },
        { t: "معارض ومخازن" },
        { t: "جراجات" },
      ],
    },
    {
      id: "vehicles",
      title: "مركبات",
      items: [
        { t: "سيارات ملاكي" },
        { t: "سيارات نقل وربع نقل" },
        { t: "سيارات 7 راكب" },
        { t: "سيارات إسعاف" },
        { t: "تروسيكل" },
      ],
    },
    {
      id: "household",
      title: "لوازم الأسرة",
      items: [
        { t: "أثاث منزلي" },
        { t: "ملابس وأحذية" },
        { t: "أجهزة كهربائية" },
        { t: "أدوات وأوانٍ منزلية" },
        { t: "أدوات دراسية وكتب مدرسية" },
        { t: "ألعاب أطفال" },
        { t: "منظفات ومساحيق" },
        { t: "مفروشات وأغطية" },
      ],
    },
    {
      id: "food",
      title: "مواد غذائية",
      items: [
        { t: "حبوب وبقوليات" },
        { t: "طعام مطهو" },
        { t: "العقائق والأضاحي (لحوم وجلود)" },
        { t: "حلويات وإضافات" },
        { t: "زكاة الزروع والثمار" },
        { t: "فواكه وخضراوات" },
        { t: "لحوم ومجمدات" },
        { t: "زيوت الطعام" },
        { t: "زكاة الفطر" },
        { t: "فائض عزومات وحفلات" },
        { t: "وجبات فردية" },
      ],
    },
    {
      id: "scrap",
      title: "الخردة وإعادة التدوير",
      items: [
        { t: "معادن بأنواعها" },
        { t: "بلاستيك" },
        { t: "أجهزة كهربائية مستهلكة" },
        { t: "ورق وكرتون" },
        { t: "أخشاب" },
        { t: "كتب" },
      ],
    },
    {
      id: "medical-supplies",
      title: "مستلزمات طبية",
      items: [
        { t: "أدوية ومستلزمات طبية" },
        { t: "أطراف صناعية وأجهزة تعويضية" },
        { t: "أجهزة تنفس صناعي" },
        { t: "اسطوانات ومولّدات أكسجين" },
        { t: "أجهزة باي باب وسي باب" },
        { t: "أجهزة نبولايزر" },
        { t: "أجهزة قياس الضغط والسكر" },
        { t: "كراسي متحركة وعكازات ومشّايات" },
        { t: "سرير طبي ومرتبة هوائية" },
      ],
    },
    {
      id: "honor-dead-supplies",
      title: "لوازم إكرام الموتى",
      items: [
        { t: "لوازم الغسل والتكفين" },
        { t: "سيارة تكريم الإنسان" },
        { t: "مقابر للدفن" },
      ],
    },
  ],
};