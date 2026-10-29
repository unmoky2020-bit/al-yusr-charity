import { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useLang } from "@/i18n/LangContext";
import { getLucideIcon } from "@/lib/lucide-icon";
import { LucideIconPicker } from "@/components/admin/LucideIconPicker";
import { MediaPickerModal } from "@/components/admin/MediaPickerModal";
import {
  Plus, Save, Trash2, GripVertical, Upload, Image as ImageIcon,
  ArrowUp, ArrowDown, Eye, EyeOff, Undo2, Loader2,
} from "lucide-react";
import { compressImage } from "@/lib/image-compress";
import { achievementsApi, homeNumbersApi, galleryApi, formatServerImageUrl } from "@/data/laravelApi";
import { apiErrorMessage } from "@/data/api/adminApiHelpers";

type Row = {
  id: string;
  section: string;
  sort_order: number;
  active: boolean;
  label_ar: string;
  label_en: string;
  value_number: number | null;
  value_text: string | null;
  suffix_ar: string | null;
  suffix_en: string | null;
  icon_name: string | null;
  image_url: string | null;
  link_url: string | null;
};

const SECTIONS = [
  { key: "home_stats", ar: "أرقام الصفحة الرئيسية", en: "Home stats" },
  { key: "achievements", ar: "الإنجازات", en: "Achievements" },
] as const;

const empty = (section: string, sort_order: number): Row => ({
  id: "",
  section,
  sort_order,
  active: true,
  label_ar: "",
  label_en: "",
  value_number: 0,
  value_text: null,
  suffix_ar: "",
  suffix_en: "",
  icon_name: "Sparkles",
  image_url: null,
  link_url: null,
});

/** Strip data: and blob: URLs from backend — they should never be persisted. */
const cleanImageUrl = (url?: string | null): string | null => {
  if (!url) return null;
  if (url.startsWith("data:") || url.startsWith("blob:")) return null;
  if (url.includes("elyusr-local-mock.internal")) return null;
  return url;
};

