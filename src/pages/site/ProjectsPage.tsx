import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowLeft,
  Building2,
  Droplets,
  Home,
  Truck,
  Heart,
  Landmark,
  Leaf,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Camera,
  Award,
  Sparkles,
  PhoneCall,
  Compass,
  FileCheck2,
  Target,
} from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { SiteSchemas, BreadcrumbSchema } from "@/components/common/Schemas";
import { useLang } from "@/i18n/LangContext";
import { DONATION_ENTITIES } from "@/data/donationEntities";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

// ── Images ──
import waqfImg from "@/assets/farm-hero.jpg";
import shelterImg from "@/assets/hero-sad.jpg";
import waterImg from "@/assets/program-water-new.jpg";
import brideImg from "@/assets/poster-bride.png";
import takrimImg from "@/assets/takrim-van.jpg";
import mosquesImg from "@/assets/yusr-hospital.jpg";
import familyImg from "@/assets/family-hope.jpg";

interface ProjectItem {
  id: string;
  icon: typeof Landmark;
  ar: string;
  en: string;
  tagAr: string;
  tagEn: string;
  descAr: string;
  descEn: string;
  img: string;
  bgGradient: string;
  accentColor: string;
  priceFrom: number;
  featured?: boolean;
  landingUrl?: string;
}

const PROJECTS: ProjectItem[] = [
  {
    id: "mosques",
    icon: Landmark,
    ar: "عمارة وبناء بيوت الله",
    en: "Mosque Building & Renovation",
    tagAr: "صدقة جارية في كل صلاة",
    tagEn: "Charity with every prayer",
    descAr: "ساهم في بناء أو ترميم مساجد القرى — من فرش السجاد حتى رفع المئذنة. كل سهم تبني به بيتاً في الجنة ويُكتب لك أجر كل من ركع وسجد فيه.",
    descEn: "Build or restore village mosques. Every share builds your home in Jannah and earns rewards for every prayer performed.",
    img: mosquesImg,
    bgGradient: "from-indigo-950 via-slate-950/85 to-transparent",
    accentColor: "#6366f1",
    priceFrom: 250,
    featured: true,
  },
  {
    id: "waqf",
    icon: Leaf,
    ar: "المزرعة الوقفية — وقف إنتاجي",
    en: "Waqf Farm — Productive Endowment",
    tagAr: "صدقة جارية لا تنقطع",
    tagEn: "Perpetual flowing charity",
    descAr: "أرض وقفية تُنتج وتُوزع ثمارها على الفقراء والأيتام سنوياً، وتدر عائداً مستداماً للأسر المتعففة.",
    descEn: "Endowment land producing fruits for the needy and orphans, yielding sustainable returns.",
    img: waqfImg,
    bgGradient: "from-emerald-950 via-slate-950/85 to-transparent",
    accentColor: "#10b981",
    priceFrom: 500,
    landingUrl: "/farm",
  },
  {
    id: "shelter",
    icon: Home,
    ar: "ستر — تسقيف وترميم المنازل",
    en: "Sitr — Roofing & Home Repair",
    tagAr: "لأن المأوى الكريم حق",
    tagEn: "Dignified shelter is a right",
    descAr: "تسقيف المنازل المتهالكة لحماية الأسر وأطفالهم من برد الشتاء ومياه الأمطار وإعادة كرامتهم.",
    descEn: "Roofing vulnerable rural homes to protect families from winter cold and rain.",
    img: shelterImg,
    bgGradient: "from-amber-950 via-slate-950/85 to-transparent",
    accentColor: "#f59e0b",
    priceFrom: 500,
    landingUrl: "/setr",
  },
  {
    id: "water",
    icon: Droplets,
    ar: "سقيا الماء — وصلة مياه نظيفة",
    en: "Clean Water Connections",
    tagAr: "أفضل الصدقة سقي الماء",
    tagEn: "The best charity is giving water",
    descAr: "إيصال مياه شرب نقية وصالحة لبيوت الأسر المحرومة بالقرى بعدادات رسمية وفلاتر معتمدة.",
    descEn: "Connecting clean running tap water to underprivileged rural households.",
    img: waterImg,
    bgGradient: "from-sky-950 via-slate-950/85 to-transparent",
    accentColor: "#0284c7",
    priceFrom: 300,
  },
  {
    id: "bride",
    icon: Heart,
    ar: "تيسير زواج — جهاز عروسة يتيمة",
    en: "Bride's Trousseau (Marriage Aid)",
    tagAr: "ستر وتكريم الفتيات",
    tagEn: "Dignity for orphan brides",
    descAr: "توفير الأجهزة الكهربائية والمفروشات الأساسية لإتمام زواج الفتيات اليتيمات وبناء أسرة كريمة.",
    descEn: "Providing essential home appliances and furnishings to support orphan brides.",
    img: brideImg,
    bgGradient: "from-pink-950 via-slate-950/85 to-transparent",
    accentColor: "#ec4899",
    priceFrom: 250,
  },
  {
    id: "takrim",
    icon: Truck,
    ar: "سيارات تكريم الإنسان",
    en: "Takrim Mortuary Vans",
    tagAr: "تكريم الإنسان في آخر رحلاته",
    tagEn: "Honouring the departed",
    descAr: "أسطول سيارات مجهز لنقل الموتى بكرامة وإنسانية مجاناً لوجه الله للأسر غير القادرة في أنحاء مصر.",
    descEn: "Free dignified mortuary transport service honoring the departed for underprivileged families.",
    img: takrimImg,
    bgGradient: "from-slate-950 via-slate-950/85 to-transparent",
    accentColor: "#64748b",
    priceFrom: 100,
  },
];

