import { l, type CampaignPageContent } from "./types";

/** Default (code) content for the Setr winter campaign page. Ids and section keys are fixed by `SetrLanding.tsx`. */
const SETR: CampaignPageContent = {
  hero: {
    eyebrow: l("حملة سِتْر · دفء الشتاء", "Setr · winter warmth"),
    title: l("مَن سَتَرَ مسلماً", "Whoever covers a Muslim"),
    title2: l("سَتَرَه الله في الدنيا والآخرة", "Allah will cover them in both worlds"),
    lead: l(
      "برد الشتاء يحرم الأطفال من النوم ويؤذي كبار السن. حملة سِتر تجعل تبرعك سقفاً يحمي، وفراشاً يرفع عن الأرض، وغطاءً يدفّي، ويكون لك ستراً وأجراً ممتداً.",
      "Winter cold keeps children awake and hurts the elderly. Setr turns your gift into a roof, a bed off the cold floor and a warm cover, and a lasting reward for you.",
    ),
    donateLabel: l("تبرّع لحملة سِتْر", "Donate to Setr"),
  },

  hadith: {
    text: l("ومَن سَتَرَ مسلماً سَتَرَه اللهُ في الدنيا والآخرة", "Whoever covers a Muslim, Allah will cover him in this world and the Hereafter."),
    source: l("رواه مسلم", "Sahih Muslim"),
  },

  prices: [
    { id: "share", label: l("سهم حملة سِتر", "Setr campaign share"), amount: 500, note: l("يشترك في الحملة ويوزَّع على أنشطتها", "Joins the campaign and is spread across its activities") },
    { id: "blanket", label: l("لحاف فايبر حراري", "Thermal fibre blanket"), amount: 450 },
    { id: "clothes", label: l("كسوة شتاء لطفل", "Winter clothes for a child"), amount: 700 },
    { id: "window", label: l("شباك", "Window"), amount: 750 },
    { id: "door", label: l("باب", "Door"), amount: 2200 },
    { id: "bed", label: l("سرير ومرتبة", "Bed and mattress"), amount: 3200 },
    { id: "roof_bitumen", label: l("بيتومين", "Bitumen"), amount: 6500 },
    { id: "roof_wood", label: l("خشب", "Wood"), amount: 17000 },
    { id: "full", label: l("الكفالة الشتوية الشاملة لأسرة", "Full winter sponsorship for a family"), amount: 10000, note: l("سقف وشباك وكسوة شتاء ومرتبة وسرير", "Roof, window, winter clothes, mattress and bed") },
  ],

  stats: [],

  sections: {
    layers: {
      title: l("ثلاث طبقات من الستر", "Three layers of covering"),
      lead: l("الدفء يبدأ من السقف وينتهي باللحاف.", "Warmth starts at the roof and ends with the blanket."),
      items: [
        { id: "roof", title: l("سقفٌ يحمي", "A roof that protects"), desc: l("نبني ونعزل أسقف البيوت ضد مياه الأمطار والرياح، ونركّب أبواباً وشبابيك متينة تستر الأسرة وتغلق منافذ البرد.", "We build and insulate roofs against rain and wind, and fit sturdy doors and windows that keep the cold out.") },
        { id: "bed", title: l("فراشٌ يرفع", "A bed that lifts"), desc: l("أسِرّة خشبية ومراتب مريحة ترفع الأطفال وكبار السن عن برودة الأرض، وتمنحهم نوماً صحياً.", "Wooden beds and mattresses that lift children and the elderly off the cold floor.") },
        { id: "cover", title: l("غطاءٌ يدفّي", "Covers that warm"), desc: l("ألحفة فايبر عالية الجودة تمنح دفئاً سريعاً، وكسوة شتوية ثقيلة لأفراد الأسرة.", "High-quality fibre blankets for fast warmth, and heavy winter clothing for the family.") },
      ],
    },

    checks: {
      title: l("زيارة ميدانية قبل كل تبرع", "A field visit before every gift"),
      lead: l(
        "يزور فريق البحث الاجتماعي كل بيت ويعاينه على الطبيعة، ثم توثَّق الحالة وتعتمدها اللجنة المختصة، فيصل تبرعك لمن يحتاجه فعلاً.",
        "Our social researchers visit and inspect every home; each case is documented and approved by a committee, so your gift reaches real need.",
      ),
      items: [
        { id: "roof", title: l("حالة السقف", "Roof condition"), desc: l("هل يحمي من المطر أم يتسرب منه الماء؟", "Does it keep rain out, or leak?") },
        { id: "doors", title: l("الأبواب والشبابيك", "Doors and windows"), desc: l("هل تغلق منافذ البرد وتستر أهل البيت؟", "Do they keep the cold out and give privacy?") },
        { id: "beds", title: l("الأسِرّة والفراش", "Beds and bedding"), desc: l("هل ينام الأطفال وكبار السن على الأرض؟", "Do children and elders sleep on the floor?") },
        { id: "covers", title: l("الأغطية والكسوة", "Covers and clothing"), desc: l("هل تكفي الأسرة طوال ليالي الشتاء؟", "Are there enough for every winter night?") },
      ],
    },

    priority: {
      title: l("البرد لا يصيب الجميع بالتساوي", "The cold does not hit everyone equally"),
      items: [
        { id: "children", title: l("الأطفال والأرامل", "Children and widows"), desc: l("بيوت تعولها أم وحدها، وأطفال ينامون على الأرض بلا غطاء يكفي.", "Homes run by a mother alone, with children sleeping on the floor without enough cover.") },
        { id: "elderly", title: l("كبار السن", "The elderly"), desc: l("مسنّون يعيشون وحدهم، يشتد عليهم البرد ويضعف جسدهم عن مقاومته.", "Elders living alone, for whom the cold is hardest and most dangerous.") },
        { id: "sick", title: l("المرضى وذوو الإعاقة", "The sick and disabled"), desc: l("أسر فيها مريض مزمن أو صاحب إعاقة، يزيد البرد من معاناته.", "Families with a chronically ill or disabled member whose suffering the cold deepens.") },
        { id: "no_roof", title: l("بيوت بلا سقف صالح", "Homes without a sound roof"), desc: l("بيوت يتسرب إليها المطر أو تدخلها الرياح من أبواب ونوافذ مفتوحة.", "Homes where rain leaks in, or wind enters through open doors and windows.") },
      ],
    },

    months: {
      title: l("نسبق البرد قبل أن يشتد", "We get ahead of the cold"),
      lead: l(
        "تبدأ الحملة مع الخريف لتجهيز البيوت قبل البرد، وتستمر طوال الشتاء بالدعم العاجل في موجات الصقيع.",
        "We start in autumn to prepare homes before the cold, and continue all winter with urgent relief during cold snaps.",
      ),
      items: [
        { id: "oct", title: l("أكتوبر", "Oct"), desc: l("تجهيز البيوت", "Prepare homes") },
        { id: "nov", title: l("نوفمبر", "Nov"), desc: l("أسقف وأبواب", "Roofs & doors") },
        { id: "dec", title: l("ديسمبر", "Dec"), desc: l("ألحفة وكسوة", "Blankets & clothes") },
        { id: "jan", title: l("يناير", "Jan"), desc: l("ذروة البرد", "Peak cold") },
        { id: "feb", title: l("فبراير", "Feb"), desc: l("دعم عاجل", "Urgent relief") },
      ],
    },

    after: {
      title: l("ماذا يحدث بعد تبرعك؟", "What happens after you give"),
      items: [
        { id: "receipt", title: l("إيصال ورقم تتبع", "Receipt and tracking number"), desc: l("فور تبرعك يصلك إيصال رسمي برقم مرجعي تتابع به تبرعك.", "An official receipt with a reference number arrives as soon as you give.") },
        { id: "buy", title: l("شراء وتجهيز", "Buying and preparing"), desc: l("نشتري الألحفة والكسوة والخامات بالجملة لتصل القيمة كاملة للمستحق.", "We buy blankets, clothing and materials in bulk so the full value reaches the family.") },
        { id: "deliver", title: l("تنفيذ وتسليم", "Delivery and installation"), desc: l("يسلّم فريقنا الأغطية على باب البيت، وينفذ الأسقف والأبواب بأيدي فنيين محترفين.", "Our team hands over covers at the door, and builds roofs and doors with professional tradesmen.") },
        { id: "document", title: l("توثيق يصلك", "Documentation sent to you"), desc: l("صور وفيديو للتسليم مع الحفاظ على كرامة الأسرة، تصلك على رقم تبرعك.", "Photos and video of the delivery, with the family's dignity preserved, sent to you.") },
      ],
    },

    cycle: {
      title: l("دورة لا يضيع فيها شيء", "A cycle where nothing goes to waste"),
      lead: l(
        "حملة سِتر تعتمد على حملة مَرْكون للتبرعات العينية. الملابس المستعملة المستهلكة تماماً تتحول إلى مراتب قطن، والأسِرّة القديمة تُرمَّم ويُعاد توزيعها. هكذا نضمن كفاءة العمل، واستغلال التبرعات بالشكل الصحيح، ووصول الصدقة لمن يستحقها.",
        "Setr relies on the Markoun in-kind campaign. Fully worn-out clothes become cotton mattresses, and old beds are restored and redistributed. That keeps the work efficient, puts every donation to proper use, and gets charity to those who deserve it.",
      ),
      items: [
        { id: "good_clothes", title: l("ملابس بحالة جيدة", "Clothes in good condition"), desc: l("تُفرز وتُغسل وتُوزع كسوةً شتوية على الأسر المستحقة.", "Sorted, cleaned and distributed as winter clothing to families in need.") },
        { id: "worn_clothes", title: l("ملابس مستهلكة تماماً", "Fully worn-out clothes"), desc: l("تتحول إلى حشو مراتب قطن جديدة تُصنع في ورشنا.", "Become the filling for new cotton mattresses made in our workshops.") },
        { id: "old_beds", title: l("أسِرّة قديمة", "Old beds"), desc: l("تُرمَّم وتُعاد صيانتها ثم توزَّع من جديد.", "Repaired, restored and distributed again.") },
      ],
    },
  },

  faq: [
    {
      q: l("ما هي محاور حملة ستر الرئيسية؟", "What are the main pillars of the Setr campaign?"),
      a: l(
        "تشمل 3 محاور متكاملة: 1) أسقف المنازل والأبواب والشبابيك، 2) الأسرة الخشبية والمراتب المريحة لرفع الأطفال عن الأرض، 3) الألحفة الفايبر الثقيلة والكسوة الشتوية المتكاملة.",
        "1) Roof insulation and doors/windows, 2) Wooden beds and comfortable mattresses, 3) Heavy fiber blankets and winter clothing.",
      ),
    },
    {
      q: l("متى تبدأ حملة ستر ومتى تنتهي؟", "When does the campaign run?"),
      a: l(
        "تبدأ الحملة سنوياً في شهر أكتوبر (10) مع بداية الخريف لتجهيز المنازل قبل البرد، وتستمر حتى نهاية شهر فبراير (2) لتقديم الدعم الفوري والأغطية خلال موجات الصقيع.",
        "From October through February, starting before winter to seal homes and continuing throughout cold snaps.",
      ),
    },
    {
      q: l("كيف يتم تحديد الأسر المستحقة لحملة ستر؟", "How are eligible families chosen?"),
      a: l(
        "يقوم فريق البحث الاجتماعي الميداني بزيارة المنازل ومعاينتها على الطبيعة (حالة السقف، وجود أبواب، أغطية، أسرة) وتوثيق الحالة واعتمادها من اللجنة المختصة.",
        "Our field social researchers visit and inspect each home (roof condition, doors, covers, beds), document the case and have it approved by the relevant committee.",
      ),
    },
    {
      q: l("هل يمكنني التبرع بسهم أو بجزء من الاحتياجات؟", "Can I donate a single item or a share?"),
      a: l(
        "نعم. سهم حملة سِتر 500 ج ويوزَّع على أنشطة الحملة، أو بند بعينه: لحاف فايبر 450 ج، كسوة شتاء لطفل 700 ج، شباك 750 ج، باب 2,200 ج، سرير ومرتبة 3,200 ج، سقف بيتومين 6,500 ج، سقف خشب 17,000 ج. والكفالة الشتوية الشاملة لأسرة 10,000 ج وتشمل سقفاً وشباكاً وكسوة شتاء ومرتبة وسريراً.",
        "Yes. A Setr campaign share is EGP 500, spread across the campaign's activities. Or pick an item: blanket 450, child's winter clothes 700, window 750, door 2,200, bed and mattress 3,200, bitumen roof 6,500, wooden roof 17,000. The full family winter sponsorship is EGP 10,000 and includes a roof, window, winter clothes, mattress and bed.",
      ),
    },
    {
      q: l("ما علاقة حملة سِتر بحملة مَرْكون؟", "How is Setr linked to Markoun?"),
      a: l(
        "سِتر تعتمد على التبرعات العينية لمَرْكون: الملابس بحالة جيدة توزَّع كسوة، والملابس المستهلكة تماماً تتحول إلى مراتب قطن، والأسِرّة القديمة تُرمَّم ويُعاد توزيعها. هكذا تُستغل التبرعات بالشكل الصحيح وتصل الصدقة لمن يستحقها.",
        "Setr relies on Markoun's in-kind donations: clothes in good condition are distributed, fully worn-out clothes become cotton mattresses, and old beds are restored and redistributed.",
      ),
    },
    {
      q: l("هل تُنفَّذ حملة سِتر في المنصورة والدقهلية؟", "Does the Setr campaign operate in Mansoura and Dakahlia?"),
      a: l(
        "نعم. مقر مؤسسة اليسر في المنصورة، وتُنفَّذ حملة سِتر في قرى ومراكز محافظة الدقهلية، وتمتد إلى كفر الشيخ والشرقية بحسب الحالات المعتمدة من فريق البحث الاجتماعي.",
        "Yes. Al-Yusr is headquartered in Mansoura, and Setr runs across the villages and districts of Dakahlia governorate, extending to Kafr El Sheikh and Sharqia according to the cases approved by our social research team.",
      ),
    },
    {
      q: l("كيف أتبرع لحملة سِتر من خارج مصر؟", "How can I donate to Setr from outside Egypt?"),
      a: l(
        "يمكنك التبرع من أي دولة عبر صفحة التبرع بالبطاقة الائتمانية (فيزا/ماستركارد)، أو بالتحويل البنكي على الحسابات الرسمية للمؤسسة. ولأي استفسار راسلنا على واتساب +20 109 700 0137 ويصلك الإيصال وتوثيق التسليم على نفس الرقم.",
        "You can give from any country through the donate page by credit card (Visa/Mastercard), or by bank transfer to the foundation's official accounts. For help, message us on WhatsApp at +20 109 700 0137; your receipt and delivery documentation reach you on the same number.",
      ),
    },
    {
      q: l("هل تبرعي لحملة سِتر موثّق؟", "Is my Setr donation documented?"),
      a: l(
        "نعم. مؤسسة اليسر جمعية مشهرة برقم 2665 لسنة 2019، وكل تبرع يصدر له إيصال رسمي برقم مرجعي يمكنك تتبعه، ويصلك توثيق التسليم بالصور والفيديو مع الحفاظ على كرامة الأسرة.",
        "Yes. Al-Yusr is a registered charity (no. 2665 of 2019). Every donation gets an official receipt with a trackable reference number, and you receive photo and video documentation of the delivery, with the family's dignity preserved.",
      ),
    },
  ],

  cta: {
    title: l("كل مساهمة منك هي لحاف يدفئ طفلاً أو جدار يستر أسرة — تبرع الآن", "Every contribution is a warm blanket or a sheltering roof — Donate now"),
    sub: l("كل جنيه يصل لمستحقه — موثّق بالصور والفيديو ومتابعة ميدانية.", "Every EGP reaches the right hands — verified with photos, video and field follow-up."),
  },
};

export default SETR;
