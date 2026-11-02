import { Link } from "react-router-dom";
import { AlertCircle, CheckCircle2, Clock, HeartHandshake, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CaseRow } from "@/data/casesApi";
import { formatNumberEN } from "@/lib/utils";
import { caseFunding, daysLeft } from "@/lib/caseFunding";

/** «برنامج كفالة يتيم» — without doubling a kind word the name already starts with («حملة ستر»). */
const withKind = (kind: string, name: string) => (name.startsWith(kind) ? name : `${kind} ${name}`);

/** What a case belongs to, as a short label: «برنامج كفالة يتيم» / «مشروع …» / «حملة …». */
export function caseOwnerLabel(c: CaseRow, isRTL: boolean): string | null {
  if (c.program_name) return isRTL ? withKind("برنامج", c.program_name) : `Program: ${c.program_name}`;
  if (c.project_name) return isRTL ? withKind("مشروع", c.project_name) : `Project: ${c.project_name}`;
  if (c.donation_campaign_name) return isRTL ? withKind("حملة", c.donation_campaign_name) : `Campaign: ${c.donation_campaign_name}`;
  return null;
}

/** One case card (homepage urgent carousel, programs page, linked-cases sections). */
export function CaseCard({ c, isRTL, showOwner = false, className = "" }: { c: CaseRow; isRTL: boolean; showOwner?: boolean; className?: string }) {
  const { need, raised, pct, remaining, done } = caseFunding(c);
  const owner = showOwner ? caseOwnerLabel(c, isRTL) : null;
  const place = [c.city, c.governorate].filter(Boolean).join("، ");
  const days = daysLeft(c.deadline);
  const egp = isRTL ? "ج" : "EGP";
  return (
    <article className={`group relative flex flex-col overflow-hidden rounded-[1.6rem] border border-primary/10 bg-card shadow-soft transition duration-300 hover:-translate-y-1 hover:border-secondary/50 hover:shadow-card ${className}`}>
      <Link to={`/cases/${c.ref_code}`} className="relative block aspect-[4/3] overflow-hidden bg-muted" tabIndex={-1} aria-hidden>
        <img src={c.cover_image_url || "/images/cases/case-medical.jpg"} alt="" loading="lazy" decoding="async"
          className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#06301c]/85 via-[#06301c]/10 to-transparent" />
        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          {done ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11px] font-black text-primary-foreground shadow">
              <CheckCircle2 className="h-3 w-3" /> {isRTL ? "اكتملت" : "Funded"}
            </span>
          ) : c.is_urgent ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-destructive px-2.5 py-1 text-[11px] font-black text-destructive-foreground shadow">
              <AlertCircle className="h-3 w-3" /> {isRTL ? "عاجلة" : "Urgent"}
            </span>
          ) : <span />}
          {c.category_name_ar && (
            <span className="rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-black text-primary shadow-sm">{c.category_name_ar}</span>
          )}
        </div>
        {/* Funding ring: the one number a donor scans for */}
        <div className="absolute bottom-3 start-3 flex items-center gap-2 text-white">
          <span
            className="grid h-12 w-12 place-items-center rounded-full text-[12px] font-black"
            style={{ background: `conic-gradient(#a3e635 ${pct * 3.6}deg, rgba(255,255,255,.25) 0)` }}
          >
            <span className="grid h-[38px] w-[38px] place-items-center rounded-full bg-[#06301c]">{pct}%</span>
          </span>
          <span className="text-[12px] font-bold leading-tight drop-shadow">
            {done ? (isRTL ? "اكتمل التمويل" : "Fully funded") : (
              <>{isRTL ? "متبقي" : "Left"}<br /><b className="text-[15px] font-black">{formatNumberEN(remaining)} {egp}</b></>
            )}
          </span>
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-4 pt-3.5">
        {owner && <span className="mb-1.5 w-fit max-w-full truncate rounded-md bg-secondary/15 px-2 py-0.5 text-[11px] font-black text-primary">{owner}</span>}
        <Link to={`/cases/${c.ref_code}`} className="line-clamp-2 text-[15.5px] font-black leading-snug text-primary hover:text-accent focus-visible:underline">{c.title}</Link>
        {(place || (days !== null && days >= 0 && !done)) && (
          <div className="mt-1.5 flex items-center gap-3 text-[11px] font-bold text-muted-foreground">
            {place && <span className="inline-flex min-w-0 items-center gap-1"><MapPin className="h-3.5 w-3.5 shrink-0 text-secondary" /> <span className="truncate">{place}</span></span>}
            {days !== null && days >= 0 && !done && (
              <span className={`inline-flex shrink-0 items-center gap-1 ${days <= 7 ? "text-destructive" : ""}`}>
                <Clock className="h-3.5 w-3.5" /> {days === 0 ? (isRTL ? "آخر يوم" : "Last day") : isRTL ? `باقي ${days} يوم` : `${days} days left`}
              </span>
            )}
          </div>
        )}
        <div className="mt-auto pt-4">
          <div className="h-1.5 overflow-hidden rounded-full bg-primary/10" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}
            aria-label={isRTL ? "نسبة التمويل" : "Funded"}>
            <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[11px] font-bold text-muted-foreground">
            <span>{isRTL ? "اتجمع" : "Raised"} {formatNumberEN(raised)} {egp}</span>
            <span>{isRTL ? "من" : "of"} {formatNumberEN(need)} {egp}</span>
          </div>
          {done ? (
            <Link to={`/cases/${c.ref_code}`} className="mt-3.5 flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-primary/10 text-sm font-black text-primary transition hover:bg-primary/15">
              <CheckCircle2 className="h-4 w-4" /> {isRTL ? "اكتملت بفضل الله — شوف التوثيق" : "Funded — see the proof"}
            </Link>
          ) : (
            <Button asChild className="mt-3.5 h-11 w-full gap-1.5 rounded-xl bg-orange-grad font-black text-accent-foreground shadow-cta hover:opacity-95">
              <Link to={`/donate?case=${encodeURIComponent(c.ref_code)}`} data-source="case-card" data-label={`case-${c.ref_code}`}>
                <HeartHandshake className="h-4 w-4" /> {isRTL ? "تبرع للحالة" : "Donate to this case"}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

/**
 * Poster card for carousels: the photo fills the card, a dark gradient at the bottom carries the
 * case name and one funding line, and a small donate button. Nothing else.
 */
export function CasePosterCard({ c, isRTL, showOwner = false, className = "" }: { c: CaseRow; isRTL: boolean; showOwner?: boolean; className?: string }) {
  const { need, raised, pct, remaining, done } = caseFunding(c);
  const owner = showOwner ? caseOwnerLabel(c, isRTL) : null;
  const egp = isRTL ? "ج" : "EGP";
  return (
    <article className={`group relative isolate aspect-[4/5] overflow-hidden rounded-[1.6rem] bg-[#06301c] shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-card ${className}`}>
      <img src={c.cover_image_url || "/images/cases/case-medical.jpg"} alt="" loading="lazy" decoding="async"
        className="absolute inset-0 -z-10 h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />
      <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-24 bg-gradient-to-b from-black/35 to-transparent" />

      {/* whole card opens the case; the donate button sits above this layer */}
      <Link to={`/cases/${c.ref_code}`} className="absolute inset-0 z-0 rounded-[1.6rem] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-secondary/70" aria-label={c.title} />

      <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-2">
        {c.is_urgent ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-destructive px-2.5 py-1 text-[11px] font-black text-destructive-foreground shadow">
            <AlertCircle className="h-3 w-3" /> {isRTL ? "عاجلة" : "Urgent"}
          </span>
        ) : <span />}
        {(owner || c.category_name_ar) && (
          <span className="max-w-[60%] truncate rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-black text-primary">{owner || c.category_name_ar}</span>
        )}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4 text-white">
        <h3 className="line-clamp-2 text-[17px] font-black leading-snug drop-shadow">{c.title}</h3>
        <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-white/25" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={isRTL ? "نسبة التمويل" : "Funded"}>
          <div className="h-full rounded-full bg-[#a3e635]" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-2.5 flex items-center justify-between gap-2">
          <span className="text-[12px] font-bold text-white/85">
            {done ? (isRTL ? "اكتمل التمويل" : "Fully funded") : (isRTL ? `متبقي ${formatNumberEN(remaining)} ${egp} من ${formatNumberEN(need)}` : `${formatNumberEN(remaining)} of ${formatNumberEN(need)} ${egp} left`)}
          </span>
          {!done && (
            <Link
              to={`/donate?case=${encodeURIComponent(c.ref_code)}`}
              className="pointer-events-auto relative z-10 inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-orange-grad px-3.5 text-xs font-black text-accent-foreground shadow-cta transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <HeartHandshake className="h-3.5 w-3.5" /> {isRTL ? "تبرع" : "Donate"}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
