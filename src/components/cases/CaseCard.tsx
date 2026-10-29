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

/** One case card (homepage urgent carousel, linked-cases sections). */
export function CaseCard({ c, isRTL, showOwner = false, className = "" }: { c: CaseRow; isRTL: boolean; showOwner?: boolean; className?: string }) {
  const need = Number(c.needed_amount) || 0;
  const raised = Number(c.raised_amount) || 0;
  const pct = need > 0 ? Math.min(100, Math.round((raised / need) * 100)) : 0;
  const remaining = Math.max(0, need - raised);
  const owner = showOwner ? caseOwnerLabel(c, isRTL) : null;
  return (
    <article className={`group flex flex-col overflow-hidden rounded-3xl border border-border/80 bg-card shadow-soft transition hover:-translate-y-1 hover:shadow-card ${className}`}>
      <Link to={`/cases/${c.ref_code}`} className="relative block aspect-[16/10] overflow-hidden bg-muted">
        <img src={c.cover_image_url || "/images/cases/case-medical.jpg"} alt={c.title} loading="lazy"
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
        {c.is_urgent && (
          <span className="absolute start-3 top-3 inline-flex items-center gap-1 rounded-full bg-destructive px-2.5 py-1 text-[11px] font-black text-destructive-foreground shadow">
            <AlertCircle className="h-3 w-3" /> {isRTL ? "عاجلة" : "Urgent"}
          </span>
        )}
        {c.category_name_ar && (
          <span className="absolute bottom-3 start-3 rounded-full bg-white/95 px-2.5 py-0.5 text-[11px] font-black text-primary">{c.category_name_ar}</span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-4">
        {owner && <span className="mb-1 truncate text-[11px] font-black text-secondary-foreground/80">{owner}</span>}
        <div className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 text-secondary" />
          {[c.city, c.governorate].filter(Boolean).join("، ")}
        </div>
        <Link to={`/cases/${c.ref_code}`} className="mt-1.5 line-clamp-2 text-base font-black leading-snug text-primary hover:underline">{c.title}</Link>
        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className="text-muted-foreground">{isRTL ? "تم جمع" : "Raised"} {pct}%</span>
            <span className="text-primary">{isRTL ? "متبقي" : "Left"} {formatNumberEN(remaining)} {isRTL ? "ج" : "EGP"}</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary" style={{ width: `${pct}%` }} />
          </div>
          <Button asChild className="mt-4 w-full gap-1.5 rounded-xl font-black">
            <Link to={`/donate?case=${encodeURIComponent(c.ref_code)}`}>
              <HeartHandshake className="h-4 w-4" /> {isRTL ? "تبرع للحالة" : "Donate"}
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
