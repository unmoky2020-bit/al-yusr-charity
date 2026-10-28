import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useLang } from "@/i18n/LangContext";
import {
  galleryApi,
  formatServerImageUrl,
  LaravelGalleryItem,
} from "@/data/laravelApi";
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

export default function AdminMediaLibrary() {
  const { lang } = useLang();
  const isAr = lang === "ar";

  const [images, setImages] = useState<LaravelGalleryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | string | null>(null);

  const loadGallery = useCallback(async () => {
    setLoading(true);
    try {
      const items = await galleryApi.listAll();
      if (Array.isArray(items)) {
        setImages(items);
      }
    } catch (err) {
      console.warn("Failed to load gallery:", err);
      toast.error(isAr ? "تعذر تحميل الصور من السيرفر" : "Failed to load images");
    } finally {
      setLoading(false);
    }
  }, [isAr]);

  useEffect(() => {
    loadGallery();
  }, [loadGallery]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return images;
    return images.filter((img) => {
      const tAr = (img.title_ar || "").toLowerCase();
      const tEn = (img.title_en || "").toLowerCase();
      const url = (img.image || img.external_url || "").toLowerCase();
      const city = (img.city || "").toLowerCase();
      const prog = (img.program || img.donation_program || "").toLowerCase();
      return tAr.includes(q) || tEn.includes(q) || url.includes(q) || city.includes(q) || prog.includes(q);
    });
  }, [images, search]);

  const handleUpload = async (file: File) => {
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/svg+xml", "image/gif", "image/jpg"];
    if (!allowed.includes(file.type)) {
      toast.error(isAr ? "صيغة غير مدعومة (JPG, PNG, WebP, SVG فقط)" : "Unsupported format");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error(isAr ? "الحجم يتجاوز 10 ميجابايت" : "File exceeds 10MB");
      return;
    }

    setUploading(true);
    try {
      // Duplicate detection by filename
      const cleanName = file.name.toLowerCase().trim();
      const duplicate = images.find((item) => {
        const itemUrl = (item.image || item.external_url || "").toLowerCase();
        const titleAr = (item.title_ar || "").toLowerCase();
        const titleEn = (item.title_en || "").toLowerCase();
        return itemUrl.endsWith(cleanName) || titleAr === cleanName || titleEn === cleanName;
      });

      if (duplicate && (duplicate.image || duplicate.external_url)) {
        const existingUrl = duplicate.image || duplicate.external_url || "";
        toast.info(
          isAr
            ? `\u26a0\ufe0f هذه الصورة موجودة مسبقاً في المكتبة: ${existingUrl}`
            : `\u26a0\ufe0f This image already exists in the library: ${existingUrl}`,
          { duration: 6000 }
        );
        return;
      }

      await galleryApi.uploadImage(file, file.name.replace(/\.[^.]+$/, "") || "صورة مرفوعة");
      toast.success(isAr ? "تم رفع الصورة وإضافتها للمكتبة بنجاح ✓" : "Image uploaded and added to library ✓");
      await loadGallery();
    } catch (err: any) {
      toast.error(err.message || (isAr ? "فشل رفع الصورة للسيرفر" : "Failed to upload image"));
    } finally {
      setUploading(false);
    }
  };

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url).catch(() => {});
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
    toast.success(isAr ? "تم نسخ الرابط ✓" : "URL copied ✓");
  };

  const handleDelete = async (img: LaravelGalleryItem) => {
    if (!confirm(isAr ? "هل تريد حذف هذه الصورة نهائياً؟" : "Delete this image permanently?")) return;
    setDeletingId(img.id);
    try {
      await galleryApi.remove(String(img.id));
      setImages((prev) => prev.filter((i) => i.id !== img.id));
      toast.success(isAr ? "تم حذف الصورة" : "Image deleted");
    } catch (err: any) {
      toast.error(err.message || (isAr ? "فشل الحذف" : "Delete failed"));
    } finally {
      setDeletingId(null);
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
                ? `${images.length} صورة محفوظة على السيرفر — ارفع صورة جديدة أو ابحث واختر من الموجود`
                : `${images.length} images on server — upload new or search existing`}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={loadGallery}
              disabled={loading}
              className="gap-1.5"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              {isAr ? "تحديث" : "Refresh"}
            </Button>
            <label className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-4 py-2 transition shadow-sm ${uploading ? "opacity-60 pointer-events-none" : ""}`}>
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isAr ? "جاري الرفع..." : "Uploading..."}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  {isAr ? "رفع صورة جديدة" : "Upload Image"}
                </>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUpload(f);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        </div>

        {/* Search */}
        <div className="mb-5 relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isAr ? "ابحث باسم الصورة أو مسارها أو البرنامج..." : "Search by title, URL or program..."}
            className="ps-10"
          />
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
        {!loading && filtered.length === 0 && (
          <Card className="flex flex-col items-center justify-center h-60 gap-3 text-center border-dashed">
            <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
            <div>
              <p className="text-sm font-bold text-foreground">
                {search
                  ? (isAr ? "لا توجد صور مطابقة للبحث" : "No images match your search")
                  : (isAr ? "المكتبة فارغة" : "Library is empty")}
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
            {filtered.map((img) => {
              const imgUrl = img.image || img.external_url || "";
              const displayUrl = formatServerImageUrl(imgUrl) || imgUrl;
              const isDeleting = deletingId === img.id;

              return (
                <Card
                  key={img.id}
                  className="group relative overflow-hidden rounded-xl border border-border/80 hover:border-emerald-500/50 hover:shadow-md transition-all bg-card"
                >
                  <div className="relative aspect-square w-full bg-muted overflow-hidden">
                    <img
                      src={displayUrl}
                      alt={img.title_ar || "Image"}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24' fill='none' stroke='%2310b981' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect width='18' height='18' x='3' y='3' rx='2' ry='2'/%3E%3Ccircle cx='9' cy='9' r='2'/%3E%3Cpath d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/%3E%3C/svg%3E";
                      }}
                    />
                    {/* Hover actions */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => handleCopy(imgUrl)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-gray-800 hover:bg-white transition shadow-sm"
                        title={isAr ? "نسخ الرابط" : "Copy URL"}
                      >
                        {copiedUrl === imgUrl
                          ? <Check className="h-3.5 w-3.5 text-emerald-600" />
                          : <Copy className="h-3.5 w-3.5" />}
                      </button>
                      <a
                        href={displayUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-gray-800 hover:bg-white transition shadow-sm"
                        title={isAr ? "فتح الصورة" : "Open image"}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDelete(img)}
                        disabled={isDeleting}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/90 text-white hover:bg-red-600 transition shadow-sm disabled:opacity-50"
                        title={isAr ? "حذف" : "Delete"}
                      >
                        {isDeleting
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="p-2 flex flex-col gap-0.5">
                    <span className="text-[11px] font-bold text-foreground truncate" title={img.title_ar || ""}>
                      {img.title_ar || img.title_en || `صورة #${img.id}`}
                    </span>
                    <span
                      className="text-[9.5px] font-mono text-muted-foreground truncate cursor-pointer hover:text-emerald-600 transition"
                      dir="ltr"
                      title={imgUrl}
                      onClick={() => handleCopy(imgUrl)}
                    >
                      {imgUrl.split("/").pop() || imgUrl}
                    </span>
                    {(img.city || img.program) && (
                      <span className="text-[9.5px] text-muted-foreground/70 truncate">
                        {img.city || img.program}
                      </span>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {!loading && images.length > 0 && (
          <div className="mt-6 text-center text-xs text-muted-foreground">
            {isAr
              ? `إجمالي: ${images.length} صورة${search ? ` — ${filtered.length} نتيجة` : ""}`
              : `Total: ${images.length} images${search ? ` — ${filtered.length} matching` : ""}`}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
