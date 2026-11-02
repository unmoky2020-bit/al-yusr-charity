import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Plus, Trash2, Upload, Loader2, ArrowUp, ArrowDown,
  Eye, EyeOff, Star, Pencil, Image as ImageIcon, Link2,
  Search, RefreshCw, ExternalLink, Copy, CheckCircle2,
} from "lucide-react";
import {
  GALLERY_PROGRAMS,
  GalleryRow,
  deleteGalleryImage,
  listAllGalleryImages,
  moveGalleryImage,
  programLabel,
  toggleGalleryFeatured,
  toggleGalleryPublished,
  uploadGalleryImage,
  upsertGalleryImage,
  deduplicateGalleryImages,
  takeLibraryImage,
} from "@/data/galleryApi";
import { MediaPickerModal } from "@/components/admin/MediaPickerModal";
import { formatServerImageUrl } from "@/data/laravelApi";
import { apiErrorMessage } from "@/data/api/adminApiHelpers";
import { useLang } from "@/i18n/LangContext";

/* ─── Form state ───────────────────────────────────────────────────────────── */
type FormState = {
  id?: string;
  title_ar: string; title_en: string;
  caption_ar: string; caption_en: string;
  alt_ar: string; alt_en: string;
  image_url: string;
  storage_path: string | null;
  program_slug: string;
  city: string;
  donate_program: string;
  is_published: boolean;
  is_featured: boolean;
  sort_order: number;
  width: number | null;
  height: number | null;
};

const empty = (): FormState => ({
  title_ar: "", title_en: "",
  caption_ar: "", caption_en: "",
  alt_ar: "", alt_en: "",
  image_url: "", storage_path: null,
  program_slug: "general", city: "", donate_program: "",
  is_published: true, is_featured: false, sort_order: 0,
  width: null, height: null,
});

const fromRow = (r: GalleryRow): FormState => ({
  id: r.id,
  title_ar: r.title_ar || "", title_en: r.title_en || "",
  caption_ar: r.caption_ar || "", caption_en: r.caption_en || "",
  alt_ar: (r as any).alt_ar || r.title_ar || "",
  alt_en: (r as any).alt_en || r.title_en || "",
  image_url: r.image_url, storage_path: r.storage_path,
  program_slug: r.program_slug || "general",
  city: r.city || "", donate_program: r.donate_program || "",
  is_published: r.is_published, is_featured: r.is_featured,
  sort_order: r.sort_order || 0,
  width: r.width, height: r.height,
});

/* ─── Clipboard helper ─────────────────────────────────────────────────────── */
function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(text);
      setTimeout(() => setCopied(null), 1500);
    });
  }, []);
  return { copy, copied };
}

