import { useEffect, useRef, useState } from "react";
import { Monitor, Smartphone, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Shows a rendered email the way a mail app would: in a sandboxed frame, at phone (390px) or
 * desktop (680px) width, with the frame growing to the email's full height.
 */
export function EmailPreviewFrame({
  html, loading, error, className, initialMode = "mobile", title = "معاينة الإيميل",
}: {
  html: string | null;
  loading?: boolean;
  error?: string | null;
  className?: string;
  initialMode?: "mobile" | "desktop";
  title?: string;
}) {
  const [mode, setMode] = useState<"mobile" | "desktop">(initialMode);
  const [height, setHeight] = useState(900);
  const ref = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const f = ref.current;
    if (!f) return;
    const fit = () => {
      try {
        const doc = f.contentDocument;
        if (doc?.body) setHeight(Math.max(400, doc.documentElement.scrollHeight + 4));
      } catch { /* cross-origin: keep default */ }
    };
    f.addEventListener("load", fit);
    const t = window.setTimeout(fit, 600);
    const t2 = window.setTimeout(fit, 1600);
    return () => { f.removeEventListener("load", fit); window.clearTimeout(t); window.clearTimeout(t2); };
  }, [html, mode]);

  const width = mode === "mobile" ? 390 : 680;

  return (
    <div className={cn("rounded-2xl border bg-[#f3f1ea] p-3", className)} dir="rtl">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-muted-foreground">{title}</span>
        <div className="inline-flex rounded-full border bg-background p-0.5" role="group" aria-label="مقاس المعاينة">
          <button type="button" onClick={() => setMode("mobile")} aria-pressed={mode === "mobile"}
            className={cn("flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold transition", mode === "mobile" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
            <Smartphone className="h-3.5 w-3.5" /> موبايل
          </button>
          <button type="button" onClick={() => setMode("desktop")} aria-pressed={mode === "desktop"}
            className={cn("flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold transition", mode === "desktop" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
            <Monitor className="h-3.5 w-3.5" /> كمبيوتر
          </button>
        </div>
      </div>
      <div className="relative mx-auto overflow-hidden rounded-[22px] bg-white shadow-sm ring-1 ring-black/5 transition-all" style={{ width: "100%", maxWidth: width }}>
        {loading && (
          <div className="absolute inset-0 z-10 flex items-start justify-center bg-white/60 pt-24">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
        {error ? (
          <div className="p-8 text-center text-sm text-destructive">{error}</div>
        ) : html ? (
          <iframe ref={ref} title={title} srcDoc={html} sandbox="allow-same-origin allow-popups" className="block w-full border-0" style={{ height }} />
        ) : (
          <div className="p-10 text-center text-sm text-muted-foreground">{loading ? "بنجهّز المعاينة…" : "مفيش معاينة لسه"}</div>
        )}
      </div>
    </div>
  );
}
