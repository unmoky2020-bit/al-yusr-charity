import { l, type CampaignPageContent } from "./types";
import { img } from "@/data/pageImages";

/**
 * Default (code) content for the monthly food programme page (/food-box).
 * Ids and section keys are fixed by `FoodBoxLanding.tsx`; the dashboard edits the words and amounts.
 *
 * The programme has three parts: meat from the monthly slaughters, a 14 kg carton of local staples,
 * and cooked meals that can be given as feeding, as a fasting expiation or as an oath expiation.
 */
const FOOD: CampaignPageContent = {
  hero: {
    eyebrow: l("الغذاء الشهري · برنامج دائم طوال العام", "Monthly food · a year-round programme"),
    title: l("أطعِموا الطعام", "Feed the hungry"),
    title2: l("سُفرة تكفي أسرة شهرًا كاملًا", "A table that lasts a family a whole month"),
    lead: l(
      "برنامج الغذاء الشهري يضمن لأسر الأيتام والمتعففين ثلاثة أشياء كل شهر: لحوم من ذبائحنا الشهرية، وكرتونة ١٤ كيلو من المكونات الغذائية البلدي، ووجبات إطعام مطبوخة تصلح إطعامًا أو كفارة صيام أو كفارة يمين. كل ذلك يصل إلى باب البيت بكرامة وبتوثيق كامل.",
      "Our monthly food programme guarantees families three things every month: meat from our monthly slaughters, a 14 kg carton of local staples, and cooked meals that can be given as feeding, as a fasting expiation or as an oath expiation. All delivered to the door with dignity and full documentation.",
    ),
    donateLabel: l("أطعِم أسرة هذا الشهر", "Feed a family this month"),
  },

  hadith: {
    text: l(
      "يا أيها الناس، أفشوا السلام، وأطعِموا الطعام، وصِلوا الأرحام، وصلّوا بالليل والناس نيام، تدخلوا الجنة بسلام",
      "O people, spread peace, feed the hungry, keep the ties of kinship, and pray at night while people sleep, and you will enter Paradise in peace.",
    ),
    source: l("رواه الترمذي وقال: حسن صحيح، وابن ماجه", "al-Tirmidhi (who graded it hasan sahih) and Ibn Majah"),
  },

  prices: [
    { id: "meat_share", label: l("سهم لحوم الذبائح الشهرية", "Monthly slaughter meat share"), amount: 350, note: l("يشترك في ذبيحة الشهر ويوزَّع لحمها على الأسر", "Joins the month's slaughter; the meat goes to families") },
    { id: "meat_kg", label: l("كيلو لحم بلدي لأسرة", "1 kg of local meat for a family"), amount: 450 },
    { id: "carton", label: l("كرتونة غذاء ١٤ كيلو", "14 kg food carton"), amount: 700, note: l("مكونات بلدي تكفي أسرة شهرًا", "Local staples that last a family a month") },
    { id: "full", label: l("سُفرة الشهر: كرتونة + لحم", "Month's table: carton + meat"), amount: 1100, note: l("كرتونة ١٤ كيلو وكيلو لحم من ذبيحة الشهر", "A 14 kg carton plus 1 kg of meat from the month's slaughter") },
    { id: "full_3", label: l("كفالة سُفرة ٣ شهور", "3-month table sponsorship"), amount: 3300 },
    { id: "full_year", label: l("كفالة سُفرة سنة كاملة", "Full-year table sponsorship"), amount: 13200, note: l("أسرة واحدة، اثنتا عشرة سُفرة", "One family, twelve months of food") },
    { id: "meal", label: l("وجبة إطعام مطبوخة", "A cooked meal"), amount: 75, note: l("أرز ولحم أو دجاج وخضار وخبز", "Rice, meat or chicken, vegetables and bread") },
    { id: "kaffara_yameen", label: l("كفارة يمين: إطعام عشرة مساكين", "Oath expiation: feeding ten poor people"), amount: 750, note: l("عشر وجبات كاملة لعشرة مساكين", "Ten full meals for ten poor people") },
    { id: "kaffara_siyam", label: l("كفارة صيام: إطعام ستين مسكينًا", "Fasting expiation: feeding sixty poor people"), amount: 4500, note: l("ستون وجبة كاملة لستين مسكينًا", "Sixty full meals for sixty poor people") },
    { id: "fidya", label: l("فدية صيام عن يوم", "Fasting fidya for one day"), amount: 75, note: l("إطعام مسكين عن كل يوم لمن لا يستطيع الصوم", "One poor person fed for each day missed") },
  ],

  stats: [],

  sections: {
    /** Page title + tagline used by the landing shell (SEO heading, structured data). No items. */
    seo: {
      title: l(
        "الغذاء الشهري — لحوم الذبائح الشهرية وكرتونة ١٤ كيلو ووجبات الإطعام والكفارات",
        "Monthly Food — slaughter meat, a 14 kg carton and meals for feeding and expiations",
      ),
      lead: l(
        "برنامج دائم من مؤسسة اليسر يصل بالطعام إلى أسر الأيتام والمتعففين كل شهر: لحوم من ذبائح شهرية، وكرتونة ١٤ كيلو من المكونات الغذائية البلدي، ووجبات مطبوخة تُقدَّم إطعامًا أو كفارة صيام أو كفارة يمين، في الدقهلية والمنصورة وكافة محافظات مصر.",
        "A permanent Al-Yusr programme bringing food to orphan and needy families every month: meat from monthly slaughters, a 14 kg carton of local staples, and cooked meals offered as feeding, fasting expiation or oath expiation, across Dakahlia, Mansoura and all of Egypt.",
      ),
      items: [],
    },

    /** Trust bullets under the hero. */
    trust: {
      title: l("لماذا تثق بنا؟", "Why trust us"),
      items: [
        { id: "ngo", title: l("مؤسسة مشهرة برقم 2665 لسنة 2019", "Registered NGO 2665/2019"), desc: l("", "") },
        { id: "docs", title: l("ذبح بإشراف بيطري وتوثيق بالصور", "Vet-supervised slaughter and photo proof"), desc: l("", "") },
        { id: "areas", title: l("توصيل لباب البيت في الدقهلية وكل مصر", "Doorstep delivery in Dakahlia and all Egypt"), desc: l("", "") },
      ],
    },

    /** The second hadith band right under the hero (single item: title = text, desc = source). */
    hadith2: {
      title: l("خير الإسلام", "The best of Islam"),
      items: [
        {
          id: "best",
          title: l(
            "«سُئل رسول الله ﷺ: أيُّ الإسلامِ خيرٌ؟ قال: تُطعِمُ الطعامَ، وتقرأُ السلامَ على من عرفتَ ومن لم تعرِف»",
            "“The Messenger of Allah ﷺ was asked: which Islam is best? He said: to feed the hungry, and to greet those you know and those you do not.”",
          ),
          desc: l("متفق عليه", "Agreed upon (Bukhari & Muslim)"),
        },
      ],
    },

    /** The three parts of the programme. title = name, extra = one-line tag, desc = explanation. */
    pillars: {
      title: l("ثلاثة أركان لسُفرة الشهر", "Three parts of the month's table"),
      lead: l("لحم وكرتونة ووجبة: ما تحتاجه أسرة لتأكل بكرامة شهرًا كاملًا.", "Meat, a carton and a meal: what a family needs to eat with dignity for a month."),
      items: [
        {
          id: "meat",
          title: l("لحوم الذبائح الشهرية", "Monthly slaughter meat"),
          extra: l("ذبيحة كل شهر", "A slaughter every month"),
          desc: l(
            "كل شهر نذبح في المزرعة الوقفية بإشراف بيطري، ونقطّع اللحم ونعبّئه كيلو لكل أسرة، ويصل طازجًا في يوم الذبح نفسه إلى بيوت لا يدخلها اللحم إلا في العيد.",
            "Every month we slaughter at the endowment farm under veterinary supervision, portion the meat into 1 kg packs, and deliver it fresh on the same day to homes that otherwise see meat only at Eid.",
          ),
        },
        {
          id: "carton",
          title: l("كرتونة ١٤ كيلو بلدي", "14 kg carton of local staples"),
          extra: l("مكونات بلدي تكفي شهرًا", "Local staples for a month"),
          desc: l(
            "أرز ومكرونة ودقيق وسكر وزيت وفول وعدس وسمنة بلدي وصلصة وشاي وملح: ١٤ كيلو من المكونات الأساسية التي تطبخ منها الأم سفرة كل يوم طوال الشهر.",
            "Rice, pasta, flour, sugar, oil, fava beans, lentils, local ghee, tomato paste, tea and salt: 14 kg of the staples a mother cooks from every day of the month.",
          ),
        },
        {
          id: "meals",
          title: l("وجبات الإطعام والكفارات", "Meals for feeding and expiations"),
          extra: l("إطعام · كفارة صيام · كفارة يمين", "Feeding · fasting expiation · oath expiation"),
          desc: l(
            "وجبة مطبوخة كاملة من أرز ولحم أو دجاج وخضار وخبز، تُقدَّم إطعامًا للمساكين، أو تُنفَّذ بها كفارة الصيام وكفارة اليمين وفدية الصيام بالعدد الشرعي، ويصلك توثيقها.",
            "A full cooked meal of rice, meat or chicken, vegetables and bread, given as feeding for the poor, or used to carry out fasting and oath expiations and the fasting fidya in the required number, with documentation sent to you.",
          ),
        },
      ],
    },

    /**
     * Contents of the carton: a dynamic list, so the dashboard can add, remove and reorder ingredients.
     * title = item, desc = weight as shown ("٣ كيلو"), extra = weight in kg as a plain number (drives the bar).
     */
    carton: {
      dynamic: true,
      extraLabel: l("الوزن بالكيلو (رقم فقط، مثال 1.5)", "Weight in kg (number only, e.g. 1.5)"),
      title: l("ماذا في كرتونة الـ ١٤ كيلو؟", "What is in the 14 kg carton?"),
      lead: l(
        "نختار مكونات بلدي من السوق المحلي بكميات واقعية تكفي أسرة من خمسة أفراد شهرًا كاملًا، ونعبّئها في مخازن المؤسسة بالمنصورة.",
        "We choose local staples from the local market in realistic quantities for a family of five for a full month, and pack them at the foundation's warehouse in Mansoura.",
      ),
      items: [
        { id: "rice", title: l("أرز", "Rice"), desc: l("٣ كيلو", "3 kg"), extra: l("3", "3") },
        { id: "pasta", title: l("مكرونة", "Pasta"), desc: l("٢ كيلو", "2 kg"), extra: l("2", "2") },
        { id: "flour", title: l("دقيق", "Flour"), desc: l("٢ كيلو", "2 kg"), extra: l("2", "2") },
        { id: "sugar", title: l("سكر", "Sugar"), desc: l("٢ كيلو", "2 kg"), extra: l("2", "2") },
        { id: "oil", title: l("زيت", "Oil"), desc: l("١٫٥ لتر", "1.5 L"), extra: l("1.5", "1.5") },
        { id: "fava", title: l("فول", "Fava beans"), desc: l("١ كيلو", "1 kg"), extra: l("1", "1") },
        { id: "lentils", title: l("عدس", "Lentils"), desc: l("١ كيلو", "1 kg"), extra: l("1", "1") },
        { id: "ghee", title: l("سمنة بلدي", "Local ghee"), desc: l("نصف كيلو", "0.5 kg"), extra: l("0.5", "0.5") },
        { id: "sauce", title: l("صلصة", "Tomato paste"), desc: l("نصف كيلو", "0.5 kg"), extra: l("0.5", "0.5") },
        { id: "tea", title: l("شاي", "Tea"), desc: l("ربع كيلو", "0.25 kg"), extra: l("0.25", "0.25") },
        { id: "salt", title: l("ملح", "Salt"), desc: l("ربع كيلو", "0.25 kg"), extra: l("0.25", "0.25") },
      ],
    },

    /** How the monthly slaughter works. */
    meat: {
      title: l("من الذبيحة إلى السُّفرة في يوم واحد", "From the slaughter to the table in one day"),
      lead: l(
        "اللحم عندنا ليس صنفًا إضافيًا؛ هو ما يفتقده أطفال هذه البيوت أكثر من أي شيء. لذلك نذبح كل شهر، لا في المواسم فقط.",
        "For us meat is not an extra; it is what the children of these homes miss most. So we slaughter every month, not only in the seasons.",
      ),
      items: [
        { id: "farm", title: l("ذبح شرعي في المزرعة الوقفية", "Halal slaughter at the endowment farm"), desc: l("عجول وأغنام من مزرعتنا الوقفية بالدقهلية، تُذبح في بداية كل شهر بإشراف طبيب بيطري.", "Calves and sheep from our endowment farm in Dakahlia, slaughtered at the start of every month under a veterinarian's supervision.") },
        { id: "pack", title: l("تقطيع وتعبئة كيلو لكل أسرة", "Cut and packed, 1 kg per family"), desc: l("يُقطَّع اللحم ويُعبَّأ في أكياس صحية بوزن كيلو، كل كيس لأسرة.", "The meat is cut and packed in hygienic 1 kg bags, one bag per family.") },
        { id: "deliver", title: l("توزيع طازج في يوم الذبح", "Fresh delivery on slaughter day"), desc: l("يسلّم فريق الميدان اللحم في اليوم نفسه إلى باب البيت مع كرتونة الشهر.", "Our field team delivers the meat the same day to the door, together with the month's carton.") },
        { id: "proof", title: l("توثيق يصلك", "Documentation sent to you"), desc: l("صور الذبح والتوزيع تصلك على رقم تبرعك، مع الحفاظ على كرامة الأسر.", "Photos of the slaughter and distribution reach you on your donation number, with the families' dignity preserved.") },
      ],
    },

    /**
     * The three ways a meal can be given. title = name, extra = the ruling in one line (with its source),
     * desc = how we carry it out. The meal counts are fixed by the page code (1 / 10 / 60).
     */
    meals: {
      title: l("وجبة واحدة، ثلاث نيّات", "One meal, three intentions"),
      lead: l(
        "الوجبة نفسها وجبة كاملة من أوسط ما نطعم أهلينا: أرز ولحم أو دجاج وخضار وخبز. أنت تختار النية، ونحن ننفّذ العدد الشرعي ونوثّقه لك.",
        "The same full meal, of the kind we feed our own families: rice, meat or chicken, vegetables and bread. You choose the intention; we carry out the required number and document it for you.",
      ),
      items: [
        {
          id: "feeding",
          title: l("إطعام مسكين", "Feeding a poor person"),
          extra: l("صدقة بأي عدد من الوجبات", "A charity of any number of meals"),
          desc: l("وجبات مطبوخة ساخنة توزَّع على أسر الأيتام والمتعففين وكبار السن الذين يعيشون وحدهم، بأي عدد تختاره.", "Hot cooked meals for orphan and needy families and for elderly people living alone, in any number you choose."),
        },
        {
          id: "kaffara_yameen",
          title: l("كفارة اليمين", "Oath expiation"),
          extra: l("إطعام عشرة مساكين من أوسط ما تطعمون أهليكم (المائدة: ٨٩)", "Feeding ten poor people from the average of what you feed your families (Quran 5:89)"),
          desc: l("من حلف يمينًا ثم حنث فيها فكفارته إطعام عشرة مساكين. نقدّم عشر وجبات كاملة لعشرة مساكين مختلفين وتصلك صور التسليم.", "Whoever swears an oath and then breaks it owes the feeding of ten poor people. We serve ten full meals to ten different poor people and send you the delivery photos."),
        },
        {
          id: "kaffara_siyam",
          title: l("كفارة الصيام", "Fasting expiation"),
          extra: l("إطعام ستين مسكينًا لمن لم يستطع صيام شهرين متتابعين (متفق عليه)", "Feeding sixty poor people for one unable to fast two consecutive months (agreed upon)"),
          desc: l("كفارة إفساد صوم رمضان بالجماع لمن عجز عن صيام شهرين متتابعين. نقدّم ستين وجبة كاملة لستين مسكينًا. أما من أفطر لكبر أو مرض لا يُرجى برؤه ففديته إطعام مسكين عن كل يوم.", "The expiation for breaking a Ramadan fast through intercourse, for one unable to fast two consecutive months. We serve sixty full meals to sixty poor people. For one who cannot fast due to old age or chronic illness, the fidya is one poor person fed per day."),
        },
      ],
    },

    /** Sponsorship tiers. title = tier name, desc = what it covers. Amounts come from prices full / full_3 / full_year. */
    sponsor: {
      title: l("اكفل سُفرة أسرة", "Sponsor a family's table"),
      lead: l("كرتونة ١٤ كيلو وكيلو لحم من ذبيحة الشهر، للأسرة نفسها كل شهر، وتقرير شهري يصلك.", "A 14 kg carton and 1 kg of meat from the month's slaughter, for the same family every month, with a monthly report sent to you."),
      items: [
        { id: "full", title: l("شهر واحد", "One month"), desc: l("سُفرة شهر كاملة لأسرة من خمسة أفراد.", "A full month's table for a family of five.") },
        { id: "full_3", title: l("ثلاثة شهور", "Three months"), desc: l("نخصّص لك أسرة بعينها ونرسل لك ملفها مجهّل البيانات.", "We assign you a specific family and send its anonymised file.") },
        { id: "full_year", title: l("سنة كاملة", "A full year"), desc: l("اثنتا عشرة سُفرة لأسرة واحدة، وتقرير كل شهر بصور التسليم.", "Twelve months of food for one family, with a photo report every month.") },
      ],
    },

    /** What happens after the donation. */
    steps: {
      title: l("رحلة تبرعك", "Your donation's journey"),
      items: [
        { id: "receipt", title: l("إيصال ورقم تتبع", "Receipt and tracking number"), desc: l("فور تبرعك يصلك إيصال رسمي برقم مرجعي تتابع به تبرعك.", "An official receipt with a reference number arrives as soon as you give.") },
        { id: "family", title: l("نخصّص أسرة مستحقة", "We assign a deserving family"), desc: l("من قائمة الانتظار المعتمدة بعد بحث اجتماعي ميداني في المنصورة والدقهلية.", "From the approved waiting list, after a field social study in Mansoura and Dakahlia.") },
        { id: "prepare", title: l("ذبح وتعبئة", "Slaughter and packing"), desc: l("نذبح في المزرعة الوقفية ونعبّئ الكرتونة ونطبخ الوجبات في مطبخ اليسر.", "We slaughter at the endowment farm, pack the carton and cook the meals in the Al-Yusr kitchen.") },
        { id: "deliver", title: l("تسليم وتوثيق", "Delivery and documentation"), desc: l("يسلّم فريق الميدان على باب البيت بكرامة، وتصلك الصور على رقم تبرعك.", "Our field team delivers to the door with dignity, and the photos reach you on your donation number.") },
      ],
    },

    areas: {
      title: l("أين نُطعِم؟", "Where we feed"),
      lead: l("مقر المؤسسة في المنصورة، ويصل البرنامج إلى مراكز وقرى الدقهلية، ويمتد إلى كفر الشيخ والشرقية بحسب الحالات المعتمدة.", "The foundation is based in Mansoura; the programme reaches the districts and villages of Dakahlia, and extends to Kafr El Sheikh and Sharqia according to approved cases."),
      items: [],
    },
    areas_now: {
      title: l("نعمل فيها الآن", "Active now"),
      items: [
        { id: "mansoura", title: l("المنصورة", "Mansoura"), desc: l("", "") },
        { id: "talkha", title: l("طلخا", "Talkha"), desc: l("", "") },
        { id: "mitghamr", title: l("ميت غمر", "Mit Ghamr"), desc: l("", "") },
        { id: "belqas", title: l("بلقاس", "Belqas"), desc: l("", "") },
        { id: "sinbillawein", title: l("السنبلاوين", "Sinbillawein"), desc: l("", "") },
        { id: "aga", title: l("أجا", "Aga"), desc: l("", "") },
      ],
    },
    areas_before: {
      title: l("نصل إليها بحسب الحالات", "Reached case by case"),
      items: [
        { id: "kafr", title: l("كفر الشيخ", "Kafr El Sheikh"), desc: l("", "") },
        { id: "sharqia", title: l("الشرقية", "Sharqia"), desc: l("", "") },
        { id: "egypt", title: l("باقي محافظات مصر", "Other governorates"), desc: l("", "") },
      ],
    },

    gallery: {
      title: l("من الميدان", "From the field"),
      items: [],
    },
  },

  faq: [
    {
      q: l("ما الذي يشمله برنامج الغذاء الشهري؟", "What does the monthly food programme include?"),
      a: l(
        "ثلاثة أركان: لحوم من ذبائح شهرية تُذبح في المزرعة الوقفية ويُوزَّع منها كيلو لكل أسرة، وكرتونة ١٤ كيلو من المكونات الغذائية البلدي (أرز ومكرونة ودقيق وسكر وزيت وفول وعدس وسمنة وصلصة وشاي وملح)، ووجبات إطعام مطبوخة تُقدَّم إطعامًا أو كفارة صيام أو كفارة يمين.",
        "Three parts: meat from monthly slaughters at the endowment farm, 1 kg per family; a 14 kg carton of local staples (rice, pasta, flour, sugar, oil, fava beans, lentils, ghee, tomato paste, tea and salt); and cooked meals offered as feeding, fasting expiation or oath expiation.",
      ),
    },
    {
      q: l("ما محتويات كرتونة الـ ١٤ كيلو بالضبط؟", "What exactly is in the 14 kg carton?"),
      a: l(
        "أرز ٣ كيلو، مكرونة ٢ كيلو، دقيق ٢ كيلو، سكر ٢ كيلو، زيت ١٫٥ لتر، فول كيلو، عدس كيلو، سمنة بلدي نصف كيلو، صلصة نصف كيلو، شاي ربع كيلو، ملح ربع كيلو. الإجمالي ١٤ كيلو تكفي أسرة من خمسة أفراد شهرًا كاملًا.",
        "3 kg rice, 2 kg pasta, 2 kg flour, 2 kg sugar, 1.5 L oil, 1 kg fava beans, 1 kg lentils, 0.5 kg local ghee, 0.5 kg tomato paste, 0.25 kg tea and 0.25 kg salt. A total of 14 kg, enough for a family of five for a full month.",
      ),
    },
    {
      q: l("من أين تأتي اللحوم ومتى تُذبح؟", "Where does the meat come from and when is it slaughtered?"),
      a: l(
        "من المزرعة الوقفية لمؤسسة اليسر بالدقهلية. نذبح في بداية كل شهر بإشراف طبيب بيطري، ونقطّع اللحم ونعبّئه كيلو لكل أسرة، ويُوزَّع طازجًا في يوم الذبح نفسه.",
        "From Al-Yusr's endowment farm in Dakahlia. We slaughter at the start of every month under a veterinarian's supervision, portion the meat into 1 kg packs per family, and distribute it fresh the same day.",
      ),
    },
    {
      q: l("ما الفرق بين الإطعام وكفارة الصيام وكفارة اليمين؟", "What is the difference between feeding, fasting expiation and oath expiation?"),
      a: l(
        "الإطعام صدقة بأي عدد من الوجبات. كفارة اليمين لمن حلف وحنث: إطعام عشرة مساكين من أوسط ما تطعمون أهليكم (المائدة: ٨٩)، وننفّذها بعشر وجبات كاملة لعشرة مساكين. كفارة الصيام لمن أفسد صوم رمضان بالجماع وعجز عن صيام شهرين متتابعين: إطعام ستين مسكينًا، وننفّذها بستين وجبة. أما من لا يستطيع الصوم لكبر أو مرض مزمن ففديته إطعام مسكين عن كل يوم. وفي الحالات الخاصة نرجو مراجعة دار الإفتاء أو أهل العلم، ونحن ننفّذ الإطعام ونوثّقه لك.",
        "Feeding is a charity of any number of meals. The oath expiation, for one who swears and breaks an oath, is feeding ten poor people from the average of what you feed your family (Quran 5:89); we carry it out with ten full meals for ten poor people. The fasting expiation, for one who broke a Ramadan fast through intercourse and cannot fast two consecutive months, is feeding sixty poor people; we carry it out with sixty meals. One who cannot fast due to old age or chronic illness owes a fidya of one poor person fed per day. For particular cases please consult Dar al-Ifta or a scholar; we carry out the feeding and document it for you.",
      ),
    },
    {
      q: l("ما الوجبة التي تُقدَّم في الكفارة؟", "What meal is served for an expiation?"),
      a: l(
        "وجبة كاملة مطبوخة من أوسط ما نطعم أهلينا: أرز ولحم أو دجاج وخضار وخبز، تُقدَّم لمسكين واحد عن كل وجبة، ولا يُحسب المسكين الواحد مرتين في الكفارة نفسها.",
        "A full cooked meal of the kind we feed our own families: rice, meat or chicken, vegetables and bread, served to one poor person per meal, and no poor person is counted twice within the same expiation.",
      ),
    },
    {
      q: l("كيف يتم اختيار الأسر المستحقة؟", "How are eligible families chosen?"),
      a: l(
        "يزور فريق البحث الاجتماعي كل أسرة ويوثّق حالتها (الدخل، عدد الأفراد، الأيتام وكبار السن والمرضى)، ثم تعتمدها اللجنة المختصة وتدخل قائمة الانتظار. الأولوية لأسر الأيتام والأرامل وكبار السن الذين يعيشون وحدهم.",
        "Our social research team visits each family and documents its situation (income, household size, orphans, elderly and sick members); the relevant committee then approves it for the waiting list. Priority goes to orphans' families, widows and elderly people living alone.",
      ),
    },
    {
      q: l("هل أستطيع كفالة أسرة بعينها كل شهر؟", "Can I sponsor a specific family every month?"),
      a: l(
        "نعم. كفالة السُّفرة لثلاثة شهور أو سنة تخصَّص لأسرة بعينها، ونرسل لك ملفها مجهّل البيانات حفاظًا على كرامتها، وتقريرًا شهريًا بصور التسليم على واتساب أو البريد.",
        "Yes. A three-month or full-year table sponsorship is assigned to a specific family; we send you its anonymised file, to protect its dignity, and a monthly report with delivery photos on WhatsApp or email.",
      ),
    },
    {
      q: l("هل يجوز دفع زكاة المال في الغذاء الشهري؟", "Can I pay Zakat through the monthly food programme?"),
      a: l(
        "نعم. اللحوم والكرتونة والوجبات تصل إلى الفقراء والمساكين، وهم من مصارف الزكاة الثمانية، ونصدر لك إيصال زكاة موثقًا. أما الكفارات فتُدفع من غير مال الزكاة.",
        "Yes. The meat, carton and meals reach the poor and needy, who are among the eight categories of Zakat recipients, and we issue a verified Zakat receipt. Expiations, however, must be paid from money other than Zakat.",
      ),
    },
    {
      q: l("كيف أتبرع من خارج مصر؟", "How can I donate from outside Egypt?"),
      a: l(
        "عبر صفحة التبرع بالبطاقة الائتمانية (فيزا/ماستركارد) من أي دولة، أو بالتحويل البنكي على الحسابات الرسمية للمؤسسة. ولأي استفسار راسلنا على واتساب +20 109 700 0137 ويصلك الإيصال والتوثيق على الرقم نفسه.",
        "Through the donate page by credit card (Visa/Mastercard) from any country, or by bank transfer to the foundation's official accounts. For help, message us on WhatsApp at +20 109 700 0137; your receipt and documentation reach you on the same number.",
      ),
    },
  ],

  cta: {
    title: l("سُفرة واحدة منك تُطعِم أسرة شهرًا كاملًا — تبرّع الآن", "One table from you feeds a family for a whole month — donate now"),
    sub: l("لحم وكرتونة ووجبة، تصل إلى باب البيت بكرامة، وتوثيقها يصل إليك.", "Meat, a carton and a meal, delivered to the door with dignity, and the proof delivered to you."),
  },

  /** Pictures (dashboard → الصور). */
  images: {
    hero: {
      label: l("صورة أعلى الصفحة", "Hero image"),
      max: 1,
      items: [img("hero-carton-opened.webp", "كرتونة الغذاء الشهرية ١٤ كيلو مع كيلو لحم من ذبيحة الشهر", "The 14 kg monthly food carton with 1 kg of meat from the month's slaughter")],
    },
    gallery: {
      label: l("معرض الصور", "Gallery"),
      items: [
        img("program-food-new.jpg", "تسليم كرتونة الغذاء الشهرية على باب أسرة بالمنصورة", "Monthly food carton delivered to a family's door in Mansoura"),
        img("poster-meat.webp", "لحوم ذبيحة الشهر مقسّمة كيلو لكل أسرة", "The month's slaughter meat portioned 1 kg per family"),
        img("brand-carton-stack.png", "كراتين الغذاء في مخزن المؤسسة قبل التوزيع", "Food cartons at the foundation's warehouse before distribution"),
        img("yusr-meals.webp", "وجبات مطبوخة من مطبخ اليسر جاهزة للتوزيع", "Cooked meals from the Al-Yusr kitchen ready for distribution"),
      ],
    },
  },
};

export default FOOD;
