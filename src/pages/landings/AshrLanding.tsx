import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Heart, Moon, Beef, Sparkles, Sun, HandHeart, type LucideIcon } from "lucide-react";
import { CampaignLandingShell } from "@/components/sections/CampaignLandingShell";
import { amountHref, waHref, fmtNum, CampaignCrumbs, HeroActions } from "@/components/campaigns/shared";
import { useCampaignPage } from "@/hooks/useCampaignPage";
import ASHR_DEFAULTS from "@/data/campaignPages/ashr";
import { campaignDonateHref } from "@/data/campaignPages/index";
import heroImg from "@/assets/qurbani-hero-trays.webp";

/**
 * /ten-days — charity in the first ten days of Dhul Hijjah. All text and prices are editable from
 * the dashboard (donation campaign with slug «ten-days»); defaults in src/data/campaignPages/ashr.ts.
 */
const SLUG = "ashr";
const DONATE = campaignDonateHref(SLUG);
const WHY_ICONS: Record<string, LucideIcon> = { beloved: Heart, arafah: Sun, sacrifice: Beef, constant: CalendarDays };
const SPECIAL_DAYS: Record<string, "arafah" | "nahr" | "tarwiyah"> = { d8: "tarwiyah", d9: "arafah", d10: "nahr" };

/** Ten day markers on an arc, the ninth (Arafah) and tenth (Eid) highlighted. Decorative. */
const TenDaysArc = ({ isAr }: { isAr: boolean }) => (
  <div className="relative mx-auto aspect-square w-full max-w-[340px]" aria-hidden>
    <div className="absolute inset-[14%] rounded-full border border-dashed border-secondary/40" />
    <div className="absolute inset-[30%] grid place-items-center rounded-full bg-secondary/10 text-center ring-1 ring-secondary/30">
      <div>
        <Moon className="mx-auto h-8 w-8 text-secondary" />
        <p className="mt-1 text-sm font-black text-secondary">{isAr ? "ذو الحجة" : "Dhul Hijjah"}</p>
      </div>
    </div>
    {Array.from({ length: 10 }, (_, i) => {
      const angle = (-90 + i * 36) * (Math.PI / 180);
      const x = 50 + 36 * Math.cos(angle);
      const y = 50 + 36 * Math.sin(angle);
      const special = i === 8 || i === 9;
      return (
        <span
          key={i}
          className={`absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full font-black ${special ? "h-12 w-12 bg-secondary text-sm text-slate-950 shadow-cta" : "h-9 w-9 bg-primary-foreground/10 text-xs text-primary-foreground ring-1 ring-primary-foreground/25"}`}
          style={{ left: `${x}%`, top: `${y}%` }}
        >
          {(i + 1).toLocaleString(isAr ? "ar-EG" : "en-US")}
        </span>
      );
    })}
  </div>
);

const AshrHero = () => {
  const { c, t, isAr } = useCampaignPage(SLUG, ASHR_DEFAULTS);
  return (
    <section className="pattern-hero-luxe relative overflow-hidden text-primary-foreground">
      <div className="pointer-events-none absolute inset-0 leaf-bg opacity-25" />
      <div className="container relative mx-auto max-w-6xl px-4 pb-16 pt-10 md:pb-24 md:pt-14">
        <CampaignCrumbs isAr={isAr} name={isAr ? "العشر الأوائل" : "The ten days"} className="text-primary-foreground/80" />
        <div className="mt-10 grid items-center gap-10 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <div className="text-center md:text-start">
            <p className="text-sm font-black text-secondary">{t(c.hero.eyebrow)}</p>
            <h1 className="mt-3 text-4xl font-black leading-[1.3] sm:text-5xl lg:text-6xl">
              {t(c.hero.title)} <span className="mt-1 block text-secondary">{t(c.hero.title2)}</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-[1.9] text-primary-foreground/85 md:mx-0 md:text-lg">{t(c.hero.lead)}</p>
            <HeroActions isAr={isAr} donateHref={DONATE} donateLabel={t(c.hero.donateLabel)} wa={waHref(isAr, "صدقات العشر الأوائل", "Ten days charity")} className="mt-8 justify-center md:justify-start" />
          </div>
          <TenDaysArc isAr={isAr} />
        </div>
      </div>
    </section>
  );
};

