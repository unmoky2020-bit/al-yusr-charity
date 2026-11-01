import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLang } from "@/i18n/LangContext";
import { toast } from "@/hooks/use-toast";
import { LucideIconPicker } from "@/components/admin/LucideIconPicker";
import { getLucideIcon } from "@/lib/lucide-icon";
import {
  Sparkles,
  Save,
  RotateCcw,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Heart,
  Info,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  SlidersHorizontal,
  FileText,
  Compass,
  Calculator,
  HandHeart,
  ImageIcon,
  Undo2,
  Upload,
  Loader2,
} from "lucide-react";
import {
  contentApi,
  galleryApi,
  formatServerImageUrl,
  LaravelHomepageContent,
  invalidateApiCache,
  clearPublic401Blacklist,
  HOMEPAGE_DEFAULT_CONTENT,
} from "@/data/laravelApi";
import { useQueryClient } from "@tanstack/react-query";
import brandBags from "@/assets/brand-bags.jpg";
import brandPoster from "@/assets/brand-poster-frame.jpg";

export const AdminHomepageContent = () => {
  const { lang } = useLang();
  const isRTL = lang === "ar";
  const queryClient = useQueryClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"hero" | "section2">("hero");
  const [previewLang, setPreviewLang] = useState<"ar" | "en">("ar");
  const [showLivePreview, setShowLivePreview] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"saved" | "unsaved" | "error">("saved");

  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingTop, setUploadingTop] = useState(false);

  // Local object URL for immediate display while saving
  const [previewUrls, setPreviewUrls] = useState<{
    section2_main_image?: string;
    section2_left_top_image?: string;
  }>({});

  const handleUploadImage = async (
    file: File,
    field: "section2_main_image" | "section2_left_top_image",
    setLoadingState: (b: boolean) => void
  ) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: isRTL ? "نوع ملف غير مدعوم" : "Unsupported file type", description: isRTL ? "يرجى اختيار ملف صورة صالح (JPG, PNG, WebP)" : "Please select a valid image file", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: isRTL ? "الملف كبير جداً" : "File too large", description: isRTL ? "الحجم الأقصى 10 ميجابايت" : "Max size is 10MB", variant: "destructive" });
      return;
    }
    setLoadingState(true);

    const localUrl = URL.createObjectURL(file);
    setPreviewUrls((p) => ({ ...p, [field]: localUrl }));

    try {
      // 1. Upload directly to /homepage/content (the official backend endpoint for section2 images)
      const res = await contentApi.uploadSection2Image(file, field, form);
      const serverUrl = res.url || "";

      if (serverUrl) {
        handleChange(field, serverUrl);
        setPreviewUrls((p) => ({ ...p, [field]: undefined }));
      }

      // Also try backup upload to gallery for media library cataloging
      try {
        const title = field === "section2_main_image" ? "بوستر_اليسر_الرئيسي" : "صورة_كراتين_وقوافل_الخير";
        await galleryApi.uploadImage(file, title);
      } catch {}

      // Invalidate homepage query cache so other components update immediately
      invalidateApiCache("/homepage/content");
      invalidateApiCache("homepage");
      await queryClient.refetchQueries({ queryKey: ["homepage-content"] });

      toast({
        title: isRTL ? "تم حفظ الصورة بالسيرفر بنجاح ✓" : "Image saved to server successfully ✓",
        description: serverUrl || (isRTL ? "تم تحديث الصورة في محتوى الرئيسية" : "Image updated on homepage"),
      });
    } catch (err: any) {
      toast({
        title: isRTL ? "خطأ في رفع الصورة" : "Upload error",
        description: err?.message || (isRTL ? "تعذر حفظ الصورة على السيرفر" : "Failed to upload to server"),
        variant: "destructive",
      });
    } finally {
      setLoadingState(false);
    }
  };

  // Empty initial state — backend data populates form after loadContent() resolves.
  // No static defaults here to avoid flashing placeholder text before API responds.
  const [form, setForm] = useState<LaravelHomepageContent>({});

  // Load content from API
  const loadContent = async () => {
    setLoading(true);
    try {
      const data = await contentApi.homepage();
      if (data) {
        // Clean title if accent is already embedded in section2_title_ar
        let cleanTitleAr = data.section2_title_ar || "";
        const accentAr = data.section2_title_accent_ar || "";
        if (accentAr && cleanTitleAr.includes(accentAr)) {
          cleanTitleAr = cleanTitleAr.replace(accentAr, "").replace(/[—\-–&،,\s]+$/, "").trim();
        }

        setForm({
          ...data,
          section2_main_image: data.section2_main_image || "",
          section2_left_top_image: data.section2_left_top_image || "",
          section2_title_ar: cleanTitleAr || data.section2_title_ar,
          section2_card_cta_title_ar: data.section2_card_title_ar || data.section2_card_cta_title_ar,
          section2_card_title_ar: data.section2_card_title_ar || data.section2_card_cta_title_ar,
          section2_card_cta_title_en: data.section2_card_title_en || data.section2_card_cta_title_en,
          section2_card_title_en: data.section2_card_title_en || data.section2_card_cta_title_en,
          section2_card_cta_sub_ar: data.section2_card_subtitle_ar || data.section2_card_cta_sub_ar,
          section2_card_subtitle_ar: data.section2_card_subtitle_ar || data.section2_card_cta_sub_ar,
          section2_card_cta_sub_en: data.section2_card_subtitle_en || data.section2_card_cta_sub_en,
          section2_card_subtitle_en: data.section2_card_subtitle_en || data.section2_card_cta_sub_en,
          section2_card_cta_link: data.section2_card_url || data.section2_card_cta_link,
          section2_card_url: data.section2_card_url || data.section2_card_cta_link,
        });
      }
      setSaveStatus("saved");
    } catch {
      toast({ title: isRTL ? "تنبيه" : "Notice", description: isRTL ? "تعذر تحميل البيانات من السيرفر" : "Could not load data from server", });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, []);

  const handleChange = (field: keyof LaravelHomepageContent, val: string) => {
    setForm((prev) => {
      const updated: LaravelHomepageContent = { ...prev, [field]: val };
      if (field === "section2_card_cta_title_ar") updated.section2_card_title_ar = val;
      if (field === "section2_card_title_ar") updated.section2_card_cta_title_ar = val;
      if (field === "section2_card_cta_title_en") updated.section2_card_title_en = val;
      if (field === "section2_card_title_en") updated.section2_card_cta_title_en = val;
      if (field === "section2_card_cta_sub_ar") updated.section2_card_subtitle_ar = val;
      if (field === "section2_card_subtitle_ar") updated.section2_card_cta_sub_ar = val;
      if (field === "section2_card_cta_sub_en") updated.section2_card_subtitle_en = val;
      if (field === "section2_card_subtitle_en") updated.section2_card_cta_sub_en = val;
      if (field === "section2_card_cta_link") updated.section2_card_url = val;
      if (field === "section2_card_url") updated.section2_card_cta_link = val;
      return updated;
    });
    setSaveStatus("unsaved");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Strip any blob: or data: preview URLs before saving to backend
      const safeForm = {
        ...form,
        section2_main_image: (form.section2_main_image?.startsWith("blob:") || form.section2_main_image?.startsWith("data:")) ? "" : form.section2_main_image,
        section2_left_top_image: (form.section2_left_top_image?.startsWith("blob:") || form.section2_left_top_image?.startsWith("data:")) ? "" : form.section2_left_top_image,
        section2_left_bottom_image: (form.section2_left_bottom_image?.startsWith("blob:") || form.section2_left_bottom_image?.startsWith("data:")) ? "" : form.section2_left_bottom_image,
      };
      await contentApi.updateHomepage(safeForm);

      // ── Aggressively clear ALL homepage caches so the next fetch is always fresh ──
      // 1. Clear in-memory apiFetch cache
      invalidateApiCache("/homepage/hero");
      invalidateApiCache("/homepage/content");
      invalidateApiCache("homepage");
      // 2. Clear 401 session blacklist so backend endpoints aren't skipped
      clearPublic401Blacklist("/homepage/hero");
      clearPublic401Blacklist("/homepage/content");

      // 3. Force React Query to immediately refetch (not just mark as stale)
      await queryClient.refetchQueries({ queryKey: ["homepage-content"] });

      // After save, reload from server to confirm persisted state
      const confirmed = await contentApi.homepage();
      if (confirmed) {
        setForm((prev) => ({
          ...prev,
          ...confirmed,
          // Keep any image fields from prev if server doesn't return them
          section2_main_image: confirmed.section2_main_image || prev.section2_main_image,
          section2_left_top_image: confirmed.section2_left_top_image || prev.section2_left_top_image,
          section2_left_bottom_image: confirmed.section2_left_bottom_image || prev.section2_left_bottom_image,
        }));
      }
      setSaveStatus("saved");
      toast({ title: isRTL ? "✅ تم الحفظ والتحقق" : "✅ Saved & Verified", description: isRTL ? "تم تحديث نصوص الهيرو والرئيسية على السيرفر وتأكيد الحفظ" : "Hero & homepage content saved and confirmed from server", });
    } catch (e: unknown) {
      setSaveStatus("error");
      const errMsg = e instanceof Error ? e.message : String(e);
      toast({ title: isRTL ? "خطأ في الحفظ" : "Save Error", description: errMsg || (isRTL ? "تعذر الحفظ على السيرفر" : "Failed to save to server"), variant: "destructive", });
    } finally {
      setSaving(false);
    }
  };


  const handleReset = () => {
    if (confirm(isRTL ? "استعادة القيم الأصلية؟" : "Reset to defaults?")) {
      loadContent();
    }
  };

  return (
    <AdminLayout title={{ ar: "محتوى الرئيسية والهيرو", en: "Hero & Homepage Content" }}>
      <div className="space-y-6 pb-12">
        {/* Top Control Bar */}
        <div className="rounded-2xl border border-border/70 bg-card p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-black text-foreground">
                  {isRTL ? "إدارة واجهة الهيرو ومحتوى الرئيسية" : "Hero & Homepage CMS"}
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  {isRTL
                    ? "تعديل فوري لنصوص الهيرو والبادجات والأزرار مع مزامنة لحظية مع الموقع"
                    : "Directly edit hero titles, badges and CTAs synced with live website"}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5">
              <Button
                variant={showLivePreview ? "default" : "outline"}
                size="sm"
                onClick={() => setShowLivePreview(!showLivePreview)}
                className="h-9 text-xs font-bold rounded-xl gap-1.5 px-3.5 border-border"
              >
                {showLivePreview ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                <span>{showLivePreview ? (isRTL ? "إخفاء المعاينة" : "Hide Preview") : (isRTL ? "عرض المعاينة" : "Show Preview")}</span>
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="h-9 gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm px-4"
              >
                {saving ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                <span>{isRTL ? "حفظ التغييرات" : "Save Changes"}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* ── LOADING SKELETON (while fetching backend data) ── */}
        {loading && (
          <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4 animate-pulse">
            <div className="flex items-center gap-3 pb-3 border-b border-border">
              <div className="h-5 w-5 rounded-full bg-muted-foreground/20" />
              <div className="h-4 w-48 rounded-lg bg-muted-foreground/20" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[...Array(2)].map((_, ci) => (
                <div key={ci} className="space-y-4 rounded-xl border border-border/60 p-4">
                  <div className="h-4 w-32 rounded bg-muted-foreground/20" />
                  {[...Array(4)].map((_, fi) => (
                    <div key={fi} className="space-y-1.5">
                      <div className="h-3 w-24 rounded bg-muted-foreground/15" />
                      <div className="h-9 w-full rounded-xl bg-muted-foreground/10" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center pt-2">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
              <span>{isRTL ? "جاري تحميل المحتوى من السيرفر..." : "Loading content from server..."}</span>
            </div>
          </div>
        )}

        {/* ── TABS + FORM (only render after backend data loaded) ── */}
        {!loading && (
        <>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("hero")}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition ${
                activeTab === "hero"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "border border-border text-foreground hover:bg-muted"
              }`}
            >
              <Sparkles className="h-4 w-4" />
              {isRTL ? "الهيرو (الواجهة الرئيسية)" : "Hero Section"}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("section2")}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition ${
                activeTab === "section2"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "border border-border text-foreground hover:bg-muted"
              }`}
            >
              <FileText className="h-4 w-4" />
              {isRTL ? "قسم الوعد والكولاج" : "Brand Promise & Collage"}
            </button>
          </div>

          {/* Language switcher for preview (compact) */}
          {showLivePreview && (
            <div className="flex items-center bg-muted border border-border p-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => setPreviewLang("ar")}
                className={`px-3 py-1 rounded-md text-xs font-bold transition ${
                  previewLang === "ar" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                عربي
              </button>
              <button
                type="button"
                onClick={() => setPreviewLang("en")}
                className={`px-3 py-1 rounded-md text-xs font-bold transition ${
                  previewLang === "en" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                En
              </button>
            </div>
          )}
        </div>

        {/* ── HIGH-FIDELITY LIVE PREVIEW (MATCHING REAL SITE COLORS 100%) ── */}
        {showLivePreview && (
          <div className="overflow-hidden rounded-3xl border-2 border-emerald-800/40 shadow-2xl relative">
            {/* Real site radial gradient background */}
            <div
              style={{
                background: "radial-gradient(ellipse 100% 90% at 50% -10%, #115e3b 0%, #0c492c 60%, #083820 100%)",
                color: "#ffffff",
              }}
              className="p-6 sm:p-10 relative isolate"
            >
              {/* Decorative glow */}
              <div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-1/2 -z-0 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400/10 blur-3xl"
              />

              {/* Preview label */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-3 border-b border-white/15">
                <span className="inline-flex items-center gap-2 text-xs font-bold text-white/80">
                  <Eye className="h-3.5 w-3.5" />
                  {isRTL
                    ? (activeTab === "hero" ? "معاينة مباشرة — قسم الهيرو" : "معاينة مباشرة — قسم الوعد والكولاج")
                    : (activeTab === "hero" ? "Live Preview — Hero Section" : "Live Preview — Brand Promise & Collage")}
                </span>
                <span className="text-[11px] text-white/50 font-mono">{previewLang === "ar" ? "اللغة العربية" : "English"}</span>
              </div>

              {/* Conditional Stage Content: Hero vs Section 2 */}
              {activeTab === "hero" ? (
                /* Hero Stage Content */
                <div
                  dir={previewLang === "ar" ? "rtl" : "ltr"}
                  className="py-6 px-2 text-center max-w-2xl mx-auto space-y-4"
                >
                  {/* 1. Shimmer Badge */}
                  <div className="flex justify-center">
                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/15 px-3.5 py-1 text-xs font-black text-[#a3e635] shadow-xs backdrop-blur-md">
                      <span className="h-2 w-2 rounded-full bg-[#a3e635] animate-pulse" />
                      <span>
                        {previewLang === "ar"
                          ? form.hero_badge_ar || HOMEPAGE_DEFAULT_CONTENT.hero_badge_ar
                          : form.hero_badge_en || HOMEPAGE_DEFAULT_CONTENT.hero_badge_en}
                      </span>
                    </span>
                  </div>

                  {/* 2. Main Title & Accent */}
                  <h2
                    className="text-2xl sm:text-4xl lg:text-[42px] font-black tracking-tight leading-tight text-white"
                    style={{ textShadow: "0 4px 20px rgba(0,0,0,0.6)" }}
                  >
                    <span className="block">
                      {previewLang === "ar"
                        ? form.hero_title_ar || "معًا نصل بصدقتك"
                        : form.hero_title_en || "Together We Deliver Your Charity"}
                    </span>
                    <span
                      className="block font-black mt-1"
                      style={{
                        color: "#a3e635",
                        textShadow: "0 0 24px rgba(163,230,53,0.35)",
                      }}
                    >
                      {previewLang === "ar"
                        ? form.hero_title_accent_ar || "لمن يستحق"
                        : form.hero_title_accent_en || "To Those in Need"}
                    </span>
                  </h2>

                  {/* 3. Subtitle / Description */}
                  <p
                    className="max-w-xl mx-auto text-xs sm:text-sm md:text-base font-medium leading-relaxed text-white/90"
                    style={{ textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}
                  >
                    {previewLang === "ar"
                      ? form.hero_description_ar ||
                        "تبرّعك من اليوم يوصل لأسرة مستحقة بأيدي متطوعينا الموثوقين — سريع، شفاف، وبأعلى معايير الأمانة."
                      : form.hero_description_en ||
                        "Your donation reaches a deserving family today through our trusted volunteers — fast, transparent, and documented."}
                  </p>

                  {/* 4. Action Buttons */}
                  <div className="flex flex-row items-center justify-center gap-3 pt-3">
                    {(() => {
                      const PrimaryIcon = getLucideIcon(form.hero_cta_primary_icon || "Heart");
                      const SecondaryIcon = getLucideIcon(form.hero_cta_secondary_icon || "Info");
                      return (
                        <>
                          <div
                            className="h-10 px-5 rounded-2xl text-white font-black flex items-center justify-center gap-1.5 text-xs shadow-lg cursor-default"
                            style={{
                              background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                              boxShadow: "0 8px 20px rgba(249,115,22,0.35)",
                            }}
                          >
                            <PrimaryIcon className="h-4 w-4" />
                            <span>
                              {previewLang === "ar"
                                ? form.hero_cta_primary_ar || "تبرع الآن"
                                : form.hero_cta_primary_en || "Donate Now"}
                            </span>
                          </div>
                          <div className="h-10 px-5 rounded-2xl border-2 border-white/50 bg-white/15 text-white font-black flex items-center justify-center gap-1.5 text-xs backdrop-blur-md shadow-sm cursor-default">
                            <SecondaryIcon className="h-4 w-4" />
                            <span>
                              {previewLang === "ar"
                                ? form.hero_cta_secondary_ar || "تعرّف علينا"
                                : form.hero_cta_secondary_en || "About us"}
                            </span>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* 5. Transparency Badge */}
                  <div className="pt-2 flex justify-center">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-white/10 px-3 py-0.5 text-xs font-bold text-emerald-200 backdrop-blur-xs">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                      <span>
                        {previewLang === "ar"
                          ? form.hero_transparency_text_ar || "%99 شفافية"
                          : form.hero_transparency_text_en || "99% Transparency"}
                      </span>
                    </span>
                  </div>
                </div>
              ) : (
                /* Section 2 (Brand Promise) Stage Content */
                <div
                  dir={previewLang === "ar" ? "rtl" : "ltr"}
                  className="rounded-2xl bg-white text-slate-900 p-5 sm:p-7 md:p-8 shadow-2xl w-full mx-auto"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-center w-full">
                    <div className="text-center md:text-start space-y-3.5">
                      {/* Badge */}
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 text-emerald-800 px-3.5 py-1 text-xs font-black">
                        {previewLang === "ar"
                          ? form.section2_badge_ar || "مع اليسر"
                          : form.section2_badge_en || "With Al-Yusr"}
                      </span>

                      {/* Title */}
                      <h3 className="text-2xl sm:text-3xl font-black leading-tight text-emerald-950">
                        <span className="block">
                          {previewLang === "ar"
                            ? form.section2_title_ar || "خيرك يوصل"
                            : form.section2_title_en || "Your good arrives"}
                        </span>
                        <span className="block text-amber-600 font-black mt-1">
                          {previewLang === "ar"
                            ? form.section2_title_accent_ar || "وأجرك يستمر"
                            : form.section2_title_accent_en || "Your reward continues"}
                        </span>
                      </h3>

                      {/* Description */}
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                        {previewLang === "ar"
                          ? form.section2_description_ar ||
                            "تبرعك هو استثمارك في الجنة وراحتك في الدنيا، تبرعك موثّق وأثرك مرئي. بتبرع بسيط تقدر تفتح باب أمل لأسرة كاملة — خليك سبب."
                          : form.section2_description_en ||
                            "Your donation is your investment in the hereafter and your peace in this life — documented and visible in impact. A simple gift opens a door of hope for a whole family. Be the reason."}
                      </p>

                      {/* Action Buttons */}
                      <div className="flex flex-row items-center justify-center md:justify-start gap-3 pt-2">
                        {(() => {
                          const PreviewPrimaryIcon = getLucideIcon(form.section2_cta_primary_icon || "Compass");
                          const PreviewSecondaryIcon = getLucideIcon(form.section2_cta_secondary_icon || "Calculator");
                          return (
                            <>
                              <div
                                className="h-10 px-5 rounded-2xl text-white font-black flex items-center justify-center gap-1.5 text-xs shadow-md"
                                style={{ background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)" }}
                              >
                                <PreviewPrimaryIcon className="h-4 w-4" />
                                <span>
                                  {previewLang === "ar"
                                    ? form.section2_cta_primary_ar || "استكشف البرامج"
                                    : form.section2_cta_primary_en || "Explore programs"}
                                </span>
                              </div>
                              <div className="h-10 px-5 rounded-2xl border-2 border-emerald-950/20 bg-slate-100 text-emerald-950 font-bold flex items-center justify-center gap-1.5 text-xs">
                                <PreviewSecondaryIcon className="h-4 w-4" />
                                <span>
                                  {previewLang === "ar"
                                    ? form.section2_cta_secondary_ar || "احسب زكاتك"
                                    : form.section2_cta_secondary_en || "Zakat calculator"}
                                </span>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Live Collage — 5-col × 2-row flat grid matching BrandPromise.tsx */}
                    <div
                      className="relative mx-auto grid w-full grid-cols-5 grid-rows-2 gap-2.5 sm:gap-3"
                      style={{ height: "clamp(240px, 30vw, 320px)" }}
                    >
                      {/* Big poster: col-span-3 row-span-2 */}
                      <div className="col-span-3 row-span-2 overflow-hidden rounded-2xl border-2 border-emerald-500/30 shadow-md bg-muted relative group">
                        <img
                          src={previewUrls.section2_main_image || formatServerImageUrl(form.section2_main_image) || brandPoster}
                          alt="Main Poster"
                          className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = brandPoster;
                          }}
                        />
                        <div className="absolute top-2 start-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                          {previewLang === "ar" ? "الصورة الكبرى" : "Main Poster"}
                        </div>
                      </div>

                      {/* Top small image: col-span-2 row 1 */}
                      <div className="col-span-2 overflow-hidden rounded-xl border-2 border-emerald-400/30 shadow-xs bg-muted relative group">
                        <img
                          src={previewUrls.section2_left_top_image || formatServerImageUrl(form.section2_left_top_image) || brandBags}
                          alt="Top Image"
                          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = brandBags;
                          }}
                        />
                        <div className="absolute top-1.5 start-1.5 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                          {previewLang === "ar" ? "الصورة العلوية" : "Top Image"}
                        </div>
                      </div>

                      {/* Bottom CTA card: col-span-2 row 2 */}
                      <div
                        className="col-span-2 flex flex-col items-center justify-center overflow-hidden rounded-xl p-2.5 text-center text-white shadow-md cursor-pointer transition-transform duration-300 hover:scale-[1.02]"
                        style={{ background: "linear-gradient(135deg, #fb923c 0%, #ea580c 100%)" }}
                      >
                        <div className="inline-flex items-center justify-center gap-1 text-[11px] font-black text-white/95">
                          <HandHeart className="h-3.5 w-3.5 shrink-0 text-white" />
                          <span>
                            {previewLang === "ar"
                              ? form.section2_card_cta_title_ar || "كن سبب الفرحة"
                              : form.section2_card_cta_title_en || "Be their joy"}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[10px] font-black leading-tight text-white/90 line-clamp-2">
                          {previewLang === "ar"
                            ? form.section2_card_cta_sub_ar || "كل تبرع موثّق و كل أثر مرئي"
                            : form.section2_card_cta_sub_en || "Every donation tracked, every impact visible"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}


        {/* ── TAB 1: HERO CONTENT EDITING ── */}
        {activeTab === "hero" && (
          <div className="space-y-6">
            {/* Side-by-side: Main Headline & Accent */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Arabic Headline Card */}
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-border pb-2.5">
                  <span className="font-extrabold text-sm text-primary flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    {isRTL ? "العناوين (عربي)" : "Arabic Headlines"}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-semibold">أساسي</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">البادج العلوي المضيء</label>
                  <Input
                    value={form.hero_badge_ar || ""}
                    onChange={(e) => handleChange("hero_badge_ar", e.target.value)}
                    placeholder="خيرك يوصل وأجرك يستمر"
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">العنوان الرئيسي (السطر الأول)</label>
                  <Input
                    value={form.hero_title_ar || ""}
                    onChange={(e) => handleChange("hero_title_ar", e.target.value)}
                    placeholder="معًا نصل بصدقتك"
                    className="rounded-xl font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    الجزء المميز من العنوان (بلون مختلف)
                  </label>
                  <Input
                    value={form.hero_title_accent_ar || ""}
                    onChange={(e) => handleChange("hero_title_accent_ar", e.target.value)}
                    placeholder="لمن يستحق"
                    className="rounded-xl font-black text-emerald-600 dark:text-emerald-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">الوصف التعريفي (الفقرة)</label>
                  <Textarea
                    value={form.hero_description_ar || ""}
                    onChange={(e) => handleChange("hero_description_ar", e.target.value)}
                    rows={4}
                    placeholder="نص تعريفي جذاب يشرح فكرة الجمعية للمتبرع..."
                    className="rounded-xl resize-none text-xs sm:text-sm leading-relaxed"
                  />
                </div>
              </div>

              {/* English Headline Card */}
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-border pb-2.5">
                  <span className="font-extrabold text-sm text-primary flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                    {isRTL ? "العناوين (إنجليزي)" : "English Headlines"}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-semibold">English</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Top Shimmer Badge</label>
                  <Input
                    value={form.hero_badge_en || ""}
                    onChange={(e) => handleChange("hero_badge_en", e.target.value)}
                    placeholder="Your goodness reaches — your reward remains"
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Main Title (Line 1)</label>
                  <Input
                    value={form.hero_title_en || ""}
                    onChange={(e) => handleChange("hero_title_en", e.target.value)}
                    placeholder="Together We Deliver Your Charity"
                    className="rounded-xl font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    Title Accent (Highlighted Part)
                  </label>
                  <Input
                    value={form.hero_title_accent_en || ""}
                    onChange={(e) => handleChange("hero_title_accent_en", e.target.value)}
                    placeholder="To Those in Need"
                    className="rounded-xl font-black text-emerald-600 dark:text-emerald-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Description Subtitle</label>
                  <Textarea
                    value={form.hero_description_en || ""}
                    onChange={(e) => handleChange("hero_description_en", e.target.value)}
                    rows={4}
                    placeholder="Your donation reaches a deserving family today..."
                    className="rounded-xl resize-none text-xs sm:text-sm leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* CTAs & Buttons Card */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-2.5">
                <SlidersHorizontal className="h-4 w-4 text-primary" />
                <span className="font-extrabold text-sm text-primary">
                  {isRTL ? "أزرار التفاعل والروابط" : "CTA Buttons & Destinations"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Primary Button */}
                {(() => {
                  const PrimaryHeroIcon = getLucideIcon(form.hero_cta_primary_icon || "Heart");
                  return (
                    <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-3">
                      <div className="flex items-center gap-2 font-bold text-xs text-primary">
                        <PrimaryHeroIcon className="h-3.5 w-3.5 text-rose-500" />
                        <span>{isRTL ? "الزر الأساسي (التبرع)" : "Primary Button (Donate)"}</span>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground">
                          {isRTL ? "أيقونة الزر (Lucide Icon)" : "Button Icon"}
                        </label>
                        <LucideIconPicker
                          value={form.hero_cta_primary_icon || "Heart"}
                          onChange={(val) => handleChange("hero_cta_primary_icon", val)}
                          isAr={isRTL}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-foreground">نص الزر (عربي)</label>
                          <Input
                            value={form.hero_cta_primary_ar || ""}
                            onChange={(e) => handleChange("hero_cta_primary_ar", e.target.value)}
                            placeholder="تبرع الآن"
                            className="rounded-xl font-bold"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-foreground">Button Text (En)</label>
                          <Input
                            value={form.hero_cta_primary_en || ""}
                            onChange={(e) => handleChange("hero_cta_primary_en", e.target.value)}
                            placeholder="Donate Now"
                            className="rounded-xl"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground">{isRTL ? "رابط التوجيه" : "Link Target"}</label>
                        <Input
                          value={form.hero_cta_primary_link || ""}
                          onChange={(e) => handleChange("hero_cta_primary_link", e.target.value)}
                          placeholder="/donate"
                          className="rounded-xl font-mono text-xs"
                        />
                      </div>
                    </div>
                  );
                })()}

                {/* Secondary Button */}
                {(() => {
                  const SecondaryHeroIcon = getLucideIcon(form.hero_cta_secondary_icon || "Info");
                  return (
                    <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-3">
                      <div className="flex items-center gap-2 font-bold text-xs text-primary">
                        <SecondaryHeroIcon className="h-3.5 w-3.5 text-blue-500" />
                        <span>{isRTL ? "الزر الثانوي (تعرّف علينا)" : "Secondary Button (About)"}</span>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground">
                          {isRTL ? "أيقونة الزر (Lucide Icon)" : "Button Icon"}
                        </label>
                        <LucideIconPicker
                          value={form.hero_cta_secondary_icon || "Info"}
                          onChange={(val) => handleChange("hero_cta_secondary_icon", val)}
                          isAr={isRTL}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-foreground">نص الزر (عربي)</label>
                          <Input
                            value={form.hero_cta_secondary_ar || ""}
                            onChange={(e) => handleChange("hero_cta_secondary_ar", e.target.value)}
                            placeholder="تعرّف علينا"
                            className="rounded-xl font-bold"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-foreground">Button Text (En)</label>
                          <Input
                            value={form.hero_cta_secondary_en || ""}
                            onChange={(e) => handleChange("hero_cta_secondary_en", e.target.value)}
                            placeholder="About us"
                            className="rounded-xl"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground">{isRTL ? "رابط التوجيه" : "Link Target"}</label>
                        <Input
                          value={form.hero_cta_secondary_link || ""}
                          onChange={(e) => handleChange("hero_cta_secondary_link", e.target.value)}
                          placeholder="/about"
                          className="rounded-xl font-mono text-xs"
                        />
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Transparency Text Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">شارة الشفافية (عربي)</label>
                  <Input
                    value={form.hero_transparency_text_ar || ""}
                    onChange={(e) => handleChange("hero_transparency_text_ar", e.target.value)}
                    placeholder="%99 شفافية"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Transparency Badge (En)</label>
                  <Input
                    value={form.hero_transparency_text_en || ""}
                    onChange={(e) => handleChange("hero_transparency_text_en", e.target.value)}
                    placeholder="99% Transparency"
                    className="rounded-xl"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: SECTION 2 (BRAND PROMISE) ── */}
        {activeTab === "section2" && (
          <div className="space-y-6">
            <p className="rounded-xl border border-border bg-muted/40 px-4 py-2.5 text-xs font-bold text-muted-foreground">
              {isRTL
                ? "القسم ده (خيرك يوصل وأجرك يستمر) بيظهر في الصفحة الرئيسية بس. صوره ونصوصه مش مربوطة بصفحة من نحن، وصفحة من نحن ليها محتواها الخاص."
                : "This section shows on the home page only. Its images and texts are not shared with the About page."}
            </p>
            {/* Row 1: Section 2 Arabic & English Text Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-border pb-2.5">
                  <span className="font-extrabold text-sm text-primary flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    {isRTL ? "نصوص القسم الثاني (عربي)" : "Section 2 Texts (Arabic)"}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-semibold">عربي</span>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">بادج القسم</label>
                  <Input
                    value={form.section2_badge_ar || ""}
                    onChange={(e) => handleChange("section2_badge_ar", e.target.value)}
                    placeholder="مع اليسر"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">العنوان الأول</label>
                  <Input
                    value={form.section2_title_ar || ""}
                    onChange={(e) => handleChange("section2_title_ar", e.target.value)}
                    placeholder="خيرك يوصل"
                    className="rounded-xl font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">العنوان المميز</label>
                  <Input
                    value={form.section2_title_accent_ar || ""}
                    onChange={(e) => handleChange("section2_title_accent_ar", e.target.value)}
                    placeholder="وأجرك يستمر"
                    className="rounded-xl font-black text-amber-600 dark:text-amber-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">الوصف التوضيحي</label>
                  <Textarea
                    value={form.section2_description_ar || ""}
                    onChange={(e) => handleChange("section2_description_ar", e.target.value)}
                    rows={4}
                    placeholder="تبرعك هو استثمارك في الجنة وراحتك في الدنيا..."
                    className="rounded-xl resize-none text-xs sm:text-sm leading-relaxed"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-border pb-2.5">
                  <span className="font-extrabold text-sm text-primary flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                    {isRTL ? "نصوص القسم الثاني (إنجليزي)" : "Section 2 Texts (English)"}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-semibold">English</span>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Badge</label>
                  <Input
                    value={form.section2_badge_en || ""}
                    onChange={(e) => handleChange("section2_badge_en", e.target.value)}
                    placeholder="With Al-Yusr"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Title (Line 1)</label>
                  <Input
                    value={form.section2_title_en || ""}
                    onChange={(e) => handleChange("section2_title_en", e.target.value)}
                    placeholder="Your good arrives"
                    className="rounded-xl font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Title Accent (Line 2)</label>
                  <Input
                    value={form.section2_title_accent_en || ""}
                    onChange={(e) => handleChange("section2_title_accent_en", e.target.value)}
                    placeholder="Your reward continues"
                    className="rounded-xl font-black text-amber-600 dark:text-amber-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Description</label>
                  <Textarea
                    value={form.section2_description_en || ""}
                    onChange={(e) => handleChange("section2_description_en", e.target.value)}
                    rows={4}
                    placeholder="Your donation is your investment in the hereafter..."
                    className="rounded-xl resize-none text-xs sm:text-sm leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* Row 2: Collage Images & Interactive Impact Card Editor */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Collage Images Management */}
              <div className="rounded-2xl border border-border bg-card p-5 space-y-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-border pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      <ImageIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-foreground">
                        {isRTL ? "صور كولاج القسم (توثيقات وبوستر)" : "Section Collage Images"}
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        {isRTL ? "تحكم في الصور المعروضة داخل شبكة الكولاج" : "Manage images in collage grid"}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    2 {isRTL ? "صور" : "Photos"}
                  </span>
                </div>

                {/* 1. Main Big Poster Image */}
                <div className="space-y-3.5 rounded-2xl border border-border/80 bg-muted/25 p-4 transition hover:border-emerald-500/40">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-xs" />
                      <span className="font-extrabold">{isRTL ? "1. صورة البوستر الرئيسية الكبرى" : "1. Main Poster Frame (Large)"}</span>
                    </label>
                    {form.section2_main_image && (
                      <button
                        type="button"
                        onClick={() => handleChange("section2_main_image", "")}
                        className="text-[11px] font-bold text-muted-foreground hover:text-destructive flex items-center gap-1 transition"
                      >
                        <Undo2 className="h-3 w-3" />
                        {isRTL ? "استعادة الافتراضية" : "Reset default"}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-3.5 items-center">
                    {/* Thumbnail Preview */}
                    <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl border-2 border-emerald-500/30 bg-muted shadow-sm group">
                      <img
                        src={previewUrls.section2_main_image || formatServerImageUrl(form.section2_main_image) || brandPoster}
                        alt="Main Poster Preview"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = brandPoster;
                        }}
                      />
                      <span className="absolute bottom-1 start-1 rounded bg-black/70 px-1 py-0.2 text-[9px] font-bold text-white">
                        {(previewUrls.section2_main_image || form.section2_main_image) ? (isRTL ? "مخصصة" : "Custom") : (isRTL ? "مدمجة" : "Built-in")}
                      </span>
                    </div>

                    {/* Direct Link Input + Upload from Device */}
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <Input
                          value={form.section2_main_image || ""}
                          onChange={(e) => handleChange("section2_main_image", e.target.value.trim().replace(/\/+$/, ""))}
                          placeholder="https://... أو مسار صورة البوستر المباشر"
                          className="rounded-xl font-mono text-xs flex-1"
                        />
                        <label className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold cursor-pointer transition shadow-xs shrink-0">
                          {uploadingMain ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              <span>{isRTL ? "جاري الرفع..." : "Uploading..."}</span>
                            </>
                          ) : (
                            <>
                              <Upload className="h-3.5 w-3.5" />
                              <span>{isRTL ? "رفع صورة من جهازك" : "Upload Image"}</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={uploadingMain}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleUploadImage(file, "section2_main_image", setUploadingMain);
                              e.target.value = "";
                            }}
                          />
                        </label>
                      </div>
                      <p className="text-[10.5px] text-muted-foreground flex items-center gap-1">
                        <Info className="h-3 w-3 shrink-0 text-emerald-600" />
                        <span>
                          {isRTL
                            ? "يمكنك لصق رابط مباشر أو الضغط على 'رفع صورة من جهازك' لحفظها بالسيرفر تلقائياً"
                            : "Paste direct URL or click 'Upload Image' to store on server automatically"}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Top Bags / Convoys Image */}
                <div className="space-y-3.5 rounded-2xl border border-border/80 bg-muted/25 p-4 transition hover:border-amber-500/40">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shadow-xs" />
                      <span className="font-extrabold">{isRTL ? "2. صورة كراتين وقوافل الخير (العلوية)" : "2. Top Side Image (Food Boxes)"}</span>
                    </label>
                    {(previewUrls.section2_left_top_image || form.section2_left_top_image) && (
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewUrls((p) => ({ ...p, section2_left_top_image: undefined }));
                          handleChange("section2_left_top_image", "");
                        }}
                        className="text-[11px] font-bold text-muted-foreground hover:text-destructive flex items-center gap-1 transition"
                      >
                        <Undo2 className="h-3 w-3" />
                        {isRTL ? "استعادة الافتراضية" : "Reset default"}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-3.5 items-center">
                    {/* Thumbnail Preview */}
                    <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl border-2 border-amber-500/30 bg-muted shadow-sm group">
                      <img
                        src={previewUrls.section2_left_top_image || formatServerImageUrl(form.section2_left_top_image) || brandBags}
                        alt="Top Bags Preview"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = brandBags;
                        }}
                      />
                      <span className="absolute bottom-1 start-1 rounded bg-black/70 px-1 py-0.2 text-[9px] font-bold text-white">
                        {(previewUrls.section2_left_top_image || form.section2_left_top_image) ? (isRTL ? "مخصصة" : "Custom") : (isRTL ? "مدمجة" : "Built-in")}
                      </span>
                    </div>

                    {/* Direct Link Input + Upload from Device */}
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <Input
                          value={form.section2_left_top_image || ""}
                          onChange={(e) => handleChange("section2_left_top_image", e.target.value.trim().replace(/\/+$/, ""))}
                          placeholder="https://... أو مسار صورة كراتين التوزيع"
                          className="rounded-xl font-mono text-xs flex-1"
                        />
                        <label className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer transition shadow-xs shrink-0">
                          {uploadingTop ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              <span>{isRTL ? "جاري الرفع..." : "Uploading..."}</span>
                            </>
                          ) : (
                            <>
                              <Upload className="h-3.5 w-3.5" />
                              <span>{isRTL ? "رفع صورة من جهازك" : "Upload Image"}</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={uploadingTop}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleUploadImage(file, "section2_left_top_image", setUploadingTop);
                              e.target.value = "";
                            }}
                          />
                        </label>
                      </div>
                      <p className="text-[10.5px] text-muted-foreground flex items-center gap-1">
                        <Info className="h-3 w-3 shrink-0 text-amber-600" />
                        <span>
                          {isRTL
                            ? "اترك الحقل فارغاً لاستخدام صورة كراتين اليسر الأصلية أو ارفع صورة جديدة"
                            : "Leave empty to use official image or upload new photo"}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Impact Card in Collage */}
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-border pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/15 text-orange-600 dark:text-orange-400">
                      <HandHeart className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-foreground">
                        {isRTL ? "كارت الأثر التفاعلي بالكولاج" : "Interactive Impact Card"}
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        {isRTL ? "الكارت البرتقالي التفاعلي أسفل يمين/يسار الكولاج" : "Orange CTA card inside collage"}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded">
                    CTA Card
                  </span>
                </div>

                {/* Card Title Arabic & English */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">عنوان الكارت (عربي)</label>
                    <Input
                      value={form.section2_card_cta_title_ar || ""}
                      onChange={(e) => handleChange("section2_card_cta_title_ar", e.target.value)}
                      placeholder="كن سبب الفرحة"
                      className="rounded-xl font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Card Title (English)</label>
                    <Input
                      value={form.section2_card_cta_title_en || ""}
                      onChange={(e) => handleChange("section2_card_cta_title_en", e.target.value)}
                      placeholder="Be their joy"
                      className="rounded-xl font-bold"
                    />
                  </div>
                </div>

                {/* Card Subtitle Arabic & English */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">نص الكارت التوضيحي (عربي)</label>
                    <Input
                      value={form.section2_card_cta_sub_ar || ""}
                      onChange={(e) => handleChange("section2_card_cta_sub_ar", e.target.value)}
                      placeholder="كل تبرع موثّق و كل أثر مرئي"
                      className="rounded-xl text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Card Subtitle (English)</label>
                    <Input
                      value={form.section2_card_cta_sub_en || ""}
                      onChange={(e) => handleChange("section2_card_cta_sub_en", e.target.value)}
                      placeholder="Every donation tracked, every impact visible"
                      className="rounded-xl text-xs"
                    />
                  </div>
                </div>

                {/* Card Target Link */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">رابط التوجيه عند النقر على الكارت</label>
                  <Input
                    value={form.section2_card_cta_link || ""}
                    onChange={(e) => handleChange("section2_card_cta_link", e.target.value)}
                    placeholder="/about#impact أو /donate"
                    className="rounded-xl font-mono text-xs"
                  />
                </div>

                {/* Card Mini Live Badge */}
                <div
                  className="rounded-xl p-3 text-center text-white shadow-sm flex items-center justify-between gap-2"
                  style={{ background: "linear-gradient(135deg, #fb923c 0%, #ea580c 100%)" }}
                >
                  <div className="flex items-center gap-2 text-start">
                    <HandHeart className="h-5 w-5 shrink-0 text-white" />
                    <div>
                      <p className="text-xs font-black text-white">
                        {isRTL ? form.section2_card_cta_title_ar || "كن سبب الفرحة" : form.section2_card_cta_title_en || "Be their joy"}
                      </p>
                      <p className="text-[11px] text-white/90">
                        {isRTL ? form.section2_card_cta_sub_ar || "كل تبرع موثّق و كل أثر مرئي" : form.section2_card_cta_sub_en || "Every donation tracked, every impact visible"}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono bg-black/25 px-2 py-1 rounded text-white/90">
                    {form.section2_card_cta_link || "/about#impact"}
                  </span>
                </div>
              </div>
            </div>

            {/* Row 3: Action Buttons (Primary & Secondary CTA) */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    <Compass className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-foreground">
                      {isRTL ? "أزرار الإجراء بقسم البراند بروميس" : "Brand Promise Action Buttons"}
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      {isRTL ? "التحكم في نص وروابط الزرين (استكشف البرامج / احسب زكاتك)" : "Control primary and secondary CTA buttons"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Primary Button */}
                {(() => {
                  const PrimaryHeaderIcon = getLucideIcon(form.section2_cta_primary_icon || "Compass");
                  return (
                    <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-3">
                      <div className="flex items-center gap-2 font-bold text-xs text-primary">
                        <PrimaryHeaderIcon className="h-3.5 w-3.5 text-orange-500" />
                        <span>{isRTL ? "الزر الأساسي (البرتقالي)" : "Primary Button (Orange)"}</span>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground">
                          {isRTL ? "أيقونة الزر (Lucide Icon)" : "Button Icon"}
                        </label>
                        <LucideIconPicker
                          value={form.section2_cta_primary_icon || "Compass"}
                          onChange={(val) => handleChange("section2_cta_primary_icon", val)}
                          isAr={isRTL}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground">نص الزر (عربي)</label>
                        <Input
                          value={form.section2_cta_primary_ar || ""}
                          onChange={(e) => handleChange("section2_cta_primary_ar", e.target.value)}
                          placeholder="استكشف البرامج"
                          className="rounded-xl font-bold"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground">Button Text (English)</label>
                        <Input
                          value={form.section2_cta_primary_en || ""}
                          onChange={(e) => handleChange("section2_cta_primary_en", e.target.value)}
                          placeholder="Explore programs"
                          className="rounded-xl"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground">{isRTL ? "رابط التوجيه" : "Link Target"}</label>
                        <Input
                          value={form.section2_cta_primary_link || ""}
                          onChange={(e) => handleChange("section2_cta_primary_link", e.target.value)}
                          placeholder="/programs أو /projects"
                          className="rounded-xl font-mono text-xs"
                        />
                      </div>
                    </div>
                  );
                })()}

                {/* Secondary Button */}
                {(() => {
                  const SecondaryHeaderIcon = getLucideIcon(form.section2_cta_secondary_icon || "Calculator");
                  return (
                    <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-3">
                      <div className="flex items-center gap-2 font-bold text-xs text-primary">
                        <SecondaryHeaderIcon className="h-3.5 w-3.5 text-emerald-600" />
                        <span>{isRTL ? "الزر الثانوي (الرمادي/الآلة)" : "Secondary Button (Calculator)"}</span>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground">
                          {isRTL ? "أيقونة الزر (Lucide Icon)" : "Button Icon"}
                        </label>
                        <LucideIconPicker
                          value={form.section2_cta_secondary_icon || "Calculator"}
                          onChange={(val) => handleChange("section2_cta_secondary_icon", val)}
                          isAr={isRTL}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground">نص الزر (عربي)</label>
                        <Input
                          value={form.section2_cta_secondary_ar || ""}
                          onChange={(e) => handleChange("section2_cta_secondary_ar", e.target.value)}
                          placeholder="احسب زكاتك"
                          className="rounded-xl font-bold"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground">Button Text (English)</label>
                        <Input
                          value={form.section2_cta_secondary_en || ""}
                          onChange={(e) => handleChange("section2_cta_secondary_en", e.target.value)}
                          placeholder="Zakat calculator"
                          className="rounded-xl"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground">{isRTL ? "رابط التوجيه" : "Link Target"}</label>
                        <Input
                          value={form.section2_cta_secondary_link || ""}
                          onChange={(e) => handleChange("section2_cta_secondary_link", e.target.value)}
                          placeholder="/zakat-calculator"
                          className="rounded-xl font-mono text-xs"
                        />
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
        </>
        )}
        {/* end !loading */}
      </div>
    </AdminLayout>
  );
};

export default AdminHomepageContent;
