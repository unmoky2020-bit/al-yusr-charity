import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useLang } from "@/i18n/LangContext";
import {
  Building2,
  Sparkles,
  BarChart3,
  Layers,
  ShieldCheck,
  HeartHandshake,
  Heart,
  BookOpen,
  Target,
  Save,
  Plus,
  Trash2,
  Loader2,
  RefreshCw,
  Percent,
  Upload,
  Image as ImageIcon,
  ExternalLink,
  CheckCircle2,
  Copy,
  RotateCcw,
} from "lucide-react";
import {
  aboutUsApi,
  AboutUsData,
  ABOUT_US_DEFAULT_DATA,
  AboutUsStatItem,
  AboutUsProgramItem,
  AboutUsTrustItem,
  AboutUsWhyUsItem,
  AboutUsValueItem,
  AboutUsVisionItem,
  invalidateApiCache,
  galleryApi,
  resolveStorageUrl,
  formatServerImageUrl,
} from "@/data/laravelApi";
import { compressImage } from "@/lib/image-compress";
import { ChoiceSelect } from "@/components/admin/programs/FormKit";
import { getAllLucideIconNames, getLucideIcon } from "@/lib/lucide-icon";
import { SUGGESTED_ACTIVITIES, SUGGESTED_WHY_US } from "@/data/aboutSuggestions";

const ICON_OPTIONS = getAllLucideIconNames().map((name) => {
  const I = getLucideIcon(name);
  return { value: name, label: <span className="inline-flex items-center gap-2"><I className="h-4 w-4" />{name}</span> };
});

/** Icon of a card (lucide name), shown with its glyph. */
function IconPick({ value, onChange }: { value?: string | null; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-bold text-foreground">الأيقونة</label>
      <ChoiceSelect value={value || ""} onChange={onChange} options={ICON_OPTIONS} placeholder="اختار أيقونة" className="h-9 text-xs" ariaLabel="الأيقونة" />
    </div>
  );
}
import aboutHero from "@/assets/about-hero-classroom.jpg";

// Cleaned of legacy local storage caching to ensure 100% synchronization with Laravel API

type TabId = "hero" | "stats" | "programs" | "trust" | "why-us" | "values" | "story" | "vision-2030";

interface TabDef {
  id: TabId;
  ar: string;
  en: string;
  icon: typeof Sparkles;
}

const TABS: TabDef[] = [
  { id: "hero", ar: "الهيرو والتعريف", en: "Hero & Identity", icon: Sparkles },
  { id: "stats", ar: "الأرقام والإحصائيات", en: "Stats & Numbers", icon: BarChart3 },
  { id: "programs", ar: "الأنشطة الدائمة", en: "Ongoing activities", icon: Layers },
  { id: "trust", ar: "الاعتمادات والموثوقية", en: "Trust & Licenses", icon: ShieldCheck },
  { id: "why-us", ar: "لماذا تثق بنا", en: "Why Trust Us", icon: HeartHandshake },
  { id: "values", ar: "قيمنا المؤسسية", en: "Our Values", icon: Heart },
  { id: "story", ar: "قصتنا ورسالتنا", en: "Our Story", icon: BookOpen },
  { id: "vision-2030", ar: "مستهدفات 2030", en: "Vision 2030", icon: Target },
];

