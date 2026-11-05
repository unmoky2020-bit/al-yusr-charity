import { useState } from "react";
import { ArrowDown, ArrowUp, FolderOpen, ImagePlus, Loader2, Plus, RotateCcw, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MediaPickerModal } from "@/components/admin/MediaPickerModal";
import { LField } from "@/components/admin/CampaignPageContentEditor";
import { describeWriteError } from "@/data/api/backendPending";
import { MEDIA_ACCEPT, MEDIA_MAX_BYTES, uploadMedia } from "@/data/api/mediaApi";
import { pageImageUrl } from "@/data/pageImages";
import type { CampaignPageContent, ImageSlot, PageImage } from "@/data/campaignPages/types";

/**
 * «الصور» tab of a landing page (campaigns and projects): one box per picture slot of the page
 * (main image, gallery…). Pictures come from an upload, the media library, or a pasted link.
 * A slot whose list is emptied shows the page's original pictures again.
 */
type Props = {
  value: CampaignPageContent;
  onChange: (next: CampaignPageContent) => void;
  /** The page's code defaults, for «رجّع الصور الأصلية». */
  defaults?: CampaignPageContent | null;
};

const EMPTY: PageImage = { src: "", alt: { ar: "", en: "" } };

/** Picture source: upload / media library / link, with a preview. */
function ImageSource({ src, onChange, label }: { src: string; onChange: (v: string) => void; label: string }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const preview = pageImageUrl(src);
  const isAsset = src.startsWith("asset:");

  const upload = async (file: File) => {
    if (!MEDIA_ACCEPT.includes(file.type) || file.size > MEDIA_MAX_BYTES) {
      toast.error("الصيغ المسموحة JPG و PNG و WebP و GIF و AVIF، والحد الأقصى 5 ميجابايت");
      return;
    }
    setUploading(true);
    try {
      const saved = await uploadMedia(file, file.name, "general");
      onChange(saved.url);
    } catch (e) {
      toast.error(describeWriteError(e, "POST /media"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
      <div className="grid aspect-[4/3] w-full shrink-0 place-items-center overflow-hidden rounded-xl border border-dashed border-border bg-muted/30 sm:w-40">
        {preview ? (
          <img src={preview} alt="" className="h-full w-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/placeholder.svg"; }} />
        ) : (
          <ImagePlus className="h-6 w-6 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-center gap-1.5">
          <label className={`inline-flex h-9 shrink-0 cursor-pointer items-center gap-1 rounded-xl border border-input bg-background px-3 text-xs font-bold hover:bg-muted ${uploading ? "pointer-events-none opacity-60" : ""}`}>
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />} رفع
            <input type="file" accept={MEDIA_ACCEPT.join(",")} className="hidden" disabled={uploading} onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) void upload(f);
            }} />
          </label>
          <Button type="button" size="sm" variant="outline" className="h-9 shrink-0 gap-1 rounded-xl text-xs font-bold" onClick={() => setPickerOpen(true)}>
            <FolderOpen className="h-3.5 w-3.5" /> من المكتبة
          </Button>
        </div>
        <Input dir="ltr" value={src} placeholder="https://… أو ارفع صورة" className="h-9 rounded-xl font-mono text-[11px]" onChange={(e) => onChange(e.target.value.trim())} />
        {isAsset && <p className="text-[11px] text-muted-foreground">صورة أصلية من تصميم الموقع.</p>}
      </div>
      <MediaPickerModal open={pickerOpen} onOpenChange={setPickerOpen} currentValue={isAsset ? null : src} title={label}
        onSelect={(url) => { onChange(url); setPickerOpen(false); }} />
    </div>
  );
}

export function SlotBox({ slotKey, slot, onItems, defaults }: { slotKey: string; slot: ImageSlot; onItems: (items: PageImage[]) => void; defaults?: ImageSlot }) {
  const max = slot.max ?? Infinity;
  const single = max === 1;
  const items = slot.items;
  const set = (i: number, patch: Partial<PageImage>) => onItems(items.map((it, j) => (j === i ? { ...it, ...patch } : it)));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onItems(next);
  };
  const isDefault = !!defaults && JSON.stringify(defaults.items) === JSON.stringify(items);

  return (
    <div className="rounded-2xl border border-border bg-background/60 p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h4 className="text-sm font-black text-foreground">{slot.label.ar} <span className="font-mono text-[10px] font-normal text-muted-foreground" dir="ltr">· {slotKey}</span></h4>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {slot.hint?.ar || (single ? "صورة واحدة." : `${items.length} صورة${Number.isFinite(max) ? ` (بحد أقصى ${max})` : ""} — بالترتيب اللي هنا.`)}
          </p>
        </div>
        {defaults && !isDefault && (
          <Button type="button" variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={() => onItems(structuredClone(defaults.items))}>
            <RotateCcw className="h-3.5 w-3.5" /> الصور الأصلية
          </Button>
        )}
      </div>
      <div className="space-y-3">
        {items.map((it, i) => (
          <div key={i} className="space-y-3 rounded-xl border border-border p-3">
            {!single && (
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-muted-foreground">صورة {i + 1}</span>
                <span className="flex items-center gap-1">
                  <Button type="button" size="icon" variant="ghost" className="h-7 w-7" disabled={i === 0} onClick={() => move(i, -1)} title="أعلى"><ArrowUp className="h-3.5 w-3.5" /></Button>
                  <Button type="button" size="icon" variant="ghost" className="h-7 w-7" disabled={i === items.length - 1} onClick={() => move(i, 1)} title="أسفل"><ArrowDown className="h-3.5 w-3.5" /></Button>
                  <Button type="button" size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => onItems(items.filter((_, j) => j !== i))} title="حذف"><Trash2 className="h-3.5 w-3.5" /></Button>
                </span>
              </div>
            )}
            <ImageSource src={it.src} label={slot.label.ar} onChange={(src) => set(i, { src })} />
            <LField label="وصف الصورة (بيظهر لمحركات البحث وتحت الصورة في المعرض)" value={it.alt} onChange={(alt) => set(i, { alt })} />
            {slot.captions && (
              <LField label="عنوان قصير على الصورة" value={it.caption ?? { ar: "", en: "" }} onChange={(caption) => set(i, { caption })} />
            )}
          </div>
        ))}
        {items.length === 0 && (
          <p className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
            مفيش صور — {defaults?.items.length ? "هتظهر الصور الأصلية للصفحة." : "القسم مش هيظهر في الصفحة لحد ما تضيف صور."}
          </p>
        )}
        {items.length < max && (
          <Button type="button" variant="outline" size="sm" className="gap-1.5 font-black" onClick={() => onItems([...items, structuredClone(EMPTY)])}>
            <Plus className="h-4 w-4" /> إضافة صورة
          </Button>
        )}
      </div>
    </div>
  );
}

export function PageImagesPanel({ value, onChange, defaults }: Props) {
  const slots = value.images ?? {};
  const keys = Object.keys(slots);
  if (!keys.length) return null;
  const setItems = (key: string, items: PageImage[]) => {
    const next = structuredClone(value);
    next.images![key] = { ...next.images![key], items };
    onChange(next);
  };
  return (
    <div className="space-y-4">
      {keys.map((k) => (
        <SlotBox key={k} slotKey={k} slot={slots[k]} defaults={defaults?.images?.[k]} onItems={(items) => setItems(k, items)} />
      ))}
    </div>
  );
}
