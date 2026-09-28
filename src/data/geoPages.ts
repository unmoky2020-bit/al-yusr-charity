/**
 * Localized geo landing pages: /geo/:governorate/:program
 *
 * Each combination ships with its own bilingual SEO copy + LocalBusiness
 * schema + hreflang to maximise local search ranking ("صك أضحية في الفيوم"
 * style queries). Kept intentionally small and unique — never re-uses copy
 * from program pages or other geos to avoid cannibalisation.
 */

export type GeoProgramCopy = {
  ar: { headline: string; intro: string; whyHere: string; coverage: string; faq: { q: string; a: string }[] };
  en: { headline: string; intro: string; whyHere: string; coverage: string; faq: { q: string; a: string }[] };
};

export type GeoGovernorate = {
  slug: string;
  ar: string;
  en: string;
  region: string;          // ar
  lat: number;
  lon: number;
  /** copy keyed by program slug */
  programs: Record<string, GeoProgramCopy>;
};

const odhyaCopy = (gAr: string, gEn: string, region: string): GeoProgramCopy => ({
  ar: {
    headline: `صك الأضحية في ${gAr} — توصيل لباب البيت يوم العيد`,
    intro: `بنوزّع صكوك الأضحية في ${gAr} على الأسر الأكثر استحقاقاً، مع معاينة شرعية قبل الذبح وتوثيق بالصور والفيديو في نفس يوم العيد.`,
    whyHere: `فريق اليسر في ${gAr} بيتعامل مع شيوخ الجوامع والوحدات الاجتماعية لتحديد المستحقين فعلاً، وبيوصّل اللحمة طازجة بدون تخزين.`,
    coverage: `تغطية كاملة لمراكز وقرى ${gAr} في إقليم ${region}، مع توصيل مجاني للأسر اللي ما تقدرش تيجي بنفسها.`,
    faq: [
      { q: `إيه ضمان جودة الأضحية في ${gAr}؟`, a: "كل ذبيحة بتعدّي على بيطري معتمد قبل وبعد الذبح، والتقرير المصوّر بيوصلك في خلال 48 ساعة." },
      { q: `هل أقدر أحضر التوزيع في ${gAr}؟`, a: "أيوه، نقدر نرتّبلك زيارة ميدانية أو تتابع البث المباشر يوم العيد." },
    ],
  },
  en: {
    headline: `Qurbani in ${gEn} — Doorstep Delivery on Eid`,
    intro: `We distribute Qurbani shares in ${gEn} to the neediest families, with Shariah inspection before slaughter and full photo/video documentation on Eid day itself.`,
    whyHere: `Our ${gEn} team partners with mosque imams and local social units to identify deserving families and deliver fresh meat with no storage.`,
    coverage: `Full coverage of ${gEn} districts and villages in ${region} region, with free delivery for families unable to attend in person.`,
    faq: [
      { q: `What guarantees the Qurbani quality in ${gEn}?`, a: "Every animal passes a certified vet check pre- and post-slaughter, and you receive the photo report within 48 hours." },
      { q: `Can I attend distribution in ${gEn}?`, a: "Yes — we can arrange an on-site visit or share the live stream from Eid day." },
    ],
  },
});

const boxCopy = (gAr: string, gEn: string, region: string): GeoProgramCopy => ({
  ar: {
    headline: `كرتونة العزومة في ${gAr} — مؤن شهر كامل للأسر المحتاجة`,
    intro: `كرتونة العزومة بتسد احتياج عيلة كاملة في ${gAr} لمدة شهر، فيها زيت وأرز وسكر ومكرونة وبقوليات ولحوم وسلع أساسية بمواصفات سوبر ماركت.`,
    whyHere: `بنشتري السلع من تجار الجملة في ${gAr} نفسها لتقليل التكلفة ودعم السوق المحلي، والتوزيع بيتم عن طريق متطوعين من نفس المنطقة.`,
    coverage: `بنغطي قرى ومراكز ${gAr} داخل إقليم ${region} بشكل دوري، مع أولوية للأسر اللي عندها أيتام أو مرضى أو كبار سن.`,
    faq: [
      { q: `إمتى بتوصل الكرتونة في ${gAr}؟`, a: "خلال 5 أيام عمل من تأكيد التبرع، وفي رمضان خلال 48 ساعة." },
      { q: "هل تقدر تخصص الكرتونة لأسرة معينة؟", a: "أيوه، تقدر تطلب تخصيص لأسرة عندك بياناتها أو نختارلك من قاعدة بياناتنا." },
    ],
  },
  en: {
    headline: `Food Box in ${gEn} — A Month of Essentials for Needy Families`,
    intro: `Our food box covers a full family in ${gEn} for a month with oil, rice, sugar, pasta, legumes, meat and household essentials at supermarket grade.`,
    whyHere: `We source from wholesale suppliers in ${gEn} itself to lower cost and support the local economy; distribution is handled by volunteers from the same area.`,
    coverage: `We cover ${gEn} villages and districts in ${region} on a rotating basis, prioritising families with orphans, sick members or elderly.`,
    faq: [
      { q: `When does the box arrive in ${gEn}?`, a: "Within 5 working days of donation confirmation; during Ramadan within 48 hours." },
      { q: "Can I designate a specific family?", a: "Yes — give us their details or let us pick from our verified database." },
    ],
  },
});

