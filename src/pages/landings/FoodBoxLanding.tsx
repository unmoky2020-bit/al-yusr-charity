import { useState } from "react";
import { Link } from "react-router-dom";
import { Beef, Package, UtensilsCrossed, ShieldCheck, FileCheck2, MapPin, ArrowLeft, ArrowRight, Minus, Plus, Scale, Stethoscope, Truck, Camera, Boxes, HandPlatter, type LucideIcon } from "lucide-react";
import { CampaignLandingShell } from "@/components/sections/CampaignLandingShell";
import { amountHref, waHref, fmtNum, CampaignCrumbs, HeroActions, BentoGallery } from "@/components/campaigns/shared";
import { HadithBlock } from "@/components/campaigns/HadithBlock";
import { useCampaignPage } from "@/hooks/useCampaignPage";
import FOOD_DEFAULTS from "@/data/campaignPages/food";
import heroCarton from "@/assets/hero-carton-opened.webp";
import meatPlates from "@/assets/poster-meat.webp";
import mealsBoxes from "@/assets/yusr-orphans-meals.webp";

import { campaignDonateHref } from "@/data/campaignPages/index";
const DONATE = campaignDonateHref("food");
const SLUG = "food";

/**
 * The three parts of the programme. Words come from `FOOD_DEFAULTS.sections.pillars`; the image,
 * icon, the price shown on the card and the in-page anchor stay in code.
 */
const PILLAR_META: Record<string, { icon: LucideIcon; img: string; priceId: string; anchor: string }> = {
  meat: { icon: Beef, img: meatPlates, priceId: "meat_share", anchor: "meat" },
  carton: { icon: Package, img: heroCarton, priceId: "carton", anchor: "carton" },
  meals: { icon: UtensilsCrossed, img: mealsBoxes, priceId: "meal", anchor: "meals" },
};

/** Meal counts fixed by the ruling: one meal per poor person, ten for an oath, sixty for a fast. */
const MEAL_META: Record<string, { icon: LucideIcon; priceId: string; count: number | null }> = {
  feeding: { icon: HandPlatter, priceId: "meal", count: null },
  kaffara_yameen: { icon: Scale, priceId: "kaffara_yameen", count: 10 },
  kaffara_siyam: { icon: Scale, priceId: "kaffara_siyam", count: 60 },
};

const MEAT_ICONS: Record<string, LucideIcon> = { farm: Stethoscope, pack: Boxes, deliver: Truck, proof: Camera };
const TRUST_ICONS: Record<string, LucideIcon> = { ngo: ShieldCheck, docs: FileCheck2, areas: MapPin };

/** Segment colours of the carton weight bar, cycled in order. */
const BAR_COLOURS = ["bg-secondary", "bg-accent", "bg-primary", "bg-[hsl(42_80%_60%)]", "bg-[hsl(152_45%_35%)]", "bg-[hsl(18_75%_55%)]"];

