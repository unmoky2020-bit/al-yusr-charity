import { ProgramLanding, type ProgramLandingConfig } from "./ProgramLanding";
import { HADITH } from "@/components/campaigns/HadithBlock";
import orphansPhoto from "@/assets/program-orphans.jpg";

/** /orphans — «كفالة يتيم»: the program's own landing page (program `orphans` in the dashboard). */
const CONFIG: ProgramLandingConfig = {
  slug: "orphans",
  path: "/orphans",
  fallbackImage: orphansPhoto,
  heroAlt: "كفالة يتيم مع مؤسسة اليسر الخيرية",
  badge: { ar: "كفالة يتيم شهرية", en: "Monthly orphan sponsorship" },
  title: { ar: "كفالة يتيم", en: "Sponsor an Orphan" },
  subtitle: { ar: "رفيق النبي ﷺ في الجنة — كفالة شهرية بتغيّر حياة طفل", en: "A monthly sponsorship that changes a child's life" },
  metaDesc: {
    ar: "اكفل يتيمًا مع مؤسسة اليسر الخيرية: كفالة شهرية بعد بحث ميداني تغطي احتياجات الطفل الأساسية، مع متابعة دورية وتقرير يطمئنك عليه.",
    en: "Sponsor an orphan with Al-Yusr: a monthly sponsorship after a field visit, covering the child's basic needs, with regular follow-up.",
  },
  seoTitle: { ar: "كفالة يتيم شهرية | اكفل يتيمًا مع مؤسسة اليسر الخيرية", en: "Monthly orphan sponsorship | Al-Yusr Charity" },
  hadith: HADITH.orphans,
  whyTitle: { ar: "ليه تكفل يتيم؟", en: "Why sponsor an orphan?" },
  whyFallback: {
    ar: [
      "اليتيم محتاج اللي يسنده في أكله ولبسه وتعليمه وعلاجه. الكفالة الشهرية بتدّي الأسرة أمان ثابت بدل المساعدة المتقطعة.",
      "فريق اليسر بيزور الأسرة ويتحقق من حال الطفل، وبيتابعه بانتظام، وبيطمّنك عليه برسائل وتقارير دورية.",
    ],
    en: [
      "An orphan needs steady support for food, clothing, schooling and health. A monthly sponsorship gives the family security instead of occasional help.",
      "Our team visits the family, verifies the child's situation, follows up regularly and keeps you informed.",
    ],
  },
  stepsTitle: { ar: "الكفالة بتوصل إزاي", en: "How the sponsorship works" },
  related: [
    { href: "/bride", ar: "جواز عروسة", en: "A bride's trousseau" },
    { href: "/athar", ar: "حملة أثر (التعليم)", en: "Athar education campaign" },
    { href: "/food-box", ar: "الغذاء الشهري", en: "Monthly food" },
    { href: "/programs", ar: "كل برامج اليسر", en: "All programs" },
  ],
  bottomCta: { ar: "اكفل يتيم وكن رفيق النبي ﷺ في الجنة", en: "Sponsor an orphan today" },
};

const OrphansLanding = () => <ProgramLanding config={CONFIG} />;

export default OrphansLanding;
