import { useMemo } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { Heart, MapPin, ShieldCheck, Users, Truck, CheckCircle2, ArrowLeft, ArrowRight, Phone, Clock, Award, Quote, Building2, FileCheck2, Banknote, HandHeart, Sparkles } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { Helmet } from "react-helmet-async";
import { useLang } from "@/i18n/LangContext";
import { DAKAHLIA_CITIES } from "@/data/dakahliaCities";

/**
 * /donate/:city — Local-intent landing page targeting "تبرع في {city}" / "donate in {city}".
 * Currently rich for Mansoura (MVP). Other Dakahlia cities render with the existing
 * DAKAHLIA_CITIES copy until expanded.
 */

const PROGRAM_LABELS: Record<string, { ar: string; en: string; href: string }> = {
  odhya: { ar: "صكوك الأضحية", en: "Qurbani Vouchers", href: "/qurbani" },
  box: { ar: "كرتونة العزومة", en: "Family Food Box", href: "/programs/box" },
  orphan: { ar: "كفالة يتيم", en: "Sponsor an Orphan", href: "/programs/orphan" },
  water: { ar: "وصلات المياه", en: "Clean Water", href: "/programs/water" },
  bride: { ar: "تجهيز العرائس", en: "Brides Trousseau", href: "/programs/bride" },
  education: { ar: "تعليم وأيتام", en: "Education", href: "/programs/education" },
  health: { ar: "علاج مرضى", en: "Medical Aid", href: "/programs/health" },
  zakat: { ar: "الزكاة", en: "Zakat", href: "/zakat" },
};

