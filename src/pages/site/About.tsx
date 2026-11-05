import { Link } from "react-router-dom";
import { useEffect, useRef, useState, useMemo } from "react";
import {
  ShieldCheck,
  Heart,
  Target,
  Eye,
  Sparkles,
  CheckCircle2,
  Quote,
  Building2,
  HandHeart,
  Globe2,
  BadgeCheck,
  HeartHandshake,
  Sprout,
  ArrowLeft,
  ArrowRight,
  Beef,
  GraduationCap,
  Utensils,
  Droplets,
  Home,
  BookOpen,
  Users,
  Stethoscope,
  HeartPulse,
  HandCoins,
  Baby,
  Accessibility,
  MapPin,
  Phone,
  Mail,
  Facebook,
  Instagram,
  Camera,
  FileCheck2,
  ChevronDown,
  TrendingUp,
  Hospital,
  Briefcase,
  Layers,
  Award,
  Check,
} from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { useQuery } from "@tanstack/react-query";
import { fetchFaqs } from "@/data/faqsApi";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { SiteSchemas, BreadcrumbSchema, FAQSchema } from "@/components/common/Schemas";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LangContext";
import { StickyStack, StickyStackItem } from "@/components/ui/sticky-stack";
import { TrustJourney, type TrustStep } from "@/components/about/TrustJourney";
import { WhyUsChecklist } from "@/components/about/WhyUsChecklist";
import { WhatsAppIcon } from "@/components/common/icons/WhatsAppIcon";
import aboutHero from "@/assets/about-hero-classroom.jpg";
import axisFood from "@/assets/axis-food.jpg";
import axisHealth from "@/assets/axis-health.jpg";
import axisEducation from "@/assets/axis-education.jpg";
import imgHandsSprout from "@/assets/hands-sprout.jpg";
import imgJourneyMain from "@/assets/field/convoy-2026-day-distribution.jpg";
import imgJourneyTeam from "@/assets/contact-hero-volunteers.jpg";
import { useSiteStats } from "@/hooks/useSiteStats";
import { getLucideIcon } from "@/lib/lucide-icon";
import { aboutUsApi, AboutUsData, ABOUT_US_DEFAULT_DATA, resolveStorageUrl, getApiToken } from "@/data/laravelApi";
import { FOUNDATION_EMAIL } from "@/data/api/contactApi";
import { bankAccountLabel, useBankAccounts } from "@/data/paymentOptions";

/** Lightweight scroll-trigger reveal hook (IntersectionObserver — no JS deps). */
const useReveal = () => {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      el.querySelectorAll<HTMLElement>("[data-reveal]").forEach((n) => n.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).classList.add("is-visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
    );
    const observeAll = () => {
      el.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-visible)").forEach((n) => {
        io.observe(n);
      });
    };
    observeAll();
    const mo = new MutationObserver(() => observeAll());
    mo.observe(el, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);
  return ref;
};

/** Icon for an achievement card from its title (the dashboard has no icon field for these). */
const STAT_ICON_RULES: [RegExp, string][] = [
  [/رمضان|ramadan|إفطار|iftar/i, "Moon"],
  [/كرتون|غذائ|food|box|وجب|meal/i, "Package"],
  [/لحم|لحوم|ذبيح|meat|اضحي|أضحي|qurbani/i, "Beef"],
  [/سقف|منزل|بيت|roof|home|house/i, "Home"],
  // education before water: «تعليمية» contains the letters of «مية»
  [/طالب|تعليم|مدرس|student|educat|school/i, "GraduationCap"],
  [/مياه|مية|ماء|water|tap/i, "Droplets"],
  [/عروس|زواج|bride|marri/i, "Heart"],
  [/يتيم|orphan|كفال/i, "HandHeart"],
  [/علاج|طبي|عملي|مريض|medic|health|surg/i, "Stethoscope"],
  [/أطراف|اطراف|prosthe|كرسي/i, "Accessibility"],
];
const statIconFor = (title: string) => STAT_ICON_RULES.find(([re]) => re.test(title))?.[1] ?? "Sparkles";

