import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { WhatsAppIcon } from "@/components/common/icons/WhatsAppIcon";

/**
 * True only after the window has fully loaded plus a short delay, and never under
 * prefers-reduced-motion. Decorative animations wait for this so they never compete
 * with the page's own loading.
 */
export const useAfterLoad = (delay = 1500) => {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let t = 0;
    const go = () => { t = window.setTimeout(() => setOn(true), delay); };
    if (document.readyState === "complete") go();
    else window.addEventListener("load", go, { once: true });
    return () => { window.clearTimeout(t); window.removeEventListener("load", go); };
  }, [delay]);
  return on;
};

/** Donate link pre-filled with an amount, preserving the campaign's program param. */
export const amountHref = (donateHref: string, amount: number) =>
  `${donateHref}${donateHref.includes("?") ? "&" : "?"}amount=${amount}`;

export const waHref = (isAr: boolean, titleAr: string, titleEn: string) =>
  `https://wa.me/201097000137?text=${encodeURIComponent(
    isAr ? `السلام عليكم، أود الاستفسار عن ${titleAr}.` : `Hi, I would like to ask about ${titleEn}.`,
  )}`;

export const fmtNum = (n: number, isAr: boolean) => n.toLocaleString(isAr ? "ar-EG" : "en-US");

export const CampaignCrumbs = ({ isAr, name, className = "" }: { isAr: boolean; name: string; className?: string }) => (
  <div className={`flex justify-center md:justify-start ${className}`}>
    <Breadcrumbs
      items={[
        { name: isAr ? "الرئيسية" : "Home", href: "/" },
        { name: isAr ? "الحملات" : "Campaigns", href: "/campaigns" },
        { name },
      ]}
    />
  </div>
);

/** Primary donate + WhatsApp pair. `tone` adapts the secondary button to dark or light grounds. */
export const HeroActions = ({
  isAr, donateHref, donateLabel, wa, tone = "dark", className = "",
}: { isAr: boolean; donateHref: string; donateLabel: string; wa: string; tone?: "dark" | "light"; className?: string }) => (
  <div className={`flex flex-col gap-3 sm:flex-row ${className}`}>
    <Link
      to={donateHref}
      className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-orange-grad px-6 text-sm font-black text-accent-foreground shadow-cta transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 sm:text-base"
    >
      <Heart className="h-5 w-5" /> {donateLabel}
    </Link>
    <a
      href={wa}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl border-2 px-6 text-sm font-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:text-base ${
        tone === "dark"
          ? "border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 focus-visible:ring-secondary"
          : "border-primary/25 text-primary hover:bg-primary/5 focus-visible:ring-ring"
      }`}
    >
      <WhatsAppIcon className="h-5 w-5" /> {isAr ? "تواصل عبر واتساب" : "WhatsApp"}
    </a>
  </div>
);

/** One large image + up to three supporting images, captions from alt text. */
export const BentoGallery = ({ items, isAr }: { items: { src: string; altAr: string; altEn: string }[]; isAr: boolean }) => {
  if (!items.length) return null;
  const [first, ...rest] = items;
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-[240px_240px]">
      <figure className="group relative overflow-hidden rounded-2xl bg-muted sm:col-span-2 lg:row-span-2">
        <img src={first.src} alt={isAr ? first.altAr : first.altEn} loading="lazy" className="aspect-[4/3] h-full w-full object-cover lg:aspect-auto" />
        <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-4 pt-10 text-sm font-bold text-white">
          {isAr ? first.altAr : first.altEn}
        </figcaption>
      </figure>
      {rest.slice(0, 3).map((g, i) => (
        <figure key={i} className={`relative overflow-hidden rounded-2xl bg-muted ${i === 2 ? "lg:col-span-2" : ""}`}>
          <img src={g.src} alt={isAr ? g.altAr : g.altEn} loading="lazy" className="aspect-[4/3] h-full w-full object-cover lg:aspect-auto" />
          <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-3 pt-8 text-xs font-bold text-white">
            {isAr ? g.altAr : g.altEn}
          </figcaption>
        </figure>
      ))}
    </div>
  );
};
