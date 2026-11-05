import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Heart,
  Truck,
  Sparkles,
  Phone,
  Building2,
  MapPin,
  HelpCircle,
  ShieldCheck,
  CheckCircle2,
  Tv,
  Sofa,
  Shirt,
  BookOpen,
  Pill,
  ArrowLeft,
  ArrowRight,
  FileCheck2,
  Copy,
  Check,
  Database,
  HeartHandshake,
  Layers,
} from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { SiteSchemas, BreadcrumbSchema } from "@/components/common/Schemas";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LangContext";
import { Helmet } from "react-helmet-async";
import { WhatsAppIcon } from "@/components/common/icons/WhatsAppIcon";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";

import posterFurniture from "@/assets/markoun-poster-furniture.webp";
import { HadithBlock } from "@/components/campaigns/HadithBlock";
import { useCampaignPage } from "@/hooks/useCampaignPage";
import MARKOUN_DEFAULTS from "@/data/campaignPages/markoun";
import type { LucideIcon } from "lucide-react";
import { FAQSchema } from "@/components/common/Schemas";

import { campaignDonateHref } from "@/data/campaignPages/index";
import { useBankAccounts } from "@/data/paymentOptions";

const DONATE = campaignDonateHref("markoun");
/** Presentation-only metadata (icons, tags) keyed by the editable item ids in `campaignPages/markoun.ts`. */
const PILLAR_META: Record<string, { icon: LucideIcon; tagAr: string; tagEn: string }> = {
  furniture: { icon: Sofa, tagAr: "تأسيس منازل مستقرة", tagEn: "Home Furnishing" },
  appliances: { icon: Tv, tagAr: "صدقة جارية تنبض بالحياة", tagEn: "Ongoing Charity" },
  clothes: { icon: Shirt, tagAr: "ستر وفرحة حقيقية", tagEn: "Warmth & Dignity" },
  meds: { icon: Pill, tagAr: "رعاية صحية مجانية", tagEn: "Medical Aid" },
  books: { icon: BookOpen, tagAr: "دعم تعليم وتدوير معرفة", tagEn: "Education Lifeline" },
};

const ADVANTAGE_ICONS: Record<string, LucideIcon> = {
  data: Database,
  dignity: HeartHandshake,
  doorstep: Truck,
};

