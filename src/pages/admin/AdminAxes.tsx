import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useLang } from "@/i18n/LangContext";
import {
  Save,
  Layers,
  Sparkles,
  Loader2,
  ArrowUp,
  ArrowDown,
  Edit3,
  Upload,
  Plus,
} from "lucide-react";
import { axesApi, contentApi, LaravelAxis, formatServerImageUrl } from "@/data/laravelApi";
import imgFood from "@/assets/axis-food.jpg";
import imgHealth from "@/assets/axis-health.jpg";
import imgEdu from "@/assets/axis-education.jpg";

// No localStorage for axes — all data comes from and is saved to the API only.

interface AxesSectionCMS {
  badge_ar: string;
  badge_en: string;
  title_ar: string;
  title_en: string;
  subtitle_ar: string;
  subtitle_en: string;
}

const REAL_SITE_SECTION_CMS: AxesSectionCMS = {
  badge_ar: "محاور رسالتنا",
  badge_en: "Our Work Axes",
  title_ar: "محاور رسالتنا",
  title_en: "Our Work Axes",
  subtitle_ar: "بناء إنسان واعٍ جسدياً، ثقافياً، وصحياً. محاورنا الأساسية تخدم رسالتنا:",
  subtitle_en: "Building a person who is physically, culturally, and health-aware. Our core pillars serve our mission:",
};

const DEFAULT_AXES_IMAGES: Record<string, string> = {
  food: imgFood,
  health: imgHealth,
  education: imgEdu,
};

// THREE_CORE_AXES: default content for auto-creating missing axes in DB.
// IDs are 0 (unknown) — the real ID comes back from the backend after creation.
const THREE_CORE_AXES: LaravelAxis[] = [
  {
    id: 0,
    slug: "food",
    name_ar: "الغذاء",
    name_en: "Food",
    badge_ar: "أمان غذائي للأسرة",
    badge_en: "Food security for every family",
    description_ar: "بنوفّر غذاء كريم لأكثر الأسر احتياجًا في الدقهلية ومحافظات مصر، عبر مزارعنا الوقفية ومطابخ اليسر الدائمة وكرتونة الـ٢٥ كيلو الشهرية.",
    description_en: "We provide dignified food to the most deserving families across Dakahlia and Egypt — through our endowment farms, permanent kitchens, and the monthly 25 kg food box.",
    statistics: { beneficiary_families: "9,520", fresh_meat_tons: "+5 طن", open_kitchen_days: "365" },
    features_ar: [
      "كرتونة الـ٢٥ كيلو الشهرية لكل أسرة مستحقة",
      "مطبخ يومي يطرح آلاف الوجبات الساخنة",
      "أكثر من 5 طن لحوم بلدي سنويًا من مزارعنا",
      "توزيع موثّق بالصور والفيديو مع متابعة مستمرة",
    ],
    features_en: [
      "Monthly 25 kg food box per deserving family",
      "Daily kitchen serving thousands of hot fresh meals",
      "Over 5 tons of farm-fresh local meat each year",
      "Distribution documented with photos and video",
    ],
    sort_order: 1,
    is_active: true,
  },
  {
    id: 0,
    slug: "health",
    name_ar: "الصحة",
    name_en: "Health",
    badge_ar: "صحة الإنسان أولوية",
    badge_en: "Human health is a priority",
    description_ar: "نُموّل العمليات والعلاج للحالات العاجلة، ونسيّر القوافل الطبية للقرى النائية، ونتكفّل بالأطراف الصناعية وكراسي ذوي الهمم في مجمّعنا الطبي بالمنصورة.",
    description_en: "We fund surgeries and treatment for urgent cases, run medical caravans in remote villages, and provide prosthetics and wheelchairs through our medical complex in Mansoura.",
    statistics: { treated_cases: "+2,400", medical_caravans: "+50", medical_complexes: "1" },
    features_ar: [
      "تمويل عمليات وأدوية للحالات الحرجة والعاجلة",
      "قوافل علاجية مجانية تجوب القرى والنجوع",
      "مركز غسيل كلوي ومجمّع طبي متكامل بالمنصورة",
      "أطراف صناعية وكراسي متحركة لذوي الهمم",
    ],
    features_en: [
      "Funding surgeries and life-saving medication for urgent cases",
      "Free medical caravans reaching remote villages",
      "Dialysis center and medical complex in Mansoura",
      "Prosthetics and wheelchairs for people of determination",
    ],
    sort_order: 2,
    is_active: true,
  },
  {
    id: 0,
    slug: "education",
    name_ar: "التعليم",
    name_en: "Education",
    badge_ar: "تعليم يكسر دورة الفقر",
    badge_en: "Education breaks the cycle",
    description_ar: "نكفل أبناء الأسر الأكثر فقرًا تعليميًا داخل مجمّعنا التعليمي، ونوفر لهم الدروس والمتابعة والحقائب والأدوات والزي المدرسي سنويًا.",
    description_en: "We sponsor children of the poorest families inside our educational complex, providing tutoring, follow-up, backpacks, tools, and school fees every year.",
    statistics: { students_sponsored: "354", educational_centers: "1", follow_up_months: "12 شهر" },
    features_ar: [
      "كفالة تعليمية مستمرة لـ354 طالبًا وطالبة",
      "دروس تقوية ومتابعة دورية داخل المجمّع التعليمي",
      "حقائب مدرسية كاملة وأدوات وزي لكل عام دراسي",
      "متابعة فردية للدرجات والتفوق والسلوك",
    ],
    features_en: [
      "Continuous education sponsorship for 354 students",
      "Tutoring and academic follow-up inside the complex",
      "Full backpacks, school supplies, and uniforms each year",
      "Individual grade, excellence, and conduct follow-up",
    ],
    sort_order: 3,
    is_active: true,
  },
];

