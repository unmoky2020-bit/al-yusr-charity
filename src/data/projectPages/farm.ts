import { l, type CampaignPageContent } from "@/data/campaignPages/types";

/**
 * Default content of the waqf farm page (/farm). The layout lives in `src/pages/site/Farm.tsx`;
 * the ids and section keys below are referenced there and must stay stable. The dashboard
 * (المشاريع → المزرعة الوقفية → محتوى الصفحة) saves an override in the project's `page_content`.
 * Prices are NOT here: the page shows the project's donation packages.
 */
const FARM: CampaignPageContent = {
  hero: {
    eyebrow: l("وقف خيري مستدام", "Sustainable charitable endowment"),
    title: l("مزرعة اليسر الوقفية بالدقهلية", "Al-Yusr waqf farm in Dakahlia"),
    title2: l("وقف إنتاجي يُطعم الأسر ويموّل الخير", "A productive waqf that feeds families and funds good work"),
    lead: l(
      "نربّي ماشية بلدي محصّنة على أفضل الأعلاف، فيصل إنتاجها لحمًا طازجًا بكرامة إلى الأسر المستحقة، ويكبّر عائدُ بيعه الوقفَ ويموّل أنشطة المؤسسة.",
      "We raise vaccinated local livestock on premium feed. Its output brings fresh meat to families in need, and income from its sale grows the waqf and funds the foundation.",
    ),
    donateLabel: l("احجز صك أضحية", "Reserve a Qurbani share"),
  },

  hadith: {
    text: l(
      "ما من مسلمٍ يغرِسُ غرسًا، أو يزرعُ زرعًا، فيأكلُ منه طيرٌ أو إنسانٌ أو بهيمةٌ، إلا كان له به صدقة",
      "No Muslim plants a tree or sows a crop from which a bird, a person or an animal eats, except that it is charity for him.",
    ),
    source: l("متفق عليه (البخاري ومسلم)", "Agreed upon (Bukhari & Muslim)"),
  },

  prices: [],

  stats: [
    // strip under the hero
    { id: "meat_2025", label: l("لحوم وُزعت 2025", "Meat distributed in 2025"), value: 5, unit: l("طن", "tons") },
    { id: "monthly", label: l("إنتاج شهري", "Monthly production"), value: 3, unit: l("طن", "tons") },
    { id: "local", label: l("ماشية بلدي وقفية", "Local waqf livestock"), value: 100, unit: l("%", "%") },
    { id: "margin", label: l("هامش ربح على الصك", "Margin on Qurbani shares"), value: 0, unit: l("%", "%") },
    // "endowment impact" band
    { id: "families", label: l("أسرة استفادت سنويًا", "families served yearly"), value: 1200, unit: l("أسرة", "families") },
    { id: "governorates", label: l("تغطية ميدانية", "field coverage"), value: 12, unit: l("محافظة", "governorates") },
    { id: "jobs", label: l("فرص عمل محلية", "local jobs"), value: 30, unit: l("شاب", "young people") },
    { id: "middlemen", label: l("تسليم مباشر", "direct delivery"), value: 0, unit: l("% وسطاء", "% middlemen") },
  ],

  sections: {
    answer: {
      title: l("إجابة مختصرة تحت العنوان (لمحركات البحث والمساعدات الصوتية)", "Short answer under the heading (search & voice assistants)"),
      lead: l(
        "تخدم مزرعة اليسر الوقفية الدقهلية الشرقية والمنصورة وميت غمر وطلخا وكفر الشيخ: صك أضحية مرخّص، ومعاينة قبل الذبح، وتوثيق بالصور والفيديو لكل أسرة مستفيدة.",
        "Al-Yusr's waqf farm serves East Dakahlia, Mansoura, Mit Ghamr, Talkha and Kafr El Sheikh: licensed Qurbani shares, pre-slaughter inspection and photo and video proof for every family.",
      ),
      items: [],
    },
    links: {
      title: l("صك أضحية اليسر في المنصورة", "Al-Yusr Qurbani in Mansoura"),
      lead: l("اختر مدينتك أو البرنامج المناسب، وكل تبرع موثَّق بالكامل:", "Pick your city or programme; every donation is fully documented:"),
      items: [
        { id: "qurbani_mansoura", title: l("أضحية المنصورة", "Qurbani Mansoura"), desc: l("", "") },
        { id: "odhya", title: l("برنامج صك الأضحية", "Qurbani programme"), desc: l("", "") },
        { id: "box", title: l("كرتونة الخير", "Food carton"), desc: l("", "") },
        { id: "zakat", title: l("زكاة المال", "Zakat"), desc: l("", "") },
        { id: "campaigns", title: l("كل الحملات النشطة", "All active campaigns"), desc: l("", "") },
        { id: "trust", title: l("ضمانات الشفافية", "Transparency guarantees"), desc: l("", "") },
      ],
    },
    why: {
      title: l("لماذا المزرعة الوقفية؟", "Why a waqf farm?"),
      lead: l("لنضمن لكل مضحٍّ ولكل مستحق الجودة نفسها والأمانة نفسها طوال السنة.", "So every donor and every recipient gets the same quality with the same trust, all year round."),
      items: [
        { id: "vaccinated", title: l("ماشية محصنة بالكامل", "Fully vaccinated livestock"), desc: l("كل رأس بسجل بيطري وتطعيمات معتمدة قبل الذبح.", "Each head has a vet record and certified vaccinations before slaughter.") },
        { id: "feed", title: l("أعلاف بلدي طبيعية", "Natural local feed"), desc: l("نربّي ماشيتنا على أفضل الأعلاف دون هرمونات، لنقدّم لحمًا بجودة حقيقية.", "Raised on premium hormone-free feed for genuine meat quality.") },
        { id: "at_cost", title: l("صك بالتكلفة وبدون وسطاء", "At cost, no middlemen"), desc: l("صك الأضحية بالتكلفة الفعلية، ونصل المضحي بالمستحق مباشرة دون عمولات.", "Qurbani shares at actual cost, connecting donor and recipient directly with no commission.") },
        { id: "delivery", title: l("تسليم بكرامة لباب البيت", "Dignified doorstep delivery"), desc: l("يصل اللحم طازجًا إلى الأسر المتعففة في اليوم نفسه.", "Fresh meat reaches families in need on the same day.") },
        { id: "sustainable", title: l("وقف مستدام", "A lasting waqf"), desc: l("يعود عائد بيع إنتاج المزرعة لزيادة عدد الرؤوس ولأنشطة المؤسسة، فيكبر الخير كل سنة.", "Income from selling the farm's output grows the herd and funds the foundation, so the good grows every year.") },
        { id: "local", title: l("إنتاج محلّي 100%", "100% local production"), desc: l("مزارع مصرية بأيدي شباب مصري، ودعم للاقتصاد المحلي.", "Egyptian farms run by Egyptian youth, supporting the local economy.") },
      ],
    },
    cycle: {
      title: l("جنيه يتحوّل إلى أصل، وأصل يُثمر خيرًا كل سنة", "A pound becomes an asset, and the asset yields good every year"),
      lead: l("اضغط على كل خطوة لتتابع رحلة تبرعك داخل المزرعة الوقفية.", "Tap each step to follow your gift through the waqf farm."),
      items: [
        { id: "gift", title: l("تبرعك للوقف", "Your gift to the waqf"), desc: l("يتحوّل تبرعك إلى أصل ثابت في مزرعة اليسر: رؤوس ماشية وأعلاف وتجهيزات. هذا الأصل لا يُنفق ولا ينفد، بل يظل يعمل وينتج.", "Your gift becomes a lasting asset at the Al-Yusr farm: livestock, feed and equipment. The asset is never spent; it keeps working.") },
        { id: "raising", title: l("تربية ورعاية", "Raising and care"), desc: l("تُربّى الماشية على أعلاف بلدي طبيعية تحت إشراف بيطري، مع تطعيمات وسجل لكل رأس، حتى تصل إلى وزنها المناسب.", "Livestock is raised on natural local feed under veterinary care, vaccinated and recorded head by head, until it reaches its weight.") },
        { id: "production", title: l("الإنتاج", "Production"), desc: l("يغطي إنتاج المزرعة صكوك الأضحية ولحوم المواسم الخيرية، ويُباع الباقي لتحقق المزرعة دخلًا.", "The farm's output covers Qurbani shares and seasonal charity meat; the rest is sold so the farm earns income.") },
        { id: "returns", title: l("العائد يعود", "Returns flow back"), desc: l("يُقسَّم عائد الإنتاج على ثلاثة أوجه، ثم تبدأ الدورة من جديد أكبر مما كانت.", "The returns are split three ways, and then the cycle starts again, bigger than before.") },
      ],
    },
    cycle_returns: {
      title: l("يُقسَّم العائد على", "Returns are split into"),
      items: [
        { id: "meat", title: l("لحم طازج للأسر المستحقة", "Fresh meat for families in need"), desc: l("", "") },
        { id: "herd", title: l("رؤوس جديدة تكبّر الوقف", "New livestock that grows the waqf"), desc: l("", "") },
        { id: "foundation", title: l("موارد لأنشطة المؤسسة", "Income for the foundation's work"), desc: l("", "") },
      ],
    },
    kind: {
      title: l("نوع المشروع", "Project type"),
      lead: l(
        "تجمع المزرعة الوقفية بين النوعين: فهي مشروع إنتاجي يدرّ موارد تُصرف على أنشطة المؤسسة، ويوصل في الوقت نفسه لحمًا طازجًا إلى الأسر المستحقة في الدقهلية.",
        "The waqf farm is both: a productive project whose income funds the foundation's work, and a source of fresh meat for families in need in Dakahlia.",
      ),
      items: [],
    },
    give: {
      title: l("ساهم في الوقف نفسه", "Give to the waqf itself"),
      lead: l(
        "إلى جانب صك الأضحية، يمكنك المساهمة بسهم في أصل الوقف: رؤوس ماشية وأعلاف وتجهيزات تظل تنتج عامًا بعد عام، صدقةً جارية عنك أو عن شخص عزيز عليك.",
        "Beyond a Qurbani share, you can give a share in the waqf's assets: livestock, feed and equipment that keep producing year after year. Ongoing charity for you or a loved one.",
      ),
      items: [],
    },
    qurbani: {
      title: l("صك أضحية من مزرعتنا مباشرة", "Qurbani directly from our farm"),
      lead: l(
        "وزّعنا 5 أطنان من اللحوم في 2025 على الأسر المتعففة من إنتاج المزرعة الوقفية، دون وسطاء، وبكرامة كاملة، وفي يوم العيد نفسه.",
        "5 tons of meat distributed to families in need in 2025 from our waqf farm: no middlemen, full dignity, delivered on Eid day.",
      ),
      items: [
        { id: "sharia", title: l("ذبح شرعي بإشراف مختص", "Sharia-compliant slaughter under supervision"), desc: l("", "") },
        { id: "hygiene", title: l("تقطيع وتغليف صحي", "Hygienic cutting and packaging"), desc: l("", "") },
        { id: "proof", title: l("صور وفيديو توثيق لكل صك", "Photo and video proof for every share"), desc: l("", "") },
      ],
    },
    journey: {
      title: l("رحلة الماشية… من المزرعة إلى بيت المستحق", "From farm to family: the livestock journey"),
      lead: l("كل خطوة موثقة بإشراف بيطري وشرعي، لتصل اللحوم بأعلى جودة وكرامة.", "Every step is documented under veterinary and Sharia supervision so meat arrives at peak quality and dignity."),
      items: [
        { id: "raise", title: l("تربية وقفية", "Waqf rearing"), desc: l("تربية محلية بأعلاف بلدي طبيعية لمدة لا تقل عن 6 شهور.", "Local rearing on natural feed for at least 6 months.") },
        { id: "vet", title: l("إشراف بيطري", "Veterinary oversight"), desc: l("تطعيمات وفحوصات دورية لكل رأس بسجل بيطري معتمد.", "Vaccinations and regular checks with a certified record per head.") },
        { id: "slaughter", title: l("ذبح شرعي موثق", "Documented Sharia slaughter"), desc: l("ذبح بإشراف شرعي وبيطري داخل المسلخ، مع كاميرات للتوثيق.", "Performed under Sharia and veterinary supervision with on-site cameras.") },
        { id: "pack", title: l("تقطيع وتغليف", "Cutting and packaging"), desc: l("تقطيع صحي وتغليف فوري للحفاظ على الطزاجة قبل التوزيع.", "Hygienic cutting and immediate packaging for freshness.") },
      ],
    },
    impact: {
      title: l("وقف يكبر… وأثر يتضاعف كل سنة", "A waqf that grows, an impact that multiplies every year"),
      lead: l(
        "يعود عائد بيع الإنتاج لزيادة عدد الرؤوس ولأنشطة المؤسسة، لنخدم أسرًا أكثر بالجودة نفسها ودون عبء إضافي على المتبرعين.",
        "Income from the farm's output grows the herd and funds the foundation, so we serve more families at the same quality with no extra burden on donors.",
      ),
      items: [],
    },
    allocation: {
      title: l("كل جنيه في الصك له مكان شفاف", "Every pound of the share has a transparent place"),
      lead: l("صك الأضحية بالتكلفة الفعلية دون هامش ربح، بإشراف وزارة التضامن الاجتماعي.", "Qurbani shares at actual cost with no margin, under Ministry of Social Solidarity oversight."),
      extraLabel: l("النسبة المئوية (رقم فقط)", "Percentage (number only)"),
      items: [
        { id: "raising", title: l("تربية الماشية والأعلاف بالدقهلية", "Livestock raising and feed (Dakahlia)"), desc: l("", ""), extra: l("70", "70") },
        { id: "slaughter", title: l("الذبح الشرعي والتقطيع والتغليف", "Sharia slaughter, cutting and packaging"), desc: l("", ""), extra: l("18", "18") },
        { id: "transport", title: l("النقل والتوصيل إلى باب البيت في المنصورة وميت غمر وطلخا", "Transport and doorstep delivery (Mansoura, Mit Ghamr, Talkha)"), desc: l("", ""), extra: l("8", "8") },
        { id: "documentation", title: l("التوثيق والمتابعة", "Documentation and follow-up"), desc: l("", ""), extra: l("4", "4") },
      ],
    },
    allocation_note: {
      title: l("0% هامش ربح على الصك. راجع التقرير المحاسبي السنوي في صفحة الشفافية.", "0% margin on shares. See the annual audit on the Transparency page."),
      items: [],
    },
    packages: {
      title: l("أسهم الوقف", "Waqf shares"),
      lead: l("اختر سهمك في أصل الوقف.", "Choose your share in the waqf's assets."),
      items: [],
    },
  },

  faq: [
    { q: l("ما سعر صك الأضحية في الدقهلية 2026؟", "What is the Qurbani share price in Dakahlia 2026?"), a: l("صك سُبع جاموسي بـ14,000 جنيه، وصك سُبع بقري بـ16,000 جنيه، والخروف الكامل بـ14,500 جنيه، والسعر يشمل الذبح والتقطيع والتوزيع داخل الدقهلية دون أي عمولة.", "1/7 buffalo share EGP 14,000, 1/7 cow share EGP 16,000 and a whole sheep EGP 14,500, including slaughter, cutting and distribution in Dakahlia with no commission.") },
    { q: l("هل يصل اللحم في يوم العيد فعلًا؟", "Will the meat really arrive on Eid day?"), a: l("نعم، يتم التوزيع في يوم العيد نفسه بقوافل اليسر في المنصورة وميت غمر وطلخا والسنبلاوين، وتصلك صور التسليم والفيديو خلال 24 ساعة.", "Yes, same-day distribution by Al-Yusr convoys in Mansoura, Mit Ghamr, Talkha and Sinbillawayn, with photo and video proof within 24 hours.") },
    { q: l("كيف أتأكد من أن صكي وصل إلى أسرة مستحقة فعلًا؟", "How do I know my share reaches a deserving family?"), a: l("تدخل كل أسرة قاعدة بيانات اليسر بعد معاينة الفريق الميداني وتأكيد إمام المسجد أو الوحدة الاجتماعية في القرية، ونرسل لك رقم متابعة لتتبع تبرعك.", "Every family is vetted by our field team and confirmed by the local imam or social unit, and you get a tracking reference.") },
    { q: l("هل يمكنني حجز صك أضحية وأنا خارج مصر؟", "Can I reserve from outside Egypt?"), a: l("نعم، يمكنك الحجز أونلاين بفيزا أو ماستر كارد من أي دولة، أو التحويل عبر إنستاباي إلى الحساب الرسمي للمؤسسة، وسنرسل لك التوثيق على واتساب.", "Yes, pay online by Visa or Mastercard from any country, or transfer via InstaPay to the official account. We send proof on WhatsApp.") },
    { q: l("هل هناك فرق بين ماشية المزرعة الوقفية والماشية المستوردة؟", "Is waqf-farm livestock different from imported meat?"), a: l("ماشيتنا بلدي 100% من المزرعة الوقفية بالدقهلية، محصّنة بسجل بيطري، ومُربّاة على أعلاف بلدي دون هرمونات، وهذا ما يجعل اللحم طازجًا وآمنًا للأسر.", "Our livestock is 100% local from the Dakahlia waqf farm, vaccinated and raised on hormone-free local feed.") },
    { q: l("هل يمكنني زيارة المزرعة قبل الحجز؟", "Can I visit the farm before reserving?"), a: l("نعم، نرحب بزيارة المتبرعين للمزرعة الوقفية بالدقهلية بموعد مسبق. تواصل معنا على واتساب 01097000137 لنحدد لك موعدًا.", "Yes, donor visits are welcome by appointment. WhatsApp us on 01097000137.") },
  ],

  cta: {
    title: l("صكّك… يدخل بيتًا محتاجًا", "Your share reaches a home in need"),
    sub: l("ادعم المزرعة الوقفية بصك أضحية أو بسهم في الوقف نفسه، وكن سببًا في استدامة العطاء.", "Support the waqf farm with a Qurbani share or a share in the waqf itself, and keep the giving going."),
  },
};

export default FARM;