/* ═══════════════════════════════════════════════════════════════════ */

const ProjectsPage = () => {
  const { lang } = useLang();
  const isAR = lang === "ar";
  const Arrow = isAR ? ArrowLeft : ArrowRight;

  const projectEntities = DONATION_ENTITIES.filter((e) => e.entityType === "project");

  const waMsg = encodeURIComponent(
    isAR
      ? "السلام عليكم، أرغب في الاستفسار عن كفالة ومشاريع مؤسسة اليسر التنموية."
      : "Hello, I'd like to learn about Al-Yusr development projects."
  );

  const waSponsorMsg = encodeURIComponent(
    isAR
      ? "السلام عليكم، أرغب في الاستفسار عن كفالة ورعاية مشروع كامل (مسجد / مياه / أسقف) باسم العائلة."
      : "Hello, I am interested in fully sponsoring a major project."
  );

  return (
    <PageLayout>
      <SEOHelmet
        title={
          isAR
            ? "مشاريع اليسر التنموية | بناء مساجد، وقف إنتاجي، مياه، ستر، تيسير زواج"
            : "Al-Yusr Development Projects | Mosques, Waqf, Water, Shelter, Marriage Aid"
        }
        description={
          isAR
            ? "مشاريع إنشائية وتنموية لمؤسسة اليسر: بناء المساجد، المزرعة الوقفية، سقيا الماء، تسقيف المنازل، تيسير زواج اليتيمات، سيارات تكريم الإنسان."
            : "Al-Yusr development projects: mosque construction, Waqf farm, clean water, home roofing, marriage aid, and mortuary vans."
        }
        path="/projects"
      />
      <SiteSchemas />
      <BreadcrumbSchema
        items={[
          { name: isAR ? "الرئيسية" : "Home", url: "https://elyusr.org/" },
          { name: isAR ? "مشاريعنا" : "Our Projects", url: "https://elyusr.org/projects" },
        ]}
      />

      {/* ══════════ HERO (Wide container & clear visible background image) ══════════ */}
      <section className="relative overflow-hidden bg-primary min-h-[50vh] sm:min-h-[55vh] flex items-center">
        {/* Background Image with increased visibility as requested */}
        <div className="absolute inset-0">
          <img
            src={familyImg}
            alt=""
            aria-hidden
            className="h-full w-full object-cover opacity-45 transition-opacity duration-700"
          />
          {/* Subtle balanced gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/75 via-primary/65 to-primary/95" />
          <div className="absolute -top-24 -start-24 h-96 w-96 rounded-full bg-secondary/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -end-24 h-96 w-96 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />
        </div>

        <div className="relative z-10 container mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10 py-16 sm:py-24 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-secondary/40 bg-secondary/20 px-4 py-1.5 text-xs font-black text-secondary mb-5 shadow-xs backdrop-blur-xs">
            <Building2 className="h-4 w-4" />
            {isAR ? "مشاريع تنموية وإنشائية مستدامة" : "Sustainable Development & Construction"}
          </span>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white leading-tight tracking-tight drop-shadow-sm">
            {isAR ? "مشاريعنا التنموية المستدامة" : "Our Sustainable Projects"}
          </h1>

          <p className="mt-4 sm:mt-5 text-sm sm:text-base md:text-lg text-white/90 max-w-3xl mx-auto leading-relaxed drop-shadow-xs">
            {isAR
              ? "مشاريع ذات أثر يمتد لعقود — بناء مساجد، مزارع وقفية، مياه شرب نظيفة، تسقيف منازل وتيسير زواج. أصل وقفي مستمر وصدقة جارية لا تنقطع."
              : "Enduring impact across generations — mosques, endowment farms, clean water, roofing, marriage aid. Perpetual charity with lasting social return."}
          </p>

          <div className="mt-8 flex flex-wrap gap-3.5 justify-center items-center">
            <Link
              to="/donate?type=project"
              className="inline-flex items-center gap-2.5 rounded-2xl bg-secondary px-7 py-3.5 text-sm sm:text-base font-black text-slate-950 shadow-xl shadow-secondary/25 transition-all hover:bg-secondary/90 hover:scale-[1.02] active:scale-[0.98]"
            >
              {isAR ? "تبرع لمشروع بالأسهم" : "Donate to a Project"}
              <Arrow className="h-4 w-4" />
            </Link>
            <a
              href={`https://wa.me/201097000137?text=${waMsg}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/25 bg-black/20 backdrop-blur-md px-6 py-3.5 text-sm sm:text-base font-bold text-white transition hover:bg-black/30 hover:border-white/40"
            >
              <PhoneCall className="h-4 w-4 text-secondary" />
              {isAR ? "استفسار هاتفي / واتساب" : "WhatsApp Inquiry"}
            </a>
          </div>
        </div>
      </section>

      {/* ══════════ Stats Strip (Expanded max-w-[1440px]) ══════════ */}
      <section className="bg-card border-b border-border/70 shadow-xs">
        <div className="container mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10 py-4 sm:py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 text-center">
            {[
              { num: `${PROJECTS.length}`, labelAr: "مشاريع تنموية كبرى", labelEn: "Active Mega Projects" },
              { num: "٢٢+", labelAr: "سهم مالي متاح", labelEn: "Available Shares" },
              { num: "١٢،٥٠٠+", labelAr: "مستفيد مباشر بالقرى", labelEn: "Direct Rural Beneficiaries" },
              { num: "١٠٠٪", labelAr: "توثيق ميداني معتمد", labelEn: "Documented Impact" },
            ].map((s, idx) => {
              // Perfect '+' cross on mobile (2x2) and vertical dividers on desktop (1x4)
              const borderCls =
                idx === 0
                  ? "border-b border-e border-border/60 md:border-b-0 md:border-e"
                  : idx === 1
                  ? "border-b border-border/60 md:border-b-0 md:border-e"
                  : idx === 2
                  ? "border-e border-border/60 md:border-e"
                  : "md:border-none";

              return (
                <div key={idx} className={`px-3 py-3.5 sm:py-2.5 flex flex-col justify-center items-center ${borderCls}`}>
                  <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-secondary tracking-tight">
                    {s.num}
                  </p>
                  <p className="text-xs font-bold text-muted-foreground mt-1">
                    {isAR ? s.labelAr : s.labelEn}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════ Projects Layout: Featured Large Card + Clean Full-Image Grid ══════════ */}
      <section className="py-12 sm:py-20 bg-background">
        <div className="container mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 sm:mb-12 text-center md:text-start">
            <div className="flex flex-col items-center md:items-start">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-700/25 bg-emerald-950 text-secondary px-3.5 py-1 text-xs font-black shadow-xs mb-3">
                <Sparkles className="h-3.5 w-3.5 text-secondary" />
                {isAR ? "صدقات جارية تدوم" : "Lasting Ongoing Charities"}
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-primary leading-tight">
                {isAR ? "مشاريعنا التنموية الجارية" : "Our Ongoing Development Projects"}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md leading-relaxed mx-auto md:mx-0">
              {isAR
                ? "اختر مشروعك وابدأ مساهمتك بأي مبلغ أو بسهم محدد كصدقة جارية لك أو لوالديك."
                : "Choose your project and contribute with any amount or share as an enduring charity."}
            </p>
          </div>

          {/* ── 1. Featured Large Card (Project #1: Mosque Construction) ── */}
          {(() => {
            const proj = PROJECTS[0];
            const entity = projectEntities.find((e) => e.id === proj.id);
            const activeCase = entity?.cases?.[0];
            const Icon = proj.icon;

            return (
              <ScrollReveal delay={0}>
                <article className="group relative mb-8 sm:mb-10 overflow-hidden rounded-3xl border border-indigo-900/30 bg-slate-950 shadow-xl hover:shadow-2xl transition-all duration-500">
                  {/* Full Background Photo */}
                  <div className="absolute inset-0">
                    <img
                      src={proj.img}
                      alt={isAR ? proj.ar : proj.en}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-40 sm:opacity-50"
                      loading="eager"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/70 to-transparent" />
                  </div>

                  {/* Watermark 01 */}
                  <div className="absolute end-8 top-6 text-[100px] lg:text-[140px] font-black text-white/[0.04] leading-none select-none hidden md:block pointer-events-none">
                    01
                  </div>

                  <div className="relative z-10 p-6 sm:p-8 lg:p-10 flex flex-col justify-between min-h-[380px] sm:min-h-[420px]">
                    {/* Top Row: Category + Price */}
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-400/30 bg-indigo-500/20 px-3.5 py-1 text-xs font-black text-indigo-300">
                          <Icon className="h-3.5 w-3.5" />
                          {isAR ? proj.tagAr : proj.tagEn}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-secondary/20 border border-secondary/40 px-3 py-1 text-xs font-black text-secondary">
                          <Sparkles className="h-3 w-3" />
                          {isAR ? "المشروع الرائد لهذا الشهر" : "Featured Spotlight"}
                        </span>
                      </div>

                      <span className="rounded-full bg-secondary text-slate-950 font-black px-3.5 py-1 text-xs shadow-md">
                        {isAR ? `الأسهم تبدأ من ${proj.priceFrom} ج.م` : `From ${proj.priceFrom} EGP`}
                      </span>
                    </div>

                    {/* Middle: Content */}
                    <div className="max-w-2xl my-auto">
                      <h3 className="text-2xl sm:text-4xl font-black text-white leading-tight mb-3">
                        {isAR ? proj.ar : proj.en}
                      </h3>
                      <p className="text-sm sm:text-base text-white/85 leading-relaxed mb-5">
                        {isAR ? proj.descAr : proj.descEn}
                      </p>

                      {/* Active Case Mini Highlight */}
                      {activeCase && (
                        <div className="rounded-2xl bg-white/5 backdrop-blur-md border border-white/15 p-3.5 sm:p-4 mb-4">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-white/90 mb-2">
                            <span className="flex items-center gap-1.5 text-amber-300">
                              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                              {isAR ? "حالة ميدانية نشطة:" : "Active Field Case:"}
                            </span>
                            <span className="text-[11px] text-white/70">
                              {activeCase.city} · {activeCase.governorate}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm font-semibold text-white/95 line-clamp-1 mb-2.5">
                            {isAR ? activeCase.titleAr : activeCase.titleEn}
                          </p>
                          {/* Mini Progress */}
                          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-secondary h-full rounded-full transition-all duration-700"
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.round((activeCase.raisedAmount / (activeCase.neededAmount || 1)) * 100)
                                )}%`,
                              }}
                            />
                          </div>
                          <div className="flex justify-between items-center text-[10.5px] font-bold text-white/70 mt-1.5">
                            <span>
                              {isAR
                                ? `تم جمع ${activeCase.raisedAmount.toLocaleString()} من ${activeCase.neededAmount.toLocaleString()} ج.م`
                                : `Collected ${activeCase.raisedAmount.toLocaleString()} of ${activeCase.neededAmount.toLocaleString()} EGP`}
                            </span>
                            <span className="text-secondary font-black">
                              {Math.round((activeCase.raisedAmount / (activeCase.neededAmount || 1)) * 100)}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Actions */}
                    <div className="mt-4 pt-5 border-t border-white/15 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4 text-xs font-bold text-white/80">
                        <span className="flex items-center gap-1">
                          <Target className="h-4 w-4 text-secondary" />
                          {entity?.shares.length ?? 4} {isAR ? "أسهم تبرع متاحة" : "Available Shares"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="h-4 w-4 text-rose-400" />
                          {entity?.cases.length ?? 2} {isAR ? "مساجد قيد البناء" : "Linked Mosques"}
                        </span>
                      </div>

                      <Link
                        to={`/donate?entity=${proj.id}`}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-secondary px-7 py-3 text-sm font-black text-slate-950 shadow-lg shadow-secondary/30 transition-all hover:bg-secondary/90 hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto"
                      >
                        {isAR ? "تبرع في عمارة المساجد الآن" : "Donate to Mosque Now"}
                        <Arrow className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </article>
              </ScrollReveal>
            );
          })()}

          {/* ── 2. Remaining 5 Cards (Taller, cleaner, image-first) ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {PROJECTS.slice(1).map((proj, i) => {
              const Icon = proj.icon;

              return (
                <ScrollReveal key={proj.id} delay={i * 0.06}>
                  <article className="group relative overflow-hidden rounded-3xl border border-border/60 bg-slate-950 shadow-md hover:shadow-2xl hover:border-secondary/40 transition-all duration-500 flex flex-col justify-between min-h-[460px] sm:min-h-[500px]">
                    {/* Full-bleed background image */}
                    <div className="absolute inset-0">
                      <img
                        src={proj.img}
                        alt={isAR ? proj.ar : proj.en}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                      {/* Lighter gradient so more of the photo shows — only darkens the very bottom */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-black/10" />
                    </div>

                    {/* Top Row: Tag badge + price — subtle so image breathes */}
                    <div className="relative z-10 p-4 flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/35 backdrop-blur-md px-2.5 py-0.5 text-[11px] font-semibold text-white/90 shadow-xs">
                        <Icon className="h-3 w-3 text-secondary" />
                        {isAR ? proj.tagAr : proj.tagEn}
                      </span>

                      <span className="rounded-full bg-secondary text-slate-950 font-black px-2.5 py-0.5 text-[11px] shadow-md">
                        {isAR ? `من ${proj.priceFrom} ج.م` : `From ${proj.priceFrom} EGP`}
                      </span>
                    </div>

                    {/* Bottom Area: Compact title + short desc + buttons */}
                    <div className="relative z-10 p-4 sm:p-5 flex flex-col justify-end">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span
                          className="h-6 w-6 rounded-lg grid place-items-center text-white shrink-0"
                          style={{ backgroundColor: proj.accentColor }}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <h3 className="text-base sm:text-lg font-black text-white leading-tight drop-shadow-sm line-clamp-1">
                          {isAR ? proj.ar : proj.en}
                        </h3>
                      </div>

                      <p className="text-[11.5px] sm:text-xs text-white/75 leading-relaxed line-clamp-2 mb-3.5 drop-shadow-xs">
                        {isAR ? proj.descAr : proj.descEn}
                      </p>

                      {/* Actions */}
                      <div className="flex items-center gap-2.5 pt-3 border-t border-white/10">
                        <Link
                          to={`/donate?entity=${proj.id}`}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-secondary px-4 py-2.5 text-xs sm:text-sm font-black text-slate-950 shadow-lg shadow-secondary/25 transition-all hover:bg-secondary/90 hover:scale-[1.02] active:scale-[0.98]"
                        >
                          {isAR ? "تبرع الآن" : "Donate Now"}
                          <Arrow className="h-3.5 w-3.5" />
                        </Link>

                        {proj.landingUrl && (
                          <Link
                            to={proj.landingUrl}
                            className="inline-flex items-center justify-center gap-1 rounded-xl border border-white/20 bg-white/10 backdrop-blur-md px-3.5 py-2.5 text-xs font-bold text-white transition hover:bg-white/20 hover:border-white/40 shrink-0"
                          >
                            <ExternalLink className="h-3.5 w-3.5 text-secondary" />
                            {isAR ? "تفاصيل" : "Details"}
                          </Link>
                        )}
                      </div>
                    </div>
                  </article>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════ Why Projects (Balanced 2-Column + Full-Width Bottom CTA Across Both Columns) ══════════ */}
      <section className="py-8 sm:py-12 bg-muted/30 border-t border-border/60">
        <div className="container mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
          {/* Top Row: Balanced 2 Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch mb-8 sm:mb-10">
            {/* RIGHT COLUMN (In RTL: lg:col-span-7 contains Why intro + 3 Pillars + 4 Guarantees) */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
              {/* Header: Centered on mobile, aligned on desktop, with high-contrast emerald badge */}
              <div className="text-center lg:text-start">
                <div className="flex justify-center lg:justify-start mb-3">
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-700/25 bg-emerald-800/10 dark:bg-emerald-950/40 px-3.5 py-1.5 text-xs font-black text-emerald-800 dark:text-emerald-300 shadow-xs">
                    <Landmark className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                    {isAR ? "أثر دائم يمتد لعقود" : "Sustainable Generational Impact"}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-primary leading-tight mb-3">
                  {isAR ? "لماذا المشاريع التنموية في مؤسسة اليسر؟" : "Why Development Projects with Al-Yusr?"}
                </h2>

                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto lg:mx-0">
                  {isAR
                    ? "على عكس المساعدات الآنية، تبني المشاريع التنموية أصولاً وبنى تحتية تنفع القرى والمجتمعات لعقود طويلة. مسجد يُعمَّر، وبئر ارتوازي يسقي الآلاف، وسقف صلب يحمي عائلات من قسوة الشتاء، ومزرعة تدر عائداً سنوياً مستداماً للفقراء."
                    : "Unlike temporary relief, development projects build permanent infrastructure serving communities for decades. A mosque remains, a deep well quenches thousands, a sturdy roof protects families, and an endowment farm feeds orphans sustainably."}
                </p>
              </div>

              {/* 3 Core Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {[
                  {
                    icon: Building2,
                    titleAr: "بنية تحتية دائمة",
                    titleEn: "Lasting Infrastructure",
                    descAr: "عقوداً من الأثر المتواصل في حياة القرى",
                    descEn: "Decades of uninterrupted community benefit",
                  },
                  {
                    icon: ShieldCheck,
                    titleAr: "هدف مالي وشفاف",
                    titleEn: "Transparent Tracking",
                    descAr: "تتبّع تقدم التنفيذ برقم الحالة والقرية",
                    descEn: "Track real progress with case ref & location",
                  },
                  {
                    icon: Leaf,
                    titleAr: "صدقة جارية ممتدة",
                    titleEn: "Ongoing Charity",
                    descAr: "أجر مستمر في حياتك وبعد الممات",
                    descEn: "Continuous reward during and after life",
                  },
                ].map((f) => {
                  const FIcon = f.icon;
                  return (
                    <div
                      key={f.titleEn}
                      className="rounded-2xl border border-border/80 bg-card p-4 text-center sm:text-start shadow-xs transition hover:border-secondary/40"
                    >
                      <div className="h-9 w-9 rounded-xl bg-secondary/15 grid place-items-center mb-2.5 mx-auto sm:mx-0">
                        <FIcon className="h-4.5 w-4.5 text-secondary" />
                      </div>
                      <p className="text-xs sm:text-sm font-black text-primary">{isAR ? f.titleAr : f.titleEn}</p>
                      <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                        {isAR ? f.descAr : f.descEn}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* ── ميثاق التوثيق والضمانات التنفيذية (4 ركائز موثقة) ── */}
              <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs">
                <div className="flex items-center justify-center lg:justify-start gap-2 mb-4">
                  <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-sm sm:text-base font-black text-primary">
                    {isAR ? "ميثاق التوثيق والشفافية لمشاريعنا:" : "Transparency & Field Execution Charter:"}
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {[
                    {
                      icon: Camera,
                      titleAr: "توثيق مصور وفيديو",
                      titleEn: "Photo & Video Reports",
                      descAr: "إرسال تقرير فوتوغرافي لمراحل الحفر أو البناء أو التشطيب حتى التسليم للمستفيدين.",
                      descEn: "Detailed photo/video milestones sent upon project completion.",
                    },
                    {
                      icon: FileCheck2,
                      titleAr: "إشراف هندسي وتنفيذي مباشر",
                      titleEn: "Direct Engineering Oversight",
                      descAr: "تنفيذ رسمي خاضع لمعايير هندسية متينة بدون وسطاء تجاريين لضمان بقاء الأثر.",
                      descEn: "Licensed execution ensuring structural longevity with zero intermediaries.",
                    },
                    {
                      icon: Award,
                      titleAr: "شهادة سهم وقفية موثقة",
                      titleEn: "Endowment Share Certificate",
                      descAr: "إصدار شهادة مساهمة رقمية أو مطبوعة باسمك أو إهداءً لوالديك كصدقة جارية مباركة.",
                      descEn: "Digital or printed certificate in your name or dedicated to loved ones.",
                    },
                    {
                      icon: Compass,
                      titleAr: "ربط بحالات وقرى محددة",
                      titleEn: "Linked to Real Locations",
                      descAr: "كل سهم يوجه لحالة وقرية بعينها يمكنك معرفة تفاصيلها وموقعها الميداني بالدقهلية.",
                      descEn: "Every share is assigned to a specific verified village or family.",
                    },
                  ].map((p, idx) => {
                    const PIcon = p.icon;
                    return (
                      <div key={idx} className="flex items-start gap-3 rounded-xl bg-muted/30 p-3 border border-border/50 text-start">
                        <span className="h-8 w-8 rounded-lg bg-primary/10 grid place-items-center shrink-0 text-primary mt-0.5">
                          <PIcon className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-xs font-black text-primary">{isAR ? p.titleAr : p.titleEn}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                            {isAR ? p.descAr : p.descEn}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* LEFT COLUMN: Quick Project Picker Strip (Aligned in height with right column) */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
              <div className="rounded-3xl border border-border/80 bg-card p-5 sm:p-6 space-y-3.5 shadow-sm h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-border/60 mb-3">
                    <p className="text-sm font-black text-primary">
                      {isAR ? "اختر مشروعك وابدأ فوراً:" : "Choose a Project to Support:"}
                    </p>
                    <span className="text-[11px] font-bold text-muted-foreground">
                      {PROJECTS.length} {isAR ? "مشاريع نشطة" : "Active"}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {PROJECTS.map((proj) => {
                      const entity = projectEntities.find((e) => e.id === proj.id);
                      const Icon = proj.icon;
                      return (
                        <Link
                          key={proj.id}
                          to={`/donate?entity=${proj.id}`}
                          className="flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/20 px-3.5 py-3 hover:border-secondary/60 hover:bg-secondary/10 transition-all group"
                        >
                          <span
                            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white shadow-sm"
                            style={{ backgroundColor: proj.accentColor }}
                          >
                            <Icon className="h-5 w-5" />
                          </span>
                          <div className="min-w-0 flex-1 text-start">
                            <p className="text-xs sm:text-sm font-black text-primary truncate group-hover:text-secondary transition-colors">
                              {isAR ? proj.ar : proj.en}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {entity?.priceFrom
                                ? isAR
                                  ? `يبدأ من ${entity.priceFrom} ج.م`
                                  : `Starts at ${entity.priceFrom} EGP`
                                : `يبدأ من ${proj.priceFrom} ج.م`}
                              {entity?.shares.length
                                ? ` · ${entity.shares.length} ${isAR ? "أسهم متاحة" : "shares"}`
                                : ""}
                            </p>
                          </div>
                          <Arrow className="h-4 w-4 text-muted-foreground group-hover:text-secondary group-hover:translate-x-[-2px] rtl:group-hover:translate-x-[2px] transition-all shrink-0" />
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* Trust Seal at bottom of list */}
                <div className="pt-3 border-t border-border/60 text-center">
                  <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1.5 font-bold">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    {isAR
                      ? "جميع التبرعات مقيدة ومعتمدة بوزارة التضامن الاجتماعي"
                      : "Official licensed charity under the Ministry of Social Solidarity"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── FULL-WIDTH BOTTOM ROW: Grand Project Sponsorship (Centered on mobile, aligned on desktop) ── */}
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-primary to-slate-950 p-6 sm:p-8 md:p-10 text-white border border-secondary/30 shadow-xl">
              <div className="absolute top-0 end-0 -mt-10 -me-10 h-52 w-52 rounded-full bg-secondary/15 blur-3xl pointer-events-none" />

              {/* Flex container: Centered on mobile, aligned on desktop */}
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2.5 max-w-3xl text-center md:text-start flex flex-col items-center md:items-start">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/20 border border-secondary/40 px-3.5 py-1 text-xs font-black text-secondary shadow-xs">
                    <Sparkles className="h-3.5 w-3.5" />
                    {isAR ? "كفالة كاملة لمشروع" : "Full Project Sponsorship"}
                  </span>
                  <h4 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-snug">
                    {isAR ? "ترغب في كفالة مشروع كامل باسمك أو باسم عائلتك؟" : "Want to sponsor a complete project?"}
                  </h4>
                  <p className="text-xs sm:text-sm md:text-base text-white/85 leading-relaxed max-w-2xl">
                    {isAR
                      ? "بناء مسجد بالكامل، محطة تنقية مياه قروية، أو مجمع تسقيف متكامل باسمك أو صدقة جارية لروح فقيد، مع لوحة تذكارية رسمية باسم الواقف وتقارير تنفيذ دورية موثقة بالفيديو."
                      : "Sponsor a full mosque, water plant, or village roofing cluster with dedicated plaque and verified milestone reports."}
                  </p>
                </div>

                {/* Button: Centered on mobile, aligned on desktop */}
                <div className="w-full md:w-auto shrink-0 pt-2 md:pt-0 flex justify-center md:justify-end">
                  <a
                    href={`https://wa.me/201097000137?text=${waSponsorMsg}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-2xl bg-secondary px-8 py-4 text-sm sm:text-base font-black text-slate-950 shadow-xl shadow-secondary/30 transition-all hover:bg-secondary/90 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <PhoneCall className="h-4.5 w-4.5" />
                    {isAR ? "استشارة مسؤول كبار المشروعات" : "Contact Major Projects"}
                  </a>
                </div>
              </div>
            </div>

            {/* ── HADITH REFLECTION BANNER (Premium · minimal · elegant) ── */}
            <div className="relative overflow-hidden rounded-2xl border border-emerald-700/20 bg-card dark:bg-slate-900/70">
              {/* Top shimmer */}
              <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
              {/* Vertical accent bar */}
              <div className="absolute top-5 bottom-5 end-0 w-[3px] rounded-full bg-gradient-to-b from-emerald-400/80 via-emerald-600/40 to-transparent" />

              <div className="px-7 sm:px-12 py-5 sm:py-6 text-center">
                <p className="text-[10.5px] tracking-[0.18em] font-bold text-emerald-700 dark:text-emerald-400 mb-3">
                  {isAR ? "قال رسول الله ﷺ" : "The Prophet ﷺ Said"}
                </p>

                <blockquote>
                  <p className="text-base sm:text-lg font-bold text-primary dark:text-emerald-100 leading-loose font-serif max-w-2xl mx-auto">
                    {isAR
                      ? "«إِذَا مَاتَ الإنْسَانُ انْقَطَعَ عَنْهُ عَمَلُهُ إِلَّا مِنْ ثَلَاثٍ: صَدَقَةٍ جَارِيَةٍ، أَوْ عِلْمٍ يُنْتَفَعُ بِهِ، أَوْ وَلَدٍ صَالِحٍ يَدْعُو لَهُ»"
                      : '"All deeds cease at death except three: ongoing charity, beneficial knowledge, or a righteous child who prays for them."'}
                  </p>
                </blockquote>

                <p className="text-[11px] text-muted-foreground/70 mt-2.5 font-medium tracking-wide">
                  {isAR ? "— رواه مسلم" : "— Sahih Muslim"}
                </p>
              </div>

              {/* Bottom shimmer */}
              <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ CTA (Expanded max-w-[1440px]) ══════════ */}
      <section className="pt-10 sm:pt-14 pb-16 sm:pb-20 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_60%_50%,theme(colors.secondary.DEFAULT)_0%,transparent_60%)] pointer-events-none" />
        <div className="relative z-10 container mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-secondary/40 bg-secondary/15 px-3.5 py-1 text-xs font-black text-secondary mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            {isAR ? "خطوتك الأولى في الصدقة الجارية" : "Your First Step in Perpetual Giving"}
          </span>

          <h2 className="text-2xl sm:text-4xl font-black text-white mb-4 leading-tight">
            {isAR ? "اختر مشروعك الآن وابدأ أثراً لا ينقطع" : "Choose Your Project & Begin Your Everlasting Impact"}
          </h2>

          <p className="text-sm sm:text-base text-white/80 mb-8 max-w-2xl mx-auto leading-relaxed">
            {isAR
              ? "يمكنك التبرع لعدة مشاريع بأسهم متنوعة في معاملة تبرع واحدة عبر فيزا، ميزة، فودافون كاش، محافظ الهاتف، أو المندوب الميداني حتى باب منزلك."
              : "Donate to multiple projects with various shares in one checkout using Visa, Meeza, mobile wallets, or our home representative."}
          </p>

          <div className="flex flex-wrap gap-3.5 justify-center items-center">
            <Link
              to="/donate?type=project"
              className="inline-flex items-center gap-2.5 rounded-2xl bg-secondary px-8 py-3.5 text-sm sm:text-base font-black text-slate-950 shadow-xl shadow-secondary/30 transition-all hover:bg-secondary/90 hover:scale-[1.02] active:scale-[0.98]"
            >
              {isAR ? "انتقل لصفحة التبرع" : "Go to Donation Page"}
              <Arrow className="h-4 w-4" />
            </Link>
            <Link
              to="/cases"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/5 backdrop-blur-md px-7 py-3.5 text-sm sm:text-base font-bold text-white transition hover:bg-white/15 hover:border-white/40"
            >
              <ExternalLink className="h-4 w-4 text-secondary" />
              {isAR ? "استعرض الحالات الميدانية" : "View Field Cases"}
            </Link>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default ProjectsPage;