const waterCopy = (gAr: string, gEn: string, region: string): GeoProgramCopy => ({
  ar: {
    headline: `سقيا الماء في ${gAr} — وصلات مياه نظيفة للأسر الأكثر فقراً`,
    intro: `بنركّب وصلات مياه نظيفة لأسر ${gAr} اللي بتشيل المياه على بُعد كيلومترات، وبنحفر آبار ارتوازية للقرى البعيدة عن الشبكة.`,
    whyHere: `بنشتغل مع شركة مياه ${gAr} بتصاريح رسمية، وكل وصلة بتطلع باسم الأسرة عشان متبقاش عرضة للقطع.`,
    coverage: `أولوية لقرى ${region} الطرفية، خصوصاً اللي فيها أطفال بيمشوا لجلب المياه أو نسبة أمراض كلى عالية.`,
    faq: [
      { q: `كم تكلفة وصلة المياه في ${gAr}؟`, a: "تبدأ من 1500 جنيه شاملة العداد والتوصيل والتركيب." },
      { q: "هل في صيانة مستمرة بعد التركيب؟", a: "أيوه، فريقنا بيتابع الوصلة لمدة سنة كاملة بدون تكلفة إضافية." },
    ],
  },
  en: {
    headline: `Clean Water in ${gEn} — Connections for the Poorest Families`,
    intro: `We install clean water connections for ${gEn} families who carry water for kilometres, and drill artesian wells for villages off the grid.`,
    whyHere: `We operate with the official ${gEn} water company; every line is registered in the family's name so it can never be cut.`,
    coverage: `Priority for remote ${region} villages — especially those where children walk to fetch water or kidney-disease rates are high.`,
    faq: [
      { q: `What does a water line cost in ${gEn}?`, a: "From 1,500 EGP including meter, piping and installation." },
      { q: "Is post-install maintenance covered?", a: "Yes, our team monitors the connection for a full year at no extra cost." },
    ],
  },
});

/**
 * Lightweight builder used for the rest of the programs so every (governorate,
 * program) pair has unique bilingual copy without bloating this file.
 * `n` is the program's display name in each language and `theme` is a short
 * sentence describing what the program delivers.
 */
const genericCopy = (
  nAr: string, nEn: string, themeAr: string, themeEn: string,
) => (gAr: string, gEn: string, region: string): GeoProgramCopy => ({
  ar: {
    headline: `${nAr} في ${gAr} — تسليم ميداني موثّق لباب البيت`,
    intro: `${nAr} في ${gAr}: ${themeAr} بإشراف فريق اليسر الميداني وبحث اجتماعي قبل الصرف وتوثيق بالصور والفيديو.`,
    whyHere: `فريقنا في ${gAr} بيتعامل مع شيوخ الجوامع والوحدات الاجتماعية لاختيار الأسر الفعلية المحتاجة، وبيوصّل الخير بكرامة كاملة بدون إعلانات على الأسرة.`,
    coverage: `بنغطي كل مراكز وقرى ${gAr} في إقليم ${region}، مع أولوية للأسر اللي عندها أيتام أو مرضى أو كبار سن.`,
    faq: [
      { q: `إيه ضمانات الجودة لـ ${nAr} في ${gAr}؟`, a: "كل تبرع يمر بمعاينة ميدانية وتوثيق مصوّر، ويوصلك تقرير الصرف خلال 48 ساعة من التنفيذ." },
      { q: `إمتى يبدأ تنفيذ ${nAr} في ${gAr}؟`, a: "خلال 5 أيام عمل من تأكيد التبرع، وفي المواسم خلال 48 ساعة." },
    ],
  },
  en: {
    headline: `${nEn} in ${gEn} — Documented Field Delivery`,
    intro: `${nEn} in ${gEn}: ${themeEn} under Al-Yusr's field team, with social assessment before spending and full photo/video documentation.`,
    whyHere: `Our ${gEn} team partners with mosque imams and local social units to identify truly deserving families, and delivers aid with full dignity and no public exposure.`,
    coverage: `Full coverage of ${gEn} districts and villages in ${region}, prioritising families with orphans, sick members or elderly.`,
    faq: [
      { q: `What quality guarantees ${nEn} in ${gEn}?`, a: "Every donation passes field assessment and photo documentation; you receive the spending report within 48 hours." },
      { q: `How soon does ${nEn} start in ${gEn}?`, a: "Within 5 working days of donation confirmation, or 48 hours during peak seasons." },
    ],
  },
});