/* ─── Image card ───────────────────────────────────────────────────────────── */
const ImageCard = ({
  r, isRTL, lang, onEdit, onTogglePub, onToggleFeat, onMove, onDelete, onCopyUrl,
}: {
  r: GalleryRow; isRTL: boolean; lang: "ar" | "en";
  onEdit: () => void; onTogglePub: () => void; onToggleFeat: () => void;
  onMove: (d: -1 | 1) => void; onDelete: () => void; onCopyUrl: () => void;
}) => (
  <Card className="group overflow-hidden transition-shadow hover:shadow-md">
    <div className="relative aspect-[4/3] bg-muted overflow-hidden">
      <img
        src={r.image_url}
        alt={isRTL ? r.title_ar : r.title_en}
        loading="lazy"
        decoding="async"
        width={r.width ?? undefined}
        height={r.height ?? undefined}
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
      />
      {/* badges */}
      <div className="absolute start-2 top-2 flex gap-1">
        {r.is_featured && <Badge className="bg-amber-500 text-white px-1 py-0.5 text-[10px]"><Star className="h-2.5 w-2.5" /></Badge>}
        {!r.is_published && <Badge variant="secondary" className="text-[10px]">{isRTL ? "مخفي" : "Hidden"}</Badge>}
      </div>
      <Badge variant="outline" className="absolute end-2 top-2 bg-card/90 text-[10px] backdrop-blur">
        {programLabel(r.program_slug, lang)}
      </Badge>
      {/* hover overlay */}
      <div className="absolute inset-0 flex items-end justify-end gap-1 p-2 opacity-0 transition-opacity group-hover:opacity-100">
        <Button size="sm" variant="secondary" className="h-7 w-7 p-0 shadow" onClick={onCopyUrl} title="Copy URL">
          <Copy className="h-3 w-3" />
        </Button>
        <a href={r.image_url} target="_blank" rel="noopener noreferrer">
          <Button size="sm" variant="secondary" className="h-7 w-7 p-0 shadow" title="Open in tab">
            <ExternalLink className="h-3 w-3" />
          </Button>
        </a>
      </div>
    </div>
    <div className="space-y-2 p-3">
      <div className="text-sm font-bold line-clamp-1 text-start">
        {isRTL ? (r.title_ar || r.title_en) : (r.title_en || r.title_ar)}
      </div>
      {r.city && <div className="text-xs text-muted-foreground text-start">{r.city}</div>}
      {/* dimensions hint */}
      {r.width && r.height && (
        <div className="text-[10px] text-muted-foreground/60">{r.width}×{r.height}px</div>
      )}
      <div className="flex flex-wrap items-center gap-1 pt-1">
        <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={onEdit} title={isRTL ? "تعديل" : "Edit"}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={onTogglePub} title={isRTL ? "نشر/إخفاء" : "Publish/Hide"}>
          {r.is_published ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
        </Button>
        <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={onToggleFeat} title={isRTL ? "تثبيت" : "Feature"}>
          <Star className={`h-3.5 w-3.5 ${r.is_featured ? "fill-amber-500 text-amber-500" : ""}`} />
        </Button>
        <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => onMove(-1)} title="Move up">
          <ArrowUp className="h-3.5 w-3.5" />
        </Button>
        <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => onMove(1)} title="Move down">
          <ArrowDown className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="sm" variant="ghost"
          className="ms-auto h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
          onClick={onDelete} title={isRTL ? "حذف" : "Delete"}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  </Card>
);