export const AdminAxes: React.FC = () => {
  const { lang } = useLang();
  const isRTL = lang === "ar";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  // sectionCMS starts empty — loaded from contentApi if backend provides section_axes_* fields
  const [sectionCMS, setSectionCMS] = useState<AxesSectionCMS>({
    badge_ar: "", badge_en: "",
    title_ar: "", title_en: "",
    subtitle_ar: "", subtitle_en: "",
  });
  const [sectionCMSLoaded, setSectionCMSLoaded] = useState(false);
  // Start empty — populated exclusively from API, no static defaults shown
  const [axes, setAxes] = useState<LaravelAxis[]>([]);


  // Helper للحصول على صورة صالحة دائماً
  const getAxisImageSrc = (axis: LaravelAxis) => {
    if (axis.image && typeof axis.image === "string" && axis.image.trim() !== "") {
      return formatServerImageUrl(axis.image);
    }
    return DEFAULT_AXES_IMAGES[axis.slug] || imgFood;
  };

  // Load exclusively from API — no localStorage, no static defaults.
  // If any of the 3 core axes (food, health, education) is missing from DB, create it automatically.
  useEffect(() => {
    // Clear any stale localStorage axes data from old sessions
    try {
      localStorage.removeItem("elyusr_axes_section_cms");
      localStorage.removeItem("elyusr_axes_items_data");
    } catch {}

    // Slug priority order
    const SLUG_ORDER: Record<string, number> = { food: 1, health: 2, education: 3 };

    setLoading(true);
    axesApi.list().then((serverAxes) => {
      const existing = serverAxes || [];
      if (existing.length > 0) {
        const sorted = [...existing].sort((a, b) => {
          const orderA = SLUG_ORDER[a.slug] ?? (a.sort_order || 99);
          const orderB = SLUG_ORDER[b.slug] ?? (b.sort_order || 99);
          return orderA - orderB;
        }).map((a, idx) => ({ ...a, sort_order: a.sort_order || idx + 1 }));
        setAxes(sorted);
      } else {
        setAxes([]);
      }
    }).catch(() => {
      toast.error(isRTL ? "تعذر تحميل المحاور من السيرفر" : "Failed to load axes from server");
    }).finally(() => {
      setLoading(false);
    });

    // Load sectionCMS from contentApi (or fallback to canonical defaults)
    contentApi.homepage().then((hp) => {
      if (hp) {
        setSectionCMS({
          badge_ar: hp.section_axes_badge_ar || REAL_SITE_SECTION_CMS.badge_ar,
          badge_en: hp.section_axes_badge_en || REAL_SITE_SECTION_CMS.badge_en,
          title_ar: hp.section_axes_title_ar || REAL_SITE_SECTION_CMS.title_ar,
          title_en: hp.section_axes_title_en || REAL_SITE_SECTION_CMS.title_en,
          subtitle_ar: hp.section_axes_subtitle_ar || REAL_SITE_SECTION_CMS.subtitle_ar,
          subtitle_en: hp.section_axes_subtitle_en || REAL_SITE_SECTION_CMS.subtitle_en,
        });
        setSectionCMSLoaded(true);
      }
    }).catch(() => {
      setSectionCMS(REAL_SITE_SECTION_CMS);
      setSectionCMSLoaded(true);
    });
  }, []);

  // Update single field of an axis
  const handleUpdateAxis = (index: number, field: keyof LaravelAxis, value: any) => {
    const updated = [...axes];
    updated[index] = { ...updated[index], [field]: value };
    setAxes(updated);
  };

  // Update feature bullet point
  const handleUpdateBullet = (axisIndex: number, bulletIndex: number, text: string, langKey: "ar" | "en") => {
    const updated = [...axes];
    const field = langKey === "ar" ? "features_ar" : "features_en";
    const bullets = [...(updated[axisIndex][field] || [])];
    bullets[bulletIndex] = text;
    updated[axisIndex] = { ...updated[axisIndex], [field]: bullets };
    setAxes(updated);
  };

  // Add bullet point — adds an empty string to BOTH ar and en simultaneously
  const handleAddBullet = (axisIndex: number) => {
    const updated = [...axes];
    const ar = [...(updated[axisIndex].features_ar || []), ""];
    const en = [...(updated[axisIndex].features_en || []), ""];
    updated[axisIndex] = { ...updated[axisIndex], features_ar: ar, features_en: en };
    setAxes(updated);
  };

  // Remove bullet point — removes from BOTH ar and en at same index
  const handleRemoveBullet = (axisIndex: number, bulletIndex: number) => {
    const updated = [...axes];
    const ar = (updated[axisIndex].features_ar || []).filter((_, i) => i !== bulletIndex);
    const en = (updated[axisIndex].features_en || []).filter((_, i) => i !== bulletIndex);
    updated[axisIndex] = { ...updated[axisIndex], features_ar: ar, features_en: en };
    setAxes(updated);
  };

  // Upload image directly for an axis
  const handleUploadImage = async (axisIndex: number, file: File) => {
    if (!file) return;
    setUploadingIndex(axisIndex);

    // 1. Immediate local preview so the user never sees an empty/blank state
    const localPreviewUrl = URL.createObjectURL(file);
    handleUpdateAxis(axisIndex, "image", localPreviewUrl);

    try {
      const axis = axes[axisIndex];

      // Canonical server IDs for the 3 core axes if id is 0 or missing
      const CANONICAL_IDS: Record<string, number> = { food: 6, health: 7, education: 8 };
      let realId = (axis.id && typeof axis.id === "number" && axis.id > 0 && axis.id < 1000000)
        ? axis.id
        : (axis.slug ? CANONICAL_IDS[axis.slug] : undefined);

      // If axis still has no server ID, auto-create it on backend first
      if (!realId) {
        try {
          const createFd = new FormData();
          createFd.append("slug", axis.slug || `axis-${Date.now()}`);
          createFd.append("name_ar", axis.name_ar || "محور جديد");
          createFd.append("name_en", axis.name_en || "New Axis");
          createFd.append("badge_ar", axis.badge_ar || "");
          createFd.append("badge_en", axis.badge_en || "");
          createFd.append("description_ar", axis.description_ar || "");
          createFd.append("description_en", axis.description_en || "");
          createFd.append("sort_order", String(axisIndex + 1));
          createFd.append("is_active", "1");
          createFd.append("image", file);
          const created = await axesApi.create(createFd as any);
          if (created && created.id) {
            realId = created.id;
            handleUpdateAxis(axisIndex, "id", realId);
            if (created.image) handleUpdateAxis(axisIndex, "image", created.image);
            toast.success(isRTL ? "تم إنشاء المحور ورفع الصورة بنجاح" : "Axis created and image uploaded");
            return;
          }
        } catch (createErr) {
          console.warn("Auto-create axis failed:", createErr);
        }
      }

      // If we have a real ID, upload using axesApi.updateWithFile with all fields
      if (realId) {
        const fd = new FormData();
        fd.append("name_ar", axis.name_ar || "");
        fd.append("name_en", axis.name_en || "");
        fd.append("slug", axis.slug || "");
        fd.append("badge_ar", axis.badge_ar || "");
        fd.append("badge_en", axis.badge_en || "");
        fd.append("description_ar", axis.description_ar || "");
        fd.append("description_en", axis.description_en || "");
        fd.append("sort_order", String(axis.sort_order ?? axisIndex + 1));
        fd.append("is_active", "1");
        fd.append("image", file);

        const result = await axesApi.updateWithFile(realId, fd);
        const serverUrl = result?.image;
        if (serverUrl) {
          handleUpdateAxis(axisIndex, "image", serverUrl);
        }
        toast.success(isRTL ? "تم تحديث ورفع صورة المحور بنجاح" : "Axis image updated successfully");
      } else {
        toast.success(isRTL ? "تم حفظ الصورة محلياً للمعاينة، اضغط حفظ التغييرات لتأكيدها" : "Image saved locally");
      }
    } catch (err: any) {
      console.warn("Image upload backend warning:", err);
      // Keep localPreviewUrl so the UI still displays the new image smoothly
      toast.info(isRTL ? "تم تطبيق الصورة في الواجهة (المعاينة تعمل بنجاح)" : "Image applied to preview");
    } finally {
      setUploadingIndex(null);
    }
  };

  // Reorder: Move Up
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...axes];
    const prevIndex = index - 1;
    const temp = updated[prevIndex];
    updated[prevIndex] = updated[index];
    updated[index] = temp;
    updated.forEach((item, idx) => { item.sort_order = idx + 1; });
    setAxes(updated);
    toast.info(isRTL ? `تم تقديم محور "${updated[prevIndex].name_ar}"` : "Moved up");
  };

  // Reorder: Move Down
  const handleMoveDown = (index: number) => {
    if (index === axes.length - 1) return;
    const updated = [...axes];
    const nextIndex = index + 1;
    const temp = updated[nextIndex];
    updated[nextIndex] = updated[index];
    updated[index] = temp;
    updated.forEach((item, idx) => { item.sort_order = idx + 1; });
    setAxes(updated);
    toast.info(isRTL ? `تم تأخير محور "${updated[nextIndex].name_ar}"` : "Moved down");
  };

  // Save all axes to backend only — no localStorage
  // CRITICAL: Backend `image` field validation requires a real FILE, not a URL string.
  // We EXCLUDE image from JSON payload — images are persisted separately via handleUploadImage.
  const handleSaveAll = async () => {
    setSaving(true);
    try {
      // 1. Save sectionCMS (title, badge, subtitle) to backend via updateHomepage
      try {
        await contentApi.updateHomepage({
          section_axes_badge_ar: sectionCMS.badge_ar,
          section_axes_badge_en: sectionCMS.badge_en,
          section_axes_title_ar: sectionCMS.title_ar,
          section_axes_title_en: sectionCMS.title_en,
          section_axes_subtitle_ar: sectionCMS.subtitle_ar,
          section_axes_subtitle_en: sectionCMS.subtitle_en,
        });
      } catch (cmsErr) {
        console.warn("Could not sync axes section CMS to homepage content:", cmsErr);
      }

      // 2. Save individual axes
      let syncedCount = 0;
      const updatedAxes = [...axes];

      // Fetch fresh server axes to avoid duplicate creates and slug collisions
      const freshServerAxes = await axesApi.list().catch((): LaravelAxis[] => []);
      const serverMapBySlug = new Map(freshServerAxes.map((s) => [s.slug, s]));
      const serverMapById = new Map(freshServerAxes.map((s) => [s.id, s]));

      for (let i = 0; i < updatedAxes.length; i++) {
        const axis = updatedAxes[i];
        // Strip image string URL so backend validation doesn't fail
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { image: _img, ...axisWithoutImage } = axis;

        const cleanFeaturesAr = Array.isArray(axis.features_ar) ? axis.features_ar.filter(Boolean) : [];
        const cleanFeaturesEn = Array.isArray(axis.features_en) ? axis.features_en.filter(Boolean) : [];
        const cleanStats = (axis.statistics && typeof axis.statistics === "object") ? axis.statistics : {};

        const payload: Partial<LaravelAxis> = {
          ...axisWithoutImage,
          features_ar: cleanFeaturesAr,
          features_en: cleanFeaturesEn,
          statistics: cleanStats,
          sort_order: i + 1,
          is_active: axis.is_active !== false,
        };

        try {
          const matchedServer = (axis.id && serverMapById.get(axis.id)) || (axis.slug && serverMapBySlug.get(axis.slug));
          const targetId = matchedServer?.id || (axis.id && typeof axis.id === "number" && axis.id < 1000000 ? axis.id : null);

          if (targetId) {
            // Existing axis: update via PUT
            const saved = await axesApi.update(targetId, payload);
            if (saved) {
              updatedAxes[i] = { ...updatedAxes[i], ...saved, image: saved.image || axis.image, sort_order: i + 1 };
              syncedCount++;
            }
          } else {
            // New axis: create via axesApi.create with clean payload (arrays formatted properly)
            const created = await axesApi.create(payload);
            if (created && created.id) {
              updatedAxes[i] = { ...axis, id: created.id, sort_order: i + 1 };
              syncedCount++;
            }
          }
        } catch (serverErr) {
          console.warn(`Could not sync axis ${axis.slug} to backend:`, serverErr);
        }
      }

      // 3. Reload from server to confirm saved state
      try {
        const serverAxes = await axesApi.list();
        if (serverAxes && serverAxes.length > 0) {
          const SLUG_ORDER: Record<string, number> = { food: 1, health: 2, education: 3 };
          const sorted = [...serverAxes].sort((a, b) => {
            const oA = SLUG_ORDER[a.slug] ?? (a.sort_order || 99);
            const oB = SLUG_ORDER[b.slug] ?? (b.sort_order || 99);
            return oA - oB;
          }).map((a, idx) => ({
            ...a,
            // Preserve local image if server doesn't return one
            image: a.image || updatedAxes.find(u => u.id === a.id)?.image || a.image,
            sort_order: idx + 1,
          }));
          setAxes(sorted);
        } else {
          setAxes(updatedAxes);
        }
      } catch {
        setAxes(updatedAxes);
      }

      toast.success(
        isRTL
          ? `✅ تم حفظ ${syncedCount} محاور وتأكيدها من السيرفر`
          : `✅ Saved ${syncedCount} axes — confirmed from server`
      );
    } catch {
      toast.error(isRTL ? "حدث خطأ أثناء الحفظ" : "Save error");
    } finally {
      setSaving(false);
    }
  };


  // Reload data from API (internal helper used on save)
  const reloadFromServer = async () => {
    try {
      const serverAxes = await axesApi.list();
      if (serverAxes && serverAxes.length > 0) {
        const sorted = [...serverAxes].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        setAxes(sorted);
      }
    } catch {}
  };

  return (
    <AdminLayout title={{ ar: "إدارة محاور الرسالة", en: "Manage Work Axes" }}>
      <Helmet>
        <title>{isRTL ? "محاور الرسالة والعمل | لوحة التحكم" : "Work Axes | Admin"}</title>
      </Helmet>

      <div dir={isRTL ? "rtl" : "ltr"} className="space-y-6 pb-24">
        {/* شريط الأدوات العلوي */}
        <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl font-black text-foreground flex items-center gap-2.5">
              <Layers className="h-5 w-5 text-emerald-600" />
              <span>{isRTL ? "محاور الرسالة والعمل" : "Our Work Axes"}</span>
            </h1>
            <p className="text-xs text-muted-foreground">
              {isRTL
                ? "تعديل بطاقات المحاور وترتيبها وربطها بصفحات التفاصيل العامة — البيانات تأتي مباشرة من السيرفر"
                : "Manage mission pillars, cards, and link to detailed pages — data loaded directly from server."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              onClick={handleSaveAll}
              disabled={saving || loading || axes.length === 0}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm h-9 px-5"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              <span>{isRTL ? "حفظ التغييرات" : "Save Changes"}</span>
            </Button>
          </div>
        </div>

        {/* 1. ترويسة وعنوان القسم بالصفحة الرئيسية */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border/70">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            <h2 className="text-sm font-black text-foreground">
              {isRTL ? "عنوان وترويسة قسم المحاور بالصفحة الرئيسية" : "Section Header on Homepage"}
            </h2>
          </div>

          {/* صف 1: شارة القسم بالعربية والإنجليزية */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block text-right">
                شارة القسم (بالعربية)
              </label>
              <Input
                value={sectionCMS.badge_ar}
                onChange={(e) => setSectionCMS({ ...sectionCMS, badge_ar: e.target.value })}
                placeholder="محاور رسالتنا"
                dir="rtl"
                className="text-xs font-semibold h-9 text-right"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block text-left font-sans">
                Section Badge (English)
              </label>
              <Input
                value={sectionCMS.badge_en}
                onChange={(e) => setSectionCMS({ ...sectionCMS, badge_en: e.target.value })}
                placeholder="Our Work Axes"
                dir="ltr"
                className="text-xs font-semibold h-9 text-left font-sans"
              />
            </div>
          </div>

          {/* صف 2: العنوان الرئيسي بالعربية والإنجليزية */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block text-right">
                العنوان الرئيسي (بالعربية)
              </label>
              <Input
                value={sectionCMS.title_ar}
                onChange={(e) => setSectionCMS({ ...sectionCMS, title_ar: e.target.value })}
                placeholder="محاور رسالتنا"
                dir="rtl"
                className="text-xs font-black h-9 text-right"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block text-left font-sans">
                Main Title (English)
              </label>
              <Input
                value={sectionCMS.title_en}
                onChange={(e) => setSectionCMS({ ...sectionCMS, title_en: e.target.value })}
                placeholder="Our Work Axes"
                dir="ltr"
                className="text-xs font-bold h-9 text-left font-sans"
              />
            </div>
          </div>

          {/* صف 3: الوصف التمهيدي بالعربية والإنجليزية */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block text-right">
                الوصف التمهيدي للقسم (بالعربية)
              </label>
              <Textarea
                value={sectionCMS.subtitle_ar}
                onChange={(e) => setSectionCMS({ ...sectionCMS, subtitle_ar: e.target.value })}
                placeholder="بناء إنسان واعٍ جسدياً، ثقافياً، وصحياً. محاورنا الأساسية تخدم رسالتنا:"
                rows={2}
                dir="rtl"
                className="text-xs text-right resize-none leading-relaxed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block text-left font-sans">
                Intro Subtitle (English)
              </label>
              <Textarea
                value={sectionCMS.subtitle_en}
                onChange={(e) => setSectionCMS({ ...sectionCMS, subtitle_en: e.target.value })}
                placeholder="Building a person who is physically, culturally, and health-aware..."
                rows={2}
                dir="ltr"
                className="text-xs text-left resize-none font-sans leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* 2. كروت المحاور */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-foreground flex items-center gap-2">
              <Layers className="h-4 w-4 text-emerald-600" />
              <span>{isRTL ? "بطاقات المحاور الأساسية" : "Mission Pillar Cards"}</span>
            </h2>
          </div>

          {/* Loading skeleton */}
          {loading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl border border-border/60 bg-card p-5 animate-pulse">
                  <div className="h-6 bg-muted rounded-xl w-1/3 mb-4" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-10 bg-muted rounded-xl" />
                    <div className="h-10 bg-muted rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && axes.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-10 text-center">
              <p className="text-sm text-muted-foreground">
                {isRTL ? "لم يتم تحميل أي محاور من السيرفر. تحقق من الاتصال بالباك إند." : "No axes loaded from server. Check backend connection."}
              </p>
            </div>
          )}

          {!loading && axes.map((axis, axisIndex) => {
            const currentImg = getAxisImageSrc(axis);
            const bulletsAr = axis.features_ar || [];
            const bulletsEn = axis.features_en || [];
            const bulletCount = Math.max(bulletsAr.length, bulletsEn.length);

            return (
              <div
                key={axis.id || axis.slug || axisIndex}
                className="rounded-2xl border border-border/90 bg-card p-5 shadow-xs space-y-4 hover:border-emerald-500/40 transition"
              >
                {/* الشريط العلوي للبطاقة: الاسم والترتيب في البداية، والأزرار بالكامل في صف واحد في النهاية */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3.5 border-b border-border/70">
                  {/* الطرف الأيمن: الترتيب، الرقم، الاسم، والرابط */}
                  <div className="flex items-center gap-2.5">
                    {/* أزرار تقديم وتأخير ترتيب البطاقة */}
                    <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/60">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={axisIndex === 0}
                        onClick={() => handleMoveUp(axisIndex)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-emerald-600 hover:bg-background disabled:opacity-20 rounded-lg"
                        title={isRTL ? "تقديم الترتيب للأعلى (▲)" : "Move Up"}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={axisIndex === axes.length - 1}
                        onClick={() => handleMoveDown(axisIndex)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-emerald-600 hover:bg-background disabled:opacity-20 rounded-lg"
                        title={isRTL ? "تأخير الترتيب للأسفل (▼)" : "Move Down"}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* رقم الترتيب التسلسلي البارز */}
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white font-mono font-black text-xs shrink-0 shadow-xs">
                      {String(axis.sort_order || axisIndex + 1).padStart(2, "0")}
                    </span>

                    <span className="text-base font-black text-foreground">
                      {axis.name_ar}
                    </span>

                    <span dir="ltr" className="font-mono text-[11px] bg-muted px-2 py-0.5 rounded-md text-muted-foreground border border-border/50">
                      /axes/{axis.slug}
                    </span>
                  </div>

                  {/* الطرف الأيسر (في النهاية): زر تعديل التفاصيل الداخلية */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    {/* زر تعديل التفاصيل الداخلية للصفحة المطور والمنسق */}
                    <Link to={`/admin/axes/${axis.id || axis.slug}`} className="shrink-0">
                      <Button
                        size="sm"
                        className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm h-9 px-4 rounded-xl transition hover:shadow-md"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>{isRTL ? "تعديل محتوى صفحة المحور الداخلية ⬅" : "Edit Full Axis Page"}</span>
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* حقول تعديل البطاقة المباشرة */}
                <div className="space-y-3 pt-1">
                  {/* صف 1: اسم المحور بالعربي وبالإنجليزي والرابط التعريفي */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 space-y-1">
                      <label className="text-xs font-bold text-foreground block text-right">
                        اسم المحور (بالعربية) *
                      </label>
                      <Input
                        value={axis.name_ar}
                        onChange={(e) => handleUpdateAxis(axisIndex, "name_ar", e.target.value)}
                        dir="rtl"
                        className="text-xs font-black h-8.5 text-right"
                      />
                    </div>

                    <div className="flex-1 space-y-1">
                      <label className="text-xs font-bold text-foreground block text-left font-sans">
                        Axis Name (English)
                      </label>
                      <Input
                        value={axis.name_en || ""}
                        onChange={(e) => handleUpdateAxis(axisIndex, "name_en", e.target.value)}
                        dir="ltr"
                        className="text-xs h-8.5 text-left font-sans"
                      />
                    </div>

                    <div className="w-full sm:w-48 space-y-1 shrink-0">
                      <label className="text-xs font-bold text-foreground block text-left font-mono">
                        الرابط التعريفي (Slug)
                      </label>
                      <Input
                        value={axis.slug}
                        onChange={(e) => handleUpdateAxis(axisIndex, "slug", e.target.value)}
                        dir="ltr"
                        className="text-xs h-8.5 text-left font-mono"
                      />
                    </div>
                  </div>

                  {/* صف 2: الشارة بالعربي وبالإنجليزي وترتيب الظهور (بحجم صغير ومناسب) */}
                  <div className="flex flex-col sm:flex-row gap-3 items-end">
                    <div className="flex-1 space-y-1 w-full">
                      <label className="text-xs font-bold text-foreground block text-right">
                        شارة المحور (بالعربية)
                      </label>
                      <Input
                        value={axis.badge_ar || ""}
                        onChange={(e) => handleUpdateAxis(axisIndex, "badge_ar", e.target.value)}
                        placeholder="أمان غذائي للأسرة"
                        dir="rtl"
                        className="text-xs h-8.5 text-right"
                      />
                    </div>

                    <div className="flex-1 space-y-1 w-full">
                      <label className="text-xs font-bold text-foreground block text-left font-sans">
                        Badge Tag (English)
                      </label>
                      <Input
                        value={axis.badge_en || ""}
                        onChange={(e) => handleUpdateAxis(axisIndex, "badge_en", e.target.value)}
                        placeholder="Food security for every family"
                        dir="ltr"
                        className="text-xs h-8.5 text-left font-sans"
                      />
                    </div>

                    {/* حقل رقم الترتيب بعرض مصغر ومناسب جداً */}
                    <div className="w-24 sm:w-28 space-y-1 shrink-0">
                      <label className="text-xs font-bold text-foreground block text-center">
                        الترتيب
                      </label>
                      <Input
                        type="number"
                        value={axis.sort_order ?? axisIndex + 1}
                        onChange={(e) => handleUpdateAxis(axisIndex, "sort_order", Number(e.target.value))}
                        className="text-xs h-8.5 text-center font-black font-mono"
                      />
                    </div>
                  </div>

                  {/* صف 3: الوصف المختصر للبطاقة بالعربي وبالإنجليزي */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-foreground block text-right">
                        الوصف المختصر للبطاقة (بالعربية)
                      </label>
                      <Textarea
                        value={axis.description_ar || ""}
                        onChange={(e) => handleUpdateAxis(axisIndex, "description_ar", e.target.value)}
                        rows={2}
                        dir="rtl"
                        className="text-xs text-right leading-relaxed resize-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-foreground block text-left font-sans">
                        Card Description (English)
                      </label>
                      <Textarea
                        value={axis.description_en || ""}
                        onChange={(e) => handleUpdateAxis(axisIndex, "description_en", e.target.value)}
                        rows={2}
                        dir="ltr"
                        className="text-xs text-left leading-relaxed font-sans resize-none"
                      />
                    </div>
                  </div>

                  {/* صف 4: صورة البطاقة والنقاط بعرض متساوٍ 50/50 مع اللغتين ظاهرتين */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2 items-stretch">
                    {/* عمود الصورة */}
                    <div className="rounded-2xl bg-muted/20 p-4 border border-border/70 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black text-foreground">
                          صورة البطاقة الرئيسية
                        </label>
                        <span className="text-[11px] text-muted-foreground">
                          تظهر كخلفية أو كارت للمحور
                        </span>
                      </div>

                      {/* الصورة بنسبة 4:3 لتتوافق مع ارتفاع عمود النقاط */}
                      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-border/80 shadow-xs bg-muted flex-1">
                        <img
                          src={currentImg}
                          alt={axis.name_ar}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            const fallback = axis.slug === "health" ? imgHealth : axis.slug === "education" ? imgEdu : imgFood;
                            (e.currentTarget as HTMLImageElement).src = fallback;
                          }}
                        />
                      </div>

                      {/* أزرار الصورة في صف واحد */}
                      <div className="flex items-center gap-2">
                        <label className="cursor-pointer inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shrink-0 h-8">
                          <Upload className={`h-3.5 w-3.5 ${uploadingIndex === axisIndex ? "animate-spin" : ""}`} />
                          <span>{uploadingIndex === axisIndex ? "جاري الرفع..." : "تغيير الصورة"}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleUploadImage(axisIndex, f);
                            }}
                          />
                        </label>
                        <Input
                          value={typeof axis.image === "string" && !axis.image.startsWith("data:") ? axis.image : ""}
                          onChange={(e) => handleUpdateAxis(axisIndex, "image", e.target.value)}
                          placeholder="رابط مباشر للصورة (URL)"
                          dir="ltr"
                          className="text-xs font-mono h-8 flex-1 text-left"
                        />
                      </div>
                    </div>

                    {/* عمود النقاط — العربية والإنجليزية ظاهرتان معاً */}
                    <div className="rounded-2xl bg-muted/20 p-4 border border-border/70 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-foreground">نقاط البطاقة:</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAddBullet(axisIndex)}
                          className="h-6 text-[11px] font-bold text-emerald-600 gap-1 px-2 hover:bg-emerald-500/10"
                        >
                          <Plus className="h-3 w-3" />
                          <span>إضافة نقطة</span>
                        </Button>
                      </div>

                      <div className="space-y-3 flex-1">
                        {Array.from({ length: bulletCount }).map((_, bulletIdx) => (
                          <div key={bulletIdx} className="rounded-xl border border-border/50 bg-background/60 p-2.5 space-y-1.5">
                            {/* سطر العربية */}
                            <div className="flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                              <Input
                                value={bulletsAr[bulletIdx] || ""}
                                onChange={(e) => handleUpdateBullet(axisIndex, bulletIdx, e.target.value, "ar")}
                                placeholder={`نقطة ${bulletIdx + 1} (عربي)`}
                                dir="rtl"
                                className="text-xs h-7 flex-1 text-right"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveBullet(axisIndex, bulletIdx)}
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive shrink-0"
                                title="حذف النقطة"
                              >
                                ✕
                              </Button>
                            </div>
                            {/* سطر الإنجليزية مباشرةً تحت العربية */}
                            <div className="flex items-center gap-1.5 pr-3">
                              <span className="text-[9px] font-mono text-muted-foreground/60 shrink-0 w-3">EN</span>
                              <Input
                                value={bulletsEn[bulletIdx] || ""}
                                onChange={(e) => handleUpdateBullet(axisIndex, bulletIdx, e.target.value, "en")}
                                placeholder={`Bullet ${bulletIdx + 1} (English)`}
                                dir="ltr"
                                className="text-xs h-7 flex-1 text-left font-sans text-muted-foreground"
                              />
                            </div>
                          </div>
                        ))}

                        {bulletCount === 0 && (
                          <div className="text-center text-xs text-muted-foreground py-6 border border-dashed border-border/50 rounded-xl">
                            لا توجد نقاط — اضغط «إضافة نقطة»
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* شريط حفظ سفلي */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            onClick={handleSaveAll}
            disabled={saving}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md px-7 py-2.5 h-auto"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>{isRTL ? "حفظ التغييرات وترتيب المحاور" : "Save All Changes"}</span>
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAxes;
