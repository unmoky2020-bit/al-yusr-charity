import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Copy, ImagePlus, LayoutGrid, Loader2, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MediaPickerModal } from "@/components/admin/MediaPickerModal";
import { apiFetch, formatServerImageUrl } from "@/data/laravelApi";
import { listPublicCases } from "@/data/casesApi";
import { caseFunding, filterOpenCases } from "@/lib/caseFunding";
import type { MailBlock } from "@/data/api/newsletterCampaignsApi";
import { BLOCK_LABELS, EMAIL_HEROES } from "./mailStarters";
import { cn } from "@/lib/utils";

type CardItem = Omit<Extract<MailBlock, { type: "card" }>, "type">;

const SITE = "https://elyusr.org";
const abs = (u?: string | null) => (!u ? "" : u.startsWith("http") ? u : u.startsWith("/") ? `${SITE}${u}` : formatServerImageUrl(u));

/** An image field: paste a link, pick from the media library, or one of the ready email images. */
export function ImageField({ value, onChange, label = "الصورة" }: { value?: string; onChange: (url: string) => void; label?: string }) {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  return (
    <div className="space-y-1.5">
      <span className="text-xs font-bold text-muted-foreground">{label}</span>
      <div className="flex gap-2">
        {value ? <img src={abs(value)} alt="" className="h-10 w-16 shrink-0 rounded-md object-cover ring-1 ring-black/10" /> : null}
        <Input dir="ltr" value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder="https://… أو اختار" className="text-xs" />
        <Button type="button" variant="outline" size="icon" onClick={() => setOpen(true)} title="من مكتبة الوسائط"><ImagePlus className="h-4 w-4" /></Button>
        <Button type="button" variant="outline" size="icon" onClick={() => setReady((v) => !v)} title="صور جاهزة"><LayoutGrid className="h-4 w-4" /></Button>
        {value && <Button type="button" variant="ghost" size="icon" onClick={() => onChange("")} title="شيل الصورة"><X className="h-4 w-4" /></Button>}
      </div>
      {ready && (
        <div className="grid grid-cols-4 gap-1.5">
          {EMAIL_HEROES.map((h) => (
            <button key={h.url} type="button" onClick={() => { onChange(h.url); setReady(false); }} className="group overflow-hidden rounded-md ring-1 ring-black/10">
              <img src={h.url} alt={h.label} className="aspect-[2/1] w-full object-cover transition group-hover:scale-105" />
            </button>
          ))}
        </div>
      )}
      <MediaPickerModal open={open} onOpenChange={setOpen} currentValue={value} onSelect={(u) => { onChange(abs(u)); setOpen(false); }} title="اختار صورة للإيميل" />
    </div>
  );
}

