import { useEffect, useRef } from "react";
import { Undo2, X } from "lucide-react";

/**
 * Full-screen sebha: the whole screen is one big bead, so the visitor can count without looking
 * (after prayer, on the way to work). Keeps the screen awake while open where the browser allows it.
 */
export function FocusMode({
  isAr, text, next, shown, target, rounds, progress, done, today, onTap, onUndo, canUndo, onClose,
}: {
  isAr: boolean;
  text: string;
  next?: string | null;
  /** the number in the middle */
  shown: string;
  /** «من ١٠٠» or «عدّ مفتوح» */
  target: string;
  rounds: string | null;
  /** 0..1 within the current round */
  progress: number;
  done: boolean;
  today: string;
  onTap: () => void;
  onUndo: () => void;
  canUndo: boolean;
  onClose: () => void;
}) {
  // Same tap rules as the ring: count on the finger lifting, ignore a finger that moved.
  const start = useRef<{ x: number; y: number } | null>(null);
  const countedAt = useRef(0);
  // The handlers change on every tap; the effect below runs once and reads the latest ones.
  const handlers = useRef({ onTap, onUndo, onClose });
  handlers.current = { onTap, onUndo, onClose };

  useEffect(() => {
    const h = handlers;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    let lock: { release: () => Promise<void> } | null = null;
    const askLock = async () => {
      try {
        const wl = (navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } }).wakeLock;
        if (wl && document.visibilityState === "visible") lock = await wl.request("screen");
      } catch {
        /* not allowed here: the screen may dim as usual */
      }
    };
    void askLock();
    const onVis = () => { if (document.visibilityState === "visible") void askLock(); };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") h.current.onClose();
      else if (e.code === "Space" && !e.repeat) { e.preventDefault(); h.current.onTap(); }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") { e.preventDefault(); h.current.onUndo(); }
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("keydown", onKey);
      void lock?.release().catch(() => undefined);
    };
  }, []);

  const pct = Math.round(Math.max(0, Math.min(1, progress)) * 100);

  return (
    <div className="fixed inset-0 z-[160] flex flex-col bg-[#06301c] text-white" role="dialog" aria-modal="true" aria-label={isAr ? "وضع التركيز" : "Focus mode"}>
      <div className="flex items-center justify-between gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <button type="button" onClick={onClose} className="grid h-11 w-11 place-items-center rounded-full bg-white/10 hover:bg-white/20" aria-label={isAr ? "خروج من وضع التركيز" : "Exit focus mode"}>
          <X className="h-5 w-5" />
        </button>
        <span className="text-xs font-bold text-white/60">{today}</span>
        <button type="button" onClick={onUndo} disabled={!canUndo}
          className="inline-flex h-11 items-center gap-1.5 rounded-full bg-white/10 px-4 text-sm font-black hover:bg-white/20 disabled:opacity-30">
          <Undo2 className="h-4 w-4" /> {isAr ? "تراجع" : "Undo"}
        </button>
      </div>

      <button
        type="button"
        className="relative flex flex-1 select-none flex-col items-center justify-center px-6 text-center focus-visible:outline-none"
        style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent", WebkitTouchCallout: "none" }}
        onPointerDown={(e) => { if (e.pointerType !== "mouse") start.current = { x: e.clientX, y: e.clientY }; }}
        onPointerUp={(e) => {
          const s = start.current;
          start.current = null;
          if (!s || e.pointerType === "mouse") return;
          if (Math.hypot(e.clientX - s.x, e.clientY - s.y) > 12) return;
          countedAt.current = Date.now();
          onTap();
        }}
        onPointerCancel={() => { start.current = null; }}
        onClick={() => { if (Date.now() - countedAt.current >= 800) onTap(); }}
        onContextMenu={(e) => e.preventDefault()}
        aria-label={isAr ? `اضغط في أي مكان بعد أن تقول: ${text}. العدد ${shown}` : `Tap anywhere after saying: ${text}. Count ${shown}`}
      >
        <span className="max-w-xl text-2xl font-black leading-[1.7] sm:text-3xl" aria-live="polite">{text}</span>
        {next && <span className="mt-2 max-w-full truncate text-sm font-bold text-white/50">{isAr ? `التالي: ${next}` : `Next: ${next}`}</span>}
        <span className={`mt-10 font-mono text-8xl font-black tabular-nums transition-transform ${done ? "scale-110 text-secondary" : ""}`}>{shown}</span>
        <span className="mt-2 text-base font-bold text-white/70">{target}</span>
        {rounds && <span className="mt-1 text-sm font-black text-secondary">{rounds}</span>}
        <span className="mt-8 block h-2 w-full max-w-xs overflow-hidden rounded-full bg-white/10" aria-hidden>
          <span className="block h-full rounded-full bg-secondary transition-[width] duration-200" style={{ width: `${pct}%` }} />
        </span>
        <span className={`mt-6 rounded-full bg-secondary px-4 py-1.5 text-sm font-black text-slate-950 transition-opacity ${done ? "opacity-100" : "opacity-0"}`} aria-hidden={!done}>
          {isAr ? "تقبّل الله منك" : "May Allah accept it"}
        </span>
        <span className="absolute inset-x-0 bottom-[max(1.25rem,env(safe-area-inset-bottom))] text-xs font-bold text-white/45">
          {isAr ? "اضغط في أي مكان على الشاشة للعدّ" : "Tap anywhere on the screen to count"}
        </span>
      </button>
    </div>
  );
}
