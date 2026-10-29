import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useLang } from "@/i18n/LangContext";
import {
  ArrowRight,
  ArrowLeft,
  Save,
  Upload,
  Layers,
  Sparkles,
  BarChart3,
  CheckCircle2,
  FileText,
  ImageIcon,
  Loader2,
  Plus,
  Trash2,
  Eye,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  ChevronLeft,
  HelpCircle,
} from "lucide-react";
import { EntityFaqManager } from "@/components/admin/faq/EntityFaqManager";
import { axesApi, LaravelAxis, galleryApi, formatServerImageUrl } from "@/data/laravelApi";
import imgFood from "@/assets/axis-food.jpg";
import imgHealth from "@/assets/axis-health.jpg";
import imgEdu from "@/assets/axis-education.jpg";
import { publicUrls } from "@/lib/publicUrls";

const DEFAULT_AXES_IMAGES: Record<string, string> = {
  food: imgFood,
  health: imgHealth,
  education: imgEdu,
};

export const AdminAxisDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { lang } = useLang();
  const isRTL = lang === "ar";
  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [axis, setAxis] = useState<LaravelAxis | null>(null);
  const [allAxes, setAllAxes] = useState<LaravelAxis[]>([]);
  const [activeTab, setActiveTab] = useState<string>("basic");

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    // Clean up stale localStorage
    try {
      localStorage.removeItem("elyusr_axes_items_data");
    } catch {}

    // Fetch live from backend API exclusively
    axesApi
      .getById(id)
      .then((serverData) => {
        if (serverData) {
          setAxis((prev) => ({
            ...(prev || {}),
            ...serverData,
            image: serverData.image || prev?.image,
            statistics: serverData.statistics || prev?.statistics || {},
            features_ar: serverData.features_ar || prev?.features_ar || [],
            features_en: serverData.features_en || prev?.features_en || [],
          }));
        }
      })
      .catch(() => {
        // Fallback: search in live API list
        axesApi.adminList().then((list) => {
          if (list && list.length > 0) {
            setAllAxes(list);
            const item = list.find((a) => String(a.id) === String(id) || a.slug === id);
            if (item) setAxis(item);
          }
        }).catch(() => {});
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleFieldChange = (field: keyof LaravelAxis, val: any) => {
    if (!axis) return;
    setAxis({ ...axis, [field]: val });
  };

  // Reorder Bullets (Features)
  const handleMoveBullet = (index: number, direction: "up" | "down", langKey: "ar" | "en") => {
    if (!axis) return;
    const field = langKey === "ar" ? "features_ar" : "features_en";
    const bullets = [...(axis[field] || [])];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= bullets.length) return;

    const temp = bullets[targetIdx];
    bullets[targetIdx] = bullets[index];
    bullets[index] = temp;
    setAxis({ ...axis, [field]: bullets });
  };

  const handleUpdateBullet = (index: number, text: string, langKey: "ar" | "en") => {
    if (!axis) return;
    const field = langKey === "ar" ? "features_ar" : "features_en";
    const bullets = [...(axis[field] || [])];
    bullets[index] = text;
    setAxis({ ...axis, [field]: bullets });
  };

  const handleAddBullet = (langKey: "ar" | "en") => {
    if (!axis) return;
    const field = langKey === "ar" ? "features_ar" : "features_en";
    const bullets = [...(axis[field] || []), ""];
    setAxis({ ...axis, [field]: bullets });
  };

  const handleRemoveBullet = (index: number, langKey: "ar" | "en") => {
    if (!axis) return;
    const field = langKey === "ar" ? "features_ar" : "features_en";
    const bullets = (axis[field] || []).filter((_, i) => i !== index);
    setAxis({ ...axis, [field]: bullets });
  };

  // Statistics
  const handleUpdateStat = (oldKey: string, newKey: string, val: string) => {
    if (!axis) return;
    const stats = { ...(axis.statistics || {}) };
    if (oldKey !== newKey) delete stats[oldKey];
    stats[newKey] = val;
    setAxis({ ...axis, statistics: stats });
  };

  const handleAddStat = (presetKey?: string, presetVal?: string) => {
    if (!axis) return;
    const stats = { ...(axis.statistics || {}) };
    const newKey = presetKey || `metric_${Object.keys(stats).length + 1}`;
    stats[newKey] = presetVal || "1,000";
    setAxis({ ...axis, statistics: stats });
  };

  const handleRemoveStat = (keyToRemove: string) => {
    if (!axis) return;
    const stats = { ...(axis.statistics || {}) };
    delete stats[keyToRemove];
    setAxis({ ...axis, statistics: stats });
  };

  // Image Upload — upload file directly via axesApi.update with all axis fields
  const handleUploadImage = async (file: File) => {
    if (!file || !axis) return;
    setUploading(true);
    try {
      const updated = await axesApi.update(axis.id, axis, file);
      if (updated) {
        setAxis(updated);
        toast.success(isRTL ? "تم حفظ ورفع صورة المحور في السيرفر بنجاح" : "Axis image saved to backend successfully");
        return;
      }
    } catch (err: any) {
      console.error("Axis image upload error:", err);
      toast.error(err?.message || (isRTL ? "تعذر رفع صورة المحور على السيرفر" : "Failed to upload image"));
    } finally {
      setUploading(false);
    }
  };

  // Save changes — save all axis fields to API
  const handleSave = async () => {
    if (!axis) return;
    setSaving(true);
    try {
      const saved = await axesApi.update(axis.id, axis);
      if (saved) {
        setAxis((prev) => (prev ? { ...prev, ...saved, image: saved.image || prev.image } : prev));
      }
      toast.success(isRTL ? `تم حفظ وتحديث بيانات محور "${axis.name_ar}" بنجاح في السيرفر` : "Axis updated successfully on server");
    } catch (err: any) {
      console.error("Axis save error:", err);
      toast.error(err?.message || (isRTL ? "حدث خطأ أثناء الحفظ على السيرفر" : "Save error"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title={{ ar: "تعديل تفاصيل المحور", en: "Edit Axis Details" }}>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      </AdminLayout>
    );
  }

  if (!axis) {
    return (
      <AdminLayout title={{ ar: "المحور غير موجود", en: "Axis Not Found" }}>
        <div className="p-8 text-center space-y-4">
          <p className="text-muted-foreground text-sm">لم يتم العثور على المحور المطلوب.</p>
          <Button onClick={() => navigate("/admin/axes")} variant="outline" className="gap-2">
            <BackArrow className="h-4 w-4" />
            <span>العودة لقائمة المحاور</span>
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const statEntries = Object.entries(axis.statistics || {});

  const TABS = [
    { id: "basic", label: isRTL ? "البيانات الأساسية" : "Basic Info", icon: FileText, count: null },
    { id: "stats", label: isRTL ? "أرقام التأثير" : "Impact Stats", icon: BarChart3, count: statEntries.length },
    { id: "features", label: isRTL ? "الخدمات والنقاط" : "Services & Points", icon: CheckCircle2, count: (axis.features_ar || []).length },
    { id: "media", label: isRTL ? "الصورة والوسائط" : "Media & Image", icon: ImageIcon, count: null },
    { id: "faq", label: isRTL ? "الأسئلة الشائعة" : "FAQ", icon: HelpCircle, count: null },
  ];

  const currentTabIndex = TABS.findIndex((t) => t.id === activeTab);
  const prevTab = currentTabIndex > 0 ? TABS[currentTabIndex - 1] : null;
  const nextTab = currentTabIndex < TABS.length - 1 ? TABS[currentTabIndex + 1] : null;

  const goToNextTab = () => {
    if (nextTab) setActiveTab(nextTab.id);
  };
  const goToPrevTab = () => {
    if (prevTab) setActiveTab(prevTab.id);
  };

  return (
    <AdminLayout title={{ ar: `تعديل محور: ${axis.name_ar}`, en: `Edit Axis: ${axis.name_en || axis.name_ar}` }}>
      <Helmet>
        <title>{isRTL ? `تعديل محور: ${axis.name_ar} | لوحة التحكم` : `Edit Axis: ${axis.name_en} | Admin`}</title>
      </Helmet>

      <div dir={isRTL ? "rtl" : "ltr"} className="space-y-6 pb-20">
        {/* شريط التحكم والتنقل السريع بين المحاور */}
        <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/admin/axes")}
                className="gap-1.5 text-xs font-bold h-9"
              >
                <BackArrow className="h-4 w-4" />
                <span>{isRTL ? "العودة للمحاور" : "Back to Axes"}</span>
              </Button>

              <div>
                <h1 className="text-lg font-black text-foreground flex items-center gap-2">
                  <span>{axis.name_ar}</span>
                  <span dir="ltr" className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    /axes/{axis.slug}
                  </span>
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isRTL ? "تعديل شامل لكافة محتويات صفحة المحور وأرقامها وخدماتها" : "Comprehensive editor for this axis"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <a
                href={publicUrls.axis(axis.slug)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-muted/40 hover:bg-muted text-xs font-bold text-foreground transition"
              >
                <Eye className="h-3.5 w-3.5 text-emerald-600" />
                <span>{isRTL ? "معاينة الصفحة العامة" : "View Live"}</span>
              </a>

              <Button
                onClick={handleSave}
                disabled={saving}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm h-9 px-5"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                <span>{isRTL ? "حفظ التغييرات" : "Save Changes"}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* كارت التعديل الرئيسي مع التبويبات بالـ RTL الصحيح والمتناسق */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-5">
          <Tabs value={activeTab} onValueChange={setActiveTab} dir={isRTL ? "rtl" : "ltr"} className="w-full">
            {/* شريط التبويبات المتناسق بعرض كامل ومضبوط */}
            <div className="w-full overflow-x-auto pb-1 mb-4 scrollbar-none">
              <TabsList className="grid grid-cols-5 w-full min-w-[620px] sm:min-w-0 h-12 bg-muted/60 p-1.5 text-xs font-bold rounded-2xl border border-border/60 gap-1.5">
                {TABS.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap data-[state=active]:bg-background data-[state=active]:text-emerald-700 data-[state=active]:font-black data-[state=active]:shadow-xs text-muted-foreground hover:text-foreground"
                  >
                    <tab.icon className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span>{tab.label}</span>
                    {tab.count !== null && (
                      <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-mono font-black rounded-full bg-muted-foreground/15 text-foreground">
                        {tab.count}
                      </span>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* 1. التبويب الأول: البيانات الأساسية */}
            <TabsContent value="basic" className="space-y-4 pt-2">
              {/* الأسماء */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block text-right">اسم المحور (بالعربية) *</label>
                  <Input
                    value={axis.name_ar}
                    onChange={(e) => handleFieldChange("name_ar", e.target.value)}
                    dir="rtl"
                    className="text-xs font-bold h-9 text-right"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block text-left">Axis Name (English)</label>
                  <Input
                    value={axis.name_en || ""}
                    onChange={(e) => handleFieldChange("name_en", e.target.value)}
                    dir="ltr"
                    className="text-xs h-9 text-left font-sans"
                  />
                </div>
              </div>

              {/* الشارات والرابط */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block text-right">شارة المحور (بالعربية)</label>
                  <Input
                    value={axis.badge_ar || ""}
                    onChange={(e) => handleFieldChange("badge_ar", e.target.value)}
                    placeholder="أمان غذائي للأسرة"
                    dir="rtl"
                    className="text-xs h-9 text-right"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block text-left">Badge Tag (English)</label>
                  <Input
                    value={axis.badge_en || ""}
                    onChange={(e) => handleFieldChange("badge_en", e.target.value)}
                    placeholder="Food security for every family"
                    dir="ltr"
                    className="text-xs h-9 text-left font-sans"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block text-left">الرابط التعريفي (Slug)</label>
                  <Input
                    value={axis.slug}
                    onChange={(e) => handleFieldChange("slug", e.target.value)}
                    dir="ltr"
                    className="text-xs h-9 text-left font-mono"
                  />
                </div>
              </div>

              {/* الوصف والرسالة */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block text-right">الوصف والرسالة التمهيدية (بالعربية)</label>
                  <Textarea
                    value={axis.description_ar || ""}
                    onChange={(e) => handleFieldChange("description_ar", e.target.value)}
                    rows={4}
                    dir="rtl"
                    className="text-xs text-right leading-relaxed"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block text-left">Description & Mission (English)</label>
                  <Textarea
                    value={axis.description_en || ""}
                    onChange={(e) => handleFieldChange("description_en", e.target.value)}
                    rows={4}
                    dir="ltr"
                    className="text-xs text-left leading-relaxed font-sans"
                  />
                </div>
              </div>

              {/* شريط الانتقال للتبويب التالي */}
              <div className="flex items-center justify-end pt-4 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  onClick={goToNextTab}
                  className="gap-2 text-xs font-black text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border-emerald-500/30 h-9 rounded-xl"
                >
                  <span>{isRTL ? "التالي: أرقام التأثير ⬅" : "Next: Impact Stats"}</span>
                </Button>
              </div>
            </TabsContent>

            {/* 2. التبويب الثاني: أرقام التأثير (Impact Statistics) */}
            <TabsContent value="stats" className="space-y-4 pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black text-foreground">أرقام وإحصائيات التأثير (Impact Stats)</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    هذه الأرقام تظهر ككروت بارزة ومؤثرة داخل صفحة المحور العامة (/axes/{axis.slug})
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddStat()}
                  className="gap-1 text-xs font-bold h-8 text-emerald-600 border-emerald-500/30"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>إضافة رقم تأثير مخصص</span>
                </Button>
              </div>

              {/* اقتراحات سريعة لإضافة إحصائيات */}
              <div className="flex flex-wrap items-center gap-1.5 p-2.5 rounded-xl bg-muted/20 border border-border/50">
                <span className="text-[11px] font-bold text-muted-foreground">إضافة سريعة:</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAddStat("beneficiary_families", "9,520")}
                  className="h-6 text-[11px] font-bold px-2 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
                >
                  + أسر مستفيدة
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAddStat("treated_cases", "+2,400")}
                  className="h-6 text-[11px] font-bold px-2 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
                >
                  + حالات طبية
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAddStat("students_sponsored", "354")}
                  className="h-6 text-[11px] font-bold px-2 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
                >
                  + طلاب مكفولين
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAddStat("open_kitchen_days", "365")}
                  className="h-6 text-[11px] font-bold px-2 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
                >
                  + أيام المطبخ
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAddStat("fresh_meat_tons", "+5 طن")}
                  className="h-6 text-[11px] font-bold px-2 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
                >
                  + لحوم بلدي
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {statEntries.map(([statKey, statVal]) => (
                  <div key={statKey} className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-2.5 relative group">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveStat(statKey)}
                      className="absolute top-2 start-2 h-6 w-6 p-0 text-muted-foreground hover:text-destructive text-xs"
                      title="حذف هذا الرقم"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-muted-foreground block text-right">
                        المفتاح البرمجي
                      </label>
                      <Input
                        value={statKey}
                        onChange={(e) => handleUpdateStat(statKey, e.target.value, String(statVal))}
                        dir="ltr"
                        className="text-xs h-8 font-mono text-left"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-black text-emerald-700 dark:text-emerald-400 block text-right">
                        القيمة والرقم
                      </label>
                      <Input
                        value={String(statVal)}
                        onChange={(e) => handleUpdateStat(statKey, statKey, e.target.value)}
                        placeholder="مثال: 9,520 أو +5 طن"
                        dir="rtl"
                        className="text-sm font-black h-9 text-primary text-right"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* شريط الانتقال بين التبويبات */}
              <div className="flex items-center justify-between pt-4 border-t border-border/60">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={goToPrevTab}
                  className="gap-2 text-xs font-bold text-muted-foreground hover:text-foreground h-9 rounded-xl"
                >
                  {isRTL ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
                  <span>{isRTL ? "السابق: البيانات الأساسية" : "Prev: Basic Info"}</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={goToNextTab}
                  className="gap-2 text-xs font-black text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border-emerald-500/30 h-9 rounded-xl"
                >
                  <span>{isRTL ? "التالي: الخدمات والنقاط ⬅" : "Next: Services & Points"}</span>
                </Button>
              </div>
            </TabsContent>

            {/* 3. التبويب الثالث: نقاط الخدمات مع أزرار الترتيب (Up / Down) */}
            <TabsContent value="features" className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* نقاط بالعربية مع أزرار ترتيب */}
                <div className="space-y-3 rounded-xl bg-muted/20 p-4 border border-border/60">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-emerald-700 dark:text-emerald-400">
                      نقاط وخدمات المحور (بالعربية)
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAddBullet("ar")}
                      className="h-7 text-xs font-bold text-emerald-600 gap-1 px-2.5 hover:bg-emerald-500/10"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>إضافة نقطة</span>
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {(axis.features_ar || []).map((bullet, bulletIdx) => (
                      <div key={bulletIdx} className="flex items-center gap-1.5 bg-background/80 p-1.5 rounded-lg border border-border/50">
                        {/* أزرار الترتيب للنقطة */}
                        <div className="flex flex-col gap-0.5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={bulletIdx === 0}
                            onClick={() => handleMoveBullet(bulletIdx, "up", "ar")}
                            className="h-5 w-5 p-0 text-muted-foreground hover:text-emerald-600 disabled:opacity-20"
                            title="تحريك لأعلى"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={bulletIdx === (axis.features_ar || []).length - 1}
                            onClick={() => handleMoveBullet(bulletIdx, "down", "ar")}
                            className="h-5 w-5 p-0 text-muted-foreground hover:text-emerald-600 disabled:opacity-20"
                            title="تحريك لأسفل"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        </div>

                        <span className="text-xs font-mono font-bold text-muted-foreground w-4 text-center">
                          {bulletIdx + 1}
                        </span>

                        <Input
                          value={bullet}
                          onChange={(e) => handleUpdateBullet(bulletIdx, e.target.value, "ar")}
                          placeholder="مثال: كرتونة الـ25 كيلو الشهرية"
                          dir="rtl"
                          className="text-xs h-8 flex-1 text-right"
                        />

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveBullet(bulletIdx, "ar")}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive text-xs shrink-0"
                          title="حذف النقطة"
                        >
                          ✕
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* نقاط بالإنجليزية مع أزرار ترتيب */}
                <div className="space-y-3 rounded-xl bg-muted/20 p-4 border border-border/60">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-muted-foreground">
                      Pillar Features & Bullets (English)
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAddBullet("en")}
                      className="h-7 text-xs font-bold text-muted-foreground gap-1 px-2.5 hover:bg-muted"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add</span>
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {(axis.features_en || []).map((bullet, bulletIdx) => (
                      <div key={bulletIdx} className="flex items-center gap-1.5 bg-background/80 p-1.5 rounded-lg border border-border/50">
                        {/* أزرار الترتيب للنقطة */}
                        <div className="flex flex-col gap-0.5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={bulletIdx === 0}
                            onClick={() => handleMoveBullet(bulletIdx, "up", "en")}
                            className="h-5 w-5 p-0 text-muted-foreground hover:text-emerald-600 disabled:opacity-20"
                            title="Move up"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={bulletIdx === (axis.features_en || []).length - 1}
                            onClick={() => handleMoveBullet(bulletIdx, "down", "en")}
                            className="h-5 w-5 p-0 text-muted-foreground hover:text-emerald-600 disabled:opacity-20"
                            title="Move down"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        </div>

                        <span className="text-xs font-mono font-bold text-muted-foreground w-4 text-center">
                          {bulletIdx + 1}
                        </span>

                        <Input
                          value={bullet}
                          onChange={(e) => handleUpdateBullet(bulletIdx, e.target.value, "en")}
                          placeholder="e.g. Monthly 25 kg food box"
                          dir="ltr"
                          className="text-xs h-8 flex-1 text-left font-sans"
                        />

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveBullet(bulletIdx, "en")}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive text-xs shrink-0"
                          title="Delete bullet"
                        >
                          ✕
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* شريط الانتقال بين التبويبات */}
              <div className="flex items-center justify-between pt-4 border-t border-border/60">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={goToPrevTab}
                  className="gap-2 text-xs font-bold text-muted-foreground hover:text-foreground h-9 rounded-xl"
                >
                  {isRTL ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
                  <span>{isRTL ? "السابق: أرقام التأثير" : "Prev: Impact Stats"}</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={goToNextTab}
                  className="gap-2 text-xs font-black text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border-emerald-500/30 h-9 rounded-xl"
                >
                  <span>{isRTL ? "التالي: الصورة والوسائط ⬅" : "Next: Media & Image"}</span>
                </Button>
              </div>
            </TabsContent>

            {/* 4. التبويب الرابع: الصورة والوسائط */}
            <TabsContent value="media" className="space-y-4 pt-4">
              {/* الصورة بعرض كامل */}
              <div className="relative w-full overflow-hidden rounded-2xl border border-border bg-muted shadow-sm" style={{aspectRatio: "16/7"}}>
                <img
                  src={
                    axis.image && typeof axis.image === "string" && axis.image.trim() !== ""
                      ? formatServerImageUrl(axis.image)
                      : DEFAULT_AXES_IMAGES[axis.slug] || imgFood
                  }
                  alt={axis.name_ar}
                  className="h-full w-full object-cover"
                />

                <label className="absolute bottom-3 start-3 cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black/80 hover:bg-black text-white text-xs font-bold backdrop-blur-xs transition shadow-md">
                  <Upload className={`h-3.5 w-3.5 ${uploading ? "animate-spin" : ""}`} />
                  <span>{uploading ? "جاري الرفع..." : "رفع صورة من جهازك"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUploadImage(f);
                    }}
                  />
                </label>
              </div>

              {/* رابط الصورة في صف مستقل تحت الصورة */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block text-right">
                  رابط الصورة المباشر (URL)
                </label>
                <Input
                  value={typeof axis.image === "string" && !axis.image.startsWith("data:") ? axis.image : ""}
                  onChange={(e) => handleFieldChange("image", e.target.value)}
                  placeholder="https://... أو مسار الصورة المباشر"
                  dir="ltr"
                  className="text-xs font-mono h-9 text-left"
                />
                <p className="text-xs text-muted-foreground text-right leading-relaxed">
                  💡 يمكنك رفع صورة مباشرة ليتم تخزينها في السيرفر والحصول على رابط فوري، أو لصق رابط مباشر للصورة من وسائط أخرى.
                </p>
              </div>

              {/* شريط الانتقال للتبويب السابق وحفظ التغييرات */}
              <div className="flex items-center justify-between pt-4 border-t border-border/60">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={goToPrevTab}
                  className="gap-2 text-xs font-bold text-muted-foreground hover:text-foreground h-9 rounded-xl"
                >
                  {isRTL ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
                  <span>{isRTL ? "السابق: الخدمات والنقاط" : "Prev: Services & Points"}</span>
                </Button>
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs h-9 px-6 shadow-xs rounded-xl"
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  <span>{isRTL ? "حفظ التغييرات" : "Save Changes"}</span>
                </Button>
              </div>
            </TabsContent>

            {/* 5. الأسئلة الشائعة: تصنيف أسئلة مربوط بالمحور (faq_category_id) */}
            <TabsContent value="faq" className="space-y-4 pt-4" dir="rtl">
              <EntityFaqManager
                kind="axis"
                saved={!!axis.id}
                linkedCategoryId={axis.faq_category_id}
                slug={axis.slug}
                nameAr={axis.name_ar}
                onLink={async (faq_category_id) => {
                  await axesApi.update(axis.id, { ...axis, faq_category_id });
                  setAxis((a) => (a ? { ...a, faq_category_id } : a));
                }}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* شريط حفظ سفلي إضافي */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md px-6 py-2.5 h-auto"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>حفظ جميع التغييرات</span>
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAxisDetail;
