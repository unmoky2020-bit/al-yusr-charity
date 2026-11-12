/**
 * «صورة» button beside a donation package: shows the package's picture (if any), opens the media
 * library to set or replace it, and removes it. One shared query keeps every row in sync.
 */
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Loader2, X } from "lucide-react";
import { MediaPickerModal } from "@/components/admin/MediaPickerModal";
import { packageImagesAdminApi, type PackageImageMap } from "@/data/api/packageImagesApi";
import { describeWriteError } from "@/data/api/backendPending";
import { toast } from "@/lib/notify";
import { askConfirm } from "@/components/common/confirm";

export const PACKAGE_IMAGES_QUERY = ["admin-package-images"] as const;

export function usePackageImagesAdmin() {
  return useQuery<PackageImageMap>({
    queryKey: PACKAGE_IMAGES_QUERY,
    queryFn: () => packageImagesAdminApi.list(),
    staleTime: 60_000,
    retry: false,
  });
}

export function PackageImageButton({ packageId, nameAr }: { packageId: number | string | null | undefined; nameAr: string }) {
  const id = Number(packageId);
  const saved = Number.isInteger(id) && id > 0;
  const qc = useQueryClient();
  const { data, isError } = usePackageImagesAdmin();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const current = saved ? data?.[id] : undefined;
  const route = "PUT /admin/package-images/{package} (حزمة deploy-2026-11-13-extras)";

  if (!saved) {
    return (
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-dashed border-border text-muted-foreground/60" title="احفظ الباقة الأول، وبعدين ضيف صورتها">
        <ImagePlus className="h-4 w-4" />
      </span>
    );
  }

  const refresh = () => qc.invalidateQueries({ queryKey: PACKAGE_IMAGES_QUERY });

  const choose = async (url: string) => {
    setOpen(false);
    setBusy(true);
    try {
      await packageImagesAdminApi.set(id, { image: url, alt_ar: nameAr || null });
      toast.success("اتحفظت صورة الباقة");
      await refresh();
    } catch (e) {
      toast.error("الصورة ما اتحفظتش", { description: describeWriteError(e, route) });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!(await askConfirm(`شيل صورة «${nameAr}»؟ (الصورة نفسها بتفضل في مكتبة الوسائط)`))) return;
    setBusy(true);
    try {
      await packageImagesAdminApi.remove(id);
      toast.success("اتشالت صورة الباقة");
      await refresh();
    } catch (e) {
      toast.error("الصورة ما اتشالتش", { description: describeWriteError(e, "DELETE /admin/package-images/{package}") });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={busy}
        title={isError ? "صور الباقات محتاجة نشر حزمة الباك إند (13 نوفمبر)" : current ? "تغيير صورة الباقة" : "إضافة صورة للباقة"}
        aria-label={current ? `تغيير صورة ${nameAr}` : `إضافة صورة لـ ${nameAr}`}
        className={`grid h-9 w-9 place-items-center overflow-hidden rounded-xl border transition ${
          current ? "border-secondary/60" : "border-dashed border-primary/30 text-primary hover:border-secondary hover:bg-secondary/10"
        } disabled:opacity-60`}
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : current ? (
          <img src={current.image} alt={current.altAr || nameAr} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <ImagePlus className="h-4 w-4" />
        )}
      </button>
      {current && !busy && (
        <button
          type="button"
          onClick={() => void remove()}
          aria-label={`شيل صورة ${nameAr}`}
          className="absolute -end-1.5 -top-1.5 grid h-4 w-4 place-items-center rounded-full bg-destructive text-white shadow"
        >
          <X className="h-2.5 w-2.5" />
        </button>
      )}
      <MediaPickerModal
        open={open}
        onOpenChange={setOpen}
        currentValue={current?.image ?? null}
        title={`صورة الباقة «${nameAr}»`}
        onSelect={(url) => void choose(url)}
      />
    </div>
  );
}
