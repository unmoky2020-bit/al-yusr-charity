import { useState } from "react";
import { CheckCircle2, ChevronDown, ClipboardCheck, HandHeart, Hourglass, MapPin, PackageOpen, PauseCircle, Truck } from "lucide-react";
import { PhotoStrip } from "@/components/impact/PhotoViewer";
import {
  JOURNEY, JOURNEY_LABEL, journeyDates, journeyIndex, type DeliveryInfo, type DeliveryLine, type JourneyStep,
} from "@/lib/deliveryJourney";
import { cn } from "@/lib/utils";

const ICON: Record<JourneyStep, typeof CheckCircle2> = {
  registered: Hourglass,
  paid: CheckCircle2,
  family_identified: ClipboardCheck,
  preparing: PackageOpen,
  delivered: Truck,
};

type Props = {
  status: string | null | undefined;
  delivery: DeliveryInfo | null;
  createdAt?: string;
  lang: "ar" | "en";
  className?: string;
};

const lineLabel = (l: DeliveryLine, lang: "ar" | "en") =>
  l.stage === "on_hold" ? (lang === "ar" ? "اتأجل مؤقتاً" : "Paused") : JOURNEY_LABEL[l.stage][lang];

/**
 * The five steps of a donation (registered → paid → family identified → prepared → delivered):
 * a vertical list on phones, one row on wider screens. Under it, the trail the team recorded —
 * each line with its date, note, distribution day and photos (faces blurred) — newest first.
 */
