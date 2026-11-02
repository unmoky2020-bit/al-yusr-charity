import { Link } from "react-router-dom";
import { AlertCircle, HeartHandshake, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CaseRow } from "@/data/casesApi";
import { formatNumberEN } from "@/lib/utils";

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
  const need = Number(c.needed_amount) || 0;
  const raised = Number(c.raised_amount) || 0;
  const pct = need > 0 ? Math.min(100, Math.round((raised / need) * 100)) : 0;
  const remaining = Math.max(0, need - raised);
  const done = need > 0 && remaining === 0;
  const owner = showOwner ? caseOwnerLabel(c, isRTL) : null;
  const place = [c.city, c.governorate].filter(Boolean).join("، ");
  const egp = isRTL ? "ج" : "EGP";
  return (
    <article className={`group relative flex flex-col overflow-hidden rounded-[1.6rem] border border-primary/10 bg-card shadow-soft transition duration-300 hover:-translate-y-1 hover:border-secondary/50 hover:shadow-card ${className}`}>
      <Link to={`/cases/${c.ref_code}`} className="relative block aspect-[4/3] overflow-hidden bg-muted" tabIndex={-1} aria-hidden>
        <img src={c.cover_image_url || "/images/cases/case-medical.jpg"} alt="" loading="lazy" decoding="async"
          className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#06301c]/85 via-[#06301c]/10 to-transparent" />
        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          {c.is_urgent ? (
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
        {place && (
          <div className="mt-1.5 flex items-center gap-1 text-[11px] font-bold text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-secondary" /> <span className="truncate">{place}</span>
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
          <Button asChild className="mt-3.5 h-11 w-full gap-1.5 rounded-xl bg-orange-grad font-black text-accent-foreground shadow-cta hover:opacity-95" disabled={done}>
            <Link to={`/donate?case=${encodeURIComponent(c.ref_code)}`}>
              <HeartHandshake className="h-4 w-4" /> {isRTL ? "تبرع للحالة" : "Donate to this case"}
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
