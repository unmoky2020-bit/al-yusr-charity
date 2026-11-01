import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle, ArrowLeft, DollarSign, Eye, FolderKanban, Globe2, Image as ImageIcon, Loader2, RefreshCw, Save,
  Sparkles, Trash2,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { ApiError, projectsApi } from "@/data/laravelApi";
import {
  apiErrorMessageAr,
  NEEDS_BACKEND_AR,
  programsAdminApi,
  projectsAdminApi,
  type AdminProjectRecord,
} from "@/data/api/programsAdminApi";
import {
  BilingualField, Field, ImageUrlField, NeedsBackendBadge, SectionCard, StringListEditor, ToggleCard,
} from "@/components/admin/programs/FormKit";
import { AiFields, GeoFields, SeoFields } from "@/components/admin/programs/SeoGeoAiFields";
import { PackagesEditor } from "@/components/admin/programs/PackagesEditor";
import { EntityFaqManager } from "@/components/admin/faq/EntityFaqManager";
import { compactPayload, diffPayload, keysMissingFromResponse, validateSeo, type SeoFormState } from "@/components/admin/programs/formUtils";
import {
  emptyProjectForm,
  projectFormFromRecord,
  projectPayload,
  PROPOSED_PROJECT_KEYS,
  type ProjectForm,
} from "@/components/admin/programs/projectForm";
import { publicUrls } from "@/lib/publicUrls";
import { getProjectPageMeta, parsePageContent, projectPageColumn } from "@/data/projectPages";
import { mergeCampaignContent, type CampaignPageContent } from "@/data/campaignPages/types";
import { CtaPanel, HadithPanel, HeroPanel, SectionsPanel, StatsPanel } from "@/components/admin/CampaignPageContentEditor";

const triggerCls = "rounded-xl px-3 py-2 text-xs font-bold data-[state=active]:bg-card data-[state=active]:shadow-xs";

type InstantKey = "is_active" | "hide_from_audience" | "donation_available";

