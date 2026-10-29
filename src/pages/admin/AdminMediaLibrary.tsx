import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useLang } from "@/i18n/LangContext";
import { ChoiceSelect } from "@/components/admin/programs/FormKit";
import { describeWriteError, isEndpointMissing, BACKEND_PENDING_AR } from "@/data/api/backendPending";
import {
  listMedia,
  uploadMedia,
  deleteMedia,
  MEDIA_COLLECTIONS,
  MEDIA_COLLECTION_LABELS_AR,
  MEDIA_ACCEPT,
  MEDIA_MAX_BYTES,
  type MediaCollection,
  type MediaFile,
} from "@/data/api/mediaApi";
import {
  Search,
  Upload,
  Loader2,
  Check,
  Copy,
  Image as ImageIcon,
  RefreshCw,
  Trash2,
  ExternalLink,
} from "lucide-react";

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

/**
 * Media library: files under the backend's media/{collection}/ folder (GET/POST/DELETE /media).
 * The public photo gallery is managed separately in /admin/gallery.
 */
export default function AdminMediaLibrary() {
  const { lang } = useLang();
  const isAr = lang === "ar";

  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pendingBackend, setPendingBackend] = useState(false);
  const [search, setSearch] = useState("");
  const [collection, setCollection] = useState<MediaCollection | "">("");
  const [uploadTo, setUploadTo] = useState<MediaCollection>("blog");
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [deletingPath, setDeletingPath] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setFiles(await listMedia({ collection }));
      setPendingBackend(false);
    } catch (err) {
      if (isEndpointMissing(err)) setPendingBackend(true);
      else toast.error(describeWriteError(err));
    } finally {
      setLoading(false);
    }
  }, [collection]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return files;
    return files.filter((f) => f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q));
  }, [files, search]);

  const handleUpload = async (list: FileList) => {
    const picked = Array.from(list);
    const bad = picked.find((f) => !MEDIA_ACCEPT.includes(f.type) || f.size > MEDIA_MAX_BYTES);
    if (bad) {
      toast.error(
        isAr
          ? `«${bad.name}»: الصيغ المسموحة JPG و PNG و WebP و GIF و AVIF، والحد الأقصى 5 ميجابايت`
          : `"${bad.name}": allowed JPG, PNG, WebP, GIF, AVIF up to 5 MB`,
      );
      return;
    }

    setUploading(true);
    let ok = 0;
    try {
      for (const f of picked) {
        await uploadMedia(f, f.name, uploadTo);
        ok++;
      }
      toast.success(isAr ? `تم رفع ${ok} صورة إلى «${MEDIA_COLLECTION_LABELS_AR[uploadTo]}»` : `Uploaded ${ok} image(s)`);
    } catch (err) {
      toast.error(describeWriteError(err, "POST /media"));
    } finally {
      setUploading(false);
      if (ok) await load();
    }
  };

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url).catch(() => {});
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
    toast.success(isAr ? "تم نسخ الرابط ✓" : "URL copied ✓");
  };

  const handleDelete = async (f: MediaFile) => {
    if (!confirm(isAr ? "حذف الصورة نهائياً؟ أي مقال أو صفحة بتستخدم رابطها هتفقد الصورة." : "Delete this image permanently? Pages using its URL will lose it.")) return;
    setDeletingPath(f.path);
    try {
      await deleteMedia(f.path);
      setFiles((prev) => prev.filter((x) => x.path !== f.path));
      toast.success(isAr ? "تم حذف الصورة" : "Image deleted");
    } catch (err) {
      toast.error(describeWriteError(err, "DELETE /media"));
    } finally {
      setDeletingPath(null);
    }
  };

  return (
    <AdminLayout>
      <Helmet>
        <title>{isAr ? "مكتبة الوسائط" : "Media Library"} — Al-Yusr</title>
      </Helmet>

      <div dir={isAr ? "rtl" : "ltr"} className="text-start">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black text-primary">
              {isAr ? "مكتبة الوسائط" : "Media Library"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isAr
                ? "صور المقالات والصفحات وصور المشاركة — انسخ الرابط واستخدمه في أي مكان. معرض الصور العام له شاشة منفصلة."
                : "Images for articles, pages and share cards — copy a URL to use it anywhere. The public gallery has its own screen."}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-1.5">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              {isAr ? "تحديث" : "Refresh"}
            </Button>
            <ChoiceSelect
              value={uploadTo}
              onChange={(v) => setUploadTo(v as MediaCollection)}
              className="h-9 w-48"
              ariaLabel={isAr ? "مجلد الرفع" : "Upload folder"}
              options={MEDIA_COLLECTIONS.map((c) => ({ value: c, label: isAr ? `ارفع إلى: ${MEDIA_COLLECTION_LABELS_AR[c]}` : `Upload to: ${c}` }))}
            />
            <label className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-4 py-2 transition shadow-sm ${uploading || pendingBackend ? "opacity-60 pointer-events-none" : ""}`}>
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isAr ? "جاري الرفع..." : "Uploading..."}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  {isAr ? "رفع صور" : "Upload images"}
                </>
              )}
              <input
                type="file"
                accept={MEDIA_ACCEPT.join(",")}
                multiple
                className="hidden"
                disabled={uploading || pendingBackend}
                onChange={(e) => {
                  if (e.target.files?.length) handleUpload(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        </div>

        {pendingBackend && (
          <Card className="mb-5 border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            {BACKEND_PENDING_AR}: <span dir="ltr" className="font-mono">GET/POST/DELETE /media</span>
          </Card>
        )}

        {/* Filters */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isAr ? "ابحث باسم الملف..." : "Search by file name..."}
              className="ps-10"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(["", ...MEDIA_COLLECTIONS] as const).map((c) => (
              <Button
                key={c || "all"}
                type="button"
                size="sm"
                variant={collection === c ? "default" : "outline"}
                onClick={() => setCollection(c)}
              >
                {c ? (isAr ? MEDIA_COLLECTION_LABELS_AR[c] : c) : isAr ? "الكل" : "All"}
              </Button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center h-60 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            <p className="text-sm text-muted-foreground">
              {isAr ? "جاري تحميل الصور من السيرفر..." : "Loading images from server..."}
            </p>
          </div>
        )}

        {/* Empty */}
        {!loading && !pendingBackend && filtered.length === 0 && (
          <Card className="flex flex-col items-center justify-center h-60 gap-3 text-center border-dashed">
            <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
            <div>
              <p className="text-sm font-bold text-foreground">
                {search
                  ? (isAr ? "لا توجد صور مطابقة للبحث" : "No images match your search")
                  : (isAr ? "لا توجد صور في هذا المجلد" : "No images in this folder")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {isAr ? "ارفع صورة جديدة لتظهر هنا" : "Upload an image to get started"}
              </p>
            </div>
          </Card>
        )}

        {/* Grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filtered.map((f) => {
              const isDeleting = deletingPath === f.path;
              return (
                <Card
                  key={f.path}
                  className="group relative overflow-hidden rounded-xl border border-border/80 hover:border-emerald-500/50 hover:shadow-md transition-all bg-card"
                >
                  <div className="relative aspect-square w-full bg-muted overflow-hidden">
                    <img
                      src={f.url}
                      alt={f.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    {/* Hover actions */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => handleCopy(f.url)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-gray-800 hover:bg-white transition shadow-sm"
                        title={isAr ? "نسخ الرابط" : "Copy URL"}
                      >
                        {copiedUrl === f.url ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-gray-800 hover:bg-white transition shadow-sm"
                        title={isAr ? "فتح الصورة" : "Open image"}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDelete(f)}
                        disabled={isDeleting}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/90 text-white hover:bg-red-600 transition shadow-sm disabled:opacity-50"
                        title={isAr ? "حذف" : "Delete"}
                      >
                        {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="p-2 flex flex-col gap-0.5">
                    <span
                      className="text-[11px] font-bold text-foreground truncate cursor-pointer hover:text-emerald-600"
                      dir="ltr"
                      title={f.url}
                      onClick={() => handleCopy(f.url)}
                    >
                      {f.name}
                    </span>
                    <span className="text-[9.5px] text-muted-foreground/80 truncate">
                      {(isAr ? MEDIA_COLLECTION_LABELS_AR[f.collection as MediaCollection] : f.collection) || f.collection} · {formatSize(f.size)}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {!loading && files.length > 0 && (
          <div className="mt-6 text-center text-xs text-muted-foreground">
            {isAr
              ? `إجمالي: ${files.length} صورة${search ? ` — ${filtered.length} نتيجة` : ""}`
              : `Total: ${files.length} images${search ? ` — ${filtered.length} matching` : ""}`}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
