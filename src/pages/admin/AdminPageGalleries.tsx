import { useEffect, useState } from "react";
import { ExternalLink, Images, Loader2, Save } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { SlotBox } from "@/components/admin/PageImagesPanel";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { describeWriteError } from "@/data/api/backendPending";
import { l, type PageImage } from "@/data/campaignPages/types";
import {
  PAGE_GALLERIES,
  PAGE_GALLERY_KEYS,
  pageGalleriesApi,
  useInvalidatePageGallery,
  type PageGalleryKey,
} from "@/data/pageGalleries";

/**
 * «معارض صور الصفحات»: the picture galleries of pages that have no content tab of their own
 * (/farm, /qurbani, program pages, /medical, /zakat). Each gallery saves on its own.
 * Galleries of campaigns and of the water / nurseries / mosques pages live on those records («الصور»).
 */
function GalleryCard({ k }: { k: PageGalleryKey }) {
  const meta = PAGE_GALLERIES[k];
  const invalidate = useInvalidatePageGallery();
  const [items, setItems] = useState<PageImage[] | null>(null);
  const [orig, setOrig] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    void pageGalleriesApi.load(k, { fresh: true }).then((saved) => {
      if (!alive) return;
      const start = saved.length ? saved : structuredClone(meta.defaults);
      setItems(start);
      setOrig(JSON.stringify(saved));
    });
    return () => { alive = false; };
  }, [k, meta.defaults]);

  const isDefault = !!items && JSON.stringify(items) === JSON.stringify(meta.defaults);
  // What would be stored: nothing while the list is still the page's own pictures.
  const toSave = items && !isDefault ? items.filter((it) => it.src.trim()) : [];
  const dirty = items !== null && JSON.stringify(toSave) !== orig;

  const save = async () => {
    setSaving(true);
    try {
      await pageGalleriesApi.save(k, toSave);
      setOrig(JSON.stringify(toSave));
      await invalidate(k);
      toast({ title: "تم حفظ المعرض", description: toSave.length ? `${toSave.length} صورة` : "رجعت الصور الأصلية للصفحة" });
    } catch (e) {
      toast({ variant: "destructive", title: "تعذر الحفظ", description: describeWriteError(e, "POST /content") });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-3 rounded-3xl border border-border/80 bg-card p-5 shadow-card sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-black text-foreground">{meta.titleAr}</h2>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {meta.pages.map((p) => (
              <a key={p.path} href={p.path} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-bold text-muted-foreground hover:text-primary">
                {p.labelAr} <ExternalLink className="h-3 w-3" />
              </a>
            ))}
          </div>
        </div>
        <Button onClick={() => void save()} disabled={!dirty || saving} className="gap-1.5">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} حفظ المعرض
        </Button>
      </div>
      {items === null ? (
        <div className="h-40 animate-pulse rounded-2xl bg-muted" />
      ) : (
        <SlotBox
          slotKey={k}
          slot={{ label: l("الصور", "Pictures"), hint: meta.hintAr ? l(meta.hintAr, "") : undefined, captions: meta.captions, items }}
          defaults={{ label: l("", ""), items: meta.defaults }}
          onItems={setItems}
        />
      )}
    </section>
  );
}

export default function AdminPageGalleries() {
  return (
    <AdminLayout>
      <div className="space-y-6" dir="rtl">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-primary/10 p-2 text-primary"><Images className="h-6 w-6" /></div>
            <h1 className="text-2xl font-black text-foreground">معارض صور الصفحات</h1>
          </div>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            اختار الصور اللي بتظهر في معارض الصفحات دي: ارفع صور أو اختارها من مكتبة الوسائط، اكتب وصفها، ورتّبها، وبعدين «حفظ المعرض».
            معارض الحملات وصفحات سقيا الماء والحضانات والمساجد بتتعدل من تبويب «الصور» في الحملة أو المشروع نفسه.
          </p>
        </div>
        {PAGE_GALLERY_KEYS.map((k) => <GalleryCard key={k} k={k} />)}
      </div>
    </AdminLayout>
  );
}
