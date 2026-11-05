import { l, type CampaignPageContent } from "./types";
import { img } from "@/data/pageImages";

/**
 * Default (code) content for the Markoun campaign page (/markoun).
 * The dashboard override is merged on top at runtime; item ids and section keys are referenced
 * by `src/pages/landings/MarkounLanding.tsx` (icons, tags and links are mapped by id there).
 */
const MARKOUN_DEFAULTS: CampaignPageContent = {
  hero: {
    eyebrow: l("أول حملة مصرية.. تُحيي أُسرة بالمركون في بيتك", "First Egyptian campaign for surplus items"),
    title: l("كنزك المركون..", "What's idle in your home.."),
    title2: l("يبني حياة لغيرك!", "builds a new life for another!"),
    lead: l(
      "في زوايا بيوتنا الكثير من الأشياء التي لم نَعد نستخدمها، ولكنها بالنسبة لأسر أخرى تُمثّل حلماً طال انتظاره. نحن لا نجمع مجرد أغراض فائضة، بل نعيد صياغة الأمل وننقل الدفء والاستقرار من بيوتكم إلى بيوت أهالينا المستحقين.",
      "In every home there are idle belongings that represent a lifelong dream for struggling families. We don't just collect surplus items; we restore hope and transfer comfort directly into deserving households.",
    ),
    donateLabel: l("طلب مندوب استلام", "Request Courier"),
  },

  hadith: {
    text: l("اتقوا النارَ ولو بشِقِّ تمرة", "Protect yourselves from the Fire, even with half a date."),
    source: l("متفق عليه", "Agreed upon (Bukhari & Muslim)"),
  },

  /** Markoun is an in-kind campaign: no priced items and no published figures. */
  prices: [],
  stats: [],

  sections: {
    slogan: {
      title: l("«اجعل من كركبة بيتك.. خطوة لـ عمار بيت غيرك»", "'Transform household clutter into comfort for another home'"),
      items: [
        {
          id: "main",
          title: l("«اجعل من كركبة بيتك.. خطوة لـ عمار بيت غيرك»", "'Transform household clutter into comfort for another home'"),
          desc: l("", ""),
        },
      ],
    },

    pillars: {
      title: l("خمسة مسارات شاملة لتغطية كافة الاحتياجات الأساسية للحياة الكريمة", "Five Core Tracks Covering All Essential Needs"),
      lead: l(
        "تتحرك حملة مركون بشكل شامل لتغطية كافة الاحتياجات الأساسية لعيش حياة كريمة عبر خمسة محاور رئيسية:",
        "Markoun operates across five key tracks to fulfill every aspect of dignified living:",
      ),
      items: [
        {
          id: "furniture",
          title: l("الأثاث المنزلي", "Home Furniture"),
          extra: l("أثاثك القديم عاش معاك قصة وهيبدأ قصة جديدة في حياة أسرة تانية", "Your old furniture had a story with you, and will start a new life for another family"),
          desc: l(
            "نجمع القطع الفائضة عن حاجتكم (غرف نوم، سرير، خزائن، كنب، طاولات ومطابخ) لنساهم في تجهيز البيوت الفقيرة ومساندة مشروعات الزواج وتأسيس منازل مستقرة، لترفع أهالينا المستحقين من النوم على الأرض إلى الستر والراحة التامة.",
            "We collect surplus furniture (bedroom sets, beds, wardrobes, tables) to furnish needy homes, support marriage aid, and restore dignity.",
          ),
        },
        {
          id: "appliances",
          title: l("الأجهزة الكهربائية", "Home Appliances"),
          extra: l("كل جهاز كهربائي مركون في بيتك لو تبرعت بيه هيكون صدقة جارية", "Every idle appliance in your home becomes an ongoing charity"),
          desc: l(
            "نستقبل (الثلاجات، الغسالات، البوتاجازات، المراوح، الشاشات، السخانات والمكاوى) لإدخال الطمأنينة والتسهيلات الحياتية لبيوت أسر بسيطة بحاجة ماسة لها بعد فحصها وصيانتها بورش المؤسسة.",
            "We receive washers, fridges, stoves, and fans, restoring them in specialized workshops before delivery.",
          ),
        },
        {
          id: "clothes",
          title: l("الملابس والكساء", "Clothing & Garments"),
          extra: l("المركون في دولابك ستر لغيرك وقصة جديدة من الدفء", "What is idle in your wardrobe is dignity for another"),
          desc: l(
            "نجمع الملابس المستعملة بحالة جيدة، لنقوم بفرزها، تنظيفها، وكيها وإعادة تقديمها بكرامة تامة للأسر والأطفال كـ «قصة جديدة» من الدفء والستر تليق بأهالينا المتعففين.",
            "Surplus quality garments are carefully sorted, cleaned, and presented with utmost dignity to underprivileged children and parents.",
          ),
        },
        {
          id: "meds",
          title: l("الصيدلية المستدامة (الأدوية)", "Sustainable Medicine Bank"),
          extra: l("علاجك الفائض طوق نجاة لمريض غير قادر على ثمن الدواء", "Your surplus medicine is a lifeline for struggling patients"),
          desc: l(
            "نجمع الأدوية الفائضة والصالحة للاستخدام من الصيدليات المنزلية، ليتم فحصها وتصنيفها تحت إشراف طبي وصيدلي دقيق وتوزيعها مجاناً بالكامل على المرضى غير القادرين على توفير تكلفة العلاج الشهري.",
            "We collect valid, unexpired household medications, medically inspecting and distributing them completely free to impoverished patients.",
          ),
        },
        {
          id: "books",
          title: l("المعرفة والتعليم (الكتب)", "Educational Knowledge (Books)"),
          extra: l("كتاب ابنك فرصة لمستقبل ابن غيرك وطوق نجاة من الفقر", "Your child's book is an opportunity for another student's bright future"),
          desc: l(
            "نستقبل الكتب المدرسية، الثقافية، والتعليمية لإعادة تدوير المعرفة وتوزيعها على الطلاب غير القادرين وتأسيس مكتبات بالقرى لإنقاذ الطلاب من خطر التسرب الدراسي.",
            "We collect textbooks and references to reuse knowledge and equip students from low-income households with essential study tools.",
          ),
        },
      ],
    },

    advantages: {
      title: l("لماذا تتبرع لـ «مركون»؟", "Why Donate to Markoun?"),
      lead: l(
        "عندما تختار التبرع لحملة مركون، فإنك تضمن أعلى مستويات الاحترافية والأمان:",
        "Your donation is handled with absolute institutional diligence and care:",
      ),
      items: [
        {
          id: "data",
          title: l("القضاء على العشوائية", "Zero Waste & Precision"),
          desc: l(
            "نعتمد على نظام رقمي وقواعد بيانات دقيقة ومحدثة تضمن ذهاب كل قطعة تبرع عيني إلى مكانها الصحيح والأنسب لاحتياج الأسرة الفعلي.",
            "Digital field databases guarantee every in-kind item matches the exact, validated needs of verified households.",
          ),
        },
        {
          id: "dignity",
          title: l("حفظ كرامة المتلقي", "Preserving Dignity"),
          desc: l(
            "نحن نؤمن أن جودة العطاء من جودة التعامل؛ لذا تمر كل التبرعات بمراحل فحص وتأهيل وصيانة وتنظيف دقيقة لتصل للمستفيدين وكأنها جديدة تماماً.",
            "All items undergo thorough repair, refurbishing, and cleaning so they reach recipient homes in pristine, dignified condition.",
          ),
        },
        {
          id: "doorstep",
          title: l("راحة المتبرع (مندوب لحد الباب)", "Doorstep Pickup Convenience"),
          desc: l(
            "وفرنا منظومة لوجستية متكاملة؛ لست بحاجة للتحرك من منزلك، بمجرد تواصلك معنا يتوجه مندوبنا الرسمي بسيارات المؤسسة لاستلام وتوثيق التبرع.",
            "Our official logistics vans collect items directly from your home with zero hassle, scheduled at your convenience.",
          ),
        },
      ],
    },

    steps: {
      title: l("خطوات بسيطة ليصلك مندوبنا", "Simple Steps to Participate"),
      lead: l(
        "منظومة مريحة تضمن استلام المركون من باب بيتك وتوصيله بكامل الكرامة لأهالينا.",
        "Effortless process ensuring safe doorstep pickup and dignified family delivery.",
      ),
      items: [
        {
          id: "send",
          title: l("أرسل كلمة «تبرع»", "Send 'Donate'"),
          desc: l("أرسل رسالة بكلمة «تبرع» على واتساب أو اتصل برقم 01097000137 وحدد نوع المركون عندك.", "Send 'Donate' via WhatsApp or phone call."),
        },
        {
          id: "pickup",
          title: l("مندوبنا عند باب بيتك", "Doorstep Pickup"),
          desc: l("سيارات المؤسسة المجهزة تصل أمام باب منزلك لاستلام الأغراض مجاناً وبكل احترام ورقي.", "Our courier collects your items directly from your home for free."),
        },
        {
          id: "refurbish",
          title: l("ورش الصيانة والترميم", "Refurbish & Restore"),
          desc: l("تدخل القطع ورش المؤسسة للتنظيف، الصيانة، وتغيير التالف لترجع بحالة ممتازة تليق بأهالينا.", "Workshops inspect, repair, and clean all items thoroughly."),
        },
        {
          id: "deliver",
          title: l("التسليم والتوثيق الميداني", "Documented Delivery"),
          desc: l("تُسلّم وتُفرش داخل منازل الأسر الأكثر استحقاقاً مع توثيق مصور يوضح فرحتهم والأثر المحقق.", "Furnished directly inside beneficiary homes with full reporting."),
        },
      ],
    },

    contact: {
      title: l("ثقتكم هي المحرك الأساسي لكل خطوة خير", "Your trust drives every step of impact"),
      lead: l(
        "سيارات مؤسسة اليسر تتحرك من قلب الميدان محملة بمساهماتكم، لتأخذ طريقها مباشرة للترميم قبل أن تذهب لأهالينا المتعففين المستحقين.",
        "Official Al-Yusr transport vehicles collect contributions daily, heading straight to our restoration workshops before delivery.",
      ),
      items: [
        {
          id: "badge",
          title: l("مؤسسة اليسر الخيرية — المنصورة", "Al-Yusr Charity — Mansoura"),
          desc: l("", ""),
        },
        {
          id: "bank",
          title: l("للتبرع المادي ودعم نفقات النقل والصيانة (CIB):", "Financial Support (CIB Bank):"),
          desc: l("100043605733", "100043605733"),
          extra: l("باسم: مؤسسة اليسر للتنمية", "Account Name: Al-Yusr Foundation"),
        },
        {
          id: "hq",
          title: l("المقر الرئيسي:", "Headquarters:"),
          desc: l("المنصورة، تقسيم خطاب، بجوار وكالة المنصورة.", "Mansoura, Khattab District, next to Mansoura Agency."),
        },
      ],
    },
  },

  faq: [
    {
      q: l("إيه يعني حملة مَرْكون وليه أشارك فيها؟", "What is the Markoun campaign and why participate?"),
      a: l(
        "بعد دراسة ميدانية وجدنا أن من كل 10 بيوت في 4 بيوت فيهم كنوز مركونة لو تم استغلالها بشكل صحيح هتبني حياة لأسرة كاملة. حملة مركون هي أول حملة مصرية منظمة لإعادة استخدام واستغلال كل المركون في منزلك (أثاث، أجهزة، ملابس، أدوية، كتب) لتغيير حياة أسر مستحقة من الفقر للراحة والأمان.",
        "Studies show 4 out of 10 homes contain idle treasures. Markoun is Egypt's first organized campaign to repurpose surplus items and rebuild lives.",
      ),
    },
    {
      q: l("إزاي أتبرع بالمركون عندي ومين بيستلمه؟", "How do I donate my items and who collects them?"),
      a: l(
        "كل اللي عليك تعمله: ابعت كلمة «تبرع» في رسالة واتساب على 01097000137 أو اتصل بنا، وهيوصلك مندوبنا بسيارة المؤسسة المجهزة لحد باب منزلك ليستلم منك كل المركون بكل رقي وسهولة وبدون أي مجهود منك.",
        "Simply text 'Donate' via WhatsApp to 01097000137, and our representative will collect the items directly from your doorstep.",
      ),
    },
    {
      q: l("هل الاستلام من باب البيت بيكلفني أي رسوم أو مصاريف؟", "Are there any pickup fees?"),
      a: l(
        "الاستلام من باب منزلك والتوصيل لبيوت الأسر مجاني تماماً 100% وبدون أي مقابل على المتبرع أو الأسرة المستفيدة.",
        "Pickup and delivery are 100% free with zero fees.",
      ),
    },
    {
      q: l("هل تقبلون الأجهزة أو الأثاث اللي محتاج صيانة أو تنظيف؟", "Do you accept items needing repair?"),
      a: l(
        "نعم! مؤسسة اليسر تمتلك ورش صيانة وترميم متخصصة؛ سياراتنا تنقل المساهمات مباشرة للترميم والتصليح والتنظيف قبل تسليمها وفرشها داخل منازل أهالينا المستحقين.",
        "Yes! Al-Yusr has dedicated workshops that repair, clean, and restore items before delivering them.",
      ),
    },
    {
      q: l("ما هي شروط التبرع بالأدوية الفائضة؟", "What are the rules for medicine donations?"),
      a: l(
        "نستقبل كافة الأدوية الفائضة بشرط أن تكون داخل عبواتها الأصلية وسارية الصلاحية؛ حيث تخضع للمعاينة والفرز من صيادلة المؤسسة قبل صرفها مجاناً للمرضى.",
        "Medications must be in original blister/packaging with valid expiry dates, inspected by pharmacists before dispensing.",
      ),
    },
    {
      q: l("هل ممكن أتبرع بمبلغ مالي لو معنديش حاجة مركونة؟", "Can I donate money if I don't have surplus items?"),
      a: l(
        "نعم بالتأكيد! لمن ليس لديه مركون ويرغب في المساهمة في نفقات صيانة وترميم ونقل الأجهزة والأثاث وشراء النواقص، متاح التبرع عبر حساب CIB رقم 100043605733 أو عبر نموذج التبرع الإلكتروني بالموقع.",
        "Yes, financial donations supporting repair and transport costs are welcomed via CIB account 100043605733 or our online donation portal.",
      ),
    },
    {
      q: l("هل يصل مندوب مَرْكون إلى كل مراكز الدقهلية؟", "Does the Markoun courier reach all of Dakahlia?"),
      a: l(
        "تنطلق سيارات حملة مَرْكون من مقر مؤسسة اليسر الخيرية بالمنصورة وتغطي محافظة الدقهلية. أرسل كلمة «تبرع» على واتساب 01097000137 مع عنوانك ونوع المركون عندك، ويتم التنسيق معك على موعد استلام مجاني يناسبك.",
        "Markoun pickup vans operate from Al-Yusr's headquarters in Mansoura and cover Dakahlia governorate. Text 'Donate' on WhatsApp to 01097000137 with your address and the type of items, and we will arrange a free pickup time that suits you.",
      ),
    },
    {
      q: l("ماذا يحدث للملابس المستهلكة تماماً التي أتبرع بها؟", "What happens to worn-out clothes I donate?"),
      a: l(
        "لا شيء يُهدر؛ الملابس الصالحة تُفرز وتُنظّف وتُكوى ثم تُقدَّم للأسر بكرامة، أما الملابس المستهلكة تماماً فتتحول إلى مراتب قطن وتُستخدم في ترميم الأسِرّة ضمن حملة سِتر التابعة لمؤسسة اليسر.",
        "Nothing goes to waste: wearable garments are sorted, cleaned, ironed and handed to families with dignity, while fully worn-out clothes are turned into cotton mattresses and used to restore beds within Al-Yusr's Setr campaign.",
      ),
    },
    {
      q: l("هل التبرع العيني لمؤسسة اليسر موثّق؟", "Is in-kind donation to Al-Yusr documented?"),
      a: l(
        "نعم؛ مؤسسة اليسر الخيرية للتنمية جمعية مشهرة برقم 2665 لسنة 2019 ومقرها الرئيسي بالمنصورة، ويقوم مندوبنا الرسمي بتوثيق استلام التبرع من باب منزلك، كما يُوثَّق التسليم والفرش داخل بيوت الأسر المستفيدة بالصور.",
        "Yes. Al-Yusr Charity for Development is a licensed NGO (No. 2665/2019) headquartered in Mansoura. Our official courier documents the pickup at your doorstep, and delivery inside beneficiary homes is documented with photos.",
      ),
    },
  ],

  cta: {
    title: l("عندك مركون في بيتك؟ (أثاث · أجهزة · ملابس · أدوية · كتب)", "Have surplus items at home?"),
    sub: l("استلام مجاني من باب بيتك بكتابة كلمة «تبرع»", "Free doorstep pickup by texting 'Donate'"),
  },

  /** Pictures (dashboard → الصور). */
  images: {
    hero: {
      label: l("صورة أعلى الصفحة", "Hero image"),
      max: 1,
      items: [img("markoun-poster-furniture.webp", "بوستر حملة مركون - مؤسسة اليسر الخيرية", "Markoun campaign poster")],
    },
    gallery: {
      label: l("معرض صور توثيق الميدان", "Field proof gallery"),
      items: [
        img("markoun-poster-furniture.webp", "بوستر حملة مركون", "Markoun poster"),
        img("markoun-furniture.webp", "تسليم وفرش أثاث لأسرة متعففة", "Furniture delivery"),
        img("asas-marqun.jpg", "أثاث بعد الصيانة في الورش", "Refurbished furniture"),
        img("markoun-poster-clothes.webp", "المركون في دولابك ستر لغيرك", "Clothing drive"),
        img("markoun-poster-delivery.png", "سيارات اليسر لاستلام المركون", "Pickup vans"),
        img("markoun-poster-meds.png", "كنوز مركونة في البيوت", "Surplus treasures"),
        img("markoun-poster-medbottle.png", "رعاية صحية وتكافل", "Health support"),
      ],
    },
  },
};

export default MARKOUN_DEFAULTS;
