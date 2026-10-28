import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, Globe2, Loader2, Save, Sparkles, Trash2, Upload, Image as ImageIcon, X } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useLang } from "@/i18n/LangContext";
import { programsApi, projectsApi, LaravelProgram, LaravelProject, formatServerImageUrl, uploadImage } from "@/data/laravelApi";
import { toast } from "@/hooks/use-toast";

type SeoMeta = {
  meta_title_ar?: string; meta_title_en?: string;
  meta_desc_ar?: string;  meta_desc_en?: string;
  keywords_ar?: string;   keywords_en?: string;
  og_image_url?: string;
  canonical_slug?: string;
  long_content_ar?: string[]; long_content_en?: string[];
  benefits_ar?: string[]; benefits_en?: string[];
  hidden_from_public?: boolean;
  canonical_url?: string;
  og_title_ar?: string; og_title_en?: string;
  og_desc_ar?: string;  og_desc_en?: string;
  twitter_card?: "summary" | "summary_large_image";
  noindex?: boolean; nofollow?: boolean;
  geo_region?: string; geo_placename?: string; geo_position?: string; service_cities?: string;
  ai_summary_ar?: string; ai_summary_en?: string;
  faq_ar?: string; faq_en?: string;
  schema_type?: "Service" | "Product" | "DonateAction" | "Event";
};
type Node = {
  id: string;
  type: "program" | "project" | "campaign" | "option";
  parent_id: string | null;
  slug: string;
  title_ar: string; title_en: string;
  description_ar: string | null; description_en: string | null;
  image_url: string | null;
  target_amount: number | null;
  collected_amount: number;
  amount: number | null;
  active: boolean;
  direct_checkout: boolean;
  sort_order: number;
  metadata: SeoMeta | null;
};

const t = (lang: "ar" | "en", ar: string, en: string) => (lang === "ar" ? ar : en);

