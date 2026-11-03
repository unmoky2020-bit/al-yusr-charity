import { Link } from "react-router-dom";
import { AlertCircle, CheckCircle2, Clock, HeartHandshake, MapPin } from "lucide-react";
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

/**
 * The one case card used everywhere (homepage, cases page, programs, projects, campaigns):
 * the photo fills the card; a dark gradient at the bottom carries the name, the funding line and
 * a donate button. The whole card opens the case; the donate button sits above that link.
 */
export function CasePosterCard({ c, isRTL, showOwner = false, className = "" }: { c: CaseRow; isRTL: boolean; showOwner?: boolean; className?: string }) {
  const { need, pct, remaining, done } = caseFunding(c);
  const owner = showOwner ? caseOwnerLabel(c, isRTL) : null;
  const days = daysLeft(c.deadline);
  const egp = isRTL ? "ج" : "EGP";
  const tag = owner || c.category_name_ar;
  return (
    <article className={`group relative isolate aspect-[4/5] overflow-hidden rounded-[1.6rem] bg-[#06301c] shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-card ${className}`}>
      <img src={c.cover_image_url || "/images/cases/case-placeholder.svg"} alt="" loading="lazy" decoding="async"
        className="absolute inset-0 -z-10 h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-black/95 via-black/45 to-transparent" />
      <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-28 bg-gradient-to-b from-black/45 to-transparent" />

      <Link to={`/cases/${c.ref_code}`} className="absolute inset-0 z-0 rounded-[1.6rem] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-secondary/70" aria-label={c.title} />

      <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-2">
        {done ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#a3e635] px-2.5 py-1 text-[11px] font-black text-[#06301c] shadow">
            <CheckCircle2 className="h-3 w-3" /> {isRTL ? "اكتملت" : "Funded"}
          </span>
        ) : c.is_urgent ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-destructive px-2.5 py-1 text-[11px] font-black text-destructive-foreground shadow">
            <AlertCircle className="h-3 w-3" /> {isRTL ? "عاجلة" : "Urgent"}
          </span>
        ) : <span />}
        {tag && <span className="min-w-0 max-w-[65%] truncate rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-black text-primary">{tag}</span>}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4 text-white">
        {days !== null && days >= 0 && !done && (
          <span className={`mb-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-black ${days <= 7 ? "bg-destructive/90" : "bg-white/15"}`}>
            <Clock className="h-3 w-3" /> {days === 0 ? (isRTL ? "آخر يوم" : "Last day") : isRTL ? `باقي ${days} يوم` : `${days} days left`}
          </span>
        )}
        <h3 className="line-clamp-2 text-[16px] font-black leading-snug drop-shadow sm:text-[17px]">{c.title}</h3>
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/25" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={isRTL ? "نسبة التمويل" : "Funded"}>
          <div className="h-full rounded-full bg-[#a3e635]" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-2">
          <span className="min-w-0 text-[12px] font-bold leading-tight text-white/85">
            {done ? (isRTL ? "اكتمل التمويل — شوف التوثيق" : "Funded — see the proof") : (
              <>
                <b className="text-[13px] font-black text-white">{pct}%</b>
                <span className="mx-1 opacity-50">·</span>
                {isRTL ? `متبقي ${formatNumberEN(remaining)} من ${formatNumberEN(need)} ${egp}` : `${formatNumberEN(remaining)} of ${formatNumberEN(need)} ${egp} left`}
              </>
            )}
          </span>
          {!done && (
            <Link
              to={`/donate?case=${encodeURIComponent(c.ref_code)}`}
              data-source="case-card" data-label={`case-${c.ref_code}`}
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

/** Kept for existing imports: same card as the homepage. */
export const CaseCard = CasePosterCard;
