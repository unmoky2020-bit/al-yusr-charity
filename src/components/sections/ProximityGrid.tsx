import { useLang } from "@/i18n/LangContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Heart, HandHeart, Utensils, Beef,
  Baby, Gift, PackageCheck, Shirt,
  Home, Droplets, GraduationCap, Stethoscope,
  Sparkles,
} from "lucide-react";
import logoCircle from "@/assets/logo-circle.png";
import { WhatsAppIcon } from "@/components/common/icons/WhatsAppIcon";
import { usePrograms } from "@/data/sources/programs";

/**
 * Where each door leads. A "/programs/<slug>" target is used only while that program is published on the
 * backend; otherwise the door opens the donation form (see hrefOf), so no link lands on a closed program.
 */
const ITEM_HREF: Record<string, string> = {
  "صدقة جارية": "/donate",       "Ongoing Sadaqah": "/donate",
  "زكاة المال": "/zakat",         "Zakat": "/zakat",
  "إفطار صائم": "/programs/box",  "Iftar Meals": "/programs/box",
  "أضحية مباركة": "/programs/odhya", "Qurbani": "/programs/odhya",
  "كفالة يتيم": "/programs/orphans", "Orphan Sponsorship": "/programs/orphans",
  "علاج المرضى": "/programs/treatment", "Medical Care": "/programs/treatment",
  "كفالة طالب": "/programs/education", "Student Sponsorship": "/programs/education",
  "كسوة العيد": "/donate",        "Eid Clothing": "/donate",
  "سُقيا الماء": "/programs/water", "Clean Water": "/programs/water",
  "إيواء أسرة": "/programs/shelter", "Family Shelter": "/programs/shelter",
  "جهاز عروس": "/programs/bride", "Bride Trousseau": "/programs/bride",
  "كرتونة الخير": "/programs/box", "Aid Carton": "/programs/box",
};

const PROGRAM_LINK = /^\/programs\/([^/]+)$/;

// Classic brand-unified card style — no per-card color
const ITEMS_AR = [
  { icon: Heart,         label: "صدقة جارية" },
  { icon: HandHeart,     label: "زكاة المال" },
  { icon: Utensils,      label: "إفطار صائم" },
  { icon: Beef,          label: "أضحية مباركة" },
  { icon: Baby,          label: "كفالة يتيم" },
  { icon: Stethoscope,   label: "علاج المرضى" },
  { icon: GraduationCap, label: "كفالة طالب" },
  { icon: Shirt,         label: "كسوة العيد" },
  { icon: Droplets,      label: "سُقيا الماء" },
  { icon: Home,          label: "إيواء أسرة" },
  { icon: Gift,          label: "جهاز عروس" },
  { icon: PackageCheck,  label: "كرتونة الخير" },
];

const ITEMS_EN = [
  { icon: Heart,         label: "Ongoing Sadaqah" },
  { icon: HandHeart,     label: "Zakat" },
  { icon: Utensils,      label: "Iftar Meals" },
  { icon: Beef,          label: "Qurbani" },
  { icon: Baby,          label: "Orphan Sponsorship" },
  { icon: Stethoscope,   label: "Medical Care" },
  { icon: GraduationCap, label: "Student Sponsorship" },
  { icon: Shirt,         label: "Eid Clothing" },
  { icon: Droplets,      label: "Clean Water" },
  { icon: Home,          label: "Family Shelter" },
  { icon: Gift,          label: "Bride Trousseau" },
  { icon: PackageCheck,  label: "Aid Carton" },
];

const polarToPercent = (angleDeg: number, radiusPct: number) => {
  const a = (angleDeg * Math.PI) / 180;
  return { x: 50 + Math.cos(a) * radiusPct, y: 50 + Math.sin(a) * radiusPct };
};

const STAGE = 700;

