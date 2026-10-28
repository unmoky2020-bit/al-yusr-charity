import { l, type CampaignPageContent } from "./types";

/**
 * Default content for the Dhill campaign landing page (/dhill).
 * The page layout lives in `src/pages/landings/DhillLanding.tsx`; ids and section keys below are
 * referenced there and must stay stable. The dashboard edits the text/amounts only.
 */
const DHILL: CampaignPageContent = {
  hero: {
    eyebrow: l("حملة ظِلّ · صدقة جارية وسقيا ماء", "Dhill · ongoing charity & water"),
    title: l("نُظِلّهم اليوم", "We shade them today"),
    title2: l("عسى أن يُظِلّنا الله", "that Allah may shade us"),
    lead: l(
      "إذا كنا لا نتحمل حر الصيف في الدنيا، فكيف بحر يوم القيامة؟ حملة ظِلّ سقفٌ وماءٌ ونسمة هواء لأهالينا المستحقين، وصدقة جارية وظلٌّ لك يوم لا ظل إلا ظله.",
      "If we cannot bear summer heat in this world, what of the Day of Judgment? Dhill brings roofs, water and fresh air to families in need: ongoing charity and shade for your hereafter.",
    ),
    donateLabel: l("تبرّع لحملة ظِلّ", "Donate to Dhill"),
  },

  hadith: {
    text: l("أفضلُ الصدقةِ سَقْيُ الماء", "The best charity is giving water to drink."),
    source: l("رواه أبو داود والنسائي وابن ماجه، وحسّنه الألباني", "Abu Dawud, al-Nasa'i and Ibn Majah; graded hasan by al-Albani"),
  },

  prices: [
    { id: "roof_share", label: l("سهم في سقف", "Roof share"), amount: 500 },
    { id: "roof_full", label: l("سقف منزل متكامل", "Complete roof"), amount: 16000, note: l("سقف منزل متكامل ومعزول", "Complete insulated roof") },
    { id: "water_share", label: l("سهم في وصلة مياه", "Water share"), amount: 500 },
    { id: "water_full", label: l("وصلة مياه كاملة", "Full connection"), amount: 7500, note: l("وصلة مياه منزلية كاملة", "Full home water connection") },
    { id: "fan", label: l("مروحة سقف أو حائط", "Ceiling or wall fan"), amount: 950, note: l("مروحة سقف أو حائط", "Ceiling or wall fan") },
  ],

  stats: [],

  sections: {
    /** Page title + tagline used by the landing shell (SEO heading, structured data). No items. */
    seo: {
      title: l(
        "حملة ظِلّ — «نُظِلّهم اليوم عسى أن يُظِلّنا الله يوم القيامة»",
        "Dhill Campaign — 'Provide shade today, that Allah may shade us on the Day of Resurrection'",
      ),
      lead: l(
        "كيف ننجو من حرّ يوم القيامة؟ إذا كنا لا نتحمل حرارة الصيف في الدنيا، فكيف ننجو في الآخرة؟ جاءت حملة ظِلّ لتكون ظلاً وبرداً لأهالينا المستحقين من الفقراء والمساكين، وصدقة جارية وظلاً لك يوم القيامة.",
        "How do we find shade on the Day of Judgment? The Dhill campaign provides roofing, clean water taps, fans and cold drinks for needy families in Egypt — an ongoing charity and shade for your hereafter.",
      ),
      items: [],
    },

    /** Trust bullets under the hero. */
    trust: {
      title: l("لماذا تثق بنا؟", "Why trust us"),
      items: [
        { id: "ngo", title: l("مؤسسة مشهرة برقم 2665 لسنة 2019", "Registered NGO 2665/2019"), desc: l("", "") },
        { id: "docs", title: l("توثيق بالصور والفيديو ورقم تتبع", "Photo, video & tracking number"), desc: l("", "") },
        { id: "areas", title: l("تنفيذ في الدقهلية وكفر الشيخ والشرقية", "Dakahlia, Kafr El Sheikh, Sharqia"), desc: l("", "") },
      ],
    },

    /** The second hadith band right under the hero (single item: title = text, desc = source). */
    hadith2: {
      title: l("حديث الظل", "Hadith of shade"),
      items: [
        {
          id: "seven",
          title: l(
            "«سبعةٌ يُظِلُّهم الله في ظِلِّه يومَ لا ظِلَّ إلا ظِلُّه... ورجلٌ تصدّق بصدقةٍ فأخفاها حتى لا تعلمَ شمالُه ما تُنفقُ يمينُه»",
            "“Seven people Allah will shade in His shade on the Day when there is no shade but His… and a man who gives charity so secretly that his left hand does not know what his right hand gives.”",
          ),
          desc: l("متفق عليه", "Agreed upon (Bukhari & Muslim)"),
        },
      ],
    },

    /** The three tabs. title = tab label, extra = lead line, desc = long description. Icons stay in code. */
    tracks: {
      title: l("سقف، أو ماء، أو نسمة هواء", "A roof, water, or a breeze"),
      lead: l("اختر ظلّك", "Choose your shade"),
      items: [
        {
          id: "roof",
          title: l("السقف", "Roof"),
          extra: l("سقف يحمي من الحر والمطر", "A roof against heat and rain"),
          desc: l(
            "عروق خشبية وألواح متينة معزولة بمشمع بلاستيكي وطبقة خرسانية قوية، بعمر افتراضي من 8 إلى 10 أعوام. ونركّب معه الأبواب والشبابيك لستر الأسرة وحمايتها من حر الصيف وبرد الشتاء.",
            "Solid timber and boards, insulated with plastic sheeting and a reinforced concrete layer, lasting 8–10 years. We also fit doors and windows to protect the family from summer heat and winter wind.",
          ),
        },
        {
          id: "water",
          title: l("الماء", "Water"),
          extra: l("ماء نظيف داخل البيت", "Clean water inside the home"),
          desc: l(
            "وصلة منزلية كاملة: مواسير، وموتور رفع، وخزان، وحوض مطبخ، وحنفيات، ودش، مع التركيب. ونمد خطوط مياه لقرى كاملة بالتنسيق مع شركة مياه الشرب. وتجوز صدقةً جارية عن الأحياء والأموات.",
            "A complete home connection: pipes, pump, tank, kitchen sink, taps and shower, fully installed. We also extend water lines to entire villages with the water authority. Valid as ongoing charity for the living or deceased.",
          ),
        },
        {
          id: "air",
          title: l("الهواء", "Air"),
          extra: l("نسمة هواء في عز الصيف", "A breeze in peak summer"),
          desc: l(
            "توفير وتركيب مراوح السقف والحائط للأسر الأشد احتياجاً، لتخفيف وطأة الحر الشديد على كبار السن والأطفال والمرضى.",
            "Ceiling and wall fans for the families most in need, easing extreme heat for the elderly, children and the sick.",
          ),
        },
      ],
    },

    /** Ongoing charity on behalf of a loved one. */
    dedicate: {
      title: l("اجعل وصلة الماء أجراً لا ينقطع عن والديك", "Make a water tap a lasting reward for your parents"),
      lead: l(
        "سقيا الماء من أحب الأعمال إلى الله ومن أفضل الصدقات الجارية. يمكنك أن تنوي الوصلة أو السهم عن متوفى من أهلك، أو عن والديك وهما أحياء، ويظل أجرها جارياً ما دام الماء يصل إلى البيت.",
        "Giving water is among the most beloved deeds to Allah and among the best ongoing charities. Dedicate a tap or a share to a late relative, or to your living parents; its reward continues as long as the water flows.",
      ),
      items: [
        { id: "choose", title: l("اختر سهماً أو وصلة كاملة", "Choose a share or a full connection"), desc: l("", "") },
        { id: "name", title: l("أرسل لنا اسم من تنوي عنه عبر واتساب مع رقم الإيصال", "Send us the name on WhatsApp with your receipt number"), desc: l("", "") },
        { id: "proof", title: l("نوثّق التنفيذ ونرسل لك الصور والفيديو", "We document the work and send you photos and video"), desc: l("", "") },
      ],
    },

    /** From heat to shade: the three steps. */
    steps: {
      title: l("من الحرّ إلى الظل", "From heat to shade"),
      items: [
        {
          id: "select",
          title: l("نختار الأشد احتياجاً", "We pick the most in need"),
          desc: l(
            "يزور فريق البحث الميداني البيوت ويعاين حالة السقف والمياه والتهوية، وتُعتمد الحالات الأشد احتياجاً أولاً.",
            "Field researchers inspect each home's roof, water and ventilation, and the neediest cases are approved first.",
          ),
        },
        {
          id: "build",
          title: l("ننفذ بأيدٍ محترفة", "Built by professionals"),
          desc: l(
            "متطوعو اليسر يداً بيد مع نجارين وسباكين وبنائين محترفين لضمان الجودة والسرعة.",
            "Al-Yusr volunteers alongside professional carpenters, plumbers and masons.",
          ),
        },
        {
          id: "document",
          title: l("نوثّق ونرسل لك", "Documented and sent to you"),
          desc: l(
            "كل سقف ووصلة ومروحة موثّقة بالصور والفيديو مع رقم تتبع يصلك مباشرة.",
            "Every roof, tap and fan is documented on photo and video with a tracking number sent to you.",
          ),
        },
      ],
    },

    /** "Where we work" heading + intro (no items; the lists are the two sections below). */
    areas: {
      title: l("أين نترك أثراً؟", "Where we work"),
      lead: l("معيارنا الأول أولوية المستحق لا المكان، فنذهب حيث الحاجة أشد.", "Need comes before place: we go where it is greatest."),
      items: [],
    },
    areas_now: {
      title: l("هذا العام", "This year"),
      items: [
        { id: "dakahlia", title: l("الدقهلية", "Dakahlia"), desc: l("", "") },
        { id: "kafr_el_sheikh", title: l("كفر الشيخ", "Kafr El Sheikh"), desc: l("", "") },
        { id: "sharqia", title: l("الشرقية", "Sharqia"), desc: l("", "") },
      ],
    },
    areas_before: {
      title: l("على مدار مسيرتنا أيضاً", "Previously also"),
      items: [
        { id: "fayoum", title: l("الفيوم", "Fayoum"), desc: l("", "") },
        { id: "ismailia", title: l("الإسماعيلية", "Ismailia"), desc: l("", "") },
        { id: "new_valley", title: l("الوادي الجديد", "New Valley"), desc: l("", "") },
        { id: "sohag", title: l("سوهاج", "Sohag"), desc: l("", "") },
        { id: "qena", title: l("قنا", "Qena"), desc: l("", "") },
      ],
    },

    /** Field documentation gallery heading (images stay in code). */
    gallery: {
      title: l("من الميدان", "From the field"),
      items: [],
    },
  },

  faq: [
    {
      q: l("هل يمكن تنفيذ وصلة المياه كصدقة جارية عن المتوفين أو الأحياء؟", "Can water taps be dedicated as Sadaqah Jariyah for living or deceased?"),
      a: l(
        "نعم، بالتأكيد! يمكنك نية الوصلة أو السهم كصدقة جارية عن أحد المتوفين من أسرتك أو عن الأحياء (مثل والديك معاً)؛ فسُقيا الماء من أحب الأعمال إلى الله ومن أفضل الصدقات الجارية.",
        "Yes, absolutely. You can dedicate water connections on behalf of deceased relatives or living parents as lasting continuous charity.",
      ),
    },
    {
      q: l("ما هي مواصفات سقف المنزل في حملة ظل؟", "What are the wooden roof specifications?"),
      a: l(
        "يتضمن عروقاً خشبية وألواحاً متينة، يتم عزلها بمشمع بلاستيكي قوي ثم تغطى بطبقة خرسانية محكمة لحماية الأسرة من الشمس والأمطار بعمر افتراضي 8–10 أعوام.",
        "Treated wooden beams and sturdy boards, insulated with heavy plastic sheeting and topped with a reinforced concrete layer, lasting 8–10 years.",
      ),
    },
    {
      q: l("ما هي مشتملات وصلة المياه المنزلية؟", "What is included in a home water connection?"),
      a: l(
        "تشمل مواسير المياه، موتور رفع، خزان مياه، حوض مطبخ، حنفيات، دش، بالإضافة إلى مصاريف وتكاليف التركيب بالكامل، ويتم اختيار أفضل المواصفات لضمان أطول عمر تشغيلي.",
        "Complete piping, water pump, water tank, kitchen sink, faucets, shower fixtures, and full installation labor.",
      ),
    },
    {
      q: l("هل يمكنني المساهمة بسهم فقط وليس التكلفة كاملة؟", "Can I contribute with a share rather than the full cost?"),
      a: l(
        "نعم، يمكنك شراء سهم في السقف بقيمة 500 جنيه، أو سهم في وصلة المياه بقيمة 500 جنيه، ويشترك عدة متبرعين لإتمام الحالة وتسليمها.",
        "Yes, you can buy a roof share for EGP 500 or a water connection share for EGP 500; several donors' shares complete one unit and we deliver it.",
      ),
    },
    {
      q: l("ما هي المحافظات التي تنفذ فيها حملة ظل؟", "Which governorates does the Dhill campaign cover?"),
      a: l(
        "نركز في الدقهلية، كفر الشيخ، والشرقية، بالإضافة للقرى الأشد احتياجاً في محافظات الصعيد (الفيوم، قنا، سوهاج، الوادي الجديد).",
        "We focus on Dakahlia, Kafr El Sheikh and Sharqia, plus the neediest villages in Upper Egypt (Fayoum, Qena, Sohag, New Valley).",
      ),
    },
    {
      q: l("هل تنفذ حملة ظِلّ وصلات المياه في المنصورة والدقهلية؟", "Does Dhill install water connections in Mansoura and Dakahlia?"),
      a: l(
        "نعم، الدقهلية من محافظات التنفيذ هذا العام، ومعها كفر الشيخ والشرقية. فريق البحث الميداني يعاين البيوت في مراكز الدقهلية وقراها (المنصورة، ميت غمر، طلخا، بلقاس، شربين، السنبلاوين) ويعتمد الأشد احتياجاً أولاً؛ فالأولوية عندنا للمستحق لا للمكان.",
        "Yes. Dakahlia is one of this year's governorates, alongside Kafr El Sheikh and Sharqia. Our field researchers inspect homes across Dakahlia's districts and villages (Mansoura, Mit Ghamr, Talkha, Belqas, Sherbin, Sinbellawein) and approve the neediest cases first; need comes before place.",
      ),
    },
    {
      q: l("كيف أتبرع بوصلة مياه صدقة جارية عن متوفى؟", "How do I dedicate a water connection as ongoing charity for a deceased relative?"),
      a: l(
        "اختر سهماً في وصلة مياه بـ 500 جنيه أو وصلة كاملة بـ 7,500 جنيه، ثم أرسل لنا اسم من تنوي عنه عبر واتساب مع رقم الإيصال. بعد التركيب نوثّق الوصلة بالصور والفيديو ونرسلها لك مع رقم التتبع، ويظل أجرها جارياً ما دام الماء يصل إلى البيت.",
        "Choose a water share (EGP 500) or a full connection (EGP 7,500), then send us the name you are dedicating it to on WhatsApp along with your receipt number. After installation we document the connection on photo and video and send it to you with the tracking number; its reward continues as long as the water flows.",
      ),
    },
    {
      q: l("هل أستطيع حضور تركيب السقف بنفسي؟", "Can I attend the roof installation myself?"),
      a: l(
        "ينفذ التركيب متطوعو اليسر مع نجارين وسباكين وبنائين محترفين، وتُوثَّق كل حالة بالصور والفيديو مع رقم تتبع يصلك مباشرة، فلا يلزم حضورك. وإن أحببت المشاركة ميدانياً فتواصل معنا عبر واتساب أو سجّل في صفحة التطوع لننسّق معك مع فريق الميدان.",
        "Installation is carried out by Al-Yusr volunteers alongside professional carpenters, plumbers and masons, and every case is documented on photo and video with a tracking number sent to you, so attending is not required. If you would like to join us in the field, contact us on WhatsApp or sign up on the volunteer page and we will coordinate with the field team.",
      ),
    },
  ],

  cta: {
    title: l("اكسب ظِلاً يوم القيامة — تبرع لسقف أو وصلة مياه الآن", "Earn shade on the Day of Judgment — support a roof or water tap"),
    sub: l(
      "كل جنيه يصل لمستحقه — موثّق بالصور والفيديو ومتابعة ميدانية.",
      "Every pound reaches those who deserve it — documented with photos, video and field follow-up.",
    ),
  },
};

export default DHILL;