type RichLang = {
  intro: string;
  longIntro: string[];
  why: string[];
  neighborhoods: { name: string; note: string }[];
  steps: { t: string; d: string }[];
  impact: { n: string; label: string }[];
  testimonials: { quote: string; author: string; role: string }[];
  payments: string[];
  faq: { q: string; a: string }[];
};
const RICH_COPY: Record<string, { ar: RichLang; en: RichLang }> = {
  mansoura: {
    ar: {
      intro:
        "مؤسسة اليسر الخيرية مقرها الرئيسي في المنصورة، عاصمة الدقهلية. نخدم آلاف الأسر الفقيرة في المنصورة وقراها وكفور الدقهلية كل عام، عبر برامج موثقة بالكامل: يصل تبرعك إلى باب البيت بعد معاينة قبل التسليم، مع صور وفيديو بعد كل عملية. كل جنيه يُسجَّل، وكل أسرة نزورها قبل اعتمادها.",
      longIntro: [
        "في قلب المنصورة، وعلى بُعد دقائق من جامعة المنصورة وكوبري طلخا، يقف فريق اليسر يوميًا لخدمة الأسر الأكثر احتياجًا في مدن الدقهلية وكفورها. من حي الجامعة وتوريل وميت حدر، إلى شارع الجمهورية والسكة الجديدة، نعرف العائلات بأسمائها لا بأرقامها. كل جنيه تتبرع به يتحوّل إلى كرتونة عزومة، أو صك أضحية، أو علاج طفل، أو سقف بيت لأسرة تنام تحت السماء.",
        "اليسر ليست جمعية تنقل الأموال فحسب؛ نحن فريق ميداني مقيم في المنصورة طوال العام. لدينا قاعدة بيانات لأكثر من 3200 أسرة محتاجة تم التحقق منها بزيارات منزلية ومعاينات اجتماعية، ولا تدخل أي أسرة قاعدتنا إلا بعد التأكد من وضعها الاقتصادي والصحي والاجتماعي، بالتعاون مع أئمة المساجد والوحدات المحلية ومديرية التضامن الاجتماعي بالدقهلية.",
        "يعمل تبرعك في المنصورة على 3 محاور: إغاثة فورية (غذاء، علاج، إيواء)، وتنمية مستدامة (تعليم، تدريب، مشاريع صغيرة)، وكرامة إنسانية (تجهيز العرائس، تجهيز البيوت، كفالة الأيتام). يصل 90% من قيمة تبرعك إلى الأسرة، و6% مصاريف لوجستية ونقل وتجهيز، و4% رواتب وإدارة."
      ],
      why: [
        "فريق ميداني مقيم في المنصورة؛ لسنا وسطاء، بل نوزّع بأنفسنا",
        "تعاون رسمي مع مديرية التضامن الاجتماعي وأئمة المساجد",
        "توثيق بالصور والفيديو لكل أسرة وكل عملية تسليم",
        "تقارير شهرية للمتبرعين الدائمين بالأرقام والأسماء",
        "دون عمولات وسطاء؛ 90% من تبرعك يصل إلى الأسرة",
        "مقر دائم في المنصورة لاستقبال المتبرعين والمتطوعين",
        "خط ساخن 24/7 للرد على استفسارات المتبرعين والأسر",
        "تبرع آمن بفيزا أو فودافون كاش أو إنستاباي أو بتحويل بنكي معفى من الضرائب",
      ],
      neighborhoods: [
        { name: "حي الجامعة وتوريل", note: "خدمة طلاب جامعة المنصورة المغتربين والأسر منخفضة الدخل" },
        { name: "ميت حدر والمشاية", note: "كرتونة عزومة شهرية لأكثر من 180 أسرة" },
        { name: "كفور المنصورة الريفية", note: "وصلات مياه نظيفة وترميم بيوت طينية" },
        { name: "شربين وطلخا وتوابعهما", note: "كفالة أيتام وعلاج مرضى الفشل الكلوي" },
        { name: "وسط البلد والسكة الجديدة", note: "نقطة استلام التبرعات العينية وصكوك الأضحية" },
        { name: "حي الزهور والثورة", note: "حملات تيسير زواج العرائس وتجهيز بيوت الأيتام" },
      ],
      steps: [
        { t: "اختر برنامجك", d: "كرتونة، أو كفالة يتيم، أو أضحية، أو علاج، أو سقف بيت؛ اختر ما يطمئن إليه قلبك." },
        { t: "ادفع بأمان", d: "فيزا/ماستر، فودافون كاش، انستاباي، أو تحويل بنكي. إيصال فوري." },
        { t: "نزور الأسرة", d: "يختار فريقنا في المنصورة الأسرة الأنسب ويُجري معاينة قبل التسليم." },
        { t: "يصل في اليوم نفسه", d: "في أغلب الحالات نسلّم خلال ٢٤–٤٨ ساعة داخل المنصورة." },
        { t: "استلم التوثيق", d: "صور وفيديو وتقرير مكتوب عبر واتساب أو بريدك الإلكتروني خلال أسبوع." },
      ],
      impact: [
        { n: "3,200+", label: "أسرة في المنصورة وقراها" },
        { n: "180", label: "كرتونة عزومة شهريًا" },
        { n: "120", label: "يتيم تحت الكفالة" },
        { n: "45", label: "حالة علاج عاجلة سنويًا" },
        { n: "32", label: "وصلة مياه في كفور المنصورة" },
        { n: "1,400+", label: "كرتونة غذائية وُزّعت في ٢٠٢٥" },
      ],
      testimonials: [
        { quote: "وصلت الكرتونة بتاعتي لأسرة عم محمد في ميت حدر بنفس اليوم اللي تبرعت فيه، وبعت لي صور التسليم على الواتس. ده أول مرة أحس إن فلوس التبرع بتوصل فعلاً.", author: "أحمد خ.", role: "متبرع شهري — القاهرة" },
        { quote: "كنت محتاجة عملية لبنتي مستعجلة وما عرفش حد. اليسر دفعوا تكاليف العملية في مستشفى الجامعة في يومين بس. ربنا يجزيهم خير.", author: "أم سارة", role: "مستفيدة — حي الجامعة" },
        { quote: "عملنا حملة جواز ٣ بنات أيتام في المنصورة في أقل من شهر. الشفافية والتوثيق على مستوى مؤسسات دولية.", author: "د. خالد ع.", role: "متبرع شركات" },
      ],
      payments: [
        "فودافون كاش وإنستاباي للتبرعات السريعة",
        "فيزا وماستر كارد عبر بوابة دفع آمنة (Kashier)",
        "تحويل بنكي على حساب المؤسسة الرسمي بالدقهلية",
        "تسليم التبرع نقدًا في المقر الرئيسي بالمنصورة",
        "تبرع بالكرتونة أو الأضحية عينيًا، ونستلمها من بيتك",
      ],
      faq: [
        {
          q: "كيف أتبرع لأسرة في المنصورة تحديدًا؟",
          a: "تبرّع من هذه الصفحة أو من /donate وحدد البرنامج (كرتونة، يتيم، أضحية…)، وسنخصص تبرعك تلقائيًا لأقرب أسرة محتاجة في المنصورة أو القرى التابعة لها.",
        },
        {
          q: "هل مؤسسة اليسر مرخّصة في الدقهلية؟",
          a: "نعم، مؤسسة اليسر الخيرية مرخصة من وزارة التضامن الاجتماعي ومسجلة رسميًا في محافظة الدقهلية. كل التبرعات معفاة من ضريبة الدخل بموجب قانون الجمعيات الأهلية.",
        },
        {
          q: "هل يمكنني زيارة المؤسسة في المنصورة؟",
          a: "بالتأكيد. مقرنا في المنصورة مفتوح لاستقبال المتبرعين والمتطوعين. تواصل معنا من /contact لحجز موعد للزيارة أو لمعاينة الأسر.",
        },
        {
          q: "كم تكلفة كفالة يتيم في المنصورة شهريًا؟",
          a: "كفالة اليتيم في المنصورة تبدأ من 500 جنيه شهريًا، وتشمل المصاريف الأساسية (طعام، تعليم، علاج)، ويصلك تقرير شهري بصور الطفل وأخباره.",
        },
        {
          q: "هل يمكنني التطوع في المنصورة؟",
          a: "نعم، يرحّب فريق التطوع في المنصورة بكل من يحب المساعدة. سجّل من /volunteer وسنتواصل معك لتحديد الدور المناسب لك.",
        },
        { q: "ما طرق الدفع المتاحة للمتبرعين في المنصورة؟", a: "نقبل فيزا وماستر كارد عبر بوابة دفع آمنة، وفودافون كاش، وإنستاباي، والتحويل البنكي على حساب المؤسسة الرسمي، والدفع نقدًا في المقر الرئيسي. ويصدر لكل تبرع إيصال إلكتروني فوري." },
        { q: "كم سعر كرتونة العزومة في المنصورة؟", a: "سعر كرتونة العزومة الأساسية ٤٥٠ جنيهًا، وتضم ١٢ صنفًا تكفي أسرة من ٤–٥ أفراد لمدة شهر. أما الكرتونة الكبيرة فسعرها ٧٥٠ جنيهًا، وتضم ٢٠ صنفًا ولحومًا." },
        { q: "كيف أتأكد أن تبرعي وصل فعلًا إلى الأسرة؟", a: "يصلك خلال أسبوع على الأكثر: صور التسليم، وفيديو قصير، واسم الأسرة المستفيدة، وتقرير عن حالتها، عبر واتساب أو البريد الإلكتروني أو صفحتك على الموقع إن كنت متبرعًا مسجّلًا." },
        { q: "هل تستلمون تبرعات عينية في المنصورة؟", a: "بالتأكيد: ملابس، وأثاث، وأجهزة كهربائية، ومواد غذائية، وكتب مدرسية. نرسل سيارة المؤسسة لتستلمها من بيتك في المنصورة وضواحيها مجانًا." },
        { q: "هل توجد حملات للأضحية والزكاة في المنصورة؟", a: "نعم. يبدأ طرح صكوك الأضحية قبل العيد بشهر، ونوزّع الزكاة على مدار العام على مصارفها الشرعية الثمانية. تابع /qurbani و/zakat لمعرفة كل التفاصيل." },
        { q: "هل التبرع لليسر معفى من الضرائب؟", a: "نعم، التبرعات للجمعيات المشهرة لدى وزارة التضامن (ومنها اليسر) معفاة من ضريبة الدخل بحد أقصى ١٠٪ من صافي الربح للشركات و٢٠٪ للأفراد وفقًا للقانون المصري." },
      ],
    },
    en: {
      intro:
        "Al-Yusr Charity Foundation is headquartered in Mansoura, capital of Dakahlia governorate. We serve thousands of low-income families across Mansoura, its surrounding villages, and the kafr districts of Dakahlia every year through fully-documented programs. Your donation reaches the family's doorstep with pre-delivery inspection and full photo/video proof after every operation.",
      longIntro: [
        "In the heart of Mansoura, minutes from Mansoura University and Talkha bridge, the Al-Yusr team works daily to serve the most vulnerable families across Dakahlia's districts and villages. From the University quarter, Toreel and Mit Hadar, to Gomhoria street and El-Sekka El-Gedida, we know our families by name — not by numbers. Every pound becomes a food box, a Qurbani share, a child's surgery, or a roof for a family sleeping under the open sky.",
        "Al-Yusr is not a money-transfer charity. We are a year-round field team based in Mansoura with a verified database of 3,200+ families, vetted through home visits and social assessments in coordination with mosque imams, local councils and Dakahlia's Ministry of Social Solidarity.",
        "Your donation in Mansoura works on 3 axes: immediate relief (food, medical, shelter), sustainable development (education, training, micro-projects) and human dignity (bride trousseaus, orphan sponsorship, home renovation). 90% of every pound reaches the family, 6% covers logistics, transport and preparation, and 4% covers salaries and administration.",
      ],
      why: [
        "Field team based in Mansoura — we deliver, not middlemen",
        "Official partnership with Dakahlia Social Solidarity Directorate and mosque imams",
        "Photo & video documentation of every family and every delivery",
        "Monthly reports to recurring donors with names and amounts",
        "No broker commissions — 90% of your donation reaches the family",
        "Permanent Mansoura office welcoming donors and volunteers",
        "24/7 hotline for donor and beneficiary inquiries",
        "Secure payment via Visa, Vodafone Cash, InstaPay or tax-exempt bank transfer",
      ],
      neighborhoods: [
        { name: "University & Toreel quarter", note: "Serving Mansoura University expat students and low-income families" },
        { name: "Mit Hadar & Mashaya", note: "Monthly food boxes for 180+ families" },
        { name: "Mansoura rural kafrs", note: "Clean water lines and mud-house renovation" },
        { name: "Sherbin, Talkha & branches", note: "Orphan sponsorship and dialysis patient care" },
        { name: "Downtown & El-Sekka El-Gedida", note: "In-kind donation drop-off and Qurbani booking" },
        { name: "El-Zohour & El-Thawra districts", note: "Bride trousseau and orphan home setup campaigns" },
      ],
      steps: [
        { t: "Pick a program", d: "Food box, orphan, Qurbani, medical or roof — choose what speaks to you." },
        { t: "Pay securely", d: "Visa/Master, Vodafone Cash, InstaPay or bank transfer. Instant receipt." },
        { t: "We visit the family", d: "Our Mansoura team selects the most fitting family and conducts pre-delivery vetting." },
        { t: "Same-day delivery", d: "Most Mansoura deliveries happen within 24–48 hours." },
        { t: "Receive documentation", d: "Photos, video and a written report on WhatsApp or email within a week." },
      ],
      impact: [
        { n: "3,200+", label: "Families across Mansoura & villages" },
        { n: "180", label: "Food boxes monthly" },
        { n: "120", label: "Orphans under sponsorship" },
        { n: "45", label: "Urgent medical cases yearly" },
        { n: "32", label: "Water lines in Mansoura kafrs" },
        { n: "1,400+", label: "Food boxes delivered in 2025" },
      ],
      testimonials: [
        { quote: "My food box reached Uncle Mohamed's family in Mit Hadar the same day I donated, with delivery photos sent on WhatsApp. First time I truly felt my donation arrived.", author: "Ahmed K.", role: "Monthly donor — Cairo" },
        { quote: "I needed an urgent surgery for my daughter and knew no one. Al-Yusr covered the cost at Mansoura University Hospital within two days.", author: "Umm Sara", role: "Beneficiary — University quarter" },
        { quote: "We funded weddings for 3 orphan girls in Mansoura in under a month. Transparency and reporting at the level of international NGOs.", author: "Dr. Khaled A.", role: "Corporate donor" },
      ],
      payments: [
        "Vodafone Cash & InstaPay for instant donations",
        "Visa & Mastercard via secure Kashier gateway",
        "Bank transfer to our official Dakahlia account",
        "Cash drop-off at our Mansoura headquarters",
        "In-kind donations (boxes, Qurbani) — we collect from your home",
      ],
      faq: [
        {
          q: "How do I donate specifically to a family in Mansoura?",
          a: "Choose to donate from this page or /donate and pick a program (food box, orphan, qurbani…). We automatically allocate your donation to the nearest family in need in Mansoura or its rural areas.",
        },
        {
          q: "Is Al-Yusr licensed in Dakahlia?",
          a: "Yes, Al-Yusr Charity Foundation is licensed by the Ministry of Social Solidarity and officially registered in Dakahlia governorate. All donations are tax-deductible under Egypt's NGO law.",
        },
        {
          q: "Can I visit the foundation in Mansoura?",
          a: "Of course. Our Mansoura headquarters welcomes donors and volunteers. Contact us via /contact to schedule a visit or to inspect families directly.",
        },
        {
          q: "How much is monthly orphan sponsorship in Mansoura?",
          a: "Orphan sponsorship in Mansoura starts at EGP 500/month and covers essentials (food, education, medical). You receive a monthly report with the child's photo and updates.",
        },
        {
          q: "Can I volunteer in Mansoura?",
          a: "Yes, our Mansoura volunteer team welcomes anyone willing to help. Register at /volunteer and we'll match you with the right role.",
        },
        { q: "What payment methods do you accept in Mansoura?", a: "Visa & Mastercard via a secure gateway, Vodafone Cash, InstaPay, bank transfer to our official account, or cash at our Mansoura HQ. Every donation generates an instant electronic receipt." },
        { q: "How much is a food box in Mansoura?", a: "Standard food box is EGP 450 (12 items, feeds a family of 4–5 for a month). Large box is EGP 750 (20 items including meat)." },
        { q: "How can I verify my donation reached the family?", a: "Within a week you receive: delivery photos, a short video, the beneficiary family name, and a status report — via WhatsApp, email or your donor dashboard if registered." },
        { q: "Do you accept in-kind donations in Mansoura?", a: "Absolutely — clothes, furniture, appliances, food, school supplies. Our truck collects from your home in Mansoura and surroundings free of charge." },
        { q: "Do you run Qurbani and Zakat campaigns in Mansoura?", a: "Yes. Qurbani vouchers open one month before Eid; Zakat is distributed year-round across the 8 sharia categories. See /qurbani and /zakat for details." },
        { q: "Are donations to Al-Yusr tax-exempt?", a: "Yes, donations to Ministry-registered NGOs (including Al-Yusr) are tax-deductible up to 10% of net profit for companies and 20% for individuals under Egyptian tax law." },
      ],
    },
  },
};

