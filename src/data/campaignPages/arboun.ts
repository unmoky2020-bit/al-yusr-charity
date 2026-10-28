import { l, type CampaignPageContent } from "./types";

/**
 * Default editable content for /arboun (مبادرة عربون خير — للفريلانسرز والمستقلين).
 * The page keeps its layout in code and reads every text below through `useCampaignPage("arboun", …)`.
 *
 * Conventions used by the page:
 * - `prices`: label = share name, note = share description (Arabic-only on the page today; `en` empty falls back to `ar`).
 * - `sections.pillars`: title/desc = pillar heading/paragraph, extra = the quote pill.
 * - `sections.pillar_details`: same ids as `pillars`; title = small tag pill, desc = the 3 bullets joined with " · ",
 *   extra = the pillar's action button label.
 * - `sections.shares`: same ids as `prices`; title = small tag above the share name (desc unused).
 * - `sections.video`: title = video headline (split on ".." by the player), lead = badge text.
 * - `sections.labels`: misc badges/buttons; title = main text, desc = paired secondary text (may be empty).
 * - `cta`: the final "Core Mission" box (heading + subline).
 */
const arboun: CampaignPageContent = {
  hero: {
    eyebrow: l("مبادرة عربون خير — للفريلانسرز والمستقلين", "Arboun Khair — Freelancers & Remote Workers Initiative"),
    title: l("اتصدق النهاردة..", "Donate Today.."),
    title2: l("وخليه عربون لرزق بكرة!", "A Pledge for Tomorrow's Barakah!"),
    lead: l(
      "مبادرة «عربون خير» بتجمع مجتمع الفريلانسرز والمستقلين عشان يستثمروا جزء بسيط من أرباح مشاريعهم في الآخرة. طهّر رزقك، تخلص من ضغط وقلق الشغل، وسيب أثر حقيقي يكفل يتيم، أو ييسر زواج، أو يبني صدقة جارية.",
      "Arboun Khair unites freelancers and remote professionals to invest a flexible fraction of their project earnings in lasting charity. Cleanse your income, alleviate work anxiety, and leave a verified footprint that supports orphans, brides, and clean water.",
    ),
    donateLabel: l("طلّع عربون خيرك الآن", "Pledge Share"),
  },

  hadith: {
    text: l("ما نقصت صدقةٌ من مال", "Charity never decreases wealth."),
    source: l("رواه مسلم", "Sahih Muslim"),
  },

  prices: [
    {
      id: "share_starter",
      label: l("عربون خير سهم بسيط (مشروع صغير)", "Starter Project Share"),
      amount: 150,
      note: l("سهم سريع يفتح أبواب البركة لوجبة ساخنة أو مساهمة دواء لأسرة متعففة", ""),
    },
    {
      id: "share_standard",
      label: l("عربون خير (مشروع متوسط 1%)", "Standard Share (1%)"),
      amount: 450,
      note: l("اقتطاع رمزي 1% من قيمة المشروع يكفل شنطة مدرسية وزي متكامل لطفل", ""),
    },
    {
      id: "share_orphan_education",
      label: l("سهم كفالة يتيم ودعم تعليم", "Orphan Education Share"),
      amount: 750,
      note: l("كفالة تعليمية ومصروفات مدرسية لمنع تسرب طفل يتيم من التعليم", ""),
    },
    {
      id: "share_bride",
      label: l("سهم تيسير زواج عروسة يتيمة", "Bride Support Share"),
      amount: 1500,
      note: l("مساهمة في جهاز منزلي أساسي (بوتاجاز أو غسالة) لحفظ كرامة عروسة", ""),
    },
    {
      id: "share_jariyah",
      label: l("سهم صدقة جارية (سقف / مياه)", "Sadaqah Jariyah Share"),
      amount: 2500,
      note: l("سهم في بناء سقف خشبي معزول أو وصلة مياه نقية تدوم 10 سنوات", ""),
    },
    {
      id: "share_custom",
      label: l("أي نسبة أو قيمة تختارها", "Custom Amount"),
      amount: 100,
      note: l("حدد أي مبلغ يناسب أرباح مشروعك الحالي عبر بوابة الدفع الآمنة", ""),
    },
  ],

  stats: [],

  sections: {
    pillars: {
      title: l("ليه تشارك في «عربون خير»؟", "Why Join Arboun Khair?"),
      lead: l(
        "أثر الصدقة المباشر على راحة بالك، استقرار عملك الحر، وبركة رزقك اليوم وغداً.",
        "The direct impact of charity on your peace of mind, career stability, and barakah.",
      ),
      items: [
        {
          id: "pillar_peace",
          title: l("علاج القلق وضغط الشغل", "Relieving Stress & Work Anxiety"),
          desc: l(
            "الكلاينت مابيردش؟ التعديلات مابتخلصش؟ وخايف من فترات ركود السوق؟ الصدقة بتطمن القلب، بتشيل ضغط التفكير، وبتيسر المشاريع المعقدة وتفتح أبواب رزق غير متوقعة من حيث لا تحتسب.",
            "Client delays? Endless revisions? Market slowdown fears? Charity brings peace of mind, removes mental fatigue, and unlocks unexpected doors of provision.",
          ),
          extra: l(
            "«داووا مرضاكم بالصدقة.. واستنزلوا الرزق بالعطاء والتيسير»",
            "«Bring down provision by giving with a clean, open heart»",
          ),
        },
        {
          id: "pillar_skill_zakat",
          title: l("زكاة مهنتك وشكر النعمة", "Zakat on Professional Skill"),
          desc: l(
            "مهارتك وسرعتك على اللابتوب وفهمك للأدوات الحديثة رزق ونعمة عظيمة. شكر النعمة دي إنك تطلع منها جزء لله، عشان ربنا يحفظ صحتك ووقتك وتركيزك ويديم عليك الشغف والتفوق.",
            "Your tech craft, speed, and digital intellect are divine gifts. Giving back expresses genuine gratitude, preserving your mental clarity, eyesight, and health.",
          ),
          extra: l(
            "«لئن شكرتم لأزيدنكم» — شكر نعمة المهارة والتقنية يزيدك تفوقاً",
            "«If you are grateful, I will surely increase you in favor»",
          ),
        },
        {
          id: "pillar_eternal_roi",
          title: l("استثمار مضمون لا ينقطع", "Guaranteed Eternal ROI"),
          desc: l(
            "العميل بيستثمر في الدنيا بالبروجكت اللي معاك، استثمر أنت في الآخرة بجزء من أرباح نفس البروجكت لضمان رصيد حسنات دائم وأثر ينفعك ويستر أسر متعففة.",
            "Clients invest in transient milestones; you invest a fraction in eternity, securing ongoing deeds that shelter vulnerable families and build sustainable legacy.",
          ),
          extra: l(
            "«ما نقص مال من صدقة» — أرباح حقيقية تدخرها ليوم لا ينفع فيه إلا العمل الصالح",
            "«Charity never diminishes wealth» — An eternal portfolio of good deeds",
          ),
        },
      ],
    },

    pillar_details: {
      title: l("شارات وأزرار ونقاط المحاور", "Pillar tags, buttons & bullets"),
      lead: l(
        "العنوان = الشارة الصغيرة، الوصف = 3 نقاط مفصولة بـ « · »، الإضافي = نص زر المحور.",
        "Title = small tag, desc = 3 bullets separated by « · », extra = the pillar button label.",
      ),
      items: [
        {
          id: "pillar_peace",
          title: l("السكينة والبركة", "Peace & Barakah"),
          desc: l(
            "طرد وساوس الركود وتوقف طلبات العملاء المفاجئ · الاطمئنان القلبي والسكينة أثناء انتظار المستحقات والتحويلات · تيسير العقود المعقدة وتقليل طلبات التعديل المرهقة",
            "Eliminating fears of dry spells and sudden client drops · Inner peace and calmness while awaiting international payouts · Smoother client negotiations and fewer endless revision loops",
          ),
          extra: l("احسب عربون مشروعك", "Calculate Your Share"),
        },
        {
          id: "pillar_skill_zakat",
          title: l("تطهير المال والمهارة", "Skill Zakat & Growth"),
          desc: l(
            "تطهير أرباحك وتأمين مالك من أي عوائق أو نقص مفاجئ · حفظ العافية والتركيز وسلامة الظهر والعينين من إرهاق الشاشات · استمرار الشغف والتوفيق في اقتناص مشاريع أعلى قيمة ودخلاً",
            "Purifying earnings and safeguarding income from sudden setbacks · Protecting health, physical ergonomics, and vision from screen burnout · Sustaining drive and landing higher-tier global clients",
          ),
          extra: l("اختر سهم التبرع", "Choose Share"),
        },
        {
          id: "pillar_eternal_roi",
          title: l("عائد استثماري أبدي (Eternal ROI)", "Guaranteed Eternal ROI"),
          desc: l(
            "تحويل كل تسليم ميلستون إلى رصيد دائم من الحسنات الجارية · كفالة أيتام وتوفير مياه نظيفة وبناء أسقف تستمر سنين طويلة · ربط نجاحك التقني بقضايا مجتمعية نبيلة تترك أثراً لا يزول",
            "Turning every client milestone into perpetual ongoing charity · Sponsoring orphan schooling, clean water, and secure house roofs · Connecting your technical career with real-life humanitarian impact",
          ),
          extra: l("تبرع الآن للمبادرة", "Donate Now"),
        },
      ],
    },

    video: {
      title: l("اتصدق النهاردة.. وخليه عربون لبركة بكرة", ""),
      lead: l("عربون خير", ""),
      items: [],
    },

    shares: {
      title: l("اختر سهمك من أرباح مشروعك الأخير", "Choose Your Project Share"),
      lead: l(
        "مفيش حد أدنى.. كل سهم مخصص لمصرف خيري حقيقي وموثق بالصور والفيديو.",
        "No minimum required. Each share directly funds verified field aid with reports.",
      ),
      items: [
        { id: "share_starter", title: l("بركة الشغل", "Blessing"), desc: l("", "") },
        { id: "share_standard", title: l("شائع بين المستقلين", "Popular"), desc: l("", "") },
        { id: "share_orphan_education", title: l("أثر مستمر", "Education"), desc: l("", "") },
        { id: "share_bride", title: l("أجهزة معمرة", "Appliances"), desc: l("", "") },
        { id: "share_jariyah", title: l("أصل ثابت", "Asset"), desc: l("", "") },
        { id: "share_custom", title: l("مفتوح بالكامل", "Custom"), desc: l("", "") },
      ],
    },

    steps: {
      title: l("كيف تنضم للمبادرة؟", "How to Join?"),
      lead: l(
        "من أول ضغطة زرار لاستلام أرباحك وحتى وصول تقرير التوثيق الميداني.",
        "From withdrawing your client milestone to receiving your verified field report.",
      ),
      items: [
        {
          id: "step_withdraw",
          title: l("الخطوة الأولى: قفّل البروجكت واستلم أرباحك", "Step 1: Withdraw Your Earnings"),
          desc: l(
            "زرار الـ Withdraw أو استلام الحوالة البنكية هو البداية. أول ما فلوس مشروعك تنزل في حسابك البنكي أو فودافون كاش أو InstaPay، افتح صفحة عربون خير.",
            "Once your client milestone or withdrawal clears into your bank or wallet, open the Arboun Khair page.",
          ),
        },
        {
          id: "step_pledge",
          title: l("الخطوة الثانية: حدد عربون الخير", "Step 2: Set Your Contribution"),
          desc: l(
            "اختار النسبة اللي تريحك من أرباح المشروع (حتى لو 1% أو 5%).. مفيش حد أدنى، الأهم هو النية والاستمرارية وربط نجاحك بالعطاء وشكر النعمة.",
            "Select a comfortable portion (1%, 5%, or any fixed sum). No minimum required — consistency and pure intent are what matter.",
          ),
        },
        {
          id: "step_track",
          title: l("الخطوة الثالثة: سيب أثرك وتابع تقريرك", "Step 3: Track Real Ground Impact"),
          desc: l(
            "بضغطة زرار، تبرعك بيتحول فوراً لمشاريع تنموية حقيقية على الأرض (تيسير زواج، كفالة أيتام، أسقف ومياه)، وهيوصلك إيصال رسمي وتقارير موثقة بصور وفيديو.",
            "With one click, your donation is directed to verified grassroots aid (orphan education, brides, clean water) with official receipts and donor reports.",
          ),
        },
      ],
    },

    faq_intro: {
      title: l("أسئلة شائعة حول مبادرة عربون خير", "Frequently Asked Questions"),
      lead: l(
        "إجابات دقيقة ومباشرة عن زكاة العمل الحر، العملات، والتبرع والشارة.",
        "Precise answers about freelance zakt, currencies, and portfolio badges.",
      ),
      items: [],
    },

    labels: {
      title: l("شارات وأزرار متفرقة", "Misc badges & buttons"),
      lead: l("العنوان = النص الأساسي، الوصف = نص مرافق إن وُجد.", "Title = main text, desc = paired text when any."),
      items: [
        { id: "whatsapp", title: l("واتساب مباشر", "WhatsApp Inquiries"), desc: l("تواصل عبر واتساب", "WhatsApp") },
        { id: "share_link", title: l("مشاركة الحملة", "Share"), desc: l("تم نسخ رابط المبادرة للمشاركة ", "Initiative link copied ") },
        { id: "pillars_badge", title: l("محاور المبادرة الثلاثة", "Three Core Pillars"), desc: l("", "") },
        { id: "shares_badge", title: l("أسهم تبرع مقترحة", "Suggested Contribution Shares"), desc: l("تبرع بهذا السهم", "Donate this share") },
        { id: "steps_badge", title: l("3 خطوات بسيطة", "3 Simple Steps"), desc: l("خطوة", "Step") },
        { id: "related_title", title: l("مبادرات وحملات اليسر ذات الصلة", "Related Al-Yusr Campaigns"), desc: l("", "") },
        { id: "mission_badge", title: l("رسالة المبادرة", "Core Mission"), desc: l("", "") },
        {
          id: "sticky_bar",
          title: l("خلي البروجكت الجاي بدايته بركة.. طـلّع عربون خيرك الآن", "Start your next client project with barakah — donate your pledge"),
          desc: l("تبرع بعربون مشروعك", "Pledge Now"),
        },
      ],
    },
  },

  faq: [
    {
      q: l("إيه هي مبادرة عربون خير للفريلانسرز؟", "What is the Arboun Khair Freelancers Initiative?"),
      a: l(
        "مبادرة مبتكرة تشجع الشباب المشتغلين في العمل الحر (الفريلانس) والعمل عن بُعد على استقطاع نسبة مرنة من أرباح كل مشروع يتم تسليمه (مثل 1% أو 5%)، وتوجيهها كصدقة لدعم الأسر المحتاجة، بهدف جلب البركة وعلاج قلق وضغط الشغل مع شارة رقمية للبورتفوليو.",
        "An innovative initiative encouraging freelancers and remote professionals to dedicate a flexible portion of their project earnings (1% or 5%) to verified charity, inviting barakah and peace of mind.",
      ),
    },
    {
      q: l("هل في حد أدنى للتبرع من أرباح المشاريع؟", "Is there a minimum donation amount?"),
      a: l(
        "لا يوجد أي حد أدنى. يمكنك التبرع بأي مبلغ أو نسبة تراها مناسبة من أرباح مشروعك (مثل 1% أو 5% أو 50 جنيهاً). الهدف هو الاستمرارية وجعل الصدقة عادة تطمئن قلبك وترتبط بنجاحك المهني.",
        "No minimum required. You can contribute whatever fits your project budget (e.g. 1%, 5%, or 50 EGP). Consistency and pure intent are what count.",
      ),
    },
    {
      q: l("كيف يؤثر التبرع على عملي كفريلانسر؟", "How does donating benefit my career as a freelancer?"),
      a: l(
        "إخراج الصدقات يُعد 'زكاة للمهنة' وسبباً مباشراً في استنزال البركة، تخفيف ضغوط العمل، تبديد الخوف من ركود السوق، وتيسير التعامل مع العملاء، تصديقاً لقول النبي ﷺ: «ما نقص مال من صدقة».",
        "Charity cleanses earnings, alleviates burnout and work anxiety, and invites continuous professional opportunities.",
      ),
    },
    {
      q: l("أين تذهب تبرعات مبادرة عربون خير؟", "Where do Arboun Khair donations go?"),
      a: l(
        "يتم توجيه التبرعات لتنفيذ مشاريع حقيقية على الأرض تحت إشراف مؤسسة اليسر الخيرية (مشهرة برقم 2665 لسنة 2019)، وتشمل: تيسير زواج الفتيات اليتيمات بأجهزة معمرة، كفالة الأيتام والتعليم، الصدقات الجارية (أسقف ومياه)، والإغاثة الغذائية مع توثيق فوري.",
        "Directly into verified grassroots projects by Al-Yusr Charity (License No. 2665 of 2019): orphan education, bride trousseau, insulated roofs, clean water connections, and food aid.",
      ),
    },
    {
      q: l(
        "هل يمكنني التبرع بعملات أجنبية إذا كنت أعمل مع عملاء من الخارج؟",
        "Can I donate in foreign currencies if I work with international clients?",
      ),
      a: l(
        "نعم بالتأكيد. إذا كنت تتلقى أرباحك بالدولار، اليورو، الريال السعودي، أو أي عملة أخرى، يمكنك تحويل تبرعك بكل سهولة عبر بوابات الدفع الإلكترونية الآمنة المتاحة على موقعنا بواسطة بطاقات Visa و Mastercard.",
        "Yes. Our secure gateway supports international currencies and major cards effortlessly.",
      ),
    },
    {
      q: l("هل عربون خير مناسب للفريلانسرز خارج مصر؟", "Is Arboun Khair suitable for freelancers outside Egypt?"),
      a: l(
        "نعم. مبادرة عربون خير موجهة لكل مستقل أو عامل عن بُعد أينما كان، سواء يعمل من مصر أو من الخليج أو أوروبا أو مع عملاء دوليين. التبرع يتم أونلاين عبر بوابة دفع إلكترونية آمنة تقبل بطاقات Visa و Mastercard بأي عملة، ويصل تبرعك مباشرة إلى مشاريع مؤسسة اليسر الخيرية على الأرض في مصر، مع إيصال رسمي وتوثيق ميداني بالصور والفيديو.",
        "Yes. Arboun Khair is open to any freelancer or remote worker anywhere, whether based in Egypt, the Gulf, Europe, or working with international clients. Donations are made online through a secure payment gateway that accepts Visa and Mastercard in any currency, and your contribution goes directly to Al-Yusr Charity's verified field projects in Egypt, with an official receipt and photo/video documentation.",
      ),
    },
    {
      q: l("كيف أحصل على شارة «مستقل داعم»؟", "How do I get the 'Impact Freelancer' badge?"),
      a: l(
        "شارة «مستقل داعم» هي شارة رقمية تقدمها مؤسسة اليسر للفريلانسرز المشاركين في مبادرة عربون خير، لإضافتها إلى البورتفوليو أو الموقع الشخصي أو حسابات GitHub و Behance كأصل أخلاقي يميزك أمام عملائك. بعد إتمام تبرعك من أرباح مشروعك عبر صفحة عربون خير، تواصل معنا عبر واتساب على 01097000137 لاستلام الشارة.",
        "The 'Impact Freelancer' badge is a digital badge Al-Yusr Charity offers to freelancers taking part in Arboun Khair, to display on your portfolio, personal site, GitHub or Behance as a verified impact asset that sets you apart with clients. After completing your pledge from your project earnings on the Arboun Khair page, contact us on WhatsApp at 01097000137 to receive your badge.",
      ),
    },
    {
      q: l(
        "هل أحصل على إيصال رسمي وتقرير عن تبرعي في عربون خير؟",
        "Do I get an official receipt and a report for my Arboun Khair donation?",
      ),
      a: l(
        "نعم. كل تبرع في مبادرة عربون خير يصدر له إيصال رسمي من مؤسسة اليسر الخيرية (مشهرة برقم 2665 لسنة 2019 تحت إشراف وزارة التضامن الاجتماعي)، مع كود تتبع لتبرعك وتقارير توثيق ميداني بالصور والفيديو للمشروع الذي وُجِّه إليه تبرعك، سواء كان كفالة يتيم أو تيسير زواج أو صدقة جارية (أسقف ومياه).",
        "Yes. Every Arboun Khair donation comes with an official receipt from Al-Yusr Charity (registered NGO No. 2665 of 2019 under the Ministry of Social Solidarity), a tracking code for your donation, and field documentation reports with photos and videos of the project your pledge supported, whether orphan sponsorship, bride support, or ongoing charity (roofs and clean water).",
      ),
    },
  ],

  cta: {
    title: l("«قفل بروجكتك الجاي.. استثمر في الآخرة»", "«Close your next deal.. Invest in the Hereafter»"),
    sub: l(
      "عربون خير يبارك في رزقك ويفتح أبواب التوفيق لكل صفقة جديدة",
      "A pledge of goodness that sanctifies your income and blesses your work",
    ),
  },
};

export default arboun;
