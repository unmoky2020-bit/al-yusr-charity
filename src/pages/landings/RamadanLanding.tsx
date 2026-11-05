import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Package, Heart, HandCoins, Baby, Utensils, Beef, Droplets, Check, Minus, Plus } from "lucide-react";
import { CampaignLandingShell } from "@/components/sections/CampaignLandingShell";
import { amountHref, waHref, fmtNum, CampaignCrumbs, HeroActions, BentoGallery, useAfterLoad } from "@/components/campaigns/shared";
import { Crescent, Lantern, Star8, NightSky } from "@/components/campaigns/RamadanDecor";
import { useCampaignPage } from "@/hooks/useCampaignPage";
import RAMADAN_DEFAULTS from "@/data/campaignPages/ramadan";
import yusrRamadanBox from "@/assets/yusr-ramadan-box.png";

import { campaignDonateHref } from "@/data/campaignPages/index";
const DONATE = campaignDonateHref("ramadan");

/** Order of the giving-table rows (price ids from the content model). */
const TABLE_IDS = ["iftar", "fitr", "meat", "eid_clothes", "box", "bride"];

/** Moon phase icon per timeline step, by index. */
const MOON_PHASES = ["new", "half", "full"] as const;

/** Icon per achievement stat id. Wide tiles: `boxes` and `sadaqa`. */
const STAT_ICONS: Record<string, typeof Package> = {
  boxes: Package,
  brides: Heart,
  zakat_families: HandCoins,
  orphans: Baby,
  iftar_meals: Utensils,
  cattle: Beef,
  sheep: Beef,
  sadaqa: Droplets,
};
const WIDE_STATS = new Set(["boxes", "sadaqa"]);

const MoonIcon = ({ phase }: { phase: "new" | "half" | "full" }) => (
  <svg viewBox="0 0 40 40" className="h-10 w-10" aria-hidden>
    <circle cx="20" cy="20" r="16" fill="hsl(var(--gold) / 0.18)" stroke="hsl(var(--gold))" strokeWidth="1.5" />
    {phase === "new" && <path d="M24 5a16 16 0 1 0 0 30a13 13 0 1 1 0-30Z" fill="hsl(var(--gold))" />}
    {phase === "half" && <path d="M20 4a16 16 0 0 1 0 32Z" fill="hsl(var(--gold))" />}
    {phase === "full" && <circle cx="20" cy="20" r="16" fill="hsl(var(--gold))" />}
  </svg>
);

const Counter = ({ isAr, value, setValue, min, max, step, labelAr, labelEn }: { isAr: boolean; value: number; setValue: (n: number) => void; min: number; max: number; step: number; labelAr: string; labelEn: string }) => (
  <div className="mt-5 flex items-center gap-3">
    <button type="button" aria-label={isAr ? "أقل" : "Less"} disabled={value <= min} onClick={() => setValue(Math.max(min, value - step))} className="grid h-12 w-12 place-items-center rounded-xl border-2 border-primary/25 text-primary transition-colors hover:bg-primary/5 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <Minus className="h-5 w-5" />
    </button>
    <output className="min-w-[7rem] text-center text-3xl font-black tabular-nums text-primary" aria-live="polite">
      {fmtNum(value, isAr)} <span className="text-base font-bold text-muted-foreground">{isAr ? labelAr : labelEn}</span>
    </output>
    <button type="button" aria-label={isAr ? "أكثر" : "More"} disabled={value >= max} onClick={() => setValue(Math.min(max, value + step))} className="grid h-12 w-12 place-items-center rounded-xl border-2 border-primary/25 text-primary transition-colors hover:bg-primary/5 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <Plus className="h-5 w-5" />
    </button>
  </div>
);