const DonateCity = () => {
  const { city = "" } = useParams<{ city: string }>();
  const { lang } = useLang();

  const cityData = useMemo(() => DAKAHLIA_CITIES.find((c) => c.slug === city), [city]);
  const rich = RICH_COPY[city];

  if (!cityData) return <Navigate to="/cases" replace />;

  const cityName = lang === "ar" ? cityData.ar : cityData.en;
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;

  const title = lang === "ar"
    ? `تبرع في ${cityName} — دعم أسر محتاجة في الدقهلية | جمعيات خيرية موثّقة`
    : `Donate in ${cityName} — support needy families in Dakahlia | verified charity aid`;

  const description = lang === "ar"
    ? `تبرع لأسر ${cityName} المحتاجة عبر مؤسسة اليسر: توزيع صدقات، كرتونة عزومة، كفالة يتيم، صكوك أضحية، ومساعدات موثقة بالصور والفيديو في الدقهلية.`
    : `Donate to needy families in ${cityName} through Al-Yusr: sadaqah distribution, food boxes, orphan sponsorship, qurbani shares, and documented aid with photos and video in Dakahlia.`;

  const keywords = lang === "ar"
    ? `تبرع في ${cityName}, دعم أسر محتاجة, صدقات في الدقهلية, جمعيات خيرية في ${cityName}, كفالة يتيم, أضاحي, تبرعات موثقة, توزيع مساعدات`
    : `donate in ${cityName}, support needy families, sadaqah in Dakahlia, charity organizations in ${cityName}, orphan sponsorship, qurbani, documented donations, aid distribution`;

  const copy = rich?.[lang] ?? {
    intro: cityData.copy[lang].intro,
    longIntro: [],
    why: [cityData.copy[lang].localNote, cityData.copy[lang].coverage],
    neighborhoods: [],
    steps: [],
    impact: [],
    testimonials: [],
    payments: [],
    faq: [],
  };

  // JSON-LD: NGO + LocalBusiness + FAQPage + Breadcrumbs
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["NGO", "LocalBusiness"],
        "@id": `https://elyusr.org/donate/${city}#org`,
        name: lang === "ar" ? `مؤسسة اليسر الخيرية — ${cityName}` : `Al-Yusr Charity Foundation — ${cityName}`,
        url: `https://elyusr.org/donate/${city}`,
        areaServed: {
          "@type": "City",
          name: cityName,
          containedInPlace: { "@type": "AdministrativeArea", name: lang === "ar" ? "محافظة الدقهلية" : "Dakahlia Governorate" },
        },
        geo: { "@type": "GeoCoordinates", latitude: cityData.lat, longitude: cityData.lon },
        address: {
          "@type": "PostalAddress",
          addressLocality: cityName,
          addressRegion: lang === "ar" ? "الدقهلية" : "Dakahlia",
          addressCountry: "EG",
        },
        sameAs: ["https://elyusr.org"],
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: lang === "ar" ? "الرئيسية" : "Home", item: "https://elyusr.org/" },
          { "@type": "ListItem", position: 2, name: lang === "ar" ? "تبرع" : "Donate", item: "https://elyusr.org/donate" },
          { "@type": "ListItem", position: 3, name: cityName, item: `https://elyusr.org/donate/${city}` },
        ],
      },
      ...(copy.faq.length
        ? [{
            "@type": "FAQPage",
            mainEntity: copy.faq.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }]
        : []),
    ],
  };

  return (
    <PageLayout>
      <SEOHelmet title={title} description={description} path={`/donate/${city}`} keywords={keywords} />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/95 via-primary to-primary/80 text-primary-foreground">
        <div className="absolute inset-0 opacity-10 [background:radial-gradient(circle_at_30%_20%,white_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="container relative z-10 mx-auto px-4 py-12 md:py-20">
          <div className="mb-6 flex justify-center text-primary-foreground">
            <Breadcrumbs
              items={[
                { name: lang === "ar" ? "الرئيسية" : "Home", href: "/" },
                { name: lang === "ar" ? "تبرع" : "Donate", href: "/donate" },
                { name: cityName },
              ]}
            />
          </div>
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold backdrop-blur">
              <MapPin className="h-3.5 w-3.5" />
              {lang === "ar" ? `${cityData.ar} · محافظة الدقهلية` : `${cityData.en} · Dakahlia Governorate`}
            </div>
            <h1 className="text-3xl font-black leading-tight md:text-5xl">
              {lang === "ar" ? `تبرع في ${cityName}` : `Donate in ${cityName}`}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed opacity-90 md:text-lg">{copy.intro}</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link
                to={`/donate?city=${city}`}
                className="inline-flex items-center gap-2 rounded-full bg-orange-grad px-7 py-3 text-sm font-black text-accent-foreground shadow-cta transition hover:scale-[1.02]"
              >
                <Heart className="h-4 w-4" />
                {lang === "ar" ? `تبرع الآن لأسر ${cityName}` : `Donate now to ${cityName} families`}
              </Link>
              <Link
                to="/cases"
                className="inline-flex items-center gap-2 rounded-full border-2 border-white/40 bg-white/10 px-7 py-3 text-sm font-black backdrop-blur transition hover:bg-white/20"
              >
                {lang === "ar" ? "تصفح الحالات" : "Browse cases"}
                <Arrow className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Quick stats */}
          <div className="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { icon: Users, n: cityData.families.toLocaleString(), label: lang === "ar" ? "أسرة مخدومة" : "Families served" },
              { icon: Truck, n: "100%", label: lang === "ar" ? "توصيل موثق" : "Verified delivery" },
              { icon: ShieldCheck, n: "90%", label: lang === "ar" ? "للمستفيد مباشرة" : "Direct to family" },
              { icon: Award, n: "12+", label: lang === "ar" ? "سنة خبرة محلية" : "Years of local work" },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl bg-white/10 p-4 text-center backdrop-blur">
                <s.icon className="mx-auto mb-1 h-5 w-5 opacity-80" />
                <div className="text-xl font-black md:text-2xl">{s.n}</div>
                <div className="text-[11px] opacity-80 md:text-xs">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why us */}
      <section className="bg-background py-12 md:py-16">
        <div className="container mx-auto max-w-4xl px-4">
          <h2 className="mb-2 text-center text-2xl font-black text-primary md:text-3xl">
            {lang === "ar" ? `لماذا تتبرع لـ ${cityName} عن طريق اليسر؟` : `Why donate to ${cityName} through Al-Yusr?`}
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-center text-sm text-muted-foreground">
            {lang === "ar"
              ? "كل برامجنا في الدقهلية موثقة بالصور والفيديو، ويتابعها المتبرعون الدائمون شهريًا."
              : "All our Dakahlia programs are documented with photos & video, audited monthly by recurring donors."}
          </p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {copy.why.map((w, i) => (
              <li key={i} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                <span className="text-sm font-semibold leading-relaxed text-foreground">{w}</span>
              </li>
            ))}
          </ul>

          {copy.longIntro.length > 0 && (
            <div className="mt-10 space-y-4 rounded-3xl border border-border bg-card/50 p-6 md:p-8">
              <h3 className="flex items-center gap-2 text-lg font-black text-primary md:text-xl">
                <Sparkles className="h-5 w-5 text-accent" />
                {lang === "ar" ? `قصة اليسر في ${cityName}` : `The Al-Yusr story in ${cityName}`}
              </h3>
              {copy.longIntro.map((p, i) => (
                <p key={i} className="text-sm leading-loose text-muted-foreground md:text-[15px]">{p}</p>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Impact numbers */}
      {copy.impact.length > 0 && (
        <section className="bg-gradient-to-b from-secondary/10 to-background py-12 md:py-16">
          <div className="container mx-auto max-w-5xl px-4">
            <h2 className="mb-8 text-center text-2xl font-black text-primary md:text-3xl">
              {lang === "ar" ? `أثرنا في ${cityName} بالأرقام` : `Our impact in ${cityName} by numbers`}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {copy.impact.map((s, i) => (
                <div key={i} className="rounded-2xl border border-border bg-card p-5 text-center shadow-soft">
                  <div className="text-3xl font-black text-accent md:text-4xl">{s.n}</div>
                  <div className="mt-1 text-xs font-bold text-muted-foreground md:text-sm">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Neighborhoods coverage */}
      {copy.neighborhoods.length > 0 && (
        <section className="bg-background py-12 md:py-16">
          <div className="container mx-auto max-w-5xl px-4">
            <h2 className="mb-2 text-center text-2xl font-black text-primary md:text-3xl">
              {lang === "ar" ? `أحياء وقرى ${cityName} التي نخدمها` : `${cityName} districts & villages we serve`}
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-center text-sm text-muted-foreground">
              {lang === "ar" ? "تغطية ميدانية يومية لكل حي وكفر داخل دائرة المنصورة." : "Daily field coverage of every district and kafr in greater Mansoura."}
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {copy.neighborhoods.map((n, i) => (
                <div key={i} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft">
                  <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <div className="text-sm font-extrabold text-primary">{n.name}</div>
                    <div className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{n.note}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How it works */}
      {copy.steps.length > 0 && (
        <section className="bg-secondary/10 py-12 md:py-16">
          <div className="container mx-auto max-w-5xl px-4">
            <h2 className="mb-8 text-center text-2xl font-black text-primary md:text-3xl">
              {lang === "ar" ? `كيف يصل تبرعك في ${cityName}؟` : `How your donation reaches ${cityName}`}
            </h2>
            <ol className="grid gap-4 md:grid-cols-5">
              {copy.steps.map((s, i) => (
                <li key={i} className="relative rounded-2xl border border-border bg-card p-5 shadow-soft">
                  <div className="mb-2 grid h-8 w-8 place-items-center rounded-full bg-accent text-sm font-black text-accent-foreground">{i + 1}</div>
                  <div className="text-sm font-extrabold text-primary">{s.t}</div>
                  <div className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.d}</div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {copy.testimonials.length > 0 && (
        <section className="bg-background py-12 md:py-16">
          <div className="container mx-auto max-w-5xl px-4">
            <h2 className="mb-8 text-center text-2xl font-black text-primary md:text-3xl">
              {lang === "ar" ? `آراء متبرعين ومستفيدين من ${cityName}` : `Voices from donors & families in ${cityName}`}
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              {copy.testimonials.map((t, i) => (
                <figure key={i} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
                  <Quote className="h-6 w-6 text-accent" />
                  <blockquote className="mt-2 text-sm leading-relaxed text-foreground">{t.quote}</blockquote>
                  <figcaption className="mt-3 border-t border-border pt-3">
                    <div className="text-sm font-extrabold text-primary">{t.author}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Payment methods */}
      {copy.payments.length > 0 && (
        <section className="bg-secondary/10 py-12 md:py-16">
          <div className="container mx-auto max-w-4xl px-4">
            <h2 className="mb-2 text-center text-2xl font-black text-primary md:text-3xl">
              {lang === "ar" ? `طرق التبرع المتاحة في ${cityName}` : `Donation methods available in ${cityName}`}
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-center text-sm text-muted-foreground">
              {lang === "ar" ? "اختر الطريقة الأنسب لك؛ جميعها آمنة ومعتمدة، وتُصدر إيصالًا فوريًا." : "Pick what suits you — all secure, certified and instantly receipted."}
            </p>
            <ul className="grid gap-3 sm:grid-cols-2">
              {copy.payments.map((p, i) => (
                <li key={i} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft">
                  <Banknote className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                  <span className="text-sm font-semibold leading-relaxed text-foreground">{p}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap justify-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 font-bold"><FileCheck2 className="h-3.5 w-3.5 text-accent" /> {lang === "ar" ? "إيصال إلكتروني فوري" : "Instant e-receipt"}</span>
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 font-bold"><ShieldCheck className="h-3.5 w-3.5 text-accent" /> {lang === "ar" ? "بوابة دفع مشفّرة PCI-DSS" : "PCI-DSS encrypted gateway"}</span>
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 font-bold"><HandHeart className="h-3.5 w-3.5 text-accent" /> {lang === "ar" ? "معفى من الضرائب" : "Tax-deductible"}</span>
            </div>
          </div>
        </section>
      )}

      {/* Programs available in this city */}
      <section className="bg-secondary/10 py-12 md:py-16">
        <div className="container mx-auto max-w-5xl px-4">
          <h2 className="mb-2 text-center text-2xl font-black text-primary md:text-3xl">
            {lang === "ar" ? `البرامج المتاحة في ${cityName}` : `Programs active in ${cityName}`}
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-center text-sm text-muted-foreground">
            {cityData.copy[lang].coverage}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cityData.programs.map((p) => {
              const meta = PROGRAM_LABELS[p];
              if (!meta) return null;
              return (
                <Link
                  key={p}
                  to={`/donate?city=${city}&program=${p}`}
                  className="group rounded-2xl border border-border bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-cta"
                >
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                    <Heart className="h-3 w-3" />
                    {lang === "ar" ? meta.ar : meta.en}
                  </div>
                  <h3 className="text-lg font-extrabold text-primary">
                    {lang === "ar" ? `${meta.ar} في ${cityName}` : `${meta.en} in ${cityName}`}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {lang === "ar"
                      ? `تبرعات موثقة لأسر ${cityName} المحتاجة. التسليم في اليوم نفسه.`
                      : `Verified donations to families in ${cityName}. Same-day delivery.`}
                  </p>
                  <div className="mt-3 inline-flex items-center gap-1 text-xs font-black text-accent">
                    {lang === "ar" ? "تبرع الآن" : "Donate now"} <Arrow className="h-3 w-3" />
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Internal links cluster — boosts site interlinking signal for local-intent SEO */}
          <div className="mt-10 rounded-2xl border border-border bg-card p-5 shadow-soft">
            <h3 className="mb-3 text-sm font-black text-primary">
              {lang === "ar" ? "روابط مفيدة" : "Related links"}
            </h3>
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              {[
                { to: "/cases", ar: `حالات محتاجة في ${cityName}`, en: `Needy cases in ${cityName}` },
                { to: `/qurbani/${city}`, ar: `أضحية ${cityName}`, en: `Qurbani in ${cityName}` },
                { to: "/programs/orphan", ar: `كفالة يتيم في الدقهلية`, en: "Orphan sponsorship in Dakahlia" },
                { to: "/zakat", ar: "حساب الزكاة 2026", en: "Zakat calculator 2026" },
                { to: "/about", ar: "عن مؤسسة اليسر", en: "About Al-Yusr" },
                { to: "/contact", ar: "اتصل بنا في المنصورة", en: "Contact us in Mansoura" },
              ].map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className="rounded-full border border-border bg-secondary/20 px-3 py-1.5 text-primary transition hover:bg-secondary/40"
                >
                  {lang === "ar" ? l.ar : l.en}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      {copy.faq.length > 0 && (
        <section className="bg-background py-12 md:py-16">
          <div className="container mx-auto max-w-3xl px-4">
            <h2 className="mb-8 text-center text-2xl font-black text-primary md:text-3xl">
              {lang === "ar" ? `أسئلة شائعة عن التبرع في ${cityName}` : `FAQ — Donating in ${cityName}`}
            </h2>
            <div className="space-y-3">
              {copy.faq.map((f, i) => (
                <details key={i} className="group rounded-2xl border border-border bg-card p-4 shadow-soft transition hover:shadow-cta">
                  <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-extrabold text-primary marker:hidden md:text-base">
                    <span>{f.q}</span>
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-secondary/30 transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section className="bg-gradient-to-br from-accent via-accent to-orange-500 py-12 text-accent-foreground md:py-16">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-2xl font-black md:text-4xl">
            {lang === "ar" ? `أسرة في ${cityName} تنتظر تبرعك` : `A family in ${cityName} is waiting for your donation`}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm opacity-90 md:text-base">
            {lang === "ar"
              ? "تبرعك الليلة يصل صباح الغد، مع توثيق كامل بالصور والفيديو."
              : "Your donation tonight is delivered tomorrow morning. Full photo/video documentation."}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to={`/donate?city=${city}`}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-black text-primary-foreground shadow-cta transition hover:scale-[1.02]"
            >
              <Heart className="h-4 w-4" />
              {lang === "ar" ? "تبرع الآن" : "Donate now"}
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-full border-2 border-primary/50 bg-white/15 px-7 py-3 text-sm font-black text-primary backdrop-blur transition hover:bg-white/30"
            >
              <Phone className="h-4 w-4" />
              {lang === "ar" ? "اتصل بنا" : "Contact us"}
            </Link>
          </div>
          <p className="mt-4 inline-flex items-center gap-1.5 text-xs opacity-75">
            <Clock className="h-3 w-3" />
            {lang === "ar" ? "خدمة عملاء 24/7 في المنصورة" : "24/7 support in Mansoura"}
          </p>
        </div>
      </section>
    </PageLayout>
  );
};

export default DonateCity;
