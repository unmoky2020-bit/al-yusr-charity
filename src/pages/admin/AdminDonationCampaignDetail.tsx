import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ExternalLink,
  Loader2,
  Save,
  Trash2,
  Plus,
  Tag,
  CheckCircle2,
  XCircle,
  Eye,
  Megaphone,
  X,
  Globe,
  Search,
  HelpCircle,
  Layers,
  MapPin,
  TrendingUp,
  RotateCcw,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ChoiceSelect, ImageUrlField } from "@/components/admin/programs/FormKit";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useLang } from "@/i18n/LangContext";
import { toast } from "@/hooks/use-toast";
import {
  donationCampaignsApi,
  donationCampaignCategoriesApi,
  type LaravelDonationCampaign,
  type LaravelDonationCampaignCategory,
} from "@/data/laravelApi";
import {
  donationCampaignsAdminApi,
  findIgnoredCampaignFields,
  parseJsonColumn,
  CAMPAIGN_FIELD_LABELS_AR,
  type CampaignPackage,
  type CampaignRecord,
  type CampaignSeo,
} from "@/data/api/donationCampaignsAdminApi";
import { BACKEND_PENDING_AR, describeWriteError } from "@/data/api/backendPending";
import { CampaignPackagesManager } from "@/components/admin/campaigns/CampaignPackagesManager";
import { DEFAULT_NEW_CAMPAIGN_PACKAGES, createPackagesForCampaign, sortPackages } from "@/components/admin/campaigns/packageHelpers";
import { getCampaignSeoPreset, type CampaignSeoData } from "@/data/campaignSeoStore";
import { EntityFaqManager } from "@/components/admin/faq/EntityFaqManager";
import { useQueryClient } from "@tanstack/react-query";
import { HeroPanel, HadithPanel, StatsPanel, SectionsPanel, CtaPanel, campaignSectionTabs, sectionKeysFor } from "@/components/admin/CampaignPageContentEditor";
import { getCampaignPageMetaForCampaign, mergeCampaignContent, type CampaignPageContent } from "@/data/campaignPages";
import { campaignPagesApi, contentFromCampaign, seoColumnFromForm, toCampaignColumns } from "@/data/campaignPages/api";
import { publicUrls } from "@/lib/publicUrls";

const EMPTY_SEO: CampaignSeoData = {
  meta_title_ar: "",
  meta_title_en: "",
  meta_description_ar: "",
  meta_description_en: "",
  focus_keywords_ar: "",
  focus_keywords_en: "",
  canonical_url: "",
  noindex: false,
  nofollow: false,
};

/** SEO form <- `seo` column (or a landing page's saved seo). Blank fields keep the given fallback. */
const seoFormFromColumn = (se: CampaignSeo, fallback: CampaignSeoData): CampaignSeoData => ({
  ...fallback,
  meta_title_ar: se.title?.ar || fallback.meta_title_ar,
  meta_title_en: se.title?.en || fallback.meta_title_en,
  meta_description_ar: se.description?.ar || fallback.meta_description_ar,
  meta_description_en: se.description?.en || fallback.meta_description_en,
  focus_keywords_ar: se.keywords?.ar || fallback.focus_keywords_ar,
  focus_keywords_en: se.keywords?.en || fallback.focus_keywords_en,
  canonical_url: se.canonical ?? fallback.canonical_url,
  noindex: se.noindex ?? fallback.noindex,
  nofollow: se.nofollow ?? fallback.nofollow,
});



