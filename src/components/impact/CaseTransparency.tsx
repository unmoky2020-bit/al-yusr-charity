import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, CircleDollarSign, ReceiptText, ShieldCheck, UserRoundCheck } from "lucide-react";
import { formatServerImageUrl } from "@/data/laravelApi";
import { fetchCaseFile, itemSpent, type CaseFile } from "@/data/api/impactApi";
import { CASE_RESULT, ITEM_STATUS, formatDay, egp } from "@/lib/impactLabels";
import { cn } from "@/lib/utils";
import { PhotoStrip, PhotoViewer } from "./PhotoViewer";

const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? "";

/**
 * «فلوس الحالة راحت فين؟» on a public case page: what was collected and spent, each line with its
 * receipt and handover photo, the team member who follows the case (first name only) and how it
 * ended (before / after). Nothing here is typed by hand for the page — it is the case's own file.
 */
export function CaseTransparency({ code, lang }: { code: string; lang: "ar" | "en" }) {
  const ar = lang === "ar";
  const { data: file } = useQuery({ queryKey: ["case-file-public", code], queryFn: () => fetchCaseFile(code), staleTime: 60_000, retry: 1 });
  if (!file) return null;
  const empty = !file.items.length && !file.outcome && !file.follower;

  return (
    <section aria-labelledby="money-h" className="keep-flow space-y-4">
      <h2 id="money-h" className="inline-flex items-center gap-2 text-xl font-black text-primary">
        <ShieldCheck className="h-5 w-5 text-secondary" /> {ar ? "فلوس الحالة راحت فين؟" : "Where did the money go?"}
      </h2>
      {empty ? (
        <p className="rounded-2xl border border-dashed border-border bg-muted/30 p-4 text-sm font-bold leading-7 text-muted-foreground">
          {ar ? "أول ما نبدأ الصرف، كل بند هيظهر هنا بتكلفته وصورة إيصاله وصورة التسليم." : "Once spending starts, every line appears here with its cost, receipt and handover photo."}
        </p>
      ) : (
        <>
          <Money file={file} lang={lang} />
          {file.follower?.user && (
            <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-3.5 shadow-soft">
              {file.follower.user.avatar_url ? (
                <img src={formatServerImageUrl(file.follower.user.avatar_url) || file.follower.user.avatar_url} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-secondary/40" loading="lazy" />
              ) : (
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-secondary/15 text-primary"><UserRoundCheck className="h-5 w-5" /></span>
              )}
              <div className="min-w-0">
                <p className="text-sm font-black text-primary">{ar ? `بيتابع الحالة: ${firstName(file.follower.user.name)}` : `Followed by ${firstName(file.follower.user.name)}`}</p>
                <p className="text-[11.5px] text-muted-foreground">{ar ? "من فريق اليسر — مسؤول عن الحالة لحد ما تخلص" : "Al-Yusr team — responsible until the case is closed"}{file.follower.since ? ` · ${ar ? "من" : "since"} ${formatDay(file.follower.since, lang)}` : ""}</p>
              </div>
            </div>
          )}
          {file.items.length > 0 && <Items file={file} lang={lang} />}
          {file.outcome && <Outcome file={file} lang={lang} />}
        </>
      )}
    </section>
  );
}

