import { useEffect, useMemo, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, ArrowRight, Heart, CheckCircle2, Sparkles, Target, Users, Megaphone, FileText } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LangContext";
import iconFood from "@/assets/axis-food.jpg";
import iconHealth from "@/assets/axis-health.jpg";
import iconEdu from "@/assets/axis-education.jpg";
import { listPublicCases, type CaseRow } from "@/data/casesApi";
import { listPublicCampaigns, type Campaign as CampaignRow } from "@/data/campaignsApi";
import { axesApi, LaravelAxis, formatServerImageUrl } from "@/data/laravelApi";

type AxisKey = "food" | "health" | "education";

type AxisContent = {
  img: string;
  ar: { title: string; tag: string; lede: string; pillars: string[]; programs: { name: string; desc: string; href: string }[]; impact: { value: string; label: string }[] };
  en: { title: string; tag: string; lede: string; pillars: string[]; programs: { name: string; desc: string; href: string }[]; impact: { value: string; label: string }[] };
  caseSlugs: string[]; // categories slugs to filter related cases
  donateHref: string;
  tone: string;
};

const AXES: Record<AxisKey, AxisContent> = {
  food: {
    img: iconFood,
    tone: "from-secondary/30 via-primary/10 to-accent/15",
    donateHref: "/donate?sector=sector-food",
    caseSlugs: ["food", "ration"],
    ar: {
      title: "محور الغذاء",
      tag: "أمان غذائي للأسرة",
      lede:
        "بنوفّر غذاء كريم لأكثر الأسر احتياجًا في الدقهلية ومحافظات مصر، عبر مزارعنا الوقفية ومطابخ اليسر الدائمة وكرتونة الـ25 كيلو الشهرية.",
      pillars: [
        "كرتونة الـ25 كيلو الشهرية لكل أسرة",
        "مطبخ يومي يطرح آلاف الوجبات الساخنة",
        "أكثر من 5 طن لحوم بلدي سنويًا من مزارعنا",
        "توزيع موثّق بالصور والفيديو",
      ],
      programs: [
        { name: "كرتونة الغذاء الشهرية", desc: "كل ما تحتاجه الأسرة من سلع جافة لمدة شهر.", href: "/programs/box" },
        { name: "مطبخ اليسر اليومي", desc: "وجبات ساخنة متجددة توصل للصائمين والمحتاجين طوال العام.", href: "/programs/kitchen" },
        { name: "صك الأضحية", desc: "أضحية بضمان جودة مؤسسة اليسر يوم العيد.", href: "/programs/odhya" },
      ],
      impact: [
        { value: "9,520", label: "أسرة مستفيدة سنويًا" },
        { value: "+5 طن", label: "لحوم بلدي" },
        { value: "365", label: "يوم مطبخ مفتوح" },
      ],
    },
    en: {
      title: "Food Pillar",
      tag: "Food security for every family",
      lede:
        "We provide dignified food to the most deserving families across Dakahlia and Egypt — through our endowment farms, permanent kitchens, and the monthly 25 kg food box.",
      pillars: [
        "Monthly 25 kg food box per family",
        "Daily kitchen with thousands of hot meals",
        "Over 5 tons of farm-fresh meat each year",
        "Distribution documented with photos & video",
      ],
      programs: [
        { name: "Monthly food box", desc: "A full month of dry goods for one family.", href: "/programs/box" },
        { name: "Al-Yusr kitchen", desc: "Fresh hot meals reaching fasters and families in need throughout the year.", href: "/programs/kitchen" },
        { name: "Qurbani share", desc: "A premium-quality Qurbani delivered on Eid day.", href: "/programs/odhya" },
      ],
      impact: [
        { value: "9,520", label: "Families helped / year" },
        { value: "+5 tons", label: "Fresh meat" },
        { value: "365", label: "Days of open kitchen" },
      ],
    },
  },
  health: {
    img: iconHealth,
    tone: "from-accent/25 via-primary/10 to-secondary/20",
    donateHref: "/donate?sector=sector-health",
    caseSlugs: ["medication", "surgery", "medical", "health"],
    ar: {
      title: "محور الصحة",
      tag: "صحة الإنسان أولوية",
      lede:
        "نُموّل العمليات والعلاج للحالات العاجلة، ونسيّر القوافل الطبية للقرى النائية، ونتكفّل بالأطراف الصناعية وكراسي ذوي الهمم في مجمّعنا الطبي بالمنصورة.",
      pillars: [
        "تمويل عمليات وأدوية للحالات العاجلة",
        "قوافل علاجية في القرى النائية",
        "مركز غسيل كلوي ومجمّع طبي بالمنصورة",
        "أطراف صناعية وكراسي لذوي الهمم",
      ],
      programs: [
        { name: "حالات طبية عاجلة", desc: "تبرّع لحالة موثّقة تنتظر العلاج.", href: "/cases" },
        { name: "صدقة جارية للعلاج", desc: "اشترك شهريًا في تغطية تكاليف العلاج.", href: "/donate" },
        { name: "زكاة العلاج", desc: "وجّه زكاتك لتمويل الحالات الطبية المستحقة.", href: "/zakat" },
      ],
      impact: [
        { value: "+2,400", label: "حالة طبية تم علاجها" },
        { value: "+50", label: "قافلة طبية" },
        { value: "1", label: "مجمّع طبي بالمنصورة" },
      ],
    },
    en: {
      title: "Health Pillar",
      tag: "Human health is a priority",
      lede:
        "We fund surgeries and treatment for urgent cases, run medical caravans in remote villages, and provide prosthetics and wheelchairs through our medical complex in Mansoura.",
      pillars: [
        "Funding surgeries and medication for urgent cases",
        "Medical caravans in remote villages",
        "Dialysis center and medical complex in Mansoura",
        "Prosthetics and wheelchairs for the disabled",
      ],
      programs: [
        { name: "Urgent medical cases", desc: "Donate to a verified case awaiting treatment.", href: "/cases" },
        { name: "Monthly health Sadaqah", desc: "Subscribe monthly to cover treatment costs.", href: "/donate" },
        { name: "Treatment Zakat", desc: "Direct your Zakat to fund deserving medical cases.", href: "/zakat" },
      ],
      impact: [
        { value: "+2,400", label: "Treated medical cases" },
        { value: "+50", label: "Medical caravans" },
        { value: "1", label: "Medical complex in Mansoura" },
      ],
    },
  },
  education: {
    img: iconEdu,
    tone: "from-primary/15 via-secondary/20 to-accent/15",
    donateHref: "/donate?sector=sector-education",
    caseSlugs: ["education", "student", "school"],
    ar: {
      title: "محور التعليم",
      tag: "تعليم يكسر دورة الفقر",
      lede:
        "نكفل أبناء الأسر الأكثر فقرًا تعليميًا داخل مجمّعنا التعليمي، ونوفر لهم الدروس والمتابعة والحقائب والأدوات سنويًا.",
      pillars: [
        "كفالة تعليمية مستمرة لـ354 طالبًا",
        "دروس ومتابعة داخل المجمّع التعليمي",
        "حقائب وأدوات لكل عام دراسي",
        "متابعة فردية للدرجات والسلوك",
      ],
      programs: [
        { name: "كفالة طالب علم", desc: "ادعم طالبًا طوال العام بمصروفات وأدوات.", href: "/programs/education" },
        { name: "حقيبة العام الدراسي", desc: "حقيبة مدرسية مجهّزة بالكامل لطالب جديد.", href: "/programs/education" },
        { name: "دروس تقوية", desc: "ساهم في برنامج التقوية داخل المجمّع.", href: "/donate" },
      ],
      impact: [
        { value: "354", label: "طالب مكفول" },
        { value: "1", label: "مجمع تعليمي" },
        { value: "12", label: "شهر متابعة لكل طالب" },
      ],
    },
    en: {
      title: "Education Pillar",
      tag: "Education breaks the cycle",
      lede:
        "We sponsor children of the poorest families inside our educational complex, providing tutoring, follow-up, backpacks and tools every year.",
      pillars: [
        "Continuous education sponsorship for 354 students",
        "Tutoring and follow-up inside the complex",
        "Backpacks & tools each school year",
        "Individual grade & conduct follow-up",
      ],
      programs: [
        { name: "Sponsor a student", desc: "Support a student for a full year.", href: "/programs/education" },
        { name: "School-year backpack", desc: "A fully equipped backpack for a new student.", href: "/programs/education" },
        { name: "Tutoring program", desc: "Contribute to in-complex tutoring sessions.", href: "/donate" },
      ],
      impact: [
        { value: "354", label: "Sponsored students" },
        { value: "1", label: "Educational complex" },
        { value: "12", label: "Months of follow-up per student" },
      ],
    },
  },
};

