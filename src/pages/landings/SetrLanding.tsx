import { CampaignLandingShell } from "@/components/sections/CampaignLandingShell";
import posterWater from "@/assets/poster-water.png";
import yusrDistribution from "@/assets/yusr-distribution-1.jpg";
import yusrMeals from "@/assets/yusr-meals.jpg";
import markounFurniture from "@/assets/markoun-poster-furniture.png";

const SetrLanding = () => (
  <CampaignLandingShell
    slug="setr"
    path="/setr"
    badgeAr="حملة سِتْر — الدفء والستر لأهالينا في الشتاء"
    badgeEn="Setr Campaign — Winter Warmth & Shelter"
    titleAr="حملة سِتْر — «مَن سَتَرَ مسلمًا في الدنيا، سَتَرَهُ الله في الدنيا والآخرة»"
    titleEn="Setr Campaign — 'Whoever covers a Muslim in this world, Allah will cover them in this world and the Hereafter'"
    taglineAr="حين يصبح الشتاء عبئاً صعباً على المستحقين؛ برد الشتاء القارص يحرم الأطفال الصغار من النوم ويؤذي كبار السن. حملة ستر جاءت لتجعل من تبرعك غطاءً دافئاً وجداراً ساتراً يحمي أهالينا ويكون لك ستراً وأجراً ممتداً في الدارين."
    taglineEn="When winter becomes a harsh burden on needy families: freezing cold that keeps children awake. The Setr campaign provides roofs, warm fiber blankets, heavy clothing, beds and mattresses across Egyptian villages."
    metaDescAr="شارك في حملة سِتر مع مؤسسة اليسر: أسقف بيوت عازلة، أبواب وشبابيك، أسرة ومراتب، ألحفة فايبر، وكسوة شتاء للأطفال وكبار السن بالدقهلية ومحافظات مصر."
    metaDescEn="Join Al-Yusr's Setr Winter Campaign: home roofing, doors & windows, beds & mattresses, fiber blankets, and winter clothing for children and elderly in Egypt."
    heroImage={posterWater}
    heroAlt="حملة ستر — تسقيف بيوت وألحفة فايبر وكسوة شتوية للأسر المستحقة"
    pricing={[
      { labelAr: "لحاف فايبر حراري دافئ", labelEn: "Thermal Fiber Blanket", amount: 450, tagAr: "دفء سريع", tagEn: "Warmth" },
      { labelAr: "كسوة شتوية ثقيلة لطفل", labelEn: "Child Winter Clothing", amount: 650, tagAr: "ستر وكساء", tagEn: "Clothing" },
      { labelAr: "سهم سقف منزل معزول", labelEn: "Winter Roofing Share", amount: 500, tagAr: "حماية من المطر", tagEn: "Roof share" },
      { labelAr: "سرير خشبي + مرتبة مريحة", labelEn: "Bed + Mattress", amount: 3200, tagAr: "رفع عن الأرض", tagEn: "Bed setup" },
      { labelAr: "كفالة شتوية كاملة لأسرة", labelEn: "Full Family Winter Sponsorship", amount: 5500, tagAr: "ستر متكامل", tagEn: "Full pack" },
      { labelAr: "سقف وباب وشباك كامل لبيت", labelEn: "Complete Roof & Door/Window", amount: 18000, tagAr: "أمان دائم", tagEn: "Complete home" },
    ]}
    pillars={[
      {
        titleAr: "1. الأسقف والبنية الأساسية (باب وشباك)",
        titleEn: "1. Roofing & Infrastructure",
        descAr: "الدفء يبدأ من غلق منافذ البرد: بناء وعزل أسقف البيوت لحماية العائلات من مياه الأمطار الشتوية والرياح الشديدة، وتركيب أبواب ونوافذ متينة تستر الأسر وتمنع تيارات الهواء القارصة.",
        descEn: "Warmth begins by sealing cold drafts: building and insulating roofs against rain and storms, and installing sturdy wooden doors and windows to safeguard family privacy.",
      },
      {
        titleAr: "2. مستلزمات النوم المريحة والآمنة (أسِرّة ومراتب)",
        titleEn: "2. Safe & Comfortable Sleep Essentials",
        descAr: "نرفع أجساد الأطفال وكبار السن عن برودة الأرض القاسية ونوفر لهم نوماً هادئاً وصحياً: توفير أسِرّة خشبية متينة ومراتب مريحة تمنحهم الدفء وتقيهم الأمراض.",
        descEn: "Lifting children and elderly off freezing ground: providing durable wooden beds and supportive mattresses for restful, warm, disease-preventing sleep.",
      },
      {
        titleAr: "3. الغطاء والكسوة الشتوية (ألحفة وملابس)",
        titleEn: "3. Blankets & Heavy Winter Clothing",
        descAr: "محاربة البرد داخل المنزل وخارجه: ألحفة فايبر عالية الجودة تمنح الدفء السريع والكامل للأطفال وكبار السن، مع كسوة ملابس شتوية ثقيلة متكاملة لحماية أفراد الأسرة.",
        descEn: "Fighting the chill indoors and outdoors: premium fiber comforters delivering rapid warmth, alongside heavy winter coats, sweaters, and outfits.",
      },
    ]}
    steps={[
      {
        titleAr: "الجدول الزمني: البداية (شهر 10)",
        titleEn: "Timeline: Launching in October",
        descAr: "ننطلق مع بداية فصل الخريف لنستقبل الشتاء ونحمي أهالينا المستحقين قبل قدوم البرد الفعلي، عبر تجهيز البيوت بالأسقف والأبواب والشبابيك.",
        descEn: "We kick off with early autumn to winterize homes with roofs, doors, and windows before the severe freezing weather sets in.",
      },
      {
        titleAr: "الاستمرار والتغطية (حتى شهر 2)",
        titleEn: "Ongoing Support through February",
        descAr: "نمتد في جهودنا الميدانية طوال أشهر الشتاء لضمان توفير الألحفة والكسوة الشتوية والدعم العاجل في أشد موجات البرد القارص.",
        descEn: "Field relief convoys run through late winter, distributing comforters, clothing, and emergency repair during cold snaps.",
      },
      {
        titleAr: "التنفيذ الميداني والتوثيق بالأمانة",
        titleEn: "Field Execution & Verification",
        descAr: "يتم تنفيذ كافة الأعمال بواسطة فريق المتطوعين مع نجارين وبنائين محترفين لضمان الجودة والمتانة، مع توثيق كامل وإرسال تقرير التسليم للمتبرع.",
        descEn: "Executed by our volunteer crews alongside skilled masons and carpenters, backed by complete photo/video documentation and donor reporting.",
      },
    ]}
    gallery={[
      { src: posterWater, altAr: "بناء وعزل سقف منزل لحماية أسرة من أمطار الشتاء", altEn: "Insulating a home roof against winter rain" },
      { src: yusrDistribution, altAr: "توزيع ألحفة فايبر وكسوة شتوية ثقيلة للأطفال", altEn: "Distributing warm blankets and heavy clothes" },
      { src: markounFurniture, altAr: "توفير أسِرّة ومراتب مريحة ترفع الأطفال عن الأرض", altEn: "Providing beds and mattresses for children" },
      { src: yusrMeals, altAr: "قوافل الدفء الميدانية في قرى الدقهلية والمحافظات", altEn: "Winter field relief convoys" },
    ]}
    relatedLinks={[
      { href: "/dhill", ar: "حملة ظِلّ (سقيا الماء وبرودة الصيف)", en: "Dhill campaign" },
      { href: "/markoun", ar: "حملة مَرْكون (الأثاث والأجهزة)", en: "Markoun campaign" },
      { href: "/food-box", ar: "كرتونة الغذاء الشهرية", en: "Monthly food box" },
      { href: "/trust", ar: "الشفافية والتقارير الميدانية", en: "Trust & reports" },
    ]}
    faq={{
      ar: [
        { q: "ما هي محاور حملة ستر الرئيسية؟", a: "تشمل 3 محاور متكاملة: 1) أسقف المنازل والأبواب والشبابيك، 2) الأسرة الخشبية والمراتب المريحة لرفع الأطفال عن الأرض، 3) الألحفة الفايبر الثقيلة والكسوة الشتوية المتكاملة." },
        { q: "متى تبدأ حملة ستر ومتى تنتهي؟", a: "تبدأ الحملة سنوياً في شهر أكتوبر (10) مع بداية الخريف لتجهيز المنازل قبل البرد، وتستمر حتى نهاية شهر فبراير (2) لتقديم الدعم الفوري والأغطية خلال موجات الصقيع." },
        { q: "كيف يتم تحديد الأسر المستحقة لحملة ستر؟", a: "يقوم فريق البحث الاجتماعي الميداني بزيارة المنازل ومعاينتها على الطبيعة (حالة السقف، وجود أبواب، أغطية، أسرة) وتوثيق الحالة واعتمادها من اللجنة المختصة." },
        { q: "هل يمكنني التبرع بسهم أو كفالة جزء من الاحتياجات؟", a: "نعم، يمكنك التبرع بلحاف فايبر (450 ج)، كسوة شتاء (650 ج)، سهم سقف (500 ج)، أو كفالة شتوية كاملة لأسرة (5500 ج)." },
      ],
      en: [
        { q: "What are the main pillars of the Setr campaign?", a: "1) Roof insulation and doors/windows, 2) Wooden beds and comfortable mattresses, 3) Heavy fiber blankets and winter clothing." },
        { q: "When does the campaign run?", a: "From October through February, starting before winter to seal homes and continuing throughout cold snaps." },
        { q: "Can I donate a single blanket or share?", a: "Yes, you can contribute a blanket (EGP 450), a child's winter clothes (EGP 650), a roof share (EGP 500), or a full family package." },
      ],
    }}
    donateHref="/donate?program=shelter"
    donateLabelAr="تبرّع لحملة سِتْر"
    donateLabelEn="Donate to Setr"
    bottomCtaAr="كل مساهمة منك هي لحاف يدفئ طفلاً أو جدار يستر أسرة — تبرع الآن"
    bottomCtaEn="Every contribution is a warm blanket or a sheltering roof — Donate now"
  />
);

export default SetrLanding;