const PROGRAM_BUILDERS: Record<string, (gAr: string, gEn: string, region: string) => GeoProgramCopy> = {
  odhya: odhyaCopy,
  box: boxCopy,
  water: waterCopy,
  zakat: genericCopy("زكاة المال", "Zakat", "توزيع الزكاة على المصارف الشرعية الثمانية بإشراف محاسبي مستقل", "Zakat distributed across the eight Shariah channels with independent accounting"),
  education: genericCopy("الكفالة التعليمية", "Education sponsorship", "مصاريف وأدوات وزي مدرسي لأطفال الأسر المستحقة قبل بداية الدراسة", "Tuition, supplies and uniforms for children before the school year begins"),
  bride: genericCopy("تجهيز عرايس اليسر", "Bride trousseau", "تجهيز شقة كاملة بغرفة نوم وصالون ومطبخ وأجهزة لكل عروسة مستحقة", "A full apartment — bedroom, living room, kitchen and appliances — for every deserving bride"),
  shelter: genericCopy("ستر بيوت", "Home shelter", "تسقيف عازل بالبوتامين وأبواب وشبابيك آمنة لحماية الأسر من البرد والمطر", "Insulated bitumen roofing with safe doors and windows to protect families from cold and rain"),
  orphans: genericCopy("كفالة يتيم", "Orphan sponsorship", "كفالة شهرية لطفل يتيم مع تقرير شهري بالصور والفيديو ومتابعة مدرسية وصحية", "Monthly sponsorship of an orphan with a monthly photo/video report and school & health follow-up"),
  treatment: genericCopy("علاج الحالات الحرجة", "Medical treatment", "تغطية تكاليف العمليات والعلاج للحالات الحرجة عبر مستشفيات شريكة معتمدة", "Covering surgeries and treatment for critical cases through certified partner hospitals"),
  prosthetics: genericCopy("أطراف صناعية وكراسي", "Prosthetics & wheelchairs", "أطراف صناعية وكراسي متحركة وأجهزة مساعدة لذوي الهمم", "Prosthetics, wheelchairs and assistive devices for people of determination"),
  kitchen: genericCopy("مطبخ اليسر", "Al-Yusr kitchen", "آلاف الوجبات الساخنة يوميًا للأسر والمرضى وأبناء السبيل", "Thousands of hot meals daily for families, patients and travellers"),
  markoun: genericCopy("مركون اليسر", "Markoun reuse", "إعادة تدوير الأثاث والأجهزة والملابس المستعملة وتوصيلها لأسر محتاجة بحالة ممتازة", "Refurbished furniture, appliances and clothing delivered to needy families in great condition"),
};

const buildGov = (
  slug: string, ar: string, en: string, region: string, lat: number, lon: number,
  programSlugs: string[],
): GeoGovernorate => ({
  slug, ar, en, region, lat, lon,
  programs: Object.fromEntries(programSlugs.map((p) => [p, PROGRAM_BUILDERS[p](ar, en, region)])),
});

/**
 * All long-running Al-Yusr programs are surfaced in every covered governorate
 * so the /geo grid offers one landing page per (program × city) combination.
 * Markoun (reuse) is included so donors of household items can find a local
 * collection point.
 */
const ALL_PROGRAMS = [
  "odhya","box","water","zakat","education","bride","shelter",
  "orphans","treatment","prosthetics","kitchen","markoun",
];

export const GEO_GOVERNORATES: GeoGovernorate[] = [
  buildGov("dakahlia",       "الدقهلية",     "Dakahlia",       "دلتا مصر",     31.038, 31.381, ALL_PROGRAMS),
  buildGov("sharqia",        "الشرقية",      "Sharqia",        "دلتا مصر",     30.587, 31.502, ALL_PROGRAMS),
  buildGov("kafr-el-sheikh", "كفر الشيخ",    "Kafr El Sheikh", "دلتا مصر",     31.111, 30.940, ALL_PROGRAMS),
  buildGov("fayoum",         "الفيوم",       "Fayoum",         "صعيد مصر",     29.310, 30.842, ALL_PROGRAMS),
  buildGov("minya",          "المنيا",       "Minya",          "صعيد مصر",     28.087, 30.762, ALL_PROGRAMS),
  buildGov("cairo",          "القاهرة",      "Cairo",          "إقليم القاهرة الكبرى", 30.044, 31.236, ALL_PROGRAMS),
];

export const getGeo = (slug: string) => GEO_GOVERNORATES.find((g) => g.slug === slug);

/** All (governorate, program) pairs — used by sitemap. */
export const ALL_GEO_PAIRS = GEO_GOVERNORATES.flatMap((g) =>
  Object.keys(g.programs).map((p) => ({ governorate: g.slug, program: p })),
);