export default function AdminDonationCampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { lang } = useLang();
  const isAr = lang === "ar";
  const isNew = id === "new";

  const [campaign, setCampaign] = useState<Partial<CampaignRecord> | null>(null);
  const [categories, setCategories] = useState<LaravelDonationCampaignCategory[]>([]);
  const [packages, setPackages] = useState<CampaignPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  /** Fields the backend did not keep on the last save (shown as a persistent banner, not only a toast). */
  const [backendWarnings, setBackendWarnings] = useState<string[]>([]);

  // SEO State (initial value: saved `seo` column > hard-coded preset > generated from the name)
  const [seoData, setSeoData] = useState<CampaignSeoData>(EMPTY_SEO);
  const [seoPreviewLang, setSeoPreviewLang] = useState<"ar" | "en">("ar");

  // Landing page content (hero / hadith / sections / CTA). Saved on the campaign record as `page_content`
  // together with `seo` and `faqs` (PUT /donation-campaigns/{id}). Prices are the donation packages.
  const queryClient = useQueryClient();
  const [pageContent, setPageContent] = useState<CampaignPageContent | null>(null);
  /** One tab per landing section (families like areas_now/areas_before share the parent's tab). */
  const sectionTabs = useMemo(() => (pageContent ? campaignSectionTabs(pageContent) : []), [pageContent]);
  const [pageHasOverride, setPageHasOverride] = useState(false);
  const [pageSource, setPageSource] = useState<"campaign" | "legacy" | null>(null);
  const [pageSeoSaved, setPageSeoSaved] = useState(false);
  const seoInitialRef = useRef<string>("");
  const pageMeta = useMemo(() => getCampaignPageMetaForCampaign(campaign), [campaign?.slug, campaign?.id, campaign?.name_ar]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Landing content: the campaign's own columns first; the legacy `/content` item is read ONLY when the record has
   * no content (old saves). A new campaign whose slug matches a landing page starts from that page's defaults.
   */
  const loadPageContent = async (loaded: Partial<CampaignRecord>, opts?: { isNew?: boolean }) => {
    const meta = getCampaignPageMetaForCampaign(loaded);
    if (!meta) { setPageContent(null); setPageHasOverride(false); setPageSource(null); return; }
    try {
      const defaults = await meta.load();
      let saved = opts?.isNew ? null : contentFromCampaign(loaded);
      let source: "campaign" | "legacy" | null = saved ? "campaign" : null;
      if (!saved && !opts?.isNew) {
        const legacy = await campaignPagesApi.loadLegacy(meta.slug, { fresh: true });
        saved = legacy.content;
        source = saved ? "legacy" : null;
      }
      const merged = mergeCampaignContent(defaults, saved);
      setPageContent(merged);
      setPageHasOverride(!!saved);
      setPageSource(source);
      // SEO tab: a saved landing SEO (legacy) wins over presets when the record has no `seo` yet
      if (saved?.seo && merged.seo && !parseJsonColumn<CampaignSeo>(loaded.seo)) {
        const se = merged.seo;
        setPageSeoSaved(true);
        setSeoData((prev) => {
          const next = seoFormFromColumn(se, prev);
          seoInitialRef.current = JSON.stringify(next);
          return next;
        });
      }
    } catch (e: unknown) {
      toast({
        title: isAr ? "تعذر تحميل محتوى صفحة الهبوط" : "Could not load landing content",
        description: (e as Error)?.message,
        variant: "destructive",
      });
    }
  };

  // A NEW campaign whose slug matches a landing page gets that page's editable content (saved on create).
  useEffect(() => {
    if (!isNew || !campaign) return;
    if (pageMeta && !pageContent) void loadPageContent(campaign, { isNew: true });
    if (!pageMeta && pageContent) setPageContent(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew, pageMeta?.slug]);

  // Benefits editing
  const [benefitText, setBenefitText] = useState("");

  const initSeo = (loaded: Partial<CampaignRecord>) => {
    const preset = getCampaignSeoPreset(loaded.slug || loaded.name_ar || "");
    const generated: CampaignSeoData = {
      ...EMPTY_SEO,
      meta_title_ar: loaded.name_ar ? `${loaded.name_ar} | مؤسسة اليسر الخيرية` : "",
      meta_title_en: loaded.name_en || loaded.name_ar ? `${loaded.name_en || loaded.name_ar} | Al-Yusr Charity Foundation` : "",
      meta_description_ar: loaded.description_ar || "",
      meta_description_en: loaded.description_en || "",
      focus_keywords_ar: loaded.name_ar || "",
      focus_keywords_en: loaded.name_en || "",
      canonical_url: loaded.slug ? `https://elyusr.org/campaigns/${loaded.slug}` : "",
    };
    const fallback = preset ? { ...generated, ...preset } : generated;
    const saved = parseJsonColumn<CampaignSeo>(loaded.seo);
    const next = saved ? seoFormFromColumn(saved, fallback) : fallback;
    setSeoData(next);
    setPageSeoSaved(!!saved);
    seoInitialRef.current = JSON.stringify(next);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Categories: only what the backend has (no invented ids).
      const catsRes = await donationCampaignCategoriesApi.listAll().catch(() => [] as LaravelDonationCampaignCategory[]);
      const catsList = Array.isArray(catsRes) ? catsRes : [];
      setCategories(catsList);

      if (isNew) {
        const draft: Partial<CampaignRecord> = {
          id: "new",
          category_id: catsList[0]?.id ? Number(catsList[0].id) : null,
          name_ar: "",
          name_en: "",
          slug: `campaign-${Date.now().toString(36)}`,
          subtitle_ar: "",
          subtitle_en: "",
          description_ar: "",
          description_en: "",
          image: "",
          target_amount: 100000,
          minimum_amount: 100,
          collected_amount: 0,
          donation_available: true,
          is_active: true,
          sort_order: 1,
          benefits: [],
        };
        setCampaign(draft);
        // Default packages of a new campaign: created on the backend right after the campaign (see handleSave).
        setPackages(DEFAULT_NEW_CAMPAIGN_PACKAGES.map((p) => ({ ...p })));
        setSeoData(EMPTY_SEO);
        seoInitialRef.current = JSON.stringify(EMPTY_SEO);
        setPageSeoSaved(false);
        setPageContent(null);
        setPageHasOverride(false);
        setPageSource(null);
        setLoading(false);
        return;
      }

      // Existing campaign (fresh read: the dashboard must see what the backend really stored)
      let loaded: CampaignRecord | null = null;
      try {
        loaded = await donationCampaignsAdminApi.get(id!, { fresh: true });
      } catch {
        // Lists leave out landing content unless asked (?include=content).
        const all = await donationCampaignsApi.listAll({ include: "content" }, { useCache: false }).catch(() => [] as LaravelDonationCampaign[]);
        loaded = (all.find((c) => String(c.id) === id || c.slug === id) as CampaignRecord | undefined) || null;
      }

      if (!loaded) {
        toast({
          title: isAr ? "تعذّر العثور على الحملة في قاعدة البيانات" : "Campaign not found in database",
          variant: "destructive",
        });
        navigate("/admin/donation-campaigns");
        return;
      }

      setCampaign({ ...loaded, category_id: loaded.category_id ?? loaded.category?.id ?? null } as Partial<CampaignRecord>);
      // Packages: exactly what the backend returned (empty list = empty state, no invented packages).
      setPackages(sortPackages(loaded.donation_packages));
      initSeo(loaded);

      await loadPageContent(loaded);
    } catch (err: unknown) {
      toast({
        title: isAr ? "خطأ في تحميل الحملة" : "Error loading campaign",
        description: (err as Error)?.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const updateField = (field: keyof CampaignRecord, value: unknown) => {
    setCampaign((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleAddBenefit = () => {
    if (!benefitText.trim() || !campaign) return;
    const current = Array.isArray(campaign.benefits) ? [...campaign.benefits] : [];
    current.push(benefitText.trim());
    updateField("benefits", current);
    setBenefitText("");
  };

  const handleRemoveBenefit = (index: number) => {
    if (!campaign) return;
    const current = Array.isArray(campaign.benefits) ? [...campaign.benefits] : [];
    current.splice(index, 1);
    updateField("benefits", current);
  };

  /** `page_content` / `seo` / `faqs` for the campaign PUT/POST. `null`s when resetting to the code defaults. */
  const buildContentColumns = (reset: boolean): Record<string, unknown> => {
    if (reset) return { page_content: null, seo: null, faqs: null };
    const out: Record<string, unknown> = {};
    // SEO is stored only once the admin edited it (or it was saved before); otherwise the landing page keeps its
    // hand-written static meta.
    if (pageSeoSaved || JSON.stringify(seoData) !== seoInitialRef.current) out.seo = seoColumnFromForm(seoData);
    if (pageMeta && pageContent) out.page_content = toCampaignColumns(pageContent).page_content;
    return out;
  };

  /** Re-read the campaign and list what the backend dropped from what we sent. */
  const verifySaved = async (campaignId: number | string, sent: Record<string, unknown>): Promise<string[]> => {
    const fresh = await donationCampaignsAdminApi.get(campaignId, { fresh: true });
    const ignored = findIgnoredCampaignFields(sent, fresh as unknown as Record<string, unknown>);
    for (const k of ["page_content", "seo", "faqs"]) {
      if (k in sent && !Object.prototype.hasOwnProperty.call(fresh, k)) ignored.push(k);
    }
    return ignored;
  };

  const handleSave = async (opts?: { resetContent?: boolean }) => {
    const resetContent = !!opts?.resetContent;
    if (!campaign || !campaign.name_ar?.trim()) {
      toast({
        title: isAr ? "يرجى إدخال اسم الحملة بالعربية" : "Please enter Arabic campaign name",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name_ar: campaign.name_ar.trim(),
        name_en: campaign.name_en?.trim() || campaign.name_ar.trim(),
        slug: campaign.slug?.trim() || campaign.name_ar.trim().toLowerCase().replace(/\s+/g, "-"),
        subtitle_ar: campaign.subtitle_ar?.trim() || null,
        subtitle_en: campaign.subtitle_en?.trim() || null,
        description_ar: campaign.description_ar?.trim() || campaign.name_ar.trim(),
        description_en: campaign.description_en?.trim() || null,
        target_amount: Number(campaign.target_amount || 0),
        collected_amount: Number(campaign.collected_amount || 0),
        minimum_amount: Number(campaign.minimum_amount || 50),
        donation_available: campaign.donation_available !== false,
        is_active: campaign.is_active !== false,
        sort_order: Number(campaign.sort_order || 1),
        benefits: Array.isArray(campaign.benefits) ? campaign.benefits : [],
        ...buildContentColumns(resetContent),
      };
      if (campaign.category_id !== undefined && campaign.category_id !== null && String(campaign.category_id) !== "") {
        payload.category_id = Number(campaign.category_id);
      }
      // Cover image: a link (uploads go to the media library first; the backend accepts file or link).
      payload.image = campaign.image ? campaign.image : null;

      if (isNew) {
        const res = (await donationCampaignsApi.create(payload as Partial<LaravelDonationCampaign>)) as CampaignRecord;
        const newId = res?.id;
        if (newId === undefined || newId === null || String(newId) === "") {
          throw new Error(isAr ? "الخادم لم يرجع رقم الحملة الجديدة" : "Server returned no campaign id");
        }
        // Default/draft packages are created on the new campaign one by one.
        const { created, failed } = await createPackagesForCampaign(newId, packages);
        const warnings: string[] = [];
        try {
          warnings.push(...(await verifySaved(newId, payload)).map((k) => CAMPAIGN_FIELD_LABELS_AR[k] || k));
        } catch { /* verification is best effort */ }
        if (failed.length) warnings.push(...failed.map((f) => `باقة «${f.name}»: ${f.error}`));
        setBackendWarnings(warnings);
        toast({
          title: isAr ? `تم إنشاء الحملة (#${newId}) و${created.length} باقة` : `Campaign #${newId} created with ${created.length} packages`,
          description: warnings.length ? (isAr ? `لم يُحفظ: ${warnings.join("، ")}` : `Not saved: ${warnings.join(", ")}`) : undefined,
          variant: warnings.length ? "destructive" : undefined,
        });
        navigate(`/admin/donation-campaigns/${newId}`);
        return;
      }

      if (campaign.id === undefined || campaign.id === null) return;
      await donationCampaignsApi.update(campaign.id, payload as Partial<LaravelDonationCampaign>);

      // The PUT returned 2xx: check what the backend really kept.
      let ignored: string[] = [];
      try {
        ignored = await verifySaved(campaign.id, payload);
      } catch { /* verification is best effort */ }
      if (resetContent && pageMeta) {
        try {
          await campaignPagesApi.clearLegacy(pageMeta.slug);
        } catch (e) {
          ignored.push(`مسح النسخة القديمة من /content: ${describeWriteError(e)}`);
        }
      }
      if (pageMeta) await queryClient.invalidateQueries({ queryKey: ["campaign-page", pageMeta.slug] });

      const labels = ignored.map((k) => CAMPAIGN_FIELD_LABELS_AR[k] || k);
      setBackendWarnings(labels);
      if (labels.length) {
        toast({
          title: isAr ? "تم حفظ بيانات الحملة الأساسية، لكن الباك إند تجاهل بعض الحقول" : "Campaign saved, but the backend ignored some fields",
          description: `${labels.join("، ")} — ${BACKEND_PENDING_AR}`,
          variant: "destructive",
        });
      } else {
        toast({ title: resetContent ? (isAr ? "تمت إعادة صفحة الحملة للافتراضي" : "Landing page reset") : (isAr ? "تم حفظ الحملة بنجاح" : "Campaign saved successfully") });
      }
      await loadData();
    } catch (err: unknown) {
      toast({
        title: isAr ? "فشل حفظ الحملة" : "Failed to save campaign",
        description: describeWriteError(err, "PUT /donation-campaigns/{id}"),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const resetPageContent = async () => {
    if (!pageMeta || !campaign || isNew) return;
    if (!window.confirm(isAr ? "إرجاع صفحة الحملة إلى نصوصها الافتراضية؟ سيُحذف المحتوى المخصص (بما فيه الأسئلة والسيو المحفوظة) من قاعدة البيانات." : "Restore the landing page to its default texts? Saved custom content (incl. FAQs and SEO) will be removed.")) return;
    await handleSave({ resetContent: true });
  };

  const handleDelete = async () => {
    if (!campaign || isNew) return;
    if (!confirm(isAr ? `هل أنت متأكد من حذف حملة «${campaign.name_ar}»؟` : `Delete campaign "${campaign.name_ar}"?`)) return;

    try {
      if (campaign.id && !String(campaign.id).startsWith("static-")) {
        await donationCampaignsApi.remove(campaign.id);
      }
      toast({ title: isAr ? "تم حذف الحملة" : "Campaign deleted" });
      navigate("/admin/donation-campaigns");
    } catch (err: any) {
      toast({
        title: isAr ? "فشل الحذف" : "Delete failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  if (loading || !campaign) {
    return (
      <AdminLayout title={{ ar: "تفاصيل الحملة", en: "Campaign Details" }}>
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">{isAr ? "جاري تحميل تفاصيل الحملة..." : "Loading campaign..."}</p>
        </div>
      </AdminLayout>
    );
  }

  const target = Number(campaign.target_amount || 0);
  const collected = Number(campaign.collected_amount || 0);
  const pct = target > 0 ? Math.min(100, Math.round((collected / target) * 100)) : 0;
  const previewHref = publicUrls.donationCampaign(campaign);

  return (
    <AdminLayout
      title={{
        ar: isNew ? "إنشاء حملة تبرع جديدة" : `تعديل: ${campaign.name_ar || "حملة"}`,
        en: isNew ? "Create Donation Campaign" : `Edit: ${campaign.name_en || campaign.name_ar || "Campaign"}`,
      }}
    >
      <div className="space-y-5 text-start" dir={isAr ? "rtl" : "ltr"}>
        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin/donation-campaigns">
                <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-secondary/15 px-2 py-0.5 text-xs font-bold text-secondary">
                  {isNew ? (isAr ? "حملة جديدة" : "New") : `#${campaign.id}`}
                </span>
                <span
                  className={`rounded-md px-2 py-0.5 text-xs font-bold text-white ${
                    campaign.is_active !== false ? "bg-emerald-600" : "bg-muted-foreground"
                  }`}
                >
                  {campaign.is_active !== false ? (isAr ? "نشطة" : "Active") : (isAr ? "معطلة" : "Inactive")}
                </span>
              </div>
              <h1 className="mt-1 text-lg font-black text-foreground">
                {isNew ? (isAr ? "حملة تبرع جديدة" : "New Donation Campaign") : campaign.name_ar}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isNew && (
              <Button asChild variant="outline" size="sm" className="gap-1.5">
                <a href={previewHref} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  {isAr ? "معاينة الواجهة" : "Preview"}
                </a>
              </Button>
            )}

            {!isNew && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                title={isAr ? "حذف الحملة" : "Delete"}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}

            <Button
              onClick={() => void handleSave()}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 shadow-sm"
              size="sm"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isAr ? "حفظ التغييرات" : "Save Changes"}
            </Button>
          </div>
        </div>

        {/* Progress Card (For Existing Campaigns) */}
        {!isNew && target > 0 && (
          <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-soft">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-muted-foreground">{isAr ? "نسبة إنجاز الحملة والتغطية" : "Campaign Progress"}</span>
              <span className="font-bold text-foreground">
                {collected.toLocaleString("en-US")} / {target.toLocaleString("en-US")} ج.م ({pct}%)
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-primary transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}

        {backendWarnings.length > 0 && (
          <div className="flex items-start justify-between gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs text-amber-900 dark:text-amber-200">
            <div className="space-y-1">
              <p className="font-black">
                {isAr ? `آخر حفظ: الباك إند لم يحتفظ بالحقول التالية (${BACKEND_PENDING_AR})` : "Last save: the backend did not keep these fields"}
              </p>
              <ul className="list-disc ps-5 space-y-0.5">
                {backendWarnings.map((w) => <li key={w}>{w}</li>)}
              </ul>
              <p className="text-[11px] opacity-80">
                {isAr ? "التفاصيل للمطور في backend-handoff/05-campaigns-seasons-section.md" : "Details: backend-handoff/05-campaigns-seasons-section.md"}
              </p>
            </div>
            <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setBackendWarnings([])}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Main Tabs Container */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-soft">
          <Tabs defaultValue="basics" dir={isAr ? "rtl" : "ltr"}>
            <TabsList className="flex w-full flex-wrap justify-start gap-1 mb-4 h-auto p-1.5 bg-muted/60">
              <TabsTrigger value="basics" className="text-xs font-bold py-2">{isAr ? "البيانات الأساسية" : "Basics"}</TabsTrigger>
              <TabsTrigger value="financials" className="text-xs font-bold py-2">{isAr ? "التبرع والأهداف" : "Financials"}</TabsTrigger>
              <TabsTrigger value="benefits" className="text-xs font-bold py-2">{isAr ? "المحاور والمزايا" : "Pillars"}</TabsTrigger>
              <TabsTrigger value="packages" className="text-xs font-bold py-2">{isAr ? "باقات التبرع" : "Packages"}</TabsTrigger>
              {pageMeta && (
                <>
                  <TabsTrigger value="hero" className="text-xs font-bold py-2">{isAr ? "الهيرو" : "Hero"}</TabsTrigger>
                  <TabsTrigger value="hadith" className="text-xs font-bold py-2">{isAr ? "الحديث" : "Hadith"}</TabsTrigger>
                  {!!pageContent?.stats.length && (
                    <TabsTrigger value="stats" className="text-xs font-bold py-2 gap-1.5">
                      <span>{isAr ? "الأرقام" : "Figures"}</span>
                      <span className="rounded-full bg-muted-foreground/15 text-[10px] px-1.5 font-mono font-black">{pageContent.stats.length}</span>
                    </TabsTrigger>
                  )}
                  {sectionTabs.map((t) => (
                    <TabsTrigger key={t.id} value={`sec-${t.id}`} className="text-xs font-bold py-2">
                      {(isAr ? t.label.ar : t.label.en || t.label.ar) || t.id}
                    </TabsTrigger>
                  ))}
                  <TabsTrigger value="cta" className="text-xs font-bold py-2">{isAr ? "الختام" : "Closing"}</TabsTrigger>
                </>
              )}
              <TabsTrigger value="seo" className="text-xs font-bold py-2 gap-1.5">
                <Globe className="h-3.5 w-3.5 text-blue-500" />
                <span>{isAr ? "السيو والـ Meta" : "SEO & Meta"}</span>
              </TabsTrigger>
              <TabsTrigger value="faqs" className="text-xs font-bold py-2 gap-1.5">
                <HelpCircle className="h-3.5 w-3.5 text-amber-500" />
                <span>{isAr ? "الأسئلة الشائعة" : "FAQs"}</span>
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Basics */}
            <TabsContent value="basics" className="space-y-4 pt-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="mb-1.5 block text-xs font-bold text-foreground">
                    {isAr ? "اسم الحملة (بالعربية) *" : "Campaign Name (Arabic) *"}
                  </Label>
                  <Input
                    dir="rtl"
                    value={campaign.name_ar || ""}
                    onChange={(e) => updateField("name_ar", e.target.value)}
                    placeholder="مثال: سقيا الماء وتوصيل خطوط الشرب"
                  />
                </div>

                <div>
                  <Label className="mb-1.5 block text-xs font-bold text-foreground">
                    {isAr ? "اسم الحملة (بالإنجليزية)" : "Campaign Name (English)"}
                  </Label>
                  <Input
                    dir="ltr"
                    value={campaign.name_en || ""}
                    onChange={(e) => updateField("name_en", e.target.value)}
                    placeholder="Clean Water & Piping Support"
                  />
                </div>

                <div>
                  <Label className="mb-1.5 block text-xs font-bold text-foreground">
                    {isAr ? "المعرّف الرابط (Slug)" : "Slug"}
                  </Label>
                  <Input
                    dir="ltr"
                    value={campaign.slug || ""}
                    onChange={(e) => updateField("slug", e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                    placeholder="water-piping"
                  />
                </div>

                <div>
                  <Label className="mb-1.5 block text-xs font-bold text-foreground">
                    {isAr ? "التصنيف / الفئة" : "Category"}
                  </Label>
                  <ChoiceSelect value={campaign.category_id != null ? String(campaign.category_id) : ""}
                    onChange={(v) => updateField("category_id", v ? Number(v) : null)}
                    noneLabel={categories.length ? (isAr ? "— بدون تصنيف —" : "— No category —") : (isAr ? "لا توجد تصنيفات في قاعدة البيانات" : "No categories in the database")}
                    options={categories.map((cat) => ({ value: String(cat.id), label: isAr ? cat.name_ar : (cat.name_en || cat.name_ar) }))} />
                </div>

                <div>
                  <Label className="mb-1.5 block text-xs font-bold text-foreground">
                    {isAr ? "الشعار الفرعي (عربي)" : "Subtitle / Tagline (Arabic)"}
                  </Label>
                  <Input
                    dir="rtl"
                    value={campaign.subtitle_ar || ""}
                    onChange={(e) => updateField("subtitle_ar", e.target.value)}
                    placeholder="شريان حياة لكل بيت محروم"
                  />
                </div>

                <div>
                  <Label className="mb-1.5 block text-xs font-bold text-foreground">
                    {isAr ? "الشعار الفرعي (إنجليزي)" : "Subtitle / Tagline (English)"}
                  </Label>
                  <Input
                    dir="ltr"
                    value={campaign.subtitle_en || ""}
                    onChange={(e) => updateField("subtitle_en", e.target.value)}
                    placeholder="Lifeline for every needy home"
                  />
                </div>

                <div className="sm:col-span-2">
                  <ImageUrlField label={isAr ? "صورة الغلاف" : "Cover image"} value={campaign.image || ""} aspect="wide" collection="campaigns"
                    onChange={(v) => updateField("image", v)}
                    hint={isAr ? "بتظهر في كارت الحملة وأعلى صفحتها. ارفع صورة أو الصق رابطها." : undefined} />
                </div>

                <div className="sm:col-span-2">
                  <Label className="mb-1.5 block text-xs font-bold text-foreground">
                    {isAr ? "الوصف التفصيلي (عربي)" : "Detailed Description (Arabic)"}
                  </Label>
                  <Textarea
                    dir="rtl"
                    rows={4}
                    value={campaign.description_ar || ""}
                    onChange={(e) => updateField("description_ar", e.target.value)}
                    placeholder="شرح أهداف الحملة والمستفيدين منها..."
                  />
                </div>

                <div className="sm:col-span-2">
                  <Label className="mb-1.5 block text-xs font-bold text-foreground">
                    {isAr ? "الوصف التفصيلي (إنجليزي)" : "Detailed Description (English)"}
                  </Label>
                  <Textarea
                    dir="ltr"
                    rows={4}
                    value={campaign.description_en || ""}
                    onChange={(e) => updateField("description_en", e.target.value)}
                    placeholder="Campaign details, impact and beneficiaries in English..."
                  />
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: Financials & Settings */}
            <TabsContent value="financials" className="space-y-4 pt-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="mb-1.5 block text-xs font-bold text-foreground">
                    {isAr ? "المبلغ المستهدف (ج.م)" : "Target Amount (EGP)"}
                  </Label>
                  <Input
                    dir="ltr"
                    type="number"
                    value={campaign.target_amount ?? ""}
                    onChange={(e) => updateField("target_amount", Number(e.target.value))}
                  />
                </div>

                <div>
                  <Label className="mb-1.5 block text-xs font-bold text-foreground">
                    {isAr ? "أقل مبلغ للتبرع (ج.م)" : "Minimum Donation Amount (EGP)"}
                  </Label>
                  <Input
                    dir="ltr"
                    type="number"
                    value={campaign.minimum_amount ?? ""}
                    onChange={(e) => updateField("minimum_amount", Number(e.target.value))}
                  />
                </div>

                <div>
                  <Label className="mb-1.5 block text-xs font-bold text-foreground">
                    {isAr ? "المبلغ المحصل حالياً (ج.م)" : "Collected Amount (EGP)"}
                  </Label>
                  <Input
                    dir="ltr"
                    type="number"
                    value={campaign.collected_amount ?? ""}
                    onChange={(e) => updateField("collected_amount", Number(e.target.value))}
                  />
                </div>

                <div>
                  <Label className="mb-1.5 block text-xs font-bold text-foreground">
                    {isAr ? "ترتيب الظهور في الموقع" : "Sort Order"}
                  </Label>
                  <Input
                    dir="ltr"
                    type="number"
                    value={campaign.sort_order ?? 1}
                    onChange={(e) => updateField("sort_order", Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="mt-4 grid gap-3 rounded-xl border border-border/80 bg-muted/20 p-4 sm:grid-cols-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-foreground">{isAr ? "حالة النشاط" : "Active Status"}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {isAr ? "إظهار أو إخفاء الحملة بالكامل من الموقع" : "Show or hide campaign from website"}
                    </p>
                  </div>
                  <Switch
                    checked={campaign.is_active !== false}
                    onCheckedChange={(checked) => updateField("is_active", checked)}
                  />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-foreground">{isAr ? "إتاحة التبرع الفوري" : "Accept Donations"}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {isAr ? "تمكين سلة وبوابة الدفع لهذه الحملة" : "Enable checkout for this campaign"}
                    </p>
                  </div>
                  <Switch
                    checked={campaign.donation_available !== false}
                    onCheckedChange={(checked) => updateField("donation_available", checked)}
                  />
                </div>
              </div>
            </TabsContent>

            {/* TAB 3: Benefits & Pillars */}
            <TabsContent value="benefits" className="space-y-4 pt-2">
              <div>
                <Label className="mb-1.5 block text-xs font-bold text-foreground">
                  {isAr ? "إضافة محور أو ميزة للحملة" : "Add Campaign Pillar / Benefit"}
                </Label>
                <div className="flex gap-2">
                  <Input
                    dir="rtl"
                    value={benefitText}
                    onChange={(e) => setBenefitText(e.target.value)}
                    placeholder="مثال: توصيل مياه نقية صالحة للشرب بطول 2500 متر"
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddBenefit())}
                  />
                  <Button onClick={handleAddBenefit} className="bg-primary text-primary-foreground font-bold shrink-0">
                    <Plus className="h-4 w-4 me-1" />
                    {isAr ? "إضافة" : "Add"}
                  </Button>
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <p className="text-xs font-bold text-muted-foreground">
                  {isAr ? "المحاور المسجلة حالياً:" : "Current Pillars:"}
                </p>
                {(!campaign.benefits || campaign.benefits.length === 0) ? (
                  <p className="text-xs text-muted-foreground/60 italic py-4 text-center">
                    {isAr ? "لا توجد مزايا مدخلة بعد. اكتب ميزة واضغط إضافة." : "No pillars added yet."}
                  </p>
                ) : (
                  campaign.benefits.map((b, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 rounded-xl border border-border/80 bg-muted/30 px-3 py-2 text-xs"
                    >
                      <span className="font-semibold text-foreground flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        {b}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveBenefit(idx)}
                        className="h-7 w-7 p-0 text-destructive/80 hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            {/* TAB 4: Donation Packages (live: each change goes straight to the backend) */}
            <TabsContent value="packages" className="space-y-4 pt-2">
              <CampaignPackagesManager
                campaignId={isNew ? null : (campaign.id ?? null)}
                packages={packages}
                onChange={(next) => {
                  setPackages(next);
                  if (pageMeta) void queryClient.invalidateQueries({ queryKey: ["campaign-packages", pageMeta.slug] });
                }}
                isAr={isAr}
                priceKeys={(pageContent?.prices || []).map((p) => ({ id: p.id, label: p.label }))}
              />
            </TabsContent>

            {/* Landing page content tabs (hero / hadith / figures / sections / closing). Prices come from donation packages. */}
            {pageMeta && (() => {
              const bar = (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl bg-emerald-500/10 p-3 border border-emerald-500/20">
                  <p className="text-xs text-muted-foreground">
                    {isAr
                      ? `صفحة الهبوط elyusr.org${pageMeta.path} — التصميم ثابت، والنصوص تتعدل من هنا وتُحفظ بزر «حفظ التغييرات» أعلى الصفحة. الأسعار تُقرأ من «باقات التبرع».`
                      : `Landing page elyusr.org${pageMeta.path}: layout is fixed; texts are edited here and saved with the main Save button. Prices come from "Donation packages".`}
                    {pageSource === "legacy" && (
                      <span className="mt-1 block font-bold text-amber-700 dark:text-amber-400">
                        {isAr
                          ? "المحتوى المعروض مقروء من النسخة القديمة (/content). عند الحفظ يُكتب في سجل الحملة (page_content)."
                          : "Showing content from the legacy /content item. Saving writes it to the campaign record (page_content)."}
                      </span>
                    )}
                  </p>
                  {pageHasOverride && !isNew && (
                    <Button type="button" variant="outline" size="sm" onClick={resetPageContent} className="shrink-0 text-xs font-bold text-destructive hover:text-destructive">
                      {isAr ? "إعادة نصوص الصفحة للافتراضي" : "Reset page texts to defaults"}
                    </Button>
                  )}
                </div>
              );
              const skeleton = <div className="h-40 animate-pulse rounded-2xl bg-muted" />;
              const panel = (P: typeof HeroPanel) => (pageContent ? <P value={pageContent} onChange={setPageContent} isAr={isAr} /> : skeleton);
              return (
                <>
                  <TabsContent value="hero" className="space-y-4 pt-2">{bar}{panel(HeroPanel)}</TabsContent>
                  <TabsContent value="hadith" className="space-y-4 pt-2">
                    {bar}{panel(HadithPanel)}
                    {pageContent && <SectionsPanel value={pageContent} onChange={setPageContent} isAr={isAr} keys={sectionKeysFor(pageContent, "hadith")} />}
                  </TabsContent>
                  <TabsContent value="stats" className="space-y-4 pt-2">{bar}{panel(StatsPanel)}</TabsContent>
                  {sectionTabs.map((t) => (
                    <TabsContent key={t.id} value={`sec-${t.id}`} className="space-y-4 pt-2">
                      {bar}
                      {pageContent && <SectionsPanel value={pageContent} onChange={setPageContent} isAr={isAr} keys={t.keys} />}
                    </TabsContent>
                  ))}
                  <TabsContent value="cta" className="space-y-4 pt-2">{bar}{panel(CtaPanel)}</TabsContent>
                </>
              );
            })()}

            {/* TAB 5: SEO & Meta Settings with Google Preview */}
            <TabsContent value="seo" className="space-y-6 pt-2">
              {pageMeta && pageContent && sectionKeysFor(pageContent, "seo").length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {isAr
                      ? "عنوان ووصف صفحة الهبوط (بيظهروا في المسار ووصف الصفحة لما خانات الميتا تحت تكون فاضية)."
                      : "Landing page title and description (used when the meta fields below are empty)."}
                  </p>
                  <SectionsPanel value={pageContent} onChange={setPageContent} isAr={isAr} keys={sectionKeysFor(pageContent, "seo")} />
                </div>
              )}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-blue-500/10 via-primary/5 to-transparent p-4 border border-blue-500/20">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-foreground">
                      {isAr ? "إعدادات السيو والظهور في محركات البحث (SEO & Meta)" : "SEO & Meta Settings"}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {isAr
                        ? "تحسين ظهور صفحة الحملة في بحث جوجل وشبكات التواصل الاجتماعي لزيادة الوصول والتبرعات."
                        : "Optimize search engine rankings and social sharing previews."}
                    </p>
                  </div>
                </div>

              </div>

              {/* Google Live SERP Preview */}
              <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-blue-500" />
                    <span className="text-xs font-bold text-foreground">
                      {isAr ? "معاينة حية في نتائج بحث جوجل (Google Search Preview)" : "Google Search Live Preview"}
                    </span>
                  </div>

                  {/* Lang Switcher for Preview */}
                  <div className="flex items-center rounded-lg border border-border p-0.5 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setSeoPreviewLang("ar")}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        seoPreviewLang === "ar" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground"
                      }`}
                    >
                      عربي
                    </button>
                    <button
                      type="button"
                      onClick={() => setSeoPreviewLang("en")}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        seoPreviewLang === "en" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground"
                      }`}
                    >
                      English
                    </button>
                  </div>
                </div>

                {/* Google Result Card */}
                <div
                  className="rounded-xl border border-border/70 bg-card/60 p-4 font-sans text-start"
                  dir={seoPreviewLang === "ar" ? "rtl" : "ltr"}
                >
                  {/* Google Breadcrumb */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <div className="grid h-5 w-5 place-items-center rounded-full bg-emerald-600 text-[10px] font-black text-white">
                      ي
                    </div>
                    <div className="flex items-center gap-1 overflow-hidden text-ellipsis whitespace-nowrap">
                      <span className="font-semibold text-foreground">
                        {seoPreviewLang === "ar" ? "مؤسسة اليسر الخيرية" : "Al-Yusr Charity Foundation"}
                      </span>
                      <span className="text-muted-foreground/60">›</span>
                      <span className="text-muted-foreground/80">campaigns</span>
                      <span className="text-muted-foreground/60">›</span>
                      <span className="text-muted-foreground/80">{campaign?.slug || "zell"}</span>
                    </div>
                  </div>

                  {/* Google Title */}
                  <h4 className="text-base sm:text-lg font-medium text-[#1a0dab] dark:text-[#8ab4f8] hover:underline cursor-pointer leading-snug line-clamp-2">
                    {seoPreviewLang === "ar"
                      ? seoData.meta_title_ar || `${campaign?.name_ar || "حملة تبرع"} | مؤسسة اليسر الخيرية`
                      : seoData.meta_title_en || `${campaign?.name_en || campaign?.name_ar || "Campaign"} | Al-Yusr Foundation`}
                  </h4>

                  {/* Google Description */}
                  <p className="mt-1 text-xs sm:text-sm text-[#4d5156] dark:text-[#bdc1c6] leading-relaxed line-clamp-3">
                    {seoPreviewLang === "ar"
                      ? seoData.meta_description_ar || campaign?.description_ar || "ساهم في حملات مؤسسة اليسر الخيرية الموثقة بالصور والفيديو لدعم الأسر الأكثر احتياجاً."
                      : seoData.meta_description_en || campaign?.description_en || "Support Al-Yusr Charity campaigns delivering verified aid across Egypt."}
                  </p>
                </div>

                {/* Real-time Length Indicators */}
                <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                  <div className="rounded-xl border border-border/60 bg-muted/30 p-2.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-muted-foreground font-medium">{isAr ? "طول العنوان:" : "Title Length:"}</span>
                      <span
                        className={`font-mono font-bold ${
                          (seoData.meta_title_ar || "").length >= 35 && (seoData.meta_title_ar || "").length <= 60
                            ? "text-emerald-600"
                            : "text-amber-600"
                        }`}
                      >
                        {(seoData.meta_title_ar || "").length} / 60
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          (seoData.meta_title_ar || "").length > 60
                            ? "bg-destructive"
                            : (seoData.meta_title_ar || "").length >= 35
                            ? "bg-emerald-500"
                            : "bg-amber-500"
                        }`}
                        style={{ width: `${Math.min(100, ((seoData.meta_title_ar || "").length / 60) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-border/60 bg-muted/30 p-2.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-muted-foreground font-medium">{isAr ? "طول الوصف:" : "Description Length:"}</span>
                      <span
                        className={`font-mono font-bold ${
                          (seoData.meta_description_ar || "").length >= 110 && (seoData.meta_description_ar || "").length <= 160
                            ? "text-emerald-600"
                            : "text-amber-600"
                        }`}
                      >
                        {(seoData.meta_description_ar || "").length} / 160
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          (seoData.meta_description_ar || "").length > 160
                            ? "bg-destructive"
                            : (seoData.meta_description_ar || "").length >= 110
                            ? "bg-emerald-500"
                            : "bg-amber-500"
                        }`}
                        style={{ width: `${Math.min(100, ((seoData.meta_description_ar || "").length / 160) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SEO Form Fields */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Meta Title AR */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label className="text-xs font-bold text-foreground">
                      {isAr ? "عنوان السيو (Meta Title بالعربية) *" : "Meta Title (Arabic) *"}
                    </Label>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      {(seoData.meta_title_ar || "").length}/60
                    </span>
                  </div>
                  <Input
                    dir="rtl"
                    value={seoData.meta_title_ar || ""}
                    onChange={(e) => setSeoData((prev) => ({ ...prev, meta_title_ar: e.target.value }))}
                    placeholder="عنوان مميز يظهر في نتائج بحث جوجل"
                  />
                </div>

                {/* Meta Title EN */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label className="text-xs font-bold text-foreground">
                      {isAr ? "عنوان السيو (Meta Title بالإنجليزية)" : "Meta Title (English)"}
                    </Label>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      {(seoData.meta_title_en || "").length}/60
                    </span>
                  </div>
                  <Input
                    dir="ltr"
                    value={seoData.meta_title_en || ""}
                    onChange={(e) => setSeoData((prev) => ({ ...prev, meta_title_en: e.target.value }))}
                    placeholder="Optimized page title for search engines"
                  />
                </div>

                {/* Meta Description AR */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label className="text-xs font-bold text-foreground">
                      {isAr ? "وصف السيو (Meta Description بالعربية)" : "Meta Description (Arabic)"}
                    </Label>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      {(seoData.meta_description_ar || "").length}/160
                    </span>
                  </div>
                  <Textarea
                    dir="rtl"
                    rows={3}
                    value={seoData.meta_description_ar || ""}
                    onChange={(e) => setSeoData((prev) => ({ ...prev, meta_description_ar: e.target.value }))}
                    placeholder="ملخص مقنع يشجع الزائر على الضغط والتبرع (بين 120 إلى 160 حرف)"
                  />
                </div>

                {/* Meta Description EN */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label className="text-xs font-bold text-foreground">
                      {isAr ? "وصف السيو (Meta Description بالإنجليزية)" : "Meta Description (English)"}
                    </Label>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      {(seoData.meta_description_en || "").length}/160
                    </span>
                  </div>
                  <Textarea
                    dir="ltr"
                    rows={3}
                    value={seoData.meta_description_en || ""}
                    onChange={(e) => setSeoData((prev) => ({ ...prev, meta_description_en: e.target.value }))}
                    placeholder="Compelling summary for Google search snippet (120-160 characters)"
                  />
                </div>

                {/* Focus Keywords AR */}
                <div>
                  <Label className="mb-1.5 block text-xs font-bold text-foreground">
                    {isAr ? "الكلمات المفتاحية المستهدفة (Focus Keywords بالعربية)" : "Focus Keywords (Arabic)"}
                  </Label>
                  <Input
                    dir="rtl"
                    value={seoData.focus_keywords_ar || ""}
                    onChange={(e) => setSeoData((prev) => ({ ...prev, focus_keywords_ar: e.target.value }))}
                    placeholder="افصل بين الكلمات بفواصل، مثال: حملة ظل، تسقيف منازل، وصلة مياه"
                  />
                  {seoData.focus_keywords_ar && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {seoData.focus_keywords_ar.split(/[،,]/).map((k, idx) => {
                        const trimmed = k.trim();
                        if (!trimmed) return null;
                        return (
                          <span
                            key={idx}
                            className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary"
                          >
                            #{trimmed}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Focus Keywords EN */}
                <div>
                  <Label className="mb-1.5 block text-xs font-bold text-foreground">
                    {isAr ? "الكلمات المفتاحية المستهدفة (Focus Keywords بالإنجليزية)" : "Focus Keywords (English)"}
                  </Label>
                  <Input
                    dir="ltr"
                    value={seoData.focus_keywords_en || ""}
                    onChange={(e) => setSeoData((prev) => ({ ...prev, focus_keywords_en: e.target.value }))}
                    placeholder="Comma separated: zell campaign, donate a roof, sadaqah jariyah"
                  />
                  {seoData.focus_keywords_en && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {seoData.focus_keywords_en.split(",").map((k, idx) => {
                        const trimmed = k.trim();
                        if (!trimmed) return null;
                        return (
                          <span
                            key={idx}
                            className="rounded-md bg-secondary/10 px-2 py-0.5 text-[11px] font-bold text-secondary"
                          >
                            #{trimmed}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Canonical URL */}
                <div className="sm:col-span-2">
                  <Label className="mb-1.5 block text-xs font-bold text-foreground">
                    {isAr ? "الرابط الأساسي المعتمد (Canonical URL)" : "Canonical URL"}
                  </Label>
                  <Input
                    dir="ltr"
                    value={seoData.canonical_url || ""}
                    onChange={(e) => setSeoData((prev) => ({ ...prev, canonical_url: e.target.value }))}
                    placeholder={`https://elyusr.org/campaigns/${campaign?.slug || "zell"}`}
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {isAr
                      ? "يمنع تكرار المحتوى ويضمن لمحركات البحث أن هذه الصفحة هي المصدر الرسمي الوحيد."
                      : "Prevents duplicate content issues and establishes the primary version for Google."}
                  </p>
                </div>

                {/* Indexing Directives */}
                <div className="sm:col-span-2 flex flex-wrap gap-6 rounded-xl border border-border/70 bg-card p-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={seoData.noindex === true}
                      onCheckedChange={(val) => setSeoData((prev) => ({ ...prev, noindex: val }))}
                    />
                    <Label className="text-xs font-bold text-foreground cursor-pointer">
                      {isAr ? "منع الفهرسة (NoIndex)" : "NoIndex (Hide from Google)"}
                    </Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={seoData.nofollow === true}
                      onCheckedChange={(val) => setSeoData((prev) => ({ ...prev, nofollow: val }))}
                    />
                    <Label className="text-xs font-bold text-foreground cursor-pointer">
                      {isAr ? "عدم تتبع الروابط (NoFollow)" : "NoFollow Links"}
                    </Label>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB 6: Campaign FAQs */}
            <TabsContent value="faqs" className="space-y-4 pt-2" dir="rtl">
              {pageMeta && pageContent && sectionKeysFor(pageContent, "faqs").length > 0 && (
                <SectionsPanel value={pageContent} onChange={setPageContent} isAr={isAr} keys={sectionKeysFor(pageContent, "faqs")} />
              )}
              <EntityFaqManager
                kind="campaign"
                saved={!isNew && !!campaign?.id}
                linkedCategoryId={campaign?.faq_category_id}
                slug={campaign?.slug || ""}
                nameAr={campaign?.name_ar || ""}
                onLink={async (faq_category_id) => {
                  await donationCampaignsApi.update(campaign!.id!, { faq_category_id } as Partial<LaravelDonationCampaign>);
                  updateField("faq_category_id", faq_category_id);
                  void queryClient.invalidateQueries({ queryKey: ["campaign-page"] });
                }}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AdminLayout>
  );
}