const RamadanHero = () => {
  const { c, t, isAr, images } = useCampaignPage("ramadan", RAMADAN_DEFAULTS);
  const heroImg = images("hero")[0];
  const live = useAfterLoad();
  return (
    <section className="ramadan-night relative overflow-hidden text-primary-foreground">
      <NightSky />
      <Crescent className="absolute end-[8%] top-16 h-24 w-24 text-[hsl(var(--gold))] md:h-32 md:w-32" />
      <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-between px-[6%] md:px-[14%]">
        <Lantern len={60} size={44} delay={0} live={live} />
        <Lantern len={120} size={56} delay={700} live={live} className="hidden sm:block" />
        <Lantern len={40} size={40} delay={1300} live={live} className="hidden md:block" />
        <Lantern len={95} size={50} delay={300} live={live} />
      </div>

      <div className="container relative mx-auto max-w-6xl px-4 pb-20 pt-10 md:pb-24 md:pt-14">
        <CampaignCrumbs isAr={isAr} name={isAr ? "موسم الخير" : "Ramadan"} className="text-primary-foreground/80" />
        <div className="mt-36 grid items-end gap-12 md:mt-40 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <div className="text-center md:text-start">
            <p className="text-sm font-black text-[hsl(var(--gold))]">{t(c.hero.eyebrow)}</p>
            <h1 className="mt-3 text-4xl font-black leading-[1.3] sm:text-5xl lg:text-6xl">
              {t(c.hero.title)}{" "}
              <span className="mt-1 block text-[hsl(var(--gold))]">{t(c.hero.title2)}</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-[1.9] text-primary-foreground/85 md:mx-0 md:text-lg">
              {t(c.hero.lead)}
            </p>
            <HeroActions isAr={isAr} donateHref={DONATE} donateLabel={t(c.hero.donateLabel)} wa={waHref(isAr, "موسم الخير", "the Ramadan season")} className="mt-8 justify-center md:justify-start" />
          </div>
          <div className="ramadan-frame relative mx-auto w-full max-w-xs p-3">
            {["-top-3 -start-3", "-top-3 -end-3", "-bottom-3 -start-3", "-bottom-3 -end-3"].map((pos) => (
              <Star8 key={pos} className={`absolute h-6 w-6 text-[hsl(var(--gold))] ${pos}`} />
            ))}
            <img src={heroImg?.src ?? yusrRamadanBox} alt={heroImg ? (isAr ? heroImg.altAr : heroImg.altEn) : ""} loading="eager" className="w-full rounded-lg object-cover" />
          </div>
        </div>
      </div>
    </section>
  );
};