export default function AdminSiteStats() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const [section, setSection] = useState<string>("home_stats");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const dragIndex = useRef<number | null>(null);
  // Track Object URLs we created so we can revoke them on unmount / replacement
  const objectUrls = useRef<Set<string>>(new Set());
  // Last image_url per row before the most recent change (for "undo")
  const prevImage = useRef<Record<number, string | null>>({});
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [mediaPickerIdx, setMediaPickerIdx] = useState<number | null>(null);

  // Revoke any local preview URLs on unmount to avoid memory leaks
  useEffect(() => () => {
    objectUrls.current.forEach((u) => URL.revokeObjectURL(u));
    objectUrls.current.clear();
  }, []);

  /** Set image_url and clean up the previous local preview if any. */
  const setRowImage = (idx: number, url: string | null) => {
    const current = rows[idx]?.image_url ?? null;
    prevImage.current[idx] = current;
    if (current && objectUrls.current.has(current)) {
      URL.revokeObjectURL(current);
      objectUrls.current.delete(current);
    }
    updateRow(idx, { image_url: url });
  };

  const reload = async () => {
    setLoading(true);
    try {
      if (section === "home_stats") {
        const res = await homeNumbersApi.listAll();
        if (Array.isArray(res)) {
          setRows(
            res.map((item: any, idx: number) => ({
              id: String(item.id || ""),
              section: "home_stats",
              sort_order: Number(item.sort_order || idx + 1),
              active: item.is_visible !== false,
              label_ar: item.title_ar || "",
              label_en: item.title_en || "",
              value_number: Number(item.number) || 0,
              value_text: null,
              suffix_ar: item.number_label_ar || item.suffix || "",
              suffix_en: item.number_label_en || item.suffix || "",
              icon_name: item.icon || "Users",
              image_url: cleanImageUrl(item.fallback_image),
              link_url: null,
            }))
          );
        }
      } else {
        const res = await achievementsApi.listAll();
        if (Array.isArray(res)) {
          setRows(
            res.map((item: any, idx: number) => ({
              id: String(item.id || ""),
              section: "achievements",
              sort_order: Number(item.sort_order || idx + 1),
              active: item.is_active !== false,
              label_ar: item.title_ar || "",
              label_en: item.title_en || "",
              value_number: Number(item.number) || 0,
              value_text: null,
              suffix_ar: item.number_suffix_ar || "",
              suffix_en: item.number_suffix_en || "",
              icon_name: item.icon || "Award",
              image_url: cleanImageUrl(item.image),
              link_url: null,
            }))
          );
        }
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to load stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [section]);

  const addRow = () => {
    const next = empty(section, (rows.at(-1)?.sort_order ?? 0) + 1);
    setRows((r) => [...r, next]);
  };

  const updateRow = (idx: number, patch: Partial<Row>) => {
    setRows((r) => r.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  };

  const saveRow = async (idx: number) => {
    const row = rows[idx];
    // Guard: never send data: or blob: URLs to backend
    const safeImageUrl = cleanImageUrl(row.image_url);

    setSavingId(row.id || `new-${idx}`);
    try {
      if (section === "home_stats") {
        const payload = {
          title_ar: row.label_ar,
          title_en: row.label_en || undefined,
          number: Number(row.value_number) || 0,
          number_label_ar: row.suffix_ar || undefined,
          number_label_en: row.suffix_en || undefined,
          icon: row.icon_name || "Users",
          fallback_image: safeImageUrl,
          sort_order: row.sort_order || idx + 1,
          is_visible: row.active,
        };

        if (row.id) {
          await homeNumbersApi.update(row.id, payload);
        } else {
          const created = await homeNumbersApi.create(payload);
          if ((created as any)?.id) updateRow(idx, { id: String((created as any).id) });
        }
      } else {
        const payload = {
          title_ar: row.label_ar,
          title_en: row.label_en || undefined,
          number: Number(row.value_number) || 0,
          number_suffix_ar: row.suffix_ar || undefined,
          number_suffix_en: row.suffix_en || undefined,
          icon: row.icon_name || "Award",
          image: safeImageUrl,
          sort_order: row.sort_order || idx + 1,
          is_active: row.active,
        };

        if (row.id) {
          await achievementsApi.update(row.id, payload);
        } else {
          const created = await achievementsApi.create(payload);
          if ((created as any)?.id) updateRow(idx, { id: String((created as any).id) });
        }
      }
      toast.success(isAr ? "تم الحفظ بنجاح" : "Saved successfully");
    } catch (err: any) {
      toast.error(err.message || "Save failed");
    } finally {
      setSavingId(null);
    }
  };

  const deleteRow = async (idx: number) => {
    const row = rows[idx];
    if (!row.id) {
      setRows((r) => r.filter((_, i) => i !== idx));
      return;
    }
    if (!confirm(isAr ? "حذف هذا العنصر؟" : "Delete this item?")) return;
    try {
      if (section === "home_stats") {
        await homeNumbersApi.remove(row.id);
      } else {
        await achievementsApi.remove(row.id);
      }
      setRows((r) => r.filter((_, i) => i !== idx));
      toast.success(isAr ? "تم الحذف" : "Deleted");
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    }
  };

  /** Toggle just the active flag and persist it instantly. */
  const setActive = async (idx: number, value: boolean) => {
    const row = rows[idx];
    updateRow(idx, { active: value });
    if (!row.id) return;
    setSavingId(row.id);
    try {
      if (section === "home_stats") {
        await homeNumbersApi.update(row.id, { is_visible: value });
      } else {
        await achievementsApi.update(row.id, { is_active: value });
      }
      toast.success(value ? (isAr ? "تم التفعيل" : "Activated") : (isAr ? "تم الإخفاء" : "Hidden"));
    } catch (err: unknown) {
      // PUT /home-numbers/{id} {is_visible} or PUT /achievements/{id} {is_active} failed: revert the switch.
      updateRow(idx, { active: !value });
      toast.error(isAr ? "فشل تغيير الحالة" : "Failed to change status", {
        description: apiErrorMessage(err),
      });
    } finally {
      setSavingId(null);
    }
  };

  /** Persist sort_order for all rows after a reorder. */
  const persistOrder = async (next: Row[]) => {
    const updates = next
      .map((r, i) => ({ ...r, sort_order: i + 1 }))
      .filter((r) => r.id);
    setRows(next.map((r, i) => ({ ...r, sort_order: i + 1 })));
    try {
      await Promise.all(
        updates.map((r) =>
          section === "home_stats"
            ? homeNumbersApi.update(r.id, { sort_order: r.sort_order })
            : achievementsApi.update(r.id, { sort_order: r.sort_order })
        )
      );
      toast.success(isAr ? "تم تحديث الترتيب" : "Order updated");
    } catch {
      toast.error(isAr ? "فشل حفظ الترتيب" : "Failed to save order");
    }
  };

  const moveRow = (from: number, to: number) => {
    if (to < 0 || to >= rows.length || from === to) return;
    const next = [...rows];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    persistOrder(next);
  };

  const uploadImage = async (idx: number, file: File) => {
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml", "image/gif"];
    if (!allowed.includes(file.type)) {
      toast.error(isAr ? "صيغة غير مدعومة (PNG/JPG/WEBP/SVG فقط)" : "Unsupported format (PNG/JPG/WEBP/SVG only)");
      return;
    }
    const HARD_MAX = 8 * 1024 * 1024;
    if (file.size > HARD_MAX) {
      toast.error(isAr ? "الحجم أكبر من 8 ميجابايت" : "File exceeds 8MB");
      return;
    }
    setUploadingIdx(idx);

    // Show local object URL preview immediately — never stored in backend
    const previewUrl = URL.createObjectURL(file);
    objectUrls.current.add(previewUrl);
    setRowImage(idx, previewUrl);

    try {
      const compressed = await compressImage(file, { maxEdge: 800, quality: 0.85 });

      // Upload directly to backend gallery — NO base64 fallback
      const serverUrl = await galleryApi.uploadImage(compressed, rows[idx]?.label_ar || "إحصائية الموقع");

      // Replace local preview with permanent server URL
      setRowImage(idx, serverUrl);
      URL.revokeObjectURL(previewUrl);
      objectUrls.current.delete(previewUrl);

      toast.success(isAr ? "تم رفع الصورة للسيرفر بنجاح ✓" : "Image uploaded to server successfully ✓");
    } catch (err: any) {
      // Revert — don't store blob URL in db
      URL.revokeObjectURL(previewUrl);
      objectUrls.current.delete(previewUrl);
      setRowImage(idx, prevImage.current[idx] ?? null);
      toast.error(err.message || (isAr ? "فشل رفع الصورة للسيرفر" : "Failed to upload image to server"));
    } finally {
      setUploadingIdx(null);
    }
  };

  return (
    <AdminLayout>
      <div
        dir={isAr ? "rtl" : "ltr"}
        className="text-start [&_label]:mb-1.5 [&_label]:block [&_label]:text-start [&_label]:text-[11px] [&_label]:font-extrabold [&_label]:uppercase [&_label]:tracking-wide [&_label]:text-muted-foreground [&_textarea]:text-start"
      >
      <Helmet>
        <title>{isAr ? "إدارة الأرقام والإنجازات" : "Stats & Achievements"} — Al-Yusr</title>
      </Helmet>
      <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div className="text-start">
          <h1 className="text-2xl font-black text-primary">
            {isAr ? "إدارة الأرقام والإنجازات" : "Stats & Achievements"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isAr ? "تعديل الأرقام والأيقونات والصور لكل قسم بشكل ديناميكي." : "Edit numbers, icons and images for each section dynamically."}
          </p>
        </div>
        <Button onClick={addRow} className="gap-1.5"><Plus className="h-4 w-4" /> {isAr ? "إضافة عنصر" : "Add item"}</Button>
      </div>

      <Tabs value={section} onValueChange={setSection} dir={isAr ? "rtl" : "ltr"}>
        <TabsList className="w-full justify-start flex-wrap h-auto">
          {SECTIONS.map((s) => (
            <TabsTrigger key={s.key} value={s.key}>{isAr ? s.ar : s.en}</TabsTrigger>
          ))}
        </TabsList>
        {SECTIONS.map((s) => (
          <TabsContent key={s.key} value={s.key} className="mt-4">
            {loading ? (
              <div className="text-sm text-muted-foreground">{isAr ? "جاري التحميل..." : "Loading..."}</div>
            ) : rows.length === 0 ? (
              <Card className="p-6 text-center text-muted-foreground">
                {isAr ? "لا توجد عناصر بعد. اضغط 'إضافة عنصر'." : "No items yet. Click 'Add item'."}
              </Card>
            ) : (
              <div className="grid gap-4">
                {rows.map((row, idx) => {
                  const Icon = getLucideIcon(row.icon_name || undefined);
                  const displayImageUrl = cleanImageUrl(row.image_url);
                  return (
                    <Card
                      key={row.id || idx}
                      draggable
                      onDragStart={() => { dragIndex.current = idx; }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const from = dragIndex.current;
                        dragIndex.current = null;
                        if (from === null || from === idx) return;
                        const next = [...rows];
                        const [item] = next.splice(from, 1);
                        next.splice(idx, 0, item);
                        persistOrder(next);
                      }}
                      className={`overflow-hidden p-4 transition hover:ring-1 hover:ring-primary/20 sm:p-5 ${row.active ? "ring-1 ring-secondary/40" : "opacity-95"}`}
                    >
                      {/* Card header — preview chip + label + reorder + delete */}
                      <div className="mb-4 flex flex-wrap items-center gap-3 border-b border-border/60 pb-3">
                        <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-secondary/20 to-primary/10 text-primary ring-1 ring-secondary/30">
                          {displayImageUrl ? (
                            <img src={formatServerImageUrl(displayImageUrl) || displayImageUrl} alt="" className="h-full w-full object-cover"
                              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                          ) : (
                            <Icon className="h-5 w-5" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-extrabold text-primary">
                            {(isAr ? row.label_ar : row.label_en) || (isAr ? "بدون عنوان" : "Untitled")}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            #{idx + 1} · {row.value_text || row.value_number || "—"}{row.suffix_ar || row.suffix_en ? ` ${isAr ? row.suffix_ar : row.suffix_en}` : ""}
                          </div>
                        </div>
                        <div className="ms-auto flex items-center gap-1">
                          <Button type="button" variant="ghost" size="sm" onClick={() => moveRow(idx, idx - 1)} disabled={idx === 0} className="h-8 w-8 p-0" title={isAr ? "تحريك لأعلى" : "Move up"}>
                            <ArrowUp className="h-3.5 w-3.5" />
                          </Button>
                          <Button type="button" variant="ghost" size="sm" onClick={() => moveRow(idx, idx + 1)} disabled={idx === rows.length - 1} className="h-8 w-8 p-0" title={isAr ? "تحريك لأسفل" : "Move down"}>
                            <ArrowDown className="h-3.5 w-3.5" />
                          </Button>
                          <span title={isAr ? "اسحب لإعادة الترتيب" : "Drag to reorder"} className="ms-1 inline-flex">
                            <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground active:cursor-grabbing" />
                          </span>
                          <Button variant="ghost" size="sm" onClick={() => deleteRow(idx)} className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10" title={isAr ? "حذف" : "Delete"}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid gap-x-4 gap-y-3 md:grid-cols-2">
                        <div>
                          <Label>{isAr ? "النص (عربي)" : "Label (AR)"}</Label>
                          <input dir="rtl" className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm text-right" value={row.label_ar} onChange={(e) => updateRow(idx, { label_ar: e.target.value })} />
                        </div>
                        <div>
                          <Label>{isAr ? "النص (إنجليزي)" : "Label (EN)"}</Label>
                          <input dir="ltr" className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm text-left" value={row.label_en} onChange={(e) => updateRow(idx, { label_en: e.target.value })} />
                        </div>
                        <div>
                          <Label>{isAr ? "الرقم" : "Number"}</Label>
                          <Input
                            type="number"
                            dir="ltr"
                            className="text-start"
                            value={row.value_number ?? ""}
                            onChange={(e) => updateRow(idx, { value_number: e.target.value === "" ? null : Number(e.target.value) })}
                          />
                        </div>
                        <div>
                          <Label>{isAr ? "نص بديل (يلغي الرقم)" : "Override text"}</Label>
                          <Input
                            placeholder="75K+"
                            dir="ltr"
                            className="text-start"
                            value={row.value_text ?? ""}
                            onChange={(e) => updateRow(idx, { value_text: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>{isAr ? "اللاحقة (عربي)" : "Suffix (AR)"}</Label>
                          <Input dir="rtl" className="text-right" value={row.suffix_ar ?? ""} onChange={(e) => updateRow(idx, { suffix_ar: e.target.value })} />
                        </div>
                        <div>
                          <Label>{isAr ? "اللاحقة (إنجليزي)" : "Suffix (EN)"}</Label>
                          <Input dir="ltr" className="text-left" value={row.suffix_en ?? ""} onChange={(e) => updateRow(idx, { suffix_en: e.target.value })} />
                        </div>
                        <div>
                          <Label>{isAr ? "الأيقونة (lucide)" : "Icon (lucide)"}</Label>
                          <LucideIconPicker
                            value={row.icon_name}
                            onChange={(v) => updateRow(idx, { icon_name: v })}
                            isAr={isAr}
                          />
                        </div>
                        <div>
                          <Label>{isAr ? "الترتيب" : "Order"}</Label>
                          <Input
                            type="number"
                            dir="ltr"
                            className="text-start"
                            value={row.sort_order}
                            onChange={(e) => updateRow(idx, { sort_order: Number(e.target.value) || 0 })}
                          />
                        </div>

                        {/* Image field — full width */}
                        <div className="md:col-span-2">
                          <Label>{isAr ? "صورة بديلة (تلغي الأيقونة)" : "Custom image (overrides icon)"}</Label>
                          <div className="flex flex-wrap items-center gap-2">
                            <Input
                              placeholder="https://..."
                              dir="ltr"
                              className="min-w-0 flex-1 text-left"
                              value={displayImageUrl ?? ""}
                              onChange={(e) => setRowImage(idx, e.target.value || null)}
                            />
                            {/* Pick from media library */}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="gap-1 text-xs h-9 shrink-0"
                              onClick={() => setMediaPickerIdx(idx)}
                            >
                              <ImageIcon className="h-3.5 w-3.5" />
                              {isAr ? "من المكتبة" : "Library"}
                            </Button>
                            {/* Direct upload button */}
                            <label className={`inline-flex cursor-pointer items-center gap-1 rounded-md border px-3 py-2 text-xs hover:bg-muted shrink-0 h-9 ${uploadingIdx === idx ? "opacity-60 pointer-events-none" : ""}`}>
                              {uploadingIdx === idx
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : <Upload className="h-3.5 w-3.5" />}
                              {isAr ? "رفع" : "Upload"}
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                                className="hidden"
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f) uploadImage(idx, f);
                                  e.currentTarget.value = "";
                                }}
                              />
                            </label>
                            {prevImage.current[idx] !== undefined && prevImage.current[idx] !== row.image_url && (
                              <Button type="button" variant="ghost" size="sm" title={isAr ? "تراجع" : "Undo"}
                                onClick={() => setRowImage(idx, prevImage.current[idx] ?? null)}>
                                <Undo2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {row.image_url && (
                              <Button type="button" variant="ghost" size="sm" title={isAr ? "إزالة" : "Remove"}
                                onClick={() => setRowImage(idx, null)}>
                                <ImageIcon className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>

                          {/* Uploading progress indicator */}
                          {uploadingIdx === idx && (
                            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              {isAr ? "جاري رفع الصورة للسيرفر..." : "Uploading to server..."}
                            </div>
                          )}

                          {/* Image preview — only real server URLs, skip data: and blob: */}
                          {displayImageUrl && uploadingIdx !== idx && (
                            <div className="mt-2 inline-flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-2">
                              <img
                                src={formatServerImageUrl(displayImageUrl) || displayImageUrl}
                                alt="preview"
                                className="h-16 w-16 rounded-lg object-cover border border-border bg-background"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 24 24' fill='none' stroke='%2310b981' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect width='18' height='18' x='3' y='3' rx='2' ry='2'/%3E%3Ccircle cx='9' cy='9' r='2'/%3E%3Cpath d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/%3E%3C/svg%3E";
                                }}
                              />
                              <div className="flex flex-col min-w-0 max-w-[280px]">
                                <span className="text-[11px] font-bold text-foreground truncate">
                                  {isAr ? "معاينة الصورة" : "Image preview"}
                                </span>
                                <span className="text-[10px] text-muted-foreground truncate" dir="ltr">
                                  {displayImageUrl}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Visibility toggle */}
                        <div className={`md:col-span-2 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-3 py-2.5 ${row.active ? "border-secondary/50 bg-secondary/10" : "border-border bg-muted/40"}`}>
                          <div className="flex min-w-0 items-center gap-2">
                            {savingId === row.id && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                            {row.active ? <Eye className="h-4 w-4 shrink-0 text-secondary" /> : <EyeOff className="h-4 w-4 shrink-0 text-muted-foreground" />}
                            <div className="flex min-w-0 flex-col">
                              <span className="text-xs font-extrabold">
                                {isAr ? "ظهور هذا العنصر" : "Visibility"}
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                {row.active
                                  ? (isAr ? "ظاهر للزوار في الموقع" : "Visible to site visitors")
                                  : (isAr ? "مخفي عن الزوار" : "Hidden from visitors")}
                              </span>
                            </div>
                          </div>
                          <Switch
                            checked={row.active}
                            onCheckedChange={(v) => void setActive(idx, v)}
                            disabled={savingId === row.id}
                            aria-label={isAr ? "تبديل الظهور" : "Toggle visibility"}
                          />
                        </div>
                      </div>

                      {/* Footer save bar */}
                      <div className="mt-4 flex items-center justify-end gap-2 border-t border-border/60 pt-3">
                        <Button onClick={() => saveRow(idx)} disabled={savingId === (row.id || `new-${idx}`)} className="gap-1.5">
                          {savingId === (row.id || `new-${idx}`) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          {isAr ? "حفظ التعديلات" : "Save changes"}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
      </div>

      {/* MediaPickerModal — shared for all rows */}
      {mediaPickerIdx !== null && (
        <MediaPickerModal
          open={true}
          onOpenChange={(open) => { if (!open) setMediaPickerIdx(null); }}
          onSelect={(url) => {
            const i = mediaPickerIdx;
            setMediaPickerIdx(null);
            if (i !== null) setRowImage(i, url);
          }}
          currentValue={rows[mediaPickerIdx ?? 0]?.image_url ?? null}
          title={isAr ? "اختر صورة من مكتبة الوسائط" : "Choose from Media Library"}
        />
      )}
    </AdminLayout>
  );
}