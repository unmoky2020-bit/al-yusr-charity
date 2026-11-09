import { ProgramLanding, type ProgramLandingConfig } from "./ProgramLanding";
import { BrideTrousseau } from "@/components/sections/BrideTrousseau";
import { HADITH } from "@/components/campaigns/HadithBlock";
import bridePhoto from "@/assets/yusr-bride.png";

/** /bride — «جواز عروسة»: the program's own landing page (program `bride` in the dashboard). */
const CONFIG: ProgramLandingConfig = {
  slug: "bride",
  path: "/bride",
  fallbackImage: bridePhoto,
  heroAlt: "عروسة يتيمة في يوم فرحها — برنامج جواز عروسة من مؤسسة اليسر",
  badge: { ar: "تيسير زواج اليتيمات", en: "Helping orphan brides marry" },
  title: { ar: "جواز عروسة", en: "A Bride's Trousseau" },
  subtitle: { ar: "هو جهاز عروسة… بس في الحقيقة جهاز حسنات", en: "A bride's trousseau — and a store of good deeds" },
  metaDesc: {
    ar: "ساهم في تجهيز عروسة يتيمة مع مؤسسة اليسر الخيرية: أجهزة وأثاث لبيتها الجديد بعد بحث ميداني، وتسليم موثّق بالصور. سهمك يبدأ من أي مبلغ.",
    en: "Help furnish an orphan bride's new home with Al-Yusr: appliances and furniture after a field visit, with documented delivery.",
  },
  seoTitle: { ar: "جواز عروسة | تجهيز العرائس اليتيمات — مؤسسة اليسر الخيرية", en: "Bride's trousseau | Helping orphan brides — Al-Yusr" },
  hadith: HADITH.bride,
  whyTitle: { ar: "ليه جواز عروسة؟", en: "Why a bride's trousseau?" },
  whyFallback: {
    ar: [
      "في بيوت كتير، فرحة البنت بتتأجل علشان الجهاز. تجهيز عروسة يتيمة أو من أسرة محتاجة باب من أبواب الستر وإدخال السرور على بيت كامل.",
      "فريق اليسر بيزور الأسرة ويتأكد من الاحتياج، ويكتب الناقص بالظبط، وبعدين نشتري الأجهزة والأثاث ونسلّمها لبيت العروسة، وتوصلك صور التسليم.",
    ],
    en: [
      "In many homes a girl's wedding is postponed for lack of a trousseau. Furnishing an orphan bride's home covers a family and brings joy to a whole house.",
      "Our team visits the family, lists exactly what is missing, buys the furniture and appliances and delivers them, and you receive the handover photos.",
    ],
  },
  stepsTitle: { ar: "تبرعك بيوصل للعروسة إزاي", en: "How your gift reaches the bride" },
  related: [
    { href: "/orphans", ar: "كفالة يتيم", en: "Orphan sponsorship" },
    { href: "/setr", ar: "حملة ستر", en: "Setr campaign" },
    { href: "/arboun", ar: "عربون خير", en: "Arboun Kheir" },
    { href: "/programs", ar: "كل برامج اليسر", en: "All programs" },
  ],
  bottomCta: { ar: "شارك في جهاز عروسة وافرح معاها", en: "Share in a bride's trousseau" },
  extra: <BrideTrousseau donateHref="/donate?program=bride" />,
};

const BrideLanding = () => <ProgramLanding config={CONFIG} />;

export default BrideLanding;
