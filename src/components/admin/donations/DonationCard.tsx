import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { AdminDonation } from "@/data/api/donationsAdminApi";
import {
  donationMethodLabel, donationStatusLabel, donationStatusTone, donationTargetLabel, formatDateTime, formatMoney,
} from "@/lib/donationDisplay";

/**
 * One donation as a compact card for phones (the tables stay for wider screens): donor and status on
 * the first line, method · date and what it was for under it, the amount and reference on the side.
 * Without `actions` the whole card opens the donation.
 */
export function DonationCard({ d, lang, actions }: { d: AdminDonation; lang: "ar" | "en"; actions?: ReactNode }) {
  const ar = lang === "ar";
  const donor = d.donor?.name || (ar ? "فاعل خير" : "Anonymous");
  const target = donationTargetLabel(d, lang);
  const Chevron = ar ? ChevronLeft : ChevronRight;

  const body = (
    <div className="flex items-start gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-[14px] font-extrabold text-foreground">{donor}</span>
          <span className={`shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-black ${donationStatusTone(d.status, d.is_gateway)}`}>
            {donationStatusLabel(d.status, d.is_gateway, lang)}
          </span>
        </div>
        <p className="mt-0.5 truncate text-[11.5px] font-semibold text-muted-foreground">
          {donationMethodLabel(d, lang)} · {formatDateTime(d.created_at, lang)}
        </p>
        {target && <p className="mt-0.5 truncate text-[11.5px] font-bold text-primary/80">{target}</p>}
      </div>
      <div className="shrink-0 text-end">
        <div className="text-[15px] font-black tabular-nums text-emerald-700 dark:text-emerald-400">{formatMoney(Number(d.amount), lang)}</div>
        <div className="mt-0.5 font-mono text-[10px] text-muted-foreground" dir="ltr">{d.transaction_reference}</div>
      </div>
      {!actions && <Chevron className="mt-1 h-4 w-4 shrink-0 self-center text-muted-foreground/60" aria-hidden />}
    </div>
  );

  if (!actions) {
    return (
      <Link to={`/admin/donations/${d.id}`} className="block rounded-2xl border border-border/70 bg-card p-3 shadow-xs transition active:scale-[0.99] hover:border-primary/30">
        {body}
      </Link>
    );
  }
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-3 shadow-xs">
      {body}
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-border/60 pt-2.5">{actions}</div>
    </div>
  );
}

/** Loading / empty / error placeholders for a list of DonationCards. */
export function DonationCardsState({ loading, error, empty, lang }: { loading?: boolean; error?: boolean; empty?: boolean; lang: "ar" | "en" }) {
  const ar = lang === "ar";
  if (loading) {
    return (
      <div className="space-y-2" aria-busy="true">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-[74px] animate-pulse rounded-2xl bg-muted" />)}
      </div>
    );
  }
  if (error) return <p className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-center text-xs font-bold text-destructive">{ar ? "تعذر تحميل التبرعات" : "Could not load donations"}</p>;
  if (empty) return <p className="rounded-2xl border border-dashed border-border p-4 text-center text-xs font-bold text-muted-foreground">{ar ? "مفيش تبرعات هنا" : "No donations here"}</p>;
  return null;
}
