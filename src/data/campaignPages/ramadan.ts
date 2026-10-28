import { l, type CampaignPageContent } from "./types";

/**
 * Default content for the Ramadan season landing page (/ramadan).
 * Ids and section keys are referenced by `src/pages/landings/RamadanLanding.tsx`; keep them stable.
 * Price ids: iftar, fitr, meat, eid_clothes, box, bride.
 * Stat ids: boxes, brides, zakat_families, orphans, iftar_meals, cattle, sheep, sadaqa (value null; parts in `note`, joined by " · ").
 * Section keys: table, gifts, moon, feed, fitr, achievements.
 */
const ramadan: CampaignPageContent = {
  hero: {
    eyebrow: l("موسم الخير · شهر رمضان المبارك", "Season of Giving · the blessed month of Ramadan"),
    title: l("رمضانك في اليسر", "Your Ramadan with Al-Yusr"),
    title2: l("إحسانٌ لا ينقطع", "goodness without end"),
    lead: l(
      "في شهر الجود تتضاعف الحسنات. كرتونة تكفي أسرة الشهر، ووجبة إفطار ساخنة، ولحوم من مزارعنا الوقفية، وكسوة عيد، وعروسة تكتمل فرحتها.",
      "In the month of generosity, rewards multiply: a box that feeds a family for the month, a hot iftar, meat from our farms, Eid clothes, and a bride's joy made complete.",
    ),
    donateLabel: l("تبرّع لرمضان الآن", "Donate to Ramadan"),
  },

  hadith: {
    text: l(
      "مَن فطَّر صائماً كان له مثلُ أجره، غيرَ أنه لا ينقصُ من أجر الصائم شيئاً",
      "Whoever gives iftar to a fasting person earns the same reward, without the fasting person's reward being reduced at all.",
    ),
    source: l("رواه الترمذي وقال: حسن صحيح", "al-Tirmidhi, who graded it hasan sahih"),
  },

  prices: [
    { id: "iftar", label: l("وجبة إفطار صائم ساخنة", "Hot iftar meal"), amount: 95, note: l("مطبخ اليسر", "Daily iftar") },
    { id: "fitr", label: l("زكاة الفطر عن فرد", "Zakat al-Fitr per person"), amount: 75, note: l("مصارف شرعية", "Zakat") },
    { id: "meat", label: l("سهم لحوم بلدي (1 كجم)", "Farm meat share (1 kg)"), amount: 420, note: l("من مزارعنا", "Our farms") },
    { id: "eid_clothes", label: l("كسوة عيد لطفل يتيم وعلبة كعك", "Orphan Eid outfit + cookies"), amount: 650, note: l("فرحة العيد", "Eid joy") },
    { id: "box", label: l("كرتونة رمضان الكبرى (25 كجم)", "Ramadan box (25 kg)"), amount: 950, note: l("تكفي أسرة الشهر", "A family's month") },
    { id: "bride", label: l("سهم تيسير زواج عروسة يتيمة", "Orphan bride share"), amount: 1500, note: l("الفرحة فرحتين", "Double joy") },
  ],

  /** Last Ramadan's results. */
  stats: [
    { id: "boxes", label: l("كرتونة رمضان", "Ramadan boxes"), value: 1400, unit: l("كرتونة", "boxes") },
    { id: "brides", label: l("تيسير زواج", "Brides supported"), value: 21, unit: l("عروسة", "brides") },
    { id: "zakat_families", label: l("زكاة المال", "Zakat al-Mal"), value: 678, unit: l("أسرة مستفيدة", "families") },
    { id: "orphans", label: l("كفالة أيتام", "Orphans sponsored"), value: 320, unit: l("طفل", "children") },
    { id: "iftar_meals", label: l("وجبات إفطار", "Iftar meals"), value: 3870, unit: l("وجبة", "meals") },
    { id: "cattle", label: l("ذبائح رمضان — أبقار", "Ramadan sacrifices — cattle"), value: 9, unit: l("رأس", "head") },
    { id: "sheep", label: l("ذبائح رمضان — خراف", "Ramadan sacrifices — sheep"), value: 13, unit: l("رأس", "head") },
    {
      id: "sadaqa",
      label: l("صدقات جارية", "Ongoing charity"),
      value: null,
      note: l(
        "٥٠ وصلة مياه · مسابقة تحفيظ قرآن لـ ٢٠٠ طالب · بناء ٥ أسقف",
        "50 water connections · Quran competition for 200 students · 5 roofs built",
      ),
    },
  ],

  sections: {
    table: {
      title: l("اختر ما تضعه على سفرة أسرة صائمة", "Choose what you bring to a fasting family's table"),
      lead: l("سفرة الخير", "The giving table"),
      items: [],
    },
    gifts: {
      title: l("ستّ عطايا في شهر واحد", "Six gifts in one month"),
      items: [
        { id: "box", title: l("كرتونة الخير (25 كجم)", "The 25 kg blessing box"), desc: l("سفرة تكفي الأسرة الشهر: أرز وزيت وسكر ومكرونة وبقوليات وشاي وصلصة وسمن، مع بروتين طازج من مزارعنا.", "A month's pantry: rice, oil, sugar, pasta, legumes, tea, sauce and ghee, with fresh protein from our farms.") },
        { id: "kitchen", title: l("مطبخ اليسر للإفطار", "Al-Yusr iftar kitchen"), desc: l("آلاف الوجبات الساخنة يومياً لعابري السبيل ومرافقي المرضى والأسر المتعففة في بيوتها.", "Thousands of hot meals daily for travellers, patients' companions and families at home.") },
        { id: "meat", title: l("ذبائح المزارع الوقفية", "Endowment farm meat"), desc: l("أكثر من 2 طن لحوم في رمضان من إنتاج مزارعنا الخيرية، طازجة ومضمونة.", "Over 2 tons of fresh meat each Ramadan from our charitable farms.") },
        { id: "brides", title: l("الفرحة فرحتين", "Double joy"), desc: l("تجهيز العرائس اليتيمات وغير القادرات، لتجتمع فرحة الزواج وفرحة العيد.", "Trousseaus for orphan brides, so the joy of marriage meets the joy of Eid.") },
        { id: "eid", title: l("كسوة العيد وكعك الفرحة", "Eid clothes and cookies"), desc: l("ملابس عيد جديدة للأطفال الأيتام وعلب كعك للأسر، ليعيش كل طفل فرحة العيد كاملة.", "New Eid clothes for orphans and cookies for families, so every child has a full Eid.") },
        { id: "zakat", title: l("زكاة المال وزكاة الفطر", "Zakat al-Mal and al-Fitr"), desc: l("نصرف زكاة المال في مصارفها الشرعية، ونوزع زكاة الفطر في وقتها قبل صلاة العيد.", "Zakat al-Mal goes to its legitimate recipients; Zakat al-Fitr is given out before the Eid prayer.") },
      ],
    },
    /** Moon timeline: `extra` is the month/phase label; the phase icon is chosen by index in page code. */
    moon: {
      title: l("مع الهلال حتى العيد", "From the crescent to Eid"),
      items: [
        { id: "shaban", extra: l("شعبان", "Sha'ban"), title: l("التجهيز المبكر", "Early preparation"), desc: l("شراء السلع وتعبئة الكراتين وإعداد قوائم المستحقين، لتصل الكرتونة قبل أول يوم صيام.", "Buying, packing and finalising recipient lists so boxes arrive before the first fast.") },
        { id: "ramadan", extra: l("رمضان", "Ramadan"), title: l("طوال الشهر", "All month"), desc: l("تشغيل المطبخ يومياً، وقوافل التوزيع تصل لقرى الدقهلية وكفر الشيخ والشرقية حتى باب البيت.", "The kitchen runs daily and convoys reach villages in Dakahlia, Kafr El Sheikh and Sharqia.") },
        { id: "eid", extra: l("العشر الأواخر والعيد", "Last ten days & Eid"), title: l("ختام الشهر", "Closing the month"), desc: l("صرف زكاة الفطر، وتوزيع كسوة العيد والكعك على الأيتام، ومسابقات القرآن الكريم.", "Zakat al-Fitr, Eid clothes and cookies for orphans, and Quran competitions.") },
      ],
    },
    /** Hadith figure label (title) + iftar counter card (item: heading + subline; `{n}` is replaced by the iftar price). */
    feed: {
      title: l("فطّر صائماً", "Feed a fasting person"),
      items: [
        { id: "counter", title: l("كم صائماً تفطّر؟", "How many will you feed?"), desc: l("الوجبة الساخنة بـ {n} جنيه من مطبخ اليسر", "A hot meal from the Al-Yusr kitchen is {n} EGP") },
      ],
    },
    fitr: {
      title: l("زكاة الفطر", "Zakat al-Fitr"),
      lead: l("أخرجها عنك وعمّن تعول، ونوصلها في وقتها", "Give it for yourself and your dependants; we deliver it on time"),
      items: [
        { id: "everyone", title: l("تُخرج عن كل فرد في الأسرة، صغيراً كان أو كبيراً.", "It is due for every member of the household, young or old."), desc: l("", "") },
        { id: "timing", title: l("نحصر الأسر المستحقة مسبقاً، ونوزعها في العشر الأواخر حتى صباح العيد قبل الصلاة.", "We list eligible families in advance and distribute during the last ten days until Eid morning, before the prayer."), desc: l("", "") },
        { id: "channels", title: l("تُصرف في مصارفها الشرعية، ولا تُخلط بالصدقات العامة.", "It is spent on its legitimate recipients and never mixed with general charity."), desc: l("", "") },
      ],
    },
    achievements: {
      title: l("إنجازات رمضان السابق", "Last Ramadan's achievements"),
      items: [
        { id: "heading", title: l("إنجازات رمضان السابق", "Last Ramadan's achievements"), desc: l("بفضل الله ثم بتبرعاتكم", "By Allah's grace, then your gifts") },
      ],
    },
  },

  faq: [
    {
      q: l("ما هي مكونات كرتونة رمضان في مؤسسة اليسر؟", "What are the contents of Al-Yusr's Ramadan Box?"),
      a: l(
        "كرتونة متكاملة تزن حوالي 25 كجم من السلع الأساسية البلدي (أرز، زيت، سكر، مكرونة، لوبيا، فاصوليا، شاي، صلصة، سمن) ويُرفق معها لحوم طازجة من مزارعنا لتكفي الأسرة شهراً كاملاً.",
        "A 25kg box containing premium rice, oil, sugar, pasta, legumes, tea, sauce, and ghee, accompanied by fresh meat from our endowment farms.",
      ),
    },
    {
      q: l("أين توزع وجبات الإفطار الساخنة؟", "Where are hot iftar meals distributed?"),
      a: l(
        "توزع يومياً لعابري السبيل والمسافرين ومرافقي المرضى في المستشفيات الحكومية، بالإضافة إلى وجبات ساخنة تصل لمنازل الأسر المتعففة في المنصورة وقرى الدقهلية.",
        "To hospital patient companions, stranded travelers, and directly to the doors of deserving families across Mansoura and Delta villages.",
      ),
    },
    {
      q: l("كيف تضمن المؤسسة وصول زكاة الفطر في موعدها الشرعي؟", "How is Zakat Al-Fitr distributed on time?"),
      a: l(
        "يتم حصر الأسر وتحديد احتياجاتها مسبقاً، ويتم إخراج وتوزيع زكاة الفطر خلال العشر الأواخر وحتى صباح يوم العيد قبل الصلاة تماماً كما تنص الشريعة.",
        "Distributed during the last ten days of Ramadan and completed before Eid prayer according to Sharia guidelines.",
      ),
    },
    {
      q: l("هل يمكنني التبرع بتجهيز عروسة يتيمة في رمضان؟", "Can I sponsor an orphan bride's trousseau in Ramadan?"),
      a: l(
        "نعم، مبادرة 'الفرحة فرحتين' تتيح لك التبرع بسهم أو كفالة جهاز عروسة يتيمة كامل لتدخل الفرحة عليها مع حلول العيد.",
        "Yes. The 'Double Joy' initiative lets you give a share, or sponsor a complete trousseau, for an orphan bride so her joy arrives with Eid.",
      ),
    },
    {
      q: l("هل توزع كرتونة رمضان في المنصورة والدقهلية؟", "Is the Ramadan box distributed in Mansoura and Dakahlia?"),
      a: l(
        "نعم، تنطلق قوافل التوزيع من المنصورة إلى قرى الدقهلية وكفر الشيخ والشرقية، وتصل الكرتونة إلى باب بيت الأسرة المستحقة بعد حصرها مسبقاً، ويُوثَّق التوزيع بالصور والفيديو.",
        "Yes. Distribution convoys set out from Mansoura to villages across Dakahlia, Kafr El Sheikh and Sharqia, delivering the box to the door of each pre-listed family, with photo and video documentation.",
      ),
    },
    {
      q: l("متى تُخرج زكاة الفطر مع مؤسسة اليسر؟", "When should I pay Zakat al-Fitr with Al-Yusr?"),
      a: l(
        "يمكنك إخراجها عبر صفحة التبرع في أي وقت خلال شهر رمضان، وتتولى المؤسسة صرفها للأسر المستحقة في الدقهلية والمنصورة خلال العشر الأواخر وحتى صباح العيد قبل الصلاة.",
        "You can pay it through the donation page at any time during Ramadan; the Foundation hands it to eligible families in Dakahlia and Mansoura during the last ten days and until Eid morning, before the prayer.",
      ),
    },
    {
      q: l("هل يمكن التبرع لموسم الخير من خارج مصر؟", "Can I donate to the Ramadan season from outside Egypt?"),
      a: l(
        "نعم، يمكنك التبرع أونلاين من أي دولة ببطاقة فيزا أو ماستر كارد، أو التحويل عبر إنستاباي للحساب الرسمي للمؤسسة، ويصلك توثيق التوزيع بالصور والفيديو على الواتساب أو البريد الإلكتروني.",
        "Yes. You can donate online from any country by Visa or Mastercard, or transfer via InstaPay to the Foundation's official account, and you receive photo and video proof of distribution on WhatsApp or email.",
      ),
    },
  ],

  cta: {
    title: l(
      "رمضانك في اليسر إحسان لا ينقطع — اكفل كرتونة أو وجبة إفطار اليوم",
      "Your Ramadan with Al-Yusr is endless goodness — sponsor a box or meal today",
    ),
    sub: l(
      "كل جنيه يصل لمستحقه — موثّق بالصور والفيديو ومتابعة ميدانية.",
      "Every EGP reaches the right hands — verified with photos, video and field follow-up.",
    ),
  },
};

export default ramadan;
