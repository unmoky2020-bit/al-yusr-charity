import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Heart,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Laptop,
  ArrowRight,
  ArrowLeft,
  Coins,
  BadgeCheck,
  Share2,
  Copy,
  Check,
  Zap,
  Building2,
  Clock,
  Phone,
  HelpCircle,
  Users2,
  Globe2,
  X,
  ExternalLink,
} from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { BreadcrumbSchema } from "@/components/common/Schemas";
import { Helmet } from "react-helmet-async";
import { useLang } from "@/i18n/LangContext";
import { toast } from "sonner";
import { WhatsAppIcon } from "@/components/common/icons/WhatsAppIcon";

import { ScrollExpandMedia } from "@/components/sections/ScrollExpandMedia";
import { ArbounMarqueeBanner } from "@/components/sections/ArbounMarqueeBanner";
import { ArbounCalculator } from "@/components/sections/ArbounCalculator";
import { GalleryCarousel } from "@/components/sections/GalleryCarousel";
import { StickyStack, StickyStackItem } from "@/components/ui/sticky-stack";

import posterEducation from "@/assets/poster-education.png";
import { HadithBlock } from "@/components/campaigns/HadithBlock";
import { useCampaignPage } from "@/hooks/useCampaignPage";
import ARBOUN_DEFAULTS from "@/data/campaignPages/arboun";

import { campaignDonateHref } from "@/data/campaignPages/index";

const DONATE = campaignDonateHref("arboun");
/**
 * مبادرة عربون خير — للفريلانسرز والمستقلين
 * Al-Yusr Freelancers & Remote Workers Initiative
 */
