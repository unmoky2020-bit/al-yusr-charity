import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Heart, Home, BedDouble, Shirt, Thermometer, DoorOpen, ClipboardCheck, Baby, PersonStanding, HeartPulse, Receipt, Camera, Truck, Recycle, Hammer, Package, type LucideIcon } from "lucide-react";
import { CampaignLandingShell } from "@/components/sections/CampaignLandingShell";
import { amountHref, waHref, fmtNum, CampaignCrumbs, HeroActions, BentoGallery, useAfterLoad } from "@/components/campaigns/shared";
import { useCampaignPage } from "@/hooks/useCampaignPage";
import SETR_DEFAULTS from "@/data/campaignPages/setr";
import { HadithBlock } from "@/components/campaigns/HadithBlock";
import { WhatsAppIcon } from "@/components/common/icons/WhatsAppIcon";
import posterWater from "@/assets/poster-water.png";

import { campaignDonateHref } from "@/data/campaignPages/index";
const DONATE = campaignDonateHref("setr");

type Icon = LucideIcon;

/**
 * Individual winter items (price id in the content model). `deg` is the illustrated warmth each adds
 * (a donor-facing metaphor, not a measurement). Labels and amounts come from the editable content.
 */
const WARM_ITEMS = [
  { id: "blanket", deg: 3 },
  { id: "clothes", deg: 2 },
  { id: "window", deg: 2 },
  { id: "door", deg: 2 },
  { id: "bed", deg: 3 },
];
/** A house has exactly one roof: the roof is a single checkbox, and its type is chosen underneath. */
const ROOFS = [
  { id: "bitumen", priceId: "roof_bitumen", deg: 4 },
  { id: "wood", priceId: "roof_wood", deg: 5 },
] as const;
const BASE_TEMP = 7;

/** Icons for the content-driven sections, keyed by item id (visuals stay in code). */
const LAYER_ICONS: Record<string, Icon> = { roof: Home, bed: BedDouble, cover: Shirt };
const CHECK_ICONS: Record<string, Icon> = { roof: Home, doors: DoorOpen, beds: BedDouble, covers: Shirt };
const PRIORITY_ICONS: Record<string, Icon> = { children: Baby, elderly: PersonStanding, sick: HeartPulse, no_roof: Home };
const AFTER_ICONS: Record<string, Icon> = { receipt: Receipt, buy: Truck, deliver: Home, document: Camera };
const CYCLE_ICONS: Record<string, Icon> = { good_clothes: Package, worn_clothes: Recycle, old_beds: Hammer };
const iconFor = (map: Record<string, Icon>, id: string, fallback: Icon): Icon => map[id] ?? fallback;

/** Typical-feeling cold index per month (0 mild → 1 coldest) for the season chart, keyed by month item id. */
const MONTH_COLD: Record<string, number> = { oct: 0.2, nov: 0.45, dec: 0.75, jan: 1, feb: 0.7 };
const MONTH_COLD_BY_INDEX = [0.2, 0.45, 0.75, 1, 0.7];

/** Deterministic drop layout (no Math.random, so renders are stable). */
const DROPS = Array.from({ length: 26 }, (_, i) => ({
  left: (i * 37 + 11) % 100,
  delay: ((i * 37) % 22) / 10,
  dur: 1.5 + ((i * 7) % 5) * 0.2,
  h: 40 + ((i * 11) % 4) * 12,
  op: 0.25 + ((i * 3) % 3) * 0.12,
}));

const Rain = () => (
  <div className="setr-rainfall pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
    {DROPS.map((d, i) => (
      <span key={i} className="setr-drop" style={{ left: `${d.left}%`, height: d.h, opacity: d.op, animationDelay: `${d.delay}s`, animationDuration: `${d.dur}s` }} />
    ))}
  </div>
);

/**
 * Illustrated winter scene: a house with a visibly layered (insulated) roof, a bed with a quilt
 * in front, folded blankets beside it. As `warmth` (0–1) rises the windows glow, the chimney
 * smokes, and the quilt and roof insulation come into colour. Pure SVG, ~2 KB, no image request.
 */
