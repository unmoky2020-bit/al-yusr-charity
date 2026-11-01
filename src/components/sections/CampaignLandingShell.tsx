import { ReactNode, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, CheckCircle2, ShieldCheck, MapPin, Truck, FileCheck2, X, Share2, Copy, Check, Sparkles } from "lucide-react";
import { WhatsAppIcon } from "@/components/common/icons/WhatsAppIcon";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { LocalFAQ, FAQItem } from "@/components/common/LocalFAQ";
import { useLang } from "@/i18n/LangContext";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import { LinkedCasesSection } from "@/components/cases/LinkedCasesSection";
import { getCampaignPageMeta } from "@/data/campaignPages/index";

export type LandingProps = {
  slug: string;
  path: string;
  titleAr: string;
  titleEn: string;
  taglineAr: string;
  taglineEn: string;
  metaDescAr: string;
  metaDescEn: string;
  heroImage: string;
  heroAlt: string;
  badgeAr?: string;
  badgeEn?: string;
  pillars?: { iconImg?: string; titleAr: string; titleEn: string; descAr: string; descEn: string }[];
  steps?: { titleAr: string; titleEn: string; descAr: string; descEn: string }[];
  gallery?: { src: string; altAr: string; altEn: string }[];
  pricing?: { labelAr: string; labelEn: string; amount: number; tagAr?: string; tagEn?: string }[];
  faq: { ar: FAQItem[]; en: FAQItem[] };
  donateHref: string;
  donateLabelAr?: string;
  donateLabelEn?: string;
  relatedLinks?: { href: string; ar: string; en: string }[];
  bottomCtaAr?: string;
  bottomCtaEn?: string;
  bottomSubAr?: string;
  bottomSubEn?: string;
  /** Dashboard SEO override; empty strings fall back to the static title/description. */
  seo?: { title?: { ar: string; en: string }; description?: { ar: string; en: string } };
  body?: ReactNode;
  /** Bespoke hero for campaigns with their own visual identity (replaces the default hero). */
  hero?: ReactNode;
  /** Bespoke main content (replaces trust strip, pricing, pillars, steps, body and gallery). */
  main?: ReactNode;
  /** Extra classes for the closing CTA section (e.g. a seasonal theme). */
  finalCtaClassName?: string;
  /** Optional decoration rendered at the top of the closing CTA. */
  finalCtaDecor?: ReactNode;
  /** Parent breadcrumb (defaults to the campaigns hub); project landings point at /projects. */
  crumbParent?: { ar: string; en: string; href: string };
};

