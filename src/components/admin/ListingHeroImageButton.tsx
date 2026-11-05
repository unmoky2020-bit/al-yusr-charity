import { useState } from "react";
import { Eye, ImageIcon, Loader2, RotateCcw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ImageUrlField } from "@/components/admin/programs/FormKit";
import { toast } from "@/hooks/use-toast";
import { describeWriteError } from "@/data/api/backendPending";
import { pageImageUrl } from "@/data/pageImages";
import { LISTING_HEROES, listingHeroApi, useInvalidateListingHero, type ListingHeroKey } from "@/data/listingHeroes";

/**
 * Header button of المشاريع / البرامج: opens a dialog to choose the picture at the top of /projects or
 * /programs. Empty = the default banner.
 */
export function ListingHeroImageButton({ pageKey }: { pageKey: ListingHeroKey }) {
  const meta = LISTING_HEROES[pageKey];
  const invalidate = useInvalidateListingHero();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [value, setValue] = useState("");
  const [orig, setOrig] = useState("");

  const openDialog = async () => {
    setOpen(true);
    setLoading(true);
    const saved = await listingHeroApi.load(pageKey, { fresh: true });
    setValue(saved);
    setOrig(saved);
    setLoading(false);
  };

  const save = async () => {
    setSaving(true);
    try {
      await listingHeroApi.save(pageKey, value);
      setOrig(value);
      await invalidate(pageKey);
      toast({ title: "تم حفظ الصورة", description: value ? `هتظهر أعلى صفحة ${meta.path}` : "رجعت الصورة الافتراضية" });
      setOpen(false);
    } catch (e) {
      toast({ variant: "destructive", title: "تعذر الحفظ", description: describeWriteError(e, "POST /content") });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button type="button" variant="outline" className="gap-1.5" onClick={() => void openDialog()}>
        <ImageIcon className="h-4 w-4" /> صورة أعلى الصفحة
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>{meta.titleAr}</DialogTitle>
          </DialogHeader>
          {loading ? (
            <div className="h-64 animate-pulse rounded-2xl bg-muted" />
          ) : (
            <div className="space-y-3">
              <ImageUrlField
                label="الصورة"
                value={value}
                onChange={setValue}
                aspect="wide"
                collection="general"
                hint="صورة عريضة (مثلاً 1920×500). بتظهر خلف العنوان بطبقة خضراء علشان الكلام يفضل واضح."
              />
              {!value && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-bold text-muted-foreground">المعروض حالياً (الصورة الافتراضية):</p>
                  <img src={pageImageUrl(meta.fallback)} alt="" className="w-full rounded-xl border border-border object-cover" />
                </div>
              )}
            </div>
          )}
          <DialogFooter className="flex-wrap gap-2 sm:justify-between">
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" asChild>
                <a href={meta.path} target="_blank" rel="noopener noreferrer" className="gap-1"><Eye className="h-3.5 w-3.5" /> عرض الصفحة</a>
              </Button>
              {value && (
                <Button variant="ghost" size="sm" className="gap-1" onClick={() => setValue("")}>
                  <RotateCcw className="h-3.5 w-3.5" /> الصورة الافتراضية
                </Button>
              )}
            </div>
            <Button onClick={() => void save()} disabled={saving || loading || value === orig} className="gap-1.5">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