/** Pick a live campaign, program or open case and turn it into an email card. */
export function EntityPicker({ open, onOpenChange, onPick }: { open: boolean; onOpenChange: (v: boolean) => void; onPick: (c: CardItem) => void }) {
  const [tab, setTab] = useState<"campaigns" | "cases" | "programs">("campaigns");
  const q = useQuery({
    queryKey: ["mail-entities", tab],
    enabled: open,
    queryFn: async (): Promise<CardItem[]> => {
      if (tab === "cases") {
        return filterOpenCases(await listPublicCases({ limit: 30 })).slice(0, 20).map((c) => {
          const f = caseFunding(c);
          return { title: c.title, text: "", image: abs(c.cover_image_url as string | undefined), url: `${SITE}/cases/${encodeURIComponent(String(c.ref_code ?? c.id))}`, cta: "ساهم في الحالة", raised: f.raised, target: f.need, badge: "حالة" };
        });
      }
      const path = tab === "campaigns" ? "/donation-campaigns" : "/programs";
      const res = await apiFetch<unknown>(path, { params: { per_page: 50 }, useCache: false });
      const rows = (Array.isArray(res) ? res : ((res as { data?: unknown })?.data as unknown[]) ?? []) as Record<string, unknown>[];
      const list = Array.isArray(rows) ? rows : ((rows as { data?: unknown[] }).data as Record<string, unknown>[]) ?? [];
      return list.filter((r) => r.is_active !== false && r.is_active !== 0).map((r) => {
        const title = String(r.title_ar ?? r.name_ar ?? r.title ?? r.name ?? "");
        const slug = String(r.slug ?? r.id);
        const target = Number(r.target_amount ?? 0) || undefined;
        return {
          title,
          text: String(r.subtitle_ar ?? r.short_description_ar ?? r.description_ar ?? r.description ?? "").replace(/<[^>]+>/g, "").slice(0, 120),
          image: abs((r.image ?? r.cover_image ?? r.image_url) as string | undefined),
          url: `${SITE}/${tab === "campaigns" ? "campaigns" : "programs"}/${encodeURIComponent(slug)}`,
          cta: tab === "campaigns" ? "ساهم في الحملة" : "تبرع الآن",
          raised: target ? Number(r.collected_amount ?? 0) : undefined,
          target,
        };
      }).filter((c) => c.title);
    },
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto" dir="rtl">
        <DialogHeader><DialogTitle>اختار حاجة من الموقع</DialogTitle></DialogHeader>
        <div className="flex gap-1 rounded-xl bg-muted p-1">
          {([["campaigns", "حملات"], ["cases", "حالات"], ["programs", "برامج"]] as const).map(([id, l]) => (
            <button key={id} type="button" onClick={() => setTab(id)} className={cn("flex-1 rounded-lg py-1.5 text-sm font-bold", tab === id ? "bg-background shadow-sm" : "text-muted-foreground")}>{l}</button>
          ))}
        </div>
        {q.isLoading ? <Loader2 className="mx-auto my-10 h-6 w-6 animate-spin text-primary" />
          : (q.data ?? []).length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">مفيش حاجة منشورة هنا دلوقتي.</p>
          : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {(q.data ?? []).map((c) => (
                <li key={c.url}>
                  <button type="button" onClick={() => { onPick(c); onOpenChange(false); }} className="flex w-full gap-3 rounded-xl border p-2 text-right transition hover:border-primary">
                    {c.image ? <img src={c.image} alt="" className="h-14 w-20 shrink-0 rounded-lg object-cover" /> : <div className="h-14 w-20 shrink-0 rounded-lg bg-muted" />}
                    <span className="min-w-0">
                      <b className="line-clamp-2 text-sm">{c.title}</b>
                      {c.target ? <span className="text-[11px] text-muted-foreground">{Math.round(((c.raised ?? 0) / c.target) * 100)}% من {c.target.toLocaleString("en-US")} ج.م</span> : null}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
      </DialogContent>
    </Dialog>
  );
}

function CardFields({ c, onChange, onPick }: { c: CardItem; onChange: (c: CardItem) => void; onPick: () => void }) {
  return (
    <div className="space-y-2 rounded-xl bg-muted/40 p-3">
      <Button type="button" variant="secondary" size="sm" onClick={onPick} className="w-full">اختار حملة / حالة / برنامج من الموقع</Button>
      <Input value={c.title} onChange={(e) => onChange({ ...c, title: e.target.value })} placeholder="العنوان" />
      <Textarea rows={2} value={c.text ?? ""} onChange={(e) => onChange({ ...c, text: e.target.value })} placeholder="سطرين عنها" />
      <ImageField value={c.image} onChange={(image) => onChange({ ...c, image })} />
      <div className="grid grid-cols-2 gap-2">
        <Input dir="ltr" value={c.url ?? ""} onChange={(e) => onChange({ ...c, url: e.target.value })} placeholder="الرابط" className="text-xs" />
        <Input value={c.cta ?? ""} onChange={(e) => onChange({ ...c, cta: e.target.value })} placeholder="كلمة الرابط" />
        <Input value={c.badge ?? ""} onChange={(e) => onChange({ ...c, badge: e.target.value })} placeholder="شارة (اختياري)" />
        <div className="flex gap-1">
          <Input type="number" value={c.raised ?? ""} onChange={(e) => onChange({ ...c, raised: e.target.value ? Number(e.target.value) : undefined })} placeholder="اتجمع" />
          <Input type="number" value={c.target ?? ""} onChange={(e) => onChange({ ...c, target: e.target.value ? Number(e.target.value) : undefined })} placeholder="المستهدف" />
        </div>
      </div>
    </div>
  );
}

/** Form for one block. */
export function BlockFields({ block, onChange }: { block: MailBlock; onChange: (b: MailBlock) => void }) {
  const [picker, setPicker] = useState<number | null>(null);
  const b = block;
  const pickerDialog = (apply: (c: CardItem) => void) => (
    <EntityPicker open={picker !== null} onOpenChange={(v) => !v && setPicker(null)} onPick={apply} />
  );
  switch (b.type) {
    case "heading":
      return <Input value={b.text} onChange={(e) => onChange({ ...b, text: e.target.value })} placeholder="العنوان الفرعي" className="font-bold" />;
    case "text":
    case "note":
      return (
        <div className="space-y-1">
          <Textarea rows={b.type === "text" ? 4 : 2} value={b.text} onChange={(e) => onChange({ ...b, text: e.target.value })} placeholder={b.type === "text" ? "اكتب الفقرة…" : "ملحوظة صغيرة"} />
          <p className="text-[11px] text-muted-foreground">**كلام عريض** · [كلمة الرابط](https://elyusr.org/…)</p>
        </div>
      );
    case "list":
      return (
        <div className="space-y-1.5">
          {b.items.map((it, i) => (
            <div key={i} className="flex gap-1">
              <Input value={it} onChange={(e) => onChange({ ...b, items: b.items.map((x, j) => (j === i ? e.target.value : x)) })} placeholder={`نقطة ${i + 1}`} />
              <Button type="button" variant="ghost" size="icon" onClick={() => onChange({ ...b, items: b.items.filter((_, j) => j !== i) })}><X className="h-4 w-4" /></Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => onChange({ ...b, items: [...b.items, ""] })}><Plus className="ml-1 h-3.5 w-3.5" /> نقطة</Button>
        </div>
      );
    case "image":
      return (
        <div className="space-y-2">
          <ImageField value={b.url} onChange={(url) => onChange({ ...b, url })} />
          <div className="grid grid-cols-2 gap-2">
            <Input value={b.caption ?? ""} onChange={(e) => onChange({ ...b, caption: e.target.value })} placeholder="تعليق تحت الصورة" />
            <Input dir="ltr" value={b.link ?? ""} onChange={(e) => onChange({ ...b, link: e.target.value })} placeholder="رابط عند الضغط" className="text-xs" />
          </div>
          <Input value={b.alt ?? ""} onChange={(e) => onChange({ ...b, alt: e.target.value })} placeholder="وصف الصورة (لو الصور مقفولة)" />
        </div>
      );
    case "button":
      return (
        <div className="grid grid-cols-2 gap-2">
          <Input value={b.label} onChange={(e) => onChange({ ...b, label: e.target.value })} placeholder="كلام الزرار" />
          <Input dir="ltr" value={b.url} onChange={(e) => onChange({ ...b, url: e.target.value })} placeholder="https://elyusr.org/…" className="text-xs" />
          <select value={b.variant ?? "primary"} onChange={(e) => onChange({ ...b, variant: e.target.value as "primary" | "secondary" })} className="h-9 rounded-md border bg-background px-2 text-sm">
            <option value="primary">برتقالي (أساسي)</option><option value="secondary">أبيض بإطار</option>
          </select>
          <select value={b.align ?? "right"} onChange={(e) => onChange({ ...b, align: e.target.value as "right" | "center" })} className="h-9 rounded-md border bg-background px-2 text-sm">
            <option value="right">يمين</option><option value="center">في النص</option>
          </select>
        </div>
      );
    case "quote":
      return (
        <div className="space-y-2">
          <Textarea rows={2} value={b.text} onChange={(e) => onChange({ ...b, text: e.target.value })} placeholder="الآية أو الدعاء" />
          <Input value={b.by ?? ""} onChange={(e) => onChange({ ...b, by: e.target.value })} placeholder="المصدر (اختياري)" />
        </div>
      );
    case "spacer":
      return <Input type="number" min={4} max={60} value={b.size ?? 16} onChange={(e) => onChange({ ...b, size: Number(e.target.value) })} />;
    case "stats":
      return (
        <div className="grid grid-cols-3 gap-2">
          {b.items.map((it, i) => (
            <div key={i} className="space-y-1">
              <Input value={it.value} onChange={(e) => onChange({ ...b, items: b.items.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)) })} placeholder="1,200" className="text-center font-black" />
              <Input value={it.label} onChange={(e) => onChange({ ...b, items: b.items.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} placeholder="أسرة" className="text-center text-xs" />
            </div>
          ))}
        </div>
      );
    case "card": {
      const { type: _t, ...c } = b;
      return (
        <>
          <CardFields c={c} onChange={(n) => onChange({ type: "card", ...n })} onPick={() => setPicker(0)} />
          {pickerDialog((n) => onChange({ type: "card", ...n }))}
        </>
      );
    }
    case "cards":
      return (
        <div className="space-y-2">
          {b.items.map((c, i) => (
            <div key={i} className="relative">
              <span className="mb-1 block text-[11px] font-bold text-muted-foreground">بطاقة {i + 1}</span>
              <CardFields c={c} onChange={(n) => onChange({ ...b, items: b.items.map((x, j) => (j === i ? n : x)) })} onPick={() => setPicker(i)} />
              {b.items.length > 1 && (
                <Button type="button" variant="ghost" size="sm" className="absolute left-0 top-0 h-6" onClick={() => onChange({ ...b, items: b.items.filter((_, j) => j !== i) })}>شيل</Button>
              )}
            </div>
          ))}
          {b.items.length < 4 && <Button type="button" variant="outline" size="sm" onClick={() => onChange({ ...b, items: [...b.items, { title: "", cta: "ساهم" }] })}><Plus className="ml-1 h-3.5 w-3.5" /> بطاقة</Button>}
          {pickerDialog((n) => onChange({ ...b, items: b.items.map((x, j) => (j === picker ? n : x)) }))}
        </div>
      );
    case "html":
      return <Textarea rows={6} dir="ltr" value={b.html} onChange={(e) => onChange({ ...b, html: e.target.value })} className="font-mono text-xs" />;
    default:
      return <p className="text-xs text-muted-foreground">مفيش إعدادات.</p>;
  }
}

/** The list of blocks with move / copy / delete per block. */
export function BlockList({ items, onChange }: { items: MailBlock[]; onChange: (items: MailBlock[]) => void }) {
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <ol className="space-y-3">
      {items.map((b, i) => (
        <li key={i} className="rounded-2xl border bg-card p-3 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-black text-primary">{i + 1}. {BLOCK_LABELS[b.type]}</span>
            <div className="flex">
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => move(i, -1)} disabled={i === 0} aria-label="لفوق"><ArrowUp className="h-3.5 w-3.5" /></Button>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="لتحت"><ArrowDown className="h-3.5 w-3.5" /></Button>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => onChange([...items.slice(0, i + 1), JSON.parse(JSON.stringify(b)), ...items.slice(i + 1)])} aria-label="نسخ"><Copy className="h-3.5 w-3.5" /></Button>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label="مسح"><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
          <BlockFields block={b} onChange={(n) => onChange(items.map((x, j) => (j === i ? n : x)))} />
        </li>
      ))}
    </ol>
  );
}
