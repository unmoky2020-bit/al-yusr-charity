/**
 * Small form building blocks for the program / project editors: section cards, bilingual
 * pairs (Arabic first, side by side), toggles, list editors and an image field that uses
 * the shared media library (MediaPickerModal).
 */
import { useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, FolderOpen, ImagePlus, Loader2, Plus, Trash2, Upload, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MediaPickerModal } from "@/components/admin/MediaPickerModal";
import { LucideIconPicker } from "@/components/admin/LucideIconPicker";
import { formatServerImageUrl } from "@/data/laravelApi";
import { describeWriteError } from "@/data/api/backendPending";
import { toast } from "sonner";
import { MEDIA_ACCEPT, MEDIA_MAX_BYTES, uploadMedia, type MediaCollection } from "@/data/api/mediaApi";
import { NEEDS_BACKEND_AR, type FaqItem } from "@/data/api/programsAdminApi";
import { toKebabIcon } from "./formUtils";
import type { ItemField } from "./sectionSchemas";

export function NeedsBackendBadge({ text = NEEDS_BACKEND_AR }: { text?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400">
      <AlertTriangle className="h-3 w-3" />
      {text}
    </span>
  );
}

export function SectionCard({
  icon,
  title,
  description,
  actions,
  children,
}: {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-4 rounded-3xl border border-border/80 bg-card p-5 shadow-card sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-black text-foreground">
            {icon}
            {title}
          </h2>
          {description && <p className="mt-1 text-[11px] text-muted-foreground">{description}</p>}
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}

export function Field({
  label,
  hint,
  badge,
  className,
  children,
}: {
  label: ReactNode;
  hint?: ReactNode;
  badge?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2">
        <Label className="text-xs font-bold">{label}</Label>
        {badge}
      </div>
      <div className="mt-1.5">{children}</div>
      {hint && <p className="mt-1 text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** Arabic (rtl) + English (ltr) inputs side by side. */
export function BilingualField({
  label,
  valueAr,
  valueEn,
  onAr,
  onEn,
  multiline,
  rows = 3,
  maxLength,
  placeholderAr,
  placeholderEn,
  badge,
  hint,
}: {
  label: string;
  valueAr: string;
  valueEn: string;
  onAr: (v: string) => void;
  onEn: (v: string) => void;
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
  placeholderAr?: string;
  placeholderEn?: string;
  badge?: ReactNode;
  hint?: ReactNode;
}) {
  const counter = (v: string) =>
    maxLength ? <span className="text-[10px] text-muted-foreground">{v.length}/{maxLength}</span> : null;
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Field label={`${label} (عربي)`} badge={badge} hint={hint}>
        {multiline ? (
          <Textarea dir="rtl" rows={rows} maxLength={maxLength} value={valueAr} placeholder={placeholderAr}
            onChange={(e) => onAr(e.target.value)} className="rounded-xl text-xs leading-relaxed" />
        ) : (
          <Input dir="rtl" maxLength={maxLength} value={valueAr} placeholder={placeholderAr}
            onChange={(e) => onAr(e.target.value)} className="h-10 rounded-xl" />
        )}
        {counter(valueAr)}
      </Field>
      <Field label={`${label} (English)`}>
        {multiline ? (
          <Textarea dir="ltr" rows={rows} maxLength={maxLength} value={valueEn} placeholder={placeholderEn}
            onChange={(e) => onEn(e.target.value)} className="rounded-xl text-left text-xs leading-relaxed" />
        ) : (
          <Input dir="ltr" maxLength={maxLength} value={valueEn} placeholder={placeholderEn}
            onChange={(e) => onEn(e.target.value)} className="h-10 rounded-xl text-left" />
        )}
        {counter(valueEn)}
      </Field>
    </div>
  );
}

export function ToggleCard({
  label,
  hint,
  checked,
  onChange,
  disabled,
  badge,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  badge?: ReactNode;
}) {
  return (
    <div className={`flex items-center justify-between gap-3 rounded-2xl border p-3.5 ${checked ? "border-secondary/50 bg-secondary/10" : "border-border/70 bg-muted/30"}`}>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-bold text-foreground">{label}</p>
          {badge}
        </div>
        {hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>}
      </div>
      <Switch checked={checked} disabled={disabled} onCheckedChange={onChange} />
    </div>
  );
}

function RowControls({
  index,
  count,
  onMove,
  onRemove,
}: {
  index: number;
  count: number;
  onMove: (from: number, to: number) => void;
  onRemove: (i: number) => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-0.5">
      <Button type="button" size="icon" variant="ghost" className="h-7 w-7" disabled={index === 0}
        onClick={() => onMove(index, index - 1)} aria-label="تحريك لأعلى">
        <ArrowUp className="h-3.5 w-3.5" />
      </Button>
      <Button type="button" size="icon" variant="ghost" className="h-7 w-7" disabled={index === count - 1}
        onClick={() => onMove(index, index + 1)} aria-label="تحريك لأسفل">
        <ArrowDown className="h-3.5 w-3.5" />
      </Button>
      <Button type="button" size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive"
        onClick={() => onRemove(index)} aria-label="حذف">
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/** Editable list of strings (e.g. benefits_ar / benefits_en). */
export function StringListEditor({
  value,
  onChange,
  dir,
  placeholder,
  addLabel = "إضافة عنصر",
}: {
  value: string[];
  onChange: (v: string[]) => void;
  dir: "rtl" | "ltr";
  placeholder?: string;
  addLabel?: string;
}) {
  const list = value || [];
  return (
    <div className="space-y-2">
      {list.length === 0 && <p className="text-[11px] text-muted-foreground">لا توجد عناصر بعد.</p>}
      {list.map((item, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span className="w-5 shrink-0 text-center font-mono text-[10px] text-muted-foreground">{i + 1}</span>
          <Input dir={dir} value={item} placeholder={placeholder} className="h-9 rounded-xl text-xs"
            onChange={(e) => onChange(list.map((x, j) => (j === i ? e.target.value : x)))} />
          <RowControls index={i} count={list.length} onMove={(a, b) => onChange(move(list, a, b))}
            onRemove={(idx) => onChange(list.filter((_, j) => j !== idx))} />
        </div>
      ))}
      <Button type="button" size="sm" variant="outline" className="h-8 gap-1 rounded-xl text-xs" onClick={() => onChange([...list, ""])}>
        <Plus className="h-3.5 w-3.5" /> {addLabel}
      </Button>
    </div>
  );
}

/** Editable list of {question, answer}. */
export function FaqListEditor({
  value,
  onChange,
  dir,
}: {
  value: FaqItem[];
  onChange: (v: FaqItem[]) => void;
  dir: "rtl" | "ltr";
}) {
  const list = value || [];
  const isAr = dir === "rtl";
  const patch = (i: number, p: Partial<FaqItem>) => onChange(list.map((x, j) => (j === i ? { ...x, ...p } : x)));
  return (
    <div className="space-y-2">
      {list.length === 0 && <p className="text-[11px] text-muted-foreground">لا توجد أسئلة بعد.</p>}
      {list.map((item, i) => (
        <div key={i} className="space-y-1.5 rounded-2xl border border-border/70 bg-muted/20 p-2.5">
          <div className="flex items-center gap-1.5">
            <span className="w-5 shrink-0 text-center font-mono text-[10px] text-muted-foreground">{i + 1}</span>
            <Input dir={dir} value={item.question} placeholder={isAr ? "السؤال" : "Question"} className="h-9 rounded-xl text-xs font-bold"
              onChange={(e) => patch(i, { question: e.target.value })} />
            <RowControls index={i} count={list.length} onMove={(a, b) => onChange(move(list, a, b))}
              onRemove={(idx) => onChange(list.filter((_, j) => j !== idx))} />
          </div>
          <Textarea dir={dir} rows={2} value={item.answer} placeholder={isAr ? "الإجابة" : "Answer"} className="rounded-xl text-xs"
            onChange={(e) => patch(i, { answer: e.target.value })} />
        </div>
      ))}
      <Button type="button" size="sm" variant="outline" className="h-8 gap-1 rounded-xl text-xs"
        onClick={() => onChange([...list, { question: "", answer: "" }])}>
        <Plus className="h-3.5 w-3.5" /> {isAr ? "إضافة سؤال" : "Add question"}
      </Button>
    </div>
  );
}

/** Generic list of objects described by `fields` (page-section content items). Unknown keys are preserved. */
export function ItemListEditor({
  items,
  onChange,
  fields,
  dir,
  newItem,
  addLabel = "إضافة عنصر",
}: {
  items: Array<Record<string, unknown>>;
  onChange: (v: Array<Record<string, unknown>>) => void;
  fields: ItemField[];
  dir: "rtl" | "ltr";
  newItem: () => Record<string, unknown>;
  addLabel?: string;
}) {
  const list = items || [];
  const patch = (i: number, key: string, v: unknown) => onChange(list.map((x, j) => (j === i ? { ...x, [key]: v } : x)));
  return (
    <div className="space-y-2">
      {list.length === 0 && <p className="text-[11px] text-muted-foreground">لا توجد عناصر بعد.</p>}
      {list.map((item, i) => (
        <div key={i} className="rounded-2xl border border-border/70 bg-muted/20 p-2.5">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold text-muted-foreground">#{i + 1}</span>
            <RowControls index={i} count={list.length} onMove={(a, b) => onChange(move(list, a, b))}
              onRemove={(idx) => onChange(list.filter((_, j) => j !== idx))} />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {fields.map((f) => {
              const raw = item[f.name];
              const fieldDir = f.dir || dir;
              const span = f.width === "half" ? "" : "sm:col-span-2";
              return (
                <div key={f.name} className={span}>
                  <Label className="text-[10px] font-bold text-muted-foreground">{f.labelAr}</Label>
                  <div className="mt-1">
                    {f.type === "textarea" && (
                      <Textarea dir={fieldDir} rows={2} value={raw == null ? "" : String(raw)} className="rounded-xl text-xs"
                        onChange={(e) => patch(i, f.name, e.target.value)} />
                    )}
                    {f.type === "text" && (
                      <Input dir={fieldDir} value={raw == null ? "" : String(raw)} className="h-9 rounded-xl text-xs"
                        onChange={(e) => patch(i, f.name, e.target.value)} />
                    )}
                    {f.type === "number" && (
                      <Input dir="ltr" type="number" value={raw == null ? "" : String(raw)} className="h-9 rounded-xl text-xs"
                        onChange={(e) => patch(i, f.name, e.target.value === "" ? null : Number(e.target.value))} />
                    )}
                    {f.type === "switch" && (
                      <Switch checked={raw !== false} onCheckedChange={(c) => patch(i, f.name, c)} />
                    )}
                    {f.type === "icon" && (
                      <div className="flex items-center gap-2">
                        <LucideIconPicker isAr value={raw == null ? "" : String(raw)} onChange={(name) => patch(i, f.name, name ? toKebabIcon(name) : "")} />
                        <span className="font-mono text-[10px] text-muted-foreground" dir="ltr">{raw == null ? "" : String(raw)}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      <Button type="button" size="sm" variant="outline" className="h-8 gap-1 rounded-xl text-xs" onClick={() => onChange([...list, newItem()])}>
        <Plus className="h-3.5 w-3.5" /> {addLabel}
      </Button>
    </div>
  );
}

/**
 * Image stored as a URL / storage path. Layout: the preview spans the full width of the section
 * (the whole image visible, centred), then one row: a small «رفع» button + the link input filling the
 * rest + library / remove. Uploading sends the file to the media library right away and puts its link
 * in the input, so the link is always visible and editable — upload or paste, both work the same.
 */
export function ImageUrlField({
  label,
  value,
  onChange,
  hint,
  badge,
  aspect = "card",
  collection = "general",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: ReactNode;
  badge?: ReactNode;
  /** Preview shape: "card" (4:3, cards) or "wide" (16:9, page heroes). */
  aspect?: "card" | "wide";
  /** Media-library folder for uploads. */
  collection?: MediaCollection;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const preview = value ? formatServerImageUrl(value) || value : "";

  const upload = async (file: File) => {
    setError("");
    if (!MEDIA_ACCEPT.includes(file.type) || file.size > MEDIA_MAX_BYTES) {
      setError("الصيغ المسموحة JPG و PNG و WebP و GIF و AVIF، والحد الأقصى 5 ميجابايت");
      return;
    }
    setUploading(true);
    try {
      const saved = await uploadMedia(file, file.name, collection);
      onChange(saved.url);
      if (saved.duplicate) toast.info("الصورة دي موجودة في مكتبة الوسائط قبل كده — استخدمنا نفس النسخة من غير ما نرفعها تاني");
    } catch (e) {
      setError(describeWriteError(e, "POST /media"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <Field label={label} hint={hint} badge={badge}>
      <div className="space-y-2">
        <div
          className={`mx-auto grid w-full place-items-center overflow-hidden rounded-2xl border border-dashed border-border bg-muted/30 ${
            aspect === "wide" ? "aspect-video max-h-[26rem]" : "aspect-[4/3] max-h-[22rem]"
          }`}
        >
          {preview ? (
            <img src={preview} alt="" className="h-full w-full object-contain"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/placeholder.svg"; }} />
          ) : (
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <ImagePlus className="h-7 w-7" />
              <span className="text-[11px] font-semibold">ارفع صورة أو الصق رابطها</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <label className={`inline-flex h-9 shrink-0 cursor-pointer items-center gap-1 rounded-xl border border-input bg-background px-3 text-xs font-bold hover:bg-muted ${uploading ? "pointer-events-none opacity-60" : ""}`}>
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />} رفع
            <input type="file" accept={MEDIA_ACCEPT.join(",")} className="hidden" disabled={uploading} onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) void upload(f);
            }} />
          </label>
          <Input dir="ltr" value={value} placeholder="https://… رابط الصورة" className="h-9 min-w-0 flex-1 rounded-xl font-mono text-xs"
            onChange={(e) => { setError(""); onChange(e.target.value.trim()); }} />
          <Button type="button" size="icon" variant="outline" className="h-9 w-9 shrink-0 rounded-xl" title="اختيار من مكتبة الوسائط" onClick={() => setPickerOpen(true)}>
            <FolderOpen className="h-4 w-4" />
          </Button>
          {value && (
            <Button type="button" size="icon" variant="ghost" className="h-9 w-9 shrink-0 rounded-xl text-destructive" title="إزالة الصورة" onClick={() => onChange("")}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {error && <p className="text-[11px] font-bold text-destructive">{error}</p>}
      </div>
      <MediaPickerModal
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        currentValue={value}
        title={label}
        onSelect={(url) => { onChange(url); setPickerOpen(false); }}
      />
    </Field>
  );
}

/** Radix Select can't hold "" as a value: this stands for "nothing chosen". */
const NONE = "__none__";

/**
 * Styled dropdown (design-system Select) for admin forms. `noneLabel` adds a first option that
 * maps to "" (e.g. «بدون محور»).
 */
export function ChoiceSelect({
  value,
  onChange,
  options,
  noneLabel,
  placeholder = "اختر…",
  disabled,
  className,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: ReactNode }[];
  noneLabel?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <Select dir="rtl" value={value || (noneLabel ? NONE : undefined)} onValueChange={(v) => onChange(v === NONE ? "" : v)} disabled={disabled}>
      <SelectTrigger className={`h-10 rounded-xl text-sm ${className ?? ""}`} dir="rtl" aria-label={ariaLabel}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent dir="rtl" className="max-h-80">
        {noneLabel && <SelectItem value={NONE} className="text-right text-muted-foreground">{noneLabel}</SelectItem>}
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value} className="text-right">{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
