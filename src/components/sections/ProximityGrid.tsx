import { useRef } from "react";
import { useLang } from "@/i18n/LangContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Heart, HandHeart, Utensils, Beef, Drumstick, Pill, BookOpen, Backpack,
  Home, Droplets, GraduationCap, Stethoscope, Baby, Gift, PackageCheck, Shirt,
} from "lucide-react";
import logoCircle from "@/assets/logo-circle.png";

/**
 * Orbit of giving — calm, brand-colored circular map of donation axes
 * around the Al-Yusr mark. Replaced the heavy proximity-scale GSAP
 * interaction with a quiet hover lift so the section feels elegant and
 * brand-aligned instead of jumpy.
 */
const ITEM_HREF: Record<string, string> = {
  // Curated 12-door set — every label routes to a real program page.
  "صدقة جارية": "/donate", "Ongoing Sadaqah": "/donate",
  "زكاة المال": "/zakat", "Zakat": "/zakat",
  "إفطار صائم": "/programs/box", "Iftar Meals": "/programs/box",
  "أضحية مباركة": "/programs/odhya", "Qurbani": "/programs/odhya",
  "كفالة يتيم": "/programs/orphans", "Orphan Sponsorship": "/programs/orphans",
  "علاج المرضى": "/programs/treatment", "Medical Care": "/programs/treatment",
  "كفالة طالب": "/programs/education", "Student Sponsorship": "/programs/education",
  "كسوة العيد": "/donate", "Eid Clothing": "/donate",
  "سُقيا الماء": "/programs/water", "Clean Water": "/programs/water",
  "إيواء أسرة": "/programs/shelter", "Family Shelter": "/programs/shelter",
  "جهاز عروس": "/programs/bride", "Bride Trousseau": "/programs/bride",
  "كرتونة الخير": "/programs/box", "Aid Carton": "/programs/box",
};

