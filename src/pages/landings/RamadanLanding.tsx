import { CampaignLandingShell } from "@/components/sections/CampaignLandingShell";
import yusrRamadanBox from "@/assets/yusr-ramadan-box.png";
import yusrMeals from "@/assets/yusr-meals.jpg";
import yusrDistribution from "@/assets/yusr-distribution-1.jpg";
import farmHero from "@/assets/farm-hero.jpg";

const RamadanLanding = () => (
  <CampaignLandingShell
    slug="ramadan"
    path="/ramadan"
    badgeAr="موسم الخير — رمضان المبارك ١٤٤٧ هـ"
    badgeEn="Ramadan Season of Giving"
    titleAr="موسم الخير — «رمضانك في اليسر إحسانٌ لا ينقطع»"
    titleEn="Ramadan Season — 'Your generosity with Al-Yusr is non-stop goodness'"
    taglineAr="في شهر الجود والبركة، تتضاعف الحسنات وتتفتح أبواب الخير. يأتي «موسم الخير» ليكون بوابتك لإيصال عطائك وإحسانك إلى مستحقيه بكرامة وإتقان: كراتين 25 كجم، وجبات إفطار ساخنة، لحوم مزارعنا الوقفية، وتجهيز عرائس وكسوة عيد."
    taglineEn="In the blessed month of Ramadan, Al-Yusr delivers complete 25kg food boxes, daily hot iftar meals, farm-fresh meat, orphan Eid clothing, and bride support directly to deserving doorsteps."
    metaDescAr="شارك في موسم رمضان مع مؤسسة اليسر: كرتونة الخير (25 كيلو بلدي)، مطبخ وجبات الإفطار الساخنة، ذبائح مزارعنا الوقفية، تيسير الزواج 'الفرحة فرحتين'، كسوة العيد، وزكاة المال والفطر."
    metaDescEn="Support Al-Yusr's Ramadan Season: 25kg family boxes, hot iftar kitchen, endowment farm meat, bride support, orphan Eid clothing, and Zakat distribution in Egypt."
    heroImage={yusrRamadanBox}
    heroAlt="كرتونة رمضان 25 كيلو من مؤسسة اليسر مع لحوم بلدي"
    pricing={[
      { labelAr: "وجبة إفطار صائم ساخنة", labelEn: "Hot Iftar Meal", amount: 95, tagAr: "مطبخ اليسر", tagEn: "Daily Iftar" },
      { labelAr: "كرتونة رمضان الكبرى (25 كجم)", labelEn: "Ramadan Food Box (25kg)", amount: 950, tagAr: "تكفي أسرة شهر", tagEn: "Family Box" },
      { labelAr: "سهم لحوم بلدي من مزارعنا (1 كجم)", labelEn: "Farm Meat Share (1kg)", amount: 420, tagAr: "طازج 100%", tagEn: "Fresh meat" },
      { labelAr: "كسوة عيد لطفل يتيم + علبة كعك", labelEn: "Orphan Eid Clothes + Cookies", amount: 650, tagAr: "فرحة العيد", tagEn: "Eid Joy" },
      { labelAr: "سهم تيسير زواج عروسة يتيمة", labelEn: "Bride Support Share", amount: 1500, tagAr: "الفرحة فرحتين", tagEn: "Bride share" },
      { labelAr: "إخراج زكاة الفطر / زكاة المال", labelEn: "Zakat Al-Fitr / Zakat Al-Mal", amount: 75, tagAr: "مصارف شرعية", tagEn: "Zakat" },
    ]}
    pillars={[
      {
        titleAr: "1. كرتونة الخير (25 كجم غنية بالبركة)",
        titleEn: "1. The 25kg Blessing Box",
        descAr: "سفرة متكاملة تكفي الأسرة طوال الشهر: جودة بلدي 100% (أرز، زيت، سكر، مكرونة، بقوليات، شاي، صلصة، سمن) مع بروتين طازج من لحوم ودواجن مزارعنا.",
        descEn: "A complete month-long pantry: 100% premium local staples (rice, oil, sugar, pasta, legumes, ghee) paired with farm-fresh meat and poultry.",
      },
      {
        titleAr: "2. مطبخ اليسر (وجبات الإفطار الساخنة)",
        titleEn: "2. Al-Yusr Kitchen (Hot Iftars)",
        descAr: "إنتاج وتوزيع آلاف الوجبات الساخنة يومياً لعابري السبيل، المسافرين، مرافقي المرضى بالمستشفيات، والأسر المتعففة في منازلها بكرامة تامة.",
        descEn: "Cooking and serving thousands of hot, nutritious iftar meals daily for travelers, hospital patient companions, and families at home.",
      },
      {
        titleAr: "3. ذبائح مزارع اليسر الوقفية",
        titleEn: "3. Endowment Farms Fresh Meat",
        descAr: "ذبح رؤوس الماشية (أبقار وضأن) من إنتاج مزارعنا الخيرية الخاصة (أكثر من 2 طن في رمضان) لضمان بروتين بلدي طازج ومضمون لمستحقيه.",
        descEn: "Over 2 tons of fresh local meat slaughtered under veterinary supervision from Al-Yusr endowment farms for Ramadan distributions.",
      },
      {
        titleAr: "4. تيسير الزواج (الفرحة فرحتين)",
        titleEn: "4. Bride Trousseau (Double Joy)",
        descAr: "تجهيز العرائس من البنات اليتيمات وغير القادرات لتكون الفرحة فرحتين: فرحة الجواز وفرحة العيد، وتوفير أجهزتهن الأساسية لبدء حياة كريمة.",
        descEn: "Providing essential appliances and furniture for orphan and needy brides to celebrate both their wedding and Eid with dignity.",
      },
      {
        titleAr: "5. كسوة العيد وكعك الفرحة",
        titleEn: "5. Eid Clothes & Traditional Treats",
        descAr: "شراء ملابس العيد الجديدة للأطفال الأيتام، وتوزيع علب كعك العيد الفاخرة على الأسر ليعيش الأطفال فرحة العيد كاملة دون أي نقص.",
        descEn: "Purchasing brand-new Eid outfits for orphan children and distributing festive cookies ensuring joyful celebrations in every home.",
      },
      {
        titleAr: "6. زكاة المال وزكاة الفطر",
        titleEn: "6. Zakat Al-Mal & Zakat Al-Fitr",
        descAr: "أمانتك في أيدٍ أمينة: توجيه زكاة المال للمصارف الشرعية الأشد احتياجاً، وجمع وتوزيع زكاة الفطر في مواعيدها الشرعية قبل صلاة العيد.",
        descEn: "Dedicated Sharia disbursement: delivering zakat to documented deserving recipients and distributing Zakat Al-Fitr on time before Eid prayer.",
      },
    ]}
    steps={[
      {
        titleAr: "التجهيز المبكر قبل رمضان",
        titleEn: "Pre-Ramadan Preparation",
        descAr: "شراء السلع وتعبئة الكراتين وإعداد قوائم المستحقين في شهر شعبان لضمان وصول الكراتين قبل أول يوم صيام.",
        descEn: "Packing wholesale staples and finalizing recipient lists in Sha'ban so boxes arrive before the first day of fasting.",
      },
      {
        titleAr: "التوزيع اليومي طوال الشهر",
        titleEn: "Daily Field Operations",
        descAr: "تشغيل المطابخ يومياً، وقوافل التوزيع الميداني التي تصل لقرى الدقهلية وكفر الشيخ والشرقية لباب البيت.",
        descEn: "Operating our charity kitchens daily and dispatching doorstep delivery vans to rural villages across the Delta.",
      },
      {
        titleAr: "ختام الشهر وفرحة العيد",
        titleEn: "Late Ramadan & Eid Joy",
        descAr: "صرف زكاة الفطر، وتوزيع كسوة العيد وكعك العيد على الأيتام، ومسابقات القرآن الكريم.",
        descEn: "Disbursing Zakat Al-Fitr, handing out Eid clothes and treats to orphans, and awarding Quran competition winners.",
      },
    ]}
    gallery={[
      { src: yusrRamadanBox, altAr: "كرتونة الخير الكبرى من اليسر 25 كيلو", altEn: "Al-Yusr Ramadan 25kg box" },
      { src: yusrMeals, altAr: "تجهيز وتوزيع وجبات الإفطار الساخنة يومياً", altEn: "Daily hot iftar meal prep" },
      { src: farmHero, altAr: "لحوم بلدي طازجة من مزارع اليسر الوقفية", altEn: "Endowment farm fresh meat" },
      { src: yusrDistribution, altAr: "قوافل توزيع المساعدات الرمضانية بقرى الدقهلية", altEn: "Ramadan aid convoys" },
    ]}
    relatedLinks={[
      { href: "/food-box", ar: "كرتونة الغذاء الشهرية", en: "Monthly food box" },
      { href: "/zakat", ar: "حساب ودفع الزكاة", en: "Calculate & pay Zakat" },
      { href: "/farm", ar: "المزرعة الوقفية", en: "Endowment farm" },
      { href: "/trust", ar: "الشفافية وتقارير التوزيع", en: "Trust & reports" },
    ]}
    faq={{
      ar: [
        { q: "ما هي مكونات كرتونة رمضان في مؤسسة اليسر؟", a: "كرتونة متكاملة تزن حوالي 25 كجم من السلع الأساسية البلدي (أرز، زيت، سكر، مكرونة، لوبيا، فاصوليا، شاي، صلصة، سمن) ويُرفق معها لحوم طازجة من مزارعنا لتكفي الأسرة شهراً كاملاً." },
        { q: "أين توزع وجبات الإفطار الساخنة؟", a: "توزع يومياً لعابري السبيل والمسافرين ومرافقي المرضى في المستشفيات الحكومية، بالإضافة إلى وجبات ساخنة تصل لمنازل الأسر المتعففة في المنصورة وقرى الدقهلية." },
        { q: "كيف تضمن المؤسسة وصول زكاة الفطر في موعدها الشرعي؟", a: "يتم حصر الأسر وتحديد احتياجاتها مسبقاً، ويتم إخراج وتوزيع زكاة الفطر خلال العشر الأواخر وحتى صباح يوم العيد قبل الصلاة تماماً كما تنص الشريعة." },
        { q: "هل يمكنني التبرع بتجهيز عروسة يتيمة في رمضان؟", a: "نعم، مبادرة 'الفرحة فرحتين' تتيح لك التبرع بسهم أو كفالة جهاز عروسة يتيمة كامل لتدخل الفرحة عليها مع حلول العيد." },
      ],
      en: [
        { q: "What are the contents of Al-Yusr's Ramadan Box?", a: "A 25kg box containing premium rice, oil, sugar, pasta, legumes, tea, sauce, and ghee, accompanied by fresh meat from our endowment farms." },
        { q: "Where are hot iftar meals distributed?", a: "To hospital patient companions, stranded travelers, and directly to the doors of deserving families across Mansoura and Delta villages." },
        { q: "How is Zakat Al-Fitr distributed on time?", a: "Distributed during the last ten days of Ramadan and completed before Eid prayer according to Sharia guidelines." },
      ],
    }}
    donateHref="/donate?program=box"
    donateLabelAr="تبرّع لرمضان الآن"
    donateLabelEn="Donate to Ramadan"
    bottomCtaAr="رمضانك في اليسر إحسان لا ينقطع — اكفل كرتونة أو وجبة إفطار اليوم"
    bottomCtaEn="Your Ramadan with Al-Yusr is endless goodness — sponsor a box or meal today"
  />
);

export default RamadanLanding;