export default function AdminProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === "new";
  const navigate = useNavigate();

  const [record, setRecord] = useState<AdminProjectRecord | null>(null);
  const [form, setForm] = useState<ProjectForm>(emptyProjectForm);
  const [origForm, setOrigForm] = useState<ProjectForm>(emptyProjectForm);
  const [loading, setLoading] = useState(!isNew);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState<InstantKey | null>(null);
  const [notSaved, setNotSaved] = useState<string[]>([]);

  // Landing-page content (only for projects that have their own page, e.g. waqf → /farm).
  // Saved on the project as `page_content` (proposed column, backend-handoff/04-programs-projects.md).
  const pageMeta = getProjectPageMeta(record?.slug ?? null);
  const [pageContent, setPageContent] = useState<CampaignPageContent | null>(null);
  const [pageDefaults, setPageDefaults] = useState<CampaignPageContent | null>(null);
  const [origPageJson, setOrigPageJson] = useState("");
  useEffect(() => {
    let alive = true;
    if (!pageMeta) { setPageContent(null); setPageDefaults(null); setOrigPageJson(""); return; }
    void pageMeta.load().then((defs) => {
      if (!alive) return;
      const merged = mergeCampaignContent(defs, parsePageContent((record as Record<string, unknown> | null)?.page_content));
      setPageDefaults(defs);
      setPageContent(merged);
      setOrigPageJson(JSON.stringify(projectPageColumn(merged)));
    });
    return () => { alive = false; };
  }, [pageMeta, record]);

  const applyRecord = useCallback((p: AdminProjectRecord) => {
    const f = projectFormFromRecord(p);
    setRecord(p);
    setForm(f);
    setOrigForm(f);
  }, []);

  const load = useCallback(async () => {
    if (isNew || !id) return;
    setLoading(true);
    setLoadError("");
    try {
      let rec: AdminProjectRecord | null = null;
      try {
        rec = await projectsAdminApi.get(id);
      } catch (err) {
        if (!(err instanceof ApiError && err.status === 404)) throw err;
        // Not a project id: maybe a slug, or a program id (old links from the content screen).
        const all = await projectsApi.listAll();
        const bySlug = all.find((p) => p.slug === id);
        if (bySlug) {
          rec = await projectsAdminApi.get(bySlug.id);
        } else {
          try {
            const prog = await programsAdminApi.get(id);
            if (prog?.id) {
              toast({ title: "هذا العنصر برنامج وليس مشروعاً", description: "تم تحويلك إلى محرر البرامج." });
              navigate(`/admin/programs/${prog.id}`, { replace: true });
              return;
            }
          } catch {
            /* fall through to not found */
          }
          throw new Error("المشروع غير موجود في الخادم");
        }
      }
      applyRecord(rec);
    } catch (err) {
      setLoadError(apiErrorMessageAr(err));
    } finally {
      setLoading(false);
    }
  }, [id, isNew, applyRecord, navigate]);

  useEffect(() => {
    if (isNew) {
      const f = emptyProjectForm();
      setRecord(null);
      setForm(f);
      setOrigForm(f);
      setLoading(false);
      return;
    }
    void load();
  }, [isNew, load]);

  /** A proposed column is "supported" once the live record returns it. */
  const supported = (key: string) => (record ? key in record : !PROPOSED_PROJECT_KEYS.includes(key));
  const pendingBadge = (keys: string[]) => (keys.some((k) => !supported(k)) ? <NeedsBackendBadge /> : null);

  const set = <K extends keyof ProjectForm>(key: K, val: ProjectForm[K]) => setForm((f) => ({ ...f, [key]: val }));
  const setSeo = (p: Partial<SeoFormState>) => setForm((f) => ({ ...f, seo: { ...f.seo, ...p } }));

  const diff = useMemo(() => {
    const base = diffPayload(projectPayload(form), projectPayload(origForm));
    if (pageContent && JSON.stringify(projectPageColumn(pageContent)) !== origPageJson) base.page_content = projectPageColumn(pageContent);
    return base;
  }, [form, origForm, pageContent, origPageJson]);
  const dirty = Object.keys(diff).length > 0;

  const save = async () => {
    if (!form.name.trim()) {
      toast({ variant: "destructive", title: "حقل مطلوب", description: "اكتب اسم المشروع بالعربية" });
      return;
    }
    const seoErrors = validateSeo(form.seo);
    if (seoErrors.length) {
      toast({ variant: "destructive", title: "راجع حقول SEO / GEO", description: seoErrors.join(" — ") });
      return;
    }
    if (!isNew && !dirty) {
      toast({ title: "لا توجد تغييرات للحفظ" });
      return;
    }
    setSaving(true);
    let projectId: number | string | undefined = isNew ? undefined : record?.id ?? id;
    let returned: unknown = null;
    let sent: Record<string, unknown> = {};
    try {
      if (isNew) {
        sent = compactPayload(projectPayload(form));
        const created = await projectsAdminApi.create(sent);
        returned = created;
        projectId = created?.id;
        if (!projectId) throw new Error("لم يرجع الخادم رقم المشروع الجديد");
      } else if (Object.keys(diff).length) {
        sent = diff;
        returned = await projectsAdminApi.update(projectId!, diff);
      }
    } catch (err) {
      toast({ variant: "destructive", title: "فشل حفظ المشروع", description: apiErrorMessageAr(err) });
      setSaving(false);
      return;
    }

    const missing = keysMissingFromResponse(sent, returned);
    setNotSaved(missing);
    if (missing.length) {
      toast({
        variant: "destructive",
        title: `تم حفظ الحقول الأساسية فقط — ${NEEDS_BACKEND_AR}`,
        description: `الخادم تجاهل: ${missing.join("، ")}`,
      });
    } else {
      toast({ title: isNew ? "تم إنشاء المشروع" : "تم حفظ التعديلات" });
    }
    setSaving(false);
    if (isNew && projectId) {
      navigate(`/admin/projects/${projectId}`, { replace: true });
    } else {
      await load();
    }
  };

  /** Instant toggles: really call PUT /projects/{id} and verify the column came back. */
  const persistToggle = async (key: InstantKey, value: boolean) => {
    if (isNew || !record) {
      set(key, value);
      return;
    }
    const prev = form[key];
    set(key, value);
    setToggling(key);
    try {
      const res = await projectsAdminApi.update(record.id, { [key]: value });
      const rec = res as Record<string, unknown> | null;
      if (rec && "id" in rec && !(key in rec)) {
        set(key, prev);
        toast({
          variant: "destructive",
          title: NEEDS_BACKEND_AR,
          description: `العمود ${key} غير موجود في جدول المشاريع بعد، لم يتم حفظ التغيير.`,
        });
        return;
      }
      setOrigForm((f) => ({ ...f, [key]: value }));
      toast({ title: value ? "تم التفعيل" : "تم الإيقاف" });
    } catch (err) {
      set(key, prev);
      toast({ variant: "destructive", title: "فشل التحديث", description: apiErrorMessageAr(err) });
    } finally {
      setToggling(null);
    }
  };

  const remove = async () => {
    if (!record) return;
    if (!window.confirm(`حذف «${form.name}» نهائياً؟`)) return;
    try {
      await projectsAdminApi.remove(record.id);
      toast({ title: "تم حذف المشروع" });
      navigate("/admin/projects");
    } catch (err) {
      toast({ variant: "destructive", title: "فشل الحذف", description: apiErrorMessageAr(err) });
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      </AdminLayout>
    );
  }

  if (loadError) {
    return (
      <AdminLayout>
        <div className="mx-auto max-w-lg space-y-3 rounded-3xl border border-destructive/40 bg-card p-6 text-center" dir="rtl">
          <AlertTriangle className="mx-auto h-8 w-8 text-destructive" />
          <p className="text-sm font-bold text-foreground">تعذر تحميل المشروع</p>
          <p className="text-xs text-muted-foreground">{loadError}</p>
          <div className="flex justify-center gap-2">
            <Button variant="outline" size="sm" asChild><Link to="/admin/projects">العودة للمشاريع</Link></Button>
            <Button size="sm" onClick={() => void load()} className="gap-1"><RefreshCw className="h-3.5 w-3.5" /> إعادة المحاولة</Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const target = Number(form.target_amount || 0);
  const raised = Number(record?.collected_amount || 0);
  const pct = target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : 0;
  const contentKeys = ["description_en", "content_ar", "content_en", "benefits_ar", "benefits_en"];

  return (
    <AdminLayout>
      <div className="space-y-4 text-start" dir="rtl">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-card p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm"><Link to="/admin/projects" aria-label="العودة"><ArrowLeft className="h-4 w-4 rtl:rotate-180" /></Link></Button>
            <div>
              <div className="flex items-center gap-2">
                <FolderKanban className="h-4 w-4 text-primary" />
                <h1 className="text-base font-extrabold text-primary md:text-lg">{isNew ? "مشروع جديد" : form.name || "مشروع"}</h1>
                {dirty && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-700">تعديلات غير محفوظة</span>}
              </div>
              <p className="mt-0.5 font-mono text-[11px] text-muted-foreground" dir="ltr">{record ? `#${record.id} · /${form.slug || "-"}` : "new"}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!isNew && form.slug && (
              <Button asChild variant="outline" size="sm" className="gap-1 font-bold">
                <Link to={publicUrls.project(form.slug)} target="_blank" rel="noreferrer"><Eye className="h-3.5 w-3.5" /> معاينة بالموقع</Link>
              </Button>
            )}
            <Button onClick={save} disabled={saving} className="bg-orange-grad font-extrabold text-accent-foreground" size="sm">
              {saving ? <Loader2 className="me-1 h-4 w-4 animate-spin" /> : <Save className="me-1 h-4 w-4" />} حفظ
            </Button>
            {record && (
              <Button onClick={remove} variant="ghost" size="sm" className="text-destructive hover:text-destructive" aria-label="حذف">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {notSaved.length > 0 && (
          <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
            <b>{NEEDS_BACKEND_AR}:</b> الخادم لم يحفظ هذه الحقول لأنها غير موجودة في جدول المشاريع بعد: {notSaved.join("، ")}
          </div>
        )}

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

        <Tabs defaultValue="basic" dir="rtl" className="space-y-4">
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 rounded-2xl bg-muted/60 p-1" dir="rtl">
            <TabsTrigger value="basic" className={triggerCls}>البيانات الأساسية</TabsTrigger>
            <TabsTrigger value="content" className={triggerCls}>المحتوى والمزايا</TabsTrigger>
            <TabsTrigger value="packages" className={triggerCls}>التبرع والباقات</TabsTrigger>
            <TabsTrigger value="seo" className={triggerCls}>SEO والمشاركة</TabsTrigger>
            <TabsTrigger value="geo" className={triggerCls}>الموقع الجغرافي</TabsTrigger>
            <TabsTrigger value="ai" className={triggerCls}>الأسئلة الشائعة والـ AI</TabsTrigger>
            <TabsTrigger value="visibility" className={triggerCls}>الظهور</TabsTrigger>
            {pageMeta && pageContent && <TabsTrigger value="page" className={triggerCls}>محتوى صفحة {pageMeta.name.ar}</TabsTrigger>}
          </TabsList>

          <TabsContent value="basic" className="space-y-4" dir="rtl">
            <SectionCard icon={<Globe2 className="h-4 w-4 text-primary" />} title="الاسم والوصف">
              <BilingualField label="اسم المشروع *" valueAr={form.name} valueEn={form.name_en}
                onAr={(v) => set("name", v)} onEn={(v) => set("name_en", v)} placeholderAr="مثال: محطة مياه" />
              <BilingualField label="الوصف المختصر (short_description)" multiline rows={2}
                valueAr={form.short_description} valueEn={form.short_description_en}
                onAr={(v) => set("short_description", v)} onEn={(v) => set("short_description_en", v)} />
              <BilingualField label="الوصف (description)" multiline rows={4}
                valueAr={form.description} valueEn={form.description_en}
                onAr={(v) => set("description", v)} onEn={(v) => set("description_en", v)}
                badge={pendingBadge(["description_en"])} hint="الوصف الإنجليزي عمود مقترح (description_en)" />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="الرابط المختصر (slug)">
                  <Input dir="ltr" value={form.slug} className="h-10 rounded-xl font-mono text-xs"
                    onChange={(e) => set("slug", e.target.value.trim().toLowerCase().replace(/\s+/g, "-"))} />
                </Field>
                <Field label="ترتيب العرض (display_order)">
                  <Input dir="ltr" type="number" value={form.display_order} className="h-10 rounded-xl" onChange={(e) => set("display_order", e.target.value)} />
                </Field>
              </div>
            </SectionCard>
            <SectionCard icon={<ImageIcon className="h-4 w-4 text-primary" />} title="صورة الغلاف"
              description="ارفع صورة أو الصق رابطها — الاتنين بيتحفظوا كرابط.">
              <ImageUrlField label="صورة الغلاف" value={form.cover_image} onChange={(v) => set("cover_image", v)} collection="programs" />
            </SectionCard>
          </TabsContent>

          <TabsContent value="content" className="space-y-4" dir="rtl">
            <SectionCard icon={<Sparkles className="h-4 w-4 text-primary" />} title="المحتوى الكامل والمزايا" actions={pendingBadge(contentKeys)}
              description="أعمدة مقترحة بنفس أسماء أعمدة البرامج (content_ar/en, benefits_ar/en).">
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                <Field label="المحتوى الكامل (عربي)">
                  <Textarea dir="rtl" rows={8} value={form.content_ar} className="rounded-xl text-xs" onChange={(e) => set("content_ar", e.target.value)} />
                </Field>
                <Field label="Full content (English)">
                  <Textarea dir="ltr" rows={8} value={form.content_en} className="rounded-xl text-left text-xs" onChange={(e) => set("content_en", e.target.value)} />
                </Field>
                <Field label="المزايا (عربي)"><StringListEditor dir="rtl" value={form.benefits_ar} onChange={(v) => set("benefits_ar", v)} addLabel="إضافة ميزة" /></Field>
                <Field label="Benefits (English)"><StringListEditor dir="ltr" value={form.benefits_en} onChange={(v) => set("benefits_en", v)} addLabel="Add benefit" /></Field>
              </div>
            </SectionCard>
          </TabsContent>

          <TabsContent value="packages" className="space-y-4" dir="rtl">
            <SectionCard icon={<DollarSign className="h-4 w-4 text-primary" />} title="المبالغ">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Field label="هدف الجمع (target_amount)"><Input dir="ltr" type="number" value={form.target_amount} className="h-10 rounded-xl" onChange={(e) => set("target_amount", e.target.value)} /></Field>
                <Field label="السعر يبدأ من (starting_price)"><Input dir="ltr" type="number" value={form.starting_price} className="h-10 rounded-xl" onChange={(e) => set("starting_price", e.target.value)} /></Field>
                <Field label="المحصّل (للعرض فقط)"><Input dir="ltr" disabled value={String(raised)} className="h-10 rounded-xl" /></Field>
              </div>
            </SectionCard>
            <SectionCard icon={<DollarSign className="h-4 w-4 text-primary" />} title="باقات المساهمة"
              description="الإضافة تعمل الآن. التعديل والحذف والترتيب تحتاج المسارات المقترحة في الباك إند.">
              <PackagesEditor kind="projects" ownerId={record ? record.id : null} />
            </SectionCard>
          </TabsContent>

          {pageMeta && pageContent && (
            <TabsContent value="page" className="space-y-4" dir="rtl">
              <SectionCard icon={<Sparkles className="h-4 w-4 text-primary" />} title={`محتوى صفحة ${pageMeta.name.ar}`} actions={pendingBadge(["page_content"])}
                description={`النصوص اللي بتظهر في ${pageMeta.path}. الصورة الرئيسية = صورة الغلاف، والأسهم = باقات المساهمة، والأسئلة = تبويب الأسئلة الشائعة.`}>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" asChild><a href={pageMeta.path} target="_blank" rel="noopener noreferrer" className="gap-1"><Eye className="h-3.5 w-3.5" /> عرض الصفحة</a></Button>
                  {pageDefaults && (
                    <Button variant="ghost" size="sm" className="gap-1" onClick={() => { if (window.confirm("ترجيع كل نصوص الصفحة للنسخة الأصلية؟ (التغيير بيتحفظ لما تدوس حفظ)")) setPageContent(pageDefaults); }}>
                      <RefreshCw className="h-3.5 w-3.5" /> ترجيع النصوص الأصلية
                    </Button>
                  )}
                </div>
              </SectionCard>
              <HeroPanel value={pageContent} onChange={setPageContent} isAr />
              <StatsPanel value={pageContent} onChange={setPageContent} isAr />
              <SectionsPanel value={pageContent} onChange={setPageContent} isAr />
              <HadithPanel value={pageContent} onChange={setPageContent} isAr />
              <CtaPanel value={pageContent} onChange={setPageContent} isAr />
            </TabsContent>
          )}

          <TabsContent value="seo" className="space-y-4" dir="rtl">
            <SeoFields value={form.seo} onChange={setSeo} badge={pendingBadge(["meta_title_ar"])} previewImage={form.cover_image}
              previewTitleAr={form.name} previewDescAr={form.short_description || form.description} previewPath={`/projects/${form.slug || "slug"}`} />
          </TabsContent>

          <TabsContent value="geo" className="space-y-4" dir="rtl">
            <GeoFields value={form.seo} onChange={setSeo} badge={pendingBadge(["geo_region"])} />
          </TabsContent>

          <TabsContent value="ai" className="space-y-4" dir="rtl">
            <EntityFaqManager
              kind="project"
              saved={!isNew && !!record?.id}
              linkedCategoryId={record?.faq_category_id}
              slug={form.slug}
              nameAr={form.name}
              onLink={async (faq_category_id) => {
                await projectsAdminApi.update(record!.id, { faq_category_id });
                setRecord((r) => (r ? { ...r, faq_category_id } : r));
              }}
            />
            <AiFields value={form.seo} onChange={setSeo} badge={pendingBadge(["ai_summary_ar"])} nameAr={form.name} nameEn={form.name_en}
              descAr={form.short_description || form.description} showFaq={false} />
          </TabsContent>

          <TabsContent value="visibility" className="space-y-4" dir="rtl">
            <SectionCard icon={<Eye className="h-4 w-4 text-primary" />} title="الظهور"
              description={isNew ? "تُحفظ مع زر «حفظ»." : "كل مفتاح يُحفظ فوراً في الخادم، ويُتحقق من أن العمود موجود فعلاً."}>
              <div className="grid grid-cols-1 gap-3">
                <ToggleCard label="نشط — ظاهر للمتبرعين (is_active)" checked={form.is_active} disabled={toggling !== null}
                  onChange={(v) => void persistToggle("is_active", v)} badge={toggling === "is_active" ? <Loader2 className="h-3 w-3 animate-spin" /> : null} />
                <ToggleCard label="إخفاء عن الجمهور (hide_from_audience)" hint="متاح للإدارة فقط" checked={form.hide_from_audience}
                  disabled={toggling !== null} onChange={(v) => void persistToggle("hide_from_audience", v)}
                  badge={toggling === "hide_from_audience" ? <Loader2 className="h-3 w-3 animate-spin" /> : pendingBadge(["hide_from_audience"])} />
                <ToggleCard label="تبرع مباشر بدون اختيار باقة (donation_available)" hint="يفتح صفحة الدفع للمشروع كله مباشرة"
                  checked={form.donation_available} disabled={toggling !== null} onChange={(v) => void persistToggle("donation_available", v)}
                  badge={toggling === "donation_available" ? <Loader2 className="h-3 w-3 animate-spin" /> : pendingBadge(["donation_available"])} />
              </div>
            </SectionCard>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
