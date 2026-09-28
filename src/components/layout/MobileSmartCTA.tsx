import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Beef, Target, Sparkles } from "lucide-react";
import { useLang } from "@/i18n/LangContext";

/**
 * Mobile-only sticky CTA whose label/href changes based on which homepage
 * section is currently in view. Hidden on tablet+ (md:hidden).
 * Section ids it tracks: hero (top, hidden), #programs, #qurbani,
 * #campaigns, #axes, #goals. Falls back to a generic "Donate now".
 */
type CTA = { label: string; sub: string; href: string; icon: React.ComponentType<{ className?: string }> };

export const MobileSmartCTA = () => {
  const { lang } = useLang();
  const isAR = lang === "ar";
  const [active, setActive] = useState<string>("hero");
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ids = ["hero", "programs", "qurbani", "axes", "campaigns", "goals", "donate"];
    const els = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-30% 0px -50% 0px", threshold: [0, 0.25, 0.6] },
    );
    els.forEach((el) => io.observe(el));

    // Hide bar while user is at the very top (Hero owns its own CTAs)
    const onScroll = () => setHidden(window.scrollY < 320);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const map: Record<string, CTA> = {
    qurbani: {
      label: isAR ? "احجز صكّك" : "Reserve a share",
      sub: isAR ? "قبل ما يخلص الوقت" : "Before time runs out",
      href: "/qurbani",
      icon: Beef,
    },
    programs: {
      label: isAR ? "تبرع لبرنامج" : "Donate to a program",
      sub: isAR ? "اختر المحور المناسب" : "Pick the right axis",
      href: "/donate",
      icon: Heart,
    },
    axes: {
      label: isAR ? "ساهم في أحد المحاور" : "Support an axis",
      sub: isAR ? "غذاء · صحة · تعليم" : "Food · Health · Education",
      href: "/donate",
      icon: Sparkles,
    },
    campaigns: {
      label: isAR ? "ادعم الحملة" : "Support the campaign",
      sub: isAR ? "أثرك يبدأ من هنا" : "Your impact starts here",
      href: "/donate",
      icon: Heart,
    },
    goals: {
      label: isAR ? "ساهم في تحقيق الأهداف" : "Help us hit the goal",
      sub: isAR ? "كل جنيه بيقرّبنا" : "Every EGP brings us closer",
      href: "/donate",
      icon: Target,
    },
  };

  const cta = map[active] ?? {
    label: isAR ? "تبرع الآن" : "Donate now",
    sub: isAR ? "أمانة موثّقة بالصور" : "Verified, with photos",
    href: "/donate",
    icon: Heart,
  };

  if (hidden) return null;
  const Icon = cta.icon;

  return (
    <div
      role="region"
      aria-label={isAR ? "إجراء سريع" : "Quick action"}
      className="fixed inset-x-0 bottom-0 z-50 md:hidden"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      <div className="mx-3 mb-2 flex items-center gap-3 rounded-2xl border border-secondary/30 bg-[hsl(152_65%_10%)]/95 px-3 py-2 text-primary-foreground shadow-cta backdrop-blur">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[11px] font-bold text-primary-foreground/80">{cta.sub}</div>
          <div className="truncate text-sm font-extrabold">{cta.label}</div>
        </div>
        <Link
          to={cta.href}
          className="shrink-0 rounded-xl bg-orange-grad px-4 py-2 text-xs font-extrabold text-accent-foreground shadow-cta"
        >
          {isAR ? "اذهب" : "Go"}
        </Link>
      </div>
    </div>
  );
};

export default MobileSmartCTA;