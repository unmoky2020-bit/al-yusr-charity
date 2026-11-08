import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/donationDisplay";
type Lang = "ar" | "en";

export type DonationPackageCardProps = {
  lang: Lang;
  title: string;
  description?: string | null;
  /** Amount in EGP; a package without a fixed amount shows «بالمبلغ الذي تختاره». */
  amount?: number | null;
  donateHref: string;
  detailsHref?: string;
  /** Analytics: data-source / data-label of the two links. */
  source: string;
  label: string;
  onDonate?: () => void;
  onDetails?: () => void;
};

/**
 * One donation package ("سهم"), the same everywhere: the amount first, large and calm, then what it
 * covers, then one clear action. Used by program pages; landing pages keep their own price lists.
 */
export function DonationPackageCard({
  lang, title, description, amount, donateHref, detailsHref, source, label, onDonate, onDetails,
}: DonationPackageCardProps) {
  const ar = lang === "ar";
  const Arrow = ar ? ArrowLeft : ArrowRight;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-primary/10 bg-card shadow-soft transition duration-300 hover:-translate-y-1 hover:border-secondary/60 hover:shadow-card">
      <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-secondary via-primary/60 to-secondary opacity-70 transition group-hover:opacity-100" />

      <div className="flex flex-1 flex-col gap-4 p-6">
        <div className="flex items-baseline gap-2" dir={ar ? "rtl" : "ltr"}>
          {amount ? (
            <>
              <span className="text-4xl font-black leading-none tracking-tight text-primary tabular-nums">{formatNumber(amount, lang)}</span>
              <span className="text-sm font-bold text-muted-foreground">{ar ? "ج.م" : "EGP"}</span>
            </>
          ) : (
            <span className="text-lg font-black text-primary">{ar ? "بالمبلغ الذي تختاره" : "Any amount"}</span>
          )}
        </div>

        <div className="flex-1">
          <h3 className="text-base font-extrabold leading-snug text-foreground md:text-lg">{title}</h3>
          {description && <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>}
        </div>

        <div className="flex items-center gap-3">
          <Button asChild className="h-11 flex-1 rounded-2xl bg-orange-grad text-accent-foreground shadow-cta hover:opacity-95">
            <Link to={donateHref} data-source={source} data-label={`${label}-donate`} onClick={onDonate}>
              <Heart className="h-4 w-4" aria-hidden />
              {ar ? "تبرّع بهذا السهم" : "Give this share"}
            </Link>
          </Button>
          {detailsHref && (
            <Link
              to={detailsHref}
              data-source={source}
              data-label={`${label}-details`}
              onClick={onDetails}
              className="inline-flex shrink-0 items-center gap-1 rounded-xl px-2 py-2 text-sm font-bold text-primary/80 transition hover:text-primary"
            >
              {ar ? "التفاصيل" : "Details"}
              <Arrow className="h-3.5 w-3.5" aria-hidden />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