const MarkounLanding = () => {
  const { lang } = useLang();
  const isRTL = lang === "ar";
  const { c, t, section, images } = useCampaignPage("markoun", MARKOUN_DEFAULTS);
  const heroImg = images("hero")[0];
  const gallery = images("gallery");
  const pillars = section("pillars")?.items ?? [];
  const advantages = section("advantages")?.items ?? [];
  const steps = section("steps")?.items ?? [];
  const sloganText = t(section("slogan")?.items?.[0]?.title) || t(section("slogan")?.title);
  const contactItem = (id: string) => section("contact")?.items.find((i) => i.id === id);
  // The dashboard's active bank account first (single source), else the page's own text.
  const bankAccounts = useBankAccounts();
  const bankNumber = bankAccounts[0]?.value || t(contactItem("bank")?.desc) || "";
  const base = "https://elyusr.org";
  const Arrow = isRTL ? ArrowLeft : ArrowRight;
  const [copiedBank, setCopiedBank] = useState(false);
  const [hideSticky, setHideSticky] = useState(false);
  const [scrolledPastHero, setScrolledPastHero] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleScroll = () => {
      setScrolledPastHero(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    const footerEl = document.querySelector("footer") || document.querySelector("#contact");
    if (!footerEl) {
      return () => window.removeEventListener("scroll", handleScroll);
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setHideSticky(entry.isIntersecting);
      },
      { threshold: 0.05, rootMargin: "60px 0px 0px 0px" }
    );
    observer.observe(footerEl);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, []);

  const copyBankNumber = () => {
    navigator.clipboard.writeText(bankNumber);
    setCopiedBank(true);
    toast.success(isRTL ? "تم نسخ رقم الحساب البنكي (CIB)" : "CIB account copied");
    setTimeout(() => setCopiedBank(false), 2500);
  };

  const waDonateText = encodeURIComponent(
    isRTL
      ? "تبرع - أرغب بالتبرع بمركون من منزلي (أثاث / أجهزة / ملابس / أدوية / كتب) ضمن حملة مركون"
      : "Donate - I want to donate surplus items (furniture / appliances / clothes / meds / books) via Markoun"
  );
  const waUrl = `https://wa.me/201097000137?text=${waDonateText}`;

  return (
    <PageLayout>
      <FAQSchema items={c.faq.map((f) => ({ q: t(f.q), a: t(f.a) }))} />
      <SEOHelmet
        title={c.seo?.title?.[isRTL ? "ar" : "en"] || (isRTL ? "حملة مَرْكون — أول حملة مصرية تُحيي أُسرة بالمركون في بيتك | مؤسسة اليسر الخيرية" : "Markoun Campaign — What's Idle at Home is Life for Another | Al-Yusr")}
        description={c.seo?.description?.[isRTL ? "ar" : "en"] || (isRTL ? "حملة مَرْكُون: كنزك المركون يبني حياة لغيرك. أول حملة مصرية منظمة لإعادة استخدام الأثاث المنزلي، الأجهزة الكهربائية، الملابس، الصيدلية المستدامة، والكتب. مندوبنا يصلك لباب بيتك مجاناً بالمنصورة والدقهلية: 01097000137." : "Markoun Campaign: Egypt's premier in-kind reuse initiative. Repurposing surplus furniture, electronics, clothing, medicine, and books with free doorstep pickup across Mansoura & Dakahlia.")}
        path="/markoun"
        image={heroImg?.src ?? posterFurniture}
        keywords={
          isRTL
            ? "حملة مركون, تبرع بالاثاث المنزلي المنصورة, تبرع بالأجهزة الكهربائية المستعملة, تبرع بالملابس المستعملة الدقهلية, صيدلية خيرية مجانية المنصورة, مندوب استلام تبرعات من المنزل, مؤسسة اليسر الخيرية, جمعية اليسر المنصورة"
            : "Markoun campaign, in-kind donation Egypt, furniture donation Mansoura, used appliances charity, free medicine bank Egypt, Al-Yusr Charity"
        }
      />

      <SiteSchemas />
      <BreadcrumbSchema
        items={[
          { name: isRTL ? "الرئيسية" : "Home", url: `${base}/` },
          { name: isRTL ? "حملات ومبادرات اليسر" : "Campaigns", url: `${base}/campaigns` },
          { name: isRTL ? "حملة مَرْكون" : "Markoun Campaign", url: `${base}/markoun` },
        ]}
      />

      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            name: "حملة مَرْكُون للتبرعات العينية وإعادة التدوير",
            alternateName: "حملة مركون",
            provider: {
              "@type": "NGO",
              name: "مؤسسة اليسر الخيرية للتنمية",
              alternateName: "مؤسسة اليسر",
              url: "https://elyusr.org/",
              telephone: "+201097000137",
              taxID: "2665/2019",
            },
            serviceType: "استلام وتجديد وتوزيع التبرعات العينية (أثاث، أجهزة، ملابس، أدوية، كتب)",
            areaServed: ["Mansoura", "Dakahlia", "Egypt"],
            availableChannel: {
              "@type": "ServiceChannel",
              servicePhone: {
                "@type": "ContactPoint",
                telephone: "+201097000137",
                contactType: "customer service",
              },
            },
          })}
        </script>
      </Helmet>

      {/* Hero Section */}
      <section className="pattern-hero-luxe hero-pattern-fade relative isolate overflow-hidden text-primary-foreground">
        <div aria-hidden className="brand-leaf-tile pointer-events-none absolute inset-0 opacity-35" />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(150_55%_28%/0.4),transparent_60%)]" />

        <div className="container relative mx-auto max-w-6xl px-4 py-10 md:py-16">
          <div className="flex justify-center text-primary-foreground/75 md:justify-start">
            <Breadcrumbs
              items={[
                { name: isRTL ? "الرئيسية" : "Home", href: "/" },
                { name: isRTL ? "الحملات" : "Campaigns", href: "/campaigns" },
                { name: isRTL ? "حملة مَرْكون" : "Markoun" },
              ]}
            />
          </div>

          <div className="mt-6 grid items-center gap-8 lg:grid-cols-12">
            {/* Hero Copy */}
            <div className="text-center lg:col-span-7 lg:text-start">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-primary-foreground backdrop-blur shadow-sm">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                {t(c.hero.eyebrow)}
              </span>

              <h1 className="mt-4 text-3xl font-black leading-tight sm:text-4xl md:text-5xl lg:leading-[1.2]">
                {t(c.hero.title)} <br className="hidden sm:block" />
                <span className="text-gradient-lime">{t(c.hero.title2)}</span>
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-primary-foreground/90 sm:text-base md:text-lg">
                {t(c.hero.lead)}
              </p>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 lg:justify-start w-full max-w-md mx-auto lg:mx-0">
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener"
                  className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-[hsl(var(--whatsapp,142_70%_42%))] px-5 sm:px-6 py-3 text-xs sm:text-sm font-black text-white shadow-lg transition hover:brightness-105 text-center leading-normal"
                >
                  <WhatsAppIcon className="h-4 w-4 shrink-0" />
                  <span>{t(c.hero.donateLabel)}</span>
                </a>

                <Button
                  asChild
                  size="lg"
                  className="w-full sm:w-auto flex-1 rounded-full bg-orange-grad px-5 sm:px-6 py-3 text-xs sm:text-sm font-black text-accent-foreground shadow-cta transition hover:opacity-95 text-center leading-normal h-auto min-h-[44px]"
                >
                  <Link to={DONATE}>
                    <Heart className="h-4 w-4 shrink-0" />
                    <span>{isRTL ? "دعم نفقات الصيانة والنقل" : "Support Repair Fund"}</span>
                  </Link>
                </Button>
              </div>

              {/* Quick Info Badges */}
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs font-black text-primary-foreground/85 lg:justify-start">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 backdrop-blur">
                  <Phone className="h-3.5 w-3.5 text-accent" />
                  <a href="tel:01097000137" dir="ltr">01097000137</a>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 backdrop-blur">
                  <Truck className="h-3.5 w-3.5 text-secondary" />
                  {isRTL ? "استلام مجاني لباب البيت" : "Free Doorstep Pickup"}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 backdrop-blur">
                  <ShieldCheck className="h-3.5 w-3.5 text-secondary" />
                  {isRTL ? "مشهرة برقم 2665 لسنة 2019" : "Licensed NGO 2665/2019"}
                </span>
              </div>
            </div>

            {/* Hero Visual Poster */}
            <div className="relative lg:col-span-5">
              <div className="relative mx-auto max-w-md overflow-hidden rounded-[2.5rem] border-4 border-white/20 bg-card shadow-2xl">
                <img
                  src={heroImg?.src ?? posterFurniture}
                  alt={heroImg ? (isRTL ? heroImg.altAr : heroImg.altEn) : ""}
                  className="h-full w-full object-cover"
                  loading="eager"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Slogan Banner */}
      <section className="bg-primary/95 py-6 text-primary-foreground border-y border-secondary/30">
        <div className="container mx-auto max-w-5xl px-4 text-center">
          <p className="text-base sm:text-xl md:text-2xl font-black text-secondary tracking-wide">
            {sloganText}
          </p>
        </div>
      </section>

      {/* 5 Main Pillars */}
      <section className="pattern-programs py-12 md:py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/15 px-3.5 py-1 text-xs font-black text-primary">
              <Layers className="h-3.5 w-3.5 text-secondary" />
              {isRTL ? "محاور ومستهدفات الحملة (ماذا نجمع؟)" : "What You Can Donate"}
            </span>
            <h2 className="mt-3 text-2xl font-black text-primary sm:text-3xl md:text-4xl">
              {t(section("pillars")?.title)}
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-xs leading-relaxed text-muted-foreground sm:text-sm md:text-base">
              {t(section("pillars")?.lead)}
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {pillars.map((p) => {
              const meta = PILLAR_META[p.id] ?? PILLAR_META.furniture;
              const Icon = meta.icon;
              return (
                <div
                  key={p.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border/80 bg-card p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-card md:p-7"
                >
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary/15 text-primary shadow-sm group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Icon className="h-6 w-6" />
                      </span>
                      <span className="rounded-full bg-secondary/10 px-3 py-1 text-[11px] font-black text-secondary">
                        {isRTL ? meta.tagAr : meta.tagEn}
                      </span>
                    </div>

                    <h3 className="mt-4 text-xl font-black text-primary md:text-2xl">
                      {t(p.title)}
                    </h3>

                    <div className="mt-1 text-xs font-black text-accent md:text-sm">
                      {t(p.extra)}
                    </div>

                    <p className="mt-3 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                      {t(p.desc)}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-border/60">
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener"
                      className="inline-flex items-center gap-1.5 text-xs font-black text-primary hover:text-secondary transition"
                    >
                      <WhatsAppIcon className="h-4 w-4" />
                      {isRTL ? `طلب مندوب لـ ${t(p.title)}` : `Donate ${t(p.title)}`}
                      <Arrow className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <HadithBlock
        hadith={{ ar: c.hadith.text.ar, en: c.hadith.text.en, sourceAr: c.hadith.source.ar, sourceEn: c.hadith.source.en }}
        tone="dark"
      />

      {/* Why Donate to Markoun */}
      <section className="bg-muted/40 py-12 md:py-20 border-y border-border/60">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/15 px-3.5 py-1 text-xs font-black text-primary">
              <ShieldCheck className="h-3.5 w-3.5 text-secondary" />
              {isRTL ? "ضمان الأثر والأمانة" : "Why Choose Markoun"}
            </span>
            <h2 className="mt-3 text-2xl font-black text-primary sm:text-3xl md:text-4xl">
              {t(section("advantages")?.title)}
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
              {t(section("advantages")?.lead)}
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {advantages.map((adv) => {
              const Icon = ADVANTAGE_ICONS[adv.id] ?? CheckCircle2;
              return (
                <div
                  key={adv.id}
                  className="relative rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-soft text-center sm:text-start"
                >
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary/20 text-primary shadow-sm mx-auto sm:mx-0">
                    <Icon className="h-6 w-6 text-secondary" />
                  </span>
                  <h3 className="mt-5 text-lg sm:text-xl font-black text-primary">
                    {t(adv.title)}
                  </h3>
                  <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                    {t(adv.desc)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Steps */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/15 px-3.5 py-1 text-xs font-black text-primary">
              <Truck className="h-3.5 w-3.5 text-secondary" />
              {isRTL ? "آلية المشاركة وسهولة الإجراءات" : "How It Works"}
            </span>
            <h2 className="mt-3 text-2xl font-black text-primary sm:text-3xl md:text-4xl">
              {t(section("steps")?.title)}
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
              {t(section("steps")?.lead)}
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, idx) => (
              <div
                key={s.id}
                className="relative rounded-3xl border border-border bg-card p-6 shadow-soft text-center sm:text-start"
              >
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-orange-grad font-mono text-base font-black text-accent-foreground shadow-cta mx-auto sm:mx-0">
                  {idx + 1}
                </span>
                <h3 className="mt-4 text-base font-black text-primary">
                  {t(s.title)}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-[13px]">
                  {t(s.desc)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Official Contact & Financial Support Box */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="overflow-hidden rounded-3xl border border-secondary/40 bg-gradient-to-br from-[#06331c] via-[#083820] to-[#042013] p-6 sm:p-8 md:p-10 text-primary-foreground shadow-card">
            <div className="grid gap-8 md:grid-cols-12 md:items-center">
              
              <div className="md:col-span-7 space-y-4 text-center md:text-start">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/20 px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-secondary ring-1 ring-secondary/40">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {t(contactItem("badge")?.title)}
                </span>

                <h2 className="text-2xl font-black md:text-3xl leading-tight">
                  {t(section("contact")?.title)}
                </h2>

                <p className="text-xs sm:text-sm leading-relaxed text-primary-foreground/90 max-w-xl">
                  {t(section("contact")?.lead)}
                </p>

                <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--whatsapp,142_70%_42%))] px-5 py-2.5 text-xs font-black text-white shadow-lg transition hover:brightness-105"
                  >
                    <WhatsAppIcon className="h-4 w-4" />
                    <span>01097000137</span>
                  </a>
                  <a
                    href="tel:01097000137"
                    className="inline-flex items-center gap-2 rounded-full bg-white/15 px-5 py-2.5 text-xs font-black text-white backdrop-blur hover:bg-white/25"
                  >
                    <Phone className="h-4 w-4 text-secondary" />
                    <span>01097000137</span>
                  </a>
                </div>
              </div>

              <div className="md:col-span-5 space-y-3.5 rounded-2xl border border-secondary/30 bg-black/30 p-5 sm:p-6 text-xs sm:text-sm backdrop-blur">
                <div className="flex items-start gap-3 border-b border-white/15 pb-3.5">
                  <Building2 className="mt-1 h-5 w-5 shrink-0 text-secondary" />
                  <div className="flex-1">
                    <div className="font-black text-secondary">
                      {t(contactItem("bank")?.title)}
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span dir="ltr" className="font-mono text-base font-black text-white tracking-wider">
                        {bankNumber}
                      </span>
                      <button
                        type="button"
                        onClick={copyBankNumber}
                        className="inline-flex items-center gap-1 rounded-md bg-white/15 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-white/25 transition"
                      >
                        {copiedBank ? <Check className="h-3 w-3 text-secondary" /> : <Copy className="h-3 w-3" />}
                        <span>{copiedBank ? (isRTL ? "تم النسخ" : "Copied") : (isRTL ? "نسخ" : "Copy")}</span>
                      </button>
                    </div>
                    <div className="mt-1 text-[11px] opacity-80 text-primary-foreground/75">
                      {t(contactItem("bank")?.extra)}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-1">
                  <MapPin className="mt-1 h-5 w-5 shrink-0 text-secondary" />
                  <div>
                    <div className="font-black text-secondary">{t(contactItem("hq")?.title)}</div>
                    <div className="mt-1 leading-relaxed text-white text-xs sm:text-sm">
                      {t(contactItem("hq")?.desc)}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Field Proof Gallery */}
      <section className="bg-muted/30 py-12 md:py-16 border-t border-border/60">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/15 px-3.5 py-1 text-xs font-black text-primary">
              <FileCheck2 className="h-3.5 w-3.5 text-secondary" />
              {isRTL ? "توثيق الميدان" : "Field Proof"}
            </span>
            <h2 className="mt-3 text-2xl font-black text-primary sm:text-3xl">
              {isRTL ? "صور وتوثيق من ورش التجديد وبيوت أهالينا" : "Photos from Workshops & Homes"}
            </h2>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {gallery.map((g, idx) => {
              const img = { src: g.src, title: isRTL ? g.altAr : g.altEn };
              return (
              <figure
                key={idx}
                className="group relative aspect-square overflow-hidden rounded-2xl border border-border bg-card shadow-soft"
              >
                <img
                  src={img.src}
                  alt={img.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/70 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 p-2 text-center text-[11px] font-bold text-white opacity-0 transition group-hover:opacity-100">
                  {img.title}
                </figcaption>
              </figure>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQs Accordion with Generous Bottom Padding */}
      <section className="pt-12 pb-28 sm:pb-36 md:pb-44">
        <div className="container mx-auto max-w-3xl px-4">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/15 px-3.5 py-1 text-xs font-black text-primary">
              <HelpCircle className="h-3.5 w-3.5 text-secondary" />
              {isRTL ? "الأسئلة الشائعة" : "FAQs"}
            </span>
            <h2 className="mt-3 text-2xl font-black text-primary sm:text-3xl">
              {isRTL ? "كل ما تريد معرفته عن حملة مَرْكون" : "Frequently Asked Questions"}
            </h2>
          </div>

          <Accordion type="single" collapsible className="mt-8 space-y-3 rounded-3xl border border-border bg-card p-4 sm:p-6 shadow-soft">
            {c.faq.map((faq, idx) => (
              <AccordionItem key={idx} value={`item-${idx}`} className="border-border/60">
                <AccordionTrigger className="text-start text-sm font-black text-primary hover:text-secondary sm:text-base">
                  {t(faq.q)}
                </AccordionTrigger>
                <AccordionContent className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  {t(faq.a)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Sticky Bottom Floating Bar — Appears after scrolling past hero & Auto-hides before footer */}
      <div className={`fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4 pointer-events-none transition-all duration-300 ${!hideSticky && scrolledPastHero ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12 pointer-events-none"}`}>
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 rounded-full border border-secondary/40 bg-primary/95 px-4 py-2.5 shadow-2xl backdrop-blur pointer-events-auto sm:px-6 sm:py-3">
          <div className="flex items-center gap-3">
            <span className="hidden sm:grid h-9 w-9 place-items-center rounded-full bg-secondary/20 text-secondary">
              <Truck className="h-4 w-4" />
            </span>
            <div>
              <div className="text-xs sm:text-sm font-black text-primary-foreground">
                {t(c.cta.title)}
              </div>
              <div className="text-[10px] font-bold text-secondary hidden sm:block">
                {t(c.cta.sub)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--whatsapp,142_70%_42%))] px-4 py-2 text-xs font-black text-white shadow-cta transition hover:brightness-105"
            >
              <WhatsAppIcon className="h-4 w-4" />
              {isRTL ? "ابعت «تبرع»" : "Text 'Donate'"}
            </a>
            <Button asChild size="sm" variant="outline" className="hidden sm:inline-flex rounded-full border-white/30 bg-white/10 text-xs font-black text-primary-foreground hover:bg-white/20">
              <Link to={DONATE}>
                <Heart className="h-3.5 w-3.5 text-accent" />
                {isRTL ? "تبرع مالي" : "Donate"}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default MarkounLanding;