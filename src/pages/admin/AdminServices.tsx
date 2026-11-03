import { UiSelect } from "@/components/common/UiSelect";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Plus, Pencil, Trash2, Eye, EyeOff, Save, X, Loader2,
  GripVertical, ExternalLink, ChevronDown, ChevronUp,
  Settings, LayoutGrid, FileText, DollarSign, ArrowLeft, ArrowRight,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLang } from "@/i18n/LangContext";
import {
  useServicesListAll,
  useServiceDetail,
  useServiceUpsert,
  useServiceToggleActive,
  useServiceDelete,
} from "@/hooks/useServices";
import type { ServiceDetail, DonationTier } from "@/data/servicesApi";

const SECTORS = [
  { v: "food",    ar: "غذاء",     en: "Food" },
  { v: "health",  ar: "صحة",     en: "Health" },
  { v: "kafala",  ar: "كفالة",   en: "Kafala" },
  { v: "housing", ar: "إسكان",   en: "Housing" },
  { v: "odhya",   ar: "أضحية",   en: "Qurbani" },
  { v: "water",   ar: "مياه",    en: "Water" },
  { v: "general", ar: "عام",     en: "General" },
];

const EMPTY_SERVICE: Partial<ServiceDetail> = {
  slug: "", programSlug: "", sector: "general",
  hero: "", badge_ar: "", badge_en: "",
  title_ar: "", title_en: "", intro_ar: "", intro_en: "",
  seo_title_ar: "", seo_title_en: "", seo_desc_ar: "", seo_desc_en: "",
  bullets_ar: ["", "", ""], bullets_en: ["", "", ""],
  stats: [], features: [], tiers: [], related: [],
  active: true, sort_order: 0,
};

// ── Sub-editors ───────────────────────────────────────────────────────────

