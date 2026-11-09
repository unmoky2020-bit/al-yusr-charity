import { CheckCircle2, ClipboardCheck, HandHeart, Hourglass, PackageOpen, Truck } from "lucide-react";
import { JOURNEY, JOURNEY_LABEL, journeyDates, journeyIndex, type DeliveryInfo, type JourneyStep } from "@/lib/deliveryJourney";
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

/**
 * The five steps of a donation (registered → paid → family identified → prepared → delivered):
 * a vertical list on phones, one row on wider screens. Reached steps are filled, the next one pulses.
 */
export function DeliveryJourney({ status, delivery, createdAt, lang, className }: Props) {
  const reached = journeyIndex(status, delivery);
  const dates = journeyDates(createdAt, delivery);
  const failed = ["failed", "refunded"].includes(String(status || "").toLowerCase());
  const fmt = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB", { day: "numeric", month: "short" }) : "";
  const lastNote = delivery?.history.length ? delivery.history[delivery.history.length - 1].note : undefined;

  return (
    <div className={className}>
      <ol className="relative grid gap-3 sm:grid-cols-5 sm:gap-2" aria-label={lang === "ar" ? "مراحل التبرع" : "Donation steps"}>
        {JOURNEY.map((step, i) => {
          const Icon = ICON[step];
          const done = !failed && i <= reached;
          const next = !failed && i === reached + 1;
          const label = JOURNEY_LABEL[step];
          return (
            <li key={step} className="relative flex items-center gap-3 sm:flex-col sm:gap-1.5 sm:text-center" aria-current={i === reached ? "step" : undefined}>
              {/* connector to the next step */}
              {i < JOURNEY.length - 1 && (
                <span
                  aria-hidden
                  className={cn(
                    "absolute start-[17px] top-9 h-[calc(100%-12px)] w-0.5 sm:start-[calc(50%+18px)] sm:top-[17px] sm:h-0.5 sm:w-[calc(100%-36px)]",
                    !failed && i < reached ? "bg-secondary" : "bg-border",
                  )}
                />
              )}
              <span
                className={cn(
                  "relative z-[1] grid h-9 w-9 shrink-0 place-items-center rounded-full ring-2 transition",
                  done ? "bg-secondary text-secondary-foreground ring-secondary" : next ? "bg-accent/15 text-accent ring-accent/40 motion-safe:animate-pulse" : "bg-muted text-muted-foreground ring-border",
                )}
              >
                {step === "delivered" && done ? <HandHeart className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </span>
              <span className="min-w-0">
                <span className={cn("block text-[12px] font-extrabold leading-tight sm:text-[11px]", done || next ? "text-primary" : "text-muted-foreground")}>
                  {label[lang]}
                </span>
                <span className="block text-[10.5px] text-muted-foreground">
                  {done && dates[step] ? fmt(dates[step]) : lang === "ar" ? label.hintAr : label.hintEn}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
      {failed && (
        <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
          {lang === "ar" ? "الدفع ما اكتملش. تقدر تعيد التبرع أو تكلمنا على واتساب." : "The payment did not complete. You can donate again or message us."}
        </p>
      )}
      {lastNote && !failed && (
        <p className="mt-3 rounded-xl bg-secondary/10 px-3 py-2 text-xs font-semibold text-primary">{lastNote}</p>
      )}
    </div>
  );
}
