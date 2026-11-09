import { useCallback, useEffect, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { formatServerImageUrl } from "@/data/laravelApi";
import { cn } from "@/lib/utils";

const src = (u: string) => formatServerImageUrl(u) || u;

/** A full-screen look at a set of photos (arrows, keyboard, counter). */
export function PhotoViewer({ photos, index, onClose, lang, caption }: {
  photos: string[];
  index: number | null;
  onClose: () => void;
  lang: "ar" | "en";
  caption?: string;
}) {
  const [i, setI] = useState(index ?? 0);
  useEffect(() => {
    if (index !== null) setI(index);
  }, [index]);
  const n = photos.length;
  const go = useCallback((d: number) => setI((v) => (v + d + n) % n), [n]);
  const rtl = lang === "ar";

  return (
    <DialogPrimitive.Root open={index !== null && n > 0} onOpenChange={(o) => !o && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[170] bg-black/90 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          dir={rtl ? "rtl" : "ltr"}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") go(rtl ? -1 : 1);
            if (e.key === "ArrowLeft") go(rtl ? 1 : -1);
          }}
          className="fixed inset-0 z-[171] flex flex-col items-center justify-center p-3 outline-none"
        >
          <DialogPrimitive.Title className="sr-only">{caption || (rtl ? "صور" : "Photos")}</DialogPrimitive.Title>
          <img src={src(photos[i] ?? "")} alt={caption || ""} className="max-h-[82dvh] max-w-full rounded-xl object-contain shadow-2xl" />
          <div className="mt-3 flex items-center gap-3 text-white">
            {n > 1 && (
              <button type="button" onClick={() => go(rtl ? 1 : -1)} className="grid h-10 w-10 place-items-center rounded-full bg-white/10 hover:bg-white/20" aria-label={rtl ? "اللي قبلها" : "Previous"}>
                {rtl ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
              </button>
            )}
            <span className="min-w-0 max-w-[60vw] truncate text-center text-xs font-bold text-white/80">
              {caption}{n > 1 ? `${caption ? " · " : ""}${i + 1} / ${n}` : ""}
            </span>
            {n > 1 && (
              <button type="button" onClick={() => go(rtl ? -1 : 1)} className="grid h-10 w-10 place-items-center rounded-full bg-white/10 hover:bg-white/20" aria-label={rtl ? "اللي بعدها" : "Next"}>
                {rtl ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              </button>
            )}
          </div>
          <DialogPrimitive.Close className="absolute end-3 top-[max(0.75rem,env(safe-area-inset-top))] grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label={rtl ? "إغلاق" : "Close"}>
            <X className="h-5 w-5" />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/** A row of small photos that open in the viewer. */
export function PhotoStrip({ photos, lang, caption, size = "md", className }: {
  photos: string[];
  lang: "ar" | "en";
  caption?: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const [open, setOpen] = useState<number | null>(null);
  if (!photos.length) return null;
  const box = size === "sm" ? "h-12 w-12 rounded-lg" : "h-16 w-16 rounded-xl sm:h-20 sm:w-20";
  return (
    <>
      <div className={cn("flex flex-wrap gap-1.5", className)}>
        {photos.map((p, i) => (
          <button
            key={p + i}
            type="button"
            onClick={() => setOpen(i)}
            className={cn("relative shrink-0 overflow-hidden bg-muted ring-1 ring-border transition hover:ring-2 hover:ring-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary", box)}
            aria-label={`${lang === "ar" ? "افتح الصورة" : "Open photo"} ${i + 1}`}
          >
            <img src={src(p)} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
      <PhotoViewer photos={photos} index={open} onClose={() => setOpen(null)} lang={lang} caption={caption} />
    </>
  );
}
