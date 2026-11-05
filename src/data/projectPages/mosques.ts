import { l, type CampaignPageContent } from "@/data/campaignPages/types";

/**
 * Default content of the mosques page (/mosques). The layout lives in
 * `src/pages/landings/MosquesLanding.tsx`; the ids and section keys below are referenced there and
 * must stay stable. The dashboard (المشاريع → عمارة وبناء بيوت الله → محتوى الصفحة) saves an override in
 * the project's `page_content`. Not here: prices (= the project's donation packages), FAQ (= the FAQ
 * category linked to the project) and the hero image (= the project's cover image).
 * Pictures: `images.gallery` (dashboard → الصور).
 */
const MOSQUES: CampaignPageContent = {
  hero: {
    eyebrow: l("مشروع عمارة المساجد · صدقة جارية", "Mosques project · ongoing charity"),
    title: l("عمارة بيوت الله: بناء مسجد أو إعادة إعماره", "Building God's houses: a new mosque, or bringing one back to life"),
    title2: l("", ""),
    lead: l(
      "في قرى كثيرة يكون المسجد الوحيد مشروخ السقف أو بلا فرش، وفي قرى أخرى لا يوجد مسجد أصلًا. مع اليسر يمكنك المشاركة في بناء مسجد جديد من الأساس، أو في ترميم مسجد قائم وفرشه وتجهيزه، ويجري أجرك مع كل صلاة فيه.",
      "In many villages the only mosque has a cracked roof or a bare floor, and some villages have no mosque at all. With Al-Yusr you can help build a new mosque from the ground up, or restore, carpet and equip one that stands, with reward that continues with every prayer in it.",
    ),
    donateLabel: l("ساهم في عمارة مسجد", "Help build a mosque"),
  },

  hadith: {
    text: l(
      "مَن بنى مسجدًا يبتغي به وجهَ الله، بنى اللهُ له مثلَه في الجنة",
      "Whoever builds a mosque seeking the Face of Allah, Allah will build for him the like of it in Paradise.",
    ),
    source: l("متفق عليه", "Agreed upon (al-Bukhari and Muslim)"),
  },

  prices: [],
  stats: [],

  sections: {
    facts: {
      title: l("المشروع في سطور", "The project at a glance"),
      items: [
        { id: "build", title: l("بناء جديد", "New builds"), desc: l("مسجد من الأساس حتى المئذنة", "From foundations to minaret") },
        { id: "restore", title: l("ترميم", "Restoration"), desc: l("سقف وحوائط وكهرباء ودورات مياه", "Roofs, walls, wiring and washrooms") },
        { id: "furnish", title: l("فرش وتجهيز", "Furnishing"), desc: l("سجاد وإضاءة وتكييف وصوت", "Carpets, lights, cooling and sound") },
        { id: "reward", title: l("صدقة جارية", "Ongoing charity"), desc: l("أجر مع كل ركعة وسجدة", "Reward with every prayer") },
      ],
    },
    tracks: {
      title: l("المشروع قسمان، فاختر ما يناسبك", "Two parts — choose where you give"),
      items: [
        {
          id: "build",
          title: l("بناء مسجد جديد", "Building a new mosque"),
          desc: l(
            "للقرى والعزب التي لا يوجد فيها مسجد، أو التي لم يعد مسجدها يستوعب المصلين. نبدأ من الأرض والأساسات، ثم نستكمل الحوائط والسقف ومصلى النساء، حتى نرفع المئذنة ويُفتح المسجد للصلاة.",
            "For villages and hamlets with no mosque, or whose mosque no longer holds the worshippers. We start with the land and foundations, then the walls, roof and women's prayer hall, until the minaret rises and the mosque opens for prayer.",
          ),
        },
        {
          id: "rebuild",
          title: l("إعادة إعمار مسجد قائم", "Restoring a standing mosque"),
          desc: l(
            "لمساجد قائمة تحتاج إلى أن تعود إليها الحياة: ترميم السقف والحوائط والأرضيات، وتجديد الكهرباء ودورات المياه والميضأة، ثم فرش المسجد بالسجاد وتجهيزه بالإضاءة والتكييف والصوت.",
            "For standing mosques that need life brought back: repairing roofs, walls and floors, renewing wiring, washrooms and the ablution area, then carpeting the mosque and equipping it with lighting, cooling and sound.",
          ),
        },
      ],
    },
    build_points: {
      title: l("بناء مسجد جديد يشمل", "A new build includes"),
      items: [
        { id: "b1", title: l("الأساسات والهيكل الخرساني", "Foundations and the concrete frame"), desc: l("", "") },
        { id: "b2", title: l("الحوائط والسقف والأرضيات", "Walls, roof and floors"), desc: l("", "") },
        { id: "b3", title: l("مصلى النساء والميضأة", "The women's prayer hall and ablution area"), desc: l("", "") },
        { id: "b4", title: l("المئذنة والمنبر والمحراب", "The minaret, minbar and mihrab"), desc: l("", "") },
      ],
    },
    rebuild_points: {
      title: l("إعادة الإعمار تشمل", "Restoration includes"),
      items: [
        { id: "r1", title: l("ترميم السقف والحوائط والشروخ", "Repairing roofs, walls and cracks"), desc: l("", "") },
        { id: "r2", title: l("تجديد الكهرباء ودورات المياه والميضأة", "Renewing wiring, washrooms and the ablution area"), desc: l("", "") },
        { id: "r3", title: l("فرش المسجد بالسجاد", "Carpeting the prayer hall"), desc: l("", "") },
        { id: "r4", title: l("تجهيزه بالإضاءة والتكييف والصوت", "Lighting, cooling and a sound system"), desc: l("", "") },
      ],
    },
    build_shares: {
      title: l("أسهم بناء مسجد جديد", "Shares in a new mosque"),
      lead: l("كل سهم طوبة في بيت من بيوت الله.", "Every share is a brick in a house of God."),
      items: [],
    },
    rebuild_shares: {
      title: l("أسهم إعادة الإعمار والفرش", "Shares in restoring and furnishing"),
      lead: l("أعِد إلى مسجد قريتك نوره وراحته.", "Bring a village mosque back to light and comfort."),
      items: [],
    },
    steps: {
      title: l("كيف نعمل", "How we work"),
      items: [
        { id: "s1", title: l("نختار المسجد", "We choose the mosque"), desc: l("يزور فريقنا القرية ويحدد الاحتياج: مسجد جديد أم ترميم أم فرش.", "Our team visits the village and sets the need: a new build, a restoration or furnishing.") },
        { id: "s2", title: l("ندرس التكلفة", "We cost it"), desc: l("نُعدّ مقايسة واضحة بالمواد والعمالة قبل البدء.", "We prepare a clear bill of materials and labour before starting.") },
        { id: "s3", title: l("ننفّذ ونتابع", "We build and supervise"), desc: l("يتم التنفيذ تحت إشراف هندسي ومتابعة من فريق المؤسسة.", "Work is done under engineering supervision, followed by our team.") },
        { id: "s4", title: l("نوثّق ونسلّم", "We document and hand over"), desc: l("نرسل لك صورًا وفيديو من مراحل العمل، ونسلّم المسجد جاهزًا للصلاة.", "We send you photos and video of the work and hand over a mosque ready for prayer.") },
      ],
    },
    hadith_label: { title: l("فضل بناء المساجد", "The virtue of building mosques"), items: [] },
    kind: {
      title: l("نوع المشروع", "Project type"),
      lead: l(
        "عمارة المساجد مشروع أثر مجتمعي، هدفه أن يكون في كل قرية بيت لائق من بيوت الله يجمع أهلها على الصلاة وحلقات القرآن، لا تحقيق دخل.",
        "Building mosques is a community-impact project: its aim is a worthy house of God in every village that gathers its people for prayer and Qur'an circles, not income.",
      ),
      items: [],
    },
    gallery: { title: l("من مساجدنا", "From our mosques"), items: [] },
    give: {
      title: l("أين يذهب تبرعك؟", "Where your gift goes"),
      lead: l(
        "يذهب تبرعك إلى مواد البناء والعمالة في المساجد الجديدة، أو إلى ترميم المساجد القائمة وفرشها وتجهيزها. ولك أجر في كل ركعة وسجدة وآية تُتلى في المسجد.",
        "Your gift pays for materials and labour on new mosques, or for restoring, carpeting and equipping standing ones. Every prayer and every verse recited there carries reward for you.",
      ),
      items: [],
    },
  },

  /** Shown only while the project's FAQ category is empty or unreachable. */
  faq: [
    { q: l("ما الفرق بين بناء مسجد وإعادة إعماره؟", "What is the difference between building and restoring?"), a: l("البناء يعني إقامة مسجد جديد من الأساس في مكان لا يوجد فيه مسجد أو يحتاج إلى مسجد أكبر. أما إعادة الإعمار فتكون لمسجد قائم: بترميمه، أو بفرشه وتجهيزه.", "Building is a new mosque from the foundations where there is none or a bigger one is needed. Restoration is for a standing mosque: repairing it, or carpeting and equipping it.") },
    { q: l("هل يمكنني التبرع بأي مبلغ؟", "Can I give any amount?"), a: l("نعم، يمكنك اختيار سهم أو أكثر، أو كتابة المبلغ الذي يناسبك في صفحة التبرع، وتُجمع التبرعات لمسجد واحد حتى يكتمل.", "Yes. Pick one or more shares, or enter the amount that suits you on the donation page; gifts are pooled until a mosque is complete.") },
    { q: l("هل سأعرف أين ذهب تبرعي؟", "Will I know where my gift went?"), a: l("نعم، نوثّق العمل بالصور والفيديو ونرسله إلى المتبرعين، ويمكنك متابعة تبرعك من صفحة تتبع التبرع.", "Yes. We document the work in photos and video and share it with donors, and you can follow your gift on the tracking page.") },
    { q: l("هل يمكنني بناء مسجد باسم شخص متوفى؟", "Can I build a mosque in someone's name?"), a: l("نعم، يمكنك إهداء ثواب السهم أو المسجد لأحد أحبابك، واكتب اسمه في الملاحظات أثناء التبرع.", "Yes. You can dedicate the reward of a share or a whole mosque to a loved one; add their name in the notes when you give.") },
  ],

  cta: {
    title: l("ابنِ لك بيتًا في الجنة", "Build yourself a house in Paradise"),
    sub: l("", ""),
  },

  /** Picture gallery: empty until pictures are chosen from the dashboard (the section stays hidden meanwhile). */
  images: {
    gallery: {
      label: l("معرض صور المساجد", "Mosques gallery"),
      hint: l("صور من المساجد التي بُنيت أو جُدّدت. يظهر القسم في الصفحة بمجرد إضافة صورة.", "Photos of built or restored mosques; the section shows once a picture is added."),
      items: [],
    },
  },
};

export default MOSQUES;