export default function AdminAboutUs() {
  const { lang } = useLang();
  const isRTL = lang === "ar";
  const [searchParams, setSearchParams] = useSearchParams();
  const tabsContainerRef = useRef<HTMLDivElement>(null);

  const tabParam = searchParams.get("tab") as TabId | null;
  const validTabs: TabId[] = ["hero", "stats", "programs", "trust", "why-us", "values", "story", "vision-2030"];
  const initialTab: TabId = (tabParam && validTabs.includes(tabParam)) ? tabParam : "hero";

  const [activeTab, setActiveTabState] = useState<TabId>(initialTab);

  // Sync activeTab when searchParams change from sidebar navigation
  useEffect(() => {
    if (tabParam && validTabs.includes(tabParam) && tabParam !== activeTab) {
      setActiveTabState(tabParam);
    }
  }, [tabParam]);

  const setActiveTab = (tab: TabId) => {
    setActiveTabState(tab);
    setSearchParams({ tab }, { replace: true });
  };

  // Scroll active tab into view smoothly on mobile
  useEffect(() => {
    if (tabsContainerRef.current) {
      const activeEl = tabsContainerRef.current.querySelector<HTMLButtonElement>(`[data-tab="${activeTab}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }
    }
  }, [activeTab]);
  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [data, setData] = useState<AboutUsData>(ABOUT_US_DEFAULT_DATA);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadCompressionRatio, setUploadCompressionRatio] = useState<number | null>(null);

  const handleUploadHeroImage = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(isRTL ? "يرجى اختيار ملف صورة صالح (JPG, PNG, WebP)" : "Please select a valid image file");
      return;
    }

    setUploadingHero(true);
    setUploadCompressionRatio(null);
    try {
      // 1. Client-side compression (reduces multi-megabyte images by 70-80% while retaining high visual quality)
      const compressed = await compressImage(file, { maxEdge: 1600, quality: 0.82 });
      if (file.size > compressed.size) {
        const ratio = Math.round(((file.size - compressed.size) / file.size) * 100);
        setUploadCompressionRatio(ratio);
      }

      // 2. Upload to Laravel backend storage (/api/v1/gallery)
      const url = await galleryApi.uploadImage(compressed, "صورة_هيرو_من_نحن");
      if (url) {
        updateHero("image", url);
        toast.success(isRTL ? "تم ضغط ورفع الصورة بنجاح!" : "Image compressed and uploaded successfully!");
      } else {
        throw new Error("No URL returned from server");
      }
    } catch (err: any) {
      console.error("Hero image upload error:", err);
      toast.error(isRTL ? "تعذر رفع الصورة: " + (err?.message || "خطأ في الاتصال") : "Failed to upload image");
    } finally {
      setUploadingHero(false);
    }
  };

  // Load live data from Laravel API exclusively
  // silent=true: skip full-page spinner (used after saves to sync without flickering)
  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("elyusr_about_us_content");
          localStorage.removeItem("elyusr_about_us_data");
        } catch {}
      }

      // Always bust cache before fetching after a mutation
      if (silent) {
        invalidateApiCache("/about-us");
        invalidateApiCache("/admin/about-us");
      }

      const res = await aboutUsApi.adminGet();
      if (res) {
        setData(res);
      }
    } catch {
      if (!silent) {
        toast.error(isRTL ? "تعذر تحميل البيانات من السيرفر" : "Failed to load About Us from server");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Save specific section to Laravel API + Local Storage
  const handleSaveSection = async (section: TabId) => {
    setSavingSection(section);
    try {
      if (section === "hero") {
        await aboutUsApi.updateHero({
          title_ar: data.hero.title_ar,
          title_en: data.hero.title_en,
          description_ar: data.hero.description_ar,
          description_en: data.hero.description_en,
          badge_ar: data.hero.badge_ar,
          badge_en: data.hero.badge_en,
          quote_ar: data.hero.quote_ar,
          quote_en: data.hero.quote_en,
          registration_number: data.hero.registration_number || data.story?.registration_number,
          donate_label_ar: data.hero.donate_label_ar,
          donate_label_en: data.hero.donate_label_en,
          donate_button_text: data.hero.donate_label_ar || (data.hero as any).donate_button_text || "تبرع الآن",
          story_label_ar: data.hero.story_label_ar,
          story_label_en: data.hero.story_label_en,
          story_button_text: data.hero.story_label_ar || (data.hero as any).story_button_text || "اعرف قصتنا",
          image: data.hero.image,
        });
      } else if (section === "stats") {
        await aboutUsApi.updateStats({
          year: Number(data.achievements?.year) || new Date().getFullYear(),
          achievements_title_ar: data.achievements?.title_ar || null,
          achievements_title_en: data.achievements?.title_en || null,
          items: data.stats.map((s) => ({
            number: s.number,
            suffix: s.suffix || (typeof s.number === "string" && s.number.endsWith("+") ? "+" : ""),
            title_ar: s.title_ar || s.label_ar || "",
            title_en: s.title_en || s.label_en || "",
          })),
        });
      } else if (section === "programs") {
        await aboutUsApi.updatePrograms({
          title_ar: "أنشطتنا الدائمة",
          title_en: "Our Ongoing Activities",
          items: data.programs,
        });
      } else if (section === "trust") {
        await aboutUsApi.updateTrust({
          title_ar: isRTL ? "ثقة وموثوقية" : "Trust & Credibility",
          title_en: "Trust & Credibility",
          items: data.trust,
        });
      } else if (section === "why-us") {
        await aboutUsApi.updateWhyUs({
          title_ar: isRTL ? "لماذا تثق بنا؟" : "Why Trust Us?",
          title_en: "Why Trust Us?",
          items: data.why_us,
        });
      } else if (section === "values") {
        await aboutUsApi.updateValues({
          title_ar: isRTL ? "قيمنا" : "Our Values",
          title_en: "Our Values",
          items: data.values,
        });
      } else if (section === "story") {
        await aboutUsApi.updateStory({
          title_ar: data.story.title_ar,
          title_en: data.story.title_en,
          description_ar: data.story.description_ar,
          description_en: data.story.description_en,
          registration_number: data.story.registration_number,
          bank_name: data.story.bank_name,
          mission_ar: data.story.mission_ar || (typeof data.story.mission === "object" ? data.story.mission?.description_ar : "") || "",
          mission_en: data.story.mission_en || (typeof data.story.mission === "object" ? data.story.mission?.description_en : "") || "",
          goals_ar: Array.isArray(data.story.goals_ar) ? data.story.goals_ar : (Array.isArray(data.story.goals?.items) ? data.story.goals.items : []),
        });
      } else if (section === "vision-2030") {
        await aboutUsApi.updateVision2030({
          title_ar: data.vision_2030.title_ar,
          title_en: data.vision_2030.title_en,
          description_ar: data.vision_2030.description_ar,
          description_en: data.vision_2030.description_en,
          progress: Number(data.vision_2030.progress) || 0,
          items: data.vision_2030.items,
        });
      }

      const activeDef = TABS.find((t) => t.id === section);
      const sectionName = activeDef ? (isRTL ? activeDef.ar : activeDef.en) : section;
      toast.success(isRTL ? `تم حفظ ${sectionName} بنجاح في السيرفر والموقع` : `Saved ${sectionName} successfully`);

      // Silent re-fetch: sync UI with what server actually persisted (no full-page spinner)
      await loadData(true);
    } catch (err) {
      toast.error(isRTL ? `تعذر الحفظ: ${String(err)}` : `Failed to save: ${String(err)}`);
    } finally {
      setSavingSection(null);
    }
  };

  // Updaters
  const updateHero = (field: keyof typeof data.hero, val: any) => {
    setData((prev) => ({ ...prev, hero: { ...prev.hero, [field]: val } }));
  };

  const updateStory = (field: keyof typeof data.story, val: any) => {
    setData((prev) => ({ ...prev, story: { ...prev.story, [field]: val } }));
  };

  const updateVision = (field: keyof typeof data.vision_2030, val: any) => {
    setData((prev) => ({ ...prev, vision_2030: { ...prev.vision_2030, [field]: val } }));
  };

  const activeTabDef = TABS.find((t) => t.id === activeTab) || TABS[0];

  if (loading) {
    return (
      <AdminLayout title={{ ar: "محتوى صفحة من نحن", en: "About Us Content CMS" }}>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={{ ar: "محتوى صفحة من نحن", en: "About Us Content CMS" }}>
      <Helmet>
        <title>{isRTL ? "إدارة محتوى من نحن | لوحة التحكم" : "About Us CMS | Admin"}</title>
      </Helmet>

      <div className="space-y-6 pb-16" dir={isRTL ? "rtl" : "ltr"}>
        {/* Top Control Bar */}
        <div className="rounded-2xl border border-border/70 bg-card p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <Building2 className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-black text-foreground truncate">
                  {isRTL ? "إدارة محتوى صفحة من نحن" : "About Us Content Management"}
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 line-clamp-1 sm:line-clamp-none">
                  {isRTL
                    ? "تعديل جميع أقسام صفحة من نحن مع دعم كامل للغتين ومزامنة لحظية"
                    : "Manage all sections of About Us page with bilingual support and live sync"}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                size="sm"
                onClick={() => handleSaveSection(activeTab)}
                disabled={savingSection === activeTab}
                className="h-9 w-full sm:w-auto gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm px-4"
              >
                {savingSection === activeTab ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                <span className="truncate">{isRTL ? `حفظ قسم ${activeTabDef.ar}` : `Save ${activeTabDef.en}`}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* ── TABS BAR (Modern Touch-Scrollable Strip, Phosphorescent Active Pill) ── */}
        <div className="relative">
          <div
            ref={tabsContainerRef}
            className="no-scrollbar flex items-center gap-2 overflow-x-auto scroll-smooth py-1 px-1 -mx-1 sm:mx-0 overscroll-x-contain touch-pan-x select-none"
          >
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  data-tab={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs font-bold whitespace-nowrap transition-all duration-200 select-none ${
                    isActive
                      ? "bg-[#bbf438] text-[#062c19] dark:bg-[#c6ff00] dark:text-[#062c19] shadow-md shadow-lime-500/25 ring-2 ring-lime-400 font-black scale-[1.02]"
                      : "border border-border/80 bg-card text-foreground/85 hover:bg-muted hover:text-foreground hover:border-border font-semibold shadow-2xs"
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 transition-colors ${isActive ? "text-[#062c19]" : "text-muted-foreground"}`} />
                  <span>{isRTL ? tab.ar : tab.en}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* 1. HERO TAB */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {activeTab === "hero" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Arabic Card (Starts on the right in RTL!) */}
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-border pb-2.5">
                  <span className="font-extrabold text-sm text-primary flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    {isRTL ? "نصوص الهيرو (عربي)" : "Hero Content (Arabic)"}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-semibold">عربي (أساسي)</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">{isRTL ? "الشارة الرسمية" : "Badge"}</label>
                  <Input
                    value={data.hero.badge_ar || ""}
                    onChange={(e) => updateHero("badge_ar", e.target.value)}
                    placeholder="مؤسسة مشهرة برقم 2665 سنة 2019 – وزارة التضامن الاجتماعي"
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">{isRTL ? "العنوان الرئيسي" : "Main Title"}</label>
                  <Input
                    value={data.hero.title_ar || ""}
                    onChange={(e) => updateHero("title_ar", e.target.value)}
                    placeholder="مؤسسة اليسر الخيرية"
                    className="rounded-xl font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">{isRTL ? "الوصف التعريفي" : "Description"}</label>
                  <Textarea
                    value={data.hero.description_ar || ""}
                    onChange={(e) => updateHero("description_ar", e.target.value)}
                    rows={4}
                    placeholder="مؤسسة غير ربحية تم إنشاؤها عام 2019..."
                    className="rounded-xl resize-none text-xs sm:text-sm leading-relaxed"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {isRTL ? "الاقتباس الملهم" : "Quote"}
                  </label>
                  <Input
                    value={data.hero.quote_ar || ""}
                    onChange={(e) => updateHero("quote_ar", e.target.value)}
                    placeholder="تبرعك يترك أثرًا ويغير حياة"
                    className="rounded-xl font-semibold text-emerald-600 dark:text-emerald-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">{isRTL ? "نص زر التبرع" : "Donate CTA"}</label>
                    <Input
                      value={data.hero.donate_label_ar || "تبرع الآن"}
                      onChange={(e) => updateHero("donate_label_ar", e.target.value)}
                      className="rounded-xl text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">{isRTL ? "نص زر القصة" : "Story CTA"}</label>
                    <Input
                      value={data.hero.story_label_ar || "اعرف قصتنا"}
                      onChange={(e) => updateHero("story_label_ar", e.target.value)}
                      className="rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* English Card (Starts on the left in RTL!) */}
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-border pb-2.5">
                  <span className="font-extrabold text-sm text-primary flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                    {isRTL ? "نصوص الهيرو (إنجليزي)" : "Hero Content (English)"}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-semibold">English</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Top Badge</label>
                  <Input
                    value={data.hero.badge_en || ""}
                    onChange={(e) => updateHero("badge_en", e.target.value)}
                    placeholder="Registered NGO No. 2665 (2019) – Ministry of Social Solidarity"
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Main Title</label>
                  <Input
                    value={data.hero.title_en || ""}
                    onChange={(e) => updateHero("title_en", e.target.value)}
                    placeholder="Al Yusr Charity Foundation"
                    className="rounded-xl font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Description</label>
                  <Textarea
                    value={data.hero.description_en || ""}
                    onChange={(e) => updateHero("description_en", e.target.value)}
                    rows={4}
                    placeholder="Non-profit foundation established in 2019..."
                    className="rounded-xl resize-none text-xs sm:text-sm leading-relaxed"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-blue-600 dark:text-blue-400">Inspiring Quote</label>
                  <Input
                    value={data.hero.quote_en || ""}
                    onChange={(e) => updateHero("quote_en", e.target.value)}
                    placeholder="Your donation leaves an impact and changes lives"
                    className="rounded-xl font-semibold text-blue-600 dark:text-blue-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Donate CTA</label>
                    <Input
                      value={data.hero.donate_label_en || "Donate Now"}
                      onChange={(e) => updateHero("donate_label_en", e.target.value)}
                      className="rounded-xl text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Story CTA</label>
                    <Input
                      value={data.hero.story_label_en || "Our Story"}
                      onChange={(e) => updateHero("story_label_en", e.target.value)}
                      className="rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Official Registration Number */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <span className="font-extrabold text-sm text-primary flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  {isRTL ? "البيانات الرسمية والإشهار" : "Official Registration"}
                </span>
              </div>
              <div className="space-y-1.5 max-w-md">
                <label className="text-xs font-bold text-foreground">{isRTL ? "رقم الإشهار الرسمي" : "Registration Number"}</label>
                <Input
                  value={data.hero.registration_number || "2665/2019"}
                  onChange={(e) => updateHero("registration_number", e.target.value)}
                  placeholder="2665/2019"
                  className="rounded-xl"
                />
              </div>
            </div>

            {/* Dedicated Hero Image Uploader with Compression & Preview */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-xs">
              <div className="border-b border-border pb-3">
                <span className="font-extrabold text-sm text-primary flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-emerald-600" />
                  {isRTL ? "صورة الهيرو التعريفية (رفع، ضغط وحفظ)" : "Hero Media & Photo (Upload, Compress & Save)"}
                </span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isRTL
                    ? "الصورة الرئيسية التي تظهر بجانب النص التعريفي في أعلى صفحة من نحن"
                    : "The main photo displayed beside the intro text at the top of About Us"}
                </p>
              </div>

              <div className="flex flex-col gap-4">
                {/* 1. Row 1: Image Preview Box — Full width, prominent and clear */}
                <div className="relative h-64 sm:h-72 md:h-80 w-full overflow-hidden rounded-2xl border-2 border-emerald-500/30 bg-muted shadow-sm group">
                  <img
                    src={data.hero.image ? resolveStorageUrl(data.hero.image) : aboutHero}
                    alt={isRTL ? "معاينة صورة الهيرو" : "Hero Preview"}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (target.src !== aboutHero) {
                        target.src = aboutHero;
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-3 start-4 end-4 flex items-center justify-between text-white text-xs font-bold">
                    <span className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                      {data.hero.image ? (isRTL ? "صورة مخصصة مرفوعة" : "Custom Uploaded") : (isRTL ? "صورة افتراضية جاهزة" : "Default Asset")}
                    </span>
                    {data.hero.image && (
                      <a
                        href={resolveStorageUrl(data.hero.image)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs transition font-bold"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        {isRTL ? "عرض الصورة كاملة" : "Full view"}
                      </a>
                    )}
                  </div>
                </div>

                {/* 2. Row 2: Upload Controls, Reset, and Image Path Input */}
                <div className="rounded-xl border border-emerald-500/25 bg-emerald-50/20 dark:bg-emerald-950/15 p-4 sm:p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-extrabold text-primary">
                        {isRTL ? "رفع صورة جديدة من جهازك" : "Upload new image from device"}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {isRTL ? "يتم ضغط الصورة تلقائياً في المتصفح ورفعها مباشرة للسيرفر" : "Auto-compressed in browser & saved to backend storage"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className={`cursor-pointer inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm transition shrink-0 ${uploadingHero ? "opacity-75 pointer-events-none" : ""}`}>
                        {uploadingHero ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>{isRTL ? "جارٍ الضغط والرفع..." : "Compressing & uploading..."}</span>
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4" />
                            <span>{isRTL ? "اختر صورة للرفع" : "Choose Image"}</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/jpg"
                          className="hidden"
                          disabled={uploadingHero}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleUploadHeroImage(f);
                            e.target.value = "";
                          }}
                        />
                      </label>

                      {data.hero.image && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            updateHero("image", "");
                            setUploadCompressionRatio(null);
                            toast.info(isRTL ? "تم الرجوع للصورة الافتراضية" : "Reset to default image");
                          }}
                          className="text-xs rounded-xl h-10 px-4 text-muted-foreground hover:text-destructive hover:bg-destructive/10 border-border"
                        >
                          <RotateCcw className="h-3.5 w-3.5 me-1" />
                          {isRTL ? "افتراضي" : "Reset"}
                        </Button>
                      )}
                    </div>
                  </div>

                  {uploadCompressionRatio !== null && (
                    <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-3.5 py-2 rounded-xl border border-emerald-500/20">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>{isRTL ? `تم ضغط الصورة بنجاح وتقليص الحجم بنسبة ${uploadCompressionRatio}%` : `Auto-compressed with ${uploadCompressionRatio}% size reduction`}</span>
                    </div>
                  )}

                  {/* Manual URL / Path Input with Copy */}
                  <div className="space-y-1.5 pt-3 border-t border-emerald-500/20">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-foreground">
                        {isRTL ? "رابط / مسار الصورة الفعلي" : "Current Image Path/URL"}
                      </label>
                      {data.hero.image && (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(resolveStorageUrl(data.hero.image || ""));
                            toast.success(isRTL ? "تم نسخ الرابط" : "Copied URL");
                          }}
                          className="text-xs font-bold text-emerald-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          {isRTL ? "نسخ الرابط" : "Copy URL"}
                        </button>
                      )}
                    </div>
                    <Input
                      value={data.hero.image || ""}
                      onChange={(e) => updateHero("image", e.target.value)}
                      placeholder="https://elyusr-api.pyramedx.com/storage/gallery/..."
                      dir="ltr"
                      className="rounded-xl font-mono text-xs text-left bg-background h-10"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      {isRTL
                        ? "يمكنك لصق رابط مباشر للصورة، أو الضغط على زر الرفع بالأعلى ليتم أخذ المسار تلقائياً وحفظه."
                        : "You can paste a direct URL or use the upload button above to automatically set the path."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* 2. STATS TAB */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {activeTab === "stats" && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/40 p-4 rounded-2xl border border-border/70">
              <div>
                <h3 className="text-sm font-extrabold text-foreground">{isRTL ? "إحصائيات وأرقام الأثر" : "Impact Numbers & Statistics"}</h3>
                <p className="text-xs text-muted-foreground">{isRTL ? "الأرقام الإجمالية التي تظهر في بطاقات صفحة من نحن" : "Key metrics displayed in about us stats cards"}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newStat: AboutUsStatItem = { number: "100+", title_ar: "بند جديد", title_en: "New Stat" };
                  setData((prev) => ({ ...prev, stats: [...(Array.isArray(prev.stats) ? prev.stats : []), newStat] }));
                }}
                className="gap-1.5 rounded-xl text-xs font-bold"
              >
                <Plus className="h-4 w-4" />
                <span>{isRTL ? "إضافة إحصائية جديدة" : "Add New Stat"}</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-2xl border border-secondary/40 bg-secondary/5 p-4">
              <div className="sm:col-span-3">
                <h4 className="text-sm font-extrabold text-foreground">عنوان قسم «الإنجازات» في صفحة من نحن</h4>
                <p className="text-xs text-muted-foreground">
                  غيّر السنة كل سنة. لو سبت العنوان فاضي هيظهر «إنجازات السنة». كروت الأرقام نفسها بتتعدل من{" "}
                  <a href="/admin/site-stats" className="font-bold text-primary underline">إحصائيات الموقع ← الإنجازات</a>.
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">السنة</label>
                <Input type="number" min={2019} max={2100} dir="ltr" value={data.achievements?.year ?? ""} className="rounded-xl text-xs font-bold"
                  onChange={(e) => { const v = e.target.value; setData((prev) => ({ ...prev, achievements: { ...prev.achievements, year: v } })); }} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">السطر تحت الأرقام (عربي) — اختياري</label>
                <Input value={data.achievements?.title_ar || ""} placeholder={`إحصائيات عام ${data.achievements?.year || new Date().getFullYear()} — موثّقة بالميدان في المنصورة والدقهلية ومصر`} className="rounded-xl text-xs font-bold"
                  onChange={(e) => { const v = e.target.value; setData((prev) => ({ ...prev, achievements: { ...prev.achievements, title_ar: v } })); }} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Line under the numbers (EN) — optional</label>
                <Input dir="ltr" value={data.achievements?.title_en || ""} placeholder={`${data.achievements?.year || new Date().getFullYear()} Achievements`} className="rounded-xl text-xs font-bold"
                  onChange={(e) => { const v = e.target.value; setData((prev) => ({ ...prev, achievements: { ...prev.achievements, title_en: v } })); }} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.isArray(data.stats) &&
                data.stats.map((stat, idx) => (
                  <div key={idx} className="p-4 rounded-2xl border border-border/80 bg-card space-y-3 relative group shadow-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setData((prev) => ({
                          ...prev,
                          stats: prev.stats.filter((_, i) => i !== idx),
                        }));
                      }}
                      className="absolute top-3 end-3 text-muted-foreground hover:text-destructive p-1 rounded-lg transition hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{isRTL ? "الرقم" : "Number"}</label>
                        <Input
                          value={stat.number ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setData((prev) => {
                              const copy = [...prev.stats];
                              copy[idx] = { ...copy[idx], number: val };
                              return { ...prev, stats: copy };
                            });
                          }}
                          placeholder="1400"
                          className="rounded-xl font-black text-base"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-muted-foreground">{isRTL ? "الرمز / اللاحقة" : "Suffix (+, طن)"}</label>
                        <Input
                          value={stat.suffix ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setData((prev) => {
                              const copy = [...prev.stats];
                              copy[idx] = { ...copy[idx], suffix: val };
                              return { ...prev, stats: copy };
                            });
                          }}
                          placeholder="+"
                          className="rounded-xl font-bold text-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-foreground">{isRTL ? "العنوان (عربي)" : "Title (Arabic)"}</label>
                      <Input
                        value={stat.title_ar || stat.label_ar || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setData((prev) => {
                            const copy = [...prev.stats];
                            copy[idx] = { ...copy[idx], title_ar: val, label_ar: val };
                            return { ...prev, stats: copy };
                          });
                        }}
                        placeholder="كرتونة رمضان"
                        className="rounded-xl text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-foreground">{isRTL ? "العنوان (إنجليزي)" : "Title (English)"}</label>
                      <Input
                        value={stat.title_en || stat.label_en || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setData((prev) => {
                            const copy = [...prev.stats];
                            copy[idx] = { ...copy[idx], title_en: val, label_en: val };
                            return { ...prev, stats: copy };
                          });
                        }}
                        placeholder="Ramadan Boxes"
                        className="rounded-xl text-xs"
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* 3. PROGRAMS TAB */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {activeTab === "programs" && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/40 p-4 rounded-2xl border border-border/70">
              <div>
                <h3 className="text-sm font-extrabold text-foreground">{isRTL ? "أنشطتنا الدائمة" : "Ongoing activities"}</h3>
                <p className="text-xs text-muted-foreground">{isRTL ? "الكروت اللي في قسم «أنشطتنا الدائمة» بصفحة من نحن — كل كارت بيفتح الصفحة اللي في «الرابط»." : "Cards of the «Our ongoing activities» section; each opens its link."}</p>
              </div>
              <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setData((prev) => ({ ...prev, programs: SUGGESTED_ACTIVITIES.map((a) => ({ ...a })) }));
                  toast.info("اتحمّلت 15 نشاط مقترح — راجعها وبعدين اضغط حفظ.");
                }}
                className="gap-1.5 rounded-xl text-xs font-bold"
              >
                <Sparkles className="h-4 w-4" />
                <span>استخدام الأنشطة المقترحة (15)</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newProg: AboutUsProgramItem = {
                    title_ar: "",
                    title_en: "",
                    description_ar: "",
                    description_en: "",
                    icon: "Heart",
                    href: "/programs",
                  };
                  setData((prev) => ({ ...prev, programs: [...(Array.isArray(prev.programs) ? prev.programs : []), newProg] }));
                }}
                className="gap-1.5 rounded-xl text-xs font-bold"
              >
                <Plus className="h-4 w-4" />
                <span>{isRTL ? "إضافة نشاط" : "Add activity"}</span>
              </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.isArray(data.programs) &&
                data.programs.map((prog, idx) => (
                  <div key={idx} className="p-4 rounded-2xl border border-border/80 bg-card space-y-3 relative group shadow-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setData((prev) => ({
                          ...prev,
                          programs: prev.programs.filter((_, i) => i !== idx),
                        }));
                      }}
                      className="absolute top-3 end-3 text-muted-foreground hover:text-destructive p-1 rounded-lg transition hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-foreground">{isRTL ? "اسم النشاط (عربي)" : "Activity name (Ar)"}</label>
                        <Input
                          value={prog.title_ar}
                          onChange={(e) => {
                            const val = e.target.value;
                            setData((prev) => {
                              const copy = [...prev.programs];
                              copy[idx] = { ...copy[idx], title_ar: val };
                              return { ...prev, programs: copy };
                            });
                          }}
                          className="rounded-xl text-xs font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-foreground">{isRTL ? "اسم النشاط (إنجليزي)" : "Activity name (En)"}</label>
                        <Input
                          value={prog.title_en || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setData((prev) => {
                              const copy = [...prev.programs];
                              copy[idx] = { ...copy[idx], title_en: val };
                              return { ...prev, programs: copy };
                            });
                          }}
                          className="rounded-xl text-xs font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <IconPick
                        value={prog.icon}
                        onChange={(v) => setData((prev) => {
                          const copy = [...prev.programs];
                          copy[idx] = { ...copy[idx], icon: v };
                          return { ...prev, programs: copy };
                        })}
                      />
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-foreground">الرابط (صفحة في الموقع)</label>
                        <Input
                          dir="ltr"
                          value={prog.href || ""}
                          placeholder="/programs/orphans"
                          onChange={(e) => {
                            const val = e.target.value.trim();
                            setData((prev) => {
                              const copy = [...prev.programs];
                              copy[idx] = { ...copy[idx], href: val };
                              return { ...prev, programs: copy };
                            });
                          }}
                          className="rounded-xl font-mono text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-foreground">{isRTL ? "الوصف (عربي)" : "Description (Ar)"}</label>
                      <Textarea
                        value={prog.description_ar || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setData((prev) => {
                            const copy = [...prev.programs];
                            copy[idx] = { ...copy[idx], description_ar: val };
                            return { ...prev, programs: copy };
                          });
                        }}
                        rows={2}
                        className="rounded-xl text-xs resize-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-foreground">{isRTL ? "الوصف (إنجليزي)" : "Description (En)"}</label>
                      <Textarea
                        value={prog.description_en || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setData((prev) => {
                            const copy = [...prev.programs];
                            copy[idx] = { ...copy[idx], description_en: val };
                            return { ...prev, programs: copy };
                          });
                        }}
                        rows={2}
                        className="rounded-xl text-xs resize-none"
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* 4. TRUST TAB */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {activeTab === "trust" && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/40 p-4 rounded-2xl border border-border/70">
              <div>
                <h3 className="text-sm font-extrabold text-foreground">{isRTL ? "الاعتمادات والموثوقية" : "Trust & Licenses"}</h3>
                <p className="text-xs text-muted-foreground">{isRTL ? "عناصر التراخيص والشفافية والتغطية القانونية" : "Legal licenses, external audit, and credibility points"}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newTrust: AboutUsTrustItem = {
                    title_ar: "بند اعتماد جديد",
                    title_en: "New Credibility Item",
                    description_ar: "تفاصيل الاعتماد",
                    description_en: "Details of credibility",
                    icon: "ShieldCheck",
                  };
                  setData((prev) => ({ ...prev, trust: [...(Array.isArray(prev.trust) ? prev.trust : []), newTrust] }));
                }}
                className="gap-1.5 rounded-xl text-xs font-bold"
              >
                <Plus className="h-4 w-4" />
                <span>{isRTL ? "إضافة اعتماد جديد" : "Add Trust Item"}</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.isArray(data.trust) &&
                data.trust.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-2xl border border-border/80 bg-card space-y-3 relative group shadow-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setData((prev) => ({
                          ...prev,
                          trust: prev.trust.filter((_, i) => i !== idx),
                        }));
                      }}
                      className="absolute top-3 end-3 text-muted-foreground hover:text-destructive p-1 rounded-lg transition hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-foreground">{isRTL ? "العنوان (عربي)" : "Title (Ar)"}</label>
                      <Input
                        value={item.title_ar}
                        onChange={(e) => {
                          const val = e.target.value;
                          setData((prev) => {
                            const copy = [...prev.trust];
                            copy[idx] = { ...copy[idx], title_ar: val };
                            return { ...prev, trust: copy };
                          });
                        }}
                        className="rounded-xl text-xs font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-foreground">{isRTL ? "العنوان (إنجليزي)" : "Title (En)"}</label>
                      <Input
                        value={item.title_en || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setData((prev) => {
                            const copy = [...prev.trust];
                            copy[idx] = { ...copy[idx], title_en: val };
                            return { ...prev, trust: copy };
                          });
                        }}
                        className="rounded-xl text-xs font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-foreground">{isRTL ? "الوصف (عربي)" : "Description (Ar)"}</label>
                      <Textarea
                        value={item.description_ar}
                        onChange={(e) => {
                          const val = e.target.value;
                          setData((prev) => {
                            const copy = [...prev.trust];
                            copy[idx] = { ...copy[idx], description_ar: val };
                            return { ...prev, trust: copy };
                          });
                        }}
                        rows={2}
                        className="rounded-xl text-xs resize-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-foreground">{isRTL ? "الوصف (إنجليزي)" : "Description (En)"}</label>
                      <Textarea
                        value={item.description_en || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setData((prev) => {
                            const copy = [...prev.trust];
                            copy[idx] = { ...copy[idx], description_en: val };
                            return { ...prev, trust: copy };
                          });
                        }}
                        rows={2}
                        className="rounded-xl text-xs resize-none"
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* 5. WHY US TAB */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {activeTab === "why-us" && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/40 p-4 rounded-2xl border border-border/70">
              <div>
                <h3 className="text-sm font-extrabold text-foreground">{isRTL ? "لماذا تثق بنا؟" : "Why Trust Us?"}</h3>
                <p className="text-xs text-muted-foreground">{isRTL ? "أسباب ثقة المتبرعين والجمهور في مؤسسة اليسر" : "Key differentiators that earn donors' trust"}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newItem: AboutUsWhyUsItem = {
                    title_ar: "",
                    title_en: "",
                    description_ar: "",
                    description_en: "",
                    icon: "CheckCircle2",
                  };
                  setData((prev) => ({ ...prev, why_us: [...(Array.isArray(prev.why_us) ? prev.why_us : []), newItem] }));
                }}
                className="gap-1.5 rounded-xl text-xs font-bold"
              >
                <Plus className="h-4 w-4" />
                <span>{isRTL ? "إضافة سبب جديد" : "Add Reason"}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setData((prev) => ({ ...prev, why_us: SUGGESTED_WHY_US.map((w) => ({ ...w })) }));
                  toast.info("اتحمّلت الأسباب المقترحة — راجعها وبعدين اضغط حفظ.");
                }}
                className="gap-1.5 rounded-xl text-xs font-bold"
              >
                <Sparkles className="h-4 w-4" />
                <span>استخدام المحتوى المقترح</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.isArray(data.why_us) &&
                data.why_us.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-2xl border border-border/80 bg-card space-y-3 relative group shadow-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setData((prev) => ({
                          ...prev,
                          why_us: prev.why_us.filter((_, i) => i !== idx),
                        }));
                      }}
                      className="absolute top-3 end-3 text-muted-foreground hover:text-destructive p-1 rounded-lg transition hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    <div className="w-1/2 pe-1">
                      <IconPick
                        value={item.icon}
                        onChange={(v) => setData((prev) => {
                          const copy = [...prev.why_us];
                          copy[idx] = { ...copy[idx], icon: v };
                          return { ...prev, why_us: copy };
                        })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-foreground">{isRTL ? "العنوان (عربي)" : "Title (Ar)"}</label>
                        <Input
                          value={item.title_ar}
                          onChange={(e) => {
                            const val = e.target.value;
                            setData((prev) => {
                              const copy = [...prev.why_us];
                              copy[idx] = { ...copy[idx], title_ar: val };
                              return { ...prev, why_us: copy };
                            });
                          }}
                          className="rounded-xl text-xs font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-foreground">{isRTL ? "العنوان (إنجليزي)" : "Title (En)"}</label>
                        <Input
                          value={item.title_en || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setData((prev) => {
                              const copy = [...prev.why_us];
                              copy[idx] = { ...copy[idx], title_en: val };
                              return { ...prev, why_us: copy };
                            });
                          }}
                          className="rounded-xl text-xs font-bold"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-foreground">{isRTL ? "الوصف (عربي)" : "Description (Ar)"}</label>
                      <Textarea
                        value={item.description_ar}
                        onChange={(e) => {
                          const val = e.target.value;
                          setData((prev) => {
                            const copy = [...prev.why_us];
                            copy[idx] = { ...copy[idx], description_ar: val };
                            return { ...prev, why_us: copy };
                          });
                        }}
                        rows={2}
                        className="rounded-xl text-xs resize-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-foreground">{isRTL ? "الوصف (إنجليزي)" : "Description (En)"}</label>
                      <Textarea
                        value={item.description_en || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setData((prev) => {
                            const copy = [...prev.why_us];
                            copy[idx] = { ...copy[idx], description_en: val };
                            return { ...prev, why_us: copy };
                          });
                        }}
                        rows={2}
                        className="rounded-xl text-xs resize-none"
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* 6. VALUES TAB */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {activeTab === "values" && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/40 p-4 rounded-2xl border border-border/70">
              <div>
                <h3 className="text-sm font-extrabold text-foreground">{isRTL ? "قيمنا المؤسسية" : "Our Core Values"}</h3>
                <p className="text-xs text-muted-foreground">{isRTL ? "القيم الجوهرية للعمل الإنساني في مؤسسة اليسر" : "Guiding principles of our humanitarian mission"}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newVal: AboutUsValueItem = {
                    title_ar: "قيمة جديدة",
                    title_en: "New Value",
                    description_ar: "وصف القيمة",
                    description_en: "Value description",
                    icon: "Heart",
                  };
                  setData((prev) => ({ ...prev, values: [...(Array.isArray(prev.values) ? prev.values : []), newVal] }));
                }}
                className="gap-1.5 rounded-xl text-xs font-bold"
              >
                <Plus className="h-4 w-4" />
                <span>{isRTL ? "إضافة قيمة جديدة" : "Add Value"}</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.isArray(data.values) &&
                data.values.map((val, idx) => (
                  <div key={idx} className="p-4 rounded-2xl border border-border/80 bg-card space-y-3 relative group shadow-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setData((prev) => ({
                          ...prev,
                          values: prev.values.filter((_, i) => i !== idx),
                        }));
                      }}
                      className="absolute top-3 end-3 text-muted-foreground hover:text-destructive p-1 rounded-lg transition hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-foreground">{isRTL ? "القيمة (عربي)" : "Value Name (Ar)"}</label>
                      <Input
                        value={val.title_ar}
                        onChange={(e) => {
                          const text = e.target.value;
                          setData((prev) => {
                            const copy = [...prev.values];
                            copy[idx] = { ...copy[idx], title_ar: text };
                            return { ...prev, values: copy };
                          });
                        }}
                        className="rounded-xl text-xs font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-foreground">{isRTL ? "القيمة (إنجليزي)" : "Value Name (En)"}</label>
                      <Input
                        value={val.title_en || ""}
                        onChange={(e) => {
                          const text = e.target.value;
                          setData((prev) => {
                            const copy = [...prev.values];
                            copy[idx] = { ...copy[idx], title_en: text };
                            return { ...prev, values: copy };
                          });
                        }}
                        className="rounded-xl text-xs font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-foreground">{isRTL ? "الوصف (عربي)" : "Description (Ar)"}</label>
                      <Textarea
                        value={val.description_ar}
                        onChange={(e) => {
                          const text = e.target.value;
                          setData((prev) => {
                            const copy = [...prev.values];
                            copy[idx] = { ...copy[idx], description_ar: text };
                            return { ...prev, values: copy };
                          });
                        }}
                        rows={2}
                        className="rounded-xl text-xs resize-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-foreground">{isRTL ? "الوصف (إنجليزي)" : "Description (En)"}</label>
                      <Textarea
                        value={val.description_en || ""}
                        onChange={(e) => {
                          const text = e.target.value;
                          setData((prev) => {
                            const copy = [...prev.values];
                            copy[idx] = { ...copy[idx], description_en: text };
                            return { ...prev, values: copy };
                          });
                        }}
                        rows={2}
                        className="rounded-xl text-xs resize-none"
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* 7. STORY TAB */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {activeTab === "story" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Arabic Card */}
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-border pb-2.5">
                  <span className="font-extrabold text-sm text-primary flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    {isRTL ? "القصة والرسالة (عربي)" : "Story & Mission (Arabic)"}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-semibold">عربي</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">{isRTL ? "عنوان القصة" : "Story Title"}</label>
                  <Input
                    value={data.story.title_ar || ""}
                    onChange={(e) => updateStory("title_ar", e.target.value)}
                    placeholder="قصتنا"
                    className="rounded-xl font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">{isRTL ? "نص القصة الكامل" : "Story Full Text"}</label>
                  <Textarea
                    value={data.story.description_ar || ""}
                    onChange={(e) => updateStory("description_ar", e.target.value)}
                    rows={6}
                    placeholder="بعد العمل لأكثر من عشر سنوات في العمل الخيري..."
                    className="rounded-xl resize-none text-xs sm:text-sm leading-relaxed"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{isRTL ? "الرسالة" : "Mission"}</label>
                  <Textarea
                    value={data.story.mission_ar || data.story.mission?.description_ar || ""}
                    onChange={(e) => updateStory("mission_ar", e.target.value)}
                    rows={3}
                    placeholder="بناء إنسان واعٍ جسديًا، نفسيًا وبصريًا..."
                    className="rounded-xl resize-none text-xs leading-relaxed"
                  />
                </div>
              </div>

              {/* English Card */}
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-border pb-2.5">
                  <span className="font-extrabold text-sm text-primary flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                    {isRTL ? "القصة والرسالة (إنجليزي)" : "Story & Mission (English)"}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-semibold">English</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Story Title</label>
                  <Input
                    value={data.story.title_en || ""}
                    onChange={(e) => updateStory("title_en", e.target.value)}
                    placeholder="Our Story"
                    className="rounded-xl font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Story Full Text</label>
                  <Textarea
                    value={data.story.description_en || ""}
                    onChange={(e) => updateStory("description_en", e.target.value)}
                    rows={6}
                    placeholder="After more than ten years of dedicated voluntary work..."
                    className="rounded-xl resize-none text-xs sm:text-sm leading-relaxed"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-blue-600 dark:text-blue-400">Mission</label>
                  <Textarea
                    value={data.story.mission_en || ""}
                    onChange={(e) => updateStory("mission_en", e.target.value)}
                    rows={3}
                    placeholder="We seek to create sustainable impact..."
                    className="rounded-xl resize-none text-xs leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* Official Banking & Legal Info */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <span className="font-extrabold text-sm text-primary flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-emerald-600" />
                  {isRTL ? "البيانات البنكية والقانونية" : "Banking & Legal Details"}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">{isRTL ? "اسم البنك والحساب" : "Bank Name & Account"}</label>
                  <Input
                    value={data.story.bank_name || "CIB"}
                    onChange={(e) => updateStory("bank_name", e.target.value)}
                    placeholder="CIB - حساب 100043605733"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">{isRTL ? "رقم الإشهار الرسمي" : "Registration Number"}</label>
                  <Input
                    value={data.story.registration_number || "2665/2019"}
                    onChange={(e) => updateStory("registration_number", e.target.value)}
                    placeholder="2665/2019"
                    className="rounded-xl"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* 8. VISION 2030 TAB */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {activeTab === "vision-2030" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Arabic Card */}
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-border pb-2.5">
                  <span className="font-extrabold text-sm text-primary flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    {isRTL ? "رؤية 2030 (عربي)" : "Vision 2030 (Arabic)"}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-semibold">عربي</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">{isRTL ? "عنوان الرؤية" : "Vision Title"}</label>
                  <Input
                    value={data.vision_2030.title_ar || ""}
                    onChange={(e) => updateVision("title_ar", e.target.value)}
                    placeholder="رؤيتنا لعام 2030"
                    className="rounded-xl font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">{isRTL ? "وصف المستهدفات" : "Vision Description"}</label>
                  <Textarea
                    value={data.vision_2030.description_ar || ""}
                    onChange={(e) => updateVision("description_ar", e.target.value)}
                    rows={4}
                    placeholder="مستهدفات طموحة للانتقال بالمجتمعات الأكثر احتياجًا..."
                    className="rounded-xl resize-none text-xs sm:text-sm leading-relaxed"
                  />
                </div>
              </div>

              {/* English Card */}
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-border pb-2.5">
                  <span className="font-extrabold text-sm text-primary flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                    {isRTL ? "رؤية 2030 (إنجليزي)" : "Vision 2030 (English)"}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-semibold">English</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Vision Title</label>
                  <Input
                    value={data.vision_2030.title_en || ""}
                    onChange={(e) => updateVision("title_en", e.target.value)}
                    placeholder="Our Vision 2030"
                    className="rounded-xl font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Vision Description</label>
                  <Textarea
                    value={data.vision_2030.description_en || ""}
                    onChange={(e) => updateVision("description_en", e.target.value)}
                    rows={4}
                    placeholder="Ambitious targets to transition underprivileged communities..."
                    className="rounded-xl resize-none text-xs sm:text-sm leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* Progress Percentage Control */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="font-extrabold text-sm text-primary flex items-center gap-2">
                  <Percent className="h-4 w-4 text-emerald-600" />
                  {isRTL ? "نسبة الإنجاز المحققة من رؤية 2030" : "Progress Achieved Towards 2030"}
                </span>
                <span className="text-sm font-black text-emerald-600 bg-emerald-500/12 px-3.5 py-1.5 rounded-full tabular-nums">
                  {data.vision_2030.progress}%
                </span>
              </div>

              {/* Row 1: Percentage input + inline mini bar */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  {isRTL ? "النسبة المئوية (%)" : "Percentage (%)"}
                </label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={data.vision_2030.progress || 0}
                    onChange={(e) => updateVision("progress", parseFloat(e.target.value) || 0)}
                    className="rounded-xl font-black text-base w-28 text-center"
                  />
                  <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, data.vision_2030.progress || 0))}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground font-semibold w-8 text-end tabular-nums">
                    {Math.round(data.vision_2030.progress || 0)}%
                  </span>
                </div>
              </div>

              {/* Row 2: Full-width progress bar preview */}
              <div className="space-y-2 pt-1">
                <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                  {isRTL ? "معاينة شريط الإنجاز الكامل" : "Full Progress Bar Preview"}
                </label>
                <div className="relative w-full h-6 bg-muted/60 rounded-full overflow-hidden border border-border/60">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-700 flex items-center justify-end pe-2"
                    style={{ width: `${Math.min(100, Math.max(2, data.vision_2030.progress || 0))}%` }}
                  >
                    {(data.vision_2030.progress || 0) >= 8 && (
                      <span className="text-[10px] font-black text-white tabular-nums">
                        {data.vision_2030.progress}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Vision 2030 Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-muted/40 p-3.5 rounded-2xl border border-border/60">
                <div>
                  <h4 className="text-sm font-extrabold text-foreground">{isRTL ? "مشاريع ومستهدفات الرؤية" : "Vision Key Projects"}</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{isRTL ? "المشاريع الكبرى المستهدفة لتحقيق رؤية 2030" : "Major projects targeted for Vision 2030"}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newItem: AboutUsVisionItem = {
                      title_ar: "مشروع جديد 2030",
                      title_en: "New 2030 Project",
                      description_ar: "وصف المشروع",
                      icon: "Target",
                    };
                    setData((prev) => ({
                      ...prev,
                      vision_2030: {
                        ...prev.vision_2030,
                        items: [...(Array.isArray(prev.vision_2030.items) ? prev.vision_2030.items : []), newItem],
                      },
                    }));
                  }}
                  className="gap-1.5 rounded-xl text-xs font-bold shrink-0"
                >
                  <Plus className="h-4 w-4" />
                  <span>{isRTL ? "إضافة مشروع" : "Add Project"}</span>
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {Array.isArray(data.vision_2030.items) &&
                  data.vision_2030.items.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-2xl border border-border/80 bg-card space-y-3 relative shadow-xs hover:border-emerald-500/30 transition-colors">
                      <button
                        type="button"
                        onClick={() => {
                          setData((prev) => ({
                            ...prev,
                            vision_2030: {
                              ...prev.vision_2030,
                              items: prev.vision_2030.items.filter((_, i) => i !== idx),
                            },
                          }));
                        }}
                        className="absolute top-3 end-3 text-muted-foreground hover:text-destructive p-1 rounded-lg transition hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>

                      <div className="flex items-center gap-2 pe-8">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 text-xs font-black">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-muted-foreground">
                          {isRTL ? "مشروع الرؤية" : "Vision Project"}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{isRTL ? "العنوان (عربي)" : "Title (Arabic)"}</label>
                        <Input
                          value={item.title_ar}
                          onChange={(e) => {
                            const text = e.target.value;
                            setData((prev) => {
                              const copy = [...prev.vision_2030.items];
                              copy[idx] = { ...copy[idx], title_ar: text };
                              return { ...prev, vision_2030: { ...prev.vision_2030, items: copy } };
                            });
                          }}
                          className="rounded-xl text-xs font-bold"
                          placeholder="اسم المشروع بالعربية"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-blue-600 dark:text-blue-400">{isRTL ? "العنوان (إنجليزي)" : "Title (English)"}</label>
                        <Input
                          value={item.title_en || ""}
                          onChange={(e) => {
                            const text = e.target.value;
                            setData((prev) => {
                              const copy = [...prev.vision_2030.items];
                              copy[idx] = { ...copy[idx], title_en: text };
                              return { ...prev, vision_2030: { ...prev.vision_2030, items: copy } };
                            });
                          }}
                          className="rounded-xl text-xs font-bold"
                          placeholder="Project name in English"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-foreground">{isRTL ? "الوصف" : "Description"}</label>
                        <Textarea
                          value={item.description_ar}
                          onChange={(e) => {
                            const text = e.target.value;
                            setData((prev) => {
                              const copy = [...prev.vision_2030.items];
                              copy[idx] = { ...copy[idx], description_ar: text };
                              return { ...prev, vision_2030: { ...prev.vision_2030, items: copy } };
                            });
                          }}
                          rows={2}
                          className="rounded-xl text-xs resize-none"
                          placeholder="وصف موجز للمشروع"
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>{/* end space-y-6 */}
    </AdminLayout>
  );
}
