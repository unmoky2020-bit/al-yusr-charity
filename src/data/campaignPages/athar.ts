import { l, type CampaignPageContent } from "./types";

/**
 * Default content for the Athar (education) campaign page — /athar.
 * The page layout lives in `src/pages/landings/AtharLanding.tsx`; ids and section keys below are
 * referenced there and must stay stable. The dashboard edits labels, amounts and texts only.
 *
 * Price ids: bag, uniform, tuition (kit builder) · full, nursery_share, classroom (packages) ·
 * dedicate_student, dedicate_nursery (dedication cards).
 * Section keys: page, kit, pages, note, nurseries, books, dedicate, year, gallery.
 */
const athar: CampaignPageContent = {
  hero: {
    eyebrow: l("حملة أَثَر · المساعدات التعليمية", "Athar · education aid"),
    title: l("شنطة وقلم النهاردة", "A bag and a pen today"),
    title2: l("أثرٌ يعيش ويغيّر بكرا", "an impact that changes tomorrow"),
    lead: l(
      "التعليم هو الأثر الوحيد المتين الذي يكسر دائرة الفقر. تجهيزك لطالب اليوم استثمار مباشر في طفل ستتغير حياته وحياة أسرته.",
      "Education is the one lasting impact that breaks the cycle of poverty. Equipping a student today is a direct investment in a child and their family's future.",
    ),
    donateLabel: l("اكفل طالباً الآن", "Sponsor a student"),
  },

  hadith: {
    text: l(
      "إذا مات الإنسانُ انقطع عنه عملُه إلا من ثلاثة: إلا من صدقةٍ جارية، أو علمٍ يُنتفَع به، أو ولدٍ صالحٍ يدعو له",
      "When a person dies, their deeds end except for three: ongoing charity, beneficial knowledge, or a righteous child who prays for them.",
    ),
    source: l("رواه مسلم", "Sahih Muslim"),
  },

  prices: [
    // Kit builder (the total is the sum of the picked items × number of students)
    { id: "bag", label: l("حقيبة مدرسية وأدوات متكاملة", "School bag with full supplies"), amount: 450 },
    { id: "uniform", label: l("زي مدرسي وحذاء جديد", "New uniform and shoes"), amount: 550 },
    { id: "tuition", label: l("سداد المصروفات الدراسية للعام", "Annual tuition fees"), amount: 850 },
    // Packages
    { id: "full", label: l("كفالة تعليمية شاملة لطالب", "Full student sponsorship"), amount: 1850, note: l("شنطة + زي + مصروفات", "Bag + uniform + fees") },
    { id: "nursery_share", label: l("سهم في دور التحفيظ والحضانات", "Quran pre-school share"), amount: 500, note: l("صدقة جارية", "Ongoing charity") },
    { id: "classroom", label: l("كفالة فصل دراسي كامل", "A full classroom"), amount: 18000, note: l("10 طلاب", "10 students") },
    // Dedication cards (ongoing charity in a loved one's name)
    { id: "dedicate_student", label: l("كفالة طالب للعام", "A student for the year"), amount: 1850 },
    { id: "dedicate_nursery", label: l("سهم في دار تحفيظ", "A Quran nursery share"), amount: 500 },
  ],

  stats: [],

  sections: {
    /** Page title (browser tab, share text, structured data) and the intro paragraph. */
    page: {
      title: l(
        "المساعدات التعليمية — «شنطة وقلم النهاردة.. أثر يعيش ويغيّر بكرا»",
        "Educational Aid — 'A backpack & pen today.. an impact that transforms tomorrow'",
      ),
      lead: l(
        "نؤمن في مؤسسة اليسر أن التعليم هو السلاح الحقيقي لبناء الإنسان، والأثر الوحيد المتين الذي يكسر دائرة الفقر وينقل الأسر المستحقة إلى المستقبل. مساهمتك اليوم في تجهيز طالب هي استثمار مباشر في طفل ستتغير حياته للأبد.",
        "Education is the true weapon to lift families out of poverty. Supporting a student with a backpack, school supplies, tuition, and uniforms is a direct investment in a child whose future will be rewritten.",
      ),
      items: [],
    },

    /** Kit builder heading. Items are the `bag`/`uniform`/`tuition` prices. */
    kit: {
      title: l("اختر ما يحتاجه الطالب هذا العام", "Pick what a student needs this year"),
      items: [],
    },

    /** The notebook page: five ways we make an impact. */
    pages: {
      title: l("خمس طرق نصنع بها الأثر", "Five ways we make an impact"),
      lead: l("من أول يوم في الحضانة حتى آخر يوم في المدرسة.", "From the first day of nursery to the last day of school."),
      items: [
        {
          id: "bags",
          title: l("الحقيبة والأدوات المدرسية", "Bags and supplies"),
          desc: l("شنط متينة مجهزة بالكشاكيل وأدوات الكتابة والألوان، تكفي الطالب طوال العام الدراسي.", "Durable bags packed with notebooks, pens and colours for the whole school year."),
        },
        {
          id: "uniform",
          title: l("الزي المدرسي الجديد", "New school uniforms"),
          desc: l("ملابس وأحذية جديدة لكل المراحل، ليذهب الطفل إلى مدرسته بثقة وكرامة.", "New clothes and shoes for every stage, so children walk into school with confidence."),
        },
        {
          id: "tuition",
          title: l("سداد المصروفات الدراسية", "Tuition fees"),
          desc: l(
            "نسدد المصروفات مباشرة لإدارة المدرسة للأيتام وغير القادرين، فلا يتسرب طالب من التعليم بسبب الفقر.",
            "We pay fees directly to the school for orphans and families in need, so no child drops out because of poverty.",
          ),
        },
        {
          id: "inherit",
          title: l("مبادرة «أثر يتوارث»", "“Inherited Impact”"),
          desc: l(
            "نعيد تدوير الكتب الدراسية، ويكتب الطالب المتبرع رسالة تشجيع بخط يده في أول صفحة لزميله الجديد.",
            "We recycle textbooks, and the donating student writes a handwritten note of encouragement on the first page.",
          ),
        },
        {
          id: "nurseries",
          title: l("دور القرآن والحضانات النموذجية", "Quran pre-schools"),
          desc: l("مراكز تربوية تبني العقل والروح وتؤسس الأطفال قبل المدرسة.", "Centres that nurture mind and spirit and prepare children before school."),
        },
      ],
    },

    /** "Inherited Impact": heading, paragraph, and the example handwritten first-page note (1 item). */
    note: {
      title: l("كتاب ورسالة من طالب لطالب", "A book and a note, student to student"),
      lead: l(
        "نجمع الكتب الدراسية بحالة جيدة، ويكتب الطالب المتبرع رسالة تشجيع بخط يده في أول صفحة، فتصل لزميله هديةً معنوية قبل أن تكون كتاباً.",
        "We collect textbooks in good condition, and the donating student writes a note of encouragement on the first page: a gift of spirit before it is a book.",
      ),
      items: [
        {
          id: "example",
          title: l("الصفحة الأولى من كتاب متبرَّع به (مثال)", "First page of a donated book (example)"),
          desc: l(
            "إلى صاحب هذا الكتاب الجديد: ذاكرت فيه السنة اللي فاتت ونجحت، وإن شاء الله تنجح وتتفوق. شد حيلك!",
            "To the new owner of this book: I studied from it last year and passed. You will too. Keep going!",
          ),
        },
      ],
    },

    /** Nurseries list. The open / in-preparation flag is kept in page code by item id. */
    nurseries: {
      title: l("حضاناتنا ودور التحفيظ", "Our nurseries"),
      items: [
        { id: "abu_bakr", title: l("حضانة أبي بكر الصديق", "Abu Bakr Al-Siddiq Nursery"), desc: l("", "") },
        { id: "farouq_omar", title: l("حضانة الفاروق عمر", "Al-Farouq Omar Nursery"), desc: l("", "") },
        { id: "athar", title: l("حضانة أَثَر", "Athar Nursery"), desc: l("", "") },
      ],
    },

    /** Donate your books: 4 steps. */
    books: {
      title: l("كتب العام الماضي تصنع أثراً هذا العام", "Last year's books, this year's impact"),
      items: [
        { id: "gather", title: l("اجمع الكتب", "Gather the books"), desc: l("كتب دراسية بحالة جيدة من العام الماضي، لأي مرحلة.", "Last year's textbooks in good condition, any grade.") },
        { id: "write", title: l("اكتب رسالتك", "Write your note"), desc: l("رسالة تشجيع قصيرة بخطك في أول صفحة لزميلك الجديد.", "A short note of encouragement on the first page.") },
        { id: "contact", title: l("تواصل معنا", "Contact us"), desc: l("راسلنا على واتساب لتحديد طريقة التسليم المناسبة لك.", "Message us on WhatsApp to arrange the handover.") },
        { id: "deliver", title: l("يصل لطالب يحتاجه", "It reaches a student"), desc: l("نسلّم الكتب للطلاب غير القادرين مع بداية العام الدراسي.", "We hand the books to students in need at the start of the year.") },
      ],
    },

    /** Ongoing charity through knowledge. Cards are the `dedicate_student`/`dedicate_nursery` prices. */
    dedicate: {
      title: l("علمٌ يُنتفع به باسم من تحب", "Beneficial knowledge, in a loved one's name"),
      lead: l(
        "كفالة طالب أو سهم في دور التحفيظ والحضانات يمكن أن تنويه عن والديك أو عن متوفى من أهلك. كل حرف يتعلمه الطفل، وكل آية يحفظها، أجرٌ جارٍ لمن نويت عنه.",
        "A student sponsorship or a share in our Quran nurseries can be dedicated to your parents or a late relative. Every letter a child learns and every verse memorised is a continuing reward.",
      ),
      items: [],
    },

    /** Across the school year: 3 stages; `extra` is the "when" tag. */
    year: {
      title: l("على مدار العام الدراسي", "Across the school year"),
      items: [
        {
          id: "assess",
          title: l("حصر وبحث ميداني", "Field assessment"),
          desc: l("يزور فريق البحث الاجتماعي الأسر والمدارس لتحديد الطلاب الأكثر احتياجاً والأيتام.", "Social researchers visit homes and schools to identify the students most in need."),
          extra: l("قبل الدراسة", "Before school"),
        },
        {
          id: "deliver",
          title: l("تسليم بكرامة", "Dignified delivery"),
          desc: l("نسلّم الشنط والزي ونسدد المصروفات للمدرسة مباشرة دون إحراج للطفل أو أسرته.", "Bags and uniforms are handed over and fees paid to the school, without embarrassing the child."),
          extra: l("مع بداية العام", "First week"),
        },
        {
          id: "follow",
          title: l("متابعة وتقارير", "Follow-up and reports"),
          desc: l("نتابع انتظام الطلاب ودرجاتهم، ونرسل للمتبرع تقارير مصورة.", "We follow attendance and grades, and send donors photo reports."),
          extra: l("طوال العام", "All year"),
        },
      ],
    },

    /** Photo gallery heading. */
    gallery: {
      title: l("من الفصول والقرى", "From classrooms and villages"),
      items: [],
    },
  },

  faq: [
    {
      q: l("ما هي مبادرة «أثر يتوارث» للكتب المدرسية؟", "What is the 'Inherited Impact' textbook initiative?"),
      a: l(
        "مبادرة مبتكرة لجمع الكتب الدراسية المستعملة بحالة جيدة، ونطلب من الطالب المتبرع كتابة رسالة تشجيع بخط يده في أول صفحة لتصل كهدية معنوية لزميله غير القادر.",
        "An initiative recycling gently-used textbooks with an encouraging handwritten note from donor students to the recipient students.",
      ),
    },
    {
      q: l("ما هي الحضانات ودور التحفيظ التابعة للمؤسسة؟", "What nurseries does the foundation manage?"),
      a: l(
        "تضم 3 مراكز تعليمية وتربوية نموذجية: 1) حضانة أبي بكر الصديق، 2) حضانة الفاروق عمر، 3) حضانة أَثَر (جاري الإعداد والتجهيز لتكون منارة تعليمية جديدة).",
        "Three model early-learning centers: Abu Bakr Al-Siddiq, Al-Farouq Omar, and the newly developing Athar nursery.",
      ),
    },
    {
      q: l("كيف يتم سداد المصروفات الدراسية للطلاب؟", "How are tuition fees paid?"),
      a: l(
        "يقوم مندوب المؤسسة بسداد المصروفات الرسمية مباشرة لإدارة المدرسة والحصول على إيصالات سداد معتمدة لضمان استمرار الطالب في دراسته.",
        "Foundation delegates pay official tuition directly to schools, securing official receipts ensuring zero dropout.",
      ),
    },
    {
      q: l("كم تكلفة كفالة طالب بالكامل للعام الدراسي؟", "What is the cost of full annual student sponsorship?"),
      a: l(
        "تبلغ 1,850 جنيهاً شاملة الحقيبة المدرسية والأدوات (450 ج) والزي المدرسي (550 ج) وسداد المصروفات السنوية (850 ج)، ويمكنك أيضاً التبرع بأي جزء منفصل (حقيبة بـ 450 ج أو زي بـ 550 ج).",
        "EGP 1,850 covering the backpack and supplies (450), uniform (550) and annual tuition (850).",
      ),
    },
    {
      q: l("هل حملة أَثَر تكفل طلاباً في المنصورة والدقهلية؟", "Does the Athar campaign sponsor students in Mansoura and Dakahlia?"),
      a: l(
        "نعم. تعمل حملة أَثَر من مؤسسة اليسر في المنصورة وطلخا وقرى محافظة الدقهلية؛ يزور فريق البحث الاجتماعي الأسر والمدارس لتحديد الطلاب الأيتام وغير القادرين، ثم تُسلَّم الشنط والزي للطالب وتُسدَّد المصروفات لإدارة المدرسة مباشرة، مع تقارير مصورة للمتبرع.",
        "Yes. Al-Yusr's Athar campaign works in Mansoura, Talkha and the villages of Dakahlia governorate. Our social researchers visit homes and schools to identify orphans and students in need, then bags and uniforms are handed to the student and fees are paid directly to the school, with photo reports sent to the donor.",
      ),
    },
    {
      q: l("هل يمكنني كفالة طالب كصدقة جارية عن متوفى؟", "Can I sponsor a student as ongoing charity on behalf of a deceased relative?"),
      a: l(
        "نعم. يمكنك أن تنوي كفالة الطالب أو السهم في دور التحفيظ والحضانات عن والديك أو عن متوفى من أهلك؛ فالعلم الذي يُنتفع به صدقة جارية. أرسل لنا اسم من تنوي عنه عبر واتساب بعد التبرع، ونوافيك بتقارير مصورة عن الطالب أو الدار.",
        "Yes. A student sponsorship or a Quran nursery share can be dedicated to your parents or a late relative; beneficial knowledge is an ongoing charity. Send us the name on WhatsApp after donating, and we will send you photo reports from the student or nursery.",
      ),
    },
    {
      q: l("كيف أتبرع بكتب دراسية مستعملة لمبادرة أثر يتوارث؟", "How do I donate used textbooks to the Inherited Impact initiative?"),
      a: l(
        "اجمع كتب العام الماضي بحالة جيدة لأي مرحلة دراسية، واكتب رسالة تشجيع قصيرة بخطك في أول صفحة، ثم راسلنا على واتساب لتحديد طريقة التسليم المناسبة لك في المنصورة أو الدقهلية. نسلّم الكتب للطلاب غير القادرين مع بداية العام الدراسي.",
        "Gather last year's textbooks in good condition, any grade, write a short note of encouragement on the first page, then message us on WhatsApp to arrange the handover in Mansoura or Dakahlia. We hand the books to students in need at the start of the school year.",
      ),
    },
  ],

  cta: {
    title: l(
      "شنطة وقلم النهاردة.. خطوة لتخريج طبيب أو مهندس يرفع أهله ويخدم مجتمعه",
      "A bag and pen today.. a step toward graduating a doctor or engineer tomorrow",
    ),
    sub: l(
      "كل جنيه يصل لمستحقه — موثّق بالصور والفيديو ومتابعة ميدانية.",
      "Every EGP reaches the right hands — verified with photos, video and field follow-up.",
    ),
  },
};

export default athar;
