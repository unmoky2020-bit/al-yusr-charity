import { useState } from "react";
import { Link } from "react-router-dom";
import { Droplets, Home, Wind, ShieldCheck, FileCheck2, MapPin, ArrowLeft, ArrowRight, type LucideIcon } from "lucide-react";
import { CampaignLandingShell } from "@/components/sections/CampaignLandingShell";
import { amountHref, waHref, fmtNum, CampaignCrumbs, HeroActions, BentoGallery } from "@/components/campaigns/shared";
import { HadithBlock } from "@/components/campaigns/HadithBlock";
import { WhatsAppIcon } from "@/components/common/icons/WhatsAppIcon";
import { useCampaignPage } from "@/hooks/useCampaignPage";
import DHILL_DEFAULTS from "@/data/campaignPages/dhill";
import yusrWater from "@/assets/yusr-water.png";
import yusrDistribution from "@/assets/yusr-distribution-1.webp";
import yusrMeals from "@/assets/yusr-meals.webp";
import posterWater from "@/assets/poster-water.png";

import { campaignDonateHref } from "@/data/campaignPages/index";
const DONATE = campaignDonateHref("dhill");

/**
 * The three kinds of shade the campaign builds. Content (labels, descriptions, amounts) comes from
 * `DHILL_DEFAULTS.sections.tracks` + `prices`; only the icons and the price-id wiring live here.
 * `share` is the price id of one share, `full` the price id of the complete unit.
 */
const TRACK_META = {
  roof: { icon: Home, share: "roof_share", full: "roof_full", options: ["roof_share", "roof_full"] },
  water: { icon: Droplets, share: "water_share", full: "water_full", options: ["water_share", "water_full"] },
  air: { icon: Wind, share: null, full: "fan", options: ["fan"] },
} as const satisfies Record<string, { icon: LucideIcon; share: string | null; full: string; options: readonly string[] }>;

type TrackId = keyof typeof TRACK_META;
const isTrackId = (id: string): id is TrackId => id in TRACK_META;

const TRUST_ICONS: Record<string, LucideIcon> = { ngo: ShieldCheck, docs: FileCheck2, areas: MapPin };

const GALLERY = [
  { src: yusrWater, altAr: "وصلة مياه نقية مع موتور وخزان لأسرة مستحقة", altEn: "Water connection with pump and tank" },
  { src: posterWater, altAr: "تسقيف خشبي معزول يحمي البيت من حر الصيف", altEn: "Insulated wooden roof" },
  { src: yusrDistribution, altAr: "توزيع مراوح ووسائل تبريد لبيوت القرى", altEn: "Fans for village homes" },
  { src: yusrMeals, altAr: "قوافل السقيا الميدانية في قرى مصر", altEn: "Field water convoys" },
];