const WinterHouse = ({ warmth, className = "" }: { warmth: number; className?: string }) => {
  const w = Math.max(0, Math.min(1, warmth));
  const glow = 0.15 + w * 0.85;
  return (
    <svg viewBox="0 0 320 240" className={`setr-house ${className}`} aria-hidden>
      {/* ground */}
      <rect x="6" y="196" width="308" height="8" rx="4" fill="hsl(195 40% 75% / 0.35)" />
      {/* chimney + smoke */}
      <rect x="214" y="58" width="16" height="36" rx="2" fill="hsl(152 45% 18%)" />
      <g fill="hsl(0 0% 100%)" style={{ opacity: w * 0.55 }}>
        <circle cx="222" cy="48" r="5" /><circle cx="228" cy="38" r="6.5" /><circle cx="236" cy="27" r="8" />
      </g>
      {/* roof: outer shell, wood layer, insulation line */}
      <polygon points="54,118 160,44 266,118" fill="hsl(152 50% 20%)" />
      <polygon points="72,116 160,56 248,116" fill="hsl(28 45% 32%)" />
      <polyline points="72,116 160,56 248,116" fill="none" stroke="hsl(var(--secondary))" strokeWidth="3" strokeLinejoin="round" style={{ opacity: 0.25 + w * 0.75 }} />
      <g stroke="hsl(28 35% 22%)" strokeWidth="1.5"><line x1="110" y1="90" x2="160" y2="56" /><line x1="210" y1="90" x2="160" y2="56" /></g>
      {/* walls */}
      <rect x="76" y="114" width="168" height="84" fill="hsl(152 50% 15%)" />
      <rect x="76" y="114" width="168" height="4" fill="hsl(152 50% 22%)" />
      {/* window glow halos */}
      <ellipse cx="111" cy="146" rx="30" ry="24" fill="hsl(var(--accent))" style={{ opacity: w * 0.22 }} />
      <ellipse cx="209" cy="146" rx="30" ry="24" fill="hsl(var(--accent))" style={{ opacity: w * 0.22 }} />
      {/* windows */}
      <rect x="94" y="130" width="34" height="32" rx="3" fill="hsl(var(--accent))" style={{ opacity: glow }} />
      <rect x="192" y="130" width="34" height="32" rx="3" fill="hsl(var(--accent))" style={{ opacity: glow }} />
      <g stroke="hsl(152 50% 15%)" strokeWidth="2"><line x1="111" y1="130" x2="111" y2="162" /><line x1="94" y1="146" x2="128" y2="146" /><line x1="209" y1="130" x2="209" y2="162" /><line x1="192" y1="146" x2="226" y2="146" /></g>
      {/* door */}
      <rect x="146" y="150" width="28" height="48" rx="3" fill="hsl(28 55% 34%)" />
      <circle cx="167" cy="176" r="2" fill="hsl(var(--gold, 43 85% 62%))" />
      {/* bed in front: frame, legs, mattress, quilt, pillow */}
      <rect x="18" y="174" width="86" height="12" rx="3" fill="hsl(28 45% 32%)" />
      <rect x="22" y="186" width="6" height="10" fill="hsl(28 45% 26%)" /><rect x="94" y="186" width="6" height="10" fill="hsl(28 45% 26%)" />
      <rect x="20" y="160" width="82" height="16" rx="4" fill="hsl(48 50% 92%)" />
      <rect x="20" y="152" width="60" height="22" rx="5" fill="hsl(var(--accent))" style={{ opacity: 0.45 + w * 0.55 }} />
      <g stroke="hsl(0 0% 100% / 0.45)" strokeWidth="1" strokeDasharray="3 3"><line x1="35" y1="154" x2="35" y2="172" /><line x1="50" y1="154" x2="50" y2="172" /><line x1="65" y1="154" x2="65" y2="172" /><line x1="22" y1="163" x2="78" y2="163" /></g>
      <ellipse cx="90" cy="160" rx="11" ry="6" fill="hsl(0 0% 100%)" />
      {/* folded blankets beside the house */}
      <rect x="258" y="186" width="48" height="10" rx="3" fill="hsl(var(--secondary))" />
      <rect x="260" y="176" width="44" height="10" rx="3" fill="hsl(48 50% 92%)" />
      <rect x="262" y="166" width="40" height="10" rx="3" fill="hsl(var(--accent))" style={{ opacity: 0.6 + w * 0.4 }} />
    </svg>
  );
};

