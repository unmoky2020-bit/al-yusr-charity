import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, ShieldCheck, X } from "lucide-react";
import { uploadEvidence } from "@/data/api/impactApi";
import { formatServerImageUrl } from "@/data/laravelApi";
import { notifyError, toast } from "@/lib/notify";
import { cn } from "@/lib/utils";
import { PhotoBlurEditor, type BlurKind } from "./PhotoBlurEditor";

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
  /** most photos allowed (the backend takes 6 per record) */
  max?: number;
  kind?: BlurKind;
  lang: "ar" | "en";
  /** true while a photo is still being blurred or uploaded — block saving until it's false */
  onBusyChange?: (busy: boolean) => void;
  addLabel?: string;
  className?: string;
};

interface Pending { key: string; preview: string }

/**
 * Photos for an impact record. Every picked photo goes through the blur editor first (faces covered
 * on the device), then the blurred copy is uploaded; its link is added to `value`.
 */
export function EvidencePhotos({ value, onChange, max = 6, kind = "people", lang, onBusyChange, addLabel, className }: Props) {
  const ar = lang === "ar";
  const input = useRef<HTMLInputElement | null>(null);
  const [queue, setQueue] = useState<File[]>([]);
  const [batch, setBatch] = useState({ done: 0, total: 0 });
  const [pending, setPending] = useState<Pending[]>([]);
  // Latest list, also between renders (two uploads can finish in the same tick).
  const latest = useRef(value);
  useEffect(() => {
    latest.current = value;
  }, [value]);

  const room = max - value.length - pending.length;
  const busy = queue.length > 0 || pending.length > 0;
  useEffect(() => {
    onBusyChange?.(busy);
  }, [busy, onBusyChange]);

  const pick = (files: FileList | null) => {
    const list = Array.from(files ?? []).filter((f) => f.type.startsWith("image/") || /\.(jpe?g|png|webp|heic|heif)$/i.test(f.name));
    if (input.current) input.current.value = "";
    if (!list.length) return;
    const take = list.slice(0, Math.max(0, room));
    if (take.length < list.length) {
      toast.info(ar ? `أقصى عدد ${max} صور — هنضيف أول ${take.length} بس.` : `Up to ${max} photos — adding the first ${take.length}.`);
    }
    if (!take.length) return;
    setBatch({ done: 0, total: take.length });
    setQueue(take);
  };

  const next = () => {
    setQueue((q) => q.slice(1));
    setBatch((b) => ({ ...b, done: b.done + 1 }));
  };

  const upload = async (blob: Blob) => {
    next();
    const key = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const preview = URL.createObjectURL(blob);
    setPending((p) => [...p, { key, preview }]);
    try {
      const url = await uploadEvidence(blob, "photo.jpg");
      latest.current = [...latest.current, url];
      onChange(latest.current);
    } catch (err) {
      notifyError(err, ar ? "الصورة ما اترفعتش — جرّب تاني" : "Photo not uploaded — try again");
    } finally {
      setPending((p) => p.filter((x) => x.key !== key));
      URL.revokeObjectURL(preview);
    }
  };

  const remove = (url: string) => {
    latest.current = latest.current.filter((u) => u !== url);
    onChange(latest.current);
  };

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2">
        {value.map((u) => (
          <div key={u} className="group relative h-20 w-20 overflow-hidden rounded-xl bg-muted ring-1 ring-border">
            <img src={formatServerImageUrl(u) || u} alt="" loading="lazy" className="h-full w-full object-cover" />
            <button type="button" onClick={() => remove(u)} className="absolute end-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80" aria-label={ar ? "شيل الصورة" : "Remove photo"}>
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {pending.map((p) => (
          <div key={p.key} className="relative h-20 w-20 overflow-hidden rounded-xl bg-muted ring-1 ring-border">
            <img src={p.preview} alt="" className="h-full w-full object-cover opacity-60" />
            <span className="absolute inset-0 grid place-items-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></span>
          </div>
        ))}
        {room > 0 && (
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={queue.length > 0}
            className={cn(
              "grid h-20 min-w-20 place-items-center rounded-xl border-2 border-dashed border-border bg-muted/40 px-2 text-center text-[11px] font-bold text-muted-foreground transition hover:border-secondary hover:text-primary",
            )}
          >
            <span className="flex flex-col items-center gap-1">
              <Camera className="h-5 w-5" />
              {addLabel ?? (ar ? "أضف صورة" : "Add photo")}
            </span>
          </button>
        )}
        <input ref={input} type="file" accept="image/*" multiple={max > 1} className="hidden" onChange={(e) => pick(e.target.files)} />
      </div>
      {kind === "people" && (
        <p className="mt-1.5 flex items-center gap-1 text-[10.5px] font-semibold text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-secondary" />
          {ar ? "الوشوش بتتغطى على جهازك قبل الرفع." : "Faces are covered on your device before upload."}
        </p>
      )}
      <PhotoBlurEditor
        file={queue[0] ?? null}
        index={batch.done + 1}
        total={batch.total}
        kind={kind}
        lang={lang}
        onDone={(blob) => void upload(blob)}
        onSkip={next}
      />
    </div>
  );
}
