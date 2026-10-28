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
  Upload,
  X,
  Image as ImageIcon,
  Globe,
  Search,
  HelpCircle,
  Sparkles,
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useLang } from "@/i18n/LangContext";
import { toast } from "@/hooks/use-toast";
import {
  donationCampaignsApi,
  donationCampaignCategoriesApi,
  type LaravelDonationCampaign,
  type LaravelDonationCampaignCategory,
  type LaravelDonationPackage,
  formatServerImageUrl,
  uploadImage,
} from "@/data/laravelApi";
import { CAMPAIGNS_DATA } from "@/pages/site/CampaignsPage";
import {
  getStoredCampaignSeo,
  saveStoredCampaignSeo,
  OFFICIAL_CAMPAIGN_SEO_PRESETS,
  matchCampaignPresetKey,
  type CampaignSeoData,
} from "@/data/campaignSeoStore";
import { getCampaignDefaultFaqs } from "@/data/faqsApi";
import { useQueryClient } from "@tanstack/react-query";
import { HeroPanel, HadithPanel, StatsPanel, SectionsPanel, CtaPanel } from "@/components/admin/CampaignPageContentEditor";
import { campaignPagesApi, getCampaignPageMetaForCampaign, mergeCampaignContent, type CampaignPageContent } from "@/data/campaignPages";

const DEFAULT_CATEGORIES: Array<{ id: number; name_ar: string; name_en: string; slug: string }> = [
  { id: 1, name_ar: "صدقات جارية", name_en: "Ongoing Charity", slug: "ongoing-charity" },
  { id: 2, name_ar: "مواسم الخير", name_en: "Seasons of Goodness", slug: "seasons-of-goodness" },
  { id: 3, name_ar: "استدامة وتبرع عيني", name_en: "Sustainability & In-Kind", slug: "sustainability-in-kind" },
  { id: 4, name_ar: "تعليم وبناء الإنسان", name_en: "Education & Human Development", slug: "education-human-development" },
  { id: 5, name_ar: "مشاريع الخير", name_en: "Goodness Projects", slug: "good" },
];