/* ─── Main component ───────────────────────────────────────────────────────── */
const AdminGallery = () => {
  const { lang } = useLang();
  const isRTL = lang === "ar";

  const [rows, setRows] = useState<GalleryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterProgram, setFilterProgram] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "published" | "hidden" | "featured">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(empty());
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"upload" | "library" | "url">("upload");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { copy, copied } = useCopy();

  const [cleaning, setCleaning] = useState(false);

  /* ── data fetch ── */
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listAllGalleryImages();
      setRows(data);
    } catch (e) {
      toast.error(isRTL ? "تعذّر تحميل الصور" : "Failed to load images", { description: apiErrorMessage(e) });
    } finally {
      setLoading(false);
    }
  }, [isRTL]);

  const handleCleanDuplicates = useCallback(async (silent = false) => {
    setCleaning(true);
    try {
      const res = await deduplicateGalleryImages();
      if (res.deleted > 0) {
        if (!silent) {
          toast.success(isRTL ? `تم حذف ${res.deleted} صورة مكررة بنجاح!` : `Successfully deleted ${res.deleted} duplicate images!`);
        }
        await reload();
      } else if (!silent) {
        toast.info(isRTL ? "لا توجد صور مكررة." : "No duplicate images found.");
      }
    } catch (e: any) {
      if (!silent) {
        toast.error(isRTL ? "فشل إزالة التكرار" : "Failed to remove duplicates");
      }
    } finally {
      setCleaning(false);
    }
  }, [isRTL, reload]);

  useEffect(() => {
    const init = async () => {
      await reload();
      // Auto-clean duplicates on mount silently
      await handleCleanDuplicates(true);
    };
    init();
  }, [reload, handleCleanDuplicates]);

  /* ── filtering (memoized) ── */
  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (filterProgram !== "all" && r.program_slug !== filterProgram) return false;
      if (filterStatus === "published" && !r.is_published) return false;
      if (filterStatus === "hidden" && r.is_published) return false;
      if (filterStatus === "featured" && !r.is_featured) return false;
      if (!s) return true;
      return (
        r.title_ar.toLowerCase().includes(s) ||
        r.title_en.toLowerCase().includes(s) ||
        (r.city || "").toLowerCase().includes(s) ||
        (r.caption_ar || "").toLowerCase().includes(s) ||
        (r.caption_en || "").toLowerCase().includes(s)
      );
    });
  }, [rows, search, filterProgram, filterStatus]);

  const stats = useMemo(() => ({
    total: rows.length,
    published: rows.filter((r) => r.is_published).length,
    featured: rows.filter((r) => r.is_featured).length,
    hidden: rows.filter((r) => !r.is_published).length,
  }), [rows]);

  /* ── dialog helpers ── */
  const openNew = () => {
    setForm({ ...empty(), sort_order: (rows.at(-1)?.sort_order || 0) + 10 });
    setTab("upload");
    setDialogOpen(true);
  };
  const openEdit = (r: GalleryRow) => {
    setForm(fromRow(r));
    setTab(r.storage_path ? "upload" : "url");
    setDialogOpen(true);
  };

  /* ── upload ── */
  const onPickFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error(isRTL ? "الملف ليس صورة" : "File is not an image");
      return;
    }
    setUploading(true);
    try {
      const res = await uploadGalleryImage(file);
      const name = file.name.replace(/\.[^.]+$/, "");
      setForm((f) => ({
        ...f,
        image_url: res.url,
        storage_path: res.path,
        width: res.width || null,
        height: res.height || null,
        title_ar: f.title_ar || name,
        alt_ar: f.alt_ar || name,
        alt_en: f.alt_en || name,
      }));
      toast.success(res.reused
        ? (isRTL ? "الصورة دي موجودة على السيرفر قبل كده — استخدمنا نفس النسخة من غير ما نرفعها تاني" : "This image was already stored — reused it")
        : (isRTL ? "تم رفع الصورة بنجاح" : "Image uploaded successfully"));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error((isRTL ? "فشل الرفع: " : "Upload failed: ") + msg);
    } finally {
      setUploading(false);
    }
  };

  /* drag-and-drop */
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onPickFile(file);
  };

  /* ── save ── */
  const onSave = async () => {
    if (!form.image_url) {
      toast.error(isRTL ? "اختر صورة أو ألصق رابطًا" : "Choose an image or paste a URL");
      return;
    }
    if (!form.title_ar && !form.title_en) {
      toast.error(isRTL ? "أدخل عنوان عربي أو إنجليزي على الأقل" : "Enter at least one title");
      return;
    }
    setSaving(true);
    try {
      await upsertGalleryImage({
        id: form.id,
        title_ar: form.title_ar,
        title_en: form.title_en,
        caption_ar: form.caption_ar || null,
        caption_en: form.caption_en || null,
        image_url: form.image_url,
        storage_path: form.storage_path,
        program_slug: form.program_slug,
        city: form.city || null,
        donate_program: form.donate_program || null,
        is_published: form.is_published,
        is_featured: form.is_featured,
        sort_order: form.sort_order,
        width: form.width,
        height: form.height,
      });
      toast.success(isRTL ? "تم الحفظ بنجاح" : "Saved successfully");
      setDialogOpen(false);
      await reload();
    } catch (e: unknown) {
      toast.error((isRTL ? "فشل الحفظ: " : "Save failed: ") + apiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  /* ── delete ── */
  const onDelete = async (r: GalleryRow) => {
    if (!confirm(isRTL ? `حذف "${r.title_ar || r.title_en}" نهائيًا؟` : `Delete "${r.title_en || r.title_ar}" permanently?`)) return;
    try {
      await deleteGalleryImage(r);
      toast.success(isRTL ? "تم الحذف" : "Deleted");
      setRows((rs) => rs.filter((x) => x.id !== r.id));
    } catch (e) {
      toast.error(isRTL ? "فشل الحذف" : "Delete failed", { description: apiErrorMessage(e) });
    }
  };

  const togglePub = async (r: GalleryRow) => {
    try {
      await toggleGalleryPublished(r.id, !r.is_published);
      setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, is_published: !r.is_published } : x)));
    } catch (e) { toast.error(isRTL ? "فشل التحديث" : "Update failed", { description: apiErrorMessage(e) }); }
  };

  const toggleFeat = async (r: GalleryRow) => {
    try {
      await toggleGalleryFeatured(r.id, !r.is_featured);
      setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, is_featured: !r.is_featured } : x)));
    } catch (e) { toast.error(isRTL ? "فشل التحديث" : "Update failed", { description: apiErrorMessage(e) }); }
  };

  const move = async (r: GalleryRow, dir: -1 | 1) => {
    try {
      await moveGalleryImage(filtered, r.id, dir);
    } catch (e) {
      toast.error(isRTL ? "فشل حفظ الترتيب" : "Failed to save order", { description: apiErrorMessage(e) });
    }
    await reload();
  };

  return (
    <AdminLayout>
      <Helmet>
        <title>{isRTL ? "مكتبة الصور | لوحة التحكم" : "Image Library | Admin"}</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <div className="space-y-5">
        {/* ── Header ── */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-primary">
              {isRTL ? "مكتبة الصور" : "Image Library"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isRTL
                ? "ارفع، صنّف، ورتّب صور المعرض وعزّز أداء السيو وسرعة التحميل"
                : "Upload, organize, and optimize gallery images for maximum SEO and page load speed"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={reload} disabled={loading} title={isRTL ? "تحديث" : "Refresh"}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Button onClick={openNew} className="bg-orange-grad text-accent-foreground shadow-cta">
              <Plus className="h-4 w-4" />
              {isRTL ? "إضافة صورة" : "Add image"}
            </Button>
          </div>
        </div>

        {/* ── Stats bar ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: isRTL ? "إجمالي" : "Total", value: stats.total, color: "text-primary" },
            { label: isRTL ? "منشورة" : "Published", value: stats.published, color: "text-green-600" },
            { label: isRTL ? "مخفية" : "Hidden", value: stats.hidden, color: "text-orange-500" },
            { label: isRTL ? "مثبتة" : "Featured", value: stats.featured, color: "text-amber-500" },
          ].map((s) => (
            <Card key={s.label} className="p-3 text-center">
              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </Card>
          ))}
        </div>

        {/* ── Filter bar ── */}
        <Card className="p-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* search */}
            <div className="relative flex-1 min-w-48">
              <Search className="pointer-events-none absolute start-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isRTL ? "ابحث بالعنوان أو المدينة..." : "Search title or city..."}
                className="ps-8"
              />
            </div>
            {/* program filter */}
            <Select value={filterProgram} onValueChange={setFilterProgram}>
              <SelectTrigger dir={isRTL ? "rtl" : "ltr"} className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent dir={isRTL ? "rtl" : "ltr"}>
                <SelectItem value="all">{isRTL ? "كل البرامج" : "All programs"}</SelectItem>
                {GALLERY_PROGRAMS.map((p) => (
                  <SelectItem key={p.slug} value={p.slug}>{isRTL ? p.label_ar : p.label_en}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* status filter */}
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as typeof filterStatus)}>
              <SelectTrigger dir={isRTL ? "rtl" : "ltr"} className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent dir={isRTL ? "rtl" : "ltr"}>
                <SelectItem value="all">{isRTL ? "الكل" : "All"}</SelectItem>
                <SelectItem value="published">{isRTL ? "منشورة" : "Published"}</SelectItem>
                <SelectItem value="hidden">{isRTL ? "مخفية" : "Hidden"}</SelectItem>
                <SelectItem value="featured">{isRTL ? "مثبتة" : "Featured"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* ── Grid ── */}
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground">
            <ImageIcon className="mx-auto mb-3 h-12 w-12 opacity-30" />
            <p className="font-semibold">
              {rows.length === 0
                ? (isRTL ? "لا توجد صور بعد. ابدأ بإضافة صورة جديدة." : "No images yet. Add your first image.")
                : (isRTL ? "لا توجد نتائج للبحث الحالي." : "No results for the current search.")}
            </p>
            {rows.length === 0 && (
              <Button className="mt-4 bg-orange-grad text-accent-foreground" onClick={openNew}>
                <Plus className="h-4 w-4" /> {isRTL ? "إضافة أول صورة" : "Add first image"}
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filtered.map((r) => (
              <ImageCard
                key={r.id}
                r={r}
                isRTL={isRTL}
                lang={lang}
                onEdit={() => openEdit(r)}
                onTogglePub={() => togglePub(r)}
                onToggleFeat={() => toggleFeat(r)}
                onMove={(d) => move(r, d)}
                onDelete={() => onDelete(r)}
                onCopyUrl={() => copy(r.image_url)}
              />
            ))}
          </div>
        )}

        {/* copied toast inside grid area */}
        {copied && (
          <div className="fixed bottom-6 start-1/2 z-50 -translate-x-1/2 rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground shadow-lg flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            {isRTL ? "تم نسخ الرابط!" : "URL copied!"}
          </div>
        )}

        {/* ── Add / Edit Dialog ── */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto" dir={isRTL ? "rtl" : "ltr"}>
            <DialogHeader>
              <DialogTitle>
                {form.id
                  ? (isRTL ? "تعديل الصورة" : "Edit image")
                  : (isRTL ? "إضافة صورة جديدة" : "Add new image")}
              </DialogTitle>
            </DialogHeader>

            {/* ── Tab: upload / url ── */}
            <div className="flex gap-2 rounded-xl border border-border p-1 bg-muted/40">
              {(["upload", "library", "url"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setTab(t); if (t === "library") setPickerOpen(true); }}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition
                    ${tab === t ? "bg-card shadow text-primary" : "text-muted-foreground hover:text-primary"}`}
                >
                  {t === "upload" ? <Upload className="h-3.5 w-3.5" /> : t === "library" ? <ImageIcon className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
                  {t === "upload" ? (isRTL ? "رفع ملف" : "Upload file") : t === "library" ? (isRTL ? "من مكتبة الوسائط" : "From library") : (isRTL ? "رابط خارجي" : "External URL")}
                </button>
              ))}
            </div>

            {tab === "library" ? (
              <div className="space-y-2">
                <button type="button" onClick={() => setPickerOpen(true)}
                  className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border p-3 text-muted-foreground transition hover:border-primary/50">
                  {form.image_url ? (
                    <img src={formatServerImageUrl(form.image_url) || form.image_url} alt="" className="max-h-56 w-full rounded-xl object-contain" />
                  ) : (
                    <ImageIcon className="my-6 h-10 w-10 opacity-40" />
                  )}
                  <span className="text-sm font-bold text-primary">{isRTL ? (form.image_url ? "غيّر الصورة من المكتبة" : "اختار صورة من مكتبة الوسائط") : "Choose from the media library"}</span>
                  <span className="text-xs opacity-70">{isRTL ? "صورة متخزنة قبل كده — مش هتترفع تاني" : "An image already stored — not uploaded again"}</span>
                </button>
              </div>
            ) : tab === "upload" ? (
              <div
                className={`relative rounded-xl border-2 border-dashed transition-colors cursor-pointer
                  ${dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => !uploading && fileRef.current?.click()}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) onPickFile(f); e.currentTarget.value = ""; }}
                />
                {form.image_url ? (
                  <img src={form.image_url} alt="" className="max-h-56 w-full rounded-xl object-contain p-2" />
                ) : (
                  <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
                    {uploading
                      ? <Loader2 className="h-8 w-8 animate-spin" />
                      : <ImageIcon className="h-10 w-10 opacity-40" />}
                    <p className="text-sm font-medium">
                      {uploading
                        ? (isRTL ? "جارٍ الرفع والضغط..." : "Uploading & compressing...")
                        : (isRTL ? "اسحب صورة هنا أو انقر للاختيار" : "Drag image here or click to choose")}
                    </p>
                    <p className="text-xs opacity-60">{isRTL ? "حد أقصى 2MB — يتم الضغط تلقائياً" : "Max 2MB — auto-compressed"}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Input
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value, storage_path: null })}
                  placeholder="https://..."
                  dir="ltr"
                />
                {form.image_url && (
                  <img src={form.image_url} alt="" className="max-h-56 w-full rounded-xl object-contain border" />
                )}
              </div>
            )}

            {/* ── Image dimensions hint ── */}
            {form.width && form.height && (
              <div className="text-xs text-muted-foreground text-end">
                {form.width}×{form.height}px
                {form.image_url && (
                  <a href={form.image_url} target="_blank" rel="noopener noreferrer" className="ms-2 inline-flex items-center gap-0.5 text-primary hover:underline">
                    <ExternalLink className="h-3 w-3" /> {isRTL ? "عرض" : "View"}
                  </a>
                )}
              </div>
            )}

            {/* ── Fields ── */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>{isRTL ? "العنوان (عربي) *" : "Title (AR) *"}</Label>
                <Input dir="rtl" value={form.title_ar} onChange={(e) => setForm({ ...form, title_ar: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>{isRTL ? "العنوان (إنجليزي)" : "Title (EN)"}</Label>
                <Input dir="ltr" value={form.title_en} onChange={(e) => setForm({ ...form, title_en: e.target.value })} />
              </div>

              {/* SEO Alt text */}
              <div className="space-y-1">
                <Label className="flex items-center gap-1">
                  {isRTL ? "النص البديل للصورة (SEO) — عربي" : "Alt text (SEO) — AR"}
                  <Badge variant="outline" className="text-[9px] px-1">SEO</Badge>
                </Label>
                <Input dir="rtl" value={form.alt_ar} onChange={(e) => setForm({ ...form, alt_ar: e.target.value })}
                  placeholder={isRTL ? "وصف الصورة للبحث..." : "Image description for search..."} />
              </div>
              <div className="space-y-1">
                <Label className="flex items-center gap-1">
                  {isRTL ? "النص البديل للصورة (SEO) — إنجليزي" : "Alt text (SEO) — EN"}
                  <Badge variant="outline" className="text-[9px] px-1">SEO</Badge>
                </Label>
                <Input dir="ltr" value={form.alt_en} onChange={(e) => setForm({ ...form, alt_en: e.target.value })}
                  placeholder="Image description for search..." />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label>{isRTL ? "وصف قصير (عربي)" : "Caption (AR)"}</Label>
                <Textarea dir="rtl" rows={2} value={form.caption_ar} onChange={(e) => setForm({ ...form, caption_ar: e.target.value })} />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>{isRTL ? "وصف قصير (إنجليزي)" : "Caption (EN)"}</Label>
                <Textarea dir="ltr" rows={2} value={form.caption_en} onChange={(e) => setForm({ ...form, caption_en: e.target.value })} />
              </div>

              <div className="space-y-1">
                <Label>{isRTL ? "البرنامج" : "Program"}</Label>
                <Select value={form.program_slug} onValueChange={(v) => setForm({ ...form, program_slug: v })}>
                  <SelectTrigger dir={isRTL ? "rtl" : "ltr"}><SelectValue /></SelectTrigger>
                  <SelectContent dir={isRTL ? "rtl" : "ltr"}>
                    {GALLERY_PROGRAMS.map((p) => (
                      <SelectItem key={p.slug} value={p.slug}>{isRTL ? p.label_ar : p.label_en}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>{isRTL ? "المدينة (اختياري)" : "City (optional)"}</Label>
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>{isRTL ? "برنامج التبرع" : "Donate program key"}</Label>
                <Input dir="ltr" value={form.donate_program} onChange={(e) => setForm({ ...form, donate_program: e.target.value })} placeholder="odhya, box, water..." />
              </div>
              <div className="space-y-1">
                <Label>{isRTL ? "الترتيب" : "Sort order"}</Label>
                <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) || 0 })} />
              </div>

              {/* Copy URL field */}
              {form.image_url && (
                <div className="space-y-1 sm:col-span-2">
                  <Label>{isRTL ? "رابط الصورة" : "Image URL"}</Label>
                  <div className="flex gap-2">
                    <Input dir="ltr" readOnly value={form.image_url} className="font-mono text-xs text-muted-foreground" />
                    <Button type="button" variant="outline" size="sm" onClick={() => copy(form.image_url)}>
                      {copied === form.image_url ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Switch checked={form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} />
                <Label>{isRTL ? "منشورة للعموم" : "Published"}</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} />
                <Label>{isRTL ? "مثبتة في المقدمة" : "Featured"}</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>{isRTL ? "إلغاء" : "Cancel"}</Button>
              <Button onClick={onSave} disabled={saving || uploading} className="bg-orange-grad text-accent-foreground shadow-cta">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {isRTL ? "حفظ" : "Save"}
              </Button>
            </DialogFooter>
          <MediaPickerModal
              open={pickerOpen}
              onOpenChange={setPickerOpen}
              currentValue={form.image_url || null}
              title={isRTL ? "اختار صورة للمعرض من مكتبة الوسائط" : "Pick a gallery photo from the library"}
              onSelect={(url) => {
                const abs = takeLibraryImage(url);
                const name = decodeURIComponent(abs.split("/").pop() || "").replace(/\.[^.]+$/, "").replace(/^\d{8}-\d{6}-/, "").replace(/-[a-z0-9]{5}$/, "").replace(/-/g, " ");
                setForm((f) => ({ ...f, image_url: abs, storage_path: null, title_ar: f.title_ar || name, alt_ar: f.alt_ar || name }));
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminGallery;