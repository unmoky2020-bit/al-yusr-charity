import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Save, Trash2, Loader2, ExternalLink, Globe2, Tag, DollarSign, Image as ImageIcon,
  CheckCircle2, XCircle, Plus, BookOpen, Compass, Calendar, Eye, EyeOff, Sparkles, HeartHandshake, Upload, X
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useLang } from "@/i18n/LangContext";
import { toast } from "@/hooks/use-toast";
import {
  programsApiV1, axesApi, seasonsApi,
  type LaravelProgram, type LaravelAxis, type LaravelSeason,
  formatServerImageUrl, uploadImage,
} from "@/data/laravelApi";

const EMPTY_FORM = {
  slug: "",
  name_ar: "",
  name_en: "",
  tagline_ar: "",
  tagline_en: "",
  description_ar: "",
  description_en: "",
  content_ar: "",
  content_en: "",
  period_ar: "",
  period_en: "",
  target_amount: "",
  minimum_amount: "",
  image: "",
  axis_id: "",
  status: "published" as "published" | "draft",
  is_active: true,
  donation_available: true,
  hide_from_audience: false,
  sort_order: "",
  benefits_ar: "",
  benefits_en: "",
};

type FormState = typeof EMPTY_FORM;

export default function AdminProgramDetail() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === "new";
  const nav = useNavigate();

  const [axes, setAxes] = useState<LaravelAxis[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [packages, setPackages] = useState<any[]>([]);
  const [newPkg, setNewPkg] = useState({ name_ar: "سهم تبرع", name_en: "Contribution Share", amount: 100, is_active: true });
  const [savingPkg, setSavingPkg] = useState(false);
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const imgInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    axesApi.list().catch(() => [] as LaravelAxis[]).then(setAxes);
    if (!isNew && id) {
      setLoading(true);
      programsApiV1.get(id).then((p) => {
        setForm({
          slug: p.slug || "",
          name_ar: p.name_ar || p.name || "",
          name_en: p.name_en || "",
          tagline_ar: p.tagline_ar || "",
          tagline_en: p.tagline_en || "",
          description_ar: p.description_ar || p.description || "",
          description_en: p.description_en || "",
          content_ar: p.content_ar || "",
          content_en: p.content_en || "",
          period_ar: p.period_ar || "",
          period_en: p.period_en || "",
          target_amount: String(p.target_amount || ""),
          minimum_amount: String(p.minimum_amount || ""),
          image: p.image || "",
          axis_id: String(p.axis_id || ""),
          status: (p.status as "published" | "draft") || "published",
          is_active: p.is_active !== false,
          donation_available: p.donation_available !== false,
          hide_from_audience: !!p.hide_from_audience,
          sort_order: String(p.sort_order || ""),
          benefits_ar: (p.benefits_ar || []).join("\n"),
          benefits_en: (p.benefits_en || []).join("\n"),
        });
        setPackages(p.donation_packages || []);
      }).catch(() => {
        toast({
          title: isAr ? "خطأ" : "Error",
          description: isAr ? "تعذر تحميل بيانات البرنامج من الخادم" : "Could not load program data",
          variant: "destructive"
        });
      }).finally(() => setLoading(false));
    }
  }, [id, isNew, isAr]);

  const set = (key: keyof FormState, val: string | boolean) => setForm((f) => ({ ...f, [key]: val }));

  const buildPayload = (): Record<string, unknown> => {
    const payload: Record<string, unknown> = {
      slug: form.slug.trim() || form.name_ar.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "") || undefined,
      name_ar: form.name_ar.trim(),
      name_en: form.name_en.trim() || undefined,
      name: form.name_ar.trim(),
      title_ar: form.name_ar.trim(),
      title_en: form.name_en.trim() || undefined,
      tagline_ar: form.tagline_ar.trim() || undefined,
      tagline_en: form.tagline_en.trim() || undefined,
      description_ar: form.description_ar.trim() || undefined,
      description_en: form.description_en.trim() || undefined,
      description: form.description_ar.trim() || undefined,
      content_ar: form.content_ar.trim() || undefined,
      content_en: form.content_en.trim() || undefined,
      period_ar: form.period_ar.trim() || undefined,
      period_en: form.period_en.trim() || undefined,
      target_amount: form.target_amount ? Number(form.target_amount) : undefined,
      minimum_amount: form.minimum_amount ? Number(form.minimum_amount) : undefined,
      axis_id: form.axis_id ? Number(form.axis_id) : (axes[0]?.id || undefined),
      status: form.status,
      is_active: form.is_active,
      donation_available: form.donation_available,
      hide_from_audience: form.hide_from_audience,
      sort_order: form.sort_order ? Number(form.sort_order) : undefined,
      benefits_ar: form.benefits_ar ? form.benefits_ar.split("\n").map((s) => s.trim()).filter(Boolean) : undefined,
      benefits_en: form.benefits_en ? form.benefits_en.split("\n").map((s) => s.trim()).filter(Boolean) : undefined,
    };

    if (pendingImageFile) {
      payload.image = pendingImageFile;
    }
    return payload;
  };

  const handleSave = async () => {
    if (!form.name_ar.trim()) {
      toast({
        title: isAr ? "حقل مطلوب" : "Required",
        description: isAr ? "يرجى كتابة اسم البرنامج بالعربية" : "Arabic program name is required",
        variant: "destructive"
      });
      return;
    }
    setSaving(true);
    try {
      const payload = buildPayload();
      if (isNew) {
        const created = await programsApiV1.create(payload as any);
        toast({ title: isAr ? "تم إنشاء البرنامج بنجاح" : "Program created successfully" });
        const newId = (created as any)?.data?.id ?? (created as any)?.id;
        if (newId) {
          nav(`/admin/programs/${newId}`, { replace: true });
        } else {
          nav("/admin/programs");
        }
      } else {
        const res = await programsApiV1.update(id!, payload as any);
        toast({ title: isAr ? "تم حفظ التعديلات بنجاح" : "Changes saved successfully" });
        setPendingImageFile(null);
        const updatedImg = (res as any)?.data?.image || (res as any)?.image;
        if (updatedImg) {
          set("image", updatedImg);
          setImagePreview("");
        }
      }
    } catch (err: any) {
      toast({
        title: isAr ? "خطأ في الحفظ" : "Save Error",
        description: err?.message || (isAr ? "تعذر حفظ البرنامج" : "Could not save program"),
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || isNew) return;
    const ok = window.confirm(isAr ? "هل أنت متأكد من حذف هذا البرنامج نهائياً من قاعدة البيانات؟" : "Are you sure you want to delete this program permanently?");
    if (!ok) return;
    setDeleting(true);
    try {
      await programsApiV1.remove(id);
      toast({ title: isAr ? "تم حذف البرنامج" : "Program deleted" });
      nav("/admin/programs");
    } catch (err: any) {
      toast({
        title: isAr ? "خطأ في الحذف" : "Delete Error",
        description: err?.message || "",
        variant: "destructive"
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleAddPackage = async () => {
    if (!id || isNew) {
      toast({
        title: isAr ? "تنبيه" : "Notice",
        description: isAr ? "يرجى حفظ البرنامج أولاً قبل إضافة باقات تبرع" : "Save the program first before adding donation packages"
      });
      return;
    }
    if (!newPkg.name_ar.trim() || !newPkg.amount) return;
    setSavingPkg(true);
    try {
      await programsApiV1.addPackage(id, {
        name_ar: newPkg.name_ar.trim(),
        name_en: newPkg.name_en.trim() || undefined,
        amount: Number(newPkg.amount),
        sort_order: packages.length + 1,
        is_active: newPkg.is_active,
      });
      toast({ title: isAr ? "تمت إضافة باقة التبرع" : "Donation package added" });
      const updated = await programsApiV1.get(id);
      setPackages(updated.donation_packages || []);
      setNewPkg({ name_ar: "سهم تبرع", name_en: "Contribution Share", amount: 100, is_active: true });
    } catch (err: any) {
      toast({
        title: isAr ? "خطأ" : "Error",
        description: err?.message || "",
        variant: "destructive"
      });
    } finally {
      setSavingPkg(false);
    }
  };

  const handleImageSelect = (file: File) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg", "image/gif", "image/svg+xml"];
    if (!allowed.includes(file.type) && !file.type.startsWith("image/")) {
      toast({
        title: isAr ? "نوع غير مدعوم" : "Unsupported type",
        description: isAr ? "يرجى اختيار صورة (JPG, PNG, WebP)" : "Please select an image file",
        variant: "destructive"
      });
      return;
    }
    setPendingImageFile(file);
    const localUrl = URL.createObjectURL(file);
    setImagePreview(localUrl);
    set("image", localUrl);
    toast({
      title: isAr ? "تم اختيار الصورة" : "Image selected",
      description: isAr ? "سيتم حفظها في قاعدة البيانات فور الضغط على «حفظ التغييرات»" : "Will be saved when you click Save Changes",
    });
  };

  const handleRemoveImage = () => {
    setPendingImageFile(null);
    setImagePreview("");
    set("image", "");
  };

  const BackArrow = isAr ? ArrowRight : ArrowLeft;

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex h-[50vh] flex-col items-center justify-center gap-3 text-muted-foreground" dir={isAr ? "rtl" : "ltr"}>
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-bold">{isAr ? "جاري تحميل تفاصيل البرنامج..." : "Loading program details..."}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6" dir={isAr ? "rtl" : "ltr"}>
        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-card">
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" size="icon" className="h-10 w-10 rounded-2xl border-border">
              <Link to="/admin/programs" aria-label={isAr ? "العودة للبرامج" : "Back to programs"}>
                <BackArrow className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary">
                  <BookOpen className="h-4 w-4" />
                </span>
                <h1 className="text-xl font-black text-foreground sm:text-2xl">
                  {isNew
                    ? (isAr ? "إضافة برنامج جديد" : "New Program")
                    : (form.name_ar || (isAr ? "تفاصيل البرنامج" : "Program Details"))}
                </h1>
              </div>
              <p className="mt-1 text-xs font-semibold text-muted-foreground">
                {isNew
                  ? (isAr ? "إضافة برنامج جديد وتحديد محاوره وباقات تبرعه" : "Create a new charity program with packages")
                  : `${isAr ? "معرف البرنامج:" : "Program ID:"} ${id} · ${form.slug || "-"}`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {!isNew && form.slug && (
              <Button asChild variant="ghost" size="sm" className="gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground">
                <Link to={`/programs/${form.slug}`} target="_blank">
                  <ExternalLink className="h-3.5 w-3.5" />
                  {isAr ? "معاينة بالموقع" : "View Live"}
                </Link>
              </Button>
            )}

            {!isNew && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
                className="gap-1.5 rounded-xl font-bold"
              >
                {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                {isAr ? "حذف" : "Delete"}
              </Button>
            )}

            <Button
              onClick={handleSave}
              disabled={saving}
              className="gap-1.5 rounded-xl bg-primary text-primary-foreground font-black shadow-md hover:bg-primary/95"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isAr ? "حفظ التغييرات" : "Save Changes"}
            </Button>
          </div>
        </div>

        {/* Quick Status Bar */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-card p-3.5 shadow-xs">
            <div>
              <Label className="text-xs font-bold text-foreground">{isAr ? "حالة النشر" : "Publish Status"}</Label>
              <p className="text-[11px] font-semibold text-muted-foreground">
                {form.status === "published" ? (isAr ? "منشور ومتاح" : "Published") : (isAr ? "مسودة" : "Draft")}
              </p>
            </div>
            <Switch
              checked={form.status === "published"}
              onCheckedChange={(c) => set("status", c ? "published" : "draft")}
            />
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-card p-3.5 shadow-xs">
            <div>
              <Label className="text-xs font-bold text-foreground">{isAr ? "برنامج نشط" : "Active"}</Label>
              <p className="text-[11px] font-semibold text-muted-foreground">
                {form.is_active ? (isAr ? "مفعّل" : "Active") : (isAr ? "معطّل" : "Inactive")}
              </p>
            </div>
            <Switch checked={form.is_active} onCheckedChange={(c) => set("is_active", c)} />
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-card p-3.5 shadow-xs">
            <div>
              <Label className="text-xs font-bold text-foreground">{isAr ? "قبول التبرعات" : "Donations"}</Label>
              <p className="text-[11px] font-semibold text-muted-foreground">
                {form.donation_available ? (isAr ? "مفتوح للتبرع" : "Accepting") : (isAr ? "مغلق" : "Closed")}
              </p>
            </div>
            <Switch checked={form.donation_available} onCheckedChange={(c) => set("donation_available", c)} />
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-card p-3.5 shadow-xs">
            <div>
              <Label className="text-xs font-bold text-foreground">{isAr ? "إخفاء عن الجمهور" : "Hide"}</Label>
              <p className="text-[11px] font-semibold text-muted-foreground">
                {form.hide_from_audience ? (isAr ? "مخفي" : "Hidden") : (isAr ? "ظاهر" : "Visible")}
              </p>
            </div>
            <Switch checked={form.hide_from_audience} onCheckedChange={(c) => set("hide_from_audience", c)} />
          </div>
        </div>

        {/* Form Tabs */}
        <Tabs defaultValue="basic" dir={isAr ? "rtl" : "ltr"} className="space-y-4">
          <TabsList className="grid h-12 w-full grid-cols-4 rounded-2xl bg-muted/60 p-1" dir={isAr ? "rtl" : "ltr"}>
            <TabsTrigger value="basic" className="rounded-xl text-xs font-bold data-[state=active]:bg-card data-[state=active]:shadow-xs">
              {isAr ? "البيانات الأساسية" : "Basic Info"}
            </TabsTrigger>
            <TabsTrigger value="content" className="rounded-xl text-xs font-bold data-[state=active]:bg-card data-[state=active]:shadow-xs">
              {isAr ? "القصة والمحتوى" : "Content & Story"}
            </TabsTrigger>
            <TabsTrigger value="financial" className="rounded-xl text-xs font-bold data-[state=active]:bg-card data-[state=active]:shadow-xs">
              {isAr ? "المالية والباقات" : "Financial & Packages"}
            </TabsTrigger>
            <TabsTrigger value="classification" className="rounded-xl text-xs font-bold data-[state=active]:bg-card data-[state=active]:shadow-xs">
              {isAr ? "المحور والتصنيف" : "Classification"}
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Basic Info */}
          <TabsContent value="basic" className="space-y-4" dir={isAr ? "rtl" : "ltr"}>
            <div className="rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-card space-y-4">
              <h2 className="text-sm font-black text-foreground flex items-center gap-2">
                <Globe2 className="h-4 w-4 text-primary" />
                {isAr ? "الأسماء والشعارات (عربي / إنجليزي)" : "Names & Taglines"}
              </h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-xs font-bold">{isAr ? "اسم البرنامج بالعربية *" : "Arabic Name *"}</Label>
                  <Input
                    dir="rtl"
                    value={form.name_ar}
                    onChange={(e) => set("name_ar", e.target.value)}
                    placeholder={isAr ? "مثال: كفالة طالب علم" : "e.g. Student Sponsorship"}
                    className="mt-1.5 h-10 rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold">{isAr ? "اسم البرنامج بالإنجليزية" : "English Name"}</Label>
                  <Input
                    value={form.name_en}
                    onChange={(e) => set("name_en", e.target.value)}
                    placeholder="e.g. Student Sponsorship"
                    className="mt-1.5 h-10 rounded-xl text-left"
                    dir="ltr"
                  />
                </div>

                <div>
                  <Label className="text-xs font-bold">{isAr ? "الرابط المختصر (Slug)" : "URL Slug"}</Label>
                  <Input
                    value={form.slug}
                    onChange={(e) => set("slug", e.target.value)}
                    placeholder="e.g. education"
                    className="mt-1.5 h-10 rounded-xl text-left font-mono text-xs"
                    dir="ltr"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold">{isAr ? "ترتيب العرض (Sort Order)" : "Sort Order"}</Label>
                  <Input
                    type="number"
                    dir="ltr"
                    value={form.sort_order}
                    onChange={(e) => set("sort_order", e.target.value)}
                    placeholder="1"
                    className="mt-1.5 h-10 rounded-xl"
                  />
                </div>

                <div>
                  <Label className="text-xs font-bold">{isAr ? "الشعار المختصر بالعربية (Tagline)" : "Arabic Tagline"}</Label>
                  <Input
                    dir="rtl"
                    value={form.tagline_ar}
                    onChange={(e) => set("tagline_ar", e.target.value)}
                    placeholder={isAr ? "مثال: تعليم يكسر دورة الفقر" : "Brief slogan"}
                    className="mt-1.5 h-10 rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold">{isAr ? "الشعار المختصر بالإنجليزية" : "English Tagline"}</Label>
                  <Input
                    value={form.tagline_en}
                    onChange={(e) => set("tagline_en", e.target.value)}
                    placeholder="Brief slogan"
                    className="mt-1.5 h-10 rounded-xl text-left"
                    dir="ltr"
                  />
                </div>

                <div>
                  <Label className="text-xs font-bold">{isAr ? "الموسم أو الفترة بالعربية" : "Arabic Season/Period"}</Label>
                  <Input
                    dir="rtl"
                    value={form.period_ar}
                    onChange={(e) => set("period_ar", e.target.value)}
                    placeholder={isAr ? "مثال: طوال العام أو موسم الشتاء" : "e.g. Year-round"}
                    className="mt-1.5 h-10 rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold">{isAr ? "الموسم أو الفترة بالإنجليزية" : "English Season/Period"}</Label>
                  <Input
                    value={form.period_en}
                    onChange={(e) => set("period_en", e.target.value)}
                    placeholder="e.g. Year-round"
                    className="mt-1.5 h-10 rounded-xl text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Image Upload Widget */}
              <div>
                <Label className="text-xs font-bold">{isAr ? "الصورة الرئيسية للبرنامج (يدعم JPG, PNG, WebP)" : "Cover Image (JPG, PNG, WebP)"}</Label>
                <input
                  ref={imgInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg,image/gif,image/svg+xml"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageSelect(f); e.target.value = ""; }}
                />

                {/* Image Preview Area */}
                <div
                  className="mt-2 relative group rounded-2xl border-2 border-dashed border-border hover:border-primary/60 bg-muted/30 transition-colors overflow-hidden"
                  style={{ minHeight: 160 }}
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "var(--primary)"; }}
                  onDragLeave={(e) => { e.currentTarget.style.borderColor = ""; }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.borderColor = "";
                    const f = e.dataTransfer.files?.[0];
                    if (f) handleImageSelect(f);
                  }}
                >
                  {(imagePreview || form.image) ? (
                    <>
                      <img
                        src={imagePreview || formatServerImageUrl(form.image) || form.image}
                        alt="program cover"
                        className="w-full object-cover rounded-2xl"
                        style={{ maxHeight: 240 }}
                        onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                      />
                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="gap-1.5 rounded-xl text-xs font-bold shadow-md"
                          onClick={() => imgInputRef.current?.click()}
                        >
                          <Upload className="h-3.5 w-3.5" />
                          {isAr ? "تغيير الصورة" : "Change Image"}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          className="gap-1.5 rounded-xl text-xs font-bold shadow-md"
                          onClick={handleRemoveImage}
                        >
                          <X className="h-3.5 w-3.5" />
                          {isAr ? "حذف" : "Remove"}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="w-full h-full flex flex-col items-center justify-center gap-3 p-8 text-muted-foreground hover:text-primary transition-colors"
                      onClick={() => imgInputRef.current?.click()}
                    >
                      <ImageIcon className="h-8 w-8" />
                      <div className="text-center">
                        <p className="text-sm font-bold">
                          {isAr ? "انقر لاختيار صورة من جهازك" : "Click to select image from device"}
                        </p>
                        <p className="text-xs mt-1 text-muted-foreground">
                          {isAr ? "أو اسحب وأفلت الصورة هنا (يدعم كل الصيغ JPG, PNG, WebP)" : "or drag & drop here (JPG, PNG, WebP)"}
                        </p>
                      </div>
                    </button>
                  )}
                </div>

                {pendingImageFile && (
                  <p className="mt-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {isAr ? `تم اختيار: ${pendingImageFile.name} (سيتم حفظها في السيرفر عند حفظ البرنامج)` : `Selected: ${pendingImageFile.name} (will save to server upon program save)`}
                  </p>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Tab 2: Content & Story */}
          <TabsContent value="content" className="space-y-4" dir={isAr ? "rtl" : "ltr"}>
            <div className="rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-card space-y-4">
              <h2 className="text-sm font-black text-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                {isAr ? "الوصف والقصة الكاملة والمميزات" : "Description, Story & Benefits"}
              </h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-xs font-bold">{isAr ? "الوصف القصير بالعربية" : "Arabic Short Description"}</Label>
                  <Textarea
                    rows={3}
                    dir="rtl"
                    value={form.description_ar}
                    onChange={(e) => set("description_ar", e.target.value)}
                    placeholder={isAr ? "وصف مختصر يظهر في الكروت والقوائم..." : "Short description for cards..."}
                    className="mt-1.5 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold">{isAr ? "الوصف القصير بالإنجليزية" : "English Short Description"}</Label>
                  <Textarea
                    rows={3}
                    value={form.description_en}
                    onChange={(e) => set("description_en", e.target.value)}
                    placeholder="Short description for cards..."
                    className="mt-1.5 rounded-xl text-xs text-left"
                    dir="ltr"
                  />
                </div>

                <div className="sm:col-span-2">
                  <Label className="text-xs font-bold">{isAr ? "محتوى القصة الكامل بالعربية" : "Full Story Content (Arabic)"}</Label>
                  <Textarea
                    rows={6}
                    dir="rtl"
                    value={form.content_ar}
                    onChange={(e) => set("content_ar", e.target.value)}
                    placeholder={isAr ? "اكتب تفاصيل البرنامج وقصته الميدانية وأثره على الأسر المستحقة..." : "Full program story and impact..."}
                    className="mt-1.5 rounded-xl text-xs leading-relaxed"
                  />
                </div>

                <div className="sm:col-span-2">
                  <Label className="text-xs font-bold">{isAr ? "محتوى القصة الكامل بالإنجليزية" : "Full Story Content (English)"}</Label>
                  <Textarea
                    rows={4}
                    value={form.content_en}
                    onChange={(e) => set("content_en", e.target.value)}
                    placeholder="Full program story in English..."
                    className="mt-1.5 rounded-xl text-xs leading-relaxed text-left"
                    dir="ltr"
                  />
                </div>

                <div>
                  <Label className="text-xs font-bold">
                    {isAr ? "مميزات البرنامج بالعربية (كل سطر ميزة)" : "Benefits (Arabic - 1 per line)"}
                  </Label>
                  <Textarea
                    rows={4}
                    dir="rtl"
                    value={form.benefits_ar}
                    onChange={(e) => set("benefits_ar", e.target.value)}
                    placeholder={isAr ? "توزيع موثّق بالصور والفيديو\nإيصال فوري بعد التبرع\nمتابعة ميدانية مستمرة" : "One benefit per line"}
                    className="mt-1.5 rounded-xl text-xs font-mono"
                  />
                </div>

                <div>
                  <Label className="text-xs font-bold">
                    {isAr ? "مميزات البرنامج بالإنجليزية (كل سطر ميزة)" : "Benefits (English - 1 per line)"}
                  </Label>
                  <Textarea
                    rows={4}
                    value={form.benefits_en}
                    onChange={(e) => set("benefits_en", e.target.value)}
                    placeholder="Documented distribution\nInstant receipt\nField follow-up"
                    className="mt-1.5 rounded-xl text-xs font-mono text-left"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab 3: Financial & Packages */}
          <TabsContent value="financial" className="space-y-4" dir={isAr ? "rtl" : "ltr"}>
            <div className="rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-card space-y-5">
              <h2 className="text-sm font-black text-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                {isAr ? "المبالغ المستهدفة وأسهم التبرع" : "Amounts & Donation Shares"}
              </h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-xs font-bold">{isAr ? "المبلغ المستهدف الإجمالي (ج.م)" : "Target Amount (EGP)"}</Label>
                  <Input
                    type="number"
                    dir="ltr"
                    value={form.target_amount}
                    onChange={(e) => set("target_amount", e.target.value)}
                    placeholder="50000"
                    className="mt-1.5 h-10 rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold">{isAr ? "الحد الأدنى للتبرع / سعر السهم يبدأ من (ج.م)" : "Minimum / Price From (EGP)"}</Label>
                  <Input
                    type="number"
                    dir="ltr"
                    value={form.minimum_amount}
                    onChange={(e) => set("minimum_amount", e.target.value)}
                    placeholder="100"
                    className="mt-1.5 h-10 rounded-xl"
                  />
                </div>
              </div>

              {/* Donation Packages list */}
              <div className="border-t border-border/70 pt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-black text-foreground">{isAr ? "باقات وأسهم التبرع المتاحة للبرنامج" : "Donation Packages"}</h3>
                    <p className="text-[11px] text-muted-foreground">{isAr ? "الباقات التي تظهر للمتبرع لاختيار قيمة المساهمة" : "Predefined donation amounts for donors"}</p>
                  </div>
                  <span className="rounded-full bg-secondary/15 px-2.5 py-0.5 text-xs font-black text-secondary">
                    {packages.length} {isAr ? "باقات" : "packages"}
                  </span>
                </div>

                {packages.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                    {isAr ? "لا توجد باقات تبرع مسجلة لهذا البرنامج حالياً. يمكنك إضافة باقة تبرع جديدة أدناه." : "No donation packages created yet."}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                    {packages.map((pkg, i) => (
                      <div key={pkg.id || i} className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/40 p-3 text-xs">
                        <div>
                          <p className="font-black text-foreground">{pkg.name_ar || pkg.name || "-"}</p>
                          {pkg.name_en && <p className="text-[10px] text-muted-foreground">{pkg.name_en}</p>}
                        </div>
                        <span className="rounded-xl bg-primary/10 px-2.5 py-1 font-mono font-black text-primary">
                          {Number(pkg.amount).toLocaleString(isAr ? "ar-EG" : "en-US")} {isAr ? "ج" : "EGP"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add package form */}
                {!isNew && (
                  <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                    <h4 className="text-xs font-black text-primary flex items-center gap-1.5">
                      <Plus className="h-3.5 w-3.5" />
                      {isAr ? "إضافة باقة أو سهم تبرع جديد" : "Add New Donation Package"}
                    </h4>
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                      <Input
                        dir="rtl"
                        value={newPkg.name_ar}
                        onChange={(e) => setNewPkg({ ...newPkg, name_ar: e.target.value })}
                        placeholder={isAr ? "اسم الباقة (مثال: سهم الخير 200 ج)" : "Package Name (Ar)"}
                        className="h-9 rounded-xl text-xs"
                      />
                      <Input
                        value={newPkg.name_en}
                        onChange={(e) => setNewPkg({ ...newPkg, name_en: e.target.value })}
                        placeholder="Package Name (En)"
                        className="h-9 rounded-xl text-xs text-left"
                        dir="ltr"
                      />
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          dir="ltr"
                          value={newPkg.amount}
                          onChange={(e) => setNewPkg({ ...newPkg, amount: Number(e.target.value) })}
                          placeholder="المبلغ"
                          className="h-9 rounded-xl text-xs"
                        />
                        <Button
                          size="sm"
                          onClick={handleAddPackage}
                          disabled={savingPkg}
                          className="shrink-0 rounded-xl h-9 px-4 font-bold"
                        >
                          {savingPkg ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                          {isAr ? "إضافة" : "Add"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Tab 4: Classification */}
          <TabsContent value="classification" className="space-y-4" dir={isAr ? "rtl" : "ltr"}>
            <div className="rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-card space-y-4">
              <h2 className="text-sm font-black text-foreground flex items-center gap-2">
                <Compass className="h-4 w-4 text-primary" />
                {isAr ? "ربط البرنامج بمحاور رسالة المؤسسة" : "Work Axis Association"}
              </h2>

              <div>
                <Label className="text-xs font-bold">{isAr ? "المحور الأساسي التابع له البرنامج *" : "Primary Work Axis *"}</Label>
                <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                  {axes.map((ax) => {
                    const isSelected = String(form.axis_id) === String(ax.id);
                    return (
                      <button
                        key={ax.id}
                        type="button"
                        onClick={() => set("axis_id", String(ax.id))}
                        className={`flex items-center gap-3 rounded-2xl border p-3.5 text-start transition-all ${
                          isSelected
                            ? "border-primary bg-primary/10 shadow-xs ring-2 ring-primary/30"
                            : "border-border/80 bg-muted/30 hover:border-border hover:bg-muted/60"
                        }`}
                      >
                        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl font-bold ${isSelected ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground border border-border"}`}>
                          {ax.id}
                        </span>
                        <div>
                          <p className="text-xs font-black text-foreground">{ax.name_ar || ax.name_en}</p>
                          <p className="text-[10px] text-muted-foreground">{ax.slug}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {axes.length === 0 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {isAr ? "جاري تحميل قائمة المحاور من قاعدة البيانات..." : "Loading available axes..."}
                  </p>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
