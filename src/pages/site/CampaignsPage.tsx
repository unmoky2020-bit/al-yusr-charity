import { useState, memo } from "react";
import { Link } from "react-router-dom";
import {
  Heart,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  PhoneCall,
  HelpCircle,
  ChevronDown,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Helmet } from "react-helmet-async";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { BreadcrumbSchema } from "@/components/common/Schemas";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LangContext";
import { WhatsAppIcon } from "@/components/common/icons/WhatsAppIcon";

/** Motion wrapper for cards matching ServicesMap exact motion */
const AlternatingCard = memo(({
  children,
  index,
  className = "",
}: {
  children: React.ReactNode;
  index: number;
  className?: string;
}) => {
  const reduce = useReducedMotion();
  const isRight = index % 2 === 0;

  return (
    <motion.div
      initial={
        reduce
          ? false
          : {
              opacity: 0,
              x: isRight ? 45 : -45, // Mobile alternating entrance: right vs left
              y: 18,
              scale: 0.97,
            }
      }
      whileInView={{
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
      }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        duration: 0.55,
        delay: (index % 3) * 0.07,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
});

import posterWater from "@/assets/poster-water.png";
import yusrRamadanBox from "@/assets/yusr-ramadan-box.png";
import posterEdu from "@/assets/poster-education.png";
import markounPuzzle from "@/assets/markoun-puzzle.jpg";
import posterOdhy from "@/assets/poster-odhya.png";
import foodBoxImg from "@/assets/program-food-new.jpg";


/* ── Campaigns FAQ Data — 12 high-intent questions for AI Overview & PAA ── */
const CAMPAIGNS_FAQ = [
  {
    ar: {
      q: "إيه أفضل طريقة أتبرع لمؤسسة اليسر الخيرية في مصر؟",
      a: "تقدر تتبرع أونلاين مباشرة عبر بوابة الدفع الآمنة بالموقع بكارت فيزا أو ماستر، فودافون كاش، InstaPay، أو بالتحويل البنكي على CIB حساب 100043605733. المؤسسة مشهرة برقم 2665/2019 وكل تبرع موثق بصور وفيديو.",
    },
    en: {
      q: "What is the best way to donate to Al-Yusr Charity Foundation in Egypt?",
      a: "You can donate online via our secure payment gateway using Visa/Mastercard, Vodafone Cash, InstaPay, or CIB bank transfer to account 100043605733. Al-Yusr is registered under No. 2655/2019 and every donation is documented with photos and video.",
    },
  },
  {
    ar: {
      q: "إزاي أتأكد إن تبرعي وصل فعليًا للأسر المستحقة؟",
      a: "فرقنا الميدانية بتوثق كل تسليم بالصور والفيديو وكود تتبع خاص، وبنبعت لك رسالة نصية وتقرير كامل على واتساب أو إيميلك في خلال أسبوع من تاريخ التبرع.",
    },
    en: {
      q: "How can I verify my donation reached the deserving families?",
      a: "Our field teams document every delivery with photos, video, and a unique tracking code, sending you a full report via WhatsApp or email within one week of your donation date.",
    },
  },
  {
    ar: {
      q: "هل مؤسسة اليسر مرخصة رسميًا وتحت إشراف الحكومة المصرية؟",
      a: "نعم. اليسر مسجلة رسميًا بقرار وزارة التضامن الاجتماعي برقم 2665 لسنة 2019، وتخضع للإشراف الكامل لوزارة التضامن، وتُصدر تقارير مالية وميدانية دورية.",
    },
    en: {
      q: "Is Al-Yusr Charity Foundation officially licensed in Egypt?",
      a: "Yes. Al-Yusr is officially registered by the Ministry of Social Solidarity under No. 2655/2019, fully supervised by the ministry, and publishes regular financial and field reports.",
    },
  },
  {
    ar: {
      q: "إيه الحملات الخيرية اللي بتشتغل عليها مؤسسة اليسر دلوقتي؟",
      a: "دلوقتي بنشتغل على حملة ظِلّ (أسقف ومياه)، حملة مَركون (أثاث وأجهزة)، صندوق الغذاء الشهري، الأضاحي، حملة عروون خير (فريلانسرز)، وحملة أثر التعليمية. كل الحملات بتغطي مصر كلها.",
    },
    en: {
      q: "What charity campaigns is Al-Yusr Foundation currently running?",
      a: "Currently active: Dhill Campaign (roofing & water), Markoun Campaign (furniture & appliances), Monthly Food Box, Qurbani/Adha, Arboun Kheir (freelancers), and Athar Education Campaign — all covering all of Egypt.",
    },
  },
  {
    ar: {
      q: "هل تقدروا تستلموا التبرعات العينية (أثاث وملابس وأجهزة) من البيت؟",
      a: "أيوه. فريق مركون بسيارات المؤسسة بييجي لباب البيت في الدقهلية والمنصورة ومحافظات الدلتا بالتنسيق عبر 01097000137. التبرعات العينية بتتجدد وبتوصل للأسر المستحقة بكرامة.",
    },
    en: {
      q: "Do you collect in-kind donations (furniture, clothes, appliances) from home?",
      a: "Yes. Our Markoun team visits homes in Dakahlia, Mansoura, and Delta governorates using foundation vehicles. Schedule via 01097000137. Items are refurbished and delivered to deserving families with dignity.",
    },
  },
  {
    ar: {
      q: "إيه أقل مبلغ تبرع ممكن أقدمه لمؤسسة اليسر؟",
      a: "ما فيش حد أدنى — حتى 10 جنيه تصنع فرقاً في حياة أسرة مستحقة. إحنا بنجمع التبرعات الصغيرة مع بعض عشان ننفّذ مشاريع متكاملة بأعلى تأثير.",
    },
    en: {
      q: "What is the minimum donation amount for Al-Yusr Foundation?",
      a: "There is no minimum — even 10 EGP makes a difference. We pool small donations together to execute complete high-impact projects.",
    },
  },
  {
    ar: {
      q: "هل ينفع أتبرع لحملة معينة بالاسم مثلاً للمياه أو التعليم؟",
      a: "أكيد. من صفحة التبرع ممكن تختار برنامج معين زي سقيا الماء، التعليم، الغذاء، أو الأسر. تبرعك هيروح مباشرة للحملة اللي اخترتها، وهتتبعه خطوة بخطوة.",
    },
    en: {
      q: "Can I donate to a specific campaign like water or education?",
      a: "Absolutely. From the donation page you can choose a specific program like clean water, education, food, or families. Your donation goes directly to your chosen campaign with full step-by-step tracking.",
    },
  },
  {
    ar: {
      q: "إيه الفرق بين مؤسسة اليسر والجمعيات الخيرية التانية في مصر؟",
      a: "اليسر بتميّز نفسها بالتوثيق الميداني الكامل (صور وفيديو لكل تبرع)، الشفافية المالية، الاستهداف الدقيق للأسر الأكثر احتياجاً، وخدمة الاستلام من الباب لباب للتبرعات العينية.",
    },
    en: {
      q: "What makes Al-Yusr different from other Egyptian charities?",
      a: "Al-Yusr stands out through complete field documentation (photos and video for every donation), financial transparency, precise targeting of the most deserving families, and doorstep in-kind donation collection.",
    },
  },
  {
    ar: {
      q: "هل ينفع أتبرع بالدولار أو الريال السعودي لمؤسسة اليسر؟",
      a: "نعم. نستقبل تبرعات بالدولار الأمريكي، الريال السعودي، واليورو عبر التحويل البنكي الدولي. للتفاصيل تواصل معنا عبر info@elyasrcharity.com أو واتساب 01097000137.",
    },
    en: {
      q: "Can I donate in USD, SAR, or foreign currencies to Al-Yusr?",
      a: "Yes. We accept USD, SAR, and EUR via international bank transfer. Contact us at info@elyasrcharity.com or WhatsApp 01097000137 for details.",
    },
  },
  {
    ar: {
      q: "إيه الأثر الفعلي لتبرع 500 جنيه في مؤسسة اليسر؟",
      a: "500 جنيه ممكن تغطي: صندوق غذاء شهري كامل لأسرة (4 أشخاص)، أو تساهم في تركيب مروحة أو مصدر مياه نقية، أو جزء من كسوة شتاء. كل حملة بتوضح التأثير الحقيقي لكل مبلغ.",
    },
    en: {
      q: "What is the real impact of a 500 EGP donation to Al-Yusr?",
      a: "500 EGP can cover: a complete monthly food box for a family of four, contribute to a fan installation or clean water source, or part of a winter clothing package. Each campaign clearly shows the real impact per amount.",
    },
  },
  {
    ar: {
      q: "هل بتشتغلوا في مناطق خارج المنصورة والدقهلية؟",
      a: "أيوه. إحنا بنشتغل في أكتر من 34 محافظة في مصر كلها، مع تركيز خاص على الدقهلية والدلتا والصعيد. حملاتنا وصلت للقرى والمناطق الأكثر احتياجاً في مصر من الإسكندرية للأسوان.",
    },
    en: {
      q: "Do you operate outside Mansoura and Dakahlia?",
      a: "Yes. We operate across more than 34 governorates throughout Egypt, with special focus on Dakahlia, the Delta, and Upper Egypt. Our campaigns have reached the most underserved villages from Alexandria to Aswan.",
    },
  },
  {
    ar: {
      q: "كيف أتواصل مع مؤسسة اليسر للشراكات والتبرعات الكبيرة؟",
      a: "تواصل معنا على info@elyasrcharity.com، أو اتصل على 01097000137 (واتساب متاح). مقرنا في المنصورة بجوار وكالة خطاب، الدقهلية. الفريق هيرد عليك في خلال 24 ساعة.",
    },
    en: {
      q: "How can I contact Al-Yusr Foundation for partnerships or major donations?",
      a: "Reach us at info@elyasrcharity.com or call/WhatsApp 01097000137. Our office is in Mansoura, Dakahlia. Our team responds within 24 hours.",
    },
  },
];

/* ── CampaignsFAQ Component — identical design to homepage FAQ.tsx ── */
const CampaignsFAQ = ({ isRTL }: { isRTL: boolean }) => {
  const lang = isRTL ? "ar" : "en";
  const [open, setOpen] = useState<number | null>(0);
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? CAMPAIGNS_FAQ : CAMPAIGNS_FAQ.slice(0, 5);

  return (
    <section
      id="faq"
      className="mt-14 scroll-mt-24"
      aria-labelledby="campaigns-faq-heading"
      itemScope
      itemType="https://schema.org/FAQPage"
    >
      {/* Section Header */}
      <div className="mx-auto mb-8 max-w-2xl text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-secondary/20 text-primary shadow-sm">
          <HelpCircle className="h-6 w-6 text-secondary" />
        </div>
        <h2
          id="campaigns-faq-heading"
          className="mt-3 text-2xl font-black text-primary sm:text-3xl md:text-4xl"
        >
          {isRTL
            ? "أسئلة شائعة حول حملات وتبرعات اليسر"
            : "Campaign & Donation FAQs"}
        </h2>
        <p className="mt-3 text-sm text-muted-foreground sm:text-base">
          {isRTL
            ? "إجابات دقيقة على أكثر الأسئلة اللي بتوصلنا عن التبرع والحملات والتوثيق. محتاج أكثر؟ تواصل معانا."
            : "Precise answers to the most common questions about donating, campaigns, and documentation."}
        </p>
      </div>

      {/* Accordion Items */}
      <div className="space-y-3">
        {visible.map((f, i) => {
          const isOpen = open === i;
          return (
            <div
              key={i}
              className={`overflow-hidden rounded-2xl border-2 transition-all duration-200 ${
                isOpen
                  ? "border-secondary bg-secondary/5 shadow-sm"
                  : "border-border bg-card hover:border-secondary/40"
              }`}
              itemScope
              itemProp="mainEntity"
              itemType="https://schema.org/Question"
            >
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-3 p-4 text-start font-extrabold text-primary md:p-5"
                aria-expanded={isOpen}
                aria-controls={`faq-answer-${i}`}
              >
                <span
                  className="text-sm md:text-base leading-snug"
                  itemProp="name"
                >
                  {f[lang].q}
                </span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-secondary transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {isOpen && (
                <div
                  id={`faq-answer-${i}`}
                  className="px-4 pb-5 text-sm leading-relaxed text-muted-foreground md:px-5 md:text-base"
                  itemScope
                  itemProp="acceptedAnswer"
                  itemType="https://schema.org/Answer"
                >
                  <span itemProp="text">{f[lang].a}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Show More / Show Less */}
      {!showAll && CAMPAIGNS_FAQ.length > 5 && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => setShowAll(true)}
            className="inline-flex items-center gap-2 rounded-full bg-secondary px-6 py-2.5 text-sm font-black text-white shadow-cta transition hover:bg-secondary/90 hover:-translate-y-0.5"
          >
            <ChevronDown className="h-4 w-4" />
            {isRTL ? "عرض المزيد من الأسئلة" : "Show more questions"}
          </button>
        </div>
      )}
      {showAll && CAMPAIGNS_FAQ.length > 5 && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => { setShowAll(false); setOpen(null); }}
            className="inline-flex items-center gap-2 rounded-full border-2 border-secondary bg-transparent px-6 py-2.5 text-sm font-black text-secondary transition hover:bg-secondary/5"
          >
            <ChevronDown className="h-4 w-4 rotate-180" />
            {isRTL ? "عرض أقل" : "Show less"}
          </button>
        </div>
      )}
    </section>
  );
};


export const CAMPAIGNS_DATA = [
  {
    id: "arboun",
    slug: "arboun",
    path: "/arboun",
    titleAr: "مبادرة عربون خير",
    titleEn: "Arboun Khair — Freelancers",
    subtitleAr: "«اتصدق النهاردة.. وخليه عربون لرزق بكرة!»",
    subtitleEn: "'Donate today.. make it a pledge for tomorrow's blessing!'",
    descAr: "المبادرة الأولى للفريلانسرز والمستقلين وأصحاب البيزنس لاستقطاع نسبة مرنة من أرباح كل مشروع (1% أو 5%) كزكاة للمهنة وبركة للرزق لدعم تيسير الزواج، الأيتام، والصدقات الجارية مع شارة بورتفوليو رقمية.",
    descEn: "Egypt's #1 initiative for remote professionals & freelancers to dedicate project earnings into verified impact (orphans, brides, clean water) earning digital portfolio badges.",
    badgeAr: "مبادرة الفريلانسرز والمستقلين 🚀",
    badgeEn: "For Remote Professionals 🚀",
    image: posterEdu,
    category: "ongoing",
    featured: true,
    priceFromAr: "سهم يبدأ من 150 ج",
    priceFromEn: "From 150 EGP",
    pillars: [
      { ar: "تفريج ضغط وقلق الشغل وجلب البركة للرزق", en: "Relieves client stress and work fatigue" },
      { ar: "شارة «مستقل داعم» رقمية لإضافتها بالبورتفوليو", en: "Digital Impact Freelancer badge" },
      { ar: "توجيه التبرع للأيتام وتيسير الزواج والأسقف", en: "Directly funds brides, orphans, and water" },
    ],
  },
  {
    id: "athar",
    slug: "athar",
    path: "/athar",
    titleAr: "حملة أَثَر التعليمية",
    titleEn: "Athar Education Campaign",
    subtitleAr: "«شنطة وقلم النهاردة.. أثر يعيش ويغيّر بكرا»",
    subtitleEn: "'A bag and pen today.. an impact that transforms tomorrow'",
    descAr: "موسم العودة للمدارس: كفالة شنط وأدوات مدرسية متكاملة، زي مدرسي جديد، سداد مصروفات دراسية لمنع تسرب أطفال الأيتام والأسر المتعففة، وتأسيس دور القرآن وحضانات نموذجية.",
    descEn: "Back-to-School season: equipping underprivileged and orphan students with durable backpacks, supplies, uniforms, tuition coverage, and running model Quranic pre-schools.",
    badgeAr: "موسم العودة للمدارس 🎒",
    badgeEn: "Back to School 🎒",
    image: posterEdu,
    category: "education",
    featured: true,
    priceFromAr: "من 450 ج للحقيبة",
    priceFromEn: "From 450 EGP",
    pillars: [
      { ar: "حقيبة مدرسية وأدوات وزي متكامل", en: "Complete school bags and uniforms" },
      { ar: "سداد المصروفات الدراسية لمنع التسرب", en: "Tuition sponsorships for orphans" },
      { ar: "مبادرة تدوير الكتب المدرسية برسائل تشجيع", en: "Textbook reuse with encouragement notes" },
    ],
  },
  {
    id: "markoun",
    slug: "markoun",
    path: "/markoun",
    titleAr: "حملة مَرْكُون",
    titleEn: "Markoun In-Kind Reuse",
    subtitleAr: "«كنزك المركون.. يبني حياة لغيرك!»",
    subtitleEn: "'Your stored surplus.. builds a new life for someone else!'",
    descAr: "أول حملة مصرية تُحيي أسرة بالمركون في بيتك: إعادة تدوير وتأهيل الأثاث المنزلي، الأجهزة الكهربائية، الملابس، الصيدلية المستدامة، والكتب، مع خدمة استلام مجانية من باب البيت بسيارات المؤسسة.",
    descEn: "Egypt's premier in-kind reuse initiative: restoring surplus home furniture, working electronics, clothing, valid medications, and books with free doorstep pickup.",
    badgeAr: "استلام من باب بيتك مجاناً 🚚",
    badgeEn: "Free Doorstep Pickup 🚚",
    image: markounPuzzle,
    category: "sustainability",
    featured: true,
    priceFromAr: "تبرع عيني بمندوب (01097000137)",
    priceFromEn: "Doorstep Pickup (01097000137)",
    pillars: [
      { ar: "أثاث وأجهزة كهربائية مفحوصة ومجددة", en: "Refurbished furniture & appliances" },
      { ar: "صيدلية مستدامة للأدوية الفائضة مجاناً", en: "Valid-expiry community medicine" },
      { ar: "مندوب المؤسسة يصلك لباب بيتك (01097000137)", en: "Doorstep pickup: 01097000137" },
    ],
  },
  {
    id: "dhill",
    slug: "dhill",
    path: "/dhill",
    titleAr: "حملة ظِلّ",
    titleEn: "Dhill Summer & Water",
    subtitleAr: "«نُظِلّهم اليوم عسى أن يُظِلّنا الله يوم القيامة»",
    subtitleEn: "'Provide shade today, that Allah may shade us on the Day of Judgment'",
    descAr: "إغاثة موجات الصيف الحارة والحر الشديد: أسقف خشبية معزولة ضد الحرارة والأمطار، وصلات مياه نقية للمنازل، خطوط مياه لقرى كاملة، ومراوح تبريد بالدقهلية ومحافظات مصر.",
    descEn: "Protecting deserving families from severe summer heatwaves: insulated wooden roofs, clean household water taps, village water lines, and cooling fans.",
    badgeAr: "إغاثة موجات الحر وسقيا ماء ☀️",
    badgeEn: "Summer Heat & Clean Water ☀️",
    image: posterWater,
    category: "ongoing",
    featured: true,
    priceFromAr: "من 500 ج للسهم",
    priceFromEn: "From 500 EGP/share",
    pillars: [
      { ar: "أسقف منازل خشبية معزولة (10 سنوات)", en: "Insulated wooden roofs" },
      { ar: "وصلات مياه نقية شاملة الموتور والخزان", en: "Full home water taps with pump" },
      { ar: "مراوح سقف وحوائط للتهوية والتبريد", en: "Ventilation and cooling fans" },
    ],
  },
  {
    id: "ramadan",
    slug: "ramadan",
    path: "/ramadan",
    titleAr: "موسم الخير (رمضان)",
    titleEn: "Ramadan Season of Giving",
    subtitleAr: "«رمضانك في اليسر إحسانٌ لا ينقطع»",
    subtitleEn: "'Your generosity with Al-Yusr is non-stop goodness'",
    descAr: "كراتين رمضان الكبرى 25 كجم بالبروتين البلدي الطازج، مطبخ الوجبات الساخنة اليومية، ذبائح مزارع اليسر الوقفية، تيسير الزواج 'الفرحة فرحتين'، وكسوة العيد وزكاة الفطر.",
    descEn: "Comprehensive Ramadan giving: 25kg family boxes with fresh meat, daily hot iftar meals, endowment farm livestock, bride assistance, and timely Zakat disbursement.",
    badgeAr: "موسم العطاء والإفطار",
    badgeEn: "Ramadan Food & Zakat",
    image: yusrRamadanBox,
    category: "seasonal",
    featured: false,
    priceFromAr: "وجبة 95 ج / كرتونة 950 ج",
    priceFromEn: "95 EGP meal / 950 EGP box",
    pillars: [
      { ar: "كرتونة الخير 25 كجم غنية بالبروتين البلدي", en: "25kg food box with fresh meat" },
      { ar: "مطبخ اليسر: وجبات إفطار ساخنة يومياً", en: "Daily hot iftar meals for travelers" },
      { ar: "تجهيز عرائس يتيمات وكسوة العيد وزكاة الفطر", en: "Bride support & orphan Eid outfits" },
    ],
  },
  {
    id: "food-box",
    slug: "food-box",
    path: "/food-box",
    titleAr: "كرتونة الغذاء الشهرية",
    titleEn: "Monthly Food Box",
    subtitleAr: "«طعام يكفي أسر الأيتام والمتعففين طوال الشهر»",
    subtitleEn: "'Wholesome sustenance securing families all month long'",
    descAr: "سلال غذائية متكاملة تحتوي على أجود السلع التموينية والبروتين البلدي الطازج تصل شهرياً للأسر المتعففة في منازلها بكرامة وسرية تامة.",
    descEn: "Wholesome food crates containing pantry staples, poultry, and meat, delivered monthly to poverty-stricken families across Egypt.",
    badgeAr: "إطعام وسلال شهرية",
    badgeEn: "Monthly Food Aid",
    image: foodBoxImg,
    category: "ongoing",
    featured: false,
    priceFromAr: "من 850 ج للكرتونة",
    priceFromEn: "From 850 EGP",
    pillars: [
      { ar: "توفير السلع الأساسية (أرز، زيت، سكر، بقوليات)", en: "Essential dry staples & oil" },
      { ar: "لحوم ودواجن طازجة من مزارعنا الوقفية", en: "Fresh local poultry & meat" },
      { ar: "توصيل دوري منتظم لباب منزل المستفيد", en: "Regular doorstep monthly drop-off" },
    ],
  },
  {
    id: "qurbani",
    slug: "qurbani",
    path: "/qurbani",
    titleAr: "صكوك الأضاحي وضمان الجودة",
    titleEn: "Qurbani Meat Shares",
    subtitleAr: "«الوحيدين في مصر بنديك ضمان جودة الأضحية»",
    subtitleEn: "'100% Quality Guaranteed fresh local Qurbani meat'",
    descAr: "لحوم بلدي طازجة 100% من إنتاج مزارع اليسر الخيرية، مذبوحة شرعياً وتحت إشراف بيطري كامل وموزعة على الأسر الأشد احتياجاً مع توثيق لكل صك.",
    descEn: "Premium livestock reared in our own endowment pastures, slaughtered strictly to Sharia with veterinary supervision and full photo proof.",
    badgeAr: "أضاحي ومزارع وقفية",
    badgeEn: "Qurbani & Farms",
    image: posterOdhy,
    category: "seasonal",
    featured: false,
    priceFromAr: "من 1,400 ج للصك",
    priceFromEn: "From 1,400 EGP",
    pillars: [
      { ar: "لحم بلدي فاخر من مزارعنا بدون وسطاء", en: "Direct farm-reared local meat" },
      { ar: "ذبح شرعي ومعاينة دقيقة لكل رأس ماشية", en: "Strict Sharia compliance" },
      { ar: "إشعار وتوثيق فوري بوصول لحومك لمستحقيها", en: "Verified donor delivery reports" },
    ],
  },
];

export const CampaignsPage = () => {
  const { lang } = useLang();
  const isRTL = lang === "ar";
  const Arrow = isRTL ? ArrowLeft : ArrowRight;
  const [filter, setFilter] = useState<string>("all");
  const shouldReduceMotion = useReducedMotion();

  const categories = [
    { key: "all", labelAr: "كل الحملات والمبادرات", labelEn: "All Campaigns" },
    { key: "ongoing", labelAr: "صدقات جارية ومستمرة", labelEn: "Ongoing Charity" },
    { key: "seasonal", labelAr: "مواسم الخير والمناسبات", labelEn: "Seasonal Campaigns" },
    { key: "sustainability", labelAr: "استدامة وتبرع عيني", labelEn: "In-Kind & Reuse" },
    { key: "education", labelAr: "تعليم وبناء الإنسان", labelEn: "Education" },
  ];

  const filteredCampaigns = CAMPAIGNS_DATA.filter((c) => {
    if (filter === "all") return true;
    return c.category === filter;
  });

  return (
    <PageLayout>
      <SEOHelmet
        title={
          isRTL
            ? "اليسر — دليل حملات ومبادرات مؤسسة اليسر الخيرية | تبرعك يصنع الأثر"
            : "Al-Yusr Charity Campaigns & Initiatives Hub | Make Real Impact"
        }
        description={
          isRTL
            ? "مؤسسة اليسر الخيرية — دليل كافة حملات ومبادرات اليسر للتنمية: حملة ظل (سقيا ماء وأسقف معزولة)، حملة ستر (دفء الشتاء)، حملة مركون (إعادة تدوير الأثاث والأجهزة والأدوية)، مبادرة عربون خير للفريلانسرز والمستقلين، وحملة أثر التعليمية بالدقهلية ومصر. مشهرة برقم 2665 لسنة 2019."
            : "Al-Yusr Charity Foundation — Discover all campaigns: Dhill (water & roofing), Setr (winter relief), Markoun (furniture & electronics reuse), Arboun Khair (for freelancers), Athar (education) & Ramadan Season in Dakahlia & Egypt."
        }
        path="/campaigns"
        keywords={
          isRTL
            ? "اليسر, مؤسسة اليسر, جمعية اليسر, مؤسسة اليسر الخيرية, اليسر للتنمية, حملات اليسر, حملة ظل, حملة ستر, حملة مركون, مبادرة عربون خير, حملة أثر, تبرعات المنصورة, جمعية خيرية بالدقهلية, صدقة جارية, تيسير زواج"
            : "Al-Yusr, Al Yusr, Al-Yusr Charity, Elyusr charity, Egyptian NGO, Dakahlia charity, Mansoura donations, ongoing charity Egypt, water donation, in-kind donation Egypt"
        }
      />
      <BreadcrumbSchema
        items={[
          { name: isRTL ? "الرئيسية" : "Home", url: "https://elyusr.org/" },
          { name: isRTL ? "حملات ومبادرات اليسر" : "Campaigns", url: "https://elyusr.org/campaigns" },
        ]}
      />

      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "NGO",
            name: "مؤسسة اليسر الخيرية للتنمية",
            alternateName: ["اليسر", "مؤسسة اليسر", "جمعية اليسر", "Al-Yusr Charity", "Elyusr"],
            url: "https://elyusr.org/",
            logo: "https://elyusr.org/logo-512.png",
            telephone: "+201097000137",
            address: {
              "@type": "PostalAddress",
              streetAddress: "تقسيم خطاب، بجوار وكالة المنصورة",
              addressLocality: "المنصورة",
              addressRegion: "الدقهلية",
              addressCountry: "EG",
            },
            taxID: "2665/2019",
            areaServed: ["Egypt", "Dakahlia", "Mansoura", "Mit Ghamr", "Talkha", "Kafr El Sheikh"],
            hasOfferCatalog: {
              "@type": "OfferCatalog",
              name: "حملات ومبادرات اليسر الخيرية",
              itemListElement: CAMPAIGNS_DATA.map((c, i) => ({
                "@type": "Offer",
                itemOffered: {
                  "@type": "Service",
                  name: c.titleAr,
                  description: c.descAr,
                  url: `https://elyusr.org${c.path}`,
                },
                position: i + 1,
              })),
            },
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "ما هي حملات مؤسسة اليسر الخيرية في مصر والدقهلية؟",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "تشمل حملات مؤسسة اليسر: حملة ظِلّ لسقيا الماء وبناء الأسقف المعزولة، حملة سِتْر لدفء الشتاء، حملة مَرْكُون لإعادة تدوير الأثاث والأجهزة والأدوية الفائضة، مبادرة عربون خير للفريلانسرز، حملة أَثَر لدعم الطلاب والأيتام، وموسم رمضان وكرتونة الغذاء وصكوك الأضاحي.",
                },
              },
              {
                "@type": "Question",
                name: "كيف أطلب مندوب مؤسسة اليسر لاستلام التبرعات العينية من المنزل؟",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "يمكنك الاتصال مباشرة بالخط الساخن 01097000137 ليصلك مندوب مؤسسة اليسر بسيارات المؤسسة لفحص واستلام الأثاث، الأجهزة الكهربائية، والملابس وتجديدها لصالح الأسر الأكثر احتياجاً.",
                },
              },
              {
                "@type": "Question",
                name: "هل مؤسسة اليسر الخيرية مشهرة رسمياً؟",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "نعم، مؤسسة اليسر الخيرية للتنمية مشهرة برقم 2665 لسنة 2019 بوزارة التضامن الاجتماعي مع توثيق ميداني فوري وإيصالات رسمية لكافة التبرعات.",
                },
              },
            ],
          })}
        </script>
      </Helmet>

      {/* ── Compact, Clean & Consistent Hero Header (Matching Contact Hero) ────────────── */}
      <section className="pattern-hero-luxe hero-pattern-fade relative overflow-hidden text-primary-foreground">
        <div aria-hidden className="brand-leaf-tile pointer-events-none absolute inset-0 opacity-40" />

        <div className="container relative mx-auto max-w-4xl px-4 py-8 text-center md:py-12">
          {/* Breadcrumbs */}
          <div className="flex justify-center text-primary-foreground/75">
            <Breadcrumbs
              items={[
                { name: isRTL ? "الرئيسية" : "Home", href: "/" },
                { name: isRTL ? "حملات ومبادرات اليسر" : "Campaigns" },
              ]}
            />
          </div>

          {/* Main title */}
          <h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl md:text-5xl">
            {isRTL ? (
              <>حملات ومبادرات <span className="text-gradient-lime">اليسر</span></>
            ) : (
              <>Al-Yusr <span className="text-gradient-lime">Campaigns & Initiatives</span></>
            )}
          </h1>

          <p className="mx-auto mt-2.5 max-w-2xl text-xs leading-relaxed text-primary-foreground/85 sm:text-sm md:text-base">
            {isRTL
              ? "مبادرات نوعية مدروسة بعناية لتغطي كافة مسارات الخير: من الصدقات الجارية وسقيا الماء وتسقيف البيوت، لإعادة تدوير الأثاث والأجهزة، ودعم التعليم وتيسير الزواج."
              : "Carefully structured initiatives spanning continuous charity, roof insulation, clean water, in-kind reuse of appliances & furniture, and student education."}
          </p>

          {/* Row 1: The two CTA buttons matching Contact style */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/donate"
              className="inline-flex items-center gap-1.5 rounded-full bg-orange-grad px-6 py-2.5 text-xs font-black text-accent-foreground shadow-cta transition hover:opacity-90"
            >
              <Heart className="h-4 w-4" />
              {isRTL ? "تبرع الآن للحملات" : "Donate to campaigns"}
            </Link>

            <a
              href="https://wa.me/201097000137"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--whatsapp,142_70%_42%))] px-6 py-2.5 text-xs font-black text-white shadow-lg transition hover:brightness-105"
            >
              <WhatsAppIcon className="h-4 w-4" />
              {isRTL ? "استفسار ومندوب تبرعات" : "Inquiries & WhatsApp"}
            </a>
          </div>

          {/* Row 2: Badge in a centered row below the buttons matching Contact style */}
          <div className="mx-auto mt-3 flex items-center justify-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-primary-foreground/90 backdrop-blur shadow-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
              {isRTL ? "مشهرة برقم 2665 لسنة 2019 — توثيق ميداني فوري" : "Registered NGO #2665 (2019) • Verified Documentation"}
            </span>
          </div>
        </div>
      </section>

      {/* Main Campaign Directory with Generous Bottom Clearance for Footer Newsletter */}
      <section className="relative bg-background pt-12 pb-28 sm:pb-36 md:pt-16 md:pb-44">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          {/* Category Filter Pills */}
          <div className="no-scrollbar mb-10 flex flex-wrap items-center justify-center gap-2 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setFilter(cat.key)}
                className={`rounded-full px-4 py-2 text-xs font-extrabold transition-all sm:text-sm ${
                  filter === cat.key
                    ? "bg-primary text-primary-foreground shadow-cta ring-2 ring-primary/20 scale-105"
                    : "border border-border bg-card text-foreground/80 hover:bg-secondary/20 hover:text-primary"
                }`}
              >
                {isRTL ? cat.labelAr : cat.labelEn}
              </button>
            ))}
          </div>

          {/* Campaigns Grid — Using Exact AlternatingCard Motion from ServicesMap */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCampaigns.map((camp, idx) => (
              <AlternatingCard key={camp.id} index={idx} className="h-full">
                <article className="group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-primary/15 bg-card shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl ring-1 ring-border/60">
                  {/* Visual Header with Taller Height (h-72 sm:h-80 md:h-88) */}
                  <div className="relative h-72 w-full overflow-hidden bg-primary/25 sm:h-80 md:h-88">
                    <img
                      src={camp.image}
                      alt={isRTL ? camp.titleAr : camp.titleEn}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                    
                    {/* Badge */}
                    <span className="absolute start-3.5 top-3.5 inline-flex items-center gap-1 rounded-full bg-background/95 px-3 py-1 text-[11px] font-black text-primary ring-1 ring-primary/15 shadow-sm">
                      {isRTL ? camp.badgeAr : camp.badgeEn}
                    </span>

                    {/* Price Chip */}
                    <span className="absolute end-3.5 top-3.5 rounded-full bg-orange-grad px-3 py-1 text-[11px] font-black text-accent-foreground shadow-cta">
                      {isRTL ? camp.priceFromAr : camp.priceFromEn}
                    </span>

                    {/* Title over Image */}
                    <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                      <h2 className="text-xl font-black tracking-tight leading-tight sm:text-2xl">
                        {isRTL ? camp.titleAr : camp.titleEn}
                      </h2>
                      <p className="mt-1 text-[11.5px] font-bold text-secondary line-clamp-1">
                        {isRTL ? camp.subtitleAr : camp.subtitleEn}
                      </p>
                    </div>
                  </div>

                  {/* Content & Pillars */}
                  <div className="flex flex-1 flex-col justify-between p-5">
                    <p className="text-xs font-medium leading-relaxed text-muted-foreground sm:text-[13px]">
                      {isRTL ? camp.descAr : camp.descEn}
                    </p>

                    {/* Key Pillars */}
                    <div className="mt-4 space-y-1.5 border-t border-border/60 pt-3">
                      {camp.pillars.map((pil, pIdx) => (
                        <div key={pIdx} className="flex items-center gap-2 text-[11px] font-bold text-foreground/85">
                          <CheckCircle2 className="h-3.5 w-3.5 text-secondary shrink-0" />
                          <span className="truncate">{isRTL ? pil.ar : pil.en}</span>
                        </div>
                      ))}
                    </div>

                    {/* CTAs — 2 buttons side by side */}
                    <div className="mt-5 flex items-center justify-between gap-2 border-t border-border/60 pt-4">
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="h-10 flex-1 rounded-xl border-primary/20 text-xs font-extrabold text-primary hover:bg-secondary/20 hover:text-primary"
                      >
                        <Link to={camp.path}>
                          {isRTL ? "تفاصيل الحملة" : "Campaign details"}
                          <Arrow className="h-3.5 w-3.5 ms-1" />
                        </Link>
                      </Button>

                      <Button
                        asChild
                        size="sm"
                        className="h-10 flex-1 rounded-xl bg-orange-grad text-xs font-extrabold text-accent-foreground shadow-cta hover:opacity-95"
                      >
                        <Link to={camp.slug === "markoun" ? "/markoun" : `/donate?program=${camp.slug}`}>
                          <Heart className="h-3.5 w-3.5 me-1" />
                          {camp.slug === "markoun" ? (isRTL ? "طلب مندوب" : "Pickup") : (isRTL ? "تبرع الآن" : "Donate")}
                        </Link>
                      </Button>
                    </div>
                  </div>
                </article>
              </AlternatingCard>
            ))}
          </div>

          {/* Direct Doorstep In-Kind Donation Banner with 2 Buttons in 1 row on mobile */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mt-14 mb-8 sm:mb-12 overflow-hidden rounded-3xl border border-secondary/40 bg-gradient-to-r from-primary/95 via-primary to-[#06331c] p-6 text-primary-foreground shadow-card sm:p-8 md:p-10"
          >
            <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-6">
              <div className="md:col-span-7 space-y-2.5 text-center md:text-start">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/20 px-3 py-1 text-[11px] font-black text-secondary ring-1 ring-secondary/40">
                  <Sparkles className="h-3.5 w-3.5" />
                  {isRTL ? "خدمة استلام التبرعات العينية" : "Doorstep In-Kind Pickup"}
                </span>
                <h3 className="text-xl font-black leading-tight sm:text-2xl md:text-3xl">
                  {isRTL ? "عندك أثاث أو أجهزة أو ملابس مركونة؟" : "Have surplus furniture, appliances, or clothes?"}
                </h3>
                <p className="text-xs sm:text-sm font-medium leading-relaxed text-primary-foreground/90 max-w-xl">
                  {isRTL
                    ? "مندوب مؤسسة اليسر يصلك لباب البيت بسيارات المؤسسة لفحص واستلام التبرعات وتجديدها قبل تسليمها للأسر المستحقة."
                    : "Our official logistics vans collect items right at your doorstep, refurbishing them for validated deserving families."}
                </p>
              </div>

              <div className="md:col-span-5 flex flex-row items-center justify-center gap-2.5 sm:gap-3.5 w-full">
                <Button
                  asChild
                  size="lg"
                  className="flex-1 h-11 sm:h-12 px-3 sm:px-6 rounded-2xl bg-orange-grad font-black text-xs sm:text-sm text-accent-foreground shadow-cta hover:opacity-95 shrink-0"
                >
                  <a href="tel:01097000137" className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap">
                    <PhoneCall className="h-4 w-4 shrink-0" />
                    <span>01097000137</span>
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="flex-1 h-11 sm:h-12 px-3 sm:px-6 rounded-2xl border-secondary/50 bg-primary-foreground/10 font-black text-xs sm:text-sm text-primary-foreground hover:bg-secondary/20 whitespace-nowrap shrink-0"
                >
                  <Link to="/markoun" className="inline-flex items-center justify-center whitespace-nowrap">
                    {isRTL ? "تفاصيل حملة مركون" : "Markoun Campaign"}
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>

          {/* ═══════════════════════════════════════════════════════════
               FAQ — Accordion Design Matching Homepage + FAQPage Schema
               Targets: AI Overview, People Also Ask, Featured Snippets
          ═══════════════════════════════════════════════════════════ */}
          <CampaignsFAQ isRTL={isRTL} />

        </div>
      </section>
    </PageLayout>
  );
};

export default CampaignsPage;