export default function AdminDonationCampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { lang } = useLang();
  const isAr = lang === "ar";
  const isNew = id === "new";

  const [campaign, setCampaign] = useState<Partial<LaravelDonationCampaign> | null>(null);
  const [categories, setCategories] = useState<LaravelDonationCampaignCategory[]>([]);
  const [packages, setPackages] = useState<LaravelDonationPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // SEO State
  const [seoData, setSeoData] = useState<CampaignSeoData>({
    meta_title_ar: "",
    meta_title_en: "",
    meta_description_ar: "",
    meta_description_en: "",
    focus_keywords_ar: "",
    focus_keywords_en: "",
    canonical_url: "",
    noindex: false,
    nofollow: false,
  });
  const [seoPreviewLang, setSeoPreviewLang] = useState<"ar" | "en">("ar");

  // FAQs State
  const [campaignFaqs, setCampaignFaqs] = useState<
    Array<{ question_ar: string; answer_ar: string; question_en?: string; answer_en?: string }>
  >([]);
  const [newFaqQAr, setNewFaqQAr] = useState("");
  const [newFaqAAr, setNewFaqAAr] = useState("");
  const [newFaqQEn, setNewFaqQEn] = useState("");
  const [newFaqAEn, setNewFaqAEn] = useState("");
  const [showAddFaqForm, setShowAddFaqForm] = useState(false);

  // Landing page content (hero / hadith / prices / sections / CTA). Saved together with the campaign.
  // FAQ and SEO come from this screen's existing tabs and are written into the same content object.
  const queryClient = useQueryClient();
  const [pageContent, setPageContent] = useState<CampaignPageContent | null>(null);
  const [pageHasOverride, setPageHasOverride] = useState(false);
  const [pageSeoSaved, setPageSeoSaved] = useState(false);
  const seoInitialRef = useRef<string>("");
  const pageMeta = useMemo(() => getCampaignPageMetaForCampaign(campaign), [campaign?.slug, campaign?.id, campaign?.name_ar]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadPageContent = async (loaded: any) => {
    const meta = getCampaignPageMetaForCampaign(loaded);
    if (!meta) { setPageContent(null); setPageHasOverride(false); setPageSeoSaved(false); return; }
    try {
      const [defaults, rec] = await Promise.all([meta.load(), campaignPagesApi.load(meta.slug, { fresh: true })]);
      const merged = mergeCampaignContent(defaults, rec.content);
      setPageContent(merged);
      setPageHasOverride(!!rec.content && Object.keys(rec.content).length > 0);
      // FAQ tab source of truth: saved page FAQs > backend faqs > the landing page's own defaults
      const savedFaq = Array.isArray(rec.content?.faq) && (rec.content?.faq?.length || 0) > 0;
      if (savedFaq || !(Array.isArray(loaded.faqs) && loaded.faqs.length > 0)) {
        setCampaignFaqs(merged.faq.map((f) => ({ question_ar: f.q.ar, answer_ar: f.a.ar, question_en: f.q.en || undefined, answer_en: f.a.en || undefined })));
      }
      // SEO tab: a saved page SEO wins over local presets
      if (rec.content?.seo && merged.seo) {
        const se = merged.seo;
        setPageSeoSaved(true);
        setSeoData((prev) => {
          const next = {
            ...prev,
            meta_title_ar: se.title.ar || prev.meta_title_ar,
            meta_title_en: se.title.en || prev.meta_title_en,
            meta_description_ar: se.description.ar || prev.meta_description_ar,
            meta_description_en: se.description.en || prev.meta_description_en,
            focus_keywords_ar: se.keywords.ar || prev.focus_keywords_ar,
            focus_keywords_en: se.keywords.en || prev.focus_keywords_en,
            canonical_url: se.canonical ?? prev.canonical_url,
            noindex: se.noindex ?? prev.noindex,
            nofollow: se.nofollow ?? prev.nofollow,
          };
          seoInitialRef.current = JSON.stringify(next);
          return next;
        });
      } else {
        setPageSeoSaved(false);
        setSeoData((prev) => { seoInitialRef.current = JSON.stringify(prev); return prev; });
      }
    } catch {
      /* page content is optional: the campaign screen keeps working without it */
    }
  };

  const savePageContent = async () => {
    if (!pageMeta || !pageContent) return;
    const seoChanged = JSON.stringify(seoData) !== seoInitialRef.current;
    const content: CampaignPageContent = {
      ...pageContent,
      faq: campaignFaqs
        .filter((f) => f.question_ar?.trim() && f.answer_ar?.trim())
        .map((f) => ({ q: { ar: f.question_ar.trim(), en: (f.question_en || "").trim() }, a: { ar: f.answer_ar.trim(), en: (f.answer_en || "").trim() } })),
      // Only persist SEO once the admin has actually edited it (or it was saved before); otherwise the
      // landing page keeps its hand-written static title/description.
      ...(pageSeoSaved || seoChanged
        ? { seo: {
            title: { ar: seoData.meta_title_ar || "", en: seoData.meta_title_en || "" },
            description: { ar: seoData.meta_description_ar || "", en: seoData.meta_description_en || "" },
            keywords: { ar: seoData.focus_keywords_ar || "", en: seoData.focus_keywords_en || "" },
            canonical: seoData.canonical_url || undefined,
            noindex: !!seoData.noindex,
            nofollow: !!seoData.nofollow,
          } }
        : {}),
    };
    await campaignPagesApi.save(pageMeta.slug, content, pageMeta.name);
    await queryClient.invalidateQueries({ queryKey: ["campaign-page", pageMeta.slug] });
    setPageContent(content);
    setPageHasOverride(true);
    if (content.seo) { setPageSeoSaved(true); seoInitialRef.current = JSON.stringify(seoData); }
  };

  const resetPageContent = async () => {
    if (!pageMeta || !campaign) return;
    if (!window.confirm(isAr ? "إرجاع صفحة الحملة إلى نصوصها الافتراضية؟ سيُحذف المحتوى المخصص (بما فيه الأسئلة والسيو المحفوظة)." : "Restore the landing page to its default texts? Saved custom content (incl. FAQs and SEO) will be removed.")) return;
    try {
      await campaignPagesApi.reset(pageMeta.slug);
      await queryClient.invalidateQueries({ queryKey: ["campaign-page", pageMeta.slug] });
      await loadPageContent(campaign);
      toast({ title: isAr ? "تمت الإعادة إلى الافتراضي" : "Reset to defaults" });
    } catch (e: any) {
      toast({ title: isAr ? "تعذرت الإعادة" : "Reset failed", description: e?.message, variant: "destructive" });
    }
  };

  // New package inline form
  const [newPkgName, setNewPkgName] = useState("سهم مساهمة");
  const [newPkgAmount, setNewPkgAmount] = useState<number | string>(100);
  const [addingPkg, setAddingPkg] = useState(false);

  // Benefits editing
  const [benefitText, setBenefitText] = useState("");
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const imgInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load categories
      const catsRes = await donationCampaignCategoriesApi.listAll().catch(() => []);
      const catsList = Array.isArray(catsRes) && catsRes.length > 0 ? catsRes : (DEFAULT_CATEGORIES as any);
      setCategories(catsList);

      if (isNew) {
        setCampaign({
          id: "new",
          category_id: catsList[0]?.id ? Number(catsList[0].id) : 1,
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
        });
        setPackages([
          { id: 1, name_ar: "سهم الخير", amount: 100, is_active: true },
          { id: 2, name_ar: "سهم البركة", amount: 250, is_active: true },
          { id: 3, name_ar: "سهم الإحسان", amount: 500, is_active: true },
        ]);
        setSeoData({
          meta_title_ar: "",
          meta_title_en: "",
          meta_description_ar: "",
          meta_description_en: "",
          focus_keywords_ar: "",
          focus_keywords_en: "",
          canonical_url: "",
          noindex: false,
          nofollow: false,
        });
        setCampaignFaqs([]);
        setLoading(false);
        return;
      }

      // Existing campaign
      let loaded: any = null;
      try {
        loaded = await donationCampaignsApi.get(id!);
      } catch {
        // Fallback to searching all campaigns
        const all = await donationCampaignsApi.listAll().catch(() => []);
        loaded = all.find((c: any) => String(c.id) === id || c.slug === id);
      }

      if (!loaded) {
        toast({
          title: isAr ? "تعذّر العثور على الحملة في قاعدة البيانات" : "Campaign not found in database",
          variant: "destructive",
        });
        navigate("/admin/donation-campaigns");
        return;
      }

      setCampaign(loaded);
      void loadPageContent(loaded);
      setPackages(Array.isArray(loaded.donation_packages) ? loaded.donation_packages : [
        { id: 1, name_ar: "سهم الخير", amount: 100, is_active: true },
        { id: 2, name_ar: "سهم البركة", amount: 250, is_active: true },
      ]);

      // Initialize SEO from store or fallback
      const cKey = loaded.slug || String(loaded.id);
      const storedSeo = getStoredCampaignSeo(cKey) || getStoredCampaignSeo(loaded.id);
      if (storedSeo) {
        setSeoData(storedSeo);
      } else {
        setSeoData({
          meta_title_ar: loaded.meta_title_ar || `${loaded.name_ar} | أسقف ووصلات مياه صدقة جارية — مؤسسة اليسر`,
          meta_title_en: loaded.meta_title_en || `${loaded.name_en || loaded.name_ar} | Al-Yusr Charity Foundation`,
          meta_description_ar: loaded.meta_description_ar || loaded.description_ar || "",
          meta_description_en: loaded.meta_description_en || loaded.description_en || "",
          focus_keywords_ar: loaded.focus_keywords_ar || loaded.name_ar || "",
          focus_keywords_en: loaded.focus_keywords_en || loaded.name_en || "",
          canonical_url: loaded.canonical_url || `https://elyusr.org/campaigns/${loaded.slug || ""}`,
          noindex: loaded.noindex || false,
          nofollow: loaded.nofollow || false,
        });
      }

      // Initialize FAQs
      const defaultFaqs = getCampaignDefaultFaqs(cKey);
      if (Array.isArray(loaded.faqs) && loaded.faqs.length > 0) {
        setCampaignFaqs(loaded.faqs);
      } else if (defaultFaqs.length > 0) {
        setCampaignFaqs(
          defaultFaqs.map((f) => ({
            question_ar: f.question_ar,
            answer_ar: f.answer_ar,
            question_en: f.question_en || undefined,
            answer_en: f.answer_en || undefined,
          }))
        );
      }
    } catch (err: any) {
      toast({
        title: isAr ? "خطأ في تحميل الحملة" : "Error loading campaign",
        description: err.message,
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

  const updateField = (field: keyof LaravelDonationCampaign, value: any) => {
    setCampaign((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleApplyPdfSeoPreset = () => {
    if (!campaign) return;
    const cKey = matchCampaignPresetKey(campaign.slug || campaign.name_ar || String(campaign.id));
    if (cKey && OFFICIAL_CAMPAIGN_SEO_PRESETS[cKey]) {
      const preset = OFFICIAL_CAMPAIGN_SEO_PRESETS[cKey];
      setSeoData((prev) => ({ ...prev, ...preset }));
      toast({
        title: isAr ? "تم تطبيق إعدادات السيو الرسمية من الـ PDF" : "Applied official SEO preset from PDF",
        description: isAr ? `تم تحديث الميتا والكلمات المفتاحية لحملة ${campaign.name_ar}` : "SEO metadata updated",
      });
    } else {
      toast({
        title: isAr ? "لا يوجد قالب محدد لهذه الحملة" : "No specific preset found",
        description: isAr ? "يمكنك إدخال العنوان والميتا يدوياً أدناه" : "Fill fields manually",
      });
    }
  };

  const handleImportPdfFaqs = () => {
    if (!campaign) return;
    const cKey = matchCampaignPresetKey(campaign.slug || campaign.name_ar || String(campaign.id));
    if (cKey) {
      const faqsList = getCampaignDefaultFaqs(cKey);
      if (faqsList.length > 0) {
        setCampaignFaqs(
          faqsList.map((f) => ({
            question_ar: f.question_ar,
            answer_ar: f.answer_ar,
            question_en: f.question_en || undefined,
            answer_en: f.answer_en || undefined,
          }))
        );
        toast({
          title: isAr ? `تم استيراد ${faqsList.length} أسئلة من الـ PDF` : `Imported ${faqsList.length} FAQs from PDF`,
        });
        return;
      }
    }
    toast({
      title: isAr ? "لم يتم العثور على أسئلة جاهزة لهذا الاسم" : "No FAQs found for this campaign",
      variant: "destructive",
    });
  };

  const handleAddCampaignFaq = () => {
    if (!newFaqQAr.trim() || !newFaqAAr.trim()) {
      toast({
        title: isAr ? "يرجى ملء السؤال والإجابة بالعربية" : "Please fill question and answer",
        variant: "destructive",
      });
      return;
    }
    setCampaignFaqs((prev) => [
      ...prev,
      {
        question_ar: newFaqQAr.trim(),
        answer_ar: newFaqAAr.trim(),
        question_en: newFaqQEn.trim() || undefined,
        answer_en: newFaqAEn.trim() || undefined,
      },
    ]);
    setNewFaqQAr("");
    setNewFaqAAr("");
    setNewFaqQEn("");
    setNewFaqAEn("");
    setShowAddFaqForm(false);
    toast({ title: isAr ? "تمت إضافة السؤال بنجاح" : "FAQ added" });
  };

  const handleRemoveCampaignFaq = (index: number) => {
    setCampaignFaqs((prev) => prev.filter((_, i) => i !== index));
    toast({ title: isAr ? "تم حذف السؤال" : "FAQ removed" });
  };

  const handleImageSelect = (file: File) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg", "image/gif", "image/svg+xml"];
    if (!allowed.includes(file.type) && !file.type.startsWith("image/")) {
      toast({
        title: isAr ? "نوع غير مدعوم" : "Unsupported type",
        description: isAr ? "يرجى اختيار صورة (JPG, PNG, WebP)" : "Please select an image file",
        variant: "destructive",
      });
      return;
    }
    setPendingImageFile(file);
    const localUrl = URL.createObjectURL(file);
    setImagePreview(localUrl);
    updateField("image", localUrl);
    toast({
      title: isAr ? "تم اختيار الصورة" : "Image selected",
      description: isAr ? "سيتم حفظها في قاعدة البيانات فور الضغط على «حفظ التعديلات»" : "Will be saved when you click Save",
    });
  };

  const handleRemoveImage = () => {
    setPendingImageFile(null);
    setImagePreview("");
    updateField("image", "");
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

  const handleAddPackage = async () => {
    if (!newPkgName.trim() || Number(newPkgAmount) <= 0) {
      toast({
        title: isAr ? "اكتب اسم الباقة والمبلغ" : "Fill package name and amount",
        variant: "destructive",
      });
      return;
    }

    setAddingPkg(true);
    try {
      const pkgPayload = {
        name_ar: newPkgName.trim(),
        name_en: newPkgName.trim(),
        amount: Number(newPkgAmount),
        is_active: true,
        sort_order: packages.length + 1,
      };

      if (!isNew && campaign?.id && !String(campaign.id).startsWith("static-")) {
        await donationCampaignsApi.addPackage(campaign.id, pkgPayload);
        toast({ title: isAr ? "تم حفظ الباقة في قاعدة البيانات" : "Package added to DB" });
      }

      setPackages((prev) => [...prev, { ...pkgPayload, id: Date.now() }]);
      setNewPkgName("سهم مساهمة");
      setNewPkgAmount(100);
    } catch (err: any) {
      toast({
        title: isAr ? "فشل إضافة الباقة" : "Failed to add package",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setAddingPkg(false);
    }
  };

  const handleRemovePackage = (pkgId: number | string | undefined) => {
    setPackages((prev) => prev.filter((p) => p.id !== pkgId));
    toast({ title: isAr ? "تمت إزالة الباقة من القائمة" : "Package removed" });
  };

  const handleTogglePackage = (pkgId: number | string | undefined) => {
    setPackages((prev) =>
      prev.map((p) => (p.id === pkgId ? { ...p, is_active: !p.is_active } : p))
    );
  };

  const handleSave = async () => {
    if (!campaign || !campaign.name_ar?.trim()) {
      toast({
        title: isAr ? "يرجى إدخال اسم الحملة بالعربية" : "Please enter Arabic campaign name",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Save SEO locally as overlay
      const cKey = campaign.slug || campaign.id || "new";
      saveStoredCampaignSeo(cKey, seoData);

      const payload: Record<string, unknown> = {
        category_id: campaign.category_id ? Number(campaign.category_id) : 1,
        name_ar: campaign.name_ar.trim(),
        name_en: campaign.name_en?.trim() || campaign.name_ar.trim(),
        slug: campaign.slug?.trim() || campaign.name_ar.trim().toLowerCase().replace(/\s+/g, "-"),
        subtitle_ar: campaign.subtitle_ar?.trim() || null,
        subtitle_en: campaign.subtitle_en?.trim() || null,
        description_ar: campaign.description_ar?.trim() || campaign.name_ar.trim(),
        description_en: campaign.description_en?.trim() || null,
        target_amount: Number(campaign.target_amount || 0),
        minimum_amount: Number(campaign.minimum_amount || 50),
        donation_available: campaign.donation_available !== false,
        is_active: campaign.is_active !== false,
        sort_order: Number(campaign.sort_order || 1),
        benefits: Array.isArray(campaign.benefits) ? campaign.benefits : [],
        // SEO fields sent to backend (when supported)
        meta_title_ar: seoData.meta_title_ar,
        meta_title_en: seoData.meta_title_en,
        meta_description_ar: seoData.meta_description_ar,
        meta_description_en: seoData.meta_description_en,
        focus_keywords_ar: seoData.focus_keywords_ar,
        focus_keywords_en: seoData.focus_keywords_en,
        canonical_url: seoData.canonical_url,
        noindex: seoData.noindex,
        nofollow: seoData.nofollow,
        faqs: campaignFaqs,
      };

      if (pendingImageFile) {
        payload.image = pendingImageFile;
      }

      if (isNew) {
        const res = await donationCampaignsApi.create(payload as any);
        toast({ title: isAr ? "تم إنشاء الحملة بنجاح" : "Campaign created successfully" });
        navigate(`/admin/donation-campaigns/${res.id || res.slug || ""}`);
        return;
      }

      if (campaign.id && !String(campaign.id).startsWith("static-")) {
        const res = await donationCampaignsApi.update(campaign.id, payload as any);
        setPendingImageFile(null);
        const updatedImg = (res as any)?.data?.image || (res as any)?.image;
        if (updatedImg) {
          updateField("image", updatedImg);
          setImagePreview("");
        }
      }
      try {
        await savePageContent();
      } catch (e: any) {
        toast({ title: isAr ? "تم حفظ الحملة، لكن تعذر حفظ محتوى صفحة الهبوط" : "Campaign saved, but landing page content failed to save", description: e?.message, variant: "destructive" });
      }
      toast({ title: isAr ? "تم حفظ الحملة بنجاح" : "Campaign saved successfully" });
      void loadData();
    } catch (err: any) {
      toast({
        title: isAr ? "فشل حفظ الحملة" : "Failed to save campaign",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
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
  const previewHref = `/campaigns/${campaign.slug || ""}`;

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
              onClick={handleSave}
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
                  <TabsTrigger value="sections" className="text-xs font-bold py-2 gap-1.5">
                    <span>{isAr ? "الأقسام" : "Sections"}</span>
                    {!!pageContent && <span className="rounded-full bg-muted-foreground/15 text-[10px] px-1.5 font-mono font-black">{Object.keys(pageContent.sections).length}</span>}
                  </TabsTrigger>
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
                {campaignFaqs.length > 0 && (
                  <span className="rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-200 text-[10px] px-1.5 font-mono font-black">
                    {campaignFaqs.length}
                  </span>
                )}
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
                  <select
                    value={campaign.category_id || ""}
                    onChange={(e) => updateField("category_id", Number(e.target.value))}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {isAr ? cat.name_ar : (cat.name_en || cat.name_ar)}
                      </option>
                    ))}
                  </select>
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
                  <Label className="mb-1.5 block text-xs font-bold text-foreground">
                    {isAr ? "صورة الغلاف (يدعم JPG, PNG, WebP)" : "Cover Image (JPG, PNG, WebP)"}
                  </Label>
                  <input
                    ref={imgInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg,image/gif,image/svg+xml"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageSelect(f); e.target.value = ""; }}
                  />
                  <div
                    className="relative group rounded-2xl border-2 border-dashed border-border hover:border-primary/60 bg-muted/30 transition-colors overflow-hidden"
                    style={{ minHeight: 160 }}
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "var(--primary)"; }}
                    onDragLeave={(e) => { e.currentTarget.style.borderColor = ""; }}
                    onDrop={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = ""; const f = e.dataTransfer.files?.[0]; if (f) handleImageSelect(f); }}
                  >
                    {(imagePreview || campaign.image) ? (
                      <>
                        <img
                          src={imagePreview || formatServerImageUrl(campaign.image) || campaign.image}
                          alt="Preview"
                          className="w-full object-cover rounded-2xl"
                          style={{ maxHeight: 240 }}
                          onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center gap-2">
                          <Button type="button" size="sm" variant="secondary" className="gap-1.5 rounded-xl text-xs font-bold shadow-md" onClick={() => imgInputRef.current?.click()}>
                            <Upload className="h-3.5 w-3.5" />
                            {isAr ? "تغيير الصورة" : "Change Image"}
                          </Button>
                          <Button type="button" size="sm" variant="destructive" className="gap-1.5 rounded-xl text-xs font-bold shadow-md" onClick={handleRemoveImage}>
                            <X className="h-3.5 w-3.5" />
                            {isAr ? "حذف" : "Remove"}
                          </Button>
                        </div>
                      </>
                    ) : (
                      <button type="button" className="w-full h-full flex flex-col items-center justify-center gap-3 p-8 text-muted-foreground hover:text-primary transition-colors" onClick={() => imgInputRef.current?.click()}>
                        <ImageIcon className="h-8 w-8" />
                        <div className="text-center">
                          <p className="text-sm font-bold">{isAr ? "انقر لاختيار صورة من جهازك" : "Click to select image from device"}</p>
                          <p className="text-xs mt-1 text-muted-foreground">{isAr ? "أو اسحب وأفلت هنا (يدعم كل الصيغ JPG, PNG, WebP)" : "or drag & drop here (JPG, PNG, WebP)"}</p>
                        </div>
                      </button>
                    )}
                  </div>
                  {pendingImageFile && (
                    <p className="mt-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {isAr ? `تم اختيار: ${pendingImageFile.name} (سيتم حفظها في السيرفر عند حفظ الحملة)` : `Selected: ${pendingImageFile.name} (will save to server upon campaign save)`}
                    </p>
                  )}
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

            {/* TAB 4: Donation Packages */}
            <TabsContent value="packages" className="space-y-4 pt-2">
              <div className="rounded-xl border border-border/80 bg-muted/20 p-4">
                <h3 className="text-xs font-bold text-foreground mb-3">
                  {isAr ? "إضافة باقة أو سهم تبرع جديد" : "Add Donation Package"}
                </h3>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <Label className="mb-1 block text-[11px] font-bold text-muted-foreground">
                      {isAr ? "اسم الباقة / السهم" : "Package Name"}
                    </Label>
                    <Input
                      dir="rtl"
                      value={newPkgName}
                      onChange={(e) => setNewPkgName(e.target.value)}
                      placeholder="مثال: سهم توصيل وصلة مياه"
                    />
                  </div>
                  <div>
                    <Label className="mb-1 block text-[11px] font-bold text-muted-foreground">
                      {isAr ? "المبلغ (ج.م)" : "Amount (EGP)"}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        dir="ltr"
                        type="number"
                        value={newPkgAmount}
                        onChange={(e) => setNewPkgAmount(e.target.value)}
                      />
                      <Button
                        onClick={handleAddPackage}
                        disabled={addingPkg}
                        className="bg-secondary text-secondary-foreground font-bold shrink-0"
                      >
                        {addingPkg ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <p className="text-xs font-bold text-muted-foreground">
                  {isAr ? "باقات التبرع السريع المسجلة:" : "Registered Donation Packages:"}
                </p>
                {packages.length === 0 ? (
                  <p className="text-xs text-muted-foreground/60 italic py-4 text-center">
                    {isAr ? "لا توجد باقات تبرع مدخلة لهذه الحملة." : "No donation packages for this campaign."}
                  </p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {packages.map((pkg, idx) => (
                      <div
                        key={pkg.id || idx}
                        className="flex items-center justify-between rounded-xl border border-border/80 bg-card p-3 shadow-xs"
                      >
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-secondary shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-foreground">{pkg.name_ar}</p>
                            <p className="font-mono text-xs font-bold text-emerald-600">
                              {Number(pkg.amount).toLocaleString("en-US")} ج.م
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Switch
                            checked={pkg.is_active !== false}
                            onCheckedChange={() => handleTogglePackage(pkg.id)}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemovePackage(pkg.id)}
                            className="h-7 w-7 p-0 text-destructive/80 hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Landing page content tabs (hero / hadith / figures / sections / closing). Prices come from donation packages. */}
            {pageMeta && (() => {
              const bar = (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl bg-emerald-500/10 p-3 border border-emerald-500/20">
                  <p className="text-xs text-muted-foreground">
                    {isAr
                      ? `صفحة الهبوط elyusr.org${pageMeta.path} — التصميم ثابت، والنصوص تتعدل من هنا وتُحفظ بزر «حفظ التغييرات» أعلى الصفحة. الأسعار تُقرأ من «باقات التبرع».`
                      : `Landing page elyusr.org${pageMeta.path}: layout is fixed; texts are edited here and saved with the main Save button. Prices come from "Donation packages".`}
                  </p>
                  {pageHasOverride && (
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
                  <TabsContent value="hadith" className="space-y-4 pt-2">{bar}{panel(HadithPanel)}</TabsContent>
                  <TabsContent value="stats" className="space-y-4 pt-2">{bar}{panel(StatsPanel)}</TabsContent>
                  <TabsContent value="sections" className="space-y-4 pt-2">{bar}{panel(SectionsPanel)}</TabsContent>
                  <TabsContent value="cta" className="space-y-4 pt-2">{bar}{panel(CtaPanel)}</TabsContent>
                </>
              );
            })()}

            {/* TAB 5: SEO & Meta Settings with Google Preview */}
            <TabsContent value="seo" className="space-y-6 pt-2">
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

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleApplyPdfSeoPreset}
                  className="gap-1.5 text-xs font-bold border-blue-500/30 text-blue-700 dark:text-blue-400 hover:bg-blue-500/10 shrink-0"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{isAr ? "استعادة إعدادات السيو من الـ PDF" : "Load PDF SEO Preset"}</span>
                </Button>
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
            <TabsContent value="faqs" className="space-y-4 pt-2">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl bg-amber-500/10 p-4 border border-amber-500/20">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300">
                    <HelpCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-foreground">
                      {isAr ? "بنك الأسئلة الشائعة الخاص بالحملة" : "Campaign FAQ Bank"}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {isAr
                        ? "الأسئلة الشائعة المعروضة في صفحة هبوط الحملة للإجابة على استفسارات المتبرعين وزيادة الثقة."
                        : "Specific FAQs displayed on this campaign's landing page."}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleImportPdfFaqs}
                    className="gap-1.5 text-xs font-bold border-amber-500/30 text-amber-800 dark:text-amber-200 hover:bg-amber-500/10"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>{isAr ? "استيراد أسئلة الحملة من الـ PDF" : "Import PDF FAQs"}</span>
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setShowAddFaqForm(!showAddFaqForm)}
                    className="gap-1 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>{isAr ? "إضافة سؤال" : "Add FAQ"}</span>
                  </Button>
                </div>
              </div>

              {/* Add FAQ Form */}
              {showAddFaqForm && (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3 animate-in fade-in">
                  <h4 className="text-xs font-black text-foreground flex items-center gap-1.5">
                    <Plus className="h-3.5 w-3.5 text-amber-600" />
                    {isAr ? "إضافة سؤال شائع جديد للحملة" : "Add New Campaign Question"}
                  </h4>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label className="text-[11px] font-bold text-foreground mb-1 block">
                        {isAr ? "السؤال (بالعربية) *" : "Question (Arabic) *"}
                      </Label>
                      <Input
                        dir="rtl"
                        value={newFaqQAr}
                        onChange={(e) => setNewFaqQAr(e.target.value)}
                        placeholder="مثال: كم تكلفة السهم في هذه الحملة؟"
                        className="h-9 text-xs"
                      />
                    </div>

                    <div>
                      <Label className="text-[11px] font-bold text-foreground mb-1 block">
                        {isAr ? "السؤال (بالإنجليزية)" : "Question (English)"}
                      </Label>
                      <Input
                        dir="ltr"
                        value={newFaqQEn}
                        onChange={(e) => setNewFaqQEn(e.target.value)}
                        placeholder="e.g. How much does a share cost?"
                        className="h-9 text-xs"
                      />
                    </div>

                    <div>
                      <Label className="text-[11px] font-bold text-foreground mb-1 block">
                        {isAr ? "الإجابة (بالعربية) *" : "Answer (Arabic) *"}
                      </Label>
                      <Textarea
                        dir="rtl"
                        rows={2}
                        value={newFaqAAr}
                        onChange={(e) => setNewFaqAAr(e.target.value)}
                        placeholder="إجابة مفصلة وموثقة..."
                        className="text-xs"
                      />
                    </div>

                    <div>
                      <Label className="text-[11px] font-bold text-foreground mb-1 block">
                        {isAr ? "الإجابة (بالإنجليزية)" : "Answer (English)"}
                      </Label>
                      <Textarea
                        dir="ltr"
                        rows={2}
                        value={newFaqAEn}
                        onChange={(e) => setNewFaqAEn(e.target.value)}
                        placeholder="Detailed answer..."
                        className="text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAddFaqForm(false)}
                      className="text-xs"
                    >
                      {isAr ? "إلغاء" : "Cancel"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddCampaignFaq}
                      className="text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      {isAr ? "حفظ السؤال" : "Save Question"}
                    </Button>
                  </div>
                </div>
              )}

              {/* FAQs List */}
              <div className="space-y-2.5">
                {campaignFaqs.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground border border-dashed rounded-2xl">
                    <HelpCircle className="mx-auto h-8 w-8 text-muted-foreground/30 mb-2" />
                    <p className="text-xs font-bold">
                      {isAr ? "لا توجد أسئلة شائعة مسجلة لهذه الحملة حالياً." : "No FAQs registered for this campaign."}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {isAr
                        ? "اضغط على «استيراد أسئلة الحملة من الـ PDF» لإدراج الأسئلة الـ 6 المعتمدة بنقرة واحدة."
                        : "Click 'Import PDF FAQs' to automatically load the 6 approved questions."}
                    </p>
                  </div>
                ) : (
                  campaignFaqs.map((faq, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-border/80 bg-card p-3.5 shadow-xs hover:border-primary/30 transition-colors space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <span className="grid h-6 w-6 place-items-center rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 font-mono text-[11px] font-black shrink-0">
                            {index + 1}
                          </span>
                          <div>
                            <h5 className="text-xs font-bold text-foreground">
                              {faq.question_ar}
                            </h5>
                            {faq.question_en && (
                              <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                                {faq.question_en}
                              </p>
                            )}
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveCampaignFaq(index)}
                          className="h-7 w-7 p-0 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      <div className="pr-8 text-xs text-muted-foreground leading-relaxed bg-muted/20 p-2.5 rounded-lg border border-border/40">
                        <p>{faq.answer_ar}</p>
                        {faq.answer_en && (
                          <p className="mt-1 text-[11px] text-muted-foreground/80 font-mono border-t border-border/40 pt-1">
                            {faq.answer_en}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AdminLayout>
  );
}
