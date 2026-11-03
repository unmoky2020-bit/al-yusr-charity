import { useState, memo } from "react";
import { LinkedCasesSection } from "@/components/cases/LinkedCasesSection";
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
import { useQuery } from "@tanstack/react-query";
import { fetchFaqs, type FaqItem } from "@/data/faqsApi";
import { useDonationEntities } from "@/data/sources/donationEntities";
import { useSettled } from "@/hooks/useCampaignPage";
import { Skeleton } from "@/components/ui/skeleton";

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
import markounPuzzle from "@/assets/markoun-puzzle.webp";
import posterOdhy from "@/assets/poster-odhya.webp";
import foodBoxImg from "@/assets/program-food-new.jpg";


/* ── CampaignsFAQ — dynamic from backend (categorySlug: "campaigns") ── */
const CampaignsFAQ = ({ isRTL }: { isRTL: boolean }) => {
  const lang = isRTL ? "ar" : "en";
  const [open, setOpen] = useState<string | null>("0");
  const [showAll, setShowAll] = useState(false);

  const { data: faqData = [] } = useQuery<FaqItem[]>({
    queryKey: ["faqs-campaigns"],
    queryFn: () => fetchFaqs({ categorySlug: "campaigns" }),
    staleTime: 60_000,
  });

  const allFaqs = faqData.map((f) => ({
    ar: { q: f.question_ar, a: f.answer_ar },
    en: { q: f.question_en || f.question_ar, a: f.answer_en || f.answer_ar },
  }));

  const visible = showAll ? allFaqs : allFaqs.slice(0, 6);

  return (
    <section
      id="faq"
      className="mt-14 scroll-mt-24"
      aria-labelledby="campaigns-faq-heading"
      itemScope
      itemType="https://schema.org/FAQPage"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Section Header */}
      <div className="mx-auto mb-8 max-w-xl text-center">
        <div className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-secondary/20 shadow-sm">
          <HelpCircle className="h-5 w-5 text-secondary" />
        </div>
        <h2
          id="campaigns-faq-heading"
          className="mt-3 text-2xl font-black text-primary sm:text-3xl"
        >
          {isRTL ? "أسئلة شائعة عن الحملات" : "Campaign FAQs"}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {isRTL
            ? "إجابات واضحة عن التبرع، الحملات، والتوثيق."
            : "Clear answers about donating, campaigns, and documentation."}
        </p>
      </div>

      {/* Questions: one per row */}
      <div className="space-y-3">
        {visible.map((f, i) => {
          const key = String(i);
          const isOpen = open === key;
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
                onClick={() => setOpen(isOpen ? null : key)}
                className="flex w-full items-center justify-between gap-3 p-4 sm:p-5 text-start font-extrabold text-primary cursor-pointer"
                aria-expanded={isOpen}
                aria-controls={`faq-answer-${i}`}
              >
                <span className="text-sm sm:text-base leading-snug" itemProp="name">
                  {f[lang].q}
                </span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-secondary transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {isOpen && (
                <div
                  id={`faq-answer-${i}`}
                  className="px-4 pb-4 sm:px-5 sm:pb-5 text-sm leading-relaxed text-muted-foreground border-t border-border/40 pt-3"
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

      {/* Actions: 2 buttons side-by-side in one row on all screens */}
      <div className="mt-8 mx-auto max-w-md grid grid-cols-2 gap-2.5 sm:gap-3">
        {allFaqs.length > 6 ? (
          !showAll ? (
            <button
              onClick={() => setShowAll(true)}
              className="inline-flex w-full items-center justify-center gap-1.5 sm:gap-2 rounded-full bg-secondary px-3 py-2.5 sm:px-5 sm:py-3 text-xs sm:text-sm font-black text-emerald-950 shadow-cta transition hover:opacity-90 hover:-translate-y-0.5 cursor-pointer"
            >
              <ChevronDown className="h-4 w-4" />
              <span>{isRTL ? "عرض المزيد" : "Show more"}</span>
            </button>
          ) : (
            <button
              onClick={() => { setShowAll(false); setOpen(null); }}
              className="inline-flex w-full items-center justify-center gap-1.5 sm:gap-2 rounded-full border-2 border-secondary bg-transparent px-3 py-2.5 sm:px-5 sm:py-3 text-xs sm:text-sm font-black text-secondary transition hover:bg-secondary/5 cursor-pointer"
            >
              <ChevronDown className="h-4 w-4 rotate-180" />
              <span>{isRTL ? "عرض أقل" : "Show less"}</span>
            </button>
          )
        ) : <div />}

        <Link
          to="/faqs"
          className={`inline-flex w-full items-center justify-center gap-1.5 sm:gap-2 rounded-full border border-border bg-card px-3 py-2.5 sm:px-5 sm:py-3 text-xs sm:text-sm font-bold text-primary shadow-sm hover:border-primary/40 hover:bg-primary/5 transition ${
            allFaqs.length <= 6 ? "col-span-2 max-w-xs mx-auto" : ""
          }`}
        >
          <span>{isRTL ? "مركز الأسئلة" : "FAQ Center"}</span>
          {isRTL ? <ArrowLeft className="h-4 w-4 text-secondary" /> : <ArrowRight className="h-4 w-4 text-secondary" />}
        </Link>
      </div>
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
    id: "setr",
    slug: "setr",
    path: "/setr",
    titleAr: "حملة سِتْر",
    titleEn: "Setr Winter Campaign",
    subtitleAr: "«مَن سَتَرَ مسلماً سَتَرَه الله في الدنيا والآخرة»",
    subtitleEn: "'Whoever covers a Muslim, Allah will cover them in both worlds'",
    descAr: "دفء الشتاء لأهالينا المستحقين: أسقف بيتومين وخشب، أبواب وشبابيك، أسِرّة ومراتب، ألحفة فايبر، وكسوة شتوية للأطفال وكبار السن في الدقهلية وكل محافظات مصر، بالتكامل مع حملة مَرْكون.",
    descEn: "Winter warmth for families in need: bitumen and wooden roofs, doors and windows, beds and mattresses, fibre blankets and winter clothing across Dakahlia and Egypt, in step with the Markoun campaign.",
    badgeAr: "موسم الشتاء ❄️",
    badgeEn: "Winter season ❄️",
    image: posterWater,
    category: "seasonal",
    featured: true,
    priceFromAr: "سهم يبدأ من 500 ج",
    priceFromEn: "From 500 EGP",
    pillars: [
      { ar: "أسقف وأبواب وشبابيك تغلق منافذ البرد", en: "Roofs, doors and windows that keep the cold out" },
      { ar: "أسِرّة ومراتب ترفع الأطفال وكبار السن عن الأرض", en: "Beds and mattresses off the cold floor" },
      { ar: "ألحفة فايبر وكسوة شتوية كاملة", en: "Fibre blankets and full winter clothing" },
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
    titleAr: "الغذاء الشهري",
    titleEn: "Monthly Food",
    subtitleAr: "«أطعِموا الطعام — سُفرة تكفي أسرة شهراً كاملاً»",
    subtitleEn: "'Feed the hungry: a table that lasts a family a whole month'",
    descAr: "برنامج دائم يصل بالطعام إلى أسر الأيتام والمتعففين كل شهر: لحوم من ذبائح شهرية، وكرتونة ١٤ كيلو من المكونات الغذائية البلدي، ووجبات إطعام تُقدَّم إطعاماً أو كفارة صيام أو كفارة يمين.",
    descEn: "A permanent programme bringing food to orphan and needy families every month: meat from monthly slaughters, a 14 kg carton of local staples, and cooked meals for feeding, fasting expiation or oath expiation.",
    badgeAr: "برنامج دائم · لحوم وكرتونة ووجبات",
    badgeEn: "Year-round · meat, carton & meals",
    image: foodBoxImg,
    category: "ongoing",
    featured: false,
    priceFromAr: "وجبة 75 ج / كرتونة 700 ج",
    priceFromEn: "75 EGP meal / 700 EGP carton",
    pillars: [
      { ar: "لحوم من ذبائح شهرية، كيلو لكل أسرة", en: "Monthly slaughter meat, 1 kg per family" },
      { ar: "كرتونة ١٤ كيلو من المكونات الغذائية البلدي", en: "A 14 kg carton of local staples" },
      { ar: "وجبات إطعام وكفارة صيام وكفارة يمين", en: "Meals for feeding, fasting and oath expiations" },
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

  // The dashboard's campaign (same slug) gives the live photo and starting price; the copy here is the fallback.
  const { entities, isLoading: entitiesLoading } = useDonationEntities();
  // Posters wait for the dashboard (or a short timeout) so the built-in photo never shows first and then swaps.
  const entitiesReady = useSettled(!entitiesLoading);
  const live = (slug: string) => entities.find((e) => e.entityType === "campaign" && (e.slug === slug || e.id === slug));
  const filteredCampaigns = CAMPAIGNS_DATA.filter((c) => filter === "all" || c.category === filter).map((c) => {
    const e = live(c.slug);
    const img = e?.image && !e.image.includes("placeholder") ? e.image : c.image;
    return { ...c, image: img, livePrice: e?.priceFrom || 0 };
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
          {!entitiesReady ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label={isRTL ? "جاري التحميل" : "Loading"}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex aspect-[4/5] min-h-[430px] flex-col justify-end gap-3 rounded-[1.75rem] bg-muted p-6">
                  <Skeleton className="h-7 w-3/5 bg-foreground/10" />
                  <Skeleton className="h-4 w-full bg-foreground/10" />
                  <Skeleton className="h-4 w-4/5 bg-foreground/10" />
                  <div className="mt-2 flex gap-2">
                    <Skeleton className="h-11 flex-1 rounded-xl bg-foreground/10" />
                    <Skeleton className="h-11 flex-1 rounded-xl bg-foreground/10" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCampaigns.map((camp, idx) => (
              <AlternatingCard key={camp.id} index={idx} className="h-full">
                <article className="group relative isolate flex aspect-[4/5] h-full min-h-[430px] flex-col justify-end overflow-hidden rounded-[1.75rem] bg-primary shadow-card ring-1 ring-black/5 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl">
                  <img
                    src={camp.image}
                    alt={isRTL ? camp.titleAr : camp.titleEn}
                    loading={idx < 3 ? "eager" : "lazy"}
                    decoding="async"
                    className="absolute inset-0 -z-20 h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                  />
                  {/* reading veil: clear photo on top, deep green-black where the text sits */}
                  <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-[#03170d] via-[#03170d]/90 via-50% to-transparent to-85%" />

                  <div className="absolute inset-x-3.5 top-3.5 flex items-start justify-between gap-2">
                    <span className="max-w-[62%] truncate rounded-full bg-white/95 px-3 py-1 text-[11px] font-black text-primary shadow-sm">
                      {isRTL ? camp.badgeAr : camp.badgeEn}
                    </span>
                    <span className="shrink-0 rounded-full bg-orange-grad px-3 py-1 text-[11px] font-black text-accent-foreground shadow-cta">
                      {camp.livePrice ? (isRTL ? `يبدأ من ${camp.livePrice} ج` : `From ${camp.livePrice} EGP`) : isRTL ? camp.priceFromAr : camp.priceFromEn}
                    </span>
                  </div>

                  <div className="p-5 text-white sm:p-6">
                    <h2 className="text-2xl font-black leading-tight tracking-tight drop-shadow sm:text-[1.7rem]">
                      <Link to={camp.path} className="after:absolute after:inset-0 after:content-[''] focus:outline-none">
                        {isRTL ? camp.titleAr : camp.titleEn}
                      </Link>
                    </h2>
                    <p className="mt-1.5 line-clamp-1 text-[12.5px] font-bold text-secondary">{isRTL ? camp.subtitleAr : camp.subtitleEn}</p>
                    <p className="mt-2 line-clamp-2 text-[13px] leading-6 text-white/80">{isRTL ? camp.descAr : camp.descEn}</p>
                    <ul className="mt-3 flex flex-wrap gap-1.5">
                      {camp.pillars.slice(0, 2).map((pil, pIdx) => (
                        <li key={pIdx} className="inline-flex max-w-full items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white/90 ring-1 ring-white/15 backdrop-blur">
                          <CheckCircle2 className="h-3 w-3 shrink-0 text-secondary" />
                          <span className="truncate">{isRTL ? pil.ar : pil.en}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="relative z-10 mt-4 grid grid-cols-2 gap-2">
                      <Link to={camp.path}
                        className="inline-flex h-11 items-center justify-center gap-1 rounded-xl bg-white/12 text-xs font-black text-white ring-1 ring-white/25 backdrop-blur transition hover:bg-white/20">
                        {isRTL ? "تفاصيل الحملة" : "Details"} <Arrow className="h-3.5 w-3.5" />
                      </Link>
                      <Link to={camp.slug === "markoun" ? "/markoun" : `/donate?campaign=${camp.slug}`}
                        data-source="campaigns" data-label={`campaign-${camp.slug}`}
                        className="inline-flex h-11 items-center justify-center gap-1 rounded-xl bg-orange-grad text-xs font-black text-accent-foreground shadow-cta transition hover:opacity-95">
                        <Heart className="h-3.5 w-3.5" />
                        {camp.slug === "markoun" ? (isRTL ? "طلب مندوب" : "Pickup") : (isRTL ? "تبرع الآن" : "Donate")}
                      </Link>
                    </div>
                  </div>
                </article>
              </AlternatingCard>
            ))}
          </div>
          )}

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
      {/* Cases that belong to our campaigns (live from the backend) */}
      <LinkedCasesSection filter={{ linkedTo: "campaign" }} showOwner variant="carousel" filterByOwner limit={30} isRTL={isRTL} className="bg-muted/30"
        title={isRTL ? "حالات بتتجمع لها التبرعات في حملاتنا" : "Cases our campaigns are funding"}
        subtitle={isRTL ? "اختار حالة بعينها وتابع تحديثاتها بالصور لحد ما تكتمل." : "Pick a specific case and follow its photo updates until it is complete."} />
    </PageLayout>
  );
};

export default CampaignsPage;