const ArbounLanding = () => {
  const { lang } = useLang();
  const isRTL = lang === "ar";
  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  // Editable content (code defaults merged with the dashboard override).
  const { c, t, section, images } = useCampaignPage("arboun", ARBOUN_DEFAULTS);
  const items = (key: string) => section(key)?.items ?? [];
  const label = (id: string) => items("labels").find((i) => i.id === id);

  const [copiedLink, setCopiedLink] = useState(false);
  const [stickyOpen, setStickyOpen] = useState(true);
  const [hideInVideoSection, setHideInVideoSection] = useState(false);
  const [scrolledPastMarquee, setScrolledPastMarquee] = useState(false);
  const [hideNearFooter, setHideNearFooter] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const pageUrl = "https://elyusr.org/arboun";

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(pageUrl).then(() => {
        setCopiedLink(true);
        toast.success(t(label("share_link")?.desc));
        setTimeout(() => setCopiedLink(false), 2000);
      });
    }
  };

  useEffect(() => {
    const videoSec = document.getElementById("arboun-video-section");
    const marqueeSec = document.getElementById("arboun-marquee-section");

    const observer = new IntersectionObserver(
      (entries) => {
        const isAnyIntersecting = entries.some((entry) => entry.isIntersecting);
        setHideInVideoSection(isAnyIntersecting);
      },
      { threshold: 0.02 }
    );

    if (videoSec) observer.observe(videoSec);
    if (marqueeSec) observer.observe(marqueeSec);

    // Hide floating CTA when footer or newsletter section becomes visible
    const footerObserver = new IntersectionObserver(
      (entries) => {
        const isAnyIntersecting = entries.some((entry) => entry.isIntersecting);
        setHideNearFooter(isAnyIntersecting);
      },
      { threshold: 0.01 }
    );

    const footerEl = document.getElementById("contact") ?? document.querySelector("footer");
    if (footerEl) footerObserver.observe(footerEl);

    const handleScroll = () => {
      const calcSec = document.getElementById("arboun-calculator-section");
      if (calcSec) {
        const rect = calcSec.getBoundingClientRect();
        setScrolledPastMarquee(rect.top < window.innerHeight - 50);
      } else {
        setScrolledPastMarquee(window.scrollY > 1400);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      observer.disconnect();
      footerObserver.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Suggested shares: amounts/labels/notes from `prices`; the small tag above each name from `sections.shares`.
  const shareTags = items("shares");
  const PRICING_SHARES = c.prices.map((p) => ({
    id: p.id,
    label: t(p.label),
    amount: p.amount,
    tag: t(shareTags.find((i) => i.id === p.id)?.title),
    desc: t(p.note),
  }));

  const pillarStickyOffsets = [
    "top-[80px] md:top-[90px]",
    "top-[100px] md:top-[110px]",
    "top-[120px] md:top-[130px]",
  ];

  const stickyOffsets = [
    "top-[84px] md:top-[96px]",
    "top-[100px] md:top-[116px]",
    "top-[116px] md:top-[136px]",
    "top-[132px] md:top-[156px]",
  ];

  const shareStickyOffsets = [
    "top-[80px] md:top-[90px]",
    "top-[94px] md:top-[106px]",
    "top-[108px] md:top-[122px]",
    "top-[122px] md:top-[138px]",
    "top-[136px] md:top-[154px]",
    "top-[150px] md:top-[170px]",
  ];

  // Pillar visuals/links stay in code (keyed by content id); texts come from `sections.pillars` + `sections.pillar_details`.
  const PILLAR_CONFIG: Record<string, { num: string; icon: JSX.Element; actionHref: string; isOrange: boolean }> = {
    pillar_peace: { num: "01", icon: <Zap className="h-7 w-7 text-orange-400" />, actionHref: "#arboun-calculator", isOrange: true },
    pillar_skill_zakat: { num: "02", icon: <Laptop className="h-7 w-7 text-lime-400" />, actionHref: "#pricing-shares", isOrange: false },
    pillar_eternal_roi: { num: "03", icon: <Heart className="h-7 w-7 text-orange-400" />, actionHref: DONATE, isOrange: true },
  };
  const pillarDetails = items("pillar_details");
  const PILLARS = items("pillars").map((p, idx) => {
    const cfg = PILLAR_CONFIG[p.id] ?? {
      num: String(idx + 1).padStart(2, "0"),
      icon: <Sparkles className="h-7 w-7 text-lime-400" />,
      actionHref: DONATE,
      isOrange: idx % 2 === 0,
    };
    const d = pillarDetails.find((i) => i.id === p.id);
    return {
      id: p.id,
      ...cfg,
      tag: t(d?.title),
      title: t(p.title),
      quote: t(p.extra),
      desc: t(p.desc),
      bullets: t(d?.desc)
        .split(" · ")
        .map((b) => b.trim())
        .filter(Boolean),
      actionLabel: t(d?.extra),
    };
  });

  const STEPS = items("steps").map((st) => ({ id: st.id, title: t(st.title), desc: t(st.desc) }));

  // Rotating pictures at the end of the page (dashboard → الصور → معرض الصور في آخر الصفحة).
  const GALLERY = images("gallery").map((g) => ({ src: g.src, altAr: g.altAr, altEn: g.altEn, badgeAr: isRTL ? g.captionAr : g.captionEn }));
  const videoPoster = images("video_poster")[0]?.src ?? posterEducation;

  const RELATED_LINKS = [
    { href: "/athar", ar: "حملة أَثَر (التعليم وبناء المستقبل)", en: "Athar Campaign (Education)" },
    { href: "/dhill", ar: "حملة ظِلّ (الصدقات الجارية والمياه)", en: "Dhill Campaign (Water & Roofs)" },
    { href: "/markoun", ar: "حملة مَرْكون (الأثاث والأجهزة)", en: "Markoun Campaign (In-Kind Reuse)" },
    { href: "/setr", ar: "حملة سِتر (تسقيف الشتاء والكسوة)", en: "Setr Campaign (Winter Relief)" },
    { href: "/trust", ar: "الشفافية والتقارير الميدانية والمحاسبية", en: "Transparency & Field Reports" },
  ];

  const FAQS = c.faq.map((f) => ({ q: t(f.q), a: t(f.a) }));

  const hadith = {
    ar: c.hadith.text.ar,
    en: c.hadith.text.en,
    sourceAr: c.hadith.source.ar,
    sourceEn: c.hadith.source.en,
  };

  return (
    <PageLayout>
      <SEOHelmet
        title={c.seo?.title?.[isRTL ? "ar" : "en"] || (isRTL ? "عربون خير — مبادرة اليسر للمستقلين | مؤسسة اليسر الخيرية" : "Arboun Khair Initiative | Al-Yusr Charity Foundation")}
        description={c.seo?.description?.[isRTL ? "ar" : "en"] || (isRTL ? "استقطع نسبة من مشروعك القادم لكفالة يتيم أو تيسير زواج. مبادرة اليسر الخيرية الأولى للمستقلين والفريلانسرز في مصر، مشهرة برقم 2665." : "Pledge a portion of your next project to sponsor an orphan or support a marriage. Al-Yusr's first giving initiative for freelancers & independents in Egypt.")}
        path="/arboun"
        keywords={
          isRTL
            ? "عربون خير, فريلانسرز مصر, تبرع الفريلانسرز, مستقلين, زكاة العمل الحر, تيسير زواج, كفالة أيتام, صدقة جارية, مؤسسة اليسر, جمعية خيرية المنصورة"
            : "Arboun Khair, freelancers charity Egypt, remote workers giving, Al-Yusr foundation, Mansoura NGO, orphan sponsorship"
        }
      />

      <BreadcrumbSchema
        items={[
          { name: isRTL ? "الرئيسية" : "Home", url: "https://elyusr.org/" },
          { name: isRTL ? "حملات اليسر" : "Campaigns", url: "https://elyusr.org/campaigns" },
          { name: isRTL ? "مبادرة عربون خير" : "Arboun Khair", url: "https://elyusr.org/arboun" },
        ]}
      />

      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify({
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
              },
              {
                "@type": "VideoObject",
                name: isRTL ? "فيديو مبادرة عربون خير للفريلانسرز والمستقلين" : "Arboun Khair Freelancers Video",
                description: isRTL
                  ? "فيديو يوضح أثر استقطاع نسبة من أرباح مشاريع الفريلانسرز في كفالة الأيتام وتيسير الزواج مع مؤسسة اليسر."
                  : "Explainer video showing how freelancers' project pledges transform lives through Al-Yusr Charity.",
                thumbnailUrl: ["https://elyusr.org/assets/poster-education.png"],
                uploadDate: "2026-09-17T03:00:00+03:00",
                contentUrl: "https://elyusr.org/vid/2222222.mp4",
                embedUrl: "https://elyusr.org/arboun",
              },
              {
                "@type": "DonateAction",
                name: isRTL ? "تبرع لمبادرة عربون خير" : "Donate to Arboun Khair",
                description: isRTL ? "استقطع عربون بركة من أرباح مشروعك" : "Pledge a share of your project revenue",
                recipient: { "@type": "NGO", name: "مؤسسة اليسر للتنمية", url: "https://elyusr.org/" },
                target: `https://elyusr.org${DONATE}`,
              },
              {
                "@type": "FAQPage",
                mainEntity: FAQS.map((f) => ({
                  "@type": "Question",
                  name: f.q,
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: f.a,
                  },
                })),
              },
            ],
          })}
        </script>
      </Helmet>

      {/* ── 1. Hero Section (Ultra-Modern, Phosphorescent Lime Accents) ──────── */}
      <section className="pattern-hero-luxe relative overflow-hidden text-primary-foreground border-b border-lime-400/20 bg-gradient-to-b from-[#082f1b] via-[#052113] to-background">
        <div aria-hidden className="brand-leaf-tile pointer-events-none absolute inset-0 opacity-30" />



        <div className="container relative mx-auto max-w-4xl px-4 py-8 text-center md:py-12">
          {/* Breadcrumbs */}
          <div className="flex justify-center text-primary-foreground/75">
            <Breadcrumbs
              items={[
                { name: isRTL ? "الرئيسية" : "Home", href: "/" },
                { name: isRTL ? "الحملات" : "Campaigns", href: "/campaigns" },
                { name: isRTL ? "عربون خير" : "Arboun" },
              ]}
            />
          </div>



          {/* Main Title (Two Distinct Rows) */}
          <h1 className="mt-6 text-3xl font-black leading-tight sm:text-4xl md:text-5xl lg:text-[3.35rem]">
            <span className="relative inline-block text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.85)] pb-1.5 sm:pb-2">
              {t(c.hero.title)}
              {/* Dynamic Hand-drawn Curved Underline */}
              <svg
                className="absolute -bottom-1 sm:-bottom-2 right-0 w-full h-3 sm:h-4 text-lime-400 pointer-events-none drop-shadow-[0_0_12px_rgba(163,230,53,0.9)]"
                viewBox="0 0 260 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="none"
              >
                <path
                  d="M255 5C185 15 75 17 5 10C70 15 180 14 250 7"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="block mt-2 sm:mt-3 text-lime-400 drop-shadow-[0_2px_22px_rgba(163,230,53,0.75)]">
              {t(c.hero.title2)}
            </span>
          </h1>

          {/* Tagline */}
          <p className="mx-auto mt-4 max-w-2xl text-xs leading-relaxed text-primary-foreground/90 sm:text-sm md:text-base">
            {t(c.hero.lead)}
          </p>

          <div className="mt-7 flex flex-col items-center gap-3 w-full">
            {/* Row 1: Donate & WhatsApp side by side */}
            <div className="flex items-center justify-center gap-2.5 sm:gap-4 w-full max-w-md mx-auto">
              <Link
                to={DONATE}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-lime-400 text-black px-6 py-3 text-xs sm:text-sm font-black shadow-[0_0_25px_rgba(163,230,53,0.6)] transition hover:bg-lime-300 hover:scale-105 active:scale-95"
              >
                <Heart className="h-4 w-4 fill-black shrink-0" />
                <span className="truncate">{t(c.hero.donateLabel)}</span>
              </Link>

              <a
                href="https://wa.me/201097000137?text=%D8%A7%D9%84%D8%B3%D9%84%D8%A7%D9%85%20%D8%B9%D9%84%D9%8A%D9%83%D9%85%D8%8C%20%D8%AD%D8%A7%D8%A8%D8%A8%20%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%B1%20%D8%B9%D9%86%20%D9%85%D8%A8%D8%A7%D8%AF%D8%B1%D8%A9%20%D8%B9%D8%B1%D8%A8%D9%88%D9%86%20%D8%AE%D9%8A%D8%B1%20%D9%84%D9%84%D9%81%D8%B1%D9%8A%D9%84%D8%A7%D9%86%D8%B3%D8%B1%D8%B2"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-[hsl(var(--whatsapp,142_70%_42%))] px-6 py-3 text-xs sm:text-sm font-black text-white shadow-lg transition hover:brightness-105 hover:scale-105 active:scale-95"
              >
                <WhatsAppIcon className="h-4 w-4 shrink-0" />
                <span className="truncate">{t(label("whatsapp")?.title)}</span>
              </a>
            </div>

            {/* Row 2: Share Button */}
            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center justify-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-5 py-2 text-xs font-bold text-white backdrop-blur transition hover:bg-white/20 hover:scale-105 active:scale-95"
              >
                {copiedLink ? <Check className="h-4 w-4 text-lime-400" /> : <Share2 className="h-4 w-4" />}
                <span>{t(label("share_link")?.title)}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. The 3 Core Pillars Section (WorkAxes Sticky Stack Cards) ──── */}
      <section id="strategic-pillars" className="pt-10 pb-2 sm:pb-4 md:pt-14 md:pb-6 bg-background relative overflow-visible">
        {/* Section Background & Subtle Accents */}
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background via-card/30 to-background" />
        <div aria-hidden className="pointer-events-none absolute -right-40 top-20 h-96 w-96 rounded-full bg-lime-400/5 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -left-40 bottom-20 h-96 w-96 rounded-full bg-orange-500/5 blur-3xl" />

        {/* Container aligned with Navbar max-w-7xl */}
        <div className="container relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-8 md:mb-12 max-w-2xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-lime-400/40 bg-lime-400/10 px-4 py-1.5 text-xs font-black text-lime-600 dark:text-lime-400 mb-3 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-lime-500" />
              <span>{t(label("pillars_badge")?.title)}</span>
            </div>

            <h2 className="text-2xl font-black leading-tight sm:text-3xl md:text-5xl text-foreground">
              {t(section("pillars")?.title)}
            </h2>
            <p className="mt-3 text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed">
              {t(section("pillars")?.lead)}
            </p>
          </div>

          {/* 3 Pillars — WorkAxes-style sticky cards: uniform on mobile, prominent zigzag on md+ */}
          <StickyStack className="mt-4 sm:mt-6">
            {PILLARS.map((p, idx) => {
              const isEven = idx % 2 === 0;
              // idx 0 -> right, idx 1 -> left, idx 2 -> right (prominent zigzag on desktop)
              const isRight = isEven;

              // In RTL: justify-start = RIGHT, justify-end = LEFT
              // In LTR: justify-end = RIGHT, justify-start = LEFT
              const alignClass = isRTL
                ? (isRight ? "justify-center md:justify-start" : "justify-center md:justify-end")
                : (isRight ? "justify-center md:justify-end" : "justify-center md:justify-start");

              return (
                <StickyStackItem key={p.id} index={idx} top={pillarStickyOffsets[idx]}>
                  <div className={`relative w-full flex ${alignClass}`}>
                    <div
                      data-pillar="card"
                      style={{ isolation: "isolate" }}
                      className={`group relative isolate w-full md:w-[88%] lg:w-[84%] scroll-mt-24 transform-gpu overflow-hidden rounded-[24px] sm:rounded-[30px] border flex flex-col ${
                        idx % 2 === 1 ? "md:flex-row-reverse" : "md:flex-row"
                      } md:items-stretch ${
                        p.isOrange
                          ? "border-orange-500/25 bg-gradient-to-br from-[#190c03] via-[#120801] to-[#090400] shadow-[0_20px_60px_-15px_rgba(249,115,22,0.22)]"
                          : "border-lime-500/20 bg-gradient-to-br from-[#081b0d] via-[#041208] to-[#010a04] shadow-[0_20px_60px_-15px_rgba(163,230,53,0.16)]"
                      } backdrop-blur-xl transition-all duration-300`}
                    >
                      {/* Ambient glow corner */}
                      <div
                        aria-hidden
                        className={`pointer-events-none absolute ${
                          isRight ? "-top-20 -right-20" : "-top-20 -left-20"
                        } h-56 w-56 rounded-full blur-3xl opacity-20 ${
                          p.isOrange ? "bg-orange-500" : "bg-lime-400"
                        }`}
                      />

                      {/* Left Column / Visual Brand Hero Box */}
                      <div
                        className={`relative flex flex-col justify-between p-4 sm:p-7 md:p-9 md:w-[38%] lg:w-[34%] shrink-0 border-b md:border-b-0 ${
                          idx % 2 === 1 ? "md:border-r border-white/8" : "md:border-l border-white/8"
                        } ${
                          p.isOrange
                            ? "bg-gradient-to-b from-orange-950/20 via-transparent to-transparent"
                            : "bg-gradient-to-b from-lime-950/20 via-transparent to-transparent"
                        }`}
                      >
                        {/* Top Tag & Number badge */}
                        <div className="flex items-center justify-between gap-3">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 sm:px-3.5 sm:py-1 text-[11px] font-black uppercase tracking-wider ${
                              p.isOrange
                                ? "bg-orange-500/15 text-orange-400 border border-orange-500/30"
                                : "bg-lime-400/12 text-lime-400 border border-lime-400/25"
                            }`}
                          >
                            {p.tag}
                          </span>
                          <span
                            className={`font-mono text-xs sm:text-sm font-black px-3 py-0.5 sm:px-3.5 sm:py-1 rounded-full border ${
                              p.isOrange
                                ? "bg-orange-500/10 text-orange-300 border-orange-400/25"
                                : "bg-lime-400/10 text-lime-300 border-lime-400/25"
                            }`}
                          >
                            {p.num}
                          </span>
                        </div>

                        {/* Icon + Title */}
                        <div className="my-3 sm:my-5 md:my-auto">
                          <div
                            className={`mb-3 sm:mb-4 inline-flex h-11 w-11 sm:h-14 sm:w-14 md:h-16 md:w-16 items-center justify-center rounded-2xl border shadow-lg ${
                              p.isOrange
                                ? "bg-orange-500/15 border-orange-500/30 text-orange-400 shadow-orange-500/10"
                                : "bg-lime-400/15 border-lime-400/30 text-lime-400 shadow-lime-400/10"
                            }`}
                          >
                            {p.icon}
                          </div>
                          <h3 className="text-lg sm:text-2xl md:text-[26px] lg:text-3xl font-black text-white leading-snug">
                            {p.title}
                          </h3>
                          <span
                            aria-hidden
                            className={`mt-2 sm:mt-3 block h-1 w-12 sm:w-14 rounded-full ${
                              p.isOrange
                                ? "bg-gradient-to-r from-orange-400 to-amber-500"
                                : "bg-gradient-to-r from-lime-400 to-emerald-400"
                            }`}
                          />
                        </div>

                        {/* Action Button */}
                        <div className="pt-2">
                          <a
                            href={p.actionHref}
                            className={`inline-flex items-center justify-center gap-2 rounded-full px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-black transition-all hover:scale-105 active:scale-95 shadow-md w-full sm:w-auto ${
                              p.isOrange
                                ? "bg-gradient-to-r from-orange-500 to-amber-500 text-black hover:from-orange-400 hover:to-amber-400 shadow-orange-500/20"
                                : "bg-gradient-to-r from-lime-400 to-emerald-400 text-black hover:from-lime-300 hover:to-emerald-300 shadow-lime-400/20"
                            }`}
                          >
                            <span>{p.actionLabel}</span>
                            <Arrow className="h-4 w-4" />
                          </a>
                        </div>
                      </div>

                      {/* Right Column / Content, Quote, Bullets */}
                      <div className="relative flex flex-1 flex-col justify-center p-4 sm:p-7 md:p-10">
                        {/* Giant Watermark Numeral */}
                        <span
                          aria-hidden
                          className={`pointer-events-none absolute end-4 top-2 select-none text-[65px] sm:text-[110px] md:text-[160px] font-black leading-none opacity-15 ${
                            p.isOrange ? "text-orange-400" : "text-lime-400"
                          }`}
                          style={{
                            WebkitTextStroke: p.isOrange
                              ? "1px rgba(251,146,60,0.35)"
                              : "1px rgba(163,230,53,0.35)",
                          }}
                        >
                          {p.num}
                        </span>

                        {/* Quote Pill */}
                        <div className="relative mb-2.5 sm:mb-4">
                          <div
                            className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-[13.5px] font-semibold border ${
                              p.isOrange
                                ? "bg-orange-500/[0.08] border-orange-500/20 text-orange-200"
                                : "bg-lime-400/[0.08] border-lime-400/20 text-lime-200"
                            }`}
                          >
                            <Sparkles className="h-3.5 w-3.5 shrink-0 opacity-80" />
                            <span>{p.quote}</span>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="relative text-xs sm:text-sm md:text-[15px] leading-relaxed text-white/70 font-medium">
                          {p.desc}
                        </p>

                        {/* 3 Creative Feature Bullets */}
                        <div className="relative mt-3.5 sm:mt-6 pt-3 sm:pt-5 border-t border-white/8 flex flex-col gap-2.5 sm:gap-3">
                          {p.bullets.map((bullet, bIdx) => (
                            <div key={bIdx} className="flex items-center gap-2.5 sm:gap-3">
                              <span
                                className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-xs font-black ${
                                  p.isOrange
                                    ? "bg-orange-500/20 text-orange-400"
                                    : "bg-lime-400/20 text-lime-400"
                                }`}
                              >
                                ✦
                              </span>
                              <span className="text-xs sm:text-sm text-white/85 font-medium leading-snug">
                                {bullet}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </StickyStackItem>
              );
            })}
          </StickyStack>
        </div>
      </section>

      {/* ── 4. Creative Scroll-Expanding Video Section ── */}
      <ScrollExpandMedia
        mediaSrc="/vid/2222222.mp4"
        posterSrc={videoPoster}
        title={t(section("video")?.title) || undefined}
        badge={t(section("video")?.lead) || undefined}
        isRTL={isRTL}
      />

      {/* ── Marquee Bridge — overlaps video bottom on mobile only ── */}
      <div
        className="relative w-full overflow-x-clip -mt-20 sm:mt-0 sm:py-3 pointer-events-none"
        style={{ isolation: "isolate", zIndex: 35 }}
      >
        <ArbounMarqueeBanner />
      </div>

      {/* ── 5. Pricing & Suggested Contribution Shares (Sticky Stack Cards) ── */}
      <section id="pricing-shares" className="pt-6 pb-14 sm:py-16 md:py-20 bg-background relative z-20 overflow-hidden">
        {/* Ambient floating brand stars ✦ */}
        <span aria-hidden className="pointer-events-none absolute top-8 right-12 select-none text-lime-400/20 text-xl animate-pulse">✦</span>
        <span aria-hidden className="pointer-events-none absolute bottom-10 left-12 select-none text-emerald-400/20 text-lg animate-pulse" style={{ animationDelay: "1.2s" }}>✦</span>

        <div className="container relative z-10 mx-auto max-w-4xl px-4 sm:px-6">
          <div className="mx-auto mb-8 max-w-2xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-lime-400/40 bg-lime-400/10 px-4 py-1.5 text-xs font-black text-lime-600 dark:text-lime-400 mb-2 shadow-sm">
              <span className="text-xs">✦</span>
              <span>{t(label("shares_badge")?.title)}</span>
              <span className="text-xs">✦</span>
            </div>

            {/* Decorative ✦✦✦ brand accent */}
            <div className="flex items-center justify-center gap-2 text-lime-500/70 text-xs font-black select-none mb-2 tracking-widest">
              <span className="text-[10px] opacity-40">✦</span>
              <span className="text-sm opacity-90 text-lime-400">✦</span>
              <span className="text-[10px] opacity-40">✦</span>
            </div>

            <h2 className="text-2xl font-black leading-tight sm:text-3xl md:text-4xl text-foreground">
              {t(section("shares")?.title)}
            </h2>

            <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
              {t(section("shares")?.lead)}
            </p>
          </div>

          <StickyStack className="mt-4 sm:mt-6">
            {PRICING_SHARES.map((pkg, i) => (
              <StickyStackItem key={pkg.id} index={i} top={shareStickyOffsets[i]}>
                <div
                  data-share="card"
                  style={{ isolation: "isolate" }}
                  className="group relative isolate w-full scroll-mt-24 transform-gpu overflow-hidden rounded-2xl sm:rounded-3xl border border-lime-400/20 hover:border-lime-400/45 shadow-[0_8px_32px_rgba(0,0,0,0.35)] bg-gradient-to-br from-[#0d2218] via-[#0a1c13] to-[#07140d] backdrop-blur-md p-5 sm:p-7 transition-all duration-300"
                >
                  {/* Header row: icon + label  |  amount */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-lime-400/15 text-lime-400 border border-lime-400/25 shrink-0">
                        <Coins className="h-4.5 w-4.5" />
                      </span>
                      <div>
                        <span className="inline-block text-[10px] font-black uppercase tracking-widest text-lime-400/80 mb-0.5">
                          {pkg.tag}
                        </span>
                        <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                          {pkg.label}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-baseline gap-1 font-mono font-black text-2xl sm:text-3xl text-lime-400 shrink-0">
                      <span>{pkg.amount}</span>
                      <span className="text-xs font-bold text-lime-400/60">ج.م</span>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-lime-400/10 mb-4" />

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-white/65 leading-relaxed font-medium mb-5">
                    {pkg.desc}
                  </p>

                  {/* Donate button — start-aligned (right in RTL, left in LTR) */}
                  <Link
                    to={`${DONATE}&amount=${pkg.amount}`}
                    className="inline-flex items-center gap-2 rounded-full bg-lime-400 hover:bg-lime-300 text-black px-6 py-2.5 text-xs sm:text-sm font-black shadow-[0_0_22px_rgba(163,230,53,0.4)] transition-all hover:-translate-y-0.5 active:scale-95"
                  >
                    <Heart className="h-3.5 w-3.5 fill-black" />
                    <span>{t(label("shares_badge")?.desc)}</span>
                  </Link>
                </div>
              </StickyStackItem>
            ))}
            <div aria-hidden className="h-2" />
          </StickyStack>
        </div>
      </section>

      <HadithBlock hadith={hadith} tone="light" />

      {/* ── 6. Freelancer Barakah Calculator ── */}
      <ArbounCalculator />

      {/* ── 7. How it Works — Premium Sticky Stack Steps ──── */}
      <section id="how-it-works" className="py-16 md:py-24 relative overflow-visible border-t border-border/40">
        {/* Section gradient background */}
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background via-[hsl(150_30%_6%/0.3)] to-background" />
        <div aria-hidden className="pointer-events-none absolute -right-32 top-0 h-96 w-96 rounded-full bg-lime-400/5 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -left-32 bottom-0 h-96 w-96 rounded-full bg-[#0c5932]/10 blur-3xl" />

        <div className="container relative mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-lime-400/30 bg-lime-400/8 px-4 py-1.5 text-xs font-black text-lime-600 dark:text-lime-400 mb-3 shadow-sm">
              <Zap className="h-3.5 w-3.5" />
              <span>{t(label("steps_badge")?.title)}</span>
            </div>

            <h2 className="text-2xl font-black leading-tight sm:text-3xl md:text-4xl text-foreground">
              {t(section("steps")?.title)}
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto">
              {t(section("steps")?.lead)}
            </p>
          </div>

          {/* Sticky Stack Steps: desktop zigzag (one bigger/shifted), mobile centered & uncrowded */}
          <StickyStack className="mt-4 sm:mt-6">
            {STEPS.map((s, idx) => {
              const colors = [
                // Step 1: Lime — warm forest dark, visible green hue
                {
                  bg: "bg-lime-400",
                  textBadge: "text-black",
                  glow: "shadow-[0_0_30px_rgba(163,230,53,0.55)]",
                  cardBg: "bg-gradient-to-br from-[#153d22] via-[#112e1a] to-[#0e2415] border-lime-400/35 hover:border-lime-400/60 shadow-[0_10px_36px_rgba(0,0,0,0.28)]",
                  tagPill: "bg-lime-400/15 text-lime-300 border border-lime-400/40 shadow-[0_0_12px_rgba(163,230,53,0.2)]",
                  cornerNum: "text-lime-400/70",
                  titleColor: "text-white",
                  descColor: "text-white/70",
                },
                // Step 2: Brand Green — visible emerald-forest hue
                {
                  bg: "bg-[#0c5932]",
                  textBadge: "text-white",
                  glow: "shadow-[0_0_30px_rgba(12,89,50,0.6)]",
                  cardBg: "bg-gradient-to-br from-[#174a30] via-[#133d27] to-[#10301f] border-emerald-600/40 hover:border-emerald-500/65 shadow-[0_10px_36px_rgba(0,0,0,0.28)]",
                  tagPill: "bg-emerald-600/25 text-emerald-300 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]",
                  cornerNum: "text-emerald-400/70",
                  titleColor: "text-white",
                  descColor: "text-white/70",
                },
                // Step 3: Orange — warm amber-dark, rich and visible
                {
                  bg: "bg-orange-400",
                  textBadge: "text-black",
                  glow: "shadow-[0_0_30px_rgba(251,146,60,0.5)]",
                  cardBg: "bg-gradient-to-br from-[#3a1e08] via-[#2e1806] to-[#241305] border-orange-500/35 hover:border-orange-400/60 shadow-[0_10px_36px_rgba(0,0,0,0.28)]",
                  tagPill: "bg-orange-500/20 text-orange-300 border border-orange-400/40 shadow-[0_0_12px_rgba(251,146,60,0.2)]",
                  cornerNum: "text-orange-400/70",
                  titleColor: "text-white",
                  descColor: "text-white/70",
                },
              ][idx];

              const isRight = idx % 2 === 0;

              // On desktop: zigzag alignment (Right / Left / Right)
              // In RTL: justify-start is RIGHT, justify-end is LEFT
              const stepAlignClass = isRTL
                ? (isRight ? "justify-center md:justify-start" : "justify-center md:justify-end")
                : (isRight ? "justify-center md:justify-end" : "justify-center md:justify-start");

              return (
                <StickyStackItem key={s.id} index={idx} top={stickyOffsets[idx]}>
                  {/* Outer container: centered on mobile, zigzag on desktop */}
                  <div className={`relative w-full flex ${stepAlignClass}`}>
                    {/* Card wrapper: centered & spacious on mobile, asymmetric on desktop */}
                    <div className="relative w-full max-w-lg md:max-w-none md:w-[82%] lg:w-[78%]">
                      {/* Floating Badge on desktop (md+) */}
                      <div
                        className={`absolute top-1/2 -translate-y-1/2 z-20 hidden md:flex flex-col items-center justify-center ${
                          isRight
                            ? "-right-8 xl:-right-10"
                            : "-left-8 xl:-left-10"
                        }`}
                      >
                        <div
                          className={`flex h-20 w-20 xl:h-24 xl:w-24 flex-col items-center justify-center rounded-2xl xl:rounded-3xl ${colors.bg} ${colors.textBadge} font-black ${colors.glow} border-4 border-background shadow-2xl`}
                        >
                          <span className="text-[10px] font-black opacity-75 leading-none tracking-wider">
                            {t(label("steps_badge")?.desc)}
                          </span>
                          <span className="text-4xl xl:text-5xl font-black leading-none mt-0.5">
                            {idx + 1}
                          </span>
                        </div>
                      </div>

                      {/* Card Content: generous padding, uncrowded typography */}
                      <div
                        className={`relative rounded-2xl sm:rounded-3xl border p-5 sm:p-7 md:p-8 lg:p-9 transition-all duration-300 backdrop-blur-md ${
                          isRight ? "md:pr-24 lg:pr-28" : "md:pl-24 lg:pl-28"
                        } ${colors.cardBg}`}
                      >
                        {/* Corner step number: top-left for step 1&3, top-right for step 2 — mobile & desktop */}
                        <span
                          className={`absolute top-4 ${
                            isRight ? "left-4 sm:left-5" : "right-4 sm:right-5"
                          } text-5xl sm:text-6xl md:text-7xl font-black leading-none select-none opacity-90 ${colors.cornerNum}`}
                          style={{ lineHeight: 1 }}
                        >
                          {idx + 1}
                        </span>

                        {/* Desktop tag pill */}
                        <div className="hidden md:block mb-2.5 mt-1">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider ${colors.tagPill}`}
                          >
                            {isRTL ? `الخطوة ${idx === 0 ? "الأولى" : idx === 1 ? "الثانية" : "الثالثة"}` : `Step ${idx + 1}`}
                          </span>
                        </div>

                        {/* Spacer on mobile so content clears the big corner number */}
                        <div className="md:hidden h-10 sm:h-12" />

                        <h3 className={`text-base sm:text-xl md:text-2xl font-black mb-2 leading-snug ${colors.titleColor}`}>
                          {s.title}
                        </h3>
                        <p className={`text-xs sm:text-sm md:text-[15px] leading-relaxed font-medium ${colors.descColor}`}>
                          {s.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                </StickyStackItem>
              );
            })}
            <div aria-hidden className="h-4 sm:h-6" />
          </StickyStack>
        </div>
      </section>

      {/* ── 8. Real Ground Proof — Premium Overlay Carousel ──────── */}
      {GALLERY.length > 0 && <GalleryCarousel gallery={GALLERY} isRTL={isRTL} />}

      {/* ── 9. Related Initiatives Links ─────────────────────────── */}
      <section className="py-10 bg-muted/20 border-t border-border">
        <div className="container mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center mb-6">
            <h3 className="text-sm font-black uppercase tracking-wider text-muted-foreground">
              {t(label("related_title")?.title)}
            </h3>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {RELATED_LINKS.map((link, i) => (
              <Link
                key={i}
                to={link.href}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-bold text-foreground shadow-xs transition hover:border-lime-400/60 hover:text-primary hover:bg-card/80"
              >
                <span>{isRTL ? link.ar : link.en}</span>
                <Arrow className="h-3 w-3 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 10. Core Mission Statement Box (رسالة المبادرة - بدون CTA) ────── */}
      <section className="py-12 md:py-16 bg-background relative overflow-hidden">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6">
          <div className="relative rounded-[32px] sm:rounded-[40px] bg-gradient-to-br from-[#0d472a] via-[#072c18] to-[#03170c] p-8 sm:p-12 text-center border-2 border-lime-400/50 shadow-[0_0_60px_rgba(163,230,53,0.22)] overflow-hidden">
            {/* Ambient radiant glow */}
            <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-lime-400/15 blur-3xl" />
            <div aria-hidden className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-emerald-500/15 blur-3xl" />

            {/* Ambient floating brand stars ✦ */}
            <span aria-hidden className="pointer-events-none absolute top-6 left-8 select-none text-lime-400/20 text-xl animate-pulse">✦</span>
            <span aria-hidden className="pointer-events-none absolute bottom-6 right-8 select-none text-emerald-400/20 text-lg animate-pulse" style={{ animationDelay: "1.4s" }}>✦</span>

            <div className="relative z-10 flex flex-col items-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-lime-400/15 border border-lime-400/40 text-lime-400 font-black text-xs sm:text-sm px-4 py-1.5 mb-2 shadow-sm">
                <span className="text-xs">✦</span>
                <span>{t(label("mission_badge")?.title)}</span>
                <span className="text-xs">✦</span>
              </div>

              {/* Decorative ✦✦✦ brand accent */}
              <div className="flex items-center justify-center gap-2 text-lime-300/80 text-xs font-black select-none mb-3 tracking-widest">
                <span className="text-[10px] opacity-40">✦</span>
                <span className="text-sm opacity-90 text-lime-300">✦</span>
                <span className="text-[10px] opacity-40">✦</span>
              </div>


              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight drop-shadow-md">
                {t(c.cta.title)}
              </h2>

              <p className="mt-4 text-sm sm:text-base md:text-lg text-lime-300 font-bold max-w-2xl leading-relaxed">
                {t(c.cta.sub)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 11. Comprehensive FAQ Section ────────────────────────── */}
      <section className="py-14 md:py-20 bg-background border-t border-border">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <div className="mx-auto grid h-10 w-10 place-items-center rounded-2xl bg-lime-400/20 text-lime-600 dark:text-lime-400 mb-2">
              <HelpCircle className="h-5 w-5" />
            </div>
            <h2 className="text-2xl font-black text-foreground sm:text-3xl">
              {t(section("faq_intro")?.title)}
            </h2>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {t(section("faq_intro")?.lead)}
            </p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className={`overflow-hidden rounded-2xl border-2 transition ${
                    isOpen
                      ? "border-lime-400/50 bg-lime-400/5 shadow-sm"
                      : "border-border bg-card hover:border-border/80"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between gap-3 p-4 text-start font-extrabold text-foreground text-sm"
                  >
                    <span>{faq.q}</span>
                    <span className="text-lime-500 font-black text-lg">{isOpen ? "−" : "+"}</span>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 text-xs text-muted-foreground leading-relaxed border-t border-border/40 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Floating Sticky Bottom CTA Bar (Hidden during Video, Marquee & Footer) ── */}
      {stickyOpen && scrolledPastMarquee && !hideInVideoSection && !hideNearFooter && (
        <div className="fixed bottom-0 inset-x-0 z-50 p-3 sm:p-4 bg-background/95 backdrop-blur-md border-t border-lime-400/30 shadow-2xl transition-all">
          <div className="container mx-auto max-w-5xl flex items-center justify-between gap-3">
            <div className="hidden sm:flex items-center gap-2.5">
              <span className="flex h-3 w-3 rounded-full bg-lime-400 animate-ping" />
              <p className="text-xs font-black text-foreground">
                {t(label("sticky_bar")?.title)}
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Link
                to={DONATE}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-full bg-lime-400 text-black px-6 py-2.5 text-xs font-black shadow-[0_0_20px_rgba(163,230,53,0.6)] transition hover:bg-lime-300"
              >
                <Heart className="h-3.5 w-3.5 fill-black" />
                <span>{t(label("sticky_bar")?.desc)}</span>
              </Link>

              <a
                href="https://wa.me/201097000137?text=%D8%A7%D9%84%D8%B3%D9%84%D8%A7%D9%85%20%D8%B9%D9%84%D9%8A%D9%83%D9%85%D8%8C%20%D8%AD%D8%A7%D8%A8%D8%A8%20%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%B1%20%D8%B9%D9%86%20%D9%85%D8%A8%D8%A7%D8%AF%D8%B1%D8%A9%20%D8%B9%D8%B1%D8%A8%D9%88%D9%86%20%D8%AE%D9%8A%D8%B1"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center p-2.5 rounded-full bg-[hsl(var(--whatsapp,142_70%_42%))] text-white shadow-sm transition hover:brightness-105"
                title={t(label("whatsapp")?.desc)}
              >
                <WhatsAppIcon className="h-4 w-4" />
              </a>

              <button
                type="button"
                onClick={() => setStickyOpen(false)}
                className="p-1 text-muted-foreground hover:text-foreground transition rounded-full"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Semantic Programmatic SEO (sr-only) ──────────────────── */}
      <div className="sr-only">
        مبادرة عربون خير للفريلانسرز والمستقلين في مصر، زكاة العمل الحر، تبرعات مطوري البرمجيات ومصممي الجرافيك وكتاب المحتوى، تبرع بالدولار، كفالة يتيم المنصورة، تيسير زواج عرائس يتيمات بالدقهلية، سقيا الماء، أسقف معزولة، مؤسسة اليسر الخيرية مشهرة برقم 2665 لسنة 2019 وزارة التضامن الاجتماعي، شارة فريلانسر معتمدة، freelance charity Egypt, remote workers zakat Egypt, Arab digital nomads charity pledge, Al-Yusr NGO Mansoura.
      </div>
    </PageLayout>
  );
};

export default ArbounLanding;