const PriceButton = ({ to, label, amount, isAr, primary = false }: { to: string; label: string; amount: number; isAr: boolean; primary?: boolean }) => {
  const Arrow = isAr ? ArrowLeft : ArrowRight;
  return (
    <Link
      to={to}
      className={`group flex items-center justify-between gap-3 rounded-xl border-2 p-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        primary ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90" : "border-border bg-card hover:border-primary"
      }`}
    >
      <span>
        <span className={`block text-sm font-bold ${primary ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{label}</span>
        <span className={`mt-0.5 block text-2xl font-black tabular-nums ${primary ? "text-secondary" : "text-primary"}`}>
          {fmtNum(amount, isAr)} <span className="text-sm font-bold">{isAr ? "جنيه" : "EGP"}</span>
        </span>
      </span>
      <Arrow className={`h-5 w-5 transition-transform group-hover:-translate-x-0.5 rtl:group-hover:translate-x-0.5 ${primary ? "text-secondary" : "text-accent"}`} />
    </Link>
  );
};

const FoodHero = () => {
  const { c, t, isAr, section, amount, images } = useCampaignPage(SLUG, FOOD_DEFAULTS);
  const heroImg = images("hero")[0];
  const trust = section("trust")?.items ?? [];
  // The carton's weight is the sum of its (editable) ingredients; 14 is the design figure if the list is empty.
  const cartonKg = (section("carton")?.items ?? []).reduce((s, it) => s + (Number.parseFloat(it.extra?.en || it.extra?.ar || "0") || 0), 0) || 14;
  return (
    <section className="food-hero relative overflow-hidden text-primary-foreground">
      {/* A warm "plate" glow: the table the programme sets every month */}
      <div aria-hidden className="pointer-events-none absolute -top-24 end-[-8rem] h-72 w-72 md:end-[2%] md:top-[-8rem] md:h-[36rem] md:w-[36rem]">
        <div className="food-plate absolute inset-0 rounded-full" />
        <div className="absolute inset-[-12%] rounded-full border border-secondary/15" />
        <div className="absolute inset-[-28%] rounded-full border border-secondary/10" />
      </div>

      <div className="container relative mx-auto max-w-6xl px-4 pb-16 pt-10 md:pb-20 md:pt-14">
        <CampaignCrumbs isAr={isAr} name={isAr ? "الغذاء الشهري" : "Monthly food"} className="text-primary-foreground/80" />
        <div className="mt-10 grid items-center gap-10 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <div className="text-center md:text-start">
            <p className="text-sm font-black text-secondary">{t(c.hero.eyebrow)}</p>
            <h1 className="mt-3 text-4xl font-black leading-[1.25] sm:text-5xl lg:text-6xl">
              {t(c.hero.title)}{" "}
              <span className="mt-1 block text-secondary">{t(c.hero.title2)}</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-[1.9] text-primary-foreground/85 md:mx-0 md:text-lg">
              {t(c.hero.lead)}
            </p>
            <HeroActions isAr={isAr} donateHref={DONATE} donateLabel={t(c.hero.donateLabel)} wa={waHref(isAr, "برنامج الغذاء الشهري", "the monthly food programme")} className="mt-8 justify-center md:justify-start" />
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <img src={heroImg?.src ?? heroCarton} alt={heroImg ? (isAr ? heroImg.altAr : heroImg.altEn) : ""} loading="eager" width={1520} height={1013} className="relative w-full rounded-2xl object-cover shadow-card ring-1 ring-primary-foreground/15" />
            {/* The two numbers a donor remembers */}
            <div className="absolute -bottom-4 start-3 flex gap-2 sm:-bottom-5 sm:start-4">
              <span className="food-tag rounded-xl bg-secondary px-4 py-2 text-secondary-foreground shadow-cta">
                <span className="block text-2xl font-black leading-none tabular-nums">{fmtNum(cartonKg, isAr)}</span>
                <span className="block text-[11px] font-bold">{isAr ? "كيلو في الكرتونة" : "kg in the carton"}</span>
              </span>
              <span className="food-tag rounded-xl bg-accent px-4 py-2 text-accent-foreground shadow-cta" style={{ animationDelay: "120ms" }}>
                <span className="block text-2xl font-black leading-none tabular-nums">{fmtNum(1, isAr)}</span>
                <span className="block text-[11px] font-bold">{isAr ? "كيلو لحمة شهرياً" : "kg of meat monthly"}</span>
              </span>
              <span className="food-tag rounded-xl bg-primary-foreground px-4 py-2 text-primary shadow-cta" style={{ animationDelay: "240ms" }}>
                <span className="block text-2xl font-black leading-none tabular-nums">{fmtNum(amount("meal"), isAr)}</span>
                <span className="block text-[11px] font-bold">{isAr ? "جنيه للوجبة" : "EGP per meal"}</span>
              </span>
            </div>
          </div>
        </div>

        <ul className="mt-14 grid grid-cols-1 gap-3 text-sm font-bold text-primary-foreground/85 sm:grid-cols-3 md:mt-12">
          {trust.map((it) => {
            const I = TRUST_ICONS[it.id] ?? ShieldCheck;
            return (
              <li key={it.id} className="flex items-center justify-center gap-2 md:justify-start">
                <I className="h-4 w-4 shrink-0 text-secondary" /> {t(it.title)}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
};

const FoodMain = () => {
  const { c, t, isAr, price, amount, section, images } = useCampaignPage(SLUG, FOOD_DEFAULTS);
  const galleryImgs = images("gallery");
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  const hadith2 = section("hadith2")?.items[0];
  const pillars = section("pillars");
  const carton = section("carton");
  const meat = section("meat");
  const meals = section("meals");
  const sponsor = section("sponsor");
  const steps = section("steps");
  const areas = section("areas");
  const areasNow = section("areas_now");
  const areasBefore = section("areas_before");

  // Carton weight bar: each item's `extra` holds its weight in kg.
  const cartonItems = (carton?.items ?? []).map((it) => ({ ...it, kg: Number.parseFloat(it.extra?.en || it.extra?.ar || "0") || 0 }));
  const totalKg = cartonItems.reduce((s, it) => s + it.kg, 0);

  // Feeding: the donor picks how many meals.
  const mealPrice = amount("meal", 75);
  const [mealCount, setMealCount] = useState(5);
  const fidya = price("fidya");

  return (
    <>
      {/* Second hadith band, continuing the hero ground */}
      <section className="food-hero pb-16 text-primary-foreground md:pb-20">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <p className="text-sm font-black text-secondary/80">{t(section("hadith2")?.title)}</p>
          <blockquote className="mt-3 text-2xl font-black leading-[1.7] text-secondary md:text-3xl">{t(hadith2?.title)}</blockquote>
          <p className="mt-4 text-sm font-bold text-primary-foreground/70">{t(hadith2?.desc)}</p>
        </div>
      </section>

      {/* The three parts */}
      <section className="bg-background py-16 md:py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="max-w-2xl">
            <p className="text-sm font-black text-accent">{t(pillars?.lead)}</p>
            <h2 className="mt-2 text-3xl font-black text-primary md:text-4xl">{t(pillars?.title)}</h2>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {(pillars?.items ?? []).map((it, i) => {
              const m = PILLAR_META[it.id];
              if (!m) return null;
              const I = m.icon;
              const p = price(m.priceId);
              return (
                <article key={it.id} className="food-card group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft" style={{ animationDelay: `${i * 90}ms` }}>
                  <a href={`#${m.anchor}`} className="relative block overflow-hidden bg-muted">
                    <img src={m.img} alt={t(it.title)} loading="lazy" className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                    <span className="absolute start-3 top-3 inline-flex items-center gap-1.5 rounded-lg bg-primary/90 px-3 py-1.5 text-xs font-black text-primary-foreground backdrop-blur">
                      <I className="h-4 w-4 text-secondary" /> {t(it.extra)}
                    </span>
                  </a>
                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    <h3 className="text-xl font-black text-primary">{t(it.title)}</h3>
                    <p className="mt-2 flex-1 text-sm leading-[1.85] text-foreground/80 sm:text-base">{t(it.desc)}</p>
                    {p && (
                      <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4">
                        <span>
                          <span className="block text-xs font-bold text-muted-foreground">{t(p.label)}</span>
                          <span className="block text-xl font-black tabular-nums text-primary">{fmtNum(p.amount, isAr)} <span className="text-xs font-bold">{isAr ? "جنيه" : "EGP"}</span></span>
                        </span>
                        <Link to={amountHref(DONATE, p.amount)} className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-orange-grad px-4 text-sm font-black text-accent-foreground shadow-cta hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                          {isAr ? "تبرّع" : "Donate"} <Arrow className="h-4 w-4" />
                        </Link>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* The carton: a 14 kg weight bar */}
      <section id="carton" className="food-cloth scroll-mt-24 py-16 md:py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14">
            <div>
              <p className="text-sm font-black text-accent">{isAr ? "الركن الثاني" : "Part two"}</p>
              <h2 className="mt-2 text-3xl font-black text-primary md:text-4xl">{t(carton?.title)}</h2>
              <p className="mt-4 max-w-[55ch] text-base leading-[1.9] text-foreground/80">{t(carton?.lead)}</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {price("carton") && <PriceButton to={amountHref(DONATE, amount("carton"))} label={t(price("carton")?.label)} amount={amount("carton")} isAr={isAr} />}
                {price("full") && <PriceButton to={amountHref(DONATE, amount("full"))} label={t(price("full")?.note ?? price("full")?.label)} amount={amount("full")} isAr={isAr} primary />}
              </div>
            </div>

            {cartonItems.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-8">
              <div className="flex items-end justify-between gap-4">
                <p className="text-sm font-bold text-muted-foreground">{isAr ? "الوزن حسب الصنف" : "Weight by item"}</p>
                <p className="text-3xl font-black tabular-nums text-primary">
                  {fmtNum(totalKg, isAr)} <span className="text-base font-bold text-muted-foreground">{isAr ? "كيلو" : "kg"}</span>
                </p>
              </div>
              <div className="mt-4 flex h-10 w-full overflow-hidden rounded-xl bg-muted" role="img" aria-label={isAr ? `شريط يوضح وزن كل صنف من إجمالي ${totalKg} كيلو` : `Bar showing each item's share of ${totalKg} kg`}>
                {cartonItems.map((it, i) => (
                  <span
                    key={it.id}
                    title={`${t(it.title)}: ${t(it.desc)}`}
                    className={`food-seg h-full ${BAR_COLOURS[i % BAR_COLOURS.length]} ${i > 0 ? "border-s border-card" : ""}`}
                    style={{ width: `${totalKg ? (it.kg / totalKg) * 100 : 0}%`, animationDelay: `${i * 70}ms` }}
                  />
                ))}
              </div>
              <ul className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
                {cartonItems.map((it, i) => (
                  <li key={it.id} className="flex items-center gap-2.5">
                    <span aria-hidden className={`h-3.5 w-3.5 shrink-0 rounded-[4px] ${BAR_COLOURS[i % BAR_COLOURS.length]}`} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-black text-primary">{t(it.title)}</span>
                      <span className="block text-xs font-bold tabular-nums text-muted-foreground">{t(it.desc)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            )}
          </div>
        </div>
      </section>

      {/* The monthly slaughter */}
      <section id="meat" className="scroll-mt-24 bg-background py-16 md:py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <figure className="relative overflow-hidden rounded-2xl bg-muted shadow-card">
              <img src={meatPlates} alt={isAr ? "أطباق لحم ذبيحة الشهر مقسّمة للأسر" : "Plates of the month's slaughter meat portioned for families"} loading="lazy" className="aspect-[4/3] w-full object-cover object-[50%_45%] lg:aspect-square" />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-4 pt-12 text-sm font-bold text-white">
                {isAr ? "كيلو لكل أسرة، طازج في يوم الذبح" : "One kilo per family, fresh on slaughter day"}
              </figcaption>
            </figure>
            <div>
              <p className="text-sm font-black text-accent">{isAr ? "الركن الأول" : "Part one"}</p>
              <h2 className="mt-2 text-3xl font-black text-primary md:text-4xl">{t(meat?.title)}</h2>
              <p className="mt-4 max-w-[55ch] text-base leading-[1.9] text-foreground/80">{t(meat?.lead)}</p>
              <ol className="mt-8 space-y-4">
                {(meat?.items ?? []).map((st, i) => {
                  const I = MEAT_ICONS[st.id] ?? Beef;
                  return (
                    <li key={st.id} className="flex gap-4">
                      <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary text-secondary">
                        <I className="h-5 w-5" />
                        <span className="absolute -bottom-1 -end-1 grid h-5 w-5 place-items-center rounded-full bg-secondary font-mono text-[11px] font-black text-secondary-foreground">{fmtNum(i + 1, isAr)}</span>
                      </span>
                      <span>
                        <span className="block text-lg font-black text-primary">{t(st.title)}</span>
                        <span className="mt-1 block text-sm leading-relaxed text-foreground/75 sm:text-base">{t(st.desc)}</span>
                      </span>
                    </li>
                  );
                })}
              </ol>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {price("meat_share") && <PriceButton to={amountHref(DONATE, amount("meat_share"))} label={t(price("meat_share")?.label)} amount={amount("meat_share")} isAr={isAr} primary />}
                {price("meat_kg") && <PriceButton to={amountHref(DONATE, amount("meat_kg"))} label={t(price("meat_kg")?.label)} amount={amount("meat_kg")} isAr={isAr} />}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Meals: feeding, oath expiation, fasting expiation */}
      <section id="meals" className="food-hero scroll-mt-24 py-16 text-primary-foreground md:py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="max-w-2xl">
            <p className="text-sm font-black text-secondary">{isAr ? "الركن الثالث" : "Part three"}</p>
            <h2 className="mt-2 text-3xl font-black md:text-4xl">{t(meals?.title)}</h2>
            <p className="mt-4 text-base leading-[1.9] text-primary-foreground/85">{t(meals?.lead)}</p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {(meals?.items ?? []).map((it) => {
              const m = MEAL_META[it.id];
              if (!m) return null;
              const I = m.icon;
              const fixed = price(m.priceId);
              const count = m.count ?? mealCount;
              const total = m.count ? (fixed?.amount ?? m.count * mealPrice) : mealCount * mealPrice;
              return (
                <article key={it.id} className="flex flex-col rounded-2xl bg-primary-foreground/[0.06] p-6 ring-1 ring-primary-foreground/10">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground"><I className="h-5 w-5" /></span>
                    <h3 className="text-xl font-black">{t(it.title)}</h3>
                  </div>
                  <p className="mt-4 rounded-lg border-s-4 border-secondary bg-primary-foreground/[0.06] px-3 py-2 text-sm font-bold leading-relaxed text-secondary">{t(it.extra)}</p>
                  <p className="mt-3 flex-1 text-sm leading-[1.85] text-primary-foreground/80">{t(it.desc)}</p>

                  {m.count === null ? (
                    <div className="mt-5 flex items-center justify-between gap-3 rounded-xl bg-primary-foreground/[0.08] p-2">
                      <button type="button" onClick={() => setMealCount((n) => Math.max(1, n - 1))} aria-label={isAr ? "وجبة أقل" : "One meal fewer"} className="grid h-10 w-10 place-items-center rounded-lg bg-primary-foreground/10 hover:bg-primary-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"><Minus className="h-4 w-4" /></button>
                      <span className="text-center">
                        <span className="block text-2xl font-black tabular-nums">{fmtNum(mealCount, isAr)}</span>
                        <span className="block text-[11px] font-bold text-primary-foreground/70">{isAr ? "وجبة" : "meals"}</span>
                      </span>
                      <button type="button" onClick={() => setMealCount((n) => Math.min(500, n + 1))} aria-label={isAr ? "وجبة أكثر" : "One meal more"} className="grid h-10 w-10 place-items-center rounded-lg bg-primary-foreground/10 hover:bg-primary-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"><Plus className="h-4 w-4" /></button>
                    </div>
                  ) : (
                    <p className="mt-5 text-sm font-bold text-primary-foreground/75">
                      {isAr ? `${fmtNum(count, true)} وجبة × ${fmtNum(mealPrice, true)} جنيه` : `${count} meals × ${mealPrice} EGP`}
                    </p>
                  )}

                  <Link to={amountHref(DONATE, total)} className="mt-3 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-orange-grad px-5 text-base font-black text-accent-foreground shadow-cta hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary">
                    {isAr ? "تبرّع بـ" : "Give"} {fmtNum(total, isAr)} {isAr ? "جنيه" : "EGP"} <Arrow className="h-4 w-4" />
                  </Link>
                </article>
              );
            })}
          </div>

          {fidya && (
            <p className="mt-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-sm font-bold text-primary-foreground/80">
              <span>{t(fidya.note)}:</span>
              <Link to={amountHref(DONATE, fidya.amount)} className="underline decoration-secondary decoration-2 underline-offset-4 hover:text-secondary">
                {t(fidya.label)} {fmtNum(fidya.amount, isAr)} {isAr ? "جنيه" : "EGP"}
              </Link>
            </p>
          )}
        </div>
      </section>

      {/* Sponsorship tiers */}
      <section className="bg-muted/40 py-16 md:py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-black text-primary md:text-4xl">{t(sponsor?.title)}</h2>
            <p className="mt-3 text-base leading-[1.9] text-foreground/75">{t(sponsor?.lead)}</p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {(sponsor?.items ?? []).map((tier, i) => {
              const p = price(tier.id);
              if (!p) return null;
              const hot = i === 1;
              return (
                <article key={tier.id} className={`relative flex flex-col rounded-2xl p-6 ${hot ? "bg-primary text-primary-foreground shadow-card ring-2 ring-secondary" : "border border-border bg-card"}`}>
                  {hot && <span className="absolute -top-3 start-6 rounded-full bg-secondary px-3 py-1 text-xs font-black text-secondary-foreground">{isAr ? "الأكثر اختياراً" : "Most chosen"}</span>}
                  <h3 className={`text-lg font-black ${hot ? "" : "text-primary"}`}>{t(tier.title)}</h3>
                  <p className={`mt-2 text-4xl font-black tabular-nums ${hot ? "text-secondary" : "text-primary"}`}>
                    {fmtNum(p.amount, isAr)} <span className={`text-sm font-bold ${hot ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{isAr ? "جنيه" : "EGP"}</span>
                  </p>
                  <p className={`mt-3 flex-1 text-sm leading-relaxed ${hot ? "text-primary-foreground/80" : "text-foreground/75"}`}>{t(tier.desc)}</p>
                  <Link to={amountHref(DONATE, p.amount)} className={`mt-5 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-5 text-base font-black focus-visible:outline-none focus-visible:ring-2 ${hot ? "bg-orange-grad text-accent-foreground shadow-cta hover:opacity-95 focus-visible:ring-secondary" : "border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground focus-visible:ring-ring"}`}>
                    {isAr ? "اكفل الآن" : "Sponsor now"} <Arrow className="h-4 w-4" />
                  </Link>
                </article>
              );
            })}
          </div>
          <Link to={DONATE} className="mt-6 inline-flex min-h-[44px] items-center text-sm font-black text-primary underline decoration-secondary decoration-2 underline-offset-4 hover:text-accent">
            {isAr ? "أو تبرّع بأي مبلغ تجود به" : "Or give any amount"}
          </Link>
        </div>
      </section>

      <HadithBlock hadith={{ ar: c.hadith.text.ar, en: c.hadith.text.en, sourceAr: c.hadith.source.ar, sourceEn: c.hadith.source.en }} tone="light" />

      {/* Journey of the donation */}
      <section className="bg-background py-16 md:py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-black text-primary md:text-4xl">{t(steps?.title)}</h2>
          <ol className="relative mt-10 grid gap-8 md:grid-cols-4 md:gap-6">
            <span aria-hidden className="absolute start-[22px] top-0 h-full w-[3px] rounded-full bg-gradient-to-b from-accent to-secondary md:start-0 md:top-[22px] md:h-[3px] md:w-full md:bg-gradient-to-l" />
            {(steps?.items ?? []).map((s, i) => (
              <li key={s.id} className="relative ps-16 md:ps-0 md:pt-16">
                <span className="absolute start-0 top-0 grid h-12 w-12 place-items-center rounded-full border-4 border-background bg-primary font-mono text-lg font-black text-secondary">
                  {fmtNum(i + 1, isAr)}
                </span>
                <h3 className="text-lg font-black text-primary">{t(s.title)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground/75 sm:text-base">{t(s.desc)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Where we work */}
      <section className="bg-muted/40 py-16 md:py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-black text-primary md:text-4xl">{t(areas?.title)}</h2>
          <p className="mt-3 max-w-2xl text-base text-foreground/75">{t(areas?.lead)}</p>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border-2 border-primary bg-card p-6">
              <p className="text-sm font-black text-accent">{t(areasNow?.title)}</p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {(areasNow?.items ?? []).map((a) => <li key={a.id} className="rounded-lg bg-primary px-4 py-2 font-black text-primary-foreground">{t(a.title)}</li>)}
              </ul>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6">
              <p className="text-sm font-black text-muted-foreground">{t(areasBefore?.title)}</p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {(areasBefore?.items ?? []).map((a) => <li key={a.id} className="rounded-lg bg-muted px-4 py-2 font-bold text-primary">{t(a.title)}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Field documentation */}
      <section className="bg-background py-16 md:py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-black text-primary md:text-4xl">{t(section("gallery")?.title)}</h2>
          <div className="mt-8"><BentoGallery items={galleryImgs} isAr={isAr} /></div>
        </div>
      </section>
    </>
  );
};

const FoodBoxLanding = () => {
  const { c, section, images } = useCampaignPage(SLUG, FOOD_DEFAULTS);
  const seo = section("seo");
  return (
    <CampaignLandingShell
      slug="food-box-meat"
      seo={c.seo}
      path="/food-box"
      titleAr={seo?.title.ar ?? ""}
      titleEn={seo?.title.en ?? ""}
      taglineAr={seo?.lead?.ar ?? ""}
      taglineEn={seo?.lead?.en ?? ""}
      metaDescAr="برنامج الغذاء الشهري من مؤسسة اليسر: لحوم من ذبائح شهرية، كرتونة ١٤ كيلو من المكونات الغذائية البلدي، ووجبات إطعام تصلح كفارة صيام أو كفارة يمين. توصيل لباب البيت في المنصورة والدقهلية وكل مصر، بتوثيق بالصور."
      metaDescEn="Al-Yusr's monthly food programme: meat from monthly slaughters, a 14 kg carton of local staples, and cooked meals for feeding, fasting expiation or oath expiation. Doorstep delivery in Mansoura, Dakahlia and all Egypt, with photo proof."
      heroImage={images("hero")[0]?.src ?? heroCarton}
      heroAlt="الغذاء الشهري — كرتونة ١٤ كيلو ولحوم الذبائح الشهرية ووجبات الإطعام"
      hero={<FoodHero />}
      main={<FoodMain />}
      finalCtaClassName="food-hero"
      relatedLinks={[
        { href: "/ramadan", ar: "موسم الخير (رمضان)", en: "Ramadan season" },
        { href: "/qurbani", ar: "صكوك الأضاحي", en: "Qurbani shares" },
        { href: "/farm", ar: "المزرعة الوقفية ومصدر اللحوم", en: "Endowment farm, the meat source" },
        { href: "/zakat", ar: "زكاة المال", en: "Zakat" },
        { href: "/trust", ar: "الشفافية والتقارير", en: "Trust & reports" },
      ]}
      faq={{
        ar: c.faq.map((f) => ({ q: f.q.ar, a: f.a.ar })),
        en: c.faq.map((f) => ({ q: f.q.en, a: f.a.en })),
      }}
      donateHref={DONATE}
      donateLabelAr={c.hero.donateLabel.ar}
      donateLabelEn={c.hero.donateLabel.en}
      bottomCtaAr={c.cta.title.ar}
      bottomCtaEn={c.cta.title.en}
      bottomSubAr={c.cta.sub.ar}
      bottomSubEn={c.cta.sub.en}
    />
  );
};

export default FoodBoxLanding;
