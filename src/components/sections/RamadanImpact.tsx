import { Droplets, Utensils, Package, HeartHandshake, Sparkles, ShieldCheck, ArrowLeft, Heart, BadgeCheck, FileCheck2, Camera } from "lucide-react";
import { useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLang } from "@/i18n/LangContext";
import waterImg from "@/assets/yusr-water.png";
import mealsImg from "@/assets/yusr-meals.webp";
import boxImg from "@/assets/yusr-ramadan-box.png";
import distImg from "@/assets/yusr-distribution-1.webp";
import hospitalImg from "@/assets/yusr-hospital.webp";
import orphansImg from "@/assets/yusr-orphans-meals.webp";
import heroBgLuxury from "@/assets/hero-banner-ref.png";
import heroHourglass from "@/assets/hero-hourglass.png";
import { Button } from "@/components/ui/button";
gsap.registerPlugin(ScrollTrigger);

/**
 * Ramadan multi-cause impact strip — water, meals, ramadan box, hospital visits.
 * Uses real campaign photos to build trust before the donate section.
 */
export const RamadanImpact = () => {
  const { lang } = useLang();
  const isAR = lang === "ar";
  const root = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !root.current) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const el = root.current;
    const ctx = gsap.context(() => {
      const dir = isAR ? -1 : 1;
      const cards = el.querySelectorAll("[data-ri='card']");
      const grid = el.querySelector("[data-ri='grid']");
      if (cards.length && grid) {
        gsap.fromTo(cards,
          { y: 36, x: 24 * dir, opacity: 0, rotateX: -6, transformPerspective: 800 },
          { y: 0, x: 0, opacity: 1, rotateX: 0, duration: 0.75, stagger: 0.12, ease: "power3.out",
            scrollTrigger: { trigger: grid, start: "top 88%" } });
      }
      const photos = el.querySelectorAll("[data-ri='photo']");
      const strip = el.querySelector("[data-ri='strip']");
      if (photos.length && strip) {
        gsap.fromTo(photos,
          { scale: 0.95, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.6, stagger: 0.08, ease: "power2.out",
            scrollTrigger: { trigger: strip, start: "top 92%" } });
      }
      const ctaBanner = el.querySelector("[data-ri='cta-banner']");
      if (ctaBanner) {
        gsap.fromTo(ctaBanner,
          { y: 30, opacity: 0, scale: 0.98 },
          { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: "power3.out",
            scrollTrigger: { trigger: ctaBanner, start: "top 92%" } });
        const trustItems = el.querySelectorAll("[data-ri='cta-trust'] > *");
        if (trustItems.length) {
          gsap.fromTo(trustItems,
            { y: 14, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.5, stagger: 0.07, ease: "power2.out",
              scrollTrigger: { trigger: ctaBanner, start: "top 88%" } });
        }
        const decorA = el.querySelector("[data-ri='banner-decor-a']");
        const decorB = el.querySelector("[data-ri='banner-decor-b']");
        const decorC = el.querySelector("[data-ri='banner-decor-c']");
        if (decorA) gsap.to(decorA, { yPercent: -18, ease: "none", scrollTrigger: { trigger: ctaBanner, start: "top bottom", end: "bottom top", scrub: 0.6 } });
        if (decorB) gsap.to(decorB, { yPercent: 14, ease: "none", scrollTrigger: { trigger: ctaBanner, start: "top bottom", end: "bottom top", scrub: 0.8 } });
        if (decorC) gsap.to(decorC, { yPercent: -10, xPercent: isAR ? 6 : -6, ease: "none", scrollTrigger: { trigger: ctaBanner, start: "top bottom", end: "bottom top", scrub: 0.7 } });
      }
    }, el);
    return () => ctx.revert();
  }, [isAR]);

  const cards = [
    {
      img: waterImg,
      icon: Droplets,
      tag: isAR ? "صدقة جارية" : "Sadaqah Jariyah",
      title: isAR ? "وصلة مياه واحدة = آلاف الحسنات يوميًا" : "One water line = thousands of rewards daily",
      desc:  isAR ? "صدقة جارية تجري عليك ما دامت تروي العطشى. استثمارك الأضمن." : "Continuous charity that flows as long as it quenches thirst.",
      cta:   { href: "/donate?cause=water", label: isAR ? "ساهم في وصلة مياه" : "Sponsor a water line" },
    },
    {
      img: mealsImg,
      icon: Utensils,
      tag: isAR ? "إفطار صائم" : "Iftar Share",
      title: isAR ? "وجبة الإفطار ليست مجرد طعام" : "Iftar isn't just a meal",
      desc:  isAR ? "ثواب إفطار صائم كامل — وأنت في بيتك. سعر السهم 250 جنيه." : "The full reward of feeding a fasting person — share = 250 EGP.",
      cta:   { href: "/donate?cause=iftar", label: isAR ? "تبرّع بسهم إفطار" : "Donate an iftar share" },
    },
    {
      img: boxImg,
      icon: Package,
      tag: isAR ? "كرتونة رمضان" : "Ramadan Box",
      title: isAR ? "كرتونة رمضان — إحسان لا ينقطع" : "Ramadan box — endless kindness",
      desc:  isAR ? "احتياجات أسرة كاملة طوال الشهر الكريم بسعر بسيط، تصل إلى باب البيت." : "A full family's monthly needs delivered to their door.",
      cta:   { href: "/donate?cause=ramadan-box", label: isAR ? "اكفل كرتونة" : "Sponsor a box" },
    },
  ];

  return (
    <section ref={root} className="relative overflow-hidden bg-[hsl(152_65%_12%)] text-primary-foreground py-14 sm:py-16 md:py-24">
      {/* Luxury brand backdrop — same family as Hero */}
      <img
        src={heroBgLuxury}
        alt=""
        aria-hidden
        loading="lazy"
        decoding="async"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-30"
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[hsl(152_65%_10%)]/85 via-[hsl(152_65%_12%)]/70 to-[hsl(152_65%_10%)]/95" />
      {/* Gold corner ornament rings — desktop only to keep mobile clean */}
      <div aria-hidden className="pointer-events-none absolute -top-24 -start-24 hidden h-72 w-72 rounded-full border border-secondary/20 md:block" />
      <div aria-hidden className="pointer-events-none absolute -bottom-24 -end-24 hidden h-72 w-72 rounded-full border border-secondary/20 md:block" />
      {/* Floating hourglass decor (desktop only) */}
      <img
        src={heroHourglass}
        alt=""
        aria-hidden
        loading="lazy"
        decoding="async"
        data-ri="float-decor"
        className="pointer-events-none absolute end-4 top-10 hidden w-28 opacity-70 drop-shadow-2xl lg:block xl:w-36"
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "ItemList",
              name: isAR ? "حملات رمضان — اليسر" : "Al-Yusr Ramadan Campaigns",
              itemListElement: cards.map((c, i) => ({
                "@type": "ListItem", position: i + 1,
                item: {
                  "@type": "Service",
                  name: c.title,
                  description: c.desc,
                  provider: { "@type": "NGO", name: "Al-Yusr Charity Foundation" },
                  areaServed: "Dakahlia, Egypt",
                  url: "https://elyusr.org" + c.cta.href,
                },
              })),
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: isAR ? "الرئيسية" : "Home", item: "https://elyusr.org/" },
                { "@type": "ListItem", position: 2, name: isAR ? "البرامج" : "Programs", item: "https://elyusr.org/#programs" },
                { "@type": "ListItem", position: 3, name: isAR ? "حملات رمضان" : "Ramadan Campaigns", item: "https://elyusr.org/#ramadan" },
              ],
            },
          ],
        })}</script>
      </Helmet>
      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-primary-foreground/5 px-3 py-1 text-[11px] font-extrabold text-secondary backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            {isAR ? "رمضانك في اليُسر" : "Your Ramadan with Al-Yusr"}
          </span>
          <h2 className="mt-3 text-[1.6rem] font-black leading-[1.3] text-primary-foreground sm:text-3xl md:text-4xl">
            {isAR ? (
              <>أبواب خير كثيرة — <span className="text-gradient-lime">اختر ما يلمس قلبك</span></>
            ) : (
              <>Many doors of giving — <span className="text-gradient-lime">pick what moves your heart</span></>
            )}
          </h2>
          <p className="mt-3 text-xs font-semibold text-primary-foreground/80 sm:text-sm md:text-base">
            {isAR
              ? "كل مشروع موثّق بالصور، ويصل إلى مستحقيه بأمانة في الدقهلية وكل مصر."
              : "Every cause photo-documented and delivered honestly across Dakahlia and Egypt."}
          </p>
          {/* Inline trust badges */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[10px] sm:text-[11px]">
            {[
              isAR ? "%99 شفافية" : "99% Transparency",
              isAR ? "مشهرة 2665/2019" : "Reg. 2665/2019",
              isAR ? "توثيق بالصور" : "Photo-documented",
            ].map((label) => (
              <span key={label} className="inline-flex items-center gap-1.5 rounded-full border border-secondary/25 bg-primary-foreground/5 px-2.5 py-1 font-extrabold text-primary-foreground/90 backdrop-blur">
                <ShieldCheck className="h-3 w-3 text-secondary" />
                {label}
              </span>
            ))}
          </div>
        </div>

        <div data-ri="grid" className="mt-8 grid gap-3 grid-cols-1 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3 md:mt-10">
          {cards.map(({ img, icon: Icon, title, desc, cta, tag }) => (
            <article
              data-ri="card"
              key={title}
              className="group relative overflow-hidden rounded-3xl bg-[hsl(152_55%_10%)]/80 ring-1 ring-secondary/25 shadow-card backdrop-blur transition-all duration-500 hover:-translate-y-1.5 hover:ring-secondary/60 hover:shadow-[0_20px_60px_-20px_hsl(75_85%_60%/0.35)]"
            >
              {/* Hover gold sheen */}
              <span aria-hidden className="pointer-events-none absolute inset-0 -z-0 bg-[radial-gradient(ellipse_at_top,hsl(75_85%_60%/0.18),transparent_55%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              {/* Gold corner accents */}
              <span aria-hidden className="pointer-events-none absolute start-2 top-2 h-5 w-5 rounded-tl-xl border-s-2 border-t-2 border-secondary/60 transition-all duration-500 group-hover:h-7 group-hover:w-7 group-hover:border-secondary" />
              <span aria-hidden className="pointer-events-none absolute end-2 bottom-2 h-5 w-5 rounded-br-xl border-e-2 border-b-2 border-secondary/60 transition-all duration-500 group-hover:h-7 group-hover:w-7 group-hover:border-secondary" />
              <div className="relative aspect-[4/3] overflow-hidden bg-[hsl(152_55%_8%)] sm:aspect-[4/5]">
                <img src={img} alt={title} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[hsl(152_65%_8%)] via-[hsl(152_65%_8%)]/30 to-transparent" />
                <span className="absolute end-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-secondary text-secondary-foreground shadow-cta sm:h-10 sm:w-10">
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </span>
                <span className="absolute start-3 bottom-3 inline-flex items-center gap-1 rounded-full border border-secondary/40 bg-[hsl(152_65%_8%)]/80 px-2.5 py-1 text-[10px] font-extrabold text-secondary backdrop-blur">
                  <Sparkles className="h-3 w-3" />
                  {tag}
                </span>
              </div>
              <div className="p-4 sm:p-5">
                <h3 className="text-sm font-extrabold leading-snug text-primary-foreground sm:text-base md:text-lg">{title}</h3>
                <p className="mt-2 text-[11px] font-semibold leading-relaxed text-primary-foreground/75 sm:text-xs md:text-sm">{desc}</p>
                <Button asChild className="mt-4 h-10 w-full bg-orange-grad text-xs font-extrabold text-accent-foreground shadow-cta hover:opacity-95 sm:text-sm">
                  <a href={cta.href} className="inline-flex items-center justify-center gap-2">
                    <Heart className="h-4 w-4" />
                    {cta.label}
                  </a>
                </Button>
              </div>
            </article>
          ))}
        </div>

        {/* Field photo strip */}
        <div data-ri="strip" className="mt-8 grid gap-2.5 grid-cols-2 sm:gap-3 sm:grid-cols-3 md:mt-10">
          {[
            { src: distImg,    alt: isAR ? "تقسيم وتوزيع كرتونات على الأسر" : "Distributing food boxes to families" },
            { src: hospitalImg,alt: isAR ? "زيارات مستشفى طلخا" : "Talkha hospital visits" },
            { src: orphansImg, alt: isAR ? "وجبات لأطفال دار الأيتام" : "Meals for orphanage kids" },
          ].map((p) => (
            <figure data-ri="photo" key={p.alt} className="relative overflow-hidden rounded-2xl ring-1 ring-secondary/25">
              <img src={p.src} alt={p.alt} loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover transition duration-500 hover:scale-105" />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[hsl(152_65%_8%)]/95 to-transparent p-2.5 text-[10px] font-extrabold text-primary-foreground sm:p-3 sm:text-[11px]">
                {p.alt}
              </figcaption>
            </figure>
          ))}
        </div>

        {/* Closing CTA banner — richer composition */}
        <div data-ri="cta-banner" className="relative mt-10 overflow-hidden rounded-3xl border border-secondary/30 bg-[hsl(152_65%_9%)]/90 p-5 text-center backdrop-blur sm:rounded-[2rem] sm:p-9 md:mt-14 md:p-12">
          {/* Layered backdrop */}
          <img
            src={heroBgLuxury}
            alt=""
            aria-hidden
            loading="lazy"
            decoding="async"
            data-ri="banner-decor-a"
            className="pointer-events-none absolute inset-0 -z-0 h-[130%] w-full object-cover opacity-25 will-change-transform"
          />
          <span aria-hidden className="pointer-events-none absolute inset-0 -z-0 bg-[radial-gradient(ellipse_at_center,hsl(75_85%_60%/0.18),transparent_65%)]" />
          <span aria-hidden className="pointer-events-none absolute inset-0 -z-0 bg-gradient-to-b from-[hsl(152_65%_8%)]/60 via-transparent to-[hsl(152_65%_8%)]/80" />
          {/* Gold corner ornaments — only the two top-anchored ones on mobile for cleanliness */}
          <span aria-hidden className="pointer-events-none absolute start-3 top-3 h-6 w-6 rounded-tl-2xl border-s-2 border-t-2 border-secondary/60 sm:h-8 sm:w-8" />
          <span aria-hidden className="pointer-events-none absolute end-3 top-3 h-6 w-6 rounded-tr-2xl border-e-2 border-t-2 border-secondary/60 sm:h-8 sm:w-8" />
          <span aria-hidden className="pointer-events-none absolute start-3 bottom-3 hidden h-8 w-8 rounded-bl-2xl border-s-2 border-b-2 border-secondary/60 sm:block" />
          <span aria-hidden className="pointer-events-none absolute end-3 bottom-3 hidden h-8 w-8 rounded-br-2xl border-e-2 border-b-2 border-secondary/60 sm:block" />
          {/* Floating hourglass parallax decor (desktop) */}
          <img
            src={heroHourglass}
            alt=""
            aria-hidden
            loading="lazy"
            decoding="async"
            data-ri="banner-decor-b"
            className="pointer-events-none absolute -end-6 -top-6 hidden w-28 opacity-60 drop-shadow-2xl will-change-transform md:block lg:w-36"
          />
          <img
            src={heroHourglass}
            alt=""
            aria-hidden
            loading="lazy"
            decoding="async"
            data-ri="banner-decor-c"
            className="pointer-events-none absolute -start-8 -bottom-8 hidden w-24 -scale-x-100 opacity-40 drop-shadow-2xl will-change-transform md:block lg:w-32"
          />

          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-secondary/40 bg-primary-foreground/5 px-3 py-1 text-[10px] font-extrabold text-secondary backdrop-blur sm:text-[11px]">
              <Sparkles className="h-3.5 w-3.5" />
              {isAR ? "ختام رمضانك في اليُسر" : "Make your Ramadan count"}
            </span>
            <h3 className="mt-3 text-xl font-black leading-tight text-primary-foreground sm:text-3xl md:text-4xl">
              {isAR ? (<>تبرع واحد… <span className="text-gradient-lime">يفطر بيت كامل</span></>) : (<>One donation… <span className="text-gradient-lime">feeds a whole family</span></>)}
            </h3>
            <p className="mx-auto mt-3 max-w-xl text-xs font-semibold text-primary-foreground/85 sm:text-sm md:text-base">
              {isAR
                ? "كل جنيه يصل إلى مستحقيه في الدقهلية وكل مصر، بشفافية كاملة وتوثيق بالصور."
                : "Every pound reaches its rightful recipients, fully transparent with photo proof."}
            </p>

            {/* Trust badges row — show top 2 on mobile, full grid on larger */}
            <div data-ri="cta-trust" className="mx-auto mt-5 grid max-w-3xl grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
              {[
                { I: BadgeCheck, t: isAR ? "%99 شفافية" : "99% Transparency" },
                { I: FileCheck2, t: isAR ? "مشهرة 2665/2019" : "Reg. 2665/2019" },
                { I: Camera,     t: isAR ? "توثيق بالصور" : "Photo proof" },
                { I: ShieldCheck,t: isAR ? "أمانة شرعية" : "Shariah-compliant" },
              ].map(({ I, t }) => (
                <span key={t} className="inline-flex items-center justify-center gap-1.5 rounded-full border border-secondary/30 bg-primary-foreground/5 px-2.5 py-1.5 text-[10px] font-extrabold text-primary-foreground/90 backdrop-blur sm:text-[11px]">
                  <I className="h-3.5 w-3.5 text-secondary" />
                  {t}
                </span>
              ))}
            </div>

            {/* Transparency live counter */}
            <div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-[hsl(152_65%_8%)]/70 px-3 py-1.5 text-[10px] font-extrabold text-primary-foreground/90 backdrop-blur sm:text-[11px]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inset-0 animate-ping rounded-full bg-secondary/70" />
                <span className="relative h-2 w-2 rounded-full bg-secondary" />
              </span>
              {isAR ? "رقم الشفافية: " : "Transparency line: "}
              <a href="tel:+201097000137" dir="ltr" className="text-secondary hover:underline">+20 109 700 0137</a>
            </div>

            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 w-full bg-orange-grad px-6 text-sm font-extrabold text-accent-foreground shadow-cta animate-pulse-glow hover:opacity-95 sm:h-14 sm:w-auto sm:text-base">
                <a href="/donate" className="inline-flex items-center justify-center gap-2">
                  <Heart className="h-5 w-5" />
                  {isAR ? "تبرّع الآن لرمضان" : "Donate now for Ramadan"}
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 w-full border-secondary/40 bg-primary-foreground/5 px-6 text-sm font-extrabold text-primary-foreground backdrop-blur hover:bg-secondary/20 hover:text-primary-foreground sm:h-14 sm:w-auto sm:text-base">
                <a href="#programs" className="inline-flex items-center justify-center gap-2">
                  {isAR ? "كل الحملات" : "View all causes"}
                  <ArrowLeft className="h-4 w-4 [dir=ltr]:rotate-180" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RamadanImpact;