const SetrHero = () => {
  const { c, t, isAr } = useCampaignPage("setr", SETR_DEFAULTS);
  const live = useAfterLoad();
  return (
    <section className="setr-night relative overflow-hidden text-primary-foreground">
      {live && <Rain />}
      <div className="container relative mx-auto max-w-6xl px-4 pb-24 pt-10 md:pb-32 md:pt-14">
        <CampaignCrumbs isAr={isAr} name={isAr ? "حملة سِتْر" : "Setr"} className="text-primary-foreground/80" />
        <div className="mt-10 grid items-center gap-10 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <div className="text-center md:text-start">
            <p className="text-sm font-black text-[hsl(195_70%_80%)]">{t(c.hero.eyebrow)}</p>
            <h1 className="mt-3 text-4xl font-black leading-[1.3] sm:text-5xl lg:text-6xl">
              {t(c.hero.title)}{" "}
              <span className="mt-1 block text-secondary">{t(c.hero.title2)}</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-[1.9] text-primary-foreground/85 md:mx-0 md:text-lg">
              {t(c.hero.lead)}
            </p>
            <HeroActions isAr={isAr} donateHref={DONATE} donateLabel={t(c.hero.donateLabel)} wa={waHref(isAr, "حملة ستر", "the Setr campaign")} className="mt-8 justify-center md:justify-start" />
          </div>
          <WinterHouse warmth={0.85} className="mx-auto w-full max-w-sm" />
        </div>
      </div>
      {/* Snow drifts along the bottom edge (two layers for depth) */}
      <svg aria-hidden viewBox="0 0 1440 90" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 bottom-0 h-14 w-full md:h-20">
        <path d="M0,74 C150,30 290,96 470,64 C640,36 780,92 960,60 C1120,32 1280,84 1440,50 L1440,90 L0,90 Z" fill="hsl(195 50% 90%)" />
        <path d="M0,86 C200,50 330,98 520,74 C700,52 840,96 1010,72 C1180,48 1300,90 1440,66 L1440,90 L0,90 Z" fill="hsl(195 30% 97%)" />
      </svg>
    </section>
  );
};