const RamadanMain = () => {
  const { c, t, isAr, price, amount, section, images } = useCampaignPage("ramadan", RAMADAN_DEFAULTS);
  const galleryImgs = images("gallery");
  const Arrow = isAr ? ArrowLeft : ArrowRight;
  const [people, setPeople] = useState(4);
  const [meals, setMeals] = useState(10);
  const IFTAR = amount("iftar");
  const FITR = amount("fitr");
  const table = TABLE_IDS.map((id) => price(id)).filter((p): p is NonNullable<typeof p> => !!p);
  const gifts = section("gifts");
  const moon = section("moon");
  const feed = section("feed");
  const feedCard = feed?.items[0];
  const fitr = section("fitr");
  const achievements = section("achievements");
  const achievementsHead = achievements?.items[0];
  return (
    <>
      {/* The giving table: an iftar menu with gold leaders */}
      <section className="ramadan-cream py-16 md:py-24">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="text-center">
            <p className="text-sm font-black text-accent">{t(section("table")?.lead)}</p>
            <h2 className="mt-2 text-3xl font-black text-primary md:text-4xl">{t(section("table")?.title)}</h2>
            <div className="mx-auto mt-5 flex items-center justify-center gap-3 text-[hsl(var(--gold))]" aria-hidden>
              <span className="h-px w-16 bg-current" /><Star8 className="h-4 w-4" /><span className="h-px w-16 bg-current" />
            </div>
          </div>
          <ul className="mt-10 grid gap-x-12 rounded-2xl border border-[hsl(var(--gold)/0.45)] bg-card px-5 py-4 sm:px-10 sm:py-8 md:grid-cols-2">
            {table.map((p) => (
              <li key={p.id}>
                <Link
                  to={amountHref(DONATE, p.amount)}
                  className="group flex min-h-[72px] items-center gap-3 border-b border-dashed border-[hsl(var(--gold)/0.35)] py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="min-w-0">
                    <span className="block text-base font-black text-primary transition-colors group-hover:text-accent">{t(p.label)}</span>
                    <span className="block text-xs font-bold text-muted-foreground">{t(p.note)}</span>
                  </span>
                  <span aria-hidden className="ramadan-leader mx-1 h-px flex-1 self-end mb-3" />
                  <span className="shrink-0 text-end">
                    <span className="block text-xl font-black tabular-nums text-primary">{fmtNum(p.amount, isAr)}</span>
                    <span className="block text-[11px] font-bold text-muted-foreground">{isAr ? "جنيه" : "EGP"}</span>
                  </span>
                  <Arrow className="h-4 w-4 shrink-0 text-accent opacity-60 transition-opacity group-hover:opacity-100" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Six gifts of the season */}
      <section className="ramadan-night relative overflow-hidden py-16 text-primary-foreground md:py-24">
        <NightSky />
        <div className="container relative mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-black md:text-4xl">{t(gifts?.title)}</h2>
          <ol className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {(gifts?.items ?? []).map((g, i) => (
              <li key={g.id} className="flex gap-4">
                <Star8 className="h-12 w-12 shrink-0 text-[hsl(var(--gold))]">
                  <span className="font-mono text-base font-black text-[hsl(152_65%_8%)]">{fmtNum(i + 1, isAr)}</span>
                </Star8>
                <div>
                  <h3 className="text-lg font-black text-[hsl(var(--gold))]">{t(g.title)}</h3>
                  <p className="mt-1.5 text-sm leading-[1.8] text-primary-foreground/80 sm:text-base">{t(g.desc)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Moon timeline */}
      <section className="ramadan-cream py-16 md:py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-black text-primary md:text-4xl">{t(moon?.title)}</h2>
          <ol className="relative mt-12 grid gap-10 md:grid-cols-3 md:gap-6">
            <span aria-hidden className="absolute start-[19px] top-0 h-full w-px border-s-2 border-dashed border-[hsl(var(--gold)/0.6)] md:start-[16%] md:end-[16%] md:top-5 md:h-px md:w-auto md:border-s-0 md:border-t-2" />
            {(moon?.items ?? []).map((m, i) => (
              <li key={m.id} className="relative grid grid-cols-[40px_minmax(0,1fr)] gap-x-4 md:block md:text-center">
                <span className="relative z-10 grid place-items-center bg-[hsl(48_45%_96%)] md:mx-auto md:w-14"><MoonIcon phase={MOON_PHASES[i] ?? "full"} /></span>
                <div className="md:mt-4">
                  <p className="text-sm font-black text-accent">{t(m.extra)}</p>
                  <h3 className="mt-1 text-lg font-black text-primary">{t(m.title)}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/75 sm:text-base md:mx-auto md:max-w-xs">{t(m.desc)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Feed a fasting person: hadith + iftar counter */}
      <section className="bg-background py-16 md:py-24">
        <div className="container mx-auto grid max-w-6xl items-stretch gap-6 px-4 lg:grid-cols-2">
          <figure className="ramadan-night relative flex flex-col justify-center overflow-hidden rounded-2xl p-8 text-primary-foreground sm:p-10">
            <NightSky />
            <Crescent className="absolute end-6 top-6 h-10 w-10 text-[hsl(var(--gold))]" />
            <p className="relative text-sm font-black text-[hsl(var(--gold))]">{t(feed?.title)}</p>
            <blockquote className="relative mt-4 text-2xl font-black leading-[1.75] text-[hsl(var(--gold))] md:text-3xl">
              {isAr ? `قال رسول الله ﷺ: «${t(c.hadith.text)}»` : `The Prophet ﷺ said: “${t(c.hadith.text)}”`}
            </blockquote>
            <figcaption className="relative mt-4 text-sm font-bold text-primary-foreground/70">{t(c.hadith.source)}</figcaption>
          </figure>
          <div className="flex flex-col justify-center rounded-2xl border border-[hsl(var(--gold)/0.45)] bg-[hsl(48_45%_96%)] p-8 sm:p-10">
            <h2 className="text-2xl font-black text-primary md:text-3xl">{t(feedCard?.title)}</h2>
            <p className="mt-2 text-sm text-foreground/75 sm:text-base">{t(feedCard?.desc).replace("{n}", fmtNum(IFTAR, isAr))}</p>
            <Counter isAr={isAr} value={meals} setValue={setMeals} min={1} max={1000} step={5} labelAr="وجبة" labelEn="meals" />
            <Link to={amountHref(DONATE, meals * IFTAR)} className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-orange-grad font-black text-accent-foreground shadow-cta transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">
              <Heart className="h-5 w-5" /> {isAr ? `فطّر ${fmtNum(meals, true)} صائماً بـ ${fmtNum(meals * IFTAR, true)} جنيه` : `Feed ${meals} for ${fmtNum(meals * IFTAR, false)} EGP`}
            </Link>
          </div>
        </div>
      </section>

      {/* Zakat al-Fitr */}
      <section className="ramadan-cream py-16 md:py-20">
        <div className="container mx-auto grid max-w-6xl items-center gap-10 px-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <div>
            <p className="text-sm font-black text-accent">{t(fitr?.title)}</p>
            <h2 className="mt-2 text-3xl font-black text-primary md:text-4xl">{t(fitr?.lead)}</h2>
            <ul className="mt-6 space-y-3 text-base text-foreground/80">
              {(fitr?.items ?? []).map((li) => (
                <li key={li.id} className="flex gap-3"><Check className="mt-1 h-5 w-5 shrink-0 text-[hsl(var(--gold))]" strokeWidth={3} aria-hidden /> <span>{t(li.title)}</span></li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-card p-8 ring-1 ring-[hsl(var(--gold)/0.45)]">
            <p className="text-sm font-bold text-muted-foreground">{isAr ? `${fmtNum(FITR, true)} جنيه عن الفرد` : `${FITR} EGP per person`}</p>
            <Counter isAr={isAr} value={people} setValue={setPeople} min={1} max={50} step={1} labelAr="فرد" labelEn="people" />
            <div className="mt-6 border-t border-dashed border-[hsl(var(--gold)/0.5)] pt-5">
              <div className="text-sm font-bold text-muted-foreground">{isAr ? "زكاة الفطر المستحقة" : "Zakat al-Fitr due"}</div>
              <div className="mt-1 text-4xl font-black tabular-nums text-primary" aria-live="polite">{fmtNum(people * FITR, isAr)} <span className="text-base">{isAr ? "جنيه" : "EGP"}</span></div>
            </div>
            <Link to={amountHref(DONATE, people * FITR)} className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-black text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              {isAr ? "أخرج زكاة الفطر" : "Pay Zakat al-Fitr"}
            </Link>
            <p className="mt-3 text-center text-xs text-muted-foreground">{isAr ? "القيمة استرشادية وفق تقدير المؤسسة لهذا العام." : "Indicative amount per the Foundation's estimate this year."}</p>
          </div>
        </div>
      </section>

      {/* Last Ramadan's achievements */}
      <section className="ramadan-night relative overflow-hidden py-16 text-primary-foreground md:py-24">
        <NightSky />
        <div className="container relative mx-auto max-w-6xl px-4">
          <div className="text-center">
            <p className="text-sm font-black text-[hsl(var(--gold))]">{t(achievementsHead?.desc)}</p>
            <h2 className="mt-2 text-3xl font-black md:text-4xl">{t(achievementsHead?.title ?? achievements?.title)}</h2>
          </div>
          <ul className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[hsl(var(--gold)/0.35)] bg-[hsl(var(--gold)/0.25)] lg:grid-cols-4">
            {c.stats.map((a) => {
              const I = STAT_ICONS[a.id] ?? Package;
              const parts = a.value === null && a.note ? t(a.note).split(" · ").map((s) => s.trim()).filter(Boolean) : [];
              return (
                <li key={a.id} className={`flex flex-col items-center bg-[hsl(152_62%_9%)] px-3 py-8 text-center sm:px-5 ${WIDE_STATS.has(a.id) ? "col-span-2 lg:col-span-1" : ""}`}>
                  <I className="h-6 w-6 text-[hsl(var(--gold))]" strokeWidth={1.75} aria-hidden />
                  {a.value !== null ? (
                    <span className="mt-4 text-3xl font-black tabular-nums text-[hsl(var(--gold))] sm:text-4xl">
                      {fmtNum(a.value, isAr)}
                      <span className="ms-1 text-sm font-bold text-primary-foreground/70">{t(a.unit)}</span>
                    </span>
                  ) : parts.length ? (
                    <ul className="mt-4 space-y-1.5">
                      {parts.map((pt) => (
                        <li key={pt} className="flex items-center justify-center gap-1.5 text-sm font-black text-[hsl(var(--gold))]">
                          <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={3} aria-hidden /> {pt}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <span className="mt-3 text-sm font-bold text-primary-foreground/90 sm:text-base">{t(a.label)}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="bg-background py-16 md:py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-black text-primary md:text-4xl">{isAr ? "من رمضان الماضي" : "From last Ramadan"}</h2>
          <div className="mt-8"><BentoGallery items={galleryImgs} isAr={isAr} /></div>
        </div>
      </section>
    </>
  );
};

const RamadanLanding = () => {
  const { c, images } = useCampaignPage("ramadan", RAMADAN_DEFAULTS);
  return (
    <CampaignLandingShell
      slug="ramadan"
      seo={c.seo}
      path="/ramadan"
      titleAr={`موسم الخير — «${c.hero.title.ar} ${c.hero.title2.ar}»`}
      titleEn={`Ramadan Season — '${c.hero.title.en} ${c.hero.title2.en}'`}
      taglineAr={c.hero.lead.ar}
      taglineEn={c.hero.lead.en}
      metaDescAr="شارك في موسم رمضان مع مؤسسة اليسر: كرتونة الخير (25 كيلو بلدي)، مطبخ وجبات الإفطار الساخنة، ذبائح مزارعنا الوقفية، تيسير الزواج 'الفرحة فرحتين'، كسوة العيد، وزكاة المال والفطر."
      metaDescEn="Support Al-Yusr's Ramadan Season: 25kg family boxes, hot iftar kitchen, endowment farm meat, bride support, orphan Eid clothing, and Zakat distribution in Egypt."
      heroImage={images("hero")[0]?.src ?? yusrRamadanBox}
      heroAlt="كرتونة رمضان 25 كيلو من مؤسسة اليسر مع لحوم بلدي"
      hero={<RamadanHero />}
      main={<RamadanMain />}
      finalCtaClassName="ramadan-night"
      finalCtaDecor={<><NightSky /><Crescent className="pointer-events-none absolute end-[10%] top-10 h-16 w-16 text-[hsl(var(--gold))]" /></>}
      relatedLinks={[
        { href: "/food-box", ar: "الغذاء الشهري (لحوم وكرتونة ووجبات)", en: "Monthly food (meat, carton & meals)" },
        { href: "/zakat", ar: "حساب ودفع الزكاة", en: "Calculate & pay Zakat" },
        { href: "/farm", ar: "المزرعة الوقفية", en: "Endowment farm" },
        { href: "/trust", ar: "الشفافية وتقارير التوزيع", en: "Trust & reports" },
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

export default RamadanLanding;
