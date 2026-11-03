import { UiSelect } from "@/components/common/UiSelect";
import { useEffect, useRef, useState } from "react";
import { Image as ImageIcon, Loader2, Trash2, ArrowUp, ArrowDown, Eye, EyeOff, Save, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLang } from "@/i18n/LangContext";
import { toast } from "@/hooks/use-toast";
import {
  listCaseMediaAdmin, createCaseMediaRow,
  updateCaseMedia, deleteCaseMedia, reorderCaseMedia,
  type CaseMediaRow, type CaseMediaKind,
} from "@/data/casesApi";
import { apiErrorMessage } from "@/data/api/adminApiHelpers";
import { compressImage } from "@/lib/image-compress";

const KINDS: { v: CaseMediaKind; ar: string; en: string }[] = [
  { v: "before",  ar: "قبل",     en: "Before" },
  { v: "during",  ar: "أثناء",   en: "During" },
  { v: "after",   ar: "بعد",     en: "After" },
  { v: "report",  ar: "تقرير",   en: "Report" },
  { v: "other",   ar: "أخرى",    en: "Other" },
];

const isVideo = (u: string) => /\.(mp4|webm|mov|m4v)(\?|$)/i.test(u);

export function CaseMediaManager({ caseId }: { caseId: string }) {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const [rows, setRows] = useState<CaseMediaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const showError = (e: unknown, title: string) =>
    toast({ title, description: apiErrorMessage(e), variant: "destructive" });

  const reload = async () => {
    try { setRows(await listCaseMediaAdmin(caseId)); }
    catch (e) { showError(e, isAr ? "تعذّر تحميل وسائط الحالة" : "Couldn't load case media"); }
    finally { setLoading(false); }
  };
  useEffect(() => { void reload(); /* eslint-disable-next-line */ }, [caseId]);

  const onPickFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const arr = Array.from(files);
    setProgress({ done: 0, total: arr.length });
    try {
      const baseOrder = rows.length;
      // Compress images client-side (skips video/svg/gif), then upload in parallel.
      const prepared = await Promise.all(
        arr.map(async (f) => f.type.startsWith("image/") ? await compressImage(f, { maxEdge: 1600, quality: 0.8 }) : f)
      );
      let done = 0;
      // Laravel POST /cases/{id}/media (multipart): stores the file and creates the row in one request.
      await Promise.all(prepared.map(async (f, i) => {
        await createCaseMediaRow({ case_id: caseId, file: f, kind: "other", is_public: true, sort_order: baseOrder + i });
        done += 1;
        setProgress({ done, total: arr.length });
      }));
      toast({ title: isAr ? ` تم رفع ${arr.length} ملف` : `✅ Uploaded ${arr.length} files` });
      await reload();
    } catch (e) {
      showError(e, isAr ? "فشل رفع الوسائط" : "Upload failed");
      void reload();
    }
    finally { setUploading(false); setProgress(null); if (fileInput.current) fileInput.current.value = ""; }
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= rows.length) return;
    const next = rows.slice();
    [next[idx], next[j]] = [next[j], next[idx]];
    setRows(next);
    try { await reorderCaseMedia(next, caseId); }
    catch (e) { showError(e, isAr ? "تعذّر حفظ الترتيب" : "Couldn't save the order"); void reload(); }
  };

  const remove = async (m: CaseMediaRow) => {
    if (!confirm(isAr ? "حذف هذه الوسائط نهائيًا؟" : "Delete this media permanently?")) return;
    try { await deleteCaseMedia(m.id, m.url); toast({ title: isAr ? "تم الحذف" : "Deleted" }); await reload(); }
    catch (e) { showError(e, isAr ? "تعذّر حذف الوسائط" : "Couldn't delete media"); }
  };

  return (
    <section className="rounded-2xl bg-card p-4 shadow-soft">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-black text-primary">
          <ImageIcon className="h-4 w-4" />{isAr ? `معرض الوسائط (${rows.length})` : `Media gallery (${rows.length})`}
        </h2>
        <div>
          <input
            ref={fileInput}
            type="file"
            accept="image/*,video/mp4,video/webm,video/quicktime"
            multiple
            className="hidden"
            onChange={(e) => onPickFiles(e.target.files)}
            aria-label={isAr ? "اختر ملفات للرفع" : "Pick files"}
          />
          <Button onClick={() => fileInput.current?.click()} disabled={uploading} className="bg-orange-grad text-accent-foreground">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading && progress
              ? (isAr ? `جاري الرفع ${progress.done}/${progress.total}` : `Uploading ${progress.done}/${progress.total}`)
              : (isAr ? "رفع وسائط (ضغط تلقائي)" : "Upload media (auto-compress)")}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid place-items-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center text-xs text-muted-foreground">
          {isAr ? "لا توجد وسائط بعد. ارفع صورًا أو فيديوهات لتظهر في صفحة الحالة." : "No media yet. Upload photos or videos to show on the public case page."}
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {rows.map((m, i) => (
            <li key={m.id} className="overflow-hidden rounded-2xl border border-border bg-background">
              <div className="aspect-video bg-muted">
                {isVideo(m.url)
                  ? <video src={m.url} controls preload="metadata" className="h-full w-full object-cover" />
                  : <img src={m.url} alt={m.caption_ar || m.caption_en || ""} loading="lazy" className="h-full w-full object-cover" />}
              </div>
              <MediaRowEditor row={m} index={i} total={rows.length} onMove={move} onRemove={remove} onSaved={reload} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function MediaRowEditor({
  row, index, total, onMove, onRemove, onSaved,
}: {
  row: CaseMediaRow; index: number; total: number;
  onMove: (i: number, dir: -1 | 1) => void;
  onRemove: (m: CaseMediaRow) => void;
  onSaved: () => void | Promise<void>;
}) {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const [draft, setDraft] = useState({
    kind: row.kind as CaseMediaKind,
    caption_ar: row.caption_ar ?? "",
    caption_en: row.caption_en ?? "",
    is_public: row.is_public,
  });
  const [saving, setSaving] = useState(false);

  const dirty =
    draft.kind !== row.kind ||
    (draft.caption_ar || "") !== (row.caption_ar ?? "") ||
    (draft.caption_en || "") !== (row.caption_en ?? "") ||
    draft.is_public !== row.is_public;

  const save = async () => {
    setSaving(true);
    try {
      await updateCaseMedia(row.id, {
        kind: draft.kind,
        caption_ar: draft.caption_ar.trim() || null,
        caption_en: draft.caption_en.trim() || null,
        is_public: draft.is_public,
      });
      toast({ title: isAr ? " تم الحفظ" : " Saved" });
      await onSaved();
    } catch (e) {
      toast({ title: isAr ? "تعذّر حفظ التعديلات" : "Couldn't save changes", description: apiErrorMessage(e), variant: "destructive" });
    }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-2 p-3">
      <div className="flex items-center justify-between gap-2">
        <UiSelect
          value={draft.kind}
          onChange={(e) => setDraft({ ...draft, kind: e.target.value as CaseMediaKind })}
          className="h-8 rounded-md border border-border bg-background px-2 text-xs font-bold"
          aria-label={isAr ? "نوع الوسائط" : "Media kind"}
        >
          {KINDS.map((k) => <option key={k.v} value={k.v}>{isAr ? k.ar : k.en}</option>)}
        </UiSelect>
        <div className="flex items-center gap-1">
          <button onClick={() => onMove(index, -1)} disabled={index === 0}
            className="grid h-8 w-8 place-items-center rounded-md bg-muted hover:bg-muted/70 disabled:opacity-30"
            aria-label={isAr ? "تحريك للأعلى" : "Move up"}><ArrowUp className="h-4 w-4" /></button>
          <button onClick={() => onMove(index, 1)} disabled={index === total - 1}
            className="grid h-8 w-8 place-items-center rounded-md bg-muted hover:bg-muted/70 disabled:opacity-30"
            aria-label={isAr ? "تحريك للأسفل" : "Move down"}><ArrowDown className="h-4 w-4" /></button>
          <button onClick={() => setDraft({ ...draft, is_public: !draft.is_public })}
            className={`grid h-8 w-8 place-items-center rounded-md ${draft.is_public ? "bg-secondary/20 text-primary" : "bg-muted text-muted-foreground"} hover:opacity-80`}
            aria-label={isAr ? "تبديل الظهور العام" : "Toggle public"}>
            {draft.is_public ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
          <button onClick={() => onRemove(row)}
            className="grid h-8 w-8 place-items-center rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20"
            aria-label={isAr ? "حذف" : "Delete"}><Trash2 className="h-4 w-4" /></button>
        </div>
      </div>
      <Input value={draft.caption_ar} onChange={(e) => setDraft({ ...draft, caption_ar: e.target.value })}
        placeholder={isAr ? "تعليق بالعربية" : "Arabic caption"} dir="rtl" />
      <Input value={draft.caption_en} onChange={(e) => setDraft({ ...draft, caption_en: e.target.value })}
        placeholder={isAr ? "تعليق بالإنجليزية" : "English caption"} dir="ltr" />
      {dirty && (
        <Button onClick={save} disabled={saving} className="h-8 w-full bg-orange-grad text-xs text-accent-foreground">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isAr ? "حفظ التعديلات" : "Save changes"}
        </Button>
      )}
    </div>
  );
}