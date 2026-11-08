import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search,
  Upload,
  Loader2,
  Check,
  Copy,
  Image as ImageIcon,
  RefreshCw,
  Layers,
} from "lucide-react";
import { formatServerImageUrl } from "@/data/laravelApi";
import { describeWriteError } from "@/data/api/backendPending";
import {
  listMedia,
  uploadMedia,
  MEDIA_ACCEPT,
  MEDIA_MAX_BYTES,
  MEDIA_COLLECTIONS,
  MEDIA_COLLECTION_LABELS_AR,
  type MediaCollection,
} from "@/data/api/mediaApi";

/** One media-library file, in the shape the grid below renders. */
type PickerImage = { id: string; image: string; preview?: string; external_url?: string; title_ar: string; title_en?: string; city?: string; program?: string; donation_program?: string; collection: string };
import { toast } from "sonner";
import { useLang } from "@/i18n/LangContext";

export interface MediaPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (url: string) => void;
  title?: string;
  currentValue?: string | null;
}

export const MediaPickerModal: React.FC<MediaPickerModalProps> = ({
  open,
  onOpenChange,
  onSelect,
  title,
  currentValue,
}) => {
  const { lang } = useLang();
  const isAr = lang === "ar";

  const [images, setImages] = useState<PickerImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [collection, setCollection] = useState<MediaCollection | "">("");
  const [selectedUrl, setSelectedUrl] = useState<string | null>(currentValue || null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const loadGallery = useCallback(async () => {
    setLoading(true);
    try {
      // The media library (GET /media) — the same files as /admin/media.
      // Every stored image (also older folders), without identical copies, so the same picture is reused.
      const files = (await listMedia({ scope: "all" })).filter((f) => !f.duplicate_of);
      setImages(files.map((f) => ({ id: f.path, image: f.url, preview: f.preview, title_ar: f.name, title_en: f.name, program: f.collection, collection: f.collection })));
    } catch (err) {
      toast.error(describeWriteError(err, "GET /media"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadGallery();
      setSelectedUrl(currentValue || null);
    }
  }, [open, loadGallery, currentValue]);

  // Filtered images
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return images.filter((img) => {
      if (collection ? img.collection !== collection : img.collection === "og") return false;
      if (!q) return true;
      const tAr = (img.title_ar || "").toLowerCase();
      const tEn = (img.title_en || "").toLowerCase();
      const url = (img.image || img.external_url || "").toLowerCase();
      const city = (img.city || "").toLowerCase();
      const prog = (img.program || img.donation_program || "").toLowerCase();
      return tAr.includes(q) || tEn.includes(q) || url.includes(q) || city.includes(q) || prog.includes(q);
    });
  }, [images, search, collection]);

  const collectionCounts = useMemo(
    () => images.reduce<Record<string, number>>((counts, image) => {
      counts[image.collection] = (counts[image.collection] || 0) + 1;
      return counts;
    }, {}),
    [images],
  );
  const allCollectionCount = images.filter((image) => image.collection !== "og").length;
  const selectedImage = images.find((img) => (img.image || img.external_url) === selectedUrl);
  const collectionLabel = (value: string) => {
    if (isAr) return MEDIA_COLLECTION_LABELS_AR[value as MediaCollection] || value;
    const labels: Record<string, string> = {
      blog: "Articles",
      og: "Social images",
      pages: "Pages",
      programs: "Programs",
      campaigns: "Campaigns",
      cases: "Cases",
      gallery: "Gallery",
      general: "General",
    };
    return labels[value] || value;
  };

  // Upload straight into the media library («عام» folder) and select it.
  const handleUpload = async (file: File) => {
    if (!file) return;
    if (!MEDIA_ACCEPT.includes(file.type) || file.size > MEDIA_MAX_BYTES) {
      toast.error(isAr ? "الصيغ المسموحة JPG و PNG و WebP و GIF و AVIF، والحد الأقصى 5 ميجابايت" : "JPG, PNG, WebP, GIF or AVIF up to 5 MB");
      return;
    }
    setUploading(true);
    try {
      const saved = await uploadMedia(file, file.name, collection || "general");
      setSelectedUrl(saved.url);
      if (saved.duplicate) toast.info(isAr ? "الصورة دي موجودة في المكتبة قبل كده — اخترناها لك من غير ما نرفعها تاني" : "Already in the library — selected the existing copy");
      else toast.success(isAr ? "تم رفع الصورة لمكتبة الوسائط" : "Uploaded to the media library");
      await loadGallery();
    } catch (err) {
      toast.error(describeWriteError(err, "POST /media"));
    } finally {
      setUploading(false);
    }
  };

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 1500);
    toast.success(isAr ? "تم نسخ الرابط" : "URL copied");
  };

  const handleConfirmSelect = () => {
    if (selectedUrl) {
      onSelect(selectedUrl);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir={isAr ? "rtl" : "ltr"}
        className="max-w-4xl max-h-[85vh] flex flex-col p-0 overflow-hidden rounded-2xl"
      >
        <DialogHeader className="flex flex-row items-center justify-between gap-3 border-b border-border/70 bg-gradient-to-l from-emerald-500/[0.06] via-background to-background p-4 sm:px-5 sm:py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <ImageIcon className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-black text-foreground">
                {title || (isAr ? "مكتبة الصور والوسائط" : "Media Library")}
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isAr
                  ? "اختر صورة محفوظة من السيرفر أو ارفع صورة جديدة مباشرة"
                  : "Pick an existing image from server or upload a new one"}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={loadGallery}
            disabled={loading}
            className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground"
            title={isAr ? "تحديث" : "Refresh"}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </DialogHeader>

        {/* Toolbar: Search + Upload */}
        <div className="space-y-2 border-b border-border/60 bg-muted/20 p-3 sm:px-4 sm:py-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_176px_auto] sm:items-center">
            <div className="relative min-w-0">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isAr ? "ابحث باسم الصورة أو مسارها..." : "Search by image name or path..."}
                className="h-10 rounded-xl bg-background ps-9 text-sm"
                aria-label={isAr ? "البحث في مكتبة الصور" : "Search the image library"}
              />
            </div>
            <Select
              dir={isAr ? "rtl" : "ltr"}
              value={collection || "all"}
              onValueChange={(value) => setCollection(value === "all" ? "" : value as MediaCollection)}
            >
              <SelectTrigger
                className="relative h-10 rounded-xl bg-background text-xs"
                aria-label={isAr ? "فلترة الصور حسب التصنيف" : "Filter images by category"}
              >
                <Layers className="pointer-events-none absolute end-10 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <SelectValue className="min-w-0 flex-1 pe-8 text-start leading-5" />
              </SelectTrigger>
              <SelectContent dir={isAr ? "rtl" : "ltr"} className="max-h-80">
                <SelectItem value="all">
                  {isAr ? `كل التصنيفات (${allCollectionCount})` : `All categories (${allCollectionCount})`}
                </SelectItem>
                {MEDIA_COLLECTIONS.filter((item) => collectionCounts[item]).map((item) => (
                  <SelectItem key={item} value={item}>
                    {collectionLabel(item)} ({collectionCounts[item]})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:ring-offset-2">
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{isAr ? "جاري الرفع..." : "Uploading..."}</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  <span>{isAr ? "رفع صورة جديدة" : "Upload image"}</span>
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

          <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
            <span>{isAr ? `${filtered.length} صورة` : `${filtered.length} images`}</span>
            {(search || collection) && (
              <button
                type="button"
                onClick={() => { setSearch(""); setCollection(""); }}
                className="font-bold text-emerald-700 hover:underline dark:text-emerald-400"
              >
                {isAr ? "مسح عوامل التصفية" : "Clear filters"}
              </button>
            )}
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 min-h-[300px]">
          {loading && (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
              <p className="text-xs text-muted-foreground">
                {isAr ? "جاري تحميل الصور من السيرفر..." : "Loading images from server..."}
              </p>
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-center border border-dashed rounded-2xl bg-muted/10 p-6">
              <ImageIcon className="h-8 w-8 text-muted-foreground/60" />
              <p className="text-xs font-bold text-foreground">
                {isAr ? "لا توجد صور مطابقة" : "No images found"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {isAr ? "ارفع صورة جديدة لتظهر في المكتبة فوراً" : "Upload an image to add it to the library"}
              </p>
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filtered.map((img) => {
                const imgUrl = img.image || img.external_url || "";
                const isSelected = selectedUrl === imgUrl;
                return (
                  <div
                    key={img.id}
                    onClick={() => setSelectedUrl(imgUrl)}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedUrl(imgUrl);
                      }
                    }}
                    className={`group relative flex flex-col overflow-hidden rounded-xl border-2 transition-all cursor-pointer bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
                      isSelected
                        ? "border-emerald-600 ring-2 ring-emerald-600/30 shadow-md scale-[1.02]"
                        : "border-border/80 hover:border-emerald-500/50 hover:shadow-xs"
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-[4/3] w-full bg-muted overflow-hidden">
                      <img
                        src={formatServerImageUrl(imgUrl) || imgUrl}
                        alt={img.title_ar || "Image"}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 24 24' fill='none' stroke='%2310b981' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect width='18' height='18' x='3' y='3' rx='2' ry='2'/%3E%3Ccircle cx='9' cy='9' r='2'/%3E%3Cpath d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/%3E%3C/svg%3E";
                        }}
                      />

                      {/* Selected checkmark */}
                      {isSelected && (
                        <div className="absolute top-1.5 start-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs">
                          <Check className="h-3 w-3" />
                        </div>
                      )}

                      {/* Copy URL button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(imgUrl);
                        }}
                        className="absolute bottom-1.5 end-1.5 flex h-6 w-6 items-center justify-center rounded-lg bg-black/60 text-white hover:bg-black/80 transition opacity-0 group-hover:opacity-100"
                        title={isAr ? "نسخ الرابط" : "Copy URL"}
                      >
                        {copiedUrl === imgUrl ? (
                          <Check className="h-3 w-3 text-emerald-400" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>

                    {/* Metadata */}
                    <div className="p-2 flex flex-col gap-0.5">
                      <span className="text-[11px] font-bold text-foreground truncate" title={img.title_ar || ""}>
                        {img.title_ar || img.title_en || `صورة #${img.id}`}
                      </span>
                      <span className="text-[9.5px] font-mono text-muted-foreground truncate" dir="ltr" title={imgUrl}>
                        {imgUrl.split("/").pop()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected info & Action Footer */}
        <DialogFooter className="border-t border-border/70 bg-card p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {selectedUrl && selectedImage ? (
              <>
                <img
                  src={selectedImage.preview || formatServerImageUrl(selectedUrl) || selectedUrl}
                  alt=""
                  className="h-12 w-16 shrink-0 rounded-lg border border-border object-cover"
                />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-muted-foreground">{isAr ? "الصورة المحددة" : "Selected image"}</p>
                  <p className="truncate text-sm font-bold text-foreground" title={selectedImage.title_ar}>
                    {selectedImage.title_ar || selectedImage.title_en || (isAr ? "صورة" : "Image")}
                  </p>
                  <p className="truncate text-[10px] text-muted-foreground">{collectionLabel(selectedImage.collection)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(selectedUrl)}
                  className="ms-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:border-emerald-500/60 hover:text-emerald-700"
                  title={isAr ? "نسخ رابط الصورة" : "Copy image URL"}
                >
                  {copiedUrl === selectedUrl ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                </button>
              </>
            ) : (
              <span className="text-xs text-muted-foreground">
                {isAr ? "اختار صورة من المكتبة أو ارفع صورة جديدة" : "Choose an image or upload a new one"}
              </span>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-10 rounded-xl px-4 text-sm font-bold"
            >
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!selectedUrl}
              onClick={handleConfirmSelect}
              className="h-10 rounded-xl px-5 text-sm font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-md shadow-emerald-700/20 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 sm:min-w-40"
            >
              <Check className="h-3.5 w-3.5" />
              <span>{isAr ? "تأكيد الاختيار" : "Select Image"}</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