const DhillHero = () => {
  const { c, t, isAr, section } = useCampaignPage("dhill", DHILL_DEFAULTS);
  const trust = section("trust")?.items ?? [];
  return (
    <section className="dhill-hero relative overflow-hidden bg-[hsl(152_65%_9%)] text-primary-foreground">
      {/* Sun + canopy: the shade the campaign casts */}
      <div aria-hidden className="pointer-events-none absolute -top-16 end-[-7rem] h-56 w-56 opacity-80 md:end-[4%] md:top-[-5rem] md:h-[34rem] md:w-[34rem] md:opacity-100">
        <div className="dhill-sun absolute inset-0 rounded-full" />
        <div className="absolute inset-[-14%] rounded-full border border-accent/15" />
        <div className="absolute inset-[-30%] rounded-full border border-accent/10" />
      </div>
      <svg aria-hidden viewBox="0 0 1440 220" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 top-[16rem] hidden h-[14rem] w-full md:block">
        <path d="M0,220 L0,120 Q720,-40 1440,120 L1440,220 Z" fill="hsl(152 60% 14%)" />
        <path d="M0,120 Q720,-40 1440,120" fill="none" stroke="hsl(var(--secondary))" strokeOpacity="0.5" strokeWidth="2" />
      </svg>
      <div aria-hidden className="absolute inset-x-0 bottom-0 top-[26rem] hidden bg-[hsl(152_60%_14%)] md:block" />

      <div className="container relative mx-auto max-w-6xl px-4 pb-16 pt-10 md:pb-20 md:pt-14">
        <CampaignCrumbs isAr={isAr} name={isAr ? "حملة ظِلّ" : "Dhill"} className="text-primary-foreground/80" />
        <div className="mt-10 grid items-end gap-10 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <div className="text-center md:text-start">
            <p className="text-sm font-black text-secondary">{t(c.hero.eyebrow)}</p>
            <h1 className="mt-3 text-4xl font-black leading-[1.25] sm:text-5xl lg:text-6xl">
              {t(c.hero.title)}{" "}
              <span className="mt-1 block text-secondary">{t(c.hero.title2)}</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-primary-foreground/85 md:mx-0 md:text-lg">
              {t(c.hero.lead)}
            </p>
            <HeroActions isAr={isAr} donateHref={DONATE} donateLabel={t(c.hero.donateLabel)} wa={waHref(isAr, "حملة ظل", "the Dhill campaign")} className="mt-8 justify-center md:justify-start" />
          </div>
          <div className="relative mx-auto w-full max-w-sm">
            <img src={yusrWater} alt={isAr ? "حملة ظل — وصلات مياه وأسقف للأسر المستحقة" : "Dhill — water and roofs for families"} loading="eager" className="relative w-full rounded-2xl object-cover shadow-card ring-1 ring-primary-foreground/15" />
          </div>
        </div>

        <ul className="mt-12 grid grid-cols-1 gap-3 text-sm font-bold text-primary-foreground/85 sm:grid-cols-3">
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

const DhillMain = () => {
  const { c, t, isAr, price, amount, section } = useCampaignPage("dhill", DHILL_DEFAULTS);
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  const tracksSection = section("tracks");
  const tracks = (tracksSection?.items ?? []).filter((it) => isTrackId(it.id));
  const [trackId, setTrackId] = useState<TrackId>("roof");
  const track = tracks.find((it) => it.id === trackId) ?? tracks[0];
  const meta = TRACK_META[(track?.id as TrackId) ?? "roof"];
  const fullPrice = price(meta.full);
  const full = fullPrice?.amount ?? 0;
  const share = meta.share ? amount(meta.share) : 0;
  const shares = meta.share && share > 0 ? Math.max(1, Math.round(full / share)) : 1;
  const fullLabel = t(fullPrice?.note ?? fullPrice?.label);
  const options = meta.options.map((id) => price(id)).filter((p): p is NonNullable<typeof p> => !!p);

  const hadith2 = section("hadith2")?.items[0];
  const dedicate = section("dedicate");
  const steps = section("steps");
  const areas = section("areas");
  const areasNow = section("areas_now");
  const areasBefore = section("areas_before");

  return (
    <>
      {/* Hadith band */}
      <section className="bg-[hsl(152_60%_14%)] pb-16 text-primary-foreground md:pb-20">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <blockquote className="text-2xl font-black leading-[1.7] text-secondary md:text-3xl">
            {t(hadith2?.title)}
          </blockquote>
          <p className="mt-4 text-sm font-bold text-primary-foreground/70">{t(hadith2?.desc)}</p>
        </div>
      </section>

      {/* Choose your shade */}
      <section className="bg-background py-16 md:py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="max-w-2xl">
            <p className="text-sm font-black text-accent">{t(tracksSection?.lead)}</p>
            <h2 className="mt-2 text-3xl font-black text-primary md:text-4xl">{t(tracksSection?.title)}</h2>
          </div>

          <div role="tablist" aria-label={isAr ? "مجالات الحملة" : "Campaign tracks"} className="mt-8 grid grid-cols-3 gap-2 rounded-2xl bg-muted p-1.5 sm:inline-grid sm:w-auto">
            {tracks.map((it) => {
              const on = it.id === track?.id;
              const I = TRACK_META[it.id as TrackId].icon;
              return (
                <button
                  key={it.id}
                  role="tab"
                  aria-selected={on}
                  aria-controls={`dhill-panel-${it.id}`}
                  id={`dhill-tab-${it.id}`}
                  onClick={() => setTrackId(it.id as TrackId)}
                  className={`inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-5 text-sm font-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-base ${
                    on ? "bg-primary text-primary-foreground" : "text-primary hover:bg-background"
                  }`}
                >
                  <I className="h-5 w-5" /> {t(it.title)}
                </button>
              );
            })}
          </div>

          {track && (
          <div role="tabpanel" id={`dhill-panel-${track.id}`} aria-labelledby={`dhill-tab-${track.id}`} key={track.id} className="dhill-panel mt-8 grid gap-10 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:gap-14">
            <div>
              <h3 className="text-2xl font-black text-primary">{t(track.extra)}</h3>
              <p className="mt-3 max-w-[60ch] text-base leading-[1.85] text-foreground/80">{t(track.desc)}</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {options.map((o) => (
                  <Link
                    key={o.id}
                    to={amountHref(DONATE, o.amount)}
                    className="group flex items-center justify-between gap-3 rounded-xl border-2 border-border bg-card p-4 transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span>
                      <span className="block text-sm font-bold text-muted-foreground">{t(o.label)}</span>
                      <span className="mt-0.5 block text-2xl font-black tabular-nums text-primary">{fmtNum(o.amount, isAr)} <span className="text-sm font-bold">{isAr ? "جنيه" : "EGP"}</span></span>
                    </span>
                    <Arrow className="h-5 w-5 text-accent transition-transform group-hover:-translate-x-0.5 rtl:group-hover:translate-x-0.5" />
                  </Link>
                ))}
              </div>
              <Link to={DONATE} className="mt-4 inline-flex min-h-[44px] items-center text-sm font-black text-primary underline decoration-secondary decoration-2 underline-offset-4 hover:text-accent">
                {isAr ? "أو تبرّع بأي مبلغ تجود به" : "Or give any amount"}
              </Link>
            </div>

            {/* Share grid: how individual shares add up to one complete unit */}
            <div className="rounded-2xl bg-[hsl(152_60%_14%)] p-6 text-primary-foreground sm:p-8">
              <p className="text-sm font-bold text-primary-foreground/75">
                {shares > 1
                  ? (isAr ? `كل مربع سهم بـ ${fmtNum(share, true)} جنيه` : `Each square is a ${share} EGP share`)
                  : (isAr ? "تبرع واحد يكفي" : "One gift is enough")}
              </p>
              <p className="mt-1 text-xl font-black">
                {shares > 1
                  ? (isAr ? `${fmtNum(shares, true)} سهماً = ${fullLabel}` : `${shares} shares = ${fullLabel.toLowerCase()}`)
                  : fullLabel}
              </p>
              <div className="mt-6 grid grid-cols-8 gap-1.5" aria-hidden>
                {Array.from({ length: Math.max(shares, 1) }).map((_, i) => (
                  <span
                    key={i}
                    className={`dhill-cell aspect-square rounded-[4px] ${i === 0 ? "bg-accent" : "bg-secondary"}`}
                    style={{ animationDelay: `${i * 22}ms` }}
                  />
                ))}
              </div>
              <p className="mt-5 flex items-center gap-2 text-sm text-primary-foreground/80">
                <span className="h-3 w-3 shrink-0 rounded-[3px] bg-accent" aria-hidden />
                {shares > 1
                  ? (isAr ? "سهمك يكتمل مع أسهم غيرك من المتبرعين، ونسلّم الحالة فور اكتمالها." : "Your share joins other donors' shares; we deliver as soon as the unit is complete.")
                  : (isAr ? "تتسلمها الأسرة مركّبة وجاهزة." : "Delivered to the family installed and ready.")}
              </p>
            </div>
          </div>
          )}
        </div>
      </section>

      <HadithBlock hadith={{ ar: c.hadith.text.ar, en: c.hadith.text.en, sourceAr: c.hadith.source.ar, sourceEn: c.hadith.source.en }} tone="light" />

      {/* Ongoing charity on behalf of a loved one */}
      <section className="bg-primary py-16 text-primary-foreground md:py-20">
        <div className="container mx-auto grid max-w-6xl items-center gap-10 px-4 lg:grid-cols-2">
          <div>
            <p className="text-sm font-black text-secondary">{isAr ? "صدقة جارية باسم من تحب" : "Ongoing charity for a loved one"}</p>
            <h2 className="mt-2 text-3xl font-black md:text-4xl">{t(dedicate?.title)}</h2>
            <p className="mt-4 max-w-[55ch] text-base leading-[1.9] text-primary-foreground/85">
              {t(dedicate?.lead)}
            </p>
          </div>
          <ol className="space-y-3">
            {(dedicate?.items ?? []).map((st, i) => (
              <li key={st.id} className="flex items-center gap-4 rounded-xl bg-primary-foreground/[0.07] p-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary font-mono font-black text-secondary-foreground">{fmtNum(i + 1, isAr)}</span>
                <span className="font-bold">{t(st.title)}</span>
              </li>
            ))}
            <li>
              <a href={waHref(isAr, "صدقة جارية في حملة ظل", "an ongoing-charity water tap")} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-[44px] items-center gap-2 text-sm font-black text-secondary underline underline-offset-4 hover:text-primary-foreground">
                <WhatsAppIcon className="h-4 w-4" /> {isAr ? "أرسل الاسم على واتساب" : "Send the name on WhatsApp"}
              </a>
            </li>
          </ol>
        </div>
      </section>

      {/* From heat to shade */}
      <section className="bg-muted/50 py-16 md:py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-black text-primary md:text-4xl">{t(steps?.title)}</h2>
          <ol className="relative mt-10 grid gap-8 md:grid-cols-3 md:gap-6">
            <span aria-hidden className="absolute start-[22px] top-0 h-full w-[3px] rounded-full bg-gradient-to-b from-accent to-secondary md:start-0 md:top-[22px] md:h-[3px] md:w-full md:bg-gradient-to-l" />
            {(steps?.items ?? []).map((s, i) => (
              <li key={s.id} className="relative ps-16 md:ps-0 md:pt-16">
                <span className="absolute start-0 top-0 grid h-12 w-12 place-items-center rounded-full border-4 border-muted bg-primary font-mono text-lg font-black text-secondary">
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
      <section className="bg-background py-16 md:py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-black text-primary md:text-4xl">{t(areas?.title)}</h2>
          <p className="mt-3 max-w-2xl text-base text-foreground/75">{t(areas?.lead)}</p>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border-2 border-primary p-6">
              <p className="text-sm font-black text-accent">{t(areasNow?.title)}</p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {(areasNow?.items ?? []).map((a) => <li key={a.id} className="rounded-lg bg-primary px-4 py-2 font-black text-primary-foreground">{t(a.title)}</li>)}
              </ul>
            </div>
            <div className="rounded-2xl border border-border p-6">
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
          <div className="mt-8"><BentoGallery items={GALLERY} isAr={isAr} /></div>
        </div>
      </section>
    </>
  );
};

const DhillLanding = () => {
  const { c, section } = useCampaignPage("dhill", DHILL_DEFAULTS);
  const seo = section("seo");
  return (
    <CampaignLandingShell
      slug="dhill"
      seo={c.seo}
      path="/dhill"
      titleAr={seo?.title.ar ?? ""}
      titleEn={seo?.title.en ?? ""}
      taglineAr={seo?.lead?.ar ?? ""}
      taglineEn={seo?.lead?.en ?? ""}
      metaDescAr="شارك في حملة ظِل مع مؤسسة اليسر: أسقف منازل خشبية معزولة، وصلات مياه نقية للمنازل (سهم 500 ج)، خطوط مياه للقرى، أبواب وشبابيك، ومراوح تبريد بالدقهلية وكفر الشيخ والشرقية وكل مصر."
      metaDescEn="Join Al-Yusr's Dhill Campaign: insulated wooden roofs, clean water connections (EGP 500 share), village water lines, doors & windows, and cooling fans across Dakahlia, Kafr El Sheikh and Egypt."
      heroImage={yusrWater}
      heroAlt="حملة ظل — وصلات مياه وأسقف خشبية ومراوح للأسر المستحقة"
      hero={<DhillHero />}
      main={<DhillMain />}
      relatedLinks={[
        { href: "/setr", ar: "حملة سِتر (تسقيف الشتاء والكسوة)", en: "Setr Campaign (Winter aid)" },
        { href: "/markoun", ar: "حملة مَرْكون (الأثاث والأجهزة)", en: "Markoun campaign" },
        { href: "/khabia", ar: "الخبيئة — صدقة جارية", en: "Khabia — ongoing charity" },
        { href: "/food-box", ar: "الغذاء الشهري (لحوم وكرتونة ووجبات)", en: "Monthly food (meat, carton & meals)" },
        { href: "/trust", ar: "الشفافية والتقارير الميدانية", en: "Trust & reports" },
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

export default DhillLanding;
