import { CampaignLandingShell } from "@/components/sections/CampaignLandingShell";
import posterEdu from "@/assets/poster-education.png";
import classroom from "@/assets/brand-poster-classroom.jpg";
import yusrDistribution from "@/assets/yusr-distribution-1.jpg";
import axisEdu from "@/assets/axis-education.jpg";

const AtharLanding = () => (
  <CampaignLandingShell
    slug="athar"
    path="/athar"
    badgeAr="المساعدات التعليمية ودور التنمية — حملة أَثَر"
    badgeEn="Education Aid & Development Centers — Athar Campaign"
    titleAr="المساعدات التعليمية — «شنطة وقلم النهاردة.. أثر يعيش ويغيّر بكرا»"
    titleEn="Educational Aid — 'A backpack & pen today.. an impact that transforms tomorrow'"
    taglineAr="نؤمن في مؤسسة اليسر أن التعليم هو السلاح الحقيقي لبناء الإنسان، والأثر الوحيد المتين الذي يكسر دائرة الفقر وينقل الأسر المستحقة إلى المستقبل. مساهمتك اليوم في تجهيز طالب هي استثمار مباشر في طفل ستتغير حياته للأبد."
    taglineEn="Education is the true weapon to lift families out of poverty. Supporting a student with a backpack, school supplies, tuition, and uniforms is a direct investment in a child whose future will be rewritten."
    metaDescAr="شارك في حملة أَثَر التعليمية مع مؤسسة اليسر: شنط وأدوات مدرسية، زي مدرسي، سداد مصروفات، مبادرة تدوير الكتب 'أثر يتوارث'، ودور تحفيظ القرآن وحضانات نموذجية بالدقهلية."
    metaDescEn="Join Al-Yusr's Athar Education Campaign: school bags, supplies, uniforms, tuition sponsorship, textbook recycling, and Quranic pre-schools across Dakahlia, Egypt."
    heroImage={posterEdu}
    heroAlt="حملة أثر التعليمية - شنط وأدوات مدرسية وكفالة مصاريف للطلاب المستحقين"
    pricing={[
      { labelAr: "حقيبة مدرسية وأدوات متكاملة", labelEn: "Equipped School Backpack", amount: 450, tagAr: "أدوات العام", tagEn: "Supplies" },
      { labelAr: "زي مدرسي جديد متكامل", labelEn: "New School Uniform", amount: 550, tagAr: "فخر وستر", tagEn: "Uniform" },
      { labelAr: "سداد مصروفات دراسية لطالب", labelEn: "Annual Tuition Sponsorship", amount: 850, tagAr: "منع التسرب", tagEn: "Tuition" },
      { labelAr: "سهم رعاية حضانات ودور تحفيظ", labelEn: "Quran Pre-school Share", amount: 500, tagAr: "صدقة جارية", tagEn: "Endowment" },
      { labelAr: "كفالة تعليمية شاملة لطالب", labelEn: "Full Student Sponsorship", amount: 2200, tagAr: "شنطة + زي + مصاريف", tagEn: "Full package" },
      { labelAr: "كفالة فصل دراسي كامل (10 طلاب)", labelEn: "Full Classroom (10 Students)", amount: 18000, tagAr: "أثر مستمر", tagEn: "Classroom" },
    ]}
    pillars={[
      {
        titleAr: "1. الحقيبة والأدوات المدرسية",
        titleEn: "1. Backpacks & Complete Supplies",
        descAr: "توفير شنط مدرسية متينة ومجهزة بالكامل بأفضل أدوات الكتابة، الكشاكيل، والألوان لتلبي كافة احتياجات الطالب طوال العام الدراسي.",
        descEn: "Providing durable school bags fully packed with notebooks, pens, pencils, geometry kits, and art supplies for the entire academic year.",
      },
      {
        titleAr: "2. الزي المدرسي الجديد",
        titleEn: "2. Complete School Uniforms",
        descAr: "تقديم ملابس مدرسية وأحذية جديدة ومناسبة لجميع المراحل العمرية ليتوجه الأطفال لمدارسهم بكل فخر وثقة وكرامة.",
        descEn: "Providing brand new school uniforms and shoes for primary and secondary students, fostering dignity and self-esteem in the classroom.",
      },
      {
        titleAr: "3. سداد المصروفات الدراسية",
        titleEn: "3. School Tuition Sponsorship",
        descAr: "كفالة المصاريف المدرسية للطلاب غير القادرين والأيتام لضمان استمرارهم في التعليم ومنع تسربهم من المدارس تحت ضغط الفقر.",
        descEn: "Covering mandatory tuition fees for underprivileged and orphan students to prevent dropout and keep them on the path to graduation.",
      },
      {
        titleAr: "4. مبادرة «أثر يتوارث» (تدوير الكتب)",
        titleEn: "4. 'Inherited Impact' Textbook Recycling",
        descAr: "إعادة تدوير الكتب الدراسية المستعملة مع رسالة تشجيعية يكتبها الطالب المتبرع بخط يده في أول صفحة من الكتاب كهدية معنوية مليئة بالمحبة والدعم.",
        descEn: "Collecting and redistributing textbooks with a handwritten encouraging note from donor students to the new student recipients.",
      },
      {
        titleAr: "5. دور القرآن والحضانات النموذجية",
        titleEn: "5. Quran Pre-schools & Centers",
        descAr: "تأسيس وتشغيل مراكز تعليمية وتربوية حديثة: حضانة أبي بكر الصديق، حضانة الفاروق عمر، وحضانة أثر (جاري التجهيز) لبناء العقل والروح وتأسيس الأطفال قبل المدرسة.",
        descEn: "Operating model educational centers: Abu Bakr Al-Siddiq nursery, Al-Farouq Omar nursery, and Athar nursery for early childhood and Quranic education.",
      },
    ]}
    steps={[
      {
        titleAr: "حصر وبحث الحالات الميداني",
        titleEn: "Field Case Assessment",
        descAr: "فريق البحث الاجتماعي يقوم بزيارة الأسر والمدارس لتحديد الطلاب الأكثر احتياجاً والأيتام المستحقين للدعم قبل بدء العام الدراسي.",
        descEn: "Social researchers visit schools and homes to identify underprivileged and orphan students before the school year begins.",
      },
      {
        titleAr: "تجهيز وتسليم المستلزمات بكرامة",
        titleEn: "Dignified Delivery",
        descAr: "تسليم الحقائب والزي المدرسي وسداد المصروفات مباشرة للمدرسة دون إحراج للطفل أو ولي أمره.",
        descEn: "Distributing bags, uniforms, and paying tuition directly to schools preserving the student's dignity among peers.",
      },
      {
        titleAr: "المتابعة والتقارير الدراسية",
        titleEn: "Academic Tracking & Proof",
        descAr: "متابعة درجات وانتظام الطلاب وإرسال تقارير مصورة وإشعارات إتمام الكفالة للمتبرع.",
        descEn: "Tracking attendance and performance, with verified photo reports sent to sponsoring donors.",
      },
    ]}
    gallery={[
      { src: classroom, altAr: "توزيع الحقائب المدرسية على طلاب المدارس بقرى طلخا والمنصورة", altEn: "Distributing school bags in Dakahlia" },
      { src: posterEdu, altAr: "تجهيز الشنط والأدوات المدرسية والزي المتكامل", altEn: "Backpacks and school supplies ready" },
      { src: axisEdu, altAr: "فصل دراسي وحضانة تعليمية نموذجية تابعة لمؤسسة اليسر", altEn: "Al-Yusr model classroom and nursery" },
      { src: yusrDistribution, altAr: "قوافل التعليم ودعم الطلاب الأيتام في الدقهلية", altEn: "Education aid distribution convoy" },
    ]}
    relatedLinks={[
      { href: "/markoun", ar: "حملة مَرْكون (الأثاث والكتب)", en: "Markoun campaign" },
      { href: "/setr", ar: "حملة سِتر (تسقيف الشتاء والكسوة)", en: "Setr campaign" },
      { href: "/dhill", ar: "حملة ظِلّ (سقيا الماء وبرودة الصيف)", en: "Dhill campaign" },
      { href: "/trust", ar: "الشفافية والتقارير الميدانية", en: "Trust & reports" },
    ]}
    faq={{
      ar: [
        { q: "ما هي مبادرة «أثر يتوارث» للكتب المدرسية؟", a: "مبادرة مبتكرة لجمع الكتب الدراسية المستعملة بحالة جيدة، ونطلب من الطالب المتبرع كتابة رسالة تشجيع بخط يده في أول صفحة لتصل كهدية معنوية لزميله غير القادر." },
        { q: "ما هي الحضانات ودور التحفيظ التابعة للمؤسسة؟", a: "تضم 3 مراكز تعليمية وتربوية نموذجية: 1) حضانة أبي بكر الصديق، 2) حضانة الفاروق عمر، 3) حضانة أَثَر (جاري الإعداد والتجهيز لتكون منارة تعليمية جديدة)." },
        { q: "كيف يتم سداد المصروفات الدراسية للطلاب؟", a: "يقوم مندوب المؤسسة بسداد المصروفات الرسمية مباشرة لإدارة المدرسة والحصول على إيصالات سداد معتمدة لضمان استمرار الطالب في دراسته." },
        { q: "كم تكلفة كفالة طالب بالكامل للعام الدراسي؟", a: "تبلغ 2,200 جنيه شاملة الحقيبة المدرسية والأدوات والزي المدرسي وسداد المصروفات السنوية، ويمكنك أيضاً التبرع بأي جزء منفصل (حقيبة بـ 450 ج أو زي بـ 550 ج)." },
      ],
      en: [
        { q: "What is the 'Inherited Impact' textbook initiative?", a: "An initiative recycling gently-used textbooks with an encouraging handwritten note from donor students to the recipient students." },
        { q: "What nurseries does the foundation manage?", a: "Three model early-learning centers: Abu Bakr Al-Siddiq, Al-Farouq Omar, and the newly developing Athar nursery." },
        { q: "How are tuition fees paid?", a: "Foundation delegates pay official tuition directly to schools, securing official receipts ensuring zero dropout." },
        { q: "What is the cost of full annual student sponsorship?", a: "EGP 2,200 covering backpack, all supplies, uniform, and annual tuition fees." },
      ],
    }}
    donateHref="/donate?program=education"
    donateLabelAr="اكفل طالباً الآن"
    donateLabelEn="Sponsor a Student"
    bottomCtaAr="شنطة وقلم النهاردة.. خطوة لتخريج طبيب أو مهندس يرفع أهله ويخدم مجتمعه"
    bottomCtaEn="A bag and pen today.. a step toward graduating a doctor or engineer tomorrow"
  />
);

export default AtharLanding;
