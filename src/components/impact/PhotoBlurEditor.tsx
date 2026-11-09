import { useCallback, useEffect, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Check, Eraser, Loader2, ScanFace, ShieldCheck, TriangleAlert, Undo2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import {
  detectFaces, exportBlurred, loadPhoto, paintBlurred, spotAt, spotUnder, type BlurSpot,
} from "@/lib/faceBlur";

/** "people": find faces automatically. "document" (receipts): by hand only, to cover a name or phone. */
export type BlurKind = "people" | "document";

type Phase = "loading" | "detecting" | "ready" | "unreadable";
type Found = "found" | "none" | "failed" | "manual";

const DETECT_TIMEOUT_MS = 30_000;

const T = {
  ar: {
    titlePeople: "غطّي الوشوش قبل الرفع",
    titleDoc: "راجع الصورة قبل الرفع",
    of: (i: number, n: number) => `صورة ${i} من ${n}`,
    loading: "بنفتح الصورة…",
    detecting: "بندوّر على الوشوش…",
    slowFirst: "أول مرة بتاخد ثواني زيادة لتحميل الأداة على الجهاز.",
    found: (n: number) => `${n === 1 ? "لقينا وش واحد وغطّيناه" : `لقينا ${n} وشوش وغطّيناهم`} — راجع الصورة: أي وش لسه باين اضغط عليه`,
    none: "ما لقيناش وشوش — لو فيه حد في الصورة اضغط على وشّه",
    failed: "التعرّف الأوتوماتيك مش شغال على الجهاز ده — اضغط على كل وش علشان يتغطى",
    manual: "لو فيها اسم أو رقم تليفون لحد، اضغط عليه علشان يتغطى",
    hint: "اضغط على أي وش مش متغطي يتغطى، واضغط على دايرة غلط تتشال.",
    unreadable: "الصورة دي مش بتتفتح على الجهاز ده. جرّب تصوّرها تاني أو اختار صورة JPG.",
    size: "حجم الدايرة",
    undo: "تراجع",
    clear: "شيل الكل",
    skip: "متضيفش الصورة دي",
    okFaces: "تمام — الوشوش متغطية",
    okNone: "تمام — مفيش وشوش",
    okDoc: "تمام — ارفع الصورة",
    privacy: "التمويه بيحصل على جهازك قبل الرفع، والأصل ما بيتبعتش. وبيتشال من الصورة مكان التصوير.",
  },
  en: {
    titlePeople: "Cover faces before uploading",
    titleDoc: "Check the photo before uploading",
    of: (i: number, n: number) => `Photo ${i} of ${n}`,
    loading: "Opening the photo…",
    detecting: "Looking for faces…",
    slowFirst: "The first time takes a few extra seconds to load the tool.",
    found: (n: number) => `${n === 1 ? "Found 1 face and covered it" : `Found ${n} faces and covered them`} — check the photo and tap any face still showing`,
    none: "No faces found — if someone is in it, tap their face",
    failed: "Automatic detection doesn't work on this device — tap each face to cover it",
    manual: "If it shows someone's name or phone number, tap it to cover it",
    hint: "Tap an uncovered face to cover it; tap a wrong circle to remove it.",
    unreadable: "This photo can't be opened on this device. Try another photo (JPG).",
    size: "Circle size",
    undo: "Undo",
    clear: "Remove all",
    skip: "Skip this photo",
    okFaces: "Done — faces are covered",
    okNone: "Done — no faces",
    okDoc: "Done — upload",
    privacy: "Blurring happens on your device before upload; the original is never sent, and the location data is removed.",
  },
};

type Props = {
  file: File | null;
  index?: number;
  total?: number;
  kind?: BlurKind;
  lang: "ar" | "en";
  onDone: (blob: Blob) => void;
  onSkip: () => void;
};

/**
 * Full-screen on phones: the photo with every face blurred, ready to check. Faces are found on the
 * device; the person taps any face that was missed (or a wrong spot to clear it), then confirms.
 * The blurred copy is what gets uploaded — the original never leaves the phone.
 */
export function PhotoBlurEditor({ file, index = 1, total = 1, kind = "people", lang, onDone, onSkip }: Props) {
  const t = T[lang];
  const [src, setSrc] = useState<HTMLCanvasElement | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [found, setFound] = useState<Found>("manual");
  const [spots, setSpots] = useState<BlurSpot[]>([]);
  const [history, setHistory] = useState<BlurSpot[][]>([]);
  const [size, setSize] = useState(0.06); // radius as a share of the long side
  const [slow, setSlow] = useState(false);
  const [busy, setBusy] = useState(false);
  const preview = useRef<HTMLCanvasElement | null>(null);
  const svg = useRef<SVGSVGElement | null>(null);

  // A new photo: open it, then (for people) look for faces.
  useEffect(() => {
    if (!file) return;
    let alive = true;
    setSrc(null);
    setSpots([]);
    setHistory([]);
    setSlow(false);
    setBusy(false);
    setPhase("loading");
    (async () => {
      let canvas: HTMLCanvasElement;
      try {
        canvas = await loadPhoto(file);
      } catch {
        if (alive) setPhase("unreadable");
        return;
      }
      if (!alive) return;
      setSrc(canvas);
      if (kind === "document") {
        setFound("manual");
        setPhase("ready");
        return;
      }
      setPhase("detecting");
      const slowTimer = window.setTimeout(() => alive && setSlow(true), 3000);
      try {
        const faces = await Promise.race([
          detectFaces(canvas),
          new Promise<never>((_, reject) => window.setTimeout(() => reject(new Error("timeout")), DETECT_TIMEOUT_MS)),
        ]);
        if (!alive) return;
        setSpots(faces);
        setFound(faces.length ? "found" : "none");
      } catch {
        if (alive) setFound("failed");
      } finally {
        window.clearTimeout(slowTimer);
        if (alive) setPhase("ready");
      }
    })();
    return () => {
      alive = false;
    };
  }, [file, kind]);

  // Repaint the blurred preview after every change.
  useEffect(() => {
    if (src && preview.current) paintBlurred(preview.current, src, spots);
  }, [src, spots]);

  const change = useCallback((next: BlurSpot[]) => {
    setHistory((h) => [...h.slice(-29), spots]);
    setSpots(next);
  }, [spots]);

  const undo = () => {
    if (!history.length) return;
    setSpots(history[history.length - 1]);
    setHistory(history.slice(0, -1));
  };

  // A tap (not a drag or a pinch) adds a circle, or removes the one under the finger.
  const down = useRef<{ x: number; y: number } | null>(null);
  const onTap = (e: React.PointerEvent<SVGSVGElement>) => {
    const start = down.current;
    down.current = null;
    if (!start || Math.hypot(e.clientX - start.x, e.clientY - start.y) > 12) return;
    if (!src || !svg.current || phase !== "ready") return;
    const r = svg.current.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * src.width;
    const y = ((e.clientY - r.top) / r.height) * src.height;
    const hit = spotUnder(spots, x, y);
    if (hit >= 0) change(spots.filter((_, i) => i !== hit));
    else change([...spots, spotAt(x, y, Math.max(src.width, src.height) * size)]);
  };

  // The slider resizes the circle added last, so "tap, then fix the size" works.
  const onSize = (v: number) => {
    setSize(v);
    const last = spots[spots.length - 1];
    if (last && !last.auto && src) {
      const r = Math.max(src.width, src.height) * v;
      setSpots([...spots.slice(0, -1), { ...last, rx: r, ry: r * 1.15 }]);
    }
  };

  const confirm = async () => {
    if (!src) return;
    setBusy(true);
    try {
      onDone(await exportBlurred(src, spots));
    } finally {
      setBusy(false);
    }
  };

  const status = (() => {
    if (phase === "loading") return { tone: "info", icon: Loader2, spin: true, text: t.loading };
    if (phase === "detecting") return { tone: "info", icon: ScanFace, spin: false, text: t.detecting };
    if (phase === "unreadable") return { tone: "warn", icon: TriangleAlert, spin: false, text: t.unreadable };
    if (found === "found") return { tone: "ok", icon: ShieldCheck, spin: false, text: t.found(spots.filter((s) => s.auto).length || spots.length) };
    if (found === "none") return { tone: "warn", icon: ScanFace, spin: false, text: t.none };
    if (found === "failed") return { tone: "warn", icon: TriangleAlert, spin: false, text: t.failed };
    return { tone: "info", icon: ScanFace, spin: false, text: t.manual };
  })();
  const StatusIcon = status.icon;
  const okLabel = kind === "document" ? t.okDoc : spots.length ? t.okFaces : t.okNone;

  return (
    <DialogPrimitive.Root open={!!file} onOpenChange={(o) => !o && !busy && onSkip()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[160] bg-black/80 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          dir={lang === "ar" ? "rtl" : "ltr"}
          aria-describedby={undefined}
          onPointerDownOutside={(e) => e.preventDefault()}
          className="fixed inset-0 z-[161] flex flex-col bg-zinc-950 text-white outline-none sm:inset-auto sm:left-1/2 sm:top-1/2 sm:max-h-[92vh] sm:w-[min(920px,94vw)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:overflow-hidden sm:rounded-3xl sm:shadow-2xl"
        >
          {/* top bar */}
          <div className="flex items-center gap-3 px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
            <div className="min-w-0 flex-1">
              <DialogPrimitive.Title className="truncate text-[15px] font-black">{kind === "document" ? t.titleDoc : t.titlePeople}</DialogPrimitive.Title>
              {total > 1 && <p className="text-[11px] font-bold text-white/60">{t.of(index, total)}</p>}
            </div>
            <button type="button" onClick={onSkip} disabled={busy} className="grid h-9 w-9 place-items-center rounded-full bg-white/10 hover:bg-white/20" aria-label={t.skip}>
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* status */}
          <div className="px-4">
            <p
              role="status"
              className={cn(
                "flex items-start gap-2 rounded-2xl px-3 py-2 text-[12.5px] font-bold leading-snug",
                status.tone === "ok" && "bg-emerald-500/15 text-emerald-200",
                status.tone === "warn" && "bg-amber-400/15 text-amber-100",
                status.tone === "info" && "bg-white/10 text-white/85",
              )}
            >
              <StatusIcon className={cn("mt-0.5 h-4 w-4 shrink-0", status.spin && "animate-spin", phase === "detecting" && "motion-safe:animate-pulse")} />
              <span>
                {status.text}
                {phase === "detecting" && slow && <span className="mt-0.5 block text-[11px] font-semibold text-white/60">{t.slowFirst}</span>}
              </span>
            </p>
          </div>

          {/* photo */}
          <div className="relative flex min-h-0 flex-1 items-center justify-center p-3">
            {src ? (
              <div className="relative max-h-full" style={{ aspectRatio: `${src.width} / ${src.height}`, width: `min(100%, calc((100dvh - 330px) * ${src.width / src.height}))` }}>
                <canvas ref={preview} className="block h-full w-full rounded-xl" />
                {phase === "detecting" && <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl"><div className="absolute inset-x-0 h-1/3 animate-[scan_1.6s_ease-in-out_infinite] bg-gradient-to-b from-transparent via-secondary/35 to-transparent" /></div>}
                <svg
                  ref={svg}
                  viewBox={`0 0 ${src.width} ${src.height}`}
                  className={cn("absolute inset-0 h-full w-full touch-manipulation", phase === "ready" ? "cursor-crosshair" : "pointer-events-none")}
                  onPointerDown={(e) => { down.current = e.isPrimary ? { x: e.clientX, y: e.clientY } : null; }}
                  onPointerUp={onTap}
                  onPointerCancel={() => { down.current = null; }}
                  role="application"
                  aria-label={t.hint}
                >
                  {spots.map((s) => (
                    <g key={s.id}>
                      <ellipse cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} fill="none" stroke="rgba(0,0,0,.45)" strokeWidth={Math.max(src.width, src.height) / 260} />
                      <ellipse
                        cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} fill="transparent"
                        stroke="#fff" strokeWidth={Math.max(src.width, src.height) / 420}
                        strokeDasharray={s.auto ? undefined : `${Math.max(src.width, src.height) / 90} ${Math.max(src.width, src.height) / 140}`}
                      />
                    </g>
                  ))}
                </svg>
              </div>
            ) : phase === "unreadable" ? (
              <TriangleAlert className="h-10 w-10 text-amber-300" aria-hidden />
            ) : (
              <Loader2 className="h-8 w-8 animate-spin text-white/70" aria-hidden />
            )}
          </div>

          {/* tools */}
          <div className="space-y-3 border-t border-white/10 bg-zinc-900/80 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
            {phase === "ready" && (
              <>
                <p className="text-center text-[11.5px] font-semibold text-white/70">{t.hint}</p>
                <div className="flex items-center gap-3">
                  <span className="shrink-0 text-[11px] font-bold text-white/70">{t.size}</span>
                  <Slider dir={lang === "ar" ? "rtl" : "ltr"} min={0.025} max={0.14} step={0.005} value={[size]} onValueChange={(v) => onSize(v[0])} className="flex-1" aria-label={t.size} />
                  <button type="button" onClick={undo} disabled={!history.length}
                    className="inline-flex h-9 items-center gap-1 rounded-xl bg-white/10 px-3 text-[11px] font-bold disabled:opacity-40" aria-label={t.undo}>
                    <Undo2 className="h-3.5 w-3.5" /><span className="max-sm:hidden">{t.undo}</span>
                  </button>
                  <button type="button" onClick={() => spots.length && change([])} disabled={!spots.length}
                    className="inline-flex h-9 items-center gap-1 rounded-xl bg-white/10 px-3 text-[11px] font-bold disabled:opacity-40" aria-label={t.clear}>
                    <Eraser className="h-3.5 w-3.5" /><span className="max-sm:hidden">{t.clear}</span>
                  </button>
                </div>
              </>
            )}
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={onSkip} disabled={busy} className="h-11 flex-1 rounded-xl bg-white/10 text-xs font-bold text-white hover:bg-white/20 hover:text-white">
                {t.skip}
              </Button>
              <Button type="button" onClick={() => void confirm()} disabled={phase !== "ready" || busy} className="h-11 flex-[1.6] rounded-xl bg-orange-grad text-sm font-black text-accent-foreground shadow-cta">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} {okLabel}
              </Button>
            </div>
            <p className="flex items-start justify-center gap-1.5 text-center text-[10.5px] text-white/50">
              <ShieldCheck className="mt-px h-3.5 w-3.5 shrink-0" /> {t.privacy}
            </p>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