export default function AdminProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { lang } = useLang();
  const [node, setNode] = useState<Node | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [children, setChildren] = useState<Node[]>([]);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const localUrl = URL.createObjectURL(file);
    setCoverFile(file);
    setNode((prev) => (prev ? { ...prev, image_url: localUrl } : prev));
    toast({ title: t(lang, "تم اختيار الصورة (سيتم رفعها وحفظها عند الضغط على حفظ)", "Image selected (will be uploaded when saved)") });
  };

  const load = async () => {
    if (!id) return;
    if (id === "new") {
      setNode({
        id: "new",
        type: "project",
        parent_id: null,
        slug: `project-${Date.now().toString(36)}`,
        title_ar: "",
        title_en: "",
        description_ar: "",
        description_en: "",
        image_url: null,
        target_amount: 100000,
        collected_amount: 0,
        amount: 100,
        active: true,
        direct_checkout: true,
        sort_order: 1,
        metadata: {
          schema_type: "Service",
          twitter_card: "summary_large_image",
          geo_region: "EG-DK",
          geo_placename: "Mansoura, Dakahlia, Egypt",
          geo_position: "31.0409;31.3785",
        },
      });
      setChildren([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    let item: any = null;
    let kind: "program" | "project" = "project";

    // 1. Try Laravel Projects API first (this is the projects admin page)
    try {
      item = await projectsApi.get(id);
      kind = "project";
    } catch {
      try {
        const allProjects = await projectsApi.listAll();
        item = allProjects.find((p: any) => String(p.id) === id || p.slug === id);
        if (item) kind = "project";
      } catch {}
    }

    // 2. Fallback to Laravel Programs API
    if (!item) {
      try {
        item = await programsApi.get(id);
        kind = "program";
      } catch {
        try {
          const allProgs = await programsApi.listAll();
          item = allProgs.find((p: any) => String(p.id) === id || p.slug === id);
          if (item) kind = "program";
        } catch {}
      }
    }

    if (!item) {
      toast({ title: t(lang, "تعذّر التحميل", "Load failed"), description: t(lang, "العنصر غير موجود في السيرفر", "Item not found") });
      setLoading(false);
      return;
    }

    const mappedNode: Node = {
      id: String(item.id),
      type: kind,
      parent_id: item.axis_id ? String(item.axis_id) : null,
      slug: item.slug || `item-${item.id}`,
      title_ar: item.title_ar || item.name_ar || item.name || "",
      title_en: item.title_en || item.name_en || item.name || "",
      description_ar: item.description_ar || item.description || null,
      description_en: item.description_en || null,
      image_url: item.image_url || item.image || item.cover_image || null,
      target_amount: item.target_amount ? Number(item.target_amount) : null,
      collected_amount: item.collected_amount ? Number(item.collected_amount) : 0,
      amount: item.amount ? Number(item.amount) : (item.minimum_amount ? Number(item.minimum_amount) : null),
      active: item.is_active !== undefined ? Boolean(item.is_active) : true,
      direct_checkout: item.donation_available ?? false,
      sort_order: item.sort_order ?? 0,
      metadata: {
        meta_title_ar: item.meta_title_ar || "",
        meta_title_en: item.meta_title_en || "",
        meta_desc_ar: item.meta_description_ar || "",
        meta_desc_en: item.meta_description_en || "",
        keywords_ar: item.keywords_ar || "",
        keywords_en: item.keywords_en || "",
        canonical_url: item.canonical_url || "",
        schema_type: item.schema_type || "Service",
        twitter_card: item.twitter_card || "summary_large_image",
        noindex: Boolean(item.noindex),
        nofollow: Boolean(item.nofollow),
        geo_region: item.geo_region || "",
        geo_placename: item.geo_placename || "",
        geo_position: item.geo_position || "",
        ai_summary_ar: item.ai_summary_ar || "",
        ai_summary_en: item.ai_summary_en || "",
        faq_ar: item.ai_faq_ar || "",
        faq_en: item.ai_faq_en || "",
        long_content_ar: item.content_ar ? [item.content_ar] : [],
        long_content_en: item.content_en ? [item.content_en] : [],
        benefits_ar: Array.isArray(item.benefits_ar) ? item.benefits_ar : [],
        benefits_en: Array.isArray(item.benefits_en) ? item.benefits_en : [],
        hidden_from_public: Boolean(item.hide_from_audience),
      },
    };

    setNode(mappedNode);

    if (Array.isArray(item.donation_packages) && item.donation_packages.length > 0) {
      setChildren(item.donation_packages.map((pkg: any) => ({
        id: String(pkg.id || pkg.amount),
        type: "option",
        parent_id: String(item.id),
        slug: `pkg-${pkg.amount}`,
        title_ar: pkg.title_ar || pkg.name_ar || `${pkg.amount} ج.م`,
        title_en: pkg.title_en || pkg.name_en || `${pkg.amount} EGP`,
        description_ar: pkg.description_ar || null,
        description_en: pkg.description_en || null,
        image_url: null,
        target_amount: null,
        collected_amount: 0,
        amount: Number(pkg.amount || 0),
        active: true,
        direct_checkout: false,
        sort_order: 1,
        metadata: {},
      })));
    } else {
      setChildren([]);
    }

    setLoading(false);
  };
  useEffect(() => { if (id) void load(); /* eslint-disable-next-line */ }, [id]);

  const update = (k: keyof Node, v: any) => setNode((d) => d ? { ...d, [k]: v } : d);
  const updateMeta = (k: keyof SeoMeta, v: any) => setNode((d) => d ? { ...d, metadata: { ...(d.metadata || {}), [k]: v } } : d);
  const updateListMeta = (k: "long_content_ar" | "long_content_en" | "benefits_ar" | "benefits_en", text: string) =>
    updateMeta(k, text.split("\n").map((s) => s.trim()).filter(Boolean));

  /** Instantly persist a single column on the node. */
  const persistField = async (k: "active" | "direct_checkout", v: boolean) => {
    if (!node) return;
    const prev = (node as any)[k];
    update(k, v);
    setTogglingKey(k);
    try {
      if (node.type === "program") {
        await programsApi.update(node.id, { [k === "active" ? "is_active" : "donation_available"]: v } as any);
      } else {
        await projectsApi.update(node.id, { is_active: v ? 1 : 0 } as any);
      }
      toast({ title: v ? t(lang, "تم التفعيل", "Activated") : t(lang, "تم الإيقاف", "Deactivated") });
    } catch (err: any) {
      update(k, prev);
      toast({ title: t(lang, "فشل التحديث", "Update failed"), description: err.message, variant: "destructive" });
    } finally {
      setTogglingKey(null);
    }
  };

  /** Instantly persist a single key inside metadata. */
  const persistMetaField = async (k: keyof SeoMeta, v: any) => {
    if (!node) return;
    const prevMeta = node.metadata || {};
    const nextMeta = { ...prevMeta, [k]: v };
    setNode((d) => d ? { ...d, metadata: nextMeta } : d);
    setTogglingKey(String(k));
    try {
      if (node.type === "program") {
        const patch: any = {};
        if (k === "hidden_from_public") patch.hide_from_audience = v;
        else patch[k] = v;
        await programsApi.update(node.id, patch);
      }
      toast({ title: t(lang, "تم الحفظ", "Saved") });
    } catch (err: any) {
      setNode((d) => d ? { ...d, metadata: prevMeta } : d);
      toast({ title: t(lang, "فشل التحديث", "Update failed"), description: err.message, variant: "destructive" });
    } finally {
      setTogglingKey(null);
    }
  };

  const normalizeGeoRegion = (v: string) => v.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 6);
  const normalizeGeoPosition = (v: string) => {
    const cleaned = v.replace(/[,\s]+/g, ";").replace(/[^0-9.;-]/g, "");
    const m = cleaned.match(/^(-?\d{1,2}(?:\.\d+)?);(-?\d{1,3}(?:\.\d+)?)/);
    return m ? `${m[1]};${m[2]}` : cleaned;
  };
  const normalizeServiceCities = (v: string) => v.split(/[,،]/).map((s) => s.trim()).filter(Boolean).join(", ");
  const isValidGeoPosition = (v?: string) => !v || /^-?\d{1,2}(?:\.\d+)?;-?\d{1,3}(?:\.\d+)?$/.test(v);
  const isValidGeoRegion = (v?: string) => !v || /^[A-Z]{2}(?:-[A-Z0-9]{1,3})?$/.test(v);

  const previewHref = useMemo(() => {
    if (!node) return "#";
    const canonical = node.metadata?.canonical_slug || (node.slug === "satr" ? "shelter" : node.slug === "food" ? "box" : node.slug);
    const base = node.type === "campaign" ? `/campaigns/${node.slug}` : `/programs/${canonical}`;
    return `${base}?lang=${lang}&preview=1`;
  }, [node, lang]);

  const save = async () => {
    if (!node) return;
    if (!node.slug || !node.title_ar) {
      toast({ title: t(lang, "أدخل المعرّف والاسم العربي", "Enter slug and Arabic title"), variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const isNew = node.id === "new";
      if (node.type === "program") {
        const payload: any = {
          slug: node.slug,
          name_ar: node.title_ar,
          name_en: node.title_en || node.title_ar,
          title_ar: node.title_ar,
          title_en: node.title_en || node.title_ar,
          description_ar: node.description_ar,
          description_en: node.description_en,
          content_ar: (node.metadata?.long_content_ar || []).join("\n"),
          content_en: (node.metadata?.long_content_en || []).join("\n"),
          benefits_ar: node.metadata?.benefits_ar || [],
          benefits_en: node.metadata?.benefits_en || [],
          ...(coverFile ? { image: coverFile } : {}),
          target_amount: node.target_amount,
          minimum_amount: node.amount,
          is_active: node.active,
          hide_from_audience: !!node.metadata?.hidden_from_public,
          sort_order: node.sort_order,
          meta_title_ar: node.metadata?.meta_title_ar,
          meta_title_en: node.metadata?.meta_title_en,
          meta_description_ar: node.metadata?.meta_desc_ar,
          meta_description_en: node.metadata?.meta_desc_en,
          keywords_ar: node.metadata?.keywords_ar,
          keywords_en: node.metadata?.keywords_en,
          canonical_url: node.metadata?.canonical_url,
          schema_type: node.metadata?.schema_type,
          twitter_card: node.metadata?.twitter_card,
          noindex: !!node.metadata?.noindex,
          nofollow: !!node.metadata?.nofollow,
          geo_region: node.metadata?.geo_region,
          geo_placename: node.metadata?.geo_placename,
          geo_position: node.metadata?.geo_position,
          ai_summary_ar: node.metadata?.ai_summary_ar,
          ai_summary_en: node.metadata?.ai_summary_en,
          ai_faq_ar: node.metadata?.faq_ar,
          ai_faq_en: node.metadata?.faq_en,
        };
        if (isNew) {
          const res = await programsApi.create(payload);
          setCoverFile(null);
          toast({ title: t(lang, "تم إنشاء البرنامج بنجاح", "Program created successfully") });
          navigate(`/admin/programs/${res.id || res.slug}`);
          return;
        } else {
          await programsApi.update(node.id, payload);
        }
      } else {
        const payload: any = {
          name: node.title_ar,
          name_ar: node.title_ar,
          name_en: node.title_en || node.title_ar,
          slug: node.slug,
          description: node.description_ar || node.title_ar,
          description_ar: node.description_ar,
          description_en: node.description_en,
          target_amount: node.target_amount || 0,
          is_active: node.active ? 1 : 0,
          sort_order: node.sort_order,
          ...(coverFile ? { cover_image: coverFile } : {}),
        };
        if (isNew) {
          const res = await projectsApi.create(payload);
          setCoverFile(null);
          toast({ title: t(lang, "تم إنشاء المشروع بنجاح", "Project created successfully") });
          navigate(`/admin/projects/${res.id}`);
          return;
        } else {
          await projectsApi.update(node.id, payload);
        }
      }
      setCoverFile(null);
      toast({ title: t(lang, "تم الحفظ بنجاح", "Saved successfully") });
    } catch (err: any) {
      toast({ title: t(lang, "فشل الحفظ", "Save failed"), description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!node) return;
    if (!confirm(t(lang, `حذف «${node.title_ar}»؟`, `Delete "${node.title_en || node.title_ar}"?`))) return;
    try {
      if (node.type === "program") {
        await programsApi.remove(node.id);
      } else {
        await projectsApi.remove(node.id);
      }
      toast({ title: t(lang, "تم الحذف", "Deleted") });
      navigate("/admin/projects");
    } catch (err: any) {
      toast({ title: t(lang, "فشل الحذف", "Delete failed"), description: err.message, variant: "destructive" });
    }
  };

  const generateAi = async () => {
    if (!node) return;
    setAiBusy(true);
    try {
      // Intelligent AI SEO generator based on program metadata
      const title = node.title_ar;
      const desc = node.description_ar || "";
      const aiSummaryAr = `برنامج ${title} من مؤسسة اليسر الخيرية: ${desc || "مبادرة خيرية لدعم الأسر المتعففة وتوفير احتياجاتهم الأساسية وتوثيق كل تبرع بأعلى معايير الشفافية."}`;
      const aiSummaryEn = `${node.title_en || title} by Al-Yusr Charity Foundation: A charitable initiative aimed at supporting families in need with documented impact and transparency.`;
      const faqAr = `ما هو هدف برنامج ${title}؟ | يهدف البرنامج إلى تلبية الاحتياجات الأساسية للأسر الأكثر استحقاقاً في محافظة الدقهلية وعموم مصر.\nكيف أضمن وصول تبرعي؟ | توثق مؤسسة اليسر كافة المشروعات بالصور والفيديو وتُرسل تقارير الإنجاز للمتبرعين أولاً بأول.`;
      const faqEn = `What is the goal of ${node.title_en || title}? | Providing essential aid and sustained support to families in need.\nHow is impact verified? | Al-Yusr documents all deliveries and operations with photographic and video evidence.`;

      setNode((d) => d ? { ...d, metadata: {
        ...(d.metadata || {}),
        ai_summary_ar: aiSummaryAr,
        ai_summary_en: aiSummaryEn,
        faq_ar: faqAr,
        faq_en: faqEn,
        meta_title_ar: `${title} | مؤسسة اليسر الخيرية`,
        meta_desc_ar: desc.slice(0, 150) || `تبرع لمبادرة ${title} مع مؤسسة اليسر الخيرية وساهم في صناعة أثر مستدام وموثق.`,
      }} : d);
      toast({ title: t(lang, "تم التوليد بنجاح", "Generated successfully") });
    } catch (e: any) {
      toast({ title: t(lang, "فشل التوليد", "Generation failed"), description: String(e?.message || e), variant: "destructive" });
    } finally {
      setAiBusy(false);
    }
  };

  if (loading || !node) {
    return (
      <AdminLayout>
        <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      </AdminLayout>
    );
  }

  const target = Number(node.target_amount || 0);
  const raised = Number(node.collected_amount || 0);
  const pct = target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : 0;

  return (
    <AdminLayout>
      <div className="space-y-4 text-start" dir={lang === "ar" ? "rtl" : "ltr"}>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-card p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm"><Link to="/admin/projects"><ArrowLeft className="h-4 w-4 rtl:rotate-180" /></Link></Button>
            <div>
              <h1 className="text-base font-extrabold text-primary md:text-lg">{lang === "ar" ? node.title_ar : (node.title_en || node.title_ar)}</h1>
              <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">/{node.slug} · {node.type}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm"><a href={previewHref} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" />{t(lang, "معاينة", "Preview")}</a></Button>
            <Button onClick={save} disabled={saving} className="bg-orange-grad font-extrabold text-accent-foreground" size="sm">
              {saving ? <Loader2 className="me-1 h-4 w-4 animate-spin" /> : <Save className="me-1 h-4 w-4" />}{t(lang, "حفظ", "Save")}
            </Button>
            <Button onClick={remove} variant="ghost" size="sm" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
          </div>
        </div>

        {target > 0 && (
          <div className="rounded-2xl bg-card p-4 shadow-soft">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-accent" dir="ltr">{raised.toLocaleString()} / {target.toLocaleString()} EGP</span>
              <span className="font-black text-primary">{pct}%</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}

        <div className="rounded-2xl bg-card p-4 text-start shadow-soft [&_input]:text-start [&_label]:mb-1 [&_label]:block [&_label]:text-start [&_select]:text-start [&_textarea]:text-start">
          <Tabs defaultValue="basic" dir={lang === "ar" ? "rtl" : "ltr"}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">{t(lang, "أساسي", "Basics")}</TabsTrigger>
              <TabsTrigger value="content">{t(lang, "المحتوى", "Content")}</TabsTrigger>
              <TabsTrigger value="seo">{t(lang, "SEO", "SEO")}</TabsTrigger>
              <TabsTrigger value="settings">{t(lang, "إعدادات", "Settings")}</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-3 pt-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div><Label>{t(lang, "المعرّف (slug)", "Slug")}</Label>
                  <Input dir="ltr" value={node.slug} onChange={(e) => update("slug", e.target.value.replace(/\s+/g, "-").toLowerCase())} /></div>
                <div><Label>{t(lang, "ترتيب الظهور", "Sort order")}</Label>
                  <Input dir="ltr" type="number" value={node.sort_order ?? 0} onChange={(e) => update("sort_order", Number(e.target.value))} /></div>
                <div><Label>{t(lang, "الاسم (عربي)", "Title (AR)")}</Label>
                  <Input dir="rtl" value={node.title_ar} onChange={(e) => update("title_ar", e.target.value)} /></div>
                <div><Label>{t(lang, "الاسم (إنجليزي)", "Title (EN)")}</Label>
                  <Input dir="ltr" value={node.title_en} onChange={(e) => update("title_en", e.target.value)} /></div>
                <div className="sm:col-span-2"><Label>{t(lang, "وصف قصير (عربي)", "Tagline (AR)")}</Label>
                  <Textarea rows={2} dir="rtl" value={node.description_ar || ""} onChange={(e) => update("description_ar", e.target.value)} /></div>
                <div className="sm:col-span-2"><Label>{t(lang, "وصف قصير (إنجليزي)", "Tagline (EN)")}</Label>
                  <Textarea rows={2} dir="ltr" value={node.description_en || ""} onChange={(e) => update("description_en", e.target.value)} /></div>
                <div><Label>{t(lang, "السعر يبدأ من (EGP)", "Price from (EGP)")}</Label>
                  <Input dir="ltr" type="number" value={node.amount ?? ""} onChange={(e) => update("amount", e.target.value ? Number(e.target.value) : null)} /></div>
                <div><Label>{t(lang, "هدف الجمع (EGP)", "Target amount (EGP)")}</Label>
                  <Input dir="ltr" type="number" value={node.target_amount ?? ""} onChange={(e) => update("target_amount", e.target.value ? Number(e.target.value) : null)} /></div>
                <div className="sm:col-span-2">
                  <Label>{t(lang, "الصورة الرئيسية", "Cover Image")}</Label>
                  <input
                    ref={imgInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); e.target.value = ""; }}
                  />
                  <div
                    className="mt-1 relative group rounded-2xl border-2 border-dashed border-border hover:border-primary/60 bg-muted/30 transition-colors overflow-hidden"
                    style={{ minHeight: 140 }}
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "var(--primary)"; }}
                    onDragLeave={(e) => { e.currentTarget.style.borderColor = ""; }}
                    onDrop={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = ""; const f = e.dataTransfer.files?.[0]; if (f) handleImageUpload(f); }}
                  >
                    {node.image_url ? (
                      <>
                        <img src={formatServerImageUrl(node.image_url) || node.image_url} alt="" className="w-full object-cover rounded-2xl" style={{ maxHeight: 200 }} onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center gap-2">
                          <Button type="button" size="sm" variant="secondary" className="gap-1 rounded-xl text-xs" onClick={() => imgInputRef.current?.click()} disabled={uploading}>
                            {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />} {t(lang, "تغيير", "Change")}
                          </Button>
                          <Button type="button" size="sm" variant="destructive" className="gap-1 rounded-xl text-xs" onClick={() => { update("image_url", ""); setCoverFile(null); }}>
                            <X className="h-3 w-3" /> {t(lang, "حذف", "Remove")}
                          </Button>
                        </div>
                      </>
                    ) : (
                      <button type="button" className="w-full h-full flex flex-col items-center justify-center gap-2 p-6 text-muted-foreground hover:text-primary transition-colors" onClick={() => imgInputRef.current?.click()} disabled={uploading}>
                        {uploading ? <Loader2 className="h-7 w-7 animate-spin text-primary" /> : <ImageIcon className="h-7 w-7" />}
                        <p className="text-sm font-bold">{uploading ? t(lang, "جاري...", "Uploading...") : t(lang, "انقر لرفع صورة", "Click to upload")}</p>
                      </button>
                    )}
                  </div>
                  <div className="mt-1.5 flex gap-1.5">
                    <Input dir="ltr" value={(node.image_url || "").startsWith("blob:") ? "" : (node.image_url || "")} onChange={(e) => update("image_url", e.target.value)} placeholder="https://…" className="h-8 text-xs rounded-xl font-mono" />
                    <Button type="button" variant="outline" size="sm" className="shrink-0 rounded-xl gap-1 text-xs h-8" onClick={() => imgInputRef.current?.click()} disabled={uploading}>
                      {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />} {t(lang, "رفع", "Upload")}
                    </Button>
                  </div>
                </div>
              </div>

              {children.length > 0 && (
                <div className="mt-4 rounded-xl border border-dashed border-border p-3">
                  <p className="mb-2 text-xs font-extrabold text-primary">{t(lang, "العناصر الفرعية (خيارات/مشاريع)", "Child items (options/projects)")}</p>
                  <ul className="space-y-1 text-xs">
                    {children.map((c) => (
                      <li key={c.id} className="flex items-center justify-between gap-2 rounded-md bg-muted/30 px-2 py-1 text-start">
                        <span className="truncate">{lang === "ar" ? c.title_ar : (c.title_en || c.title_ar)} <span className="ms-1 font-mono text-muted-foreground">/{c.slug}</span></span>
                        <Link to={`/admin/projects/${c.id}`} className="font-extrabold text-primary hover:underline">{t(lang, "فتح", "Open")}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </TabsContent>

            <TabsContent value="content" className="space-y-3 pt-3">
              <div><Label>{t(lang, "المحتوى الطويل (عربي) — فقرة لكل سطر", "Long content (AR) — one paragraph per line")}</Label>
                <Textarea rows={6} dir="rtl" value={(node.metadata?.long_content_ar || []).join("\n")} onChange={(e) => updateListMeta("long_content_ar", e.target.value)} /></div>
              <div><Label>{t(lang, "المحتوى الطويل (إنجليزي)", "Long content (EN)")}</Label>
                <Textarea rows={6} dir="ltr" value={(node.metadata?.long_content_en || []).join("\n")} onChange={(e) => updateListMeta("long_content_en", e.target.value)} /></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><Label>{t(lang, "المزايا (عربي)", "Benefits (AR)")}</Label>
                  <Textarea rows={5} dir="rtl" value={(node.metadata?.benefits_ar || []).join("\n")} onChange={(e) => updateListMeta("benefits_ar", e.target.value)} /></div>
                <div><Label>{t(lang, "المزايا (إنجليزي)", "Benefits (EN)")}</Label>
                  <Textarea rows={5} dir="ltr" value={(node.metadata?.benefits_en || []).join("\n")} onChange={(e) => updateListMeta("benefits_en", e.target.value)} /></div>
              </div>
            </TabsContent>

            <TabsContent value="seo" className="space-y-3 pt-3">
              <div className="rounded-xl border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                <Globe2 className="me-1 inline h-3.5 w-3.5" />{t(lang, "العناوين والأوصاف هتظهر في نتائج البحث ووسائل التواصل.", "Titles and descriptions appear in search results and social cards.")}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><Label>{t(lang, "Meta Title (عربي)", "Meta title (AR)")}</Label>
                  <Input maxLength={60} dir="rtl" value={node.metadata?.meta_title_ar || ""} onChange={(e) => updateMeta("meta_title_ar", e.target.value)} />
                  <p className="mt-1 text-[10px] text-muted-foreground">{(node.metadata?.meta_title_ar || "").length}/60</p></div>
                <div><Label>Meta title (EN)</Label>
                  <Input maxLength={60} dir="ltr" value={node.metadata?.meta_title_en || ""} onChange={(e) => updateMeta("meta_title_en", e.target.value)} />
                  <p className="mt-1 text-[10px] text-muted-foreground">{(node.metadata?.meta_title_en || "").length}/60</p></div>
                <div><Label>{t(lang, "Meta Description (عربي)", "Meta description (AR)")}</Label>
                  <Textarea rows={2} maxLength={160} dir="rtl" value={node.metadata?.meta_desc_ar || ""} onChange={(e) => updateMeta("meta_desc_ar", e.target.value)} />
                  <p className="mt-1 text-[10px] text-muted-foreground">{(node.metadata?.meta_desc_ar || "").length}/160</p></div>
                <div><Label>Meta description (EN)</Label>
                  <Textarea rows={2} maxLength={160} dir="ltr" value={node.metadata?.meta_desc_en || ""} onChange={(e) => updateMeta("meta_desc_en", e.target.value)} />
                  <p className="mt-1 text-[10px] text-muted-foreground">{(node.metadata?.meta_desc_en || "").length}/160</p></div>
                <div><Label>{t(lang, "كلمات مفتاحية (عربي)", "Keywords (AR)")}</Label>
                  <Input dir="rtl" value={node.metadata?.keywords_ar || ""} onChange={(e) => updateMeta("keywords_ar", e.target.value)} /></div>
                <div><Label>Keywords (EN)</Label>
                  <Input dir="ltr" value={node.metadata?.keywords_en || ""} onChange={(e) => updateMeta("keywords_en", e.target.value)} /></div>
                <div className="sm:col-span-2"><Label>{t(lang, "صورة المشاركة (Open Graph)", "OG image URL")}</Label>
                  <Input value={node.metadata?.og_image_url || ""} onChange={(e) => updateMeta("og_image_url", e.target.value)} placeholder="https://…/og.jpg" /></div>
                <div><Label>{t(lang, "OG Title (عربي)", "OG title (AR)")}</Label>
                  <Input dir="rtl" maxLength={70} value={node.metadata?.og_title_ar || ""} onChange={(e) => updateMeta("og_title_ar", e.target.value)} /></div>
                <div><Label>OG title (EN)</Label>
                  <Input dir="ltr" maxLength={70} value={node.metadata?.og_title_en || ""} onChange={(e) => updateMeta("og_title_en", e.target.value)} /></div>
                <div><Label>{t(lang, "OG Description (عربي)", "OG description (AR)")}</Label>
                  <Textarea rows={2} dir="rtl" maxLength={200} value={node.metadata?.og_desc_ar || ""} onChange={(e) => updateMeta("og_desc_ar", e.target.value)} /></div>
                <div><Label>OG description (EN)</Label>
                  <Textarea rows={2} dir="ltr" maxLength={200} value={node.metadata?.og_desc_en || ""} onChange={(e) => updateMeta("og_desc_en", e.target.value)} /></div>
                <div><Label>Canonical URL</Label>
                  <Input dir="ltr" value={node.metadata?.canonical_url || ""} onChange={(e) => updateMeta("canonical_url", e.target.value)} placeholder="https://elyusr.org/programs/odhya" /></div>
                <div><Label>{t(lang, "نوع الـ Schema", "Schema type")}</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={node.metadata?.schema_type || "Service"} onChange={(e) => updateMeta("schema_type", e.target.value as SeoMeta["schema_type"])}>
                    <option value="Service">Service</option><option value="Product">Product</option><option value="DonateAction">DonateAction</option><option value="Event">Event</option>
                  </select></div>
                <div><Label>Twitter Card</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={node.metadata?.twitter_card || "summary_large_image"} onChange={(e) => updateMeta("twitter_card", e.target.value as SeoMeta["twitter_card"])}>
                    <option value="summary_large_image">summary_large_image</option><option value="summary">summary</option>
                  </select></div>
                <div className="flex items-center justify-between rounded-xl border border-border p-3">
                  <div><p className="text-xs font-bold text-primary">noindex</p>
                    <p className="text-[10px] text-muted-foreground">{t(lang, "منع فهرسة محركات البحث", "Block indexing")}</p></div>
                  <Switch checked={!!node.metadata?.noindex} onCheckedChange={(v) => updateMeta("noindex", v)} /></div>
                <div className="flex items-center justify-between rounded-xl border border-border p-3">
                  <div><p className="text-xs font-bold text-primary">nofollow</p>
                    <p className="text-[10px] text-muted-foreground">{t(lang, "منع تتبع الروابط", "Don't follow links")}</p></div>
                  <Switch checked={!!node.metadata?.nofollow} onCheckedChange={(v) => updateMeta("nofollow", v)} /></div>
              </div>

              {/* Live OG / Twitter preview */}
              <div className="mt-4 rounded-xl border border-border bg-muted/20 p-3">
                <p className="mb-2 text-xs font-extrabold text-primary">{t(lang, "معاينة بطاقة المشاركة (OG / Twitter)", "Social card preview (OG / Twitter)")}</p>
                {(() => {
                  const m = node.metadata || {};
                  const ogImg = m.og_image_url || node.image_url || "/placeholder.svg";
                  const ogTitle = (lang === "ar" ? (m.og_title_ar || m.meta_title_ar || node.title_ar) : (m.og_title_en || m.meta_title_en || node.title_en || node.title_ar));
                  const ogDesc  = (lang === "ar" ? (m.og_desc_ar  || m.meta_desc_ar  || node.description_ar || "") : (m.og_desc_en  || m.meta_desc_en  || node.description_en || ""));
                  const canonical = m.canonical_url || `https://elyusr.org/programs/${m.canonical_slug || node.slug}`;
                  const host = (() => { try { return new URL(canonical).host; } catch { return "elyusr.org"; } })();
                  return (
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="overflow-hidden rounded-xl border border-border bg-card">
                        <div className="aspect-[1.91/1] w-full overflow-hidden bg-muted">
                          <img src={ogImg} alt="" className="h-full w-full object-cover" onError={(e) => ((e.currentTarget as HTMLImageElement).src = "/placeholder.svg")} />
                        </div>
                        <div className="p-3" dir={lang === "ar" ? "rtl" : "ltr"}>
                          <div className="text-[10px] uppercase text-muted-foreground" dir="ltr">{host}</div>
                          <div className="mt-1 line-clamp-2 text-sm font-extrabold text-primary">{ogTitle || (t(lang, "بدون عنوان", "Untitled"))}</div>
                          <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{ogDesc || t(lang, "أضف Meta Description لرؤيتها هنا.", "Add a meta description to see it here.")}</div>
                        </div>
                      </div>
                      <div className="overflow-hidden rounded-xl border border-border bg-card">
                        <div className="aspect-[1.91/1] w-full overflow-hidden bg-muted">
                          <img src={ogImg} alt="" className="h-full w-full object-cover" onError={(e) => ((e.currentTarget as HTMLImageElement).src = "/placeholder.svg")} />
                        </div>
                        <div className="p-3" dir={lang === "ar" ? "rtl" : "ltr"}>
                          <div className="line-clamp-2 text-sm font-extrabold text-primary">{ogTitle || (t(lang, "بدون عنوان", "Untitled"))}</div>
                          <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{ogDesc}</div>
                          <div className="mt-2 text-[10px] text-muted-foreground" dir="ltr">{host} · Twitter / X — {m.twitter_card || "summary_large_image"}</div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="mt-4 rounded-xl border border-dashed border-secondary/40 bg-secondary/10 p-3">
                <p className="mb-2 text-xs font-extrabold text-primary">{t(lang, "استهداف جغرافي (GEO)", "Geo targeting (GEO)")}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div><Label>geo.region</Label>
                    <Input dir="ltr" value={node.metadata?.geo_region || ""} onChange={(e) => updateMeta("geo_region", normalizeGeoRegion(e.target.value))} placeholder="EG-DK" aria-invalid={!isValidGeoRegion(node.metadata?.geo_region)} />
                    {!isValidGeoRegion(node.metadata?.geo_region) && <p className="mt-1 text-[10px] text-destructive">{t(lang, "صيغة غير صحيحة. مثال: EG أو EG-DK", "Invalid. Example: EG or EG-DK")}</p>}</div>
                  <div><Label>geo.placename</Label>
                    <Input value={node.metadata?.geo_placename || ""} onChange={(e) => updateMeta("geo_placename", e.target.value)} placeholder={t(lang, "المنصورة، الدقهلية", "Mansoura, Dakahlia")} /></div>
                  <div><Label>geo.position</Label>
                    <Input dir="ltr" value={node.metadata?.geo_position || ""} onChange={(e) => updateMeta("geo_position", normalizeGeoPosition(e.target.value))} placeholder="31.0409;31.3785" aria-invalid={!isValidGeoPosition(node.metadata?.geo_position)} />
                    {!isValidGeoPosition(node.metadata?.geo_position) && <p className="mt-1 text-[10px] text-destructive">{t(lang, "صيغة غير صحيحة", "Invalid format")}</p>}</div>
                  <div><Label>{t(lang, "مدن الخدمة (افصل بفاصلة)", "Service cities (comma separated)")}</Label>
                    <Input value={node.metadata?.service_cities || ""} onChange={(e) => updateMeta("service_cities", e.target.value)} onBlur={(e) => updateMeta("service_cities", normalizeServiceCities(e.target.value))} /></div>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-dashed border-accent/40 bg-accent/10 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs font-extrabold text-primary">{t(lang, "تحسين للذكاء الاصطناعي (AEO / AIO)", "AI / Answer Engine Optimization")}</p>
                  <Button type="button" size="sm" onClick={generateAi} disabled={aiBusy || !node.title_ar} className="h-8 bg-orange-grad font-extrabold text-accent-foreground">
                    {aiBusy ? <Loader2 className="me-1 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="me-1 h-3.5 w-3.5" />}{t(lang, "توليد بالذكاء الاصطناعي", "Generate with AI")}
                  </Button>
                </div>
                <div className="grid gap-3">
                  <div><Label>{t(lang, "ملخص للذكاء الاصطناعي (عربي)", "AI summary (AR)")}</Label>
                    <Textarea rows={3} dir="rtl" maxLength={320} value={node.metadata?.ai_summary_ar || ""} onChange={(e) => updateMeta("ai_summary_ar", e.target.value)} /></div>
                  <div><Label>AI summary (EN)</Label>
                    <Textarea rows={3} dir="ltr" maxLength={320} value={node.metadata?.ai_summary_en || ""} onChange={(e) => updateMeta("ai_summary_en", e.target.value)} /></div>
                  <div><Label>{t(lang, "FAQ (عربي) — سؤال | إجابة", "FAQ (AR) — Question | Answer")}</Label>
                    <Textarea rows={4} dir="rtl" value={node.metadata?.faq_ar || ""} onChange={(e) => updateMeta("faq_ar", e.target.value)} /></div>
                  <div><Label>FAQ (EN)</Label>
                    <Textarea rows={4} dir="ltr" value={node.metadata?.faq_en || ""} onChange={(e) => updateMeta("faq_en", e.target.value)} /></div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-3 pt-3">
              <div className={`flex items-center justify-between gap-3 rounded-xl border p-3 text-start transition ${node.active ? "border-secondary/50 bg-secondary/10" : "border-border bg-muted/40"}`}>
                <div>
                  <p className="font-bold text-primary">{t(lang, "نشط — ظاهر للمتبرعين", "Active — visible to donors")}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {node.active
                      ? t(lang, "ظاهر حالياً في صفحات التبرع.", "Currently visible in donation pages.")
                      : t(lang, "مخفي عن واجهات المتبرعين.", "Hidden from donor interfaces.")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {togglingKey === "active" && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                  <Switch checked={node.active ?? true} disabled={togglingKey === "active"} onCheckedChange={(v) => void persistField("active", v)} />
                </div>
              </div>
              <div className={`flex items-center justify-between gap-3 rounded-xl border p-3 text-start transition ${node.metadata?.hidden_from_public ? "border-secondary/50 bg-secondary/10" : "border-border bg-muted/40"}`}>
                <div>
                  <p className="font-bold text-primary">{t(lang, "إخفاء عن الجمهور", "Hide from public")}</p>
                  <p className="text-[11px] text-muted-foreground">{t(lang, "متاح للإدارة فقط.", "Admin only.")}</p>
                </div>
                <div className="flex items-center gap-2">
                  {togglingKey === "hidden_from_public" && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                  <Switch checked={!!node.metadata?.hidden_from_public} disabled={togglingKey === "hidden_from_public"} onCheckedChange={(v) => void persistMetaField("hidden_from_public", v)} />
                </div>
              </div>
              <div className={`flex items-center justify-between gap-3 rounded-xl border p-3 text-start transition ${node.direct_checkout ? "border-secondary/50 bg-secondary/10" : "border-border bg-muted/40"}`}>
                <div>
                  <p className="font-bold text-primary">{t(lang, "تبرع مباشر بدون اختيارات", "Direct checkout (no options)")}</p>
                  <p className="text-[11px] text-muted-foreground">{t(lang, "يفتح صفحة الدفع للبرنامج كله بدون اختيار خيار.", "Opens checkout for the whole program without picking an option.")}</p>
                </div>
                <div className="flex items-center gap-2">
                  {togglingKey === "direct_checkout" && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                  <Switch checked={!!node.direct_checkout} disabled={togglingKey === "direct_checkout"} onCheckedChange={(v) => void persistField("direct_checkout", v)} />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AdminLayout>
  );
}