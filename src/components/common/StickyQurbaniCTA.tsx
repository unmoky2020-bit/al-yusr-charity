import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/common/icons/WhatsAppIcon";
import { useLang } from "@/i18n/LangContext";
import { QURBANI_SEASON } from "@/data/qurbaniSeason";

/**
 * [EID-2026] Sticky bottom notice — Qurbani booking is CLOSED for the 2026 season.
 * Replaces the original 48h countdown CTA with a "booking complete" message
 * and redirects donors toward the endowment farm (year-round impact).
 * To restore next season: revert to the previous countdown variant in git.
 */
export const StickyQurbaniCTA = ({
  donateHref = "/farm",
  waText,
  deadline: _deadline,
  title,
  description,
  ctaLabel,
  dismissKey = `qurbani-${QURBANI_SEASON.year}-cta-dismissed`,
  ariaLabel,
}: {
  donateHref?: string;
  waText?: string;
  deadline?: string;
  title?: { ar: string; en: string };
  description?: { ar: string; en: string };
  ctaLabel?: { ar: string; en: string };
  dismissKey?: string;
  ariaLabel?: { ar: string; en: string };
}) => {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const [open, setOpen] = useState(false);
  // Hide when the page footer (or header) is in view so the CTA only floats
  // over real page content — never overlapping site chrome.
  const [overChrome, setOverChrome] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const dismissed = sessionStorage.getItem(dismissKey);
    if (!dismissed) {
      const t = setTimeout(() => setOpen(true), 1200);
      return () => clearTimeout(t);
    }
  }, [dismissKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Hide whenever site chrome (header/footer) OR the page hero is on screen.
    const selectors = [
      "header",
      "footer",
      "[data-sticky-cta-hide]",
      ".pattern-hero-luxe",
      ".pattern-hero",
    ].join(",");
    const targets = Array.from(document.querySelectorAll(selectors));
    if (targets.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        // Track currently-visible elements across multiple targets.
        setOverChrome((prev) => {
          const visible = new Set<Element>();
          entries.forEach((e) => { if (e.isIntersecting) visible.add(e.target); });
          // Re-check all targets: any still intersecting from prior observations?
          return entries.some((e) => e.isIntersecting) ? true : false;
        });
      },
      { threshold: 0.05 },
    );
    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  if (!open || overChrome) return null;

  const wa = `https://wa.me/201097000137?text=${encodeURIComponent(
    waText || (isAr ? "السلام عليكم، عايز أعرف تفاصيل دعم المزرعة الوقفية." : "Hi, I'd like details on supporting the endowment farm."),
  )}`;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[60] px-3 pb-3 md:px-6 md:pb-4"
      role="region"
      aria-label={ariaLabel ? ariaLabel[isAr ? "ar" : "en"] : (isAr ? "إشعار تبرع" : "Donation notice")}
    >
      <div className="relative mx-auto max-w-5xl rounded-2xl border border-secondary/40 bg-primary/95 p-3 pt-10 shadow-2xl backdrop-blur sm:pt-3 md:p-4 md:pt-4">
        {/* Close button — pinned top-left on every viewport */}
        <button
          type="button"
          aria-label={isAr ? "إخفاء" : "Dismiss"}
          onClick={() => { setOpen(false); sessionStorage.setItem(dismissKey, "1"); }}
          className="absolute left-2 top-2 grid h-8 w-8 place-items-center rounded-full text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <div className="text-sm font-black text-primary-foreground md:text-base">
              {title ? title[isAr ? "ar" : "en"] : (isAr ? `حجز صكوك أضحية ${QURBANI_SEASON.year} هيفتح قريب` : `Qurbani ${QURBANI_SEASON.year} booking opens soon`)}
            </div>
            <div className="mt-0.5 text-[11px] font-bold text-primary-foreground/80 md:text-xs">
              {description
                ? description[isAr ? "ar" : "en"]
                : (isAr
                  ? "تقدر تكمل دعمك للمزرعة الوقفية اللي بتطعّم الأسر طول السنة."
                  : "You can keep giving by supporting our endowment farm that feeds families year-round.")}
            </div>
          </div>

          {/* Action row — full-width on mobile, inline on desktop */}
          <div className="flex shrink-0 items-center gap-2">
            <Button asChild size="sm" className="flex-1 bg-orange-grad text-accent-foreground shadow-cta hover:opacity-95 sm:flex-none">
              <Link to={donateHref}>
                <Heart className="h-4 w-4" />{ctaLabel ? ctaLabel[isAr ? "ar" : "en"] : (isAr ? "ادعم المزرعة" : "Support the farm")}
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="flex-1 border-secondary/40 bg-transparent text-primary-foreground hover:bg-secondary/20 hover:text-primary-foreground sm:flex-none">
              <a href={wa} target="_blank" rel="noopener" dir="ltr" aria-label="WhatsApp">
                <WhatsAppIcon className="h-4 w-4" aria-hidden />
                <span>{isAr ? "واتساب" : "WhatsApp"}</span>
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StickyQurbaniCTA;