export function DeliveryJourney({ status, delivery, createdAt, lang, className }: Props) {
  const ar = lang === "ar";
  const s = String(status || "").toLowerCase();
  const reached = journeyIndex(status, delivery);
  const dates = journeyDates(createdAt, delivery);
  const failed = s === "failed" || s === "cancelled";
  const refunded = s === "refunded";
  const stopped = failed || refunded;
  const fmt = (iso?: string, withYear = false) =>
    iso ? new Date(iso).toLocaleDateString(ar ? "ar-EG" : "en-GB", { day: "numeric", month: "short", ...(withYear ? { year: "numeric" } : {}) }) : "";
  const lines = [...(delivery?.history ?? [])].reverse();
  const [all, setAll] = useState(false);
  const shown = all ? lines : lines.slice(0, 1);
  const hold = !stopped && delivery?.hold ? delivery.hold : null;

  return (
    <div className={cn("keep-flow", className)}>
      <ol className="relative grid gap-3 sm:grid-cols-5 sm:gap-2" aria-label={ar ? "مراحل التبرع" : "Donation steps"}>
        {JOURNEY.map((step, i) => {
          const Icon = ICON[step];
          const done = !stopped && i <= reached;
          const next = !stopped && !hold && i === reached + 1;
          const paused = !!hold && i === reached + 1;
          const label = JOURNEY_LABEL[step];
          return (
            <li key={step} className="relative flex items-center gap-3 sm:flex-col sm:gap-1.5 sm:text-center" aria-current={i === reached ? "step" : undefined}>
              {/* connector to the next step */}
              {i < JOURNEY.length - 1 && (
                <span
                  aria-hidden
                  className={cn(
                    "absolute start-[17px] top-9 h-[calc(100%-12px)] w-0.5 sm:start-[calc(50%+18px)] sm:top-[17px] sm:h-0.5 sm:w-[calc(100%-36px)]",
                    !stopped && i < reached ? "bg-secondary" : "bg-border",
                  )}
                />
              )}
              <span
                className={cn(
                  "relative z-[1] grid h-9 w-9 shrink-0 place-items-center rounded-full ring-2 transition",
                  done ? "bg-secondary text-secondary-foreground ring-secondary"
                    : paused ? "bg-amber-100 text-amber-700 ring-amber-300"
                    : next ? "bg-accent/15 text-accent ring-accent/40 motion-safe:animate-pulse"
                    : "bg-muted text-muted-foreground ring-border",
                )}
              >
                {paused ? <PauseCircle className="h-4 w-4" /> : step === "delivered" && done ? <HandHeart className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </span>
              <span className="min-w-0">
                <span className={cn("block text-[12px] font-extrabold leading-tight sm:text-[11px]", done || next ? "text-primary" : paused ? "text-amber-800" : "text-muted-foreground")}>
                  {label[lang]}
                </span>
                <span className="block text-[10.5px] text-muted-foreground">
                  {done && dates[step] ? fmt(dates[step]) : paused ? (ar ? "متأجل مؤقتاً" : "Paused") : ar ? label.hintAr : label.hintEn}
                </span>
              </span>
            </li>
          );
        })}
      </ol>

      {failed && (
        <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
          {ar ? "الدفع ما اكتملش. تقدر تعيد التبرع أو تكلمنا على واتساب." : "The payment did not complete. You can donate again or message us."}
        </p>
      )}
      {refunded && (
        <p className="mt-3 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">
          {ar ? "المبلغ ده اترد لصاحبه، ومش هيتسلّم لأسرة." : "This amount was refunded and will not be delivered."}
        </p>
      )}

      {hold && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-amber-900">
          <PauseCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <div className="min-w-0 text-xs">
            <p className="font-black">{ar ? "التسليم متأجل مؤقتاً" : "Delivery is paused for now"}{hold.at ? ` · ${fmt(hold.at)}` : ""}</p>
            {hold.note && <p className="mt-0.5 font-semibold leading-relaxed">{hold.note}</p>}
            <p className="mt-0.5 text-[10.5px] text-amber-800/80">{ar ? "تبرعك محفوظ، وهيوصلك إشعار أول ما نكمّل." : "Your donation is safe; you'll be notified when we continue."}</p>
          </div>
        </div>
      )}

      {!stopped && lines.length > 0 && (
        <div className="mt-3 rounded-xl border border-border/70 bg-muted/30 p-3">
          <p className="mb-2 text-[11px] font-black text-primary">{ar ? "سجل التسليم" : "Delivery log"}</p>
          <ol className="space-y-3">
            {shown.map((l, i) => (
              <li key={`${l.at}-${i}`} className="relative ps-4">
                <span aria-hidden className={cn("absolute start-0 top-1.5 h-2 w-2 rounded-full", l.stage === "on_hold" ? "bg-amber-500" : "bg-secondary")} />
                <p className="text-xs font-extrabold text-foreground">
                  {lineLabel(l, lang)}
                  {l.at && <span className="ms-1.5 text-[10.5px] font-semibold text-muted-foreground">{fmt(l.at, true)}</span>}
                </p>
                {l.distribution && (
                  <p className="mt-0.5 flex flex-wrap items-center gap-1 text-[11px] font-bold text-primary/80">
                    {ar ? "ضمن" : "Part of"} «{l.distribution.title || (ar ? "يوم توزيع" : "a distribution day")}»
                    {l.distribution.place && <span className="inline-flex items-center gap-0.5 text-muted-foreground"><MapPin className="h-3 w-3" />{l.distribution.place}</span>}
                  </p>
                )}
                {l.note && <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted-foreground">{l.note}</p>}
                {l.photos && l.photos.length > 0 && <PhotoStrip className="mt-1.5" photos={l.photos} lang={lang} size="sm" caption={lineLabel(l, lang)} />}
              </li>
            ))}
          </ol>
          {lines.length > 1 && (
            <button type="button" onClick={() => setAll((v) => !v)} className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline" aria-expanded={all}>
              {all ? (ar ? "اعرض آخر خطوة بس" : "Show the latest only") : ar ? `اعرض السجل كله (${lines.length})` : `Show the full log (${lines.length})`}
              <ChevronDown className={cn("h-3.5 w-3.5 transition", all && "rotate-180")} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
