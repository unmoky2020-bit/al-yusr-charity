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
import {
  Search,
  Upload,
  Loader2,
  Check,
  Copy,
  Image as ImageIcon,
  RefreshCw,
} from "lucide-react";
import { formatServerImageUrl } from "@/data/laravelApi";
import { describeWriteError } from "@/data/api/backendPending";
import { listMedia, uploadMedia, MEDIA_ACCEPT, MEDIA_MAX_BYTES } from "@/data/api/mediaApi";

/** One media-library file, in the shape the grid below renders. */
type PickerImage = { id: string; image: string; preview?: string; external_url?: string; title_ar: string; title_en?: string; city?: string; program?: string; donation_program?: string };
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
  const [selectedUrl, setSelectedUrl] = useState<string | null>(currentValue || null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const loadGallery = useCallback(async () => {
    setLoading(true);
    try {
      // The media library (GET /media) — the same files as /admin/media.
      // Every stored image (also older folders), without identical copies, so the same picture is reused.
      const files = (await listMedia({ scope: "all" })).filter((f) => !f.duplicate_of);
      setImages(files.map((f) => ({ id: f.path, image: f.url, preview: f.preview, title_ar: f.name, title_en: f.name, program: f.collection })));
    } catch (err) {
      toast.error(describeWriteError(err, "GET /media"));
    } finally {
      setLoading(false);
    }
  }, [isAr]);

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
      if (!q) return true;
      const tAr = (img.title_ar || "").toLowerCase();
      const tEn = (img.title_en || "").toLowerCase();
      const url = (img.image || img.external_url || "").toLowerCase();
      const city = (img.city || "").toLowerCase();
      const prog = (img.program || img.donation_program || "").toLowerCase();
      return tAr.includes(q) || tEn.includes(q) || url.includes(q) || city.includes(q) || prog.includes(q);
    });
  }, [images, search]);

  // Upload straight into the media library («عام» folder) and select it.
  const handleUpload = async (file: File) => {
    if (!file) return;
    if (!MEDIA_ACCEPT.includes(file.type) || file.size > MEDIA_MAX_BYTES) {
      toast.error(isAr ? "الصيغ المسموحة JPG و PNG و WebP و GIF و AVIF، والحد الأقصى 5 ميجابايت" : "JPG, PNG, WebP, GIF or AVIF up to 5 MB");
      return;
    }
    setUploading(true);
    try {
      const saved = await uploadMedia(file, file.name, "general");
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
        <DialogHeader className="p-4 sm:p-5 border-b border-border/70 flex flex-row items-center justify-between gap-3">
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
        <div className="p-4 border-b border-border/60 bg-muted/20 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isAr ? "البحث في أسماء ومسارات الصور..." : "Search images by title or URL..."}
              className="ps-9 h-8.5 text-xs rounded-xl"
            />
          </div>

          <label className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition shadow-xs shrink-0 h-8.5">
            {uploading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>{isAr ? "جاري الرفع..." : "Uploading..."}</span>
              </>
            ) : (
              <>
                <Upload className="h-3.5 w-3.5" />
                <span>{isAr ? "رفع صورة جديدة للمكتبة" : "Upload to Library"}</span>
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              {filtered.map((img) => {
                const imgUrl = img.image || img.external_url || "";
                const isSelected = selectedUrl === imgUrl;
                return (
                  <div
                    key={img.id}
                    onClick={() => setSelectedUrl(imgUrl)}
                    className={`group relative flex flex-col overflow-hidden rounded-xl border-2 transition-all cursor-pointer bg-card ${
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
        <DialogFooter className="p-3.5 sm:p-4 border-t border-border/70 bg-card flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {selectedUrl ? (
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-bold text-foreground shrink-0">
                  {isAr ? "الصورة المحددة:" : "Selected:"}
                </span>
                <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 truncate" dir="ltr">
                  {selectedUrl}
                </span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">
                {isAr ? "انقر على أي صورة لاختيارها" : "Click any image to select"}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0 justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs font-bold h-8.5 rounded-xl px-4"
            >
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!selectedUrl}
              onClick={handleConfirmSelect}
              className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white h-8.5 rounded-xl px-5 gap-1.5 shadow-sm"
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