function TiersEditor({ tiers, onChange }: { tiers: DonationTier[]; onChange: (t: DonationTier[]) => void }) {
  const add = () => onChange([...tiers, { amount: 0, unit_ar: "", unit_en: "", desc_ar: "", desc_en: "", highlight: false }]);
  const remove = (i: number) => onChange(tiers.filter((_, j) => j !== i));
  const update = (i: number, patch: Partial<DonationTier>) => onChange(tiers.map((t, j) => j === i ? { ...t, ...patch } : t));
  return (
    <div className="space-y-3">
      {tiers.map((t, i) => (
        <div key={i} className="rounded-2xl border border-border bg-muted/30 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-primary">مستوى التبرع {i + 1}</span>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs font-bold">
                <Switch checked={t.highlight ?? false} onCheckedChange={(v) => update(i, { highlight: v })} />
                مميز
              </label>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => remove(i)}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <Input type="number" placeholder="المبلغ (جنيه)" value={t.amount} onChange={(e) => update(i, { amount: +e.target.value })} className="h-9" />
            <Input placeholder="اسم الوحدة (عربي)" value={t.unit_ar} onChange={(e) => update(i, { unit_ar: e.target.value })} className="h-9" />
            <Input placeholder="Unit name (English)" value={t.unit_en} onChange={(e) => update(i, { unit_en: e.target.value })} dir="ltr" className="h-9" />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Textarea placeholder="وصف (عربي)" value={t.desc_ar} onChange={(e) => update(i, { desc_ar: e.target.value })} rows={2} />
            <Textarea placeholder="Description (English)" value={t.desc_en} onChange={(e) => update(i, { desc_en: e.target.value })} rows={2} dir="ltr" />
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={add} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> إضافة مستوى تبرع</Button>
    </div>
  );
}

function BulletsEditor({ ar, en, onChange }: { ar: string[]; en: string[]; onChange: (ar: string[], en: string[]) => void }) {
  const set = (side: "ar" | "en", i: number, v: string) => {
    if (side === "ar") { const a = [...ar]; a[i] = v; onChange(a, en); }
    else { const e = [...en]; e[i] = v; onChange(ar, e); }
  };
  const addRow = () => onChange([...ar, ""], [...en, ""]);
  const removeRow = (i: number) => onChange(ar.filter((_, j) => j !== i), en.filter((_, j) => j !== i));
  return (
    <div className="space-y-2">
      {ar.map((_, i) => (
        <div key={i} className="flex gap-2 items-start">
          <Textarea placeholder={`نقطة ${i + 1} (عربي)`} value={ar[i]} onChange={(e) => set("ar", i, e.target.value)} rows={2} className="flex-1" />
          <Textarea placeholder={`Bullet ${i + 1} (English)`} value={en[i]} onChange={(e) => set("en", i, e.target.value)} rows={2} className="flex-1" dir="ltr" />
          <Button size="icon" variant="ghost" className="h-8 w-8 mt-1 text-destructive" onClick={() => removeRow(i)}><X className="h-3.5 w-3.5" /></Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addRow} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> إضافة نقطة</Button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────

const AdminServices = () => {
  const { slug: slugParam } = useParams<{ slug?: string }>();
  const navigate = useNavigate();
  const { lang } = useLang();
  const isRTL = lang === "ar";

  const { data: allServices = [], isLoading: loadingList } = useServicesListAll();
  const { data: existingDetail, isLoading: loadingDetail } = useServiceDetail(slugParam ?? "");

  const upsert = useServiceUpsert();
  const toggleActive = useServiceToggleActive();
  const deleteService = useServiceDelete();

  const [form, setForm] = useState<Partial<ServiceDetail>>(EMPTY_SERVICE);
  const [tab, setTab] = useState("card");
  const [slugToDelete, setSlugToDelete] = useState<string | null>(null);
  const isEditing = Boolean(slugParam);

  useEffect(() => {
    if (existingDetail) setForm(existingDetail);
    else if (!slugParam) setForm(EMPTY_SERVICE);
  }, [existingDetail, slugParam]);

  const patch = (key: keyof ServiceDetail, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    if (!form.slug) return;
    upsert.mutate(form as Partial<ServiceDetail> & { slug: string }, {
      onSuccess: () => navigate("/admin/services"),
    });
  };

  // ── List view ────────────────────────────────────────────────────────────
  if (!isEditing) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-primary">إدارة الخدمات</h1>
              <p className="mt-1 text-sm text-muted-foreground">تحكم في بطاقات الخدمات، تفاصيل الصفحات، وخيارات التبرع</p>
            </div>
            <Button className="bg-orange-grad text-accent-foreground gap-1.5" onClick={() => navigate("/admin/services/new")}>
              <Plus className="h-4 w-4" /> خدمة جديدة
            </Button>
          </div>

          {loadingList ? (
            <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/30">
                  <tr>
                    <th className="px-4 py-3 text-start font-extrabold text-primary">الخدمة</th>
                    <th className="px-4 py-3 text-start font-extrabold text-primary hidden md:table-cell">القطاع</th>
                    <th className="px-4 py-3 text-start font-extrabold text-primary hidden lg:table-cell">الترتيب</th>
                    <th className="px-4 py-3 text-center font-extrabold text-primary">الحالة</th>
                    <th className="px-4 py-3 text-start font-extrabold text-primary">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {allServices.map((s) => {
                    const sectorLabel = SECTORS.find((x) => x.v === s.sector);
                    return (
                      <tr key={s.slug} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {s.hero && <img src={s.hero} alt="" className="h-10 w-16 rounded-lg object-cover" />}
                            <div>
                              <div className="font-extrabold text-primary">{isRTL ? s.title_ar : s.title_en}</div>
                              <div className="text-xs text-muted-foreground">/services/{s.slug}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <Badge variant="outline">{isRTL ? sectorLabel?.ar : sectorLabel?.en}</Badge>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{s.sort_order}</td>
                        <td className="px-4 py-3 text-center">
                          <Switch
                            checked={s.active}
                            onCheckedChange={(v) => toggleActive.mutate({ slug: s.slug, active: v })}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => navigate(`/admin/services/${s.slug}`)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8" asChild>
                              <a href={`/services/${s.slug}`} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3.5 w-3.5" /></a>
                            </Button>
                            <Button
                              size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              onClick={() => setSlugToDelete(s.slug)}
                              title={isRTL ? "حذف الخدمة" : "Delete service"}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {allServices.length === 0 && (
                <div className="py-16 text-center text-muted-foreground">
                  <LayoutGrid className="mx-auto h-12 w-12 opacity-30" />
                  <p className="mt-3 font-bold">لا توجد خدمات بعد</p>
                  <p className="text-sm">اضغط "خدمة جديدة" لإضافة أول خدمة</p>
                </div>
              )}
            </div>
          )}

          {/* Delete Confirmation Pop-up Modal */}
          <AlertDialog open={Boolean(slugToDelete)} onOpenChange={(open) => !open && setSlugToDelete(null)}>
            <AlertDialogContent dir={isRTL ? "rtl" : "ltr"}>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-destructive flex items-center gap-2 text-lg font-black">
                  <Trash2 className="h-5 w-5" />
                  {isRTL ? "تأكيد حذف الخدمة" : "Confirm Service Deletion"}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm text-muted-foreground pt-2 leading-relaxed">
                  {isRTL
                    ? `هل أنت متأكد من حذف الخدمة "${slugToDelete}"؟ سيتم حذف بطاقة الخدمة وسطح تفاصيلها نهائياً.`
                    : `Are you sure you want to delete "${slugToDelete}"? This action cannot be undone.`}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-2 pt-4">
                <AlertDialogCancel className="font-bold">{isRTL ? "إلغاء" : "Cancel"}</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold"
                  onClick={() => {
                    if (slugToDelete) {
                      deleteService.mutate(slugToDelete);
                      setSlugToDelete(null);
                    }
                  }}
                >
                  {isRTL ? "نعم، احذف الخدمة" : "Yes, Delete Service"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </AdminLayout>
    );
  }

  // ── Edit / New view ───────────────────────────────────────────────────────
  const isNew = slugParam === "new";
  if (!isNew && loadingDetail) {
    return <AdminLayout><div className="flex justify-center py-24"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div></AdminLayout>;
  }

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button size="icon" variant="ghost" onClick={() => navigate("/admin/services")} title={isRTL ? "رجوع" : "Back"}>
              <BackIcon className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-black text-primary">{isNew ? "خدمة جديدة" : `تعديل: ${isRTL ? form.title_ar : form.title_en}`}</h1>
              {!isNew && <p className="text-xs text-muted-foreground">/services/{slugParam}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Switch checked={form.active ?? true} onCheckedChange={(v) => patch("active", v)} id="active-toggle" />
              <Label htmlFor="active-toggle" className="text-sm font-bold">{form.active ? "نشطة" : "مخفية"}</Label>
            </div>
            <Button onClick={handleSave} disabled={upsert.isPending} className="bg-orange-grad text-accent-foreground gap-1.5">
              {upsert.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              حفظ
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab} dir={isRTL ? "rtl" : "ltr"}>
          <TabsList className="mb-4 flex-wrap justify-start">
            <TabsTrigger value="card" className="gap-1.5"><LayoutGrid className="h-3.5 w-3.5" /> البطاقة</TabsTrigger>
            <TabsTrigger value="detail" className="gap-1.5"><FileText className="h-3.5 w-3.5" /> صفحة التفاصيل</TabsTrigger>
            <TabsTrigger value="tiers" className="gap-1.5"><DollarSign className="h-3.5 w-3.5" /> خيارات التبرع</TabsTrigger>
            <TabsTrigger value="seo" className="gap-1.5"><Settings className="h-3.5 w-3.5" /> SEO</TabsTrigger>
          </TabsList>

          {/* ── Tab: Card ── */}
          <TabsContent value="card" className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
              <h2 className="font-black text-primary">معلومات البطاقة الأساسية</h2>
              {isNew && (
                <div>
                  <Label className="text-xs font-bold">Slug (لا يتغير بعد الإنشاء)</Label>
                  <Input placeholder="مثال: wells, mosques, food-box" value={form.slug} onChange={(e) => patch("slug", e.target.value.toLowerCase().replace(/\s+/g, "-"))} className="mt-1 font-mono" dir="ltr" />
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <div><Label className="text-xs font-bold">العنوان (عربي)</Label><Input placeholder="بناء وترميم المساجد" value={form.title_ar} onChange={(e) => patch("title_ar", e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs font-bold">Title (English)</Label><Input placeholder="Mosques building" value={form.title_en} onChange={(e) => patch("title_en", e.target.value)} className="mt-1" dir="ltr" /></div>
                <div><Label className="text-xs font-bold">البادج (عربي)</Label><Input placeholder="إسكان وبناء" value={form.badge_ar} onChange={(e) => patch("badge_ar", e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs font-bold">Badge (English)</Label><Input placeholder="Housing & Build" value={form.badge_en} onChange={(e) => patch("badge_en", e.target.value)} className="mt-1" dir="ltr" /></div>
              </div>
              <div>
                <Label className="text-xs font-bold">القطاع</Label>
                <UiSelect className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm font-bold" value={form.sector} onChange={(e) => patch("sector", e.target.value)}>
                  {SECTORS.map((s) => <option key={s.v} value={s.v}>{s.ar} / {s.en}</option>)}
                </UiSelect>
              </div>
              <div><Label className="text-xs font-bold">رابط الصورة (URL)</Label><Input placeholder="https://..." value={form.hero} onChange={(e) => patch("hero", e.target.value)} className="mt-1 font-mono" dir="ltr" /></div>
              {form.hero && <img src={form.hero} alt="" className="h-32 w-full rounded-xl object-cover" />}
              <div>
                <Label className="text-xs font-bold">Slug البرنامج</Label>
                <Input placeholder="mosques" value={form.programSlug} onChange={(e) => patch("programSlug", e.target.value)} className="mt-1 font-mono" dir="ltr" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><Label className="text-xs font-bold">المقدمة المختصرة (عربي)</Label><Textarea placeholder="2-3 جمل عن الخدمة..." value={form.intro_ar} onChange={(e) => patch("intro_ar", e.target.value)} rows={3} className="mt-1" /></div>
                <div><Label className="text-xs font-bold">Short intro (English)</Label><Textarea placeholder="2-3 sentences about the service..." value={form.intro_en} onChange={(e) => patch("intro_en", e.target.value)} rows={3} className="mt-1" dir="ltr" /></div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><Label className="text-xs font-bold">الترتيب</Label><Input type="number" value={form.sort_order} onChange={(e) => patch("sort_order", +e.target.value)} className="mt-1" /></div>
              </div>
            </div>
          </TabsContent>

          {/* ── Tab: Detail ── */}
          <TabsContent value="detail" className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
              <h2 className="font-black text-primary">محتوى صفحة التفاصيل</h2>
              <div>
                <Label className="mb-2 block text-xs font-bold">نقاط الأثر (Bullets)</Label>
                <BulletsEditor
                  ar={form.bullets_ar ?? []}
                  en={form.bullets_en ?? []}
                  onChange={(ar, en) => { patch("bullets_ar", ar); patch("bullets_en", en); }}
                />
              </div>
            </div>
          </TabsContent>

          {/* ── Tab: Tiers ── */}
          <TabsContent value="tiers" className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
              <h2 className="font-black text-primary">خيارات التبرع</h2>
              <p className="text-sm text-muted-foreground">حدد المبالغ والوحدات والأوصاف لكل مستوى. الزر "مميز" يعطيه حدودًا برتقالية.</p>
              <TiersEditor
                tiers={form.tiers ?? []}
                onChange={(t) => patch("tiers", t)}
              />
            </div>
          </TabsContent>

          {/* ── Tab: SEO ── */}
          <TabsContent value="seo" className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
              <h2 className="font-black text-primary">إعدادات SEO</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><Label className="text-xs font-bold">عنوان SEO (عربي)</Label><Input value={form.seo_title_ar} onChange={(e) => patch("seo_title_ar", e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs font-bold">SEO Title (English)</Label><Input value={form.seo_title_en} onChange={(e) => patch("seo_title_en", e.target.value)} className="mt-1" dir="ltr" /></div>
                <div><Label className="text-xs font-bold">وصف SEO (عربي)</Label><Textarea value={form.seo_desc_ar} onChange={(e) => patch("seo_desc_ar", e.target.value)} rows={3} className="mt-1" /></div>
                <div><Label className="text-xs font-bold">SEO Description (English)</Label><Textarea value={form.seo_desc_en} onChange={(e) => patch("seo_desc_en", e.target.value)} rows={3} className="mt-1" dir="ltr" /></div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Bottom Save */}
        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button variant="outline" onClick={() => navigate("/admin/services")}>إلغاء</Button>
          <Button onClick={handleSave} disabled={upsert.isPending} className="bg-orange-grad text-accent-foreground gap-1.5">
            {upsert.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            حفظ التغييرات
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminServices;