const SetrMain = () => {
  const { c, t, isAr, price, amount, section, images } = useCampaignPage("setr", SETR_DEFAULTS);
  const galleryImgs = images("gallery");
  const [picked, setPicked] = useState<Record<string, boolean>>({ blanket: true });
  const [hasRoof, setHasRoof] = useState(false);
  const [roofId, setRoofId] = useState<(typeof ROOFS)[number]["id"]>("bitumen");
  const roof = ROOFS.find((r) => r.id === roofId)!;
  const roofAmount = hasRoof ? amount(roof.priceId) : 0;
  const roofDeg = hasRoof ? roof.deg : 0;
  const total = roofAmount + WARM_ITEMS.reduce((s, it) => s + (picked[it.id] ? amount(it.id) : 0), 0);
  const temp = BASE_TEMP + roofDeg + WARM_ITEMS.reduce((s, it) => s + (picked[it.id] ? it.deg : 0), 0);
  const maxTemp = BASE_TEMP + ROOFS[1].deg + WARM_ITEMS.reduce((s, it) => s + it.deg, 0);
  const warmth = (temp - BASE_TEMP) / (maxTemp - BASE_TEMP);

  const packages = [price("share"), price("full")].filter((p): p is NonNullable<typeof p> => !!p);
  const layers = section("layers");
  const checks = section("checks");
  const priority = section("priority");
  const months = section("months");
  const after = section("after");
  const cycle = section("cycle");

  return (
    <>
      {/* Warm a home */}
      <section className="bg-[hsl(195_30%_97%)] py-16 md:py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <p className="text-sm font-black text-accent">{isAr ? "دفّئ بيتًا" : "Warm a home"}</p>
          <h2 className="mt-2 text-3xl font-black text-primary md:text-4xl">{isAr ? "اختر ما يدفئ أسرة هذا الشتاء" : "Choose what warms a family this winter"}</h2>

          <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
            <fieldset className="rounded-2xl border border-border bg-card p-4 sm:p-6">
              <legend className="sr-only">{isAr ? "احتياجات الشتاء" : "Winter needs"}</legend>
              <ul className="space-y-2">
                {WARM_ITEMS.map((it) => {
                  const on = !!picked[it.id];
                  return (
                    <li key={it.id}>
                      <label className={`flex min-h-[68px] cursor-pointer items-center gap-4 rounded-xl border-2 px-4 transition-colors ${on ? "border-primary bg-primary/[0.04]" : "border-transparent hover:bg-muted/60"}`}>
                        <input type="checkbox" checked={on} onChange={(e) => setPicked((p) => ({ ...p, [it.id]: e.target.checked }))} className="peer sr-only" />
                        <span aria-hidden className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border-2 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 ${on ? "border-primary bg-primary text-secondary" : "border-primary/40"}`}>
                          {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                        </span>
                        <span className="flex-1">
                          <span className="block text-base font-black text-primary">{t(price(it.id)?.label)}</span>
                          <span className="block text-xs font-bold text-accent">+{fmtNum(it.deg, isAr)}° {isAr ? "دفء" : "warmth"}</span>
                        </span>
                        <span className="font-mono text-lg font-black tabular-nums text-primary">{fmtNum(amount(it.id), isAr)}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
              <ul className="mt-2 space-y-2">
                <li>
                  <label className={`flex min-h-[68px] cursor-pointer items-center gap-4 rounded-xl border-2 px-4 transition-colors ${hasRoof ? "border-primary bg-primary/[0.04]" : "border-transparent hover:bg-muted/60"}`}>
                    <input type="checkbox" checked={hasRoof} onChange={(e) => setHasRoof(e.target.checked)} className="peer sr-only" />
                    <span aria-hidden className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border-2 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 ${hasRoof ? "border-primary bg-primary text-secondary" : "border-primary/40"}`}>
                      {hasRoof && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                    </span>
                    <span className="flex-1">
                      <span className="block text-base font-black text-primary">{isAr ? "سقف للبيت" : "A roof for the house"}</span>
                      <span className="block text-xs font-bold text-accent">{hasRoof ? `+${fmtNum(roof.deg, isAr)}° ${isAr ? "دفء" : "warmth"}` : (isAr ? "للبيت سقف واحد: اختر نوعه" : "One roof per house: pick its type")}</span>
                    </span>
                    <span className="font-mono text-lg font-black tabular-nums text-primary">{hasRoof ? fmtNum(amount(roof.priceId), isAr) : ""}</span>
                  </label>
                  {hasRoof && (
                    <div role="radiogroup" aria-label={isAr ? "نوع السقف" : "Roof type"} className="mt-2 grid grid-cols-2 gap-2 ps-4">
                      {ROOFS.map((r) => {
                        const on = r.id === roofId;
                        const label = t(price(r.priceId)?.label);
                        return (
                          <button key={r.id} type="button" role="radio" aria-checked={on} onClick={() => setRoofId(r.id)}
                            className={`min-h-[52px] rounded-xl border-2 px-3 py-2 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${on ? "border-primary bg-primary text-primary-foreground" : "border-border text-primary hover:border-primary/40"}`}>
                            <span className="block text-sm font-black">{isAr ? `سقف ${label}` : `${label} roof`}</span>
                            <span className={`block font-mono text-sm font-black tabular-nums ${on ? "text-secondary" : "text-primary/70"}`}>{fmtNum(amount(r.priceId), isAr)}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </li>
              </ul>
            </fieldset>

            <div className="setr-night relative overflow-hidden rounded-2xl p-6 text-primary-foreground sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-1.5 text-sm font-bold text-primary-foreground/75"><Thermometer className="h-4 w-4" /> {isAr ? "دفء البيت" : "Home warmth"}</div>
                  <div className="mt-1 text-5xl font-black tabular-nums transition-colors" style={{ color: `hsl(${200 - warmth * 178} ${70 + warmth * 18}% ${78 - warmth * 18}%)` }} aria-live="polite">
                    {fmtNum(temp, isAr)}°
                  </div>
                </div>
                <WinterHouse warmth={warmth} className="setr-house w-36 shrink-0 sm:w-44" />
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-primary-foreground/15">
                <div className="setr-temp-bar h-full origin-[inline-start] rounded-full" style={{ transform: `scaleX(${0.08 + warmth * 0.92})` }} />
              </div>
              <div className="mt-6 border-t border-dashed border-primary-foreground/25 pt-5">
                <div className="text-sm font-bold text-primary-foreground/75">{isAr ? "الإجمالي" : "Total"}</div>
                <div className="mt-1 text-3xl font-black tabular-nums text-secondary" aria-live="polite">{fmtNum(total, isAr)} <span className="text-base">{isAr ? "جنيه" : "EGP"}</span></div>
              </div>
              <Link
                to={total > 0 ? amountHref(DONATE, total) : DONATE}
                aria-disabled={total === 0}
                className={`mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-grad text-base font-black text-accent-foreground shadow-cta transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${total === 0 ? "pointer-events-none opacity-50" : ""}`}
              >
                <Heart className="h-5 w-5" /> {isAr ? "دفّئ البيت وتبرّع" : "Warm it and donate"}
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {packages.map((p) => (
              <Link key={p.id} to={amountHref(DONATE, p.amount)} className="flex items-center justify-between gap-4 rounded-xl border-2 border-border bg-card p-5 transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <span>
                  <span className="block text-sm font-bold text-muted-foreground">{t(p.note)}</span>
                  <span className="mt-0.5 block text-lg font-black text-primary">{t(p.label)}</span>
                </span>
                <span className="text-2xl font-black tabular-nums text-accent">{fmtNum(p.amount, isAr)} <span className="text-sm font-bold text-muted-foreground">{isAr ? "جنيه" : "EGP"}</span></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Three layers of covering */}
      {layers && (
        <section className="bg-background py-16 md:py-24">
          <div className="container mx-auto grid max-w-6xl gap-10 px-4 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
            <div>
              <h2 className="text-3xl font-black text-primary md:text-4xl">{t(layers.title)}</h2>
              {layers.lead && <p className="mt-4 text-base leading-relaxed text-foreground/75">{t(layers.lead)}</p>}
            </div>
            <ol className="overflow-hidden rounded-2xl">
              {layers.items.map((l, i) => {
                const I = iconFor(LAYER_ICONS, l.id, Home);
                return (
                  <li key={l.id} className="flex gap-5 p-6 sm:p-8" style={{ background: `hsl(152 ${55 - i * 8}% ${14 + i * 7}%)` }}>
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary-foreground/10 text-secondary"><I className="h-6 w-6" /></span>
                    <div className="text-primary-foreground">
                      <h3 className="text-xl font-black">{t(l.title)}</h3>
                      <p className="mt-2 text-sm leading-[1.8] text-primary-foreground/85 sm:text-base">{t(l.desc)}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>
      )}

      <HadithBlock hadith={{ ar: c.hadith.text.ar, en: c.hadith.text.en, sourceAr: c.hadith.source.ar, sourceEn: c.hadith.source.en }} tone="winter" />

      {/* How homes are chosen */}
      {checks && (
        <section className="bg-background py-16 md:py-20">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
              <div>
                <p className="text-sm font-black text-accent">{isAr ? "كيف نختار البيوت؟" : "How we choose homes"}</p>
                <h2 className="mt-2 text-3xl font-black text-primary md:text-4xl">{t(checks.title)}</h2>
                {checks.lead && (
                  <p className="mt-4 text-base leading-[1.85] text-foreground/75">
                    {t(checks.lead)}
                  </p>
                )}
              </div>
              <ul className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2">
                {checks.items.map((ck) => {
                  const I = iconFor(CHECK_ICONS, ck.id, Home);
                  return (
                    <li key={ck.id} className="flex gap-4 bg-card p-6">
                      <ClipboardCheck className="mt-1 h-5 w-5 shrink-0 text-accent" aria-hidden />
                      <div>
                        <h3 className="flex items-center gap-2 text-lg font-black text-primary"><I className="h-5 w-5 text-primary/60" aria-hidden /> {t(ck.title)}</h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-foreground/75 sm:text-base">{t(ck.desc)}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Who comes first */}
      {priority && (
        <section className="bg-[hsl(195_30%_97%)] py-16 md:py-20">
          <div className="container mx-auto max-w-6xl px-4">
            <p className="text-sm font-black text-accent">{isAr ? "لمن نصل أولًا؟" : "Who comes first"}</p>
            <h2 className="mt-2 text-3xl font-black text-primary md:text-4xl">{t(priority.title)}</h2>
            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {priority.items.map((g) => {
                const I = iconFor(PRIORITY_ICONS, g.id, Home);
                return (
                  <li key={g.id} className="rounded-2xl bg-card p-6">
                    <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-secondary"><I className="h-6 w-6" aria-hidden /></span>
                    <h3 className="mt-4 text-lg font-black text-primary">{t(g.title)}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-foreground/75 sm:text-base">{t(g.desc)}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}

      {/* The season */}
      {months && (
        <section className="bg-[hsl(195_30%_97%)] py-16 md:py-20">
          <div className="container mx-auto max-w-6xl px-4">
            <h2 className="text-3xl font-black text-primary md:text-4xl">{t(months.title)}</h2>
            {months.lead && <p className="mt-3 max-w-2xl text-base text-foreground/75">{t(months.lead)}</p>}
            <ol className="mt-10 grid grid-cols-5 items-end gap-2 sm:gap-4">
              {months.items.map((m, i) => {
                const cold = MONTH_COLD[m.id] ?? MONTH_COLD_BY_INDEX[i] ?? 0.5;
                return (
                  <li key={m.id} className="flex flex-col items-center text-center">
                    <span className="text-[11px] font-bold text-muted-foreground sm:text-sm">{t(m.desc)}</span>
                    <span className="setr-bar mt-2 w-full rounded-t-lg" style={{ height: `${40 + cold * 110}px`, background: `hsl(${200 - cold * 10} ${45 + cold * 25}% ${72 - cold * 30}%)` }} />
                    <span className="mt-3 text-sm font-black text-primary sm:text-base">{t(m.title)}</span>
                  </li>
                );
              })}
            </ol>
            <p className="mt-6 text-sm text-foreground/70">
              {isAr ? "ينفّذ العمل متطوعونا مع نجارين وبنّائين محترفين، وكل تسليم موثّق بالصور والفيديو ويصلك تقريره." : "Built by our volunteers with professional carpenters and masons; every delivery is documented and reported to you."}
            </p>
          </div>
        </section>
      )}

      {/* After your donation */}
      {after && (
        <section className="bg-background py-16 md:py-20">
          <div className="container mx-auto max-w-6xl px-4">
            <h2 className="text-3xl font-black text-primary md:text-4xl">{t(after.title)}</h2>
            <ol className="mt-10 grid gap-6 md:grid-cols-4">
              {after.items.map((st, i) => {
                const I = iconFor(AFTER_ICONS, st.id, Receipt);
                return (
                  <li key={st.id} className="relative">
                    <div className="flex items-center gap-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-primary font-mono text-base font-black text-primary">{fmtNum(i + 1, isAr)}</span>
                      <I className="h-5 w-5 text-accent" aria-hidden />
                    </div>
                    <h3 className="mt-4 text-lg font-black text-primary">{t(st.title)}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-foreground/75 sm:text-base">{t(st.desc)}</p>
                  </li>
                );
              })}
            </ol>
            <Link to="/donate/track" className="mt-8 inline-flex min-h-[44px] items-center text-sm font-black text-primary underline decoration-secondary decoration-2 underline-offset-4 hover:text-accent">
              {isAr ? "تتبّع تبرعًا سابقًا" : "Track a previous donation"}
            </Link>
          </div>
        </section>
      )}

      {/* Setr runs on Markoun: the reuse cycle */}
      {cycle && (
        <section className="setr-night relative overflow-hidden py-16 text-primary-foreground md:py-24">
          <div className="setr-rain pointer-events-none absolute inset-0" aria-hidden />
          <div className="container relative mx-auto max-w-6xl px-4">
            <div className="max-w-3xl">
              <p className="text-sm font-black text-[hsl(195_70%_80%)]">{isAr ? "سِتر تعتمد على مَرْكون" : "Setr runs on Markoun"}</p>
              <h2 className="mt-2 text-3xl font-black md:text-4xl">{t(cycle.title)}</h2>
              {cycle.lead && (
                <p className="mt-4 text-base leading-[1.9] text-primary-foreground/85 md:text-lg">
                  {t(cycle.lead)}
                </p>
              )}
            </div>
            <ol className="mt-10 grid gap-4 md:grid-cols-3">
              {cycle.items.map((cy, i) => {
                const I = iconFor(CYCLE_ICONS, cy.id, Package);
                return (
                  <li key={cy.id} className="relative rounded-2xl bg-primary-foreground/[0.07] p-6">
                    <div className="flex items-center justify-between">
                      <span className="grid h-11 w-11 place-items-center rounded-xl bg-secondary text-secondary-foreground"><I className="h-5 w-5" aria-hidden /></span>
                      <span className="font-mono text-sm font-black text-[hsl(195_70%_80%)]">{fmtNum(i + 1, isAr)}</span>
                    </div>
                    <h3 className="mt-4 text-lg font-black">{t(cy.title)}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-primary-foreground/80 sm:text-base">{t(cy.desc)}</p>
                  </li>
                );
              })}
            </ol>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/markoun" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-secondary px-6 font-black text-secondary-foreground transition-colors hover:bg-[hsl(75_85%_68%)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-primary">
                {isAr ? "تبرّع بملابس أو أثاث عبر مَرْكون" : "Give clothes or furniture via Markoun"}
              </Link>
              <a href={waHref(isAr, "التبرع بملابس شتوية وبطاطين", "donating winter clothes and blankets")} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-primary-foreground/30 px-6 font-black transition-colors hover:bg-primary-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary">
                <WhatsAppIcon className="h-5 w-5" /> {isAr ? "أو راسلنا على واتساب" : "Or message us on WhatsApp"}
              </a>
            </div>
          </div>
        </section>
      )}

      <section className="bg-background py-16 md:py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-black text-primary md:text-4xl">{isAr ? "من شتاء العام الماضي" : "From last winter"}</h2>
          <div className="mt-8"><BentoGallery items={galleryImgs} isAr={isAr} /></div>
        </div>
      </section>
    </>
  );
};

const SetrLanding = () => {
  const { c } = useCampaignPage("setr", SETR_DEFAULTS);
  return (
    <CampaignLandingShell
      slug="setr"
      seo={c.seo}
      path="/setr"
      titleAr="حملة سِتْر — «مَن سَتَرَ مسلمًا في الدنيا، سَتَرَهُ الله في الدنيا والآخرة»"
      titleEn="Setr Campaign — 'Whoever covers a Muslim in this world, Allah will cover them in this world and the Hereafter'"
      taglineAr="يصبح الشتاء عبئًا ثقيلًا على الأسر المستحقة؛ فبرده القارس يحرم الأطفال من النوم ويؤذي كبار السن. وجاءت حملة ستر لتجعل من تبرعك غطاءً دافئًا وجدارًا ساترًا يحمي أهالينا، ويكون لك سترًا وأجرًا ممتدًا في الدنيا والآخرة."
      taglineEn="When winter becomes a harsh burden on needy families: freezing cold that keeps children awake. The Setr campaign provides roofs, warm fiber blankets, heavy clothing, beds and mattresses across Egyptian villages."
      metaDescAr="شارك في حملة سِتر مع مؤسسة اليسر: أسقف عازلة للبيوت، وأبواب وشبابيك، وأسِرّة ومراتب، وألحفة فايبر، وكسوة شتاء للأطفال وكبار السن بالدقهلية ومحافظات مصر."
      metaDescEn="Join Al-Yusr's Setr Winter Campaign: home roofing, doors & windows, beds & mattresses, fiber blankets, and winter clothing for children and elderly in Egypt."
      heroImage={posterWater}
      heroAlt="حملة ستر — تسقيف بيوت وألحفة فايبر وكسوة شتوية للأسر المستحقة"
      hero={<SetrHero />}
      main={<SetrMain />}
      finalCtaClassName="setr-night"
      finalCtaDecor={<div className="setr-rain pointer-events-none absolute inset-0" aria-hidden />}
      relatedLinks={[
        { href: "/dhill", ar: "حملة ظِلّ (سقيا الماء وبرودة الصيف)", en: "Dhill campaign" },
        { href: "/markoun", ar: "حملة مَرْكون (الأثاث والأجهزة)", en: "Markoun campaign" },
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

export default SetrLanding;