const DayPlanner = () => {
  const { c, t, isAr, section, amount } = useCampaignPage(SLUG, ASHR_DEFAULTS);
  const days = section("days");
  const [active, setActive] = useState(0);
  if (!days || days.items.length === 0) return null;
  const day = days.items[Math.min(active, days.items.length - 1)];
  const special = SPECIAL_DAYS[day.id];
  const dayAmount = amount("day", 50);
  return (
    <section className="bg-background py-16 md:py-24">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-black text-primary md:text-4xl">{t(days.title)}</h2>
          <p className="mt-3 text-muted-foreground md:text-lg">{t(days.lead)}</p>
        </div>
        <div role="tablist" aria-label={t(days.title)} className="mt-10 grid grid-cols-5 gap-2 sm:grid-cols-10">
          {days.items.map((d, i) => {
            const on = i === active;
            const sp = SPECIAL_DAYS[d.id];
            return (
              <button
                key={d.id}
                type="button"
                role="tab"
                aria-selected={on}
                aria-controls="ashr-day-panel"
                onClick={() => setActive(i)}
                className={`flex flex-col items-center justify-center rounded-2xl border px-1 py-3 transition ${
                  on ? "border-primary bg-primary text-primary-foreground shadow-card" : sp ? "border-secondary bg-secondary/15 text-primary hover:bg-secondary/25" : "border-border bg-card text-primary hover:border-secondary/60"
                }`}
              >
                <span className="text-xl font-black tabular-nums sm:text-2xl">{(i + 1).toLocaleString(isAr ? "ar-EG" : "en-US")}</span>
                <span className="mt-0.5 text-[10px] font-bold opacity-80 sm:text-[11px]">
                  {sp === "arafah" ? (isAr ? "عرفة" : "Arafah") : sp === "nahr" ? (isAr ? "العيد" : "Eid") : sp === "tarwiyah" ? (isAr ? "التروية" : "Tarwiyah") : isAr ? "يوم" : "day"}
                </span>
              </button>
            );
          })}
        </div>
        <div id="ashr-day-panel" role="tabpanel" aria-live="polite" className="mt-5 grid gap-6 rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8 md:grid-cols-[1.4fr_1fr] md:items-center">
          <div>
            <p className="text-sm font-black text-secondary">{isAr ? `اليوم ${(active + 1).toLocaleString("ar-EG")} من ذي الحجة` : `Day ${active + 1} of Dhul Hijjah`}</p>
            <h3 className="mt-1 text-2xl font-black text-primary">{t(day.title)}</h3>
            <p className="mt-3 text-base leading-loose text-muted-foreground">{t(day.desc)}</p>
          </div>
          <div className="flex flex-col gap-3">
            {special === "nahr" ? (
              <Link to="/qurbani" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-grad px-6 py-3.5 text-sm font-black text-accent-foreground shadow-cta transition hover:opacity-95">
                <Beef className="h-5 w-5" /> {isAr ? "احجز صك الأضحية" : "Reserve a Qurbani share"}
              </Link>
            ) : (
              <Link to={amountHref(DONATE, special === "arafah" ? amount("arafah_iftar", 95) : dayAmount)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-grad px-6 py-3.5 text-sm font-black text-accent-foreground shadow-cta transition hover:opacity-95">
                <Heart className="h-5 w-5" />
                {special === "arafah"
                  ? (isAr ? `فطّر صائم بـ ${fmtNum(amount("arafah_iftar", 95), true)} ج` : `Give an iftar for EGP ${fmtNum(amount("arafah_iftar", 95), false)}`)
                  : (isAr ? `تصدّق اليوم بـ ${fmtNum(dayAmount, true)} ج` : `Give today: EGP ${fmtNum(dayAmount, false)}`)}
              </Link>
            )}
            <Link to={amountHref(DONATE, amount("daily", 500))} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border px-6 py-3 text-sm font-bold text-primary transition hover:border-secondary hover:bg-secondary/10">
              <CalendarDays className="h-4 w-4" /> {t(c.prices.find((p) => p.id === "daily")?.label)}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

const AshrMain = () => {
  const { c, t, isAr, section, images } = useCampaignPage(SLUG, ASHR_DEFAULTS);
  const mainImg = images("hero")[0];
  const why = section("why");
  const arafah = section("arafah");
  const qurbani = section("qurbani");
  return (
    <>
      {/* Hadith */}
      <section className="bg-primary py-14 md:py-20" aria-label={isAr ? "حديث شريف" : "Hadith"}>
        <figure className="container relative mx-auto max-w-4xl px-4 text-center">
          <span aria-hidden className="block font-serif text-7xl leading-none text-secondary/40">❝</span>
          <blockquote className="mx-auto mt-3 max-w-3xl text-2xl font-black leading-[1.75] text-secondary md:text-3xl md:leading-[1.7]">
            {isAr ? `قال رسول الله ﷺ: «${t(c.hadith.text)}»` : `The Prophet ﷺ said: “${t(c.hadith.text)}”`}
          </blockquote>
          <figcaption className="mt-5 text-sm font-bold text-primary-foreground/70">{t(c.hadith.source)}</figcaption>
        </figure>
      </section>

      <DayPlanner />

      {/* What to give */}
      <section className="bg-muted/30 py-16 md:py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-black text-primary md:text-4xl">{isAr ? "اختار صدقتك في العشر" : "Choose your charity for the ten days"}</h2>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {c.prices.map((p) => (
              <Link key={p.id} to={amountHref(DONATE, p.amount)} className="group flex flex-col rounded-2xl border border-border bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-secondary/60 hover:shadow-card">
                <span className="text-base font-black text-primary">{t(p.label)}</span>
                {t(p.note) && <span className="mt-1 text-xs font-bold text-muted-foreground">{t(p.note)}</span>}
                <span className="mt-4 text-3xl font-black tabular-nums text-accent">
                  {fmtNum(p.amount, isAr)} <span className="text-sm font-bold text-muted-foreground">{isAr ? "جنيه" : "EGP"}</span>
                </span>
                <span className="mt-2 text-xs font-black text-accent group-hover:underline">{isAr ? "تبرع بالمبلغ ده ←" : "Give this amount →"}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {why && (
        <section className="bg-background py-16 md:py-20">
          <div className="container mx-auto max-w-6xl px-4">
            <h2 className="text-center text-3xl font-black text-primary md:text-4xl">{t(why.title)}</h2>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {why.items.map((w) => {
                const I = WHY_ICONS[w.id] ?? Sparkles;
                return (
                  <article key={w.id} className="rounded-3xl border border-border bg-card p-6 shadow-soft">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary/15 text-primary"><I className="h-6 w-6" /></span>
                    <h3 className="mt-4 text-lg font-black text-primary">{t(w.title)}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(w.desc)}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <section className="bg-muted/30 py-16 md:py-20">
        <div className="container mx-auto grid max-w-6xl gap-6 px-4 md:grid-cols-2">
          {arafah && (
            <article className="flex flex-col rounded-3xl bg-primary p-8 text-primary-foreground sm:p-10">
              <Sun className="h-10 w-10 text-secondary" />
              <h2 className="mt-4 text-2xl font-black md:text-3xl">{t(arafah.title)}</h2>
              <p className="mt-3 flex-1 text-base leading-loose text-primary-foreground/85">{t(arafah.lead)}</p>
              <Link to={amountHref(DONATE, c.prices.find((p) => p.id === "arafah_iftar")?.amount ?? 95)} className="mt-6 inline-flex w-fit items-center gap-2 rounded-2xl bg-secondary px-6 py-3 text-sm font-black text-slate-950 transition hover:bg-secondary/90">
                <HandHeart className="h-5 w-5" /> {t(c.prices.find((p) => p.id === "arafah_iftar")?.label)}
              </Link>
            </article>
          )}
          {qurbani && (
            <article className="flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
              <img src={mainImg?.src ?? heroImg} alt={mainImg ? (isAr ? mainImg.altAr : mainImg.altEn) : ""} loading="lazy" className="aspect-[16/9] w-full object-cover" />
              <div className="flex flex-1 flex-col p-8">
                <h2 className="text-2xl font-black text-primary md:text-3xl">{t(qurbani.title)}</h2>
                <p className="mt-3 flex-1 text-base leading-loose text-muted-foreground">{t(qurbani.lead)}</p>
                <Link to="/qurbani" className="mt-6 inline-flex w-fit items-center gap-2 rounded-2xl bg-orange-grad px-6 py-3 text-sm font-black text-accent-foreground shadow-cta transition hover:opacity-95">
                  <Beef className="h-5 w-5" /> {isAr ? "احجز صك الأضحية" : "Reserve a Qurbani share"}
                </Link>
              </div>
            </article>
          )}
        </div>
      </section>
    </>
  );
};

const AshrLanding = () => {
  const { c, images } = useCampaignPage(SLUG, ASHR_DEFAULTS);
  return (
    <CampaignLandingShell
      slug={SLUG}
      seo={c.seo}
      path="/ten-days"
      titleAr={`صدقات العشر الأوائل من ذي الحجة — ${c.hero.title.ar}`}
      titleEn={`Charity in the first ten days of Dhul Hijjah — ${c.hero.title.en}`}
      taglineAr={c.hero.lead.ar}
      taglineEn={c.hero.lead.en}
      metaDescAr="صدقات العشر الأوائل من ذي الحجة مع مؤسسة اليسر: صدقة يومية طوال العشر، إفطار صائم يوم عرفة، لحوم بلدي، سقيا ماء، وصك أضحية يوم النحر، بتوثيق كامل في الدقهلية ومصر."
      metaDescEn="Charity in the first ten days of Dhul Hijjah with Al-Yusr: a daily charity, iftar on the day of Arafah, local meat, water and a Qurbani share on Eid day, fully documented."
      heroImage={images("hero")[0]?.src ?? heroImg}
      heroAlt="صدقات العشر الأوائل من ذي الحجة مع مؤسسة اليسر"
      hero={<AshrHero />}
      main={<AshrMain />}
      relatedLinks={[
        { href: "/qurbani", ar: "صك الأضحية", en: "Qurbani share" },
        { href: "/farm", ar: "المزرعة الوقفية", en: "Waqf farm" },
        { href: "/water", ar: "سقيا الماء", en: "Clean water" },
        { href: "/misbaha", ar: "المسبحة الإلكترونية", en: "Digital tasbih" },
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

export default AshrLanding;