export const ProximityGrid = () => {
  const { lang } = useLang();
  const stageRef = useRef<HTMLDivElement | null>(null);

  const items =
    lang === "ar"
      ? [
          { icon: Heart, label: "صدقة جارية" },
          { icon: HandHeart, label: "زكاة المال" },
          { icon: Utensils, label: "إفطار صائم" },
          { icon: Beef, label: "أضحية مباركة" },
          { icon: Baby, label: "كفالة يتيم" },
          { icon: Stethoscope, label: "علاج المرضى" },
          { icon: GraduationCap, label: "كفالة طالب" },
          { icon: Shirt, label: "كسوة العيد" },
          { icon: Droplets, label: "سُقيا الماء" },
          { icon: Home, label: "إيواء أسرة" },
          { icon: Gift, label: "جهاز عروس" },
          { icon: PackageCheck, label: "كرتونة الخير" },
        ]
      : [
          { icon: Heart, label: "Ongoing Sadaqah" },
          { icon: HandHeart, label: "Zakat" },
          { icon: Utensils, label: "Iftar Meals" },
          { icon: Beef, label: "Qurbani" },
          { icon: Baby, label: "Orphan Sponsorship" },
          { icon: Stethoscope, label: "Medical Care" },
          { icon: GraduationCap, label: "Student Sponsorship" },
          { icon: Shirt, label: "Eid Clothing" },
          { icon: Droplets, label: "Clean Water" },
          { icon: Home, label: "Family Shelter" },
          { icon: Gift, label: "Bride Trousseau" },
          { icon: PackageCheck, label: "Aid Carton" },
        ];

  return (
    <section
      className="relative overflow-hidden bg-background py-16 md:py-24"
      aria-label={lang === "ar" ? "محاور خير اليسر" : "Al-Yusr Aid Axes"}
    >
   
      <div className="container relative mx-auto px-4">
        <div className="relative mx-auto max-w-3xl text-center">
          {/* Soft orange blob centered under the section heading */}
          <span
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/25 blur-3xl sm:h-[360px] sm:w-[360px]"
          />
         
          <h2 className="mt-4 text-2xl font-bold leading-snug text-accent sm:text-3xl md:text-4xl">
            {lang === "ar" ? "كل أبواب الخير… حواليك" : "Every door of good… around you"}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm font-medium leading-7 text-muted-foreground sm:text-base">
            {lang === "ar" ? "صدقات جارية" : "Choose the door of goodness that moves your heart — every program is an ongoing charity."}
          </p>
        </div>

        <div
          ref={stageRef}
          className="relative mx-auto mt-10 aspect-square w-full max-w-[560px] rounded-[2rem] border border-primary/10 bg-card/60 backdrop-blur-sm shadow-[0_30px_80px_-50px_hsl(var(--primary)/0.35)] sm:max-w-[640px] md:max-w-[720px]"
        >
          {/* Concentric orbit rings — subtle brand-colored guides */}
          <div aria-hidden className="pointer-events-none absolute inset-[6%] rounded-full border border-secondary/15" />
          <div aria-hidden className="pointer-events-none absolute inset-[26%] rounded-full border border-dashed border-primary/15" />
          <div aria-hidden className="pointer-events-none absolute inset-[46%] rounded-full border border-accent/50" />

          {/* Center logo — a soft brand blob holds the mark at the heart of every cause */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
          >
            <div className="relative grid h-28 w-28 place-items-center sm:h-32 sm:w-32 md:h-36 md:w-36">

              <img
                src={logoCircle}
                alt="Al-Yusr"
                width={144}
                height={144}
                loading="lazy"
                className="relative ]"
              />
            </div>
          </div>

          {/* Orbit-positioned cards — 8 inner ring + 8 outer ring */}
          {items.map((it, i) => {
            const Icon = it.icon;
            const isInner = i < 6;
            const ringCount = 6;
            const ringIndex = isInner ? i : i - 6;
            // Stagger inner & outer rings so cards don't visually align radially.
            const angleDeg = (360 / ringCount) * ringIndex + (isInner ? -90 : -90 + 30);
            const radiusPct = isInner ? 30 : 46; // % of stage half-size
            const a = (angleDeg * Math.PI) / 180;
            const left = 50 + Math.cos(a) * radiusPct;
            const top = 50 + Math.sin(a) * radiusPct;
            const href = ITEM_HREF[it.label] || "/donate";
            return (
              <Link
                key={it.label}
                to={href}
                aria-label={lang === "ar" ? `تبرّع لـ${it.label}` : `Donate for ${it.label}`}
                className="group absolute flex items-center justify-center transition-transform duration-300 hover:-translate-y-0.5 hover:scale-[1.06]"
                style={{
                  left: `${left}%`,
                  top: `${top}%`,
                  width: "clamp(58px, 13%, 88px)",
                  height: "clamp(58px, 13%, 88px)",
                  transform: "translate(-50%, -50%)",
                  transformOrigin: "center",
                }}
              >
                <div className="flex h-full w-full flex-col items-center justify-center gap-1 rounded-2xl border-2 border-secondary bg-card text-card-foreground shadow-[0_0_18px_-2px_hsl(var(--secondary)/0.55),0_10px_30px_-18px_hsl(var(--primary)/0.4)] transition-all duration-300 group-hover:shadow-[0_0_26px_-2px_hsl(var(--secondary)/0.85),0_18px_40px_-16px_hsl(var(--primary)/0.55)]">
                  <Icon className="h-4 w-4 text-primary sm:h-5 sm:w-5" strokeWidth={2.25} />
                  <span className="px-1 text-center text-[9px] font-extrabold leading-tight text-primary sm:text-[10px]">
                    {it.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Bilingual CTA hint under the grid */}
        <div className="mx-auto  mt-8 flex max-w-2xl flex-col items-center gap-3 text-center">
          <p className="text-sm font-bold text-foreground/85 sm:text-base">
            {lang === "ar"
              ? "اضغط أي أيقونة لتبدأ التبرع في المجال اللي يلمس قلبك."
              : "Tap any icon to start donating to the cause that moves you most."}
          </p>
          <Button asChild size="lg" className="bg-orange-grad text-accent-foreground shadow-cta hover:opacity-95">
            <Link to="/donate" aria-label={lang === "ar" ? "تبرع الآن" : "Donate now"}>
              <Heart className="h-4 w-4" />
              {lang === "ar" ? "تبرّع الآن" : "Donate Now"}
            </Link>
          </Button>
        </div>

      
      </div>
    </section>
  );
};
