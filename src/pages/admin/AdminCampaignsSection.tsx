import { useState, useMemo, useEffect } from "react";
import { FormSkeleton } from "@/components/common/ContentSkeletons";
import { formatNumberEN } from "@/lib/utils";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { programs } from "@/data/programs";
import { DONATION_ENTITIES, type DonationEntity } from "@/data/donationEntities";
import {
  useCampaignsSectionAdmin,
  type CarouselCard,
  type CarouselSourceType,
  type SectionWriteResult,
} from "@/data/campaignsSettings";
import { describeWriteError, BACKEND_PENDING_AR } from "@/data/api/backendPending";
import { useCampaignsMetrics } from "@/lib/campaignsMetrics";
import {
  programsApiV1,
  projectsApiV1,
  donationCampaignsApi,
  type LaravelProgram,
  type LaravelProject,
  type LaravelDonationCampaign,
} from "@/data/laravelApi";
import { useLang } from "@/i18n/LangContext";
import {
  ArrowUp,
  ArrowDown,
  MousePointerClick,
  Heart,
  TrendingUp,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  Sparkles,
  Layers,
  HelpCircle,
  Save,
  Loader2,
  AlertTriangle,
  Undo2,
} from "lucide-react";

const AdminCampaignsSection = () => {
  const {
    settings,
    dirty,
    loading: sectionLoading,
    sectionState,
    loadErrors,
    update,
    saveSettings,
    discardDraft,
    addCard,
    updateCard,
    deleteCard,
    moveCard,
    toggleCard,
  } = useCampaignsSectionAdmin();
  const [savingSettings, setSavingSettings] = useState(false);
  const [cardBusy, setCardBusy] = useState(false);

  const { metrics, reset: resetMetrics } = useCampaignsMetrics();
  const { lang } = useLang();
  const isAr = lang === "ar";

  // Backend programs, campaigns and projects
  const [backendPrograms, setBackendPrograms] = useState<LaravelProgram[]>([]);
  const [backendCampaigns, setBackendCampaigns] = useState<LaravelDonationCampaign[]>([]);
  const [backendProjects, setBackendProjects] = useState<LaravelProject[]>([]);

  useEffect(() => {
    void programsApiV1.listAll().then((res) => {
      if (Array.isArray(res)) setBackendPrograms(res);
    }).catch(() => {});

    void donationCampaignsApi.listAll().then((res) => {
      if (Array.isArray(res)) setBackendCampaigns(res);
    }).catch(() => {});

    void projectsApiV1.listAll().then((res) => {
      if (Array.isArray(res)) setBackendProjects(res);
    }).catch(() => {});
  }, []);

  // 1. Program options (Live Backend Programs as Primary Source of Truth)
  const programOptions = useMemo(() => {
    const list: Array<{ id: string; slug: string; name_ar: string; name_en: string; tagline_ar: string; tagline_en: string; image: string; priceFrom: number }> = [];
    const seen = new Set<string>();

    backendPrograms.forEach((p) => {
      const slug = p.slug || String(p.id);
      if (!seen.has(slug) && !seen.has(String(p.id))) {
        seen.add(slug);
        seen.add(String(p.id));
        list.push({
          id: String(p.id),
          slug,
          name_ar: p.title_ar || p.name_ar || p.name || "",
          name_en: p.title_en || p.name_en || "",
          tagline_ar: p.description_ar || p.tagline_ar || p.description || "",
          tagline_en: p.description_en || p.tagline_en || "",
          image: p.image || "/og-ar.jpg",
          priceFrom: Number(p.minimum_amount) || 100,
        });
      }
    });

    // Fallback if backend returned 0 programs
    if (list.length === 0) {
      DONATION_ENTITIES.filter((e) => e.entityType === "program").forEach((e) => {
        seen.add(e.id);
        list.push({
          id: e.id,
          slug: e.id,
          name_ar: e.ar,
          name_en: e.en,
          tagline_ar: e.taglineAr,
          tagline_en: e.taglineEn,
          image: e.image,
          priceFrom: e.priceFrom || 100,
        });
      });
    }

    return list;
  }, [backendPrograms]);

  // 2. Campaign options (Live Backend Donation Campaigns as Primary Source of Truth)
  const campaignOptions = useMemo(() => {
    const list: Array<{ id: string; slug: string; name_ar: string; name_en: string; tagline_ar: string; tagline_en: string; image: string; priceFrom: number }> = [];
    const seen = new Set<string>();

    backendCampaigns.forEach((c) => {
      const slug = c.slug || String(c.id);
      if (!seen.has(slug) && !seen.has(String(c.id))) {
        seen.add(slug);
        seen.add(String(c.id));
        list.push({
          id: String(c.id),
          slug,
          name_ar: c.name_ar || c.title_ar || c.name || "",
          name_en: c.name_en || c.title_en || "",
          tagline_ar: c.description_ar || c.subtitle_ar || c.description || "",
          tagline_en: c.description_en || c.subtitle_en || "",
          image: c.image || "/og-ar.jpg",
          priceFrom: Number(c.minimum_amount) || 100,
        });
      }
    });

    if (list.length === 0) {
      DONATION_ENTITIES.filter((e) => e.entityType === "campaign").forEach((e) => {
        seen.add(e.id);
        list.push({
          id: e.id,
          slug: e.id,
          name_ar: e.ar,
          name_en: e.en,
          tagline_ar: e.taglineAr,
          tagline_en: e.taglineEn,
          image: e.image,
          priceFrom: e.priceFrom || 100,
        });
      });
    }

    return list;
  }, [backendCampaigns]);

  // 3. Project options (Live Backend Projects as Primary Source of Truth)
  const projectOptions = useMemo(() => {
    const list: Array<{ id: string; slug: string; name_ar: string; name_en: string; tagline_ar: string; tagline_en: string; image: string; priceFrom: number }> = [];
    const seen = new Set<string>();

    backendProjects.forEach((prj) => {
      const slug = prj.slug || `project-${prj.id}`;
      if (!seen.has(slug) && !seen.has(String(prj.id))) {
        seen.add(slug);
        seen.add(String(prj.id));
        list.push({
          id: String(prj.id),
          slug,
          name_ar: prj.name_ar || prj.name || prj.title_ar || "",
          name_en: prj.name_en || prj.title_en || prj.name || "",
          tagline_ar: (prj as any).short_description || prj.description_ar || prj.description || "",
          tagline_en: (prj as any).short_description_en || prj.description_en || "",
          image: (prj as any).cover_image || prj.image || (prj as any).cover_image_url || "/og-ar.jpg",
          priceFrom: Number((prj as any).starting_price) || 200,
        });
      }
    });

    if (list.length === 0) {
      DONATION_ENTITIES.filter((e) => e.entityType === "project").forEach((e) => {
        seen.add(e.id);
        list.push({
          id: e.id,
          slug: e.id,
          name_ar: e.ar,
          name_en: e.en,
          tagline_ar: e.taglineAr,
          tagline_en: e.taglineEn,
          image: e.image,
          priceFrom: e.priceFrom || 200,
        });
      });
    }

    return list;
  }, [backendProjects]);

  /** Run a card write (awaited). Carousel failure = error toast; section (price/links) not saved = warning toast. */
  const runCardOp = async (op: () => Promise<SectionWriteResult | null>, okMsg: string, route: string): Promise<boolean> => {
    setCardBusy(true);
    try {
      const res = await op();
      if (res && !res.sectionSaved) {
        toast.warning(
          isAr ? `${okMsg} — لكن السعر ورابط التبرع ومصدر البطاقة لم تُحفظ` : `${okMsg}, but price / donate link / source were not saved`,
          { description: res.sectionError || BACKEND_PENDING_AR, duration: 10000 },
        );
      } else if (res) {
        toast.success(okMsg);
      }
      return true;
    } catch (e) {
      toast.error(isAr ? "لم يتم حفظ التغيير في قاعدة البيانات" : "Change not saved", { description: describeWriteError(e, route) });
      return false;
    } finally {
      setCardBusy(false);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await saveSettings();
      if (res.sectionSaved) {
        toast.success(isAr ? "تم حفظ إعدادات القسم في قاعدة البيانات" : "Section settings saved");
      } else {
        toast.warning(
          isAr
            ? "تم حفظ الإظهار والسرعة في الكاروسيل، لكن العناوين والمفاتيح الأخرى لم تُحفظ"
            : "Visibility and speed saved; titles and the other switches were not",
          { description: res.sectionError || BACKEND_PENDING_AR, duration: 10000 },
        );
      }
    } catch (e) {
      toast.error(isAr ? "لم يتم حفظ إعدادات القسم" : "Settings not saved", { description: describeWriteError(e, "PUT /admin/homepage/carousel/settings") });
    } finally {
      setSavingSettings(false);
    }
  };

  // Modal State for Add / Edit
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);

  const [formSourceType, setFormSourceType] = useState<CarouselSourceType>("program");
  const [formSourcePick, setFormSourcePick] = useState<string>("");

  const [formCard, setFormCard] = useState<{
    slug: string;
    name_ar: string;
    name_en: string;
    tagline_ar: string;
    tagline_en: string;
    image: string;
    priceFrom: number;
    detailsUrl: string;
    donateUrl: string;
    is_active: boolean;
  }>({
    slug: "",
    name_ar: "",
    name_en: "",
    tagline_ar: "",
    tagline_en: "",
    image: "",
    priceFrom: 100,
    detailsUrl: "/programs/general",
    donateUrl: "/donate?program=general",
    is_active: true,
  });

  const cards = settings.cards || [];
  const visibleCount = cards.filter((c) => c.is_active).length;
  const totalCount = cards.length;

  // Open modal for new card
  const handleOpenAdd = () => {
    setEditingCardId(null);
    setFormSourceType("program");
    setFormSourcePick("");
    setFormCard({
      slug: `custom-${Date.now()}`,
      name_ar: "",
      name_en: "",
      tagline_ar: "",
      tagline_en: "",
      image: "",
      priceFrom: 100,
      detailsUrl: "/programs/general",
      donateUrl: "/donate?program=general",
      is_active: true,
    });
    setCardModalOpen(true);
  };

  // Open modal for editing card
  const handleOpenEdit = (c: CarouselCard) => {
    setEditingCardId(c.id);
    setFormSourceType(c.sourceType || "custom");
    setFormSourcePick(String(c.sourceId || c.slug || ""));
    const fallbackDonate = `/donate?${c.sourceType === "campaign" ? "campaign" : c.sourceType === "project" ? "project" : "program"}=${encodeURIComponent(c.slug || "")}`;
    const fallbackDetails = c.sourceType === "project" ? `/projects/${c.slug}` : `/programs/${c.slug}`;

    setFormCard({
      slug: c.slug,
      name_ar: c.name_ar,
      name_en: c.name_en,
      tagline_ar: c.tagline_ar,
      tagline_en: c.tagline_en,
      image: c.image,
      priceFrom: c.priceFrom,
      detailsUrl: (c.detailsUrl && c.detailsUrl !== "/programs" && c.detailsUrl !== "/programs/") ? c.detailsUrl : fallbackDetails,
      donateUrl: (c.donateUrl && c.donateUrl !== "/donate" && c.donateUrl !== "/donate/") ? c.donateUrl : fallbackDonate,
      is_active: c.is_active,
    });
    setCardModalOpen(true);
  };

  // When picking a source item, auto-populate fields
  const handleSourceSelect = (val: string) => {
    setFormSourcePick(val);

    if (formSourceType === "program") {
      const p = programOptions.find((x) => x.slug === val || x.id === val);
      if (p) {
        setFormCard((prev) => ({
          ...prev,
          slug: p.slug,
          name_ar: p.name_ar,
          name_en: p.name_en,
          tagline_ar: p.tagline_ar,
          tagline_en: p.tagline_en,
          image: p.image,
          priceFrom: p.priceFrom || 100,
          detailsUrl: `/programs/${p.slug}`,
          donateUrl: `/donate?program=${encodeURIComponent(p.slug)}`,
        }));
      }
    } else if (formSourceType === "campaign") {
      const c = campaignOptions.find((x) => x.slug === val || x.id === val);
      if (c) {
        setFormCard((prev) => ({
          ...prev,
          slug: c.slug,
          name_ar: c.name_ar,
          name_en: c.name_en || c.name_ar,
          tagline_ar: c.tagline_ar,
          tagline_en: c.tagline_en || c.tagline_ar,
          image: c.image || "/og-ar.jpg",
          priceFrom: c.priceFrom || 100,
          detailsUrl: `/programs/${c.slug}`,
          donateUrl: `/donate?campaign=${encodeURIComponent(c.slug)}`,
        }));
      }
    } else if (formSourceType === "project") {
      const prj = projectOptions.find((x) => String(x.id) === val || x.slug === val);
      if (prj) {
        setFormCard((prev) => ({
          ...prev,
          slug: prj.slug,
          name_ar: prj.name_ar,
          name_en: prj.name_en || prj.name_ar,
          tagline_ar: prj.tagline_ar,
          tagline_en: prj.tagline_en || prj.tagline_ar,
          image: prj.image || "/og-ar.jpg",
          priceFrom: prj.priceFrom || 200,
          detailsUrl: `/projects/${prj.slug}`,
          donateUrl: `/donate?project=${encodeURIComponent(prj.slug)}`,
        }));
      }
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCard.name_ar.trim()) {
      toast.error(isAr ? "يرجى كتابة عنوان البطاقة" : "Card title is required");
      return;
    }

    let ok = false;
    if (editingCardId) {
      const id = editingCardId;
      ok = await runCardOp(() => updateCard(id, {
        sourceType: formSourceType,
        sourceId: formSourcePick,
        slug: formCard.slug,
        name_ar: formCard.name_ar,
        name_en: formCard.name_en || formCard.name_ar,
        tagline_ar: formCard.tagline_ar,
        tagline_en: formCard.tagline_en || formCard.tagline_ar,
        image: formCard.image || "/og-ar.jpg",
        priceFrom: Number(formCard.priceFrom) || 100,
        detailsUrl: formCard.detailsUrl || `/programs/${formCard.slug}`,
        donateUrl: (formCard.donateUrl && formCard.donateUrl !== "/donate" && formCard.donateUrl !== "/donate/")
          ? formCard.donateUrl
          : `/donate?${formSourceType === "campaign" ? "campaign" : formSourceType === "project" ? "project" : "program"}=${encodeURIComponent(formCard.slug || "")}`,
        is_active: formCard.is_active,
      }), isAr ? "تم تحديث البطاقة" : "Card updated", "PUT /admin/homepage/carousel/items/{id}");
    } else {
      ok = await runCardOp(() => addCard({
        sourceType: formSourceType,
        sourceId: formSourcePick,
        slug: formCard.slug || `card-${Date.now()}`,
        name_ar: formCard.name_ar,
        name_en: formCard.name_en || formCard.name_ar,
        tagline_ar: formCard.tagline_ar,
        tagline_en: formCard.tagline_en || formCard.tagline_ar,
        image: formCard.image || "/og-ar.jpg",
        priceFrom: Number(formCard.priceFrom) || 100,
        detailsUrl: formCard.detailsUrl || `/programs/${formCard.slug || ""}`,
        donateUrl: (formCard.donateUrl && formCard.donateUrl !== "/donate" && formCard.donateUrl !== "/donate/")
          ? formCard.donateUrl
          : `/donate?${formSourceType === "campaign" ? "campaign" : formSourceType === "project" ? "project" : "program"}=${encodeURIComponent(formCard.slug || "")}`,
        is_active: formCard.is_active,
      }), isAr ? "تمت إضافة البطاقة للكاروسيل" : "Card added to carousel", "POST /admin/homepage/carousel/items");
    }

    if (ok) setCardModalOpen(false);
  };

  // Until the server settings arrive, show a skeleton instead of the built-in defaults.
  if (sectionLoading) return <AdminLayout><FormSkeleton sections={3} /></AdminLayout>;

  return (
    <AdminLayout>
      <div
        dir={isAr ? "rtl" : "ltr"}
        className="w-full space-y-5 text-start [&_label]:block [&_label]:text-start"
      >
        {/* Page Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-foreground">
              {isAr ? "كاروسيل الرئيسية" : "Homepage Carousel"}
            </h1>
            <p className="text-xs text-muted-foreground font-semibold mt-0.5">
              {isAr ? "مؤسسة اليسر الخيرية — لوحة الإدارة" : "Al-Yusr Charity Foundation — Admin Panel"}
            </p>
          </div>

          <Button
            onClick={handleOpenAdd}
            className="rounded-xl font-bold gap-2 text-xs bg-primary text-primary-foreground shadow-sm hover:opacity-95"
          >
            <Plus className="h-4 w-4" />
            {isAr ? "إضافة بطاقة جديدة" : "Add New Card"}
          </Button>
        </header>

        <Tabs defaultValue="content" dir={isAr ? "rtl" : "ltr"} className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-xl bg-muted/60 p-1">
            <TabsTrigger value="content" className="rounded-lg font-bold">
              {isAr ? "محتوى القسم والبطاقات" : "Section Content & Cards"}
            </TabsTrigger>
            <TabsTrigger value="stats" className="rounded-lg font-bold">
              {isAr ? "إحصائيات التفاعل" : "Engagement Stats"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="mt-6 space-y-5">
            {(sectionState === "missing" || loadErrors.length > 0) && (
              <div className="flex items-start gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs text-amber-900 dark:text-amber-200">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <div className="space-y-1">
                  {sectionState === "missing" && (
                    <p>
                      <b>{BACKEND_PENDING_AR}:</b>{" "}
                      {isAr
                        ? "GET/PUT /homepage/campaigns-section غير موجود بعد. الإظهار والسرعة والبطاقات تُحفظ في الكاروسيل، أما العناوين وزر الدعوة والتمرير التفاعلي وزر التخطي وسعر/رابط كل بطاقة فلن تُحفظ حتى يُضاف."
                        : "GET/PUT /homepage/campaigns-section does not exist yet: titles, switches and card prices/links cannot be saved."}
                    </p>
                  )}
                  {loadErrors.map((e) => <p key={e}>{e}</p>)}
                </div>
              </div>
            )}

            {dirty && (
              <div className="sticky top-2 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-card/95 p-3 shadow-sm backdrop-blur">
                <span className="text-xs font-bold text-foreground">
                  {isAr ? "تعديلات غير محفوظة في إعدادات القسم (مسودة في هذه الصفحة فقط)" : "Unsaved section settings (draft on this page only)"}
                </span>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" className="h-8 gap-1 text-xs" onClick={discardDraft} disabled={savingSettings}>
                    <Undo2 className="h-3.5 w-3.5" />
                    {isAr ? "تجاهل" : "Discard"}
                  </Button>
                  <Button size="sm" className="h-8 gap-1.5 text-xs font-bold" onClick={() => void handleSaveSettings()} disabled={savingSettings}>
                    {savingSettings ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    {isAr ? "حفظ إعدادات القسم" : "Save section settings"}
                  </Button>
                </div>
              </div>
            )}

            {/* إعدادات العرض والسرعة — كامل العرض */}
            <section className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b pb-3">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <h2 className="text-base font-black text-foreground">
                    {isAr ? "إعدادات العرض والسرعة" : "Display & Speed Settings"}
                  </h2>
                </div>

                <div className="space-y-4 pt-1">
                  {/* Switch 1: إظهار قسم الكاروسيل */}
                  <div className="flex items-center justify-between gap-4 p-2.5 rounded-xl transition hover:bg-muted/20">
                    <div>
                      <Label className="text-sm font-bold text-foreground">
                        {isAr ? "إظهار قسم الكاروسيل" : "Show Carousel Section"}
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {isAr
                          ? "إخفاء أو إظهار قسم الحملات بالكامل على الصفحة الرئيسية."
                          : "Show or hide the campaigns carousel on the homepage."}
                      </p>
                    </div>
                    <Switch
                      checked={settings.enabled}
                      onCheckedChange={(v) => update({ enabled: v })}
                    />
                  </div>

                  {/* Switch 2: إظهار بطاقة الدعوة النهائية */}
                  <div className="flex items-center justify-between gap-4 p-2.5 rounded-xl transition hover:bg-muted/20">
                    <div>
                      <Label className="text-sm font-bold text-foreground">
                        {isAr ? "إظهار بطاقة الدعوة النهائية" : "Show Final CTA Card"}
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {isAr
                          ? "البطاقة الذهبية الختامية في نهاية الكاروسيل (تبرعك يصنع الفرق)."
                          : "Golden CTA card at the end of the carousel."}
                      </p>
                    </div>
                    <Switch
                      checked={settings.showFinalCta}
                      onCheckedChange={(v) => update({ showFinalCta: v })}
                    />
                  </div>

                  {/* Switch 3: تفعيل التمرير التفاعلي (ScrollTrigger) */}
                  <div className="flex items-center justify-between gap-4 p-2.5 rounded-xl transition hover:bg-muted/20">
                    <div>
                      <div className="flex items-center gap-2">
                        <Label className="text-sm font-bold text-foreground">
                          {isAr ? "تفعيل التمرير التفاعلي (ScrollTrigger)" : "Enable ScrollTrigger"}
                        </Label>
                        <span className="rounded-md bg-emerald-600/15 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                          {isAr ? "مثبت تفاعلي" : "Pinned"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {isAr
                          ? "عند التفعيل: تُثبت الشاشة وتمر البطاقات تدريجياً مع السكرول. عند الإيقاف: يعمل الكاروسيل عادي انسيابي (Auto-play) بدون تثبيت التمرير."
                          : "Pinned interactive horizontal scroll vs smooth autoplay strip."}
                      </p>
                    </div>
                    <Switch
                      checked={settings.enableScrollTrigger !== false}
                      onCheckedChange={(v) => update({ enableScrollTrigger: v })}
                    />
                  </div>

                  {/* Switch 4: إظهار زر التخطي */}
                  <div className="flex items-center justify-between gap-4 p-2.5 rounded-xl transition hover:bg-muted/20">
                    <div>
                      <Label className="text-sm font-bold text-foreground">
                        {isAr ? "إظهار زر التخطي (تخطي القسم)" : "Show Skip Button"}
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {isAr
                          ? "زر أنيق أسفل القسم يتيح للزائر تخطي تثبيت البطاقات والنزول فوراً للقسم التالي."
                          : "A skip button enabling visitors to jump past the pinned coverflow."}
                      </p>
                    </div>
                    <Switch
                      checked={settings.showSkipButton !== false}
                      onCheckedChange={(v) => update({ showSkipButton: v })}
                    />
                  </div>

                  {/* Slider: سرعة التمرير الأفقي */}
                  <div className="p-3 rounded-xl bg-muted/20 border border-border/60">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-bold text-foreground">
                          {isAr ? "سرعة التمرير الأفقي" : "Horizontal Scroll Speed"}
                        </Label>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {isAr
                            ? "القيم الأعلى = حركة أهدأ وأكثر سلاسة أثناء التمرير."
                            : "Higher values = longer scroll travel and calmer dwell."}
                        </p>
                      </div>
                      <span className="rounded-lg bg-emerald-600/10 px-2.5 py-1 font-mono text-xs font-black text-emerald-700 dark:text-emerald-400 border border-emerald-600/20">
                        {settings.scrollSpeed.toFixed(1)}x
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-4">
                      <Slider
                        dir={isAr ? "rtl" : "ltr"}
                        value={[settings.scrollSpeed]}
                        min={1}
                        max={4}
                        step={0.1}
                        onValueChange={([v]) => update({ scrollSpeed: v })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </section>

            {/* نصوص رأس القسم — كامل العرض */}
            <section className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b pb-3">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                <h2 className="text-base font-black text-foreground">
                  {isAr ? "نصوص رأس القسم (العنوان والوصف)" : "Section Header Copy"}
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <Label className="text-xs font-bold mb-1.5">{isAr ? "العنوان (عربي)" : "Title (Arabic)"}</Label>
                  <Input
                    dir="rtl"
                    value={settings.title?.ar ?? ""}
                    placeholder="حملات تصنع الأثر"
                    onChange={(e) => update({ title: { ar: e.target.value, en: settings.title?.en ?? "" } })}
                    className="rounded-xl bg-background"
                  />
                </div>

                <div>
                  <Label className="text-xs font-bold mb-1.5">Title (English)</Label>
                  <Input
                    dir="ltr"
                    value={settings.title?.en ?? ""}
                    placeholder="Campaigns that make impact"
                    onChange={(e) => update({ title: { ar: settings.title?.ar ?? "", en: e.target.value } })}
                    className="rounded-xl bg-background"
                  />
                </div>

                <div>
                  <Label className="text-xs font-bold mb-1.5">{isAr ? "الوصف (عربي)" : "Subtitle (Arabic)"}</Label>
                  <Input
                    dir="rtl"
                    value={settings.subtitle?.ar ?? ""}
                    placeholder="مرّر بهدوء، كل بطاقة قصة أثر حقيقية"
                    onChange={(e) => update({ subtitle: { ar: e.target.value, en: settings.subtitle?.en ?? "" } })}
                    className="rounded-xl bg-background"
                  />
                </div>

                <div>
                  <Label className="text-xs font-bold mb-1.5">Subtitle (English)</Label>
                  <Input
                    dir="ltr"
                    value={settings.subtitle?.en ?? ""}
                    placeholder="Scroll gently; every card is a real story of impact"
                    onChange={(e) => update({ subtitle: { ar: settings.subtitle?.ar ?? "", en: e.target.value } })}
                    className="rounded-xl bg-background"
                  />
                </div>
              </div>
            </section>

            {/* Bottom Section: البطاقات والبرامج المعروضة في الكاروسيل */}
            <section className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <h2 className="text-base font-black text-foreground">
                      {isAr ? "البطاقات والبرامج المعروضة في الكاروسيل" : "Displayed Cards & Programs"}
                    </h2>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isAr
                      ? "رتب البطاقات بالأسهم للأعلى والأسفل، وفعل أو عطل أي بطاقة من زر التبديل."
                      : "Reorder cards with arrows and toggle or edit each card."}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-emerald-600/10 border border-emerald-600/20 px-3 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-400">
                    {isAr ? "الظاهر حالياً:" : "Visible:"}{" "}
                    <bdi>{visibleCount} / {totalCount}</bdi>
                  </span>
                  <Button
                    onClick={handleOpenAdd}
                    size="sm"
                    className="rounded-xl font-bold gap-1.5 text-xs bg-primary text-primary-foreground"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {isAr ? "إضافة بطاقة" : "Add Card"}
                  </Button>
                </div>
              </div>

              {sectionLoading && cards.length === 0 && (
                <div className="flex items-center justify-center gap-2 py-8 text-xs text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isAr ? "جاري تحميل البطاقات من قاعدة البيانات..." : "Loading cards..."}
                </div>
              )}
              {!sectionLoading && cards.length === 0 && (
                <p className="py-8 text-center text-xs text-muted-foreground">
                  {isAr ? "لا توجد بطاقات في الكاروسيل بقاعدة البيانات." : "No carousel cards in the database."}
                </p>
              )}
              <ul className="space-y-2 pt-1">
                {cards.map((c, i) => {
                  const isVisible = c.is_active;
                  return (
                    <li
                      key={c.id}
                      className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${
                        !isVisible
                          ? "border-dashed border-border/80 bg-muted/20 opacity-60"
                          : "border-border bg-background shadow-2xs hover:border-primary/40"
                      }`}
                    >
                      {/* START side (RIGHT in RTL): Thumbnail + Title + Slug */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg overflow-hidden bg-muted shrink-0 border border-border">
                          <img
                            src={c.image || "/og-ar.jpg"}
                            alt=""
                            className={`h-full w-full object-cover ${!isVisible ? "grayscale" : ""}`}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="truncate font-black text-sm text-foreground">
                              {c.name_ar}
                            </div>
                            <span className="text-[10px] font-semibold text-muted-foreground px-2 py-0.5 rounded bg-muted shrink-0">
                              {c.sourceType === "program" ? (isAr ? "برنامج" : "Program")
                                : c.sourceType === "campaign" ? (isAr ? "حملة" : "Campaign")
                                : c.sourceType === "project" ? (isAr ? "مشروع" : "Project")
                                : (isAr ? "إعلان" : "Ad")}
                            </span>
                          </div>
                          <div className="truncate text-xs text-muted-foreground font-mono mt-0.5">
                            {c.slug}
                          </div>
                        </div>
                      </div>

                      {/* END side (LEFT in RTL): Reorder arrows + Edit/Delete + Switch */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={i === 0 || cardBusy}
                          onClick={() => void runCardOp(() => moveCard(c.id, -1), isAr ? "تم حفظ الترتيب" : "Order saved", "POST /admin/homepage/carousel/reorder")}
                          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                          title={isAr ? "تحريك لأعلى" : "Move up"}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={i === cards.length - 1 || cardBusy}
                          onClick={() => void runCardOp(() => moveCard(c.id, 1), isAr ? "تم حفظ الترتيب" : "Order saved", "POST /admin/homepage/carousel/reorder")}
                          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                          title={isAr ? "تحريك لأسفل" : "Move down"}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleOpenEdit(c)}
                          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary"
                          title={isAr ? "تعديل بيانات البطاقة" : "Edit card"}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={cardBusy}
                          onClick={() => {
                            if (!window.confirm(isAr ? `حذف البطاقة «${c.name_ar}» من الكاروسيل؟` : `Delete card "${c.name_en || c.name_ar}"?`)) return;
                            void runCardOp(() => deleteCard(c.id), isAr ? "تم حذف البطاقة" : "Card deleted", "DELETE /admin/homepage/carousel/items/{id}");
                          }}
                          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive"
                          title={isAr ? "حذف البطاقة" : "Delete card"}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        <Switch
                          checked={isVisible}
                          disabled={cardBusy}
                          onCheckedChange={() => void runCardOp(() => toggleCard(c.id), isAr ? "تم تغيير ظهور البطاقة" : "Card visibility changed", "PATCH /admin/homepage/carousel/items/{id}/toggle")}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats" className="mt-6 space-y-6">
            <section className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between gap-3 border-b pb-3">
                <div>
                  <h2 className="text-base font-black text-foreground">
                    {isAr ? "إحصائيات تفاعل الزوار" : "Visitor Interaction Stats"}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isAr
                      ? "عدّادات تفاعل الزوار مع بطاقات الكاروسيل على الصفحة الرئيسية."
                      : "Click counters and views on homepage carousel cards."}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    resetMetrics();
                    toast.success(isAr ? "تم تصفير العدادات" : "Counters Reset");
                  }}
                  className="rounded-xl font-bold text-xs gap-1.5"
                >
                  {isAr ? "تصفير السجلات" : "Reset Logs"}
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <StatTile
                  icon={TrendingUp}
                  label={isAr ? "مرات ظهور القسم" : "Section Views"}
                  value={metrics.sectionViews}
                />
                <StatTile
                  icon={MousePointerClick}
                  label={isAr ? "نقرات التفاصيل" : "Details Clicks"}
                  value={sum(metrics.bySlug, "details_click")}
                />
                <StatTile
                  icon={Heart}
                  label={isAr ? "نقرات التبرع المباشر" : "Donate Clicks"}
                  value={sum(metrics.bySlug, "donate_click")}
                />
              </div>

              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full min-w-[480px] text-sm">
                  <thead className="bg-muted/40">
                    <tr className="border-b border-border text-end text-xs font-bold text-muted-foreground">
                      <th className="py-2.5 px-3 text-start">{isAr ? "البطاقة / البرنامج" : "Card / Program"}</th>
                      <th className="py-2.5 px-3 text-center">{isAr ? "نقرات التفاصيل" : "Details"}</th>
                      <th className="py-2.5 px-3 text-center">{isAr ? "نقرات التبرع" : "Donate"}</th>
                      <th className="py-2.5 px-3 text-center">{isAr ? "الإجمالي" : "Total"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cards.map((c) => {
                      const m = metrics.bySlug[c.slug] || { details_click: 0, donate_click: 0 };
                      const total = (m.details_click || 0) + (m.donate_click || 0);
                      return (
                        <tr key={c.id} className="border-b border-border/60 hover:bg-muted/20">
                          <td className="py-2.5 px-3 font-semibold text-foreground text-start">
                            {c.name_ar}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono">{m.details_click}</td>
                          <td className="py-2.5 px-3 text-center font-mono">{m.donate_click}</td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-primary">{total}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </TabsContent>
        </Tabs>

        {/* ── Dialog: Add / Edit Carousel Card with 1-Click Source Selection ── */}
        <Dialog open={cardModalOpen} onOpenChange={setCardModalOpen}>
          <DialogContent className="max-w-lg" dir={isAr ? "rtl" : "ltr"}>
            <DialogHeader>
              <DialogTitle className="text-lg font-black text-primary">
                {editingCardId
                  ? (isAr ? "تعديل بطاقة الكاروسيل" : "Edit Carousel Card")
                  : (isAr ? "إضافة بطاقة جديدة للكاروسيل" : "Add New Carousel Card")}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {isAr
                  ? "اختر من البرامج أو الحملات أو المشاريع لجلب البيانات فوراً، أو أدخل بيانات إعلان مخصص."
                  : "Pick from programs, campaigns, projects, or create a custom ad card."}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleFormSubmit} className="space-y-4 pt-2">
              {/* Source Type Selector */}
              <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-muted/60 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => { setFormSourceType("program"); setFormSourcePick(""); }}
                  className={`py-1.5 rounded-lg transition ${formSourceType === "program" ? "bg-background shadow-xs text-primary" : "text-muted-foreground"}`}
                >
                  {isAr ? "برنامج" : "Program"}
                </button>
                <button
                  type="button"
                  onClick={() => { setFormSourceType("campaign"); setFormSourcePick(""); }}
                  className={`py-1.5 rounded-lg transition ${formSourceType === "campaign" ? "bg-background shadow-xs text-primary" : "text-muted-foreground"}`}
                >
                  {isAr ? "حملة" : "Campaign"}
                </button>
                <button
                  type="button"
                  onClick={() => { setFormSourceType("project"); setFormSourcePick(""); }}
                  className={`py-1.5 rounded-lg transition ${formSourceType === "project" ? "bg-background shadow-xs text-primary" : "text-muted-foreground"}`}
                >
                  {isAr ? "مشروع" : "Project"}
                </button>
                <button
                  type="button"
                  onClick={() => { setFormSourceType("custom"); setFormSourcePick(""); }}
                  className={`py-1.5 rounded-lg transition ${formSourceType === "custom" ? "bg-background shadow-xs text-primary" : "text-muted-foreground"}`}
                >
                  {isAr ? "إعلان مخصص" : "Custom Ad"}
                </button>
              </div>

              {/* Source Item Quick Dropdown */}
              {formSourceType === "program" && (
                <div>
                  <Label className="text-xs font-bold mb-1">
                    {isAr ? "اختر البرنامج لجلب بياناته تلقائياً:" : "Pick a program:"}
                  </Label>
                  <Select dir={isAr ? "rtl" : "ltr"} value={formSourcePick} onValueChange={handleSourceSelect}>
                    <SelectTrigger className="rounded-xl" dir={isAr ? "rtl" : "ltr"}>
                      <SelectValue placeholder={isAr ? "اختر برنامجاً..." : "Select program..."} />
                    </SelectTrigger>
                    <SelectContent dir={isAr ? "rtl" : "ltr"}>
                      {programOptions.map((p) => (
                        <SelectItem key={p.slug} value={p.slug} className="text-right">
                          {p.name_ar}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formSourceType === "campaign" && (
                <div>
                  <Label className="text-xs font-bold mb-1">
                    {isAr ? "اختر الحملة لجلب بياناتها تلقائياً:" : "Pick a campaign:"}
                  </Label>
                  <Select dir={isAr ? "rtl" : "ltr"} value={formSourcePick} onValueChange={handleSourceSelect}>
                    <SelectTrigger className="rounded-xl" dir={isAr ? "rtl" : "ltr"}>
                      <SelectValue placeholder={isAr ? "اختر حملة..." : "Select campaign..."} />
                    </SelectTrigger>
                    <SelectContent dir={isAr ? "rtl" : "ltr"}>
                      {campaignOptions.length === 0 ? (
                        <SelectItem value="none" disabled className="text-right">
                          {isAr ? "لا توجد حملات متاحة حالياً" : "No campaigns"}
                        </SelectItem>
                      ) : (
                        campaignOptions.map((c) => (
                          <SelectItem key={c.slug} value={c.slug} className="text-right">
                            {c.name_ar}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formSourceType === "project" && (
                <div>
                  <Label className="text-xs font-bold mb-1">
                    {isAr ? "اختر المشروع لجلب بياناته تلقائياً:" : "Pick a project:"}
                  </Label>
                  <Select dir={isAr ? "rtl" : "ltr"} value={formSourcePick} onValueChange={handleSourceSelect}>
                    <SelectTrigger className="rounded-xl" dir={isAr ? "rtl" : "ltr"}>
                      <SelectValue placeholder={isAr ? "اختر مشروعاً..." : "Select project..."} />
                    </SelectTrigger>
                    <SelectContent dir={isAr ? "rtl" : "ltr"}>
                      {projectOptions.length === 0 ? (
                        <SelectItem value="none" disabled className="text-right">
                          {isAr ? "لا توجد مشاريع متاحة حالياً" : "No projects"}
                        </SelectItem>
                      ) : (
                        projectOptions.map((prj) => (
                          <SelectItem key={prj.slug} value={prj.slug} className="text-right">
                            {prj.name_ar}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Title Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-bold mb-1">
                    {isAr ? "العنوان بالعربية *" : "Arabic Title *"}
                  </Label>
                  <Input
                    value={formCard.name_ar}
                    onChange={(e) => setFormCard({ ...formCard, name_ar: e.target.value })}
                    placeholder={isAr ? "مثال: سقيا الماء — المنصورة" : "Arabic Title"}
                    required
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold mb-1">
                    {isAr ? "العنوان بالإنجليزية" : "English Title"}
                  </Label>
                  <Input
                    value={formCard.name_en}
                    onChange={(e) => setFormCard({ ...formCard, name_en: e.target.value })}
                    placeholder="e.g. Clean Water Connections"
                    className="rounded-xl"
                  />
                </div>
              </div>

              {/* Description / Tagline */}
              <div>
                <Label className="text-xs font-bold mb-1">
                  {isAr ? "الوصف أو الشعار (عربي)" : "Arabic Tagline"}
                </Label>
                <Input
                  value={formCard.tagline_ar}
                  onChange={(e) => setFormCard({ ...formCard, tagline_ar: e.target.value })}
                  placeholder={isAr ? "اكتب شعاراً قصيراً للبطاقة..." : "Tagline..."}
                  className="rounded-xl"
                />
              </div>

              <div>
                <Label className="text-xs font-bold mb-1">
                  {isAr ? "الوصف أو الشعار (إنجليزي)" : "English Tagline"}
                </Label>
                <Input
                  value={formCard.tagline_en}
                  onChange={(e) => setFormCard({ ...formCard, tagline_en: e.target.value })}
                  placeholder="English tagline..."
                  className="rounded-xl"
                />
              </div>

              {/* Image URL & Starting Price */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <Label className="text-xs font-bold mb-1">
                    {isAr ? "رابط الصورة (Image URL)" : "Image URL"}
                  </Label>
                  <Input
                    value={formCard.image}
                    onChange={(e) => setFormCard({ ...formCard, image: e.target.value })}
                    placeholder="https://... أو /og-ar.jpg"
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold mb-1">
                    {isAr ? "السعر يبدأ من (ج.م)" : "Price From"}
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={formCard.priceFrom}
                    onChange={(e) => setFormCard({ ...formCard, priceFrom: Number(e.target.value) })}
                    className="rounded-xl font-mono"
                  />
                </div>
              </div>

              {/* Links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-bold mb-1">
                    {isAr ? "رابط التفاصيل (Details URL)" : "Details URL"}
                  </Label>
                  <Input
                    value={formCard.detailsUrl}
                    onChange={(e) => setFormCard({ ...formCard, detailsUrl: e.target.value })}
                    placeholder="/programs/water"
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold mb-1">
                    {isAr ? "رابط التبرع المباشر (Donate URL)" : "Donate URL"}
                  </Label>
                  <Input
                    value={formCard.donateUrl}
                    onChange={(e) => setFormCard({ ...formCard, donateUrl: e.target.value })}
                    placeholder="/donate?program=water"
                    className="rounded-xl"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border">
                <Label className="text-xs font-bold cursor-pointer">
                  {isAr ? "تفعيل البطاقة فوراً على الرئيسية" : "Activate Card Immediately"}
                </Label>
                <Switch
                  checked={formCard.is_active}
                  onCheckedChange={(v) => setFormCard({ ...formCard, is_active: v })}
                />
              </div>

              <DialogFooter className="gap-2 sm:gap-0 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCardModalOpen(false)}
                  className="rounded-xl font-bold text-xs"
                >
                  {isAr ? "إلغاء" : "Cancel"}
                </Button>
                <Button
                  type="submit"
                  className="rounded-xl font-bold text-xs bg-primary text-primary-foreground"
                >
                  {editingCardId
                    ? (isAr ? "حفظ التعديلات" : "Save Changes")
                    : (isAr ? "إضافة البطاقة" : "Add Card")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminCampaignsSection;

const StatTile = ({ icon: Icon, label, value }: { icon: typeof TrendingUp; label: string; value: number }) => (
  <div className="rounded-xl border border-border bg-background p-4 text-center">
    <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-muted-foreground">
      <Icon className="h-4 w-4 text-secondary" />
      {label}
    </div>
    <div className="mt-1 font-mono text-2xl font-black text-primary">{formatNumberEN(value)}</div>
  </div>
);

const sum = (
  bySlug: Record<string, { details_click: number; donate_click: number }>,
  key: "details_click" | "donate_click",
) => Object.values(bySlug).reduce((acc, r) => acc + (r?.[key] || 0), 0);