function Money({ file, lang }: { file: CaseFile; lang: "ar" | "en" }) {
  const ar = lang === "ar";
  const t = file.totals;
  const pct = t.collected > 0 ? Math.min(100, Math.round((t.spent / t.collected) * 100)) : 0;
  return (
    <div className="rounded-3xl border border-border/70 bg-gradient-to-br from-card to-muted/40 p-4 shadow-soft">
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { l: ar ? "اتجمع" : "Collected", v: t.collected, c: "text-primary" },
          { l: ar ? "اتصرف" : "Spent", v: t.spent, c: "text-emerald-700" },
          { l: ar ? "لسه هيتصرف" : "Still to spend", v: Math.max(0, t.balance), c: "text-foreground" },
        ].map((x) => (
          <div key={x.l} className="rounded-2xl bg-background/80 p-2.5">
            <p className="text-[11px] font-bold text-muted-foreground">{x.l}</p>
            <p className={cn("mt-0.5 text-[15px] font-black tabular-nums sm:text-lg", x.c)}>{egp(x.v, lang)}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={ar ? "نسبة المصروف" : "Share spent"}>
        <div className="h-full rounded-full bg-gradient-to-l from-emerald-500 to-secondary" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1.5 flex items-center gap-1 text-[11px] font-bold text-muted-foreground">
        <CircleDollarSign className="h-3.5 w-3.5" />
        {ar ? `اتصرف ${pct}% من اللي اتجمع · ${t.items.delivered} من ${t.items.all} بند اتسلّم` : `${pct}% of what was collected is spent · ${t.items.delivered} of ${t.items.all} lines handed over`}
      </p>
    </div>
  );
}

function Items({ file, lang }: { file: CaseFile; lang: "ar" | "en" }) {
  const ar = lang === "ar";
  return (
    <div>
      <p className="mb-2 inline-flex items-center gap-1.5 text-sm font-black text-primary"><ReceiptText className="h-4 w-4" />{ar ? "بنود الصرف" : "Spending lines"}</p>
      <ul className="space-y-2">
        {file.items.map((i) => {
          const st = ITEM_STATUS[i.status];
          const spent = itemSpent(i);
          const photos = [i.receipt_url, i.photo_url].filter(Boolean) as string[];
          return (
            <li key={i.id} className={cn("rounded-2xl border border-border/70 bg-card p-3", i.status === "cancelled" && "opacity-60")}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className={cn("min-w-0 text-sm font-extrabold", i.status === "cancelled" && "line-through")}>
                  {i.title}{i.quantity > 1 && <span className="ms-1 text-xs font-bold text-muted-foreground">×{i.quantity}</span>}
                </p>
                <span className={cn("rounded-full px-2 py-0.5 text-[10.5px] font-black", st.tone)}>{st[lang]}</span>
              </div>
              <p className="mt-1 text-[12px] text-muted-foreground">
                {spent > 0
                  ? <>{ar ? "اتدفع" : "Paid"} <b className="text-emerald-700">{egp(spent, lang)}</b></>
                  : <>{ar ? "متوقع" : "Estimated"} <b className="text-foreground">{egp(i.estimated_cost, lang)}</b></>}
                {i.delivered_on ? ` · ${ar ? "اتسلّم" : "handed over"} ${formatDay(i.delivered_on, lang)}` : i.purchased_on ? ` · ${ar ? "اتشترى" : "bought"} ${formatDay(i.purchased_on, lang)}` : ""}
              </p>
              {i.note && <p className="mt-0.5 text-[12px] text-muted-foreground">{i.note}</p>}
              {photos.length > 0 && <PhotoStrip className="mt-2" photos={photos} lang={lang} size="sm" caption={i.title} />}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Outcome({ file, lang }: { file: CaseFile; lang: "ar" | "en" }) {
  const ar = lang === "ar";
  const o = file.outcome!;
  const r = CASE_RESULT[o.result];
  const pics = [o.before_url, o.after_url].filter(Boolean) as string[];
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="rounded-3xl border border-emerald-200/70 bg-emerald-50/50 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <BadgeCheck className="h-5 w-5 text-emerald-700" />
        <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-black", r.tone)}>{r[lang]}</span>
        {o.completed_on && <span className="text-[11px] font-bold text-muted-foreground">{formatDay(o.completed_on, lang)}</span>}
      </div>
      <p className="mt-2 whitespace-pre-line text-sm leading-7 text-foreground/90">{o.summary}</p>
      {o.transfer_note && <p className="mt-2 rounded-xl bg-background/80 px-3 py-2 text-[12px] font-bold text-sky-900">{ar ? "الفلوس راحت فين: " : "Where the money went: "}{o.transfer_note}</p>}
      {pics.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {[o.before_url, o.after_url].map((u, i) => u && (
            <button key={u} type="button" onClick={() => setOpen(pics.indexOf(u))} className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted">
              <img src={formatServerImageUrl(u) || u} alt="" loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
              <span className={cn("absolute start-2 top-2 rounded-full px-2 py-0.5 text-[10.5px] font-black", i === 0 ? "bg-black/60 text-white" : "bg-[#a3e635] text-[#06301c]")}>
                {i === 0 ? (ar ? "قبل" : "Before") : ar ? "بعد" : "After"}
              </span>
            </button>
          ))}
        </div>
      )}
      <PhotoViewer photos={pics} index={open} onClose={() => setOpen(null)} lang={lang} caption={ar ? "قبل وبعد" : "Before and after"} />
    </div>
  );
}