const About = () => {
  const { lang } = useLang();
  const isRTL = lang === "ar";
  const bankAccounts = useBankAccounts();
  const bankText = bankAccounts[0] ? bankAccountLabel(bankAccounts[0]) : "";
  const base = "https://elyusr.org";
  const root = useReveal();

  const isAdmin = !!getApiToken();
  const { data: aboutDataLive, isLoading: loading } = useQuery({
    queryKey: ["about-us-content"],
    queryFn: () => aboutUsApi.getAboutUs(),
    staleTime: isAdmin ? 0 : 30_000,
  });

  const aboutData = aboutDataLive || ABOUT_US_DEFAULT_DATA;

  // Map values from API (aboutData.values) — falls back to static defaults if API is empty
  const STATIC_VALUE_ICONS = [Sparkles, HeartHandshake, ShieldCheck, Award, BadgeCheck];
  const defaultValuesAr = [
    { title: "التمكين", desc: "بناء الإنسان بالتعليم والعلاج بدلًا من الإحسان اللحظي." },
    { title: "الإحسان", desc: "نصل إلى باب البيت ونحفظ كرامة الأسرة." },
    { title: "الأمانة", desc: "كل تبرع موثق بالصور والفيديو." },
    { title: "القوة", desc: "برامج تنموية متجددة ومستمرة." },
    { title: "الثقة", desc: "كيان مشهر رسميًا لدى وزارة التضامن." },
  ];
  const defaultValuesEn = [
    { title: "Empowerment", desc: "Building people through education and healthcare, not one-off relief." },
    { title: "Excellence (Ihsan)", desc: "Serving with dignity at the doorstep, honoring each family." },
    { title: "Honesty & Integrity", desc: "Transparent accounting, photo and video documentation." },
    { title: "Strength", desc: "Sustainable long-term developmental programs across Egypt." },
    { title: "Trust", desc: "Building enduring trust with donors and beneficiaries alike." },
  ];
  const values = useMemo(() => {
    if (aboutData.values && aboutData.values.length > 0) {
      return aboutData.values.map((v, i) => ({
        icon: getLucideIcon(v.icon) || STATIC_VALUE_ICONS[i % STATIC_VALUE_ICONS.length],
        t: isRTL ? (v.title_ar || "") : (v.title_en || v.title_ar || ""),
        d: isRTL ? (v.description_ar || "") : (v.description_en || v.description_ar || ""),
      }));
    }
    const defs = isRTL ? defaultValuesAr : defaultValuesEn;
    return defs.map((d, i) => ({
      icon: STATIC_VALUE_ICONS[i % STATIC_VALUE_ICONS.length],
      t: d.title,
      d: d.desc,
    }));
  }, [aboutData.values, isRTL]);

  // Timeline is not in the API yet — keep static until backend adds it
  const timeline = isRTL
    ? [
        { y: "2000–2019", t: "البداية: فريق اجتمع على عمل الخير", d: "فريق جمعه هدف واحد: خدمة الأسر المستحقة. وعلى مدار السنين بنى خبرته في الميدان قبل التأسيس الرسمي." },
        { y: "2019", t: "تأسيس وإشهار مؤسسة اليسر", d: "في الشهرين الأخيرين من عام 2019 صدر الإشهار الرسمي رقم 2665 من وزارة التضامن الاجتماعي." },
        { y: "2020", t: "إطلاق محاور الغذاء والتعليم والصحة", d: "جعلنا بناء الإنسان محورًا رئيسيًا لكل المبادرات والقوافل الميدانية." },
        { y: "2022", t: "حملة سِتْر للشتاء", d: "أسقف عازلة وألحفة فايبر وملابس شتوية وأبواب وشبابيك لبيوت أهالينا." },
        { y: "2023", t: "حملة ظِلّ ومبادرة مَرْكُون", d: "سقيا الماء وتوصيل خطوط القرى، وإعادة تدوير الأثاث والأجهزة والأدوية." },
        { y: "2025", t: "إنجازات قياسية في كافة المحافظات", d: "1400 كرتونة رمضان، 3000+ كرتونة شهرية، 385 وصلة مياه، و122 سقفًا، و5 أطنان من اللحوم." },
      ]
    : [
        { y: "2000–2019", t: "The start: a team for good", d: "A team united by one aim, serving families in need, which built its field experience over the years before official incorporation." },
        { y: "2019", t: "Incorporation of Al-Yusr", d: "Officially registered NGO (#2665 / 2019) with the Ministry of Social Solidarity." },
        { y: "2020", t: "Food, Health & Education Pillars", d: "Placing human development at the heart of all programs." },
        { y: "2022", t: "Winter Setr Campaign", d: "Insulated roofs, thermal comforters, warm clothing, doors & windows." },
        { y: "2023", t: "Dhill & Markoun Initiatives", d: "Clean water taps, village supply lines, and in-kind recycling." },
        { y: "2025", t: "Record Impact Year Across Egypt", d: "1,400 Ramadan boxes, 3,000+ monthly food boxes, 385 water taps, 122 roofs, and 5 tons of meat." },
      ];

  const stickyOffsets = ["top-[84px] md:top-[96px]", "top-[100px] md:top-[116px]", "top-[116px] md:top-[136px]"];
  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  const { data: liveAchievements } = useSiteStats("achievements");
  // Year of the hero numbers and the achievements heading — «السنة» in the dashboard (الأرقام والإحصائيات).
  const statsYear = aboutData.achievements?.year ? String(aboutData.achievements.year) : "";

  // Display stats mapped from About Us API stats, falling back to live achievements
  const displayStats = useMemo(() => {
    if (aboutData.stats && aboutData.stats.length > 0) {
      return aboutData.stats.map((s, idx) => {
        const rawNum = typeof s.number === "number" ? s.number : parseFloat(String(s.number).replace(/[^\d.]/g, ""));
        return {
          id: `about-stat-${idx}`,
          section: "achievements",
          sort_order: idx + 1,
          active: true,
          label_ar: s.title_ar || s.label_ar || "",
          label_en: s.title_en || s.label_en || s.title_ar || "",
          value_number: isNaN(rawNum) ? null : rawNum,
          value_text: isNaN(rawNum) ? String(s.number || "") : null,
          suffix_ar: s.suffix || (typeof s.number === "string" && s.number.includes("+") ? "+" : ""),
          suffix_en: s.suffix || (typeof s.number === "string" && s.number.includes("+") ? "+" : ""),
          icon_name: (s as any).icon || statIconFor(`${s.title_ar || s.label_ar || ""} ${s.title_en || s.label_en || ""}`),
          image_url: null,
          link_url: null,
        };
      });
    }
    if (liveAchievements.length > 0) return liveAchievements;
    return [
      {
        id: "s1",
        section: "achievements",
        sort_order: 1,
        active: true,
        label_ar: "كرتونة رمضان",
        label_en: "Ramadan boxes",
        value_number: 1400,
        value_text: null,
        suffix_ar: " كرتونة",
        suffix_en: " boxes",
        icon_name: "Utensils",
        image_url: null,
        link_url: null,
      },
      {
        id: "s2",
        section: "achievements",
        sort_order: 2,
        active: true,
        label_ar: "كرتونة غذائية",
        label_en: "Food boxes",
        value_number: 3000,
        value_text: null,
        suffix_ar: "+",
        suffix_en: "+",
        icon_name: "Utensils",
        image_url: null,
        link_url: null,
      },
      {
        id: "s3",
        section: "achievements",
        sort_order: 3,
        active: true,
        label_ar: "سقف منزل",
        label_en: "Homes roofed",
        value_number: 122,
        value_text: null,
        suffix_ar: " سقف",
        suffix_en: " roofs",
        icon_name: "Home",
        image_url: null,
        link_url: null,
      },
      {
        id: "s4",
        section: "achievements",
        sort_order: 4,
        active: true,
        label_ar: "وصلة مياه نقية",
        label_en: "Water connections",
        value_number: 385,
        value_text: null,
        suffix_ar: " وصلة",
        suffix_en: " connections",
        icon_name: "Droplets",
        image_url: null,
        link_url: null,
      },
    ];
  }, [aboutData.stats, liveAchievements]);

  // Certifications / Trust cards from API aboutData.trust
  const certs = useMemo(() => {
    if (aboutData.trust && aboutData.trust.length > 0) {
      return aboutData.trust.map((t, i) => ({
        I: getLucideIcon(t.icon) || (i === 0 ? BadgeCheck : i === 1 ? ShieldCheck : Globe2),
        t: isRTL ? t.title_ar : (t.title_en || t.title_ar),
        d: isRTL ? t.description_ar : (t.description_en || t.description_ar),
      }));
    }
    return isRTL
      ? [
          { I: BadgeCheck, t: "ترخيص وزارة التضامن", d: "إشهار رسمي رقم 2665 لسنة 2019." },
          { I: ShieldCheck, t: "مراجعة محاسبية مستقلة", d: "تقارير مالية سنوية معتمدة وإيصالات رسمية." },
          { I: Globe2, t: "تغطية شاملة في مصر", d: "مقر رئيسي بالمنصورة وقوافل تغطي ربوع محافظات مصر." },
        ]
      : [
          { I: BadgeCheck, t: "Ministry of Solidarity License", d: "Official NGO Registration #2665 (2019)." },
          { I: ShieldCheck, t: "Audited & Transparent", d: "Annual certified financial accounting and official receipts." },
          { I: Globe2, t: "Nationwide Egyptian Reach", d: "Headquarters in Mansoura with field convoys covering all of Egypt." },
        ];
  }, [aboutData.trust, isRTL]);

  // «لماذا تثق بنا؟» — edited in the dashboard (من نحن ← لماذا تثق بنا), in the order saved there.
  const trustSteps = useMemo<TrustStep[]>(() => {
    const items = Array.isArray(aboutData.why_us) && aboutData.why_us.length > 0 ? aboutData.why_us : ABOUT_US_DEFAULT_DATA.why_us;
    return items.map((c, i) => ({
      icon: c.icon ? getLucideIcon(c.icon) : [BadgeCheck, Camera, Users, HandHeart][i % 4],
      title: isRTL ? c.title_ar || "" : c.title_en || c.title_ar || "",
      desc: isRTL ? c.description_ar || "" : c.description_en || c.description_ar || "",
    }));
  }, [aboutData.why_us, isRTL]);

  const { data: rawAboutFaqs } = useQuery({
    queryKey: ["faqs-about"],
    queryFn: () => fetchFaqs({ categorySlug: "about" }),
    staleTime: 60_000,
  });

  const faq = useMemo(() => {
    if (rawAboutFaqs && rawAboutFaqs.length > 0) {
      return rawAboutFaqs.map((f) => ({
        q: isRTL ? f.question_ar : (f.question_en || f.question_ar),
        a: isRTL ? f.answer_ar : (f.answer_en || f.answer_ar),
      }));
    }
    return isRTL
      ? [
          { q: "أين مقر مؤسسة اليسر الخيرية؟", a: "المقر الرئيسي في المنصورة — تقسيم خطاب، بجوار وكالة المنصورة، محافظة الدقهلية، وتغطي قوافلنا ومشاريعنا كل محافظات مصر." },
          { q: "هل تبرعاتي مُعفاة ضريبيًا؟", a: "نعم، مؤسسة اليسر مرخّصة رسميًا برقم 2665 لسنة 2019 لدى وزارة التضامن الاجتماعي، وتخضع تبرعاتك للإعفاء الضريبي وفق القانون المصري." },
          { q: "كيف أتأكد من وصول تبرعي بنفسي؟", a: "نوفر ميزة «الحضور بنفسك»؛ إذ يمكنك مرافقة مندوبينا إلى الميدان لتسليم تبرعك أو معاينة وصلة المياه والسقف، بالإضافة إلى توثيق فوري بالصور والفيديو مع كود تتبع." },
          { q: "هل أستطيع التطوع معكم؟", a: "نعم، نرحب بالمتطوعين والشباب والعائلات ليكونوا جزءًا من فريقنا الميداني عبر صفحة التطوع بالموقع." },
        ]
      : [
          { q: "Where is Al-Yusr Charity headquartered?", a: "Headquarters in Mansoura — Khattab District, next to Mansoura Agency, Dakahlia, with active convoys and aid operations serving families all across Egypt." },
          { q: "Are donations tax-exempt?", a: "Yes — Al-Yusr is a registered NGO under license #2665/2019, fully compliant with Egyptian tax-deduction regulations." },
          { q: "How can I verify my donation?", a: "We offer 'In-Person Delivery' where donors can join our field teams, along with real-time video/photo reporting and tracking codes." },
          { q: "Can my family and I volunteer?", a: "Yes — we welcome volunteers of all ages to join our distribution drives through our volunteer portal." },
        ];
  }, [rawAboutFaqs, isRTL]);

  return (
    <PageLayout>
      <SEOHelmet
        title={isRTL ? "من نحن | مؤسسة اليسر الخيرية — مؤسسة خيرية في مصر" : "About Us | Al-Yusr Charity Foundation — Egypt"}
        description={isRTL ? "مؤسسة اليسر الخيرية مؤسسة مصرية تعمل في محافظات مصر، ومقرها الرئيسي في المنصورة. تعرّف على رسالتها ومشاريعها الموثقة في رعاية الأيتام والإغاثة والتنمية." : "Al-Yusr Charity Foundation is an Egyptian foundation working across Egypt, headquartered in Mansoura. Learn about our mission and verified projects."}
        path="/about"
        image={aboutHero}
      />
      <SiteSchemas />
      <BreadcrumbSchema items={[
        { name: isRTL ? "الرئيسية" : "Home", url: `${base}/` },
        { name: isRTL ? "من نحن" : "About", url: `${base}/about` },
        { name: isRTL ? "قصتنا"   : "Our story",  url: `${base}/about#story` },
        { name: isRTL ? "رؤية 2030" : "Vision 2030", url: `${base}/about#vision2030` },
        { name: isRTL ? "لماذا تثق بنا" : "Why Trust Us", url: `${base}/about#trust` },
        { name: isRTL ? "قيمنا"   : "Our values", url: `${base}/about#values` },
        { name: isRTL ? "إنجازاتنا" : "Achievements", url: `${base}/about#achievements` },
      ]} />
      <FAQSchema items={faq} />

      <div ref={root}>
        {/* HERO SECTION */}
        <section className="relative overflow-visible pattern-hero-luxe hero-pattern-fade text-primary-foreground">
          <div className="absolute inset-0 leaf-bg opacity-40" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(150_55%_28%/0.45),transparent_60%)]" />
          <div className="container relative mx-auto px-4 pt-16 sm:pt-20 pb-14 md:pt-28 md:pb-20">
            <div className="flex justify-center text-primary-foreground/80">
              <Breadcrumbs items={[{ name: isRTL ? "الرئيسية" : "Home", href: "/" }, { name: isRTL ? "من نحن" : "About" }]} />
            </div>

            <div className="mt-8 grid items-center gap-10 md:grid-cols-2">
              <div data-reveal className="reveal-up text-center md:text-start">
                {loading && !aboutDataLive ? (
                  <div className="space-y-4 max-w-xl mx-auto md:mx-0">
                    <div className="h-6 w-48 rounded-full bg-white/20 animate-pulse mx-auto md:mx-0" />
                    <div className="h-10 sm:h-12 w-3/4 rounded-xl bg-white/20 animate-pulse mx-auto md:mx-0" />
                    <div className="space-y-2 pt-2">
                      <div className="h-4 w-full rounded bg-white/20 animate-pulse" />
                      <div className="h-4 w-5/6 rounded bg-white/20 animate-pulse" />
                    </div>
                  </div>
                ) : (
                  <>
                    <span className="inline-flex items-center gap-2 rounded-full border border-secondary/40 bg-secondary/15 px-3.5 py-1.5 text-xs font-black text-secondary backdrop-blur-xs">
                      <ShieldCheck className="h-4 w-4" />
                      {isRTL
                        ? (aboutData.hero.badge_ar || "مشهرة برقم 2665 لسنة 2019 — وزارة التضامن الاجتماعي")
                        : (aboutData.hero.badge_en || "Licensed NGO #2665 (2019)")}
                    </span>

                    <h1 className="mt-4 mx-auto md:mx-0 max-w-xl text-3xl font-black leading-tight sm:text-4xl md:text-5xl">
                      {isRTL
                        ? (aboutData.hero.title_ar || "مؤسسة اليسر الخيرية")
                        : (aboutData.hero.title_en || "Al-Yusr Charity Foundation")}
                    </h1>
                    
                    <p className="mt-4 mx-auto md:mx-0 max-w-xl text-base leading-relaxed text-primary-foreground/90 md:text-lg">
                      {isRTL
                        ? (aboutData.hero.description_ar || "مؤسسة غير ربحية أُسّست عام 2019، ومشهرة لدى وزارة التضامن الاجتماعي. هدفنا أن تصل الصدقة إلى مستحقها، في المنصورة والدقهلية وكل محافظات مصر.")
                        : (aboutData.hero.description_en || "A registered non-profit foundation established in 2019 under the Ministry of Social Solidarity, delivering verified aid across Mansoura, Dakahlia, and all of Egypt.")}
                    </p>

                    <blockquote className="mt-5 mx-auto md:mx-0 max-w-xl text-lg font-black text-secondary sm:text-xl">
                      {isRTL
                        ? (aboutData.hero.quote_ar ? `«${aboutData.hero.quote_ar.replace(/[«»]/g, "")}»` : "«تبرعك يترك أثرًا ويغيّر حياة»")
                        : (aboutData.hero.quote_en ? `'${aboutData.hero.quote_en.replace(/['"]/g, "")}'` : "'Your donation leaves lasting impact and transforms lives'")}
                    </blockquote>
                  </>
                )}

                <div className="mt-7 flex flex-wrap justify-center gap-3 md:justify-start">
                  <Button asChild size="lg" className="bg-orange-grad text-accent-foreground shadow-cta hover:opacity-95 font-black">
                    <Link to="/donate">
                      <Heart className="h-5 w-5 me-1" />
                      {isRTL
                        ? (aboutData.hero.donate_label_ar || (aboutData.hero as any).donate_button_text || "تبرع الآن")
                        : (aboutData.hero.donate_label_en || "Donate now")}
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 font-bold">
                    <a href="#story">
                      {isRTL
                        ? (aboutData.hero.story_label_ar || (aboutData.hero as any).story_button_text || "اعرف قصتنا")
                        : (aboutData.hero.story_label_en || "Our story")}
                    </a>
                  </Button>
                </div>
              </div>

              <div data-reveal className="reveal-up relative mt-6 md:mt-0">
                <div className="absolute -inset-4 rounded-[2.5rem] bg-secondary/15 blur-2xl" aria-hidden />
                {loading && !aboutDataLive ? (
                  <div className="relative w-full aspect-[16/10] sm:aspect-[16/10] md:aspect-[4/3] rounded-[2rem] border-4 border-secondary/30 bg-white/10 animate-pulse shadow-card flex items-center justify-center">
                    <div className="h-10 w-10 rounded-full border-2 border-secondary/40 border-t-secondary animate-spin" />
                  </div>
                ) : (
                  <img
                    src={aboutData.hero.image ? resolveStorageUrl(aboutData.hero.image) : aboutHero}
                    alt={isRTL ? "مؤسسة اليسر الخيرية" : "Al-Yusr Charity Foundation"}
                    width={1600} height={1024}
                    loading="eager"
                    decoding="async"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (target.src !== aboutHero) {
                        target.src = aboutHero;
                      }
                    }}
                    className="relative w-full rounded-[2rem] border-4 border-secondary/40 object-cover shadow-card"
                  />
                )}
              </div>
            </div>

            {/* Achievements — the only place the figures show (dashboard → من نحن → الأرقام والإحصائيات). */}
            <div
              id="achievements"
              data-reveal
              className="reveal-up relative mx-auto mt-12 max-w-5xl scroll-mt-24 rounded-[2rem] border border-secondary/25 bg-[hsl(150_45%_8%/0.85)] p-4 shadow-[0_30px_80px_-40px_hsl(150_60%_5%/0.9)] backdrop-blur-md sm:p-5 md:mt-14 md:p-6"
            >
              <h2 className="sr-only">{isRTL ? `إحصائيات ${statsYear ? `عام ${statsYear}` : "الأثر"}` : `${statsYear || "Our"} impact numbers`}</h2>
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-4">
                {displayStats.map((s, idx) => {
                  const Icon = getLucideIcon(s.icon_name);
                  const suffix = isRTL ? s.suffix_ar : s.suffix_en;
                  const label = isRTL ? s.label_ar : s.label_en;
                  const numFormatted = s.value_number !== null
                    ? `${s.value_number.toLocaleString(isRTL ? "ar-EG" : "en-US")}${suffix ? ` ${suffix}` : ""}`
                    : (s.value_text || "—");

                  return (
                    <div
                      key={s.id || idx}
                      className="group flex items-center gap-2.5 rounded-xl bg-[hsl(150_40%_10%/0.6)] px-2.5 py-2.5 ring-1 ring-secondary/15 transition hover:bg-[hsl(150_40%_12%/0.75)] hover:ring-secondary/40 sm:px-3 sm:py-3"
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary/10 ring-[1.5px] ring-secondary/60 transition group-hover:bg-secondary/20 group-hover:ring-secondary sm:h-10 sm:w-10">
                        {s.image_url ? (
                          <img src={s.image_url} alt="" className="h-5 w-5 rounded-full object-cover" />
                        ) : (
                          <Icon className="h-4 w-4 text-secondary sm:h-5 sm:w-5" strokeWidth={1.75} />
                        )}
                      </span>
                      <div className="min-w-0">
                        <div className="font-mono text-base font-black leading-none text-secondary sm:text-lg md:text-xl">
                          {numFormatted}
                        </div>
                        <div className="mt-1 truncate text-[10px] font-extrabold text-primary-foreground/85 sm:text-[11px] md:text-xs">
                          {label}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 text-center text-[11px] font-bold text-primary-foreground/75 sm:text-xs">
                {isRTL
                  ? (aboutData.achievements?.title_ar || `${statsYear ? `إحصائيات عام ${statsYear}` : "إحصائيات"} — موثّقة بالميدان في المنصورة والدقهلية ومصر`)
                  : (aboutData.achievements?.title_en || `${statsYear ? `${statsYear} impact` : "Impact"} — verified across Egypt`)}
              </div>
            </div>

            {/* Scroll-down Arrow */}
            <div className="mt-8 flex justify-center md:mt-10">
              <a
                href="#story"
                className="group inline-flex flex-col items-center gap-2 text-primary-foreground/85 transition hover:text-secondary"
                aria-label={isRTL ? "اعرف أكثر — انتقل للمحتوى" : "Learn more — scroll down"}
              >
                <span className="text-[12px] font-extrabold tracking-wide sm:text-sm">
                  {isRTL ? "اعرف أكثر" : "Learn more"}
                </span>
                <span className="grid h-10 w-10 place-items-center rounded-full border border-secondary/40 bg-secondary/10 backdrop-blur transition group-hover:translate-y-1 group-hover:border-secondary group-hover:bg-secondary/25 sm:h-12 sm:w-12">
                  <ChevronDown className="h-5 w-5 text-secondary sm:h-6 sm:w-6" />
                </span>
              </a>
            </div>
          </div>
        </section>

        {/* OUR STORY */}
        <section id="story" className="scroll-mt-24 py-16 md:py-24 bg-background">
          <div className="container mx-auto max-w-5xl px-4 text-center">
            <span data-reveal className="reveal-up inline-flex items-center gap-1.5 rounded-full bg-secondary/15 px-3.5 py-1 text-xs font-black text-primary">
              <Sparkles className="h-3.5 w-3.5 text-secondary" />
              {isRTL ? "نشأة المؤسسة وتاريخنا" : "Our Origin Story"}
            </span>

            <h2 data-reveal className="reveal-up mt-3 text-2xl font-black text-primary md:text-3xl lg:text-4xl">
              {isRTL ? (aboutData.story?.title_ar || "قصتنا") : (aboutData.story?.title_en || "Our Story")}
            </h2>

            <p data-reveal className="reveal-up mx-auto mt-4 max-w-3xl text-sm leading-relaxed text-foreground/90 sm:text-base md:text-lg">
              {isRTL
                ? (aboutData.story?.description_ar || "بعد أكثر من عشر سنوات في العمل الخيري، كان لا بد من كيان منظم ومرخّص يجمع أعمالنا ويطوّرها، ويساعدنا على بناء عمل خيري مؤسسي في جمع التبرعات وتوزيعها؛ مؤسسة قادرة على تغيير مفهوم العمل الخيري، وتنمو بالأثر من خلال مبادراتها.")
                : (aboutData.story?.description_en || "Al-Yusr Charity Foundation was born after more than a decade of direct grassroots volunteering across Egyptian villages, officially incorporated in 2019 (#2665) to maximize donation impact with transparency.")}
            </p>

            <div data-reveal className="reveal-up mx-auto mt-6 flex flex-wrap items-center justify-center gap-3 text-xs font-bold text-muted-foreground">
              <span className="rounded-full bg-card px-3.5 py-1.5 border border-border shadow-xs">
                {isRTL
                  ? `إشهار رقم ${aboutData.story?.registration_number || "2665 لسنة 2019"} — وزارة التضامن الاجتماعي`
                  : `License #${aboutData.story?.registration_number || "2665 / 2019"} — Ministry of Social Solidarity`}
              </span>
              {(bankText || aboutData.story?.bank_name) && (
                <span className="rounded-full bg-card px-3.5 py-1.5 border border-border shadow-xs text-primary font-black">
                  {isRTL ? `حساب ${bankText || aboutData.story?.bank_name}` : `Account ${bankText || aboutData.story?.bank_name}`}
                </span>
              )}
            </div>

            {/* Mission & Goal Cards — from API story data */}
            <div className="mt-10 grid gap-6 md:grid-cols-2 text-start">
              <div data-reveal className="reveal-up rounded-3xl border border-border bg-card p-6 shadow-soft md:p-8">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary/15 text-primary">
                  <Target className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="mt-4 text-xl font-black text-primary">{isRTL ? "رسالتنا" : "Our Mission"}</h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground/85 md:text-base font-medium">
                  {isRTL
                    ? (aboutData.story?.mission_ar ||
                       (typeof aboutData.story?.mission === "object" ? (aboutData.story.mission as any)?.description_ar : null) ||
                       "بناء إنسان واعٍ جسديًا وثقافيًا وصحيًا.")
                    : (aboutData.story?.mission_en ||
                       (typeof aboutData.story?.mission === "object" ? (aboutData.story.mission as any)?.description_en : null) ||
                       "Building an individual who is physically, culturally, and medically empowered.")}
                </p>
              </div>

              <div data-reveal className="reveal-up rounded-3xl border border-border bg-card p-6 shadow-soft md:p-8">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary/15 text-primary">
                  <Eye className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="mt-4 text-xl font-black text-primary">{isRTL ? "هدفنا" : "Our Goal"}</h3>
                <ul className="mt-2 space-y-2 text-sm leading-relaxed text-foreground/85 md:text-base font-medium">
                  {(() => {
                    // Try API goals array first, then fallback to static
                    const apiGoals = Array.isArray(aboutData.story?.goals_ar)
                      ? aboutData.story.goals_ar
                      : (typeof aboutData.story?.goals === "object" && Array.isArray((aboutData.story.goals as any)?.items)
                          ? ((aboutData.story.goals as any).items as string[])
                          : null);
                    const staticGoalsAr = [
                      "أن تصل الصدقة إلى من يستحقها بأعلى معايير الأمانة.",
                      "تغيير مفهوم العمل الخيري في مصر — من إعطاء صدقة لحظية إلى تغيير حياة كاملة.",
                      "الحفاظ على أموال المتبرعين وتوفير طرق تبرع آمنة وموثقة.",
                    ];
                    const staticGoalsEn = [
                      "Ensure charity reaches verified deserving families directly.",
                      "Shift charity from temporary relief to complete life transformation.",
                      "Safeguard donor funds with secure, transparent, and audited channels.",
                    ];
                    const goals = apiGoals || (isRTL ? staticGoalsAr : staticGoalsEn);
                    return goals.map((g: string, gi: number) => (
                      <li key={gi} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-secondary shrink-0 mt-1" />
                        <span>{g}</span>
                      </li>
                    ));
                  })()}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* WHY US — not just a registered NGO */}
        <WhyUsChecklist isRTL={isRTL} />

        {/* VISION 2030 WITH 22.7% PROGRESS SLIDER */}
        <section id="vision2030" className="scroll-mt-24 py-16 md:py-24 pattern-why text-primary-foreground border-y border-primary/30">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="text-center max-w-3xl mx-auto">
              <span data-reveal className="reveal-up inline-flex items-center gap-1.5 rounded-full bg-secondary/25 px-3.5 py-1 text-xs font-black text-secondary ring-1 ring-secondary/30">
                <TrendingUp className="h-3.5 w-3.5 text-secondary" />
                {isRTL ? "الخطة الاستراتيجية المستدامة" : "Strategic Vision"}
              </span>

              <h2 data-reveal className="reveal-up mt-3 text-2xl font-black text-primary-foreground md:text-3xl lg:text-4xl">
                {isRTL ? "رؤيتنا لعام 2030" : "Vision 2030 Roadmap"}
              </h2>

              <p data-reveal className="reveal-up mt-3 text-sm text-primary-foreground/75 md:text-base">
                {isRTL
                  ? "مستهدفات طموحة لنقل المجتمعات الأشد حاجة من دائرة العوز إلى الاكتفاء الذاتي والإنتاج:"
                  : "Ambitious milestones moving communities from poverty to self-reliance:"}
              </p>
            </div>

            {/* Vision 2030 Pillars — from API */}
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {(() => {
                const staticItems = [
                  { icon: Sprout, titleAr: "مشاريع استثمارية وقفية", titleEn: "Endowment Investments", descAr: "بناء مشاريع استثمارية وقفًا لله، يُستخدم ريعها وأرباحها في كفالة الأسر وتغطية المصاريف التشغيلية بصورة مستدامة.", descEn: "Endowment ventures funding ongoing family stipends and operating sustainability." },
                  { icon: Hospital, titleAr: "مستشفى متكامل", titleEn: "Comprehensive Hospital", descAr: "بناء مستشفى كبير يخدم أكثر من 100 ألف مريض سنويًا بأحدث الأجهزة الطبية، مع رعاية مجانية لغير القادرين.", descEn: "State-of-the-art charitable hospital serving over 100,000 underprivileged patients annually." },
                  { icon: GraduationCap, titleAr: "كفالة 20 ألف طالب", titleEn: "20,000 Student Sponsorships", descAr: "كفالة تعليمية متكاملة لأكثر من 20,000 طالب وطالبة للنجاة بهم من الفقر وكسر حلقة التسرّب الدراسي.", descEn: "Comprehensive tuition and support securing 20,000 young learners from poverty." },
                  { icon: Briefcase, titleAr: "مشاريع صغيرة للمستحقين", titleEn: "Micro-Enterprises", descAr: "تمويل وتأسيس مشاريع إنتاجية صغيرة للأسر المستحقة لتمكينها من الاعتماد على نفسها والتحول إلى أسر منتجة.", descEn: "Funding sustainable micro-businesses enabling families to become independent and productive." },
                ];
                const apiItems = aboutData.vision_2030?.items;
                const useApi = Array.isArray(apiItems) && apiItems.length > 0;
                return (useApi ? apiItems : staticItems).map((v: any, i: number) => {
                  const Icon = useApi ? getLucideIcon(v.icon) : (v as typeof staticItems[0]).icon;
                  return (
                    <div key={i} data-reveal className="reveal-up rounded-3xl border border-border bg-card p-6 shadow-soft text-center sm:text-start flex flex-col justify-between">
                      <div>
                        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary/15 text-primary mx-auto sm:mx-0">
                          <Icon className="h-6 w-6 text-secondary" />
                        </span>
                        <h3 className="mt-4 text-lg font-black text-primary">
                          {useApi ? (isRTL ? (v.title_ar || v.titleAr) : (v.title_en || v.titleEn)) : (isRTL ? (v as any).titleAr : (v as any).titleEn)}
                        </h3>
                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm font-medium">
                          {useApi ? (isRTL ? (v.description_ar || v.descAr) : (v.description_en || v.descEn)) : (isRTL ? (v as any).descAr : (v as any).descEn)}
                        </p>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Achievement Meter: Dynamic from Vision 2030 progress */}
            {(() => {
              const progressVal = (aboutData.vision_2030?.progress !== undefined && aboutData.vision_2030?.progress !== null && !isNaN(Number(aboutData.vision_2030.progress)))
                ? Number(aboutData.vision_2030.progress)
                : 23.1;
              return (
                <div data-reveal className="reveal-up mt-10 rounded-3xl border border-secondary/30 bg-gradient-to-r from-primary/95 via-primary to-[#06331c] p-6 text-primary-foreground shadow-card sm:p-8">
                  <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-6">
                    <div className="md:col-span-8 text-center md:text-start">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/20 px-3 py-1 text-xs font-black text-secondary">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {isRTL ? "مؤشر الإنجاز الفعلي" : "Verified Milestone Progress"}
                      </span>
                      <h3 className="mt-2 text-xl font-black sm:text-2xl">
                        {isRTL ? "ما تم تحقيقه حتى الآن من مستهدفات 2030" : "Achieved So Far Towards Vision 2030"}
                      </h3>
                      <p className="mt-1 text-xs sm:text-sm text-primary-foreground/85">
                        {isRTL ? (
                          <>
                            تم بفضل الله وتبرعاتكم إنجاز{" "}
                            <span className="font-black text-secondary tabular-nums" dir="ltr">{progressVal}%</span>{" "}
                            من الخطة التنموية عبر مزارع الوقف والمجمعات الطبية وكفالات التعليم وسقيا الماء.
                          </>
                        ) : (
                          <>
                            <span className="font-black text-secondary tabular-nums" dir="ltr">{progressVal}%</span>{" "}
                            of the vision achieved through endowment farms, medical clinics, education aid, and pure water lines.
                          </>
                        )}
                      </p>

                      {/* Progress Bar — from API */}
                      <div className="mt-4 w-full bg-white/20 h-4 rounded-full overflow-hidden p-0.5">
                        <div
                          className="bg-orange-grad h-full rounded-full transition-all duration-1000 shadow-sm"
                          style={{ width: `${Math.min(100, Math.max(0, progressVal))}%` }}
                        />
                      </div>
                    </div>

                    <div className="md:col-span-4 flex flex-col items-center justify-center text-center">
                      <div className="font-mono text-4xl sm:text-5xl font-black text-secondary tabular-nums" dir="ltr">
                        {progressVal}%
                      </div>
                      <div className="mt-1 text-xs font-black text-primary-foreground/90 uppercase tracking-wider">
                        {isRTL ? "معدل الإنجاز المحقق" : "Completed Goal Ratio"}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </section>

        {/* WHY TRUST US? — the path a donation walks, from API why_us with static fallback */}
        <TrustJourney isRTL={isRTL} steps={trustSteps} />

        {/* SPROUT BANNER */}
        <section className="relative overflow-hidden">
          <img src={imgHandsSprout} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/75 to-primary/50" aria-hidden />
          <div className="container relative mx-auto px-4 py-16 text-center text-primary-foreground md:py-20">
            <h2 data-reveal className="reveal-up mx-auto max-w-3xl text-2xl font-black md:text-4xl">
              {isRTL ? "نزرع اليوم… ليثمر غدًا في كل بيت في مصر" : "We plant today — to bloom tomorrow in every home across Egypt"}
            </h2>
          </div>
        </section>

        {/* VALUES */}
        <section id="values" className="py-16 md:py-24 pattern-programs border-y border-border/40">
          <div className="container mx-auto max-w-6xl px-4">
            <h2 data-reveal className="reveal-up text-center text-2xl font-black text-primary md:text-3xl">{isRTL ? "قيمنا" : "Our Values"}</h2>
            <p data-reveal className="reveal-up mx-auto mt-3 max-w-2xl text-center text-muted-foreground text-sm sm:text-base">
              {isRTL ? "قيم نعمل بها كل يوم في كل قرية بالدقهلية ومحافظات مصر." : "Guiding principles lived daily across every village in Egypt."}
            </p>
            <div className="mx-auto mt-10 grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {values.map((v, i) => (
                <div key={i} data-reveal className="reveal-up rounded-2xl border border-border bg-card p-5 text-center shadow-soft transition hover:-translate-y-1 hover:shadow-card">
                  <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-secondary/15 text-primary">
                    <v.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-3 font-extrabold text-primary">{v.t}</h3>
                  <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-muted-foreground">{v.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TESTIMONIAL / SLOGAN */}
        <section className="bg-primary text-primary-foreground py-16 md:py-20">
          <div className="container mx-auto max-w-4xl px-4 text-center">
            <Quote className="mx-auto h-8 w-8 text-secondary" />
            <p data-reveal className="reveal-up mt-4 text-xl sm:text-2xl md:text-3xl font-black leading-relaxed text-secondary">
              {isRTL
                ? "«نترك أثرًا في حياتك وأثرًا في حياة المستحق»"
                : "“We leave a lasting impact in your life, and an enduring impact in the recipient's life.”"}
            </p>
            <div className="mt-4 text-xs sm:text-sm font-bold text-primary-foreground/80">
              {isRTL ? "مؤسسة اليسر الخيرية — المنصورة والدقهلية وكل محافظات مصر" : "Al-Yusr Charity Foundation — Egypt"}
            </div>
          </div>
        </section>

        {/* ONGOING PERMANENT ACTIVITIES */}
        <section id="activities" className="scroll-mt-24 py-16 md:py-24 bg-background border-y border-border/40">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="mx-auto max-w-3xl text-center">
              <span data-reveal className="reveal-up inline-flex items-center gap-1.5 rounded-full bg-secondary/15 px-3.5 py-1 text-xs font-black text-primary">
                <Layers className="h-3.5 w-3.5 text-secondary" />
                {isRTL ? "برامج ومسارات الخير" : "Active Initiatives"}
              </span>
              <h2 data-reveal className="reveal-up mt-3 text-2xl font-black text-primary md:text-3xl lg:text-4xl">
                {isRTL ? "أنشطتنا الدائمة" : "Our Ongoing Activities"}
              </h2>
              <p data-reveal className="reveal-up mt-3 text-muted-foreground text-sm sm:text-base">
                {isRTL ? "مبادرات نوعية مدروسة تعمل طوال العام في كل جوانب الحياة:" : "Continuous year-round programs touching every facet of life:"}
              </p>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
              {(() => {
                // Edited in the dashboard (من نحن ← الأنشطة الدائمة); the default list covers an unreachable API.
                const source = Array.isArray(aboutData.programs) && aboutData.programs.length > 0 ? aboutData.programs : ABOUT_US_DEFAULT_DATA.programs;
                const items = source.map((p) => ({
                  I: getLucideIcon(p.icon) || Layers,
                  ar: p.title_ar,
                  en: p.title_en || p.title_ar,
                  dAr: p.description_ar || "",
                  dEn: p.description_en || p.description_ar || "",
                  href: p.href && p.href.startsWith("/") ? p.href : "/programs",
                }));

                // Green brand tiles with orange icons (dashboard → من نحن → الأنشطة الدائمة).
                return items.map((a, i) => (
                  <Link
                    key={i}
                    to={a.href}
                    data-reveal
                    className="reveal-up group relative flex flex-col items-center overflow-hidden rounded-3xl bg-primary p-4 text-center text-primary-foreground shadow-card ring-1 ring-primary/10 transition hover:-translate-y-1 hover:shadow-cta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:p-6"
                  >
                    <span aria-hidden className="pointer-events-none absolute inset-0 leaf-bg opacity-15" />
                    <span className="relative grid h-12 w-12 place-items-center rounded-2xl bg-accent/15 ring-1 ring-accent/40 transition group-hover:bg-accent sm:h-14 sm:w-14">
                      <a.I className="h-6 w-6 text-accent transition group-hover:text-accent-foreground sm:h-7 sm:w-7" strokeWidth={2} />
                    </span>
                    <span className="relative mt-3 block text-sm font-black leading-snug sm:text-base">{isRTL ? a.ar : a.en}</span>
                    {(isRTL ? a.dAr : a.dEn) && (
                      <span className="relative mt-1.5 hidden text-xs leading-relaxed text-primary-foreground/75 line-clamp-3 sm:block">{isRTL ? a.dAr : a.dEn}</span>
                    )}
                  </Link>
                ));
              })()}
            </div>
          </div>
        </section>

        {/* CERTIFICATIONS */}
        <section className="pattern-programs py-16 md:py-24">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 data-reveal className="reveal-up text-center text-2xl font-black text-primary md:text-3xl mb-3">
              {isRTL ? "اعتماد وثقة رسمية" : "Official Accreditation"}
            </h2>
            <p data-reveal className="reveal-up mx-auto mt-3 max-w-2xl text-center text-muted-foreground text-sm sm:text-base">
              {isRTL
                ? "مشهرة رسميًا لدى وزارة التضامن الاجتماعي، مع تقارير محاسبية سنوية وإشراف كامل."
                : "Officially registered by the Ministry of Social Solidarity with certified annual accounting."}
            </p>
            <div className="mt-12 grid gap-10 sm:grid-cols-3 sm:gap-6">
              {certs.map((c, i) => (
                <div key={i} data-reveal className="reveal-up flex flex-col items-center text-center">
                  {/* Verified seal: glowing ring + check badge */}
                  <div className="cert-seal relative grid h-28 w-28 place-items-center rounded-full sm:h-32 sm:w-32" style={{ animationDelay: `${i * 0.6}s` }}>
                    <span aria-hidden className="cert-seal-ring absolute inset-0 rounded-full" />
                    <span className="relative grid h-[84%] w-[84%] place-items-center rounded-full bg-primary shadow-card ring-4 ring-background">
                      <c.I className="h-10 w-10 text-secondary sm:h-11 sm:w-11" strokeWidth={1.75} />
                    </span>
                    <span className="absolute bottom-1 end-1 grid h-9 w-9 place-items-center rounded-full bg-accent text-accent-foreground shadow-cta ring-4 ring-background sm:h-10 sm:w-10">
                      <Check className="h-5 w-5" strokeWidth={3.5} />
                      <span className="sr-only">{isRTL ? "موثّق" : "Verified"}</span>
                    </span>
                  </div>
                  <h3 className="mt-5 text-base font-black text-primary sm:text-lg">{c.t}</h3>
                  <p className="mt-1.5 max-w-xs text-xs font-medium leading-relaxed text-muted-foreground sm:text-sm">{c.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TIMELINE / MILESTONES — Sticky Milestone Cards & Photo Collage */}
        <section id="timeline" className="scroll-mt-24 py-16 md:py-24 pb-28 md:pb-36 bg-background border-y border-border/40">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center mb-10 sm:mb-14">
              <span data-reveal className="reveal-up inline-flex items-center gap-1.5 rounded-full bg-secondary/15 px-3.5 py-1 text-xs font-black text-primary">
                <CheckCircle2 className="h-3.5 w-3.5 text-secondary" />
                {isRTL ? "محطات من تاريخ العطاء" : "History & Milestones"}
              </span>
              <h2 data-reveal className="reveal-up mt-3 text-2xl font-black text-primary md:text-4xl">
                {isRTL ? "رحلتنا وتاريخنا" : "Our Journey & Milestones"}
              </h2>
              <p data-reveal className="reveal-up mt-3 text-sm text-muted-foreground md:text-base">
                {isRTL ? "من فريق اجتمع على عمل الخير إلى مؤسسة مشهرة رسميًا، والمسيرة مستمرة." : "From a team that came together to do good to an officially registered foundation, and the journey continues."}
              </p>
            </div>

            {/* 2 cols on desktop: Sticky Milestone Cards on one side, Sticky Photo Collage on the other */}
            <div className="grid items-start gap-8 sm:gap-10 md:gap-12 lg:gap-16 md:grid-cols-2">
              {/* Column 1: Milestone Cards with vertical timeline axis & Sticky Stack */}
              <div className="order-2 md:order-1 relative">
                {/* Vertical Axis Line */}
                <div className="absolute top-4 bottom-12 start-[17px] sm:start-[21px] w-[3px] bg-gradient-to-b from-secondary via-secondary/60 to-secondary/10 rounded-full" aria-hidden="true" />

                <StickyStack className="space-y-4 sm:space-y-5">
                  {timeline.map((m, i) => {
                    const offsets = [
                      "top-[84px] md:top-[96px]",
                      "top-[96px] md:top-[112px]",
                      "top-[108px] md:top-[128px]",
                      "top-[120px] md:top-[144px]",
                      "top-[132px] md:top-[160px]",
                      "top-[144px] md:top-[176px]",
                    ];
                    return (
                      <StickyStackItem
                        key={i}
                        index={i}
                        top={offsets[i % offsets.length]}
                      >
                        <div className="group relative flex items-start gap-3 sm:gap-5 ps-11 sm:ps-14">
                          {/* Node on the axis line */}
                          <div className="absolute start-0 top-3 grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-full border-2 border-background bg-secondary text-secondary-foreground shadow-cta transition-transform duration-300 group-hover:scale-110">
                            <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                          </div>

                          {/* Milestone Card */}
                          <div className="w-full rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-soft transition-all duration-300 hover:border-secondary/40 hover:shadow-card">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2.5">
                              <h3 className="text-sm sm:text-base font-black text-primary leading-snug">{m.t}</h3>
                              <span className="inline-flex items-center rounded-full bg-secondary/15 px-2.5 py-0.5 font-mono text-xs font-black text-secondary border border-secondary/20">
                                {m.y}
                              </span>
                            </div>
                            <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-muted-foreground font-medium">
                              {m.d}
                            </p>
                          </div>
                        </div>
                      </StickyStackItem>
                    );
                  })}
                </StickyStack>
              </div>

              {/* Column 2: Photo Collage + Registration badge — sticky while scrolling */}
              <div className="order-1 md:order-2 md:sticky md:top-24 self-start flex flex-col gap-5 sm:gap-6">
                {/* 5-col collage grid: big poster (col-span-3) + side column (col-span-2) */}
                <div
                  className="relative mx-auto grid w-full grid-cols-5 gap-3 sm:gap-4 overflow-hidden rounded-[1.5rem]"
                  style={{ height: "clamp(300px, 34vw, 380px)" }}
                >
                  {/* Big poster — col-span-3 */}
                  <div className="col-span-3 h-full min-h-0 overflow-hidden rounded-[1.25rem] sm:rounded-[1.5rem] border-2 border-secondary/40 shadow-card bg-muted group">
                    <img
                      src={imgJourneyMain}
                      alt={isRTL ? "توثيق ميداني لمسيرة مؤسسة اليسر" : "Al-Yusr field documentation"}
                      className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = axisFood; }}
                    />
                  </div>

                  {/* Side column — col-span-2 */}
                  <div className="col-span-2 flex h-full min-h-0 flex-col gap-3 sm:gap-4">
                    {/* Top image */}
                    <div className="relative flex-[1.4] min-h-0 overflow-hidden rounded-[1rem] sm:rounded-[1.25rem] border-2 border-accent/40 shadow-soft bg-muted group">
                      <img
                        src={imgJourneyTeam}
                        alt={isRTL ? "فريق مؤسسة اليسر" : "The Al-Yusr team"}
                        className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = axisHealth; }}
                      />
                    </div>

                    {/* Bottom card: informational (the About page introduces us; it does not send to a programme) */}
                    <div className="relative flex flex-1 min-h-0 w-full flex-col items-center justify-center rounded-[1rem] sm:rounded-[1.25rem] bg-gradient-to-br from-[#0c492c] to-[#062c19] px-3 py-2 sm:px-4 sm:py-3 text-center text-white shadow-soft ring-1 ring-secondary/30">
                      <div className="inline-flex items-center justify-center gap-1.5 text-[11px] sm:text-xs font-black text-secondary">
                        <Sprout className="h-4 w-4 shrink-0" />
                        <span>{isRTL ? "والمسيرة مستمرة" : "The journey continues"}</span>
                      </div>
                      <p className="mt-1 sm:mt-1.5 text-[10.5px] sm:text-[11.5px] font-bold leading-normal text-white/90 px-1">
                        {isRTL ? "من فريق للخير إلى مؤسسة مشهرة" : "From a team for good to a registered foundation"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Registration badge below collage with balanced, comfortable spacing */}
                <div className="flex items-center gap-3.5 rounded-2xl border border-secondary/30 bg-gradient-to-br from-[#0c492c] via-[#093e24] to-[#062c19] p-4 sm:p-5 text-white shadow-soft relative z-10">
                  <div className="h-11 w-11 rounded-xl bg-secondary/20 flex items-center justify-center shrink-0 border border-secondary/30 text-secondary shadow-sm">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="font-mono text-xl font-black text-secondary tracking-wide">2665 / 2019</div>
                    <div className="mt-0.5 text-xs text-white/95 font-bold leading-snug">
                      {isRTL ? "إشهار رسمي معتمد بوزارة التضامن الاجتماعي" : "Officially Registered NGO — Ministry of Social Solidarity"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CONTACT + MAP */}
        <section id="contact" className="scroll-mt-24 py-16 md:py-24 bg-muted/30 border-y border-border/50">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="mx-auto max-w-3xl text-center">
              <span data-reveal className="reveal-up inline-flex items-center gap-1.5 rounded-full bg-secondary/25 border border-secondary/40 px-3.5 py-1 text-xs font-black text-black shadow-xs">
                <MapPin className="h-3.5 w-3.5 text-primary" /> {isRTL ? "المقر والتواصل" : "Headquarters & Contact"}
              </span>
              <h2 data-reveal className="reveal-up mt-3 text-2xl font-black text-primary md:text-4xl">
                {isRTL ? "تواصل ومقر المؤسسة" : "Contact & Headquarters"}
              </h2>
              <p data-reveal className="reveal-up mt-3 text-muted-foreground text-sm sm:text-base">
                {isRTL ? "أبوابنا مفتوحة يوميًا لخدمتكم واستقبال مساهماتكم في المنصورة وجميع المحافظات." : "Our headquarters welcome donors and beneficiaries daily in Mansoura and nationwide."}
              </p>
            </div>
            <div className="mt-10 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
              {/* Map (Column 1 on desktop) */}
              <div data-reveal className="reveal-up overflow-hidden rounded-3xl border border-border shadow-card order-2 lg:order-1">
                <iframe
                  title={isRTL ? "موقع مؤسسة اليسر — المنصورة" : "Al-Yusr location — Mansoura"}
                  src={`https://www.google.com/maps?q=${encodeURIComponent(isRTL ? "المنصورة، الدقهلية، مصر" : "Mansoura, Dakahlia, Egypt")}&hl=${isRTL ? "ar" : "en"}&z=13&output=embed`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="block h-full min-h-[320px] w-full border-0 lg:min-h-[460px]"
                  style={{ display: "block" }}
                />
              </div>

              {/* Contact cards (Column 2 on desktop) */}
              <div className="space-y-3 order-1 lg:order-2">
                <a href="tel:+201097000137" data-source="about" data-label="about-phone" className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-card">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary/15 text-primary"><Phone className="h-5 w-5 text-secondary" /></div>
                  <div><div className="font-extrabold text-primary">{isRTL ? "هاتف" : "Phone"}</div><div dir="ltr" className="text-sm text-muted-foreground font-bold">+20 109 700 0137</div></div>
                </a>
                <a href="https://wa.me/201097000137" target="_blank" rel="noopener" data-source="about" data-label="about-whatsapp" className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-card">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary/15 text-primary"><WhatsAppIcon className="h-5 w-5 text-secondary" /></div>
                  <div><div className="font-extrabold text-primary">WhatsApp</div><div className="text-sm text-muted-foreground">{isRTL ? "رد فوري — اضغط للمحادثة" : "Instant reply — tap to chat"}</div></div>
                </a>
                <a href={`mailto:${FOUNDATION_EMAIL}`} data-source="about" data-label="about-email" className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-card">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary/15 text-primary"><Mail className="h-5 w-5 text-secondary" /></div>
                  <div><div className="font-extrabold text-primary">{isRTL ? "بريد" : "Email"}</div><div className="text-sm text-muted-foreground">{FOUNDATION_EMAIL}</div></div>
                </a>
                <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary/15 text-primary"><MapPin className="h-5 w-5 text-secondary" /></div>
                  <div><div className="font-extrabold text-primary">{isRTL ? "العنوان" : "Address"}</div><div className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{isRTL ? "المنصورة، تقسيم خطاب، بجوار وكالة المنصورة — الدقهلية، مصر" : "Mansoura, Khattab District, next to Mansoura Agency — Dakahlia, Egypt"}</div></div>
                </div>
                {bankAccounts[0] && (
<div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary/15 text-primary"><Building2 className="h-5 w-5 text-secondary" /></div>
                  <div><div className="font-extrabold text-primary">{isRTL ? "الحساب البنكي الرسمي" : "Official bank account"}</div><div dir="ltr" className="text-sm font-black text-secondary font-mono">{bankText}</div></div>
                </div>
                )}
                <div className="flex flex-wrap gap-2 pt-1">
                  <a href="https://facebook.com/Elyosr.Charity" target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-extrabold text-primary transition hover:border-secondary/60 hover:text-secondary"><Facebook className="h-3.5 w-3.5" /> Facebook</a>
                  <a href="https://instagram.com/elyosr.charity" target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-extrabold text-primary transition hover:border-secondary/60 hover:text-secondary"><Instagram className="h-3.5 w-3.5" /> Instagram</a>
                  <Link to="/contact" className="inline-flex items-center gap-1.5 rounded-full bg-orange-grad px-3 py-1.5 text-xs font-extrabold text-accent-foreground shadow-cta">{isRTL ? "صفحة التواصل الكاملة" : "Full contact page"} <ArrowLeft className="h-3.5 w-3.5 hidden rtl:inline" /><ArrowRight className="h-3.5 w-3.5 rtl:hidden" /></Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section id="faq" className="scroll-mt-24 py-16 md:py-24 pattern-programs">
          <div className="container mx-auto max-w-3xl px-4">
            <h2 data-reveal className="reveal-up text-center text-2xl font-black text-primary md:text-3xl">
              {isRTL ? "أسئلة شائعة عن مؤسسة اليسر" : "Frequently Asked Questions"}
            </h2>
            <div className="mt-8 space-y-3">
              {faq.map((f, i) => (
                <details key={i} data-reveal className="reveal-up group rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-soft">
                  <summary className="flex cursor-pointer items-center justify-between gap-3 font-extrabold text-primary text-sm sm:text-base">
                    <span className="leading-snug">{f.q}</span>
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-secondary transition group-open:rotate-90" />
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-foreground/80 font-medium border-t border-border/40 pt-3">{f.a}</p>
                </details>
              ))}
            </div>

            <div className="mt-8 text-center" data-reveal>
              <Link
                to="/faqs"
                className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-secondary/40 bg-card px-4 py-2 sm:px-5 sm:py-2.5 text-xs font-bold text-primary shadow-sm hover:bg-secondary/10 transition"
              >
                <span>{isRTL ? "مركز الأسئلة الشائعة" : "FAQ Center"}</span>
                {isRTL ? <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-secondary" /> : <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-secondary" />}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </PageLayout>
  );
};
export default About;