export const CampaignLandingShell = (p: LandingProps) => {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const campaignId = getCampaignPageMeta(p.slug)?.apiIds[0];
  const [stickyOpen, setStickyOpen] = useState(true);
  const [scrolledPastHero, setScrolledPastHero] = useState(false);
  const [hideNearFooter, setHideNearFooter] = useState(false);
  const [copied, setCopied] = useState(false);

  const wa = `https://wa.me/201097000137?text=${encodeURIComponent(
    isAr ? `السلام عليكم، حابب استفسر عن تبرع ${p.titleAr}.` : `Hi, I would like to inquire about ${p.titleEn}.`
  )}`;

  const pageUrl = `https://elyusr.org${p.path}`;
  const shareText = isAr
    ? `🌿 ساهم معنا في ${p.titleAr} مع مؤسسة اليسر الخيرية — كل تبرع موثق بصور وفيديو ويصل لمستحقيه بكرامة: ${pageUrl}`
    : `🌿 Support ${p.titleEn} with Al-Yusr Charity Foundation — 100% verified with photos & videos: ${pageUrl}`;

  const copyShareLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(pageUrl).then(() => {
        setCopied(true);
        toast.success(isAr ? "تم نسخ رابط الحملة للمشاركة " : "Campaign link copied ");
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => {});
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const k = `cta-dismissed-${p.slug}`;
    if (sessionStorage.getItem(k)) setStickyOpen(false);

    const handleScroll = () => {
      setScrolledPastHero(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    // Auto-hide floating CTA bar before reaching the footer
    const footer = document.querySelector("footer");
    if (!footer) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setHideNearFooter(entry.isIntersecting);
      },
      { rootMargin: "60px 0px 0px 0px" }
    );
    observer.observe(footer);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, [p.slug]);

  const cleanCrumbTitle = isAr
    ? p.titleAr.includes("—") ? p.titleAr.split("—")[0].trim() : p.titleAr
    : p.titleEn.includes("—") ? p.titleEn.split("—")[0].trim() : p.titleEn;

  return (
    <PageLayout>
      <SEOHelmet
        title={(isAr ? p.seo?.title?.ar : p.seo?.title?.en) || (isAr ? `${p.titleAr} | مؤسسة اليسر — الدقهلية والمنصورة وكافة محافظات مصر` : `${p.titleEn} | Al-Yusr Charity Foundation — Egypt`)}
        description={(isAr ? p.seo?.description?.ar : p.seo?.description?.en) || (isAr ? p.metaDescAr : p.metaDescEn)}
        path={p.path}
        image={p.heroImage}
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "NGO",
              name: "مؤسسة اليسر للتنمية",
              alternateName: ["مؤسسة اليسر الخيرية", "جمعية اليسر", "Al-Yusr Charity Foundation"],
              url: "https://elyusr.org/",
              logo: "https://elyusr.org/logo-512.png",
              telephone: "+201097000137",
              taxID: "2665/2019",
              areaServed: ["Egypt", "Dakahlia", "Mansoura", "Mit Ghamr", "Talkha", "Belqas", "Kafr El Sheikh"],
            },
            {
              "@type": "DonateAction",
              name: isAr ? p.titleAr : p.titleEn,
              description: isAr ? p.metaDescAr : p.metaDescEn,
              recipient: { "@type": "NGO", name: "مؤسسة اليسر للتنمية", url: "https://elyusr.org/" },
              target: `https://elyusr.org${p.donateHref}`,
            },
            {
              "@type": "WebPage",
              "@id": pageUrl,
              url: pageUrl,
              name: isAr ? p.titleAr : p.titleEn,
              description: isAr ? p.metaDescAr : p.metaDescEn,
              speakable: {
                "@type": "SpeakableSpecification",
                cssSelector: [".ai-overview-content", "#local-faq"],
              },
            }
          ]
        })}</script>
      </Helmet>

      {/* Invisible High-Intent Semantic AI Overview microdata (indexed by Google SGE, Perplexity, Gemini, Bing without UI clutter) */}
      <div className="sr-only ai-overview-content" aria-hidden="false">
        <h2>{isAr ? p.titleAr : p.titleEn}</h2>
        <p>{isAr ? p.taglineAr : p.taglineEn}</p>
        <p>{isAr ? p.metaDescAr : p.metaDescEn}</p>
        <p>
          {isAr
            ? "مؤسسة اليسر الخيرية للتنمية مشهرة برقم 2665 لسنة 2019 بوزارة التضامن الاجتماعي. تغطي حملاتنا محافظة الدقهلية (المنصورة، ميت غمر، طلخا، بلقاس، شربين، السنبلاوين) وكافة محافظات مصر. يتم توثيق 100% من التبرعات وإيصالها بكرامة مع إرسال صور وفيديوهات للمتبرع."
            : "Al-Yusr Charity Foundation is officially registered under No. 2665/2019 with the Egyptian Ministry of Social Solidarity. We cover Dakahlia (Mansoura, Mit Ghamr, Talkha) and all Egypt governorates with 100% verified photo and video proof sent directly to donors."}
        </p>
      </div>

      {p.hero ?? (
      <section className="relative overflow-x-clip pattern-hero-luxe hero-pattern-fade text-primary-foreground w-full">
        <div className="pointer-events-none absolute inset-0 leaf-bg opacity-30" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(150_55%_28%/0.4),transparent_60%)]" />
        <div className="container relative mx-auto max-w-6xl px-4 pt-14 sm:pt-16 pb-10 md:pt-24 md:pb-14">
          <div className="mb-4 flex justify-center md:justify-start overflow-x-auto max-w-full">
            <Breadcrumbs items={[
              { name: isAr ? "الرئيسية" : "Home", href: "/" },
              p.crumbParent
                ? { name: isAr ? p.crumbParent.ar : p.crumbParent.en, href: p.crumbParent.href }
                : { name: isAr ? "الحملات" : "Campaigns", href: "/campaigns" },
              { name: cleanCrumbTitle },
            ]} />
          </div>
          <div className="mt-6 grid items-center gap-8 md:grid-cols-2 min-w-0 w-full">
            <div className="text-center md:text-start flex flex-col items-center md:items-start min-w-0 w-full">
              {(p.badgeAr || p.badgeEn) && (
                <span className="inline-flex items-center justify-center text-center gap-1.5 rounded-full bg-[hsl(45_85%_65%/0.18)] px-3.5 py-1.5 text-xs font-bold text-[hsl(45_90%_72%)] max-w-full leading-normal">
                  <ShieldCheck className="h-4 w-4 shrink-0" /> {isAr ? p.badgeAr : p.badgeEn}
                </span>
              )}
              <h1 className="mt-3 text-xl xs:text-2xl sm:text-3xl font-black leading-snug sm:leading-tight md:text-4xl lg:text-5xl text-balance break-words max-w-full">
                {isAr ? p.titleAr : p.titleEn}
              </h1>
              <p className="mt-3 sm:mt-4 text-xs sm:text-sm leading-relaxed text-primary-foreground/90 sm:text-base md:text-lg max-w-xl text-balance">
                {isAr ? p.taglineAr : p.taglineEn}
              </p>
              <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-center md:justify-start gap-3 w-full max-w-md">
                <Button asChild size="lg" className="w-full sm:w-auto flex-1 min-h-[44px] h-auto py-2.5 px-4 sm:px-6 text-xs sm:text-sm md:text-base font-black bg-orange-grad text-accent-foreground shadow-cta hover:opacity-95">
                  <Link to={p.donateHref} className="inline-flex items-center justify-center gap-2 text-center leading-normal">
                    <Heart className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                    <span>{isAr ? (p.donateLabelAr || "تبرع الآن") : (p.donateLabelEn || "Donate now")}</span>
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="w-full sm:w-auto flex-1 min-h-[44px] h-auto py-2.5 px-4 sm:px-6 text-xs sm:text-sm md:text-base font-black bg-background/10 text-primary-foreground border-primary-foreground/30 hover:bg-background/20">
                  <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 text-center leading-normal">
                    <WhatsAppIcon className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                    <span>{isAr ? "تواصل واتساب" : "WhatsApp"}</span>
                  </a>
                </Button>
              </div>

              {/* 1-Click Viral Social Share Pill */}
              <div className="mt-4 flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs text-primary-foreground/75 w-full">
                <span className="font-bold">{isAr ? "انشر تؤجر:" : "Share & multiply reward:"}</span>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Share on WhatsApp"
                  className="inline-flex items-center gap-1 rounded-full bg-emerald-600/30 px-2.5 py-1 font-bold text-emerald-300 hover:bg-emerald-600/50 transition"
                >
                  <WhatsAppIcon className="h-3.5 w-3.5" />
                  <span>واتساب</span>
                </a>
                <button
                  type="button"
                  onClick={copyShareLink}
                  aria-label="Copy link"
                  className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 font-bold text-primary-foreground hover:bg-white/20 transition"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-secondary" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? (isAr ? "تم النسخ" : "Copied") : (isAr ? "نسخ الرابط" : "Copy")}</span>
                </button>
              </div>
            </div>
            <div className="relative w-full flex justify-center min-w-0 mt-4 md:mt-0">
              <img src={p.heroImage} alt={p.heroAlt} loading="eager" className="mx-auto max-h-[380px] sm:max-h-[440px] md:max-h-[460px] w-auto max-w-[85vw] sm:max-w-sm md:max-w-none rounded-3xl object-contain shadow-cta ring-1 ring-primary-foreground/20" />
            </div>
          </div>
        </div>
      </section>
      )}

      {p.main ?? (<>
      {/* Trust strip (CRO + AEO) */}
      <section aria-label={isAr ? "ضمانات وتوثيق" : "Guarantees & proof"} className="border-y border-border bg-card">
        <div className="container mx-auto max-w-6xl px-4 py-4">
          <ul className="grid grid-cols-2 gap-2 text-[11px] font-extrabold text-primary md:grid-cols-4 md:text-xs">
            {[
              { icon: ShieldCheck, ar: "ترخيص ٢٦٦٥/٢٠١٩", en: "License 2665/2019" },
              { icon: FileCheck2,  ar: "توثيق صور وفيديو", en: "Photo & video proof" },
              { icon: Truck,       ar: "توصيل مجاني للباب", en: "Free doorstep delivery" },
              { icon: CheckCircle2,ar: "مصاريف إدارية أقل من ٨٪", en: "Admin costs under 8%" },
            ].map(({ icon: Icon, ar, en }) => (
              <li key={en} className="inline-flex items-center justify-center gap-1.5 rounded-full border border-border bg-background px-3 py-2 text-center shadow-soft">
                <Icon className="h-3.5 w-3.5 text-secondary" />
                <span>{isAr ? ar : en}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Pricing strip */}
      {p.pricing && p.pricing.length > 0 && (
        <section className="bg-muted/30 py-10">
          <div className="container mx-auto max-w-5xl px-4">
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {p.pricing.map((pr, i) => (
                <Link key={i} to={`${p.donateHref}${p.donateHref.includes("?") ? "&" : "?"}amount=${pr.amount}`}
                  className="group rounded-2xl border border-border bg-card p-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-cta">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-primary">{isAr ? pr.labelAr : pr.labelEn}</span>
                    {(pr.tagAr || pr.tagEn) && <span className="rounded-full bg-secondary/15 px-2 py-0.5 text-[10px] font-bold text-secondary">{isAr ? pr.tagAr : pr.tagEn}</span>}
                  </div>
                  <div className="mt-2 text-2xl font-black text-accent">{pr.amount.toLocaleString("en-EG")} <span className="text-xs font-bold text-muted-foreground">{isAr ? "جنيه" : "EGP"}</span></div>
                  <div className="mt-2 text-[11px] font-bold text-accent group-hover:underline">{isAr ? "تبرع بهذا المبلغ ←" : "Donate this amount →"}</div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Pillars */}
      {p.pillars && p.pillars.length > 0 && (
      <section className="py-12 md:py-16">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="text-center text-2xl font-black text-primary md:text-3xl">
            {isAr ? "ليه تختار اليسر لهذه الحملة؟" : "Why choose Al-Yusr for this campaign?"}
          </h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {p.pillars.map((pl, i) => (
              <article key={i} className="rounded-2xl border border-border bg-card p-5 text-center shadow-soft">
                {pl.iconImg && <img src={pl.iconImg} alt="" loading="lazy" className="mx-auto h-14 w-14 object-contain" />}
                <h3 className="mt-3 text-base font-extrabold text-primary">{isAr ? pl.titleAr : pl.titleEn}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{isAr ? pl.descAr : pl.descEn}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* How it works */}
      {p.steps && p.steps.length > 0 && (
      <section className="bg-muted/30 py-12 md:py-16">
        <div className="container mx-auto max-w-5xl px-4">
          <h2 className="text-center text-2xl font-black text-primary md:text-3xl">
            {isAr ? "كيف تتم العملية خطوة بخطوة" : "How it works — step by step"}
          </h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-2">
            {p.steps.map((s, i) => (
              <li key={i} className="relative rounded-2xl border border-border bg-card p-5 shadow-soft">
                <span className="absolute -top-3 start-5 rounded-full bg-accent px-3 py-1 text-xs font-black text-accent-foreground">{i + 1}</span>
                <h3 className="mt-2 text-base font-extrabold text-primary">{isAr ? s.titleAr : s.titleEn}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{isAr ? s.descAr : s.descEn}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
      )}

      {/* Body */}
      {p.body && (
        <section className="py-12 md:py-16">
          <div className="container mx-auto max-w-5xl px-4">{p.body}</div>
        </section>
      )}

      {/* Gallery */}
      {p.gallery && p.gallery.length > 0 && (
        <section className="bg-muted/30 py-12 md:py-16">
          <div className="container mx-auto max-w-6xl px-4">
            <h2 className="text-center text-2xl font-black text-primary md:text-3xl">
              {isAr ? "نماذج توثيق ميدانية" : "Field documentation"}
            </h2>
            <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
              {p.gallery.map((g, i) => (
                <figure key={i} className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
                  <img src={g.src} alt={isAr ? g.altAr : g.altEn} loading="lazy" className="aspect-square h-full w-full object-cover transition hover:scale-105" />
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      </>)}

      {/* Cases linked to this campaign in the dashboard (renders nothing when there are none). */}
      {campaignId && (
        <LinkedCasesSection filter={{ campaignId }} isRTL={isAr} className="bg-muted/30"
          title={isAr ? "حالات بتتجمع لها التبرعات في الحملة دي" : "Cases this campaign is funding"}
          subtitle={isAr ? "اختار حالة بعينها وتابع تحديثاتها بالصور لحد ما تكتمل." : "Pick a specific case and follow its photo updates until it is complete."} />
      )}

      {/* Related links */}
      {p.relatedLinks && p.relatedLinks.length > 0 && (
        <section className="py-10">
          <div className="container mx-auto max-w-5xl px-4">
            <h2 className="text-center text-xl font-black text-primary md:text-2xl">{isAr ? "حملات وبرامج ذات صلة" : "Related programs & campaigns"}</h2>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {p.relatedLinks.map((r, i) => (
                <Link key={i} to={r.href} className="rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-bold text-primary shadow-soft transition hover:bg-primary hover:text-primary-foreground">
                  {isAr ? r.ar : r.en}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <LocalFAQ items={isAr ? p.faq.ar : p.faq.en} donateHref={p.donateHref} id={`${p.slug}-faq`} />

      {/* Final CTA — 2 buttons side by side in one single row on mobile & desktop */}
      <section className={`relative overflow-hidden pt-14 pb-28 sm:pb-36 md:pt-16 md:pb-44 text-primary-foreground ${p.finalCtaClassName ?? "pattern-hero-luxe"}`}>
        {p.finalCtaDecor ?? <div className="pointer-events-none absolute inset-0 leaf-bg opacity-25" />}
        <div className="container relative mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-2xl font-black md:text-3xl">{isAr ? (p.bottomCtaAr || "ابدأ تبرعك الآن") : (p.bottomCtaEn || "Start your donation now")}</h2>
          <p className="mt-3 text-primary-foreground/80">{isAr ? (p.bottomSubAr || "كل جنيه يصل لمستحقه — موثّق بالصور والفيديو ومتابعة ميدانية.") : (p.bottomSubEn || "Every EGP reaches the right hands — verified with photos, video and field follow-up.")}</p>
          <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 max-w-md mx-auto w-full px-2">
            <Button asChild size="lg" className="w-full sm:w-auto flex-1 min-h-[46px] h-auto py-3 px-4 sm:px-6 text-sm sm:text-base font-black bg-orange-grad text-accent-foreground shadow-cta hover:opacity-95">
              <Link to={p.donateHref} className="inline-flex items-center justify-center gap-2 text-center leading-normal">
                <Heart className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                <span>{isAr ? (p.donateLabelAr || "تبرع الآن") : (p.donateLabelEn || "Donate now")}</span>
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto flex-1 min-h-[46px] h-auto py-3 px-4 sm:px-6 text-sm sm:text-base font-black bg-background/10 text-primary-foreground border-primary-foreground/30 hover:bg-background/20">
              <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 text-center leading-normal">
                <WhatsAppIcon className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                <span>{isAr ? "تواصل واتساب" : "WhatsApp"}</span>
              </a>
            </Button>
          </div>
          <p className="mt-5 text-sm text-primary-foreground/80">
            {isAr ? "تبرعك يوصل بعناية ومتابعة ميدانية." : "Your support arrives with care and field follow-up."}
          </p>
        </div>
      </section>

      {/* Sticky bottom CTA — universal CRO bar, appears only after scrolling past hero & auto-hidden before footer */}
      {stickyOpen && !hideNearFooter && scrolledPastHero && (
        <div className="fixed inset-x-0 bottom-0 z-[60] px-3 pb-3 md:px-6 md:pb-4 transition-all duration-300 animate-fade-in-up" role="region" aria-label={isAr ? "تبرع سريع" : "Quick donate"}>
          <div className="mx-auto flex max-w-5xl items-center gap-3 rounded-2xl border border-secondary/40 bg-primary/95 p-3 shadow-2xl backdrop-blur md:p-4">
            <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary/20 text-secondary sm:flex">
              <Heart className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-black text-primary-foreground md:text-base">
                {isAr ? p.titleAr : p.titleEn}
              </div>
              <div className="mt-0.5 truncate text-[11px] font-extrabold text-secondary md:text-xs">
                {isAr ? "موثّق · توصيل مجاني · تتبّع تبرعك" : "Verified · free delivery · track your donation"}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button asChild size="sm" className="bg-orange-grad text-accent-foreground shadow-cta hover:opacity-95 whitespace-nowrap">
                <Link to={p.donateHref} className="inline-flex items-center gap-1.5"><Heart className="h-4 w-4 shrink-0" /><span>{isAr ? "تبرع الآن" : "Donate"}</span></Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="hidden gap-1 border-secondary/40 bg-transparent text-primary-foreground hover:bg-secondary/20 hover:text-primary-foreground sm:inline-flex">
                <a href={wa} target="_blank" rel="noopener noreferrer"><WhatsAppIcon className="h-4 w-4 shrink-0" /><span>{isAr ? "واتساب" : "WhatsApp"}</span></a>
              </Button>
              <button
                type="button"
                aria-label={isAr ? "إخفاء" : "Dismiss"}
                onClick={() => { setStickyOpen(false); try { sessionStorage.setItem(`cta-dismissed-${p.slug}`, "1"); } catch {} }}
                className="grid h-8 w-8 place-items-center rounded-full text-primary-foreground/60 hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
};

export default CampaignLandingShell;