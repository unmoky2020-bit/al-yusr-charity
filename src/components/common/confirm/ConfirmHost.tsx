import { useEffect, useState, useSyncExternalStore } from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { AlertTriangle, Check, HelpCircle, Info, Loader2, Trash2, type LucideIcon } from "lucide-react";
import { useLang } from "@/i18n/LangContext";
import { confirmStore, type ConfirmTone, type PendingConfirm } from "./confirmStore";

const TONE: Record<ConfirmTone, { icon: LucideIcon; medal: string; halo: string; button: string; ring: string }> = {
  danger: {
    icon: Trash2,
    medal: "bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-[0_14px_30px_-12px_rgba(225,29,72,0.75)]",
    halo: "bg-rose-500/15",
    button: "bg-gradient-to-l from-rose-600 to-rose-500 text-white shadow-[0_12px_24px_-12px_rgba(225,29,72,0.9)] hover:from-rose-700 hover:to-rose-600 focus-visible:ring-rose-500",
    ring: "ring-rose-50",
  },
  warning: {
    icon: AlertTriangle,
    medal: "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-[0_14px_30px_-12px_rgba(245,130,32,0.8)]",
    halo: "bg-amber-400/20",
    button: "bg-orange-grad text-white shadow-cta hover:opacity-95 focus-visible:ring-orange-400",
    ring: "ring-amber-50",
  },
  default: {
    icon: HelpCircle,
    medal: "bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-[0_14px_30px_-12px_hsl(var(--primary)/0.7)]",
    halo: "bg-primary/10",
    button: "bg-primary text-primary-foreground shadow-[0_12px_24px_-12px_hsl(var(--primary)/0.8)] hover:opacity-95 focus-visible:ring-primary",
    ring: "ring-primary/5",
  },
};

const LABELS = {
  ar: {
    cancel: "تراجع",
    confirm: { danger: "أيوه، امسح", warning: "أيوه، كمّل", default: "تأكيد" },
    busy: { danger: "بيتمسح…", warning: "لحظة…", default: "لحظة…" },
    done: { danger: "اتمسح", warning: "تمام", default: "تمام" },
  },
  en: {
    cancel: "Go back",
    confirm: { danger: "Yes, delete", warning: "Yes, continue", default: "Confirm" },
    busy: { danger: "Deleting…", warning: "One moment…", default: "One moment…" },
    done: { danger: "Deleted", warning: "Done", default: "Done" },
  },
} as const;

const errorText = (e: unknown, ar: boolean) => {
  const m = e instanceof Error ? e.message : typeof e === "string" ? e : "";
  return m || (ar ? "ما اتنفذش، جرّب تاني" : "It didn't go through, try again");
};

/** Draws the queued confirmations (see confirmStore). Mounted once in App, above every page. */
export function ConfirmHost() {
  const queue = useSyncExternalStore(confirmStore.subscribe, confirmStore.snapshot, confirmStore.snapshot);
  useEffect(() => confirmStore.attachHost(), []);
  const current = queue[0];
  // Keep the last one on screen while it animates out.
  const [shown, setShown] = useState<PendingConfirm | undefined>(current);
  useEffect(() => {
    if (current) setShown(current);
  }, [current]);

  return (
    <AlertDialogPrimitive.Root
      open={Boolean(current)}
      onOpenChange={(open) => {
        if (!open && current) confirmStore.settle(current.id, false);
      }}
    >
      {shown && <ConfirmCard key={shown.id} item={shown} active={current?.id === shown.id} />}
    </AlertDialogPrimitive.Root>
  );
}