export const ProximityGrid = () => {
  const { lang } = useLang();
  const isRTL = lang === "ar";
  const items = isRTL ? ITEMS_AR : ITEMS_EN;
  const { programs } = usePrograms();
  const live = new Set(programs.map((p) => p.slug));
  const hrefOf = (label: string) => {
    const href = ITEM_HREF[label] || "/donate";
    const slug = href.match(PROGRAM_LINK)?.[1];
    return slug && !live.has(slug) ? "/donate" : href;
  };

  const innerItems = items.slice(0, 6);
  const outerItems = items.slice(6, 12);
  const innerRadius = 26;
  const outerRadius = 41.5;
  const cx = STAGE / 2;
  const cy = STAGE / 2;

  const getPos = (angleDeg: number, radiusPct: number) => {
    const { x, y } = polarToPercent(angleDeg, radiusPct);
    return { x: (x / 100) * STAGE, y: (y / 100) * STAGE };
  };

  return (
    <section
      className="relative isolate overflow-hidden bg-background py-20 md:py-28"
      aria-label={isRTL ? "محاور خير اليسر" : "Al-Yusr Aid Axes"}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Ambient glow */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-secondary/[0.04] to-transparent" />
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-accent/10 blur-[120px]" />
      <div aria-hidden className="pointer-events-none absolute -end-40 top-10 h-80 w-80 rounded-full bg-secondary/10 blur-[100px]" />

      <div className="container relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-secondary/30 bg-secondary/15 px-3.5 py-1 text-[11px] sm:text-xs font-black text-primary">
            <Sparkles className="h-3.5 w-3.5 text-secondary" />
            {isRTL ? "صدقات جارية" : "Ongoing Charity"}
          </span>

          <h2 className="mt-4 text-3xl font-black leading-tight text-primary sm:text-4xl md:text-[42px]">
            {isRTL ? (
              <>
                كل{" "}
                <span className="relative inline-block text-secondary">
                  أبواب الخير
                  <span aria-hidden className="absolute -bottom-1.5 start-0 end-0 h-[3px] rounded-full bg-gradient-to-r from-secondary/20 via-secondary to-secondary/20" />
                </span>
                {" "}… حواليك
              </>
            ) : (
              <>
                Every{" "}
                <span className="relative inline-block text-secondary">
                  door of good
                  <span aria-hidden className="absolute -bottom-1.5 start-0 end-0 h-[3px] rounded-full bg-gradient-to-r from-secondary/20 via-secondary to-secondary/20" />
                </span>
                {" "}… around you
              </>
            )}
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-sm font-medium leading-7 text-muted-foreground sm:text-base">
            {isRTL
              ? "اختر الباب الذي يُلمس قلبك — كل برنامج صدقة جارية تجري في ميزانك."
              : "Choose the door of goodness that moves your heart — every program is an ongoing charity."}
          </p>
        </div>

        {/* Orbital Stage */}
        <div className="relative mx-auto mt-12 w-full max-w-[720px]">

          {/* SVG: 3 dashed orbit rings (phosphoric, orange, green) + spokes */}
          <svg
            aria-hidden
            viewBox={`0 0 ${STAGE} ${STAGE}`}
            className="pointer-events-none absolute inset-0 h-full w-full"
            fill="none"
          >
            {/* Ring 1 — Phosphoric / lime green */}
            <circle
              cx={cx} cy={cy}
              r={(outerRadius / 100) * STAGE}
              stroke="#b5e522"
              strokeOpacity="0.55"
              strokeWidth="2"
              strokeDasharray="8 7"
            />
            {/* Ring 2 — Orange brand */}
            <circle
              cx={cx} cy={cy}
              r={((innerRadius + outerRadius) / 2 / 100) * STAGE}
              stroke="#f97316"
              strokeOpacity="0.40"
              strokeWidth="1.5"
              strokeDasharray="5 8"
            />
            {/* Ring 3 — Green brand */}
            <circle
              cx={cx} cy={cy}
              r={(innerRadius / 100) * STAGE}
              stroke="hsl(var(--secondary))"
              strokeOpacity="0.45"
              strokeWidth="1.5"
              strokeDasharray="4 6"
            />

            {/* Spokes → inner cards (green) */}
            {innerItems.map((_, i) => {
              const angleDeg = (360 / 6) * i - 90;
              const p = getPos(angleDeg, innerRadius);
              return (
                <line
                  key={`is-${i}`}
                  x1={cx} y1={cy} x2={p.x} y2={p.y}
                  stroke="hsl(var(--secondary))"
                  strokeOpacity="0.20"
                  strokeWidth="1"
                  strokeDasharray="4 8"
                />
              );
            })}
            {/* Spokes → outer cards (lime) */}
            {outerItems.map((_, i) => {
              const angleDeg = (360 / 6) * i - 90 + 30;
              const p = getPos(angleDeg, outerRadius);
              return (
                <line
                  key={`os-${i}`}
                  x1={cx} y1={cy} x2={p.x} y2={p.y}
                  stroke="#b5e522"
                  strokeOpacity="0.22"
                  strokeWidth="1"
                  strokeDasharray="3 9"
                />
              );
            })}
          </svg>

          {/* aspect-square wrapper */}
          <div className="relative aspect-square w-full">

            {/* Center Logo — perfectly sized & fitted without excess white background */}
            <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
              <div className="relative grid place-items-center">
                {/* Pulse rings */}
                <span aria-hidden className="absolute h-28 w-28 sm:h-36 sm:w-36 md:h-44 md:w-44 rounded-full border border-secondary/20 animate-ping [animation-duration:3s]" />
                <span aria-hidden className="absolute h-24 w-24 sm:h-30 sm:w-30 md:h-36 md:w-36 rounded-full border border-accent/18 animate-ping [animation-duration:2.2s] [animation-delay:0.8s]" />
                {/* Logo badge — fits the round logo cleanly with no oversized white margin */}
                <div className="relative grid h-24 w-24 sm:h-32 sm:w-32 md:h-40 md:w-40 place-items-center rounded-full bg-card shadow-[0_0_40px_-5px_hsl(var(--secondary)/0.45)] ring-2 ring-secondary/40 overflow-hidden">
                  <img
                    src={logoCircle}
                    alt="مؤسسة اليسر الخيرية"
                    width={160}
                    height={160}
                    loading="lazy"
                    className="h-full w-full object-contain select-none"
                  />
                </div>
              </div>
            </div>

            {/* Inner ring cards — balanced & compact on mobile to prevent overlapping */}
            {innerItems.map((it, i) => {
              const angleDeg = (360 / 6) * i - 90;
              const { x, y } = polarToPercent(angleDeg, innerRadius);
              const Icon = it.icon;
              const href = hrefOf(it.label);
              return (
                <Link
                  key={it.label}
                  to={href}
                  aria-label={isRTL ? `تبرّع لـ${it.label}` : `Donate — ${it.label}`}
                  className="group absolute z-10 -translate-x-1/2 -translate-y-1/2 transition-all duration-300 hover:scale-110 hover:-translate-y-[calc(50%+4px)] hover:z-30"
                  style={{ left: `${x}%`, top: `${y}%` }}
                >
                  <div
                    className="flex flex-col items-center justify-center rounded-xl sm:rounded-2xl border-[1.5px] sm:border-2 border-secondary/80 bg-card/95 text-card-foreground shadow-[0_2px_10px_-2px_hsl(var(--secondary)/0.35)] sm:shadow-[0_4px_18px_-2px_hsl(var(--secondary)/0.4),0_6px_20px_-10px_hsl(var(--primary)/0.25)] backdrop-blur-sm transition-all duration-300 group-hover:border-secondary group-hover:shadow-[0_6px_26px_hsl(var(--secondary)/0.7),0_12px_28px_-6px_hsl(var(--primary)/0.4)] p-1 sm:p-1.5 w-[56px] h-[56px] sm:w-[74px] sm:h-[74px] md:w-[86px] md:h-[86px]"
                  >
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 shrink-0 text-primary transition-transform group-hover:scale-110 mb-0.5 sm:mb-1" strokeWidth={2.2} />
                    <span className="px-0.5 text-center text-[8.5px] sm:text-[10px] md:text-[11.5px] font-black leading-[1.1] sm:leading-tight text-primary break-words max-w-full">
                      {it.label}
                    </span>
                  </div>
                </Link>
              );
            })}

            {/* Outer ring cards — balanced & compact on mobile to prevent overlapping */}
            {outerItems.map((it, i) => {
              const angleDeg = (360 / 6) * i - 90 + 30;
              const { x, y } = polarToPercent(angleDeg, outerRadius);
              const Icon = it.icon;
              const href = hrefOf(it.label);
              return (
                <Link
                  key={it.label}
                  to={href}
                  aria-label={isRTL ? `تبرّع لـ${it.label}` : `Donate — ${it.label}`}
                  className="group absolute z-10 -translate-x-1/2 -translate-y-1/2 transition-all duration-300 hover:scale-110 hover:-translate-y-[calc(50%+4px)] hover:z-30"
                  style={{ left: `${x}%`, top: `${y}%` }}
                >
                  <div
                    className="flex flex-col items-center justify-center rounded-xl sm:rounded-2xl border-[1.5px] sm:border-2 border-secondary/80 bg-card/95 text-card-foreground shadow-[0_2px_10px_-2px_hsl(var(--secondary)/0.35)] sm:shadow-[0_4px_18px_-2px_hsl(var(--secondary)/0.4),0_6px_20px_-10px_hsl(var(--primary)/0.25)] backdrop-blur-sm transition-all duration-300 group-hover:border-secondary group-hover:shadow-[0_6px_26px_hsl(var(--secondary)/0.7),0_12px_28px_-6px_hsl(var(--primary)/0.4)] p-1 sm:p-1.5 w-[56px] h-[56px] sm:w-[74px] sm:h-[74px] md:w-[86px] md:h-[86px]"
                  >
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 shrink-0 text-primary transition-transform group-hover:scale-110 mb-0.5 sm:mb-1" strokeWidth={2.2} />
                    <span className="px-0.5 text-center text-[8.5px] sm:text-[10px] md:text-[11.5px] font-black leading-[1.1] sm:leading-tight text-primary break-words max-w-full">
                      {it.label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mx-auto mt-10 flex max-w-2xl flex-col items-center gap-4 text-center">
          <p className="text-sm font-bold text-foreground/75 sm:text-base">
            {isRTL
              ? "اضغط أي أيقونة لتبدأ التبرع في المجال الذي يُلمس قلبك."
              : "Tap any icon to start donating to the cause that moves you most."}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {/* Donate — orange brand */}
            <Button asChild size="lg" className="rounded-full bg-orange-grad px-8 font-black text-accent-foreground shadow-cta hover:opacity-95">
              <Link to="/donate">
                <Heart className="h-4 w-4" />
                {isRTL ? "تبرّع الآن" : "Donate Now"}
              </Link>
            </Button>
            {/* WhatsApp — lime green */}
            <a
              href="https://wa.me/201097000137"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[hsl(82_75%_48%)] px-6 py-2.5 text-sm font-black text-[#1a2a00] shadow-lg transition hover:brightness-105"
            >
              <WhatsAppIcon className="h-4 w-4" />
              {isRTL ? "استفسر عبر واتساب" : "Ask on WhatsApp"}
            </a>
          </div>
        </div>

      </div>
    </section>
  );
};