const AxisDetail = () => {
  const { lang } = useLang();
  const isAR = lang === "ar";
  const Arrow = isAR ? ArrowLeft : ArrowRight;
  const params = useParams<{ slug: string }>();
  const slug = (params.slug || "").toLowerCase();

  const [liveAxis, setLiveAxis] = useState<LaravelAxis | null>(null);
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);

  // 1. Fetch live Axis data — API only, no localStorage cache
  useEffect(() => {
    if (!slug) return;
    axesApi.getBySlug(slug).then((res) => {
      if (res) setLiveAxis(res);
    }).catch(() => {});
  }, [slug]);

  const fallbackKey = (slug in AXES ? slug : "food") as AxisKey;
  const fallback = AXES[fallbackKey];

  const axisImg = liveAxis?.image && !liveAxis.image.includes("elyusr-local-mock.internal")
    ? formatServerImageUrl(liveAxis.image)
    : fallback.img;

  const t = useMemo(() => {
    const base = isAR ? fallback.ar : fallback.en;
    if (!liveAxis) return base;

    const title = (isAR ? liveAxis.name_ar : liveAxis.name_en) || base.title;
    const tag = (isAR ? liveAxis.badge_ar : liveAxis.badge_en) || base.tag;
    const lede = (isAR ? liveAxis.description_ar : liveAxis.description_en) || base.lede;
    const customBullets = isAR ? liveAxis.features_ar : liveAxis.features_en;
    const pillars = (customBullets && customBullets.length > 0) ? customBullets : base.pillars;

    // Statistics if available from backend
    let impact = base.impact;
    if (liveAxis.statistics && typeof liveAxis.statistics === "object") {
      const entries = Object.entries(liveAxis.statistics);
      if (entries.length > 0) {
        impact = entries.map(([key, val]) => {
          const formattedLabel = key === "students_supported" || key === "students_sponsored" ? (isAR ? "طالب مكفول" : "Sponsored students")
            : key === "beneficiary_families" ? (isAR ? "أسرة مستفيدة سنويًا" : "Families helped / year")
            : key === "fresh_meat_tons" ? (isAR ? "لحوم بلدي" : "Fresh meat")
            : key === "open_kitchen_days" ? (isAR ? "يوم مطبخ مفتوح" : "Days of open kitchen")
            : key === "treated_cases" ? (isAR ? "حالة طبية تم علاجها" : "Treated medical cases")
            : key === "medical_complexes" ? (isAR ? "مجمّع طبي بالمنصورة" : "Medical complex in Mansoura")
            : key === "educational_centers" ? (isAR ? "مجمّع تعليمي" : "Educational complex")
            : key === "follow_up_months" ? (isAR ? "أشهر متابعة سنوية" : "Months of follow-up")
            : key === "school_kits" ? (isAR ? "حقيبة مدرسية" : "School kits")
            : key.replace(/_/g, " ");
          return {
            value: String(val),
            label: formattedLabel,
          };
        });
      }
    }

    return {
      ...base,
      title,
      tag,
      lede,
      pillars,
      impact,
    };
  }, [liveAxis, fallback, isAR]);

  useEffect(() => {
    (async () => {
      try {
        const lists = await Promise.all(fallback.caseSlugs.map((s) => listPublicCases({ categorySlug: s, limit: 6 })));
        const merged: CaseRow[] = [];
        const seen = new Set<string>();
        for (const arr of lists) for (const c of arr) if (!seen.has(c.id)) { seen.add(c.id); merged.push(c); }
        setCases(merged.slice(0, 6));
      } catch { /* ignore */ }
      try {
        const all = await listPublicCampaigns();
        setCampaigns(all.filter((c) => c.status === "open").slice(0, 4));
      } catch { /* ignore */ }
    })();
  }, [slug, fallback]);

  return (
    <PageLayout>
      <SEOHelmet
        title={`${t.title} | ${isAR ? "اليسر" : "Al-Yusr"}`}
        description={t.lede.slice(0, 155)}
        path={`/axes/${slug}`}
        image={axisImg}
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          name: t.title,
          alternateName: t.tag,
          description: t.lede,
          image: axisImg,
          url: `https://elyusr.org/axes/${slug}`,
          provider: { "@type": "NGO", name: isAR ? "مؤسسة اليسر الخيرية" : "Al-Yusr Charity", url: "https://elyusr.org/" },
          areaServed: { "@type": "AdministrativeArea", name: "Dakahlia, Egypt" },
          serviceType: t.tag,
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: isAR ? "برامج المحور" : "Pillar programs",
            itemListElement: t.programs.map((p, i) => ({
              "@type": "Offer",
              position: i + 1,
              itemOffered: { "@type": "Service", name: p.name, description: p.desc, url: `https://elyusr.org${p.href}` },
            })),
          },
        })}</script>
      </Helmet>

      {/* Hero */}
      <section className="relative overflow-hidden bg-card">
        <div className="container mx-auto px-4 py-6 md:py-10">
          <div className="text-primary/80">
            <Breadcrumbs items={[{ name: isAR ? "الرئيسية" : "Home", href: "/" }, { name: isAR ? "محاور عملنا" : "Our pillars", href: "/#axes" }, { name: t.title }]} />
          </div>
          <div className="mt-4 grid items-center gap-8 md:grid-cols-[1fr_360px]">
            <div className="text-center md:text-start">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-card/70 px-3 py-1 text-[11px] font-extrabold text-primary backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" /> {t.tag}
              </span>
              <h1 className="mt-3 text-3xl font-black leading-tight text-primary md:text-5xl">{t.title}</h1>
              <p className="mt-3 mx-auto max-w-2xl text-sm font-semibold leading-7 text-foreground/80 md:mx-0 md:text-base">{t.lede}</p>
              <div className="mt-5 flex flex-wrap justify-center gap-2 md:justify-start">
                <Button asChild size="lg" className="bg-orange-grad text-accent-foreground shadow-cta hover:opacity-95">
                  <Link to={fallback.donateHref}><Heart className="h-5 w-5" /> {isAR ? "تبرع لهذا المحور" : "Donate to this pillar"}</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/cases">{isAR ? "تصفح الحالات" : "Browse cases"} <Arrow className="h-4 w-4" /></Link>
                </Button>
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-[360px] overflow-hidden rounded-3xl border border-primary/10 shadow-card">
              <img src={axisImg} alt={t.title} className="block h-auto w-full object-cover aspect-[4/3]" loading="lazy" />
            </div>
          </div>
        </div>
      </section>

      {/* Impact strip */}
      <section className="bg-card">
        <div className="container mx-auto grid grid-cols-1 gap-3 px-4 py-6 md:grid-cols-3 md:py-8">
          {t.impact.map((k) => (
            <div key={k.label} className="rounded-2xl bg-muted/40 p-4 text-center shadow-soft">
              <div className="text-xl font-black text-primary md:text-3xl">{k.value}</div>
              <div className="mt-1 text-[11px] font-bold text-muted-foreground md:text-xs">{k.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Pillars */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto max-w-5xl px-4">
          <h2 className="text-center text-2xl font-black text-primary md:text-3xl">{isAR ? "ما الذي نقدّمه؟" : "What we deliver"}</h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {t.pillars.map((p) => (
              <li key={p} className="flex items-start gap-3 rounded-2xl bg-card p-4 shadow-soft">
                <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-secondary/25 text-primary">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
                <span className="text-sm font-semibold leading-6 text-foreground/85">{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Programs */}
      <section className="bg-muted/30 py-12 md:py-16">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-black text-primary md:text-3xl">{isAR ? "البرامج التابعة للمحور" : "Programs in this pillar"}</h2>
            <Link to="/programs" className="text-xs font-extrabold text-accent hover:underline">{isAR ? "كل البرامج" : "All programs"} <Arrow className="inline h-3 w-3" /></Link>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {t.programs.map((p) => (
              <Link key={p.name} to={p.href} className="group rounded-2xl bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-card">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-secondary/20 text-primary"><Target className="h-5 w-5" /></div>
                <h3 className="mt-3 text-base font-extrabold text-primary">{p.name}</h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{p.desc}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-extrabold text-accent transition-all group-hover:gap-2">
                  {isAR ? "افتح البرنامج" : "Open program"} <Arrow className="h-3 w-3" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Related cases */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-black text-primary md:text-3xl">{isAR ? "حالات مرتبطة بالمحور" : "Related cases"}</h2>
            <Link to="/cases" className="text-xs font-extrabold text-accent hover:underline">{isAR ? "كل الحالات" : "All cases"} <Arrow className="inline h-3 w-3" /></Link>
          </div>
          {cases.length === 0 ? (
            <p className="mt-5 rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground shadow-soft">
              {isAR ? "لا توجد حالات معتمدة في هذا المحور حاليًا." : "No approved cases for this pillar right now."}
            </p>
          ) : (
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {cases.map((c) => (
                <Link key={c.id} to={`/cases/${c.ref_code}`} className="group overflow-hidden rounded-2xl bg-card shadow-soft transition hover:-translate-y-0.5 hover:shadow-card">
                  {c.cover_image_url && <img src={c.cover_image_url} alt="" className="h-36 w-full object-cover" loading="lazy" />}
                  <div className="p-4">
                    <h3 className="line-clamp-2 text-sm font-extrabold text-primary">{c.title}</h3>
                    <p className="mt-1 text-[11px] text-muted-foreground" dir="ltr">#{c.ref_code}</p>
                    <div className="mt-2 flex items-center justify-between text-[11px] font-bold text-muted-foreground">
                      <span>{Number(c.raised_amount).toLocaleString()} / {Number(c.needed_amount).toLocaleString()} EGP</span>
                      <span className="text-accent">{isAR ? "عرض" : "View"} <Arrow className="inline h-3 w-3" /></span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Campaigns */}
      {campaigns.length > 0 && (
        <section className="bg-muted/30 py-12 md:py-16">
          <div className="container mx-auto max-w-5xl px-4">
            <div className="flex items-end justify-between">
              <h2 className="text-2xl font-black text-primary md:text-3xl">{isAR ? "حملات تطوع نشطة" : "Open volunteer campaigns"}</h2>
              <Link to="/campaigns" className="text-xs font-extrabold text-accent hover:underline">{isAR ? "كل الحملات" : "All campaigns"} <Arrow className="inline h-3 w-3" /></Link>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {campaigns.map((c) => (
                <Link key={c.id} to={`/campaigns/${c.slug}`} className="rounded-2xl bg-card p-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-card">
                  <div className="flex items-start gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent"><Megaphone className="h-5 w-5" /></span>
                    <div className="min-w-0">
                      <h3 className="text-sm font-extrabold text-primary">{isAR ? c.title_ar : c.title_en}</h3>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{isAR ? c.description_ar : c.description_en}</p>
                      <p className="mt-1 text-[11px] font-bold text-muted-foreground" dir="ltr">{c.event_date} · {c.location}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="pattern-hero-luxe hero-pattern-fade py-10 text-primary-foreground  md:py-14">
        <div className="container mx-auto max-w-6xl pb-10 px-4 text-center">
          <Users className="mx-auto h-8 w-8 opacity-80" />
          <h2 className="mt-3 text-2xl font-black md:text-3xl">{isAR ? "كن جزءًا من قصة المحور" : "Be part of this pillar's story"}</h2>
          <p className="mt-2 text-sm text-primary-foreground/80">{isAR ? "تبرعك يصل إلى أهله موثّقًا بالصور والفيديو." : "Your donation reaches its recipients — documented with photos and video."}</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button asChild size="lg" className="bg-orange-grad text-accent-foreground shadow-cta hover:opacity-95">
              <Link to={fallback.donateHref}><Heart className="h-5 w-5" /> {isAR ? "تبرع الآن" : "Donate now"}</Link>
            </Button>
            <Button asChild size="lg"  className="border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10">
              <Link to="/volunteer"><FileText className="h-5 w-5" /> {isAR ? "تطوع معنا" : "Volunteer"}</Link>
            </Button>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default AxisDetail;