function ConfirmCard({ item, active }: { item: PendingConfirm; active: boolean }) {
  const { lang } = useLang();
  const ar = lang === "ar";
  const L = LABELS[ar ? "ar" : "en"];
  const { opts } = item;
  const tone = opts.tone ?? "default";
  const T = TONE[tone];
  const Icon = opts.icon ?? T.icon;
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (!active || busy || done) return;
    if (!opts.onConfirm) {
      confirmStore.settle(item.id, true);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await opts.onConfirm();
      setDone(true);
      setBusy(false);
      window.setTimeout(() => confirmStore.settle(item.id, true), 650);
    } catch (e) {
      setBusy(false);
      setError(errorText(e, ar));
    }
  };

  const confirmLabel = busy ? L.busy[tone] : done ? L.done[tone] : opts.confirmLabel ?? L.confirm[tone];

  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Overlay className="fixed inset-0 z-[300] bg-[#03140b]/60 backdrop-blur-[3px] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
      <div className="pointer-events-none fixed inset-0 z-[301] flex items-end justify-center sm:items-center sm:p-6">
        <AlertDialogPrimitive.Content
          dir={ar ? "rtl" : "ltr"}
          onEscapeKeyDown={(e) => { if (busy) e.preventDefault(); }}
          className="pointer-events-auto relative w-full max-w-[440px] overflow-hidden rounded-t-[30px] bg-card px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 text-center shadow-[0_-24px_60px_-24px_rgba(0,0,0,0.45)] outline-none duration-300 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-bottom-8 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-10 sm:rounded-[30px] sm:px-7 sm:pb-7 sm:pt-6 sm:shadow-[0_40px_80px_-30px_rgba(0,0,0,0.5)] sm:data-[state=closed]:zoom-out-95 sm:data-[state=closed]:slide-out-to-bottom-0 sm:data-[state=open]:zoom-in-95 sm:data-[state=open]:slide-in-from-bottom-0"
        >
          {/* soft colour wash behind the art */}
          <div aria-hidden className={`pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b ${tone === "danger" ? "from-rose-50" : tone === "warning" ? "from-amber-50" : "from-primary/5"} to-transparent`} />
          <div aria-hidden className="relative mx-auto mb-1 h-1.5 w-11 rounded-full bg-muted-foreground/20 sm:hidden" />

          {opts.image ? (
            <div className="relative mx-auto grid h-[150px] w-full place-items-center">
              <span aria-hidden className={`absolute h-28 w-28 rounded-full ${T.halo} motion-safe:animate-[confirm-pulse_2.4s_ease-out_infinite]`} />
              <span aria-hidden className={`absolute h-28 w-28 rounded-full ${T.halo} motion-safe:animate-[confirm-pulse_2.4s_ease-out_1.2s_infinite]`} />
              <div
                className={`relative rounded-[18px] bg-white p-1.5 shadow-[0_22px_40px_-20px_rgba(0,0,0,0.55)] ring-1 ring-black/5 transition-all duration-500 ease-in motion-safe:animate-[confirm-tilt_.7s_ease-out] ${
                  done ? "translate-y-6 rotate-[-14deg] scale-50 opacity-0" : "-rotate-3"
                }`}
              >
                <img src={opts.image} alt="" className="h-[104px] w-[140px] rounded-[13px] object-cover" />
              </div>
              <span className={`absolute bottom-3 start-[calc(50%+46px)] grid h-11 w-11 place-items-center rounded-full ring-4 ring-card transition-transform duration-300 ${done ? "scale-110 bg-emerald-500 text-white" : T.medal}`}>
                {done ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
              </span>
            </div>
          ) : (
            <div className="relative mx-auto mt-2 grid h-24 w-24 place-items-center">
              <span aria-hidden className={`absolute inset-1 rounded-full ${T.halo} motion-safe:animate-[confirm-pulse_2.4s_ease-out_infinite]`} />
              <span className={`relative grid h-16 w-16 place-items-center rounded-full ring-8 transition-colors duration-300 ${T.ring} ${done ? "bg-emerald-500 text-white" : T.medal}`}>
                {done ? <Check className="h-7 w-7" /> : <Icon className="h-7 w-7 motion-safe:animate-[confirm-wiggle_.7s_ease-out]" />}
              </span>
            </div>
          )}

          <AlertDialogPrimitive.Title className="relative mt-3 text-lg font-black leading-snug text-foreground sm:text-xl">
            {opts.title}
          </AlertDialogPrimitive.Title>
          {opts.subject && (
            <div className="relative mt-2 flex justify-center">
              <span className="max-w-full truncate rounded-full bg-muted px-3 py-1 text-xs font-extrabold text-foreground/80">«{opts.subject}»</span>
            </div>
          )}
          <AlertDialogPrimitive.Description asChild>
            <div className={opts.description ? "relative mx-auto mt-2 max-w-[34ch] text-sm leading-relaxed text-muted-foreground" : "sr-only"}>
              {opts.description ?? opts.title}
            </div>
          </AlertDialogPrimitive.Description>
          {opts.note && (
            <p className="relative mt-3 inline-flex items-center justify-center gap-1.5 rounded-full bg-muted/60 px-3 py-1 text-[11px] font-bold text-muted-foreground">
              <Info className="h-3.5 w-3.5 shrink-0" /> {opts.note}
            </p>
          )}
          {error && (
            <div role="alert" className="relative mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold leading-relaxed text-rose-700">
              {error}
            </div>
          )}

          <div className="relative mt-5 grid grid-cols-2 gap-2.5">
            <AlertDialogPrimitive.Cancel
              disabled={busy || done}
              className="h-12 rounded-2xl border border-border bg-background text-sm font-extrabold text-foreground/75 transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
            >
              {opts.cancelLabel ?? L.cancel}
            </AlertDialogPrimitive.Cancel>
            <AlertDialogPrimitive.Action
              disabled={busy || done}
              onClick={(e) => {
                e.preventDefault();
                void run();
              }}
              className={`inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-3 text-sm font-black transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-default ${
                done ? "bg-emerald-500 text-white" : T.button
              }`}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              <span className="truncate">{confirmLabel}</span>
            </AlertDialogPrimitive.Action>
          </div>
        </AlertDialogPrimitive.Content>
      </div>
    </AlertDialogPrimitive.Portal>
  );
}
