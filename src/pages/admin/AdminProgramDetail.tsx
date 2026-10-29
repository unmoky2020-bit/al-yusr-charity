import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, BookOpen, Compass, DollarSign, Globe2, Image as ImageIcon, LayoutTemplate,
  Loader2, RefreshCw, Save, Sparkles, Trash2, ExternalLink, AlertTriangle,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useLang } from "@/i18n/LangContext";
import { toast } from "@/hooks/use-toast";
import { axesApi, seasonsApi, type LaravelAxis, type LaravelSeason } from "@/data/laravelApi";
import {
  apiErrorMessageAr,
  programsAdminApi,
  type AdminProgramRecord,
} from "@/data/api/programsAdminApi";
import { BilingualField, ChoiceSelect, Field, ImageUrlField, SectionCard, ToggleCard } from "@/components/admin/programs/FormKit";
import { AiFields, GeoFields, SeoFields } from "@/components/admin/programs/SeoGeoAiFields";
import { PackagesEditor } from "@/components/admin/programs/PackagesEditor";
import { PageSectionsEditor } from "@/components/admin/programs/PageSectionsEditor";
import { EntityFaqManager } from "@/components/admin/faq/EntityFaqManager";
import {
  compactPayload,
  diffPayload,
  keysMissingFromResponse,
  validateSeo,
  type SeoFormState,
} from "@/components/admin/programs/formUtils";
import {
  emptyProgramForm,
  isTopSectionEmpty,
  programFormFromRecord,
  programPayload,
  topSectionFromRecord,
  topSectionPayload,
  type ProgramForm,
  type TopSectionForm,
} from "@/components/admin/programs/programForm";
import { publicUrls } from "@/lib/publicUrls";

const triggerCls = "rounded-xl px-3 py-2 text-xs font-bold data-[state=active]:bg-card data-[state=active]:shadow-xs";

export default function AdminProgramDetail() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === "new";
  const nav = useNavigate();

  const [axes, setAxes] = useState<LaravelAxis[]>([]);
  const [seasons, setSeasons] = useState<LaravelSeason[]>([]);
  const [record, setRecord] = useState<AdminProgramRecord | null>(null);
  const [form, setForm] = useState<ProgramForm>(emptyProgramForm);
  const [origForm, setOrigForm] = useState<ProgramForm>(emptyProgramForm);
  const [top, setTop] = useState<TopSectionForm>(() => topSectionFromRecord(null));
  const [origTop, setOrigTop] = useState<TopSectionForm>(() => topSectionFromRecord(null));
  const [loading, setLoading] = useState(!isNew);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notSaved, setNotSaved] = useState<string[]>([]);

  const applyRecord = useCallback((p: AdminProgramRecord) => {
    const f = programFormFromRecord(p);
    const t = topSectionFromRecord(p.top_section);
    setRecord(p);
    setForm(f);
    setOrigForm(f);
    setTop(t);
    setOrigTop(t);
  }, []);

  const load = useCallback(async () => {
    if (isNew || !id) return;
    setLoading(true);
    setLoadError("");
    try {
      applyRecord(await programsAdminApi.get(id));
    } catch (err) {
      setLoadError(apiErrorMessageAr(err));
    } finally {
      setLoading(false);
    }
  }, [id, isNew, applyRecord]);

  useEffect(() => {
    axesApi.list().then(setAxes).catch(() => setAxes([]));
    seasonsApi.listAll().then((s) => setSeasons(Array.isArray(s) ? s : [])).catch(() => setSeasons([]));
  }, []);

  useEffect(() => {
    if (isNew) {
      const f = emptyProgramForm();
      setRecord(null);
      setForm(f);
      setOrigForm(f);
      setTop(topSectionFromRecord(null));
      setOrigTop(topSectionFromRecord(null));
      setLoading(false);
      return;
    }
    void load();
  }, [isNew, load]);

  const set = <K extends keyof ProgramForm>(key: K, val: ProgramForm[K]) =>
    setForm((f) => {
      const next = { ...f, [key]: val };
      // "title" has no field of its own any more: it follows the name unless it was set to something else.
      if (key === "name_ar" && (!f.title_ar || f.title_ar === f.name_ar)) next.title_ar = val as string;
      if (key === "name_en" && (!f.title_en || f.title_en === f.name_en)) next.title_en = val as string;
      return next;
    });
  const setSeo = (p: Partial<SeoFormState>) => setForm((f) => ({ ...f, seo: { ...f.seo, ...p } }));
  const setT = <K extends keyof TopSectionForm>(key: K, val: TopSectionForm[K]) => setTop((t) => ({ ...t, [key]: val }));

  const programDiff = useMemo(() => diffPayload(programPayload(form), programPayload(origForm)), [form, origForm]);
  const topChanged = useMemo(
    () => JSON.stringify(topSectionPayload(top, record?.top_section)) !== JSON.stringify(topSectionPayload(origTop, record?.top_section)),
    [top, origTop, record],
  );
  const dirty = Object.keys(programDiff).length > 0 || topChanged;

  const handleSave = async () => {
    if (!form.name_ar.trim()) {
      toast({ variant: "destructive", title: "حقل مطلوب", description: "اكتب اسم البرنامج بالعربية" });
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
    const problems: string[] = [];
    let programId: number | string | undefined = isNew ? undefined : id;
    let returned: unknown = null;
    let sent: Record<string, unknown> = {};

    // 1) Program columns (JSON)
    try {
      if (isNew) {
        const payload = compactPayload(programPayload(form));
        if (!payload.axis_id && axes[0]?.id) payload.axis_id = Number(axes[0].id);
        const created = await programsAdminApi.create(payload);
        returned = created;
        sent = payload;
        programId = created?.id;
        if (!programId) throw new Error("لم يرجع الخادم رقم البرنامج الجديد");
      } else if (Object.keys(programDiff).length) {
        returned = await programsAdminApi.update(id!, programDiff);
        sent = programDiff;
      }
    } catch (err) {
      toast({ variant: "destructive", title: "فشل حفظ البرنامج", description: apiErrorMessageAr(err) });
      setSaving(false);
      return;
    }

    // 3) top_section (own endpoint)
    if (programId && (isNew ? !isTopSectionEmpty(top) : topChanged)) {
      try {
        await programsAdminApi.updateTopSection(programId, topSectionPayload(top, record?.top_section));
      } catch (err) {
        problems.push(`القسم العلوي: ${apiErrorMessageAr(err)}`);
      }
    }

    const missing = keysMissingFromResponse(sent, returned, ["season_ids", "name", "description"]);
    setNotSaved(missing);

    if (problems.length) {
      toast({ variant: "destructive", title: "تم حفظ بيانات البرنامج، لكن بعض الأجزاء فشلت", description: problems.join(" — ") });
    } else if (missing.length) {
      toast({ variant: "destructive", title: "الخادم تجاهل بعض الحقول", description: `لم تُحفظ: ${missing.join("، ")}` });
    } else {
      toast({ title: isNew ? "تم إنشاء البرنامج" : "تم حفظ التعديلات" });
    }

    setSaving(false);
    if (isNew && programId) {
      nav(`/admin/programs/${programId}`, { replace: true });
    } else {
      await load();
    }
  };

  const handleDelete = async () => {
    if (!id || isNew) return;
    if (!window.confirm("هل أنت متأكد من حذف هذا البرنامج نهائياً من قاعدة البيانات؟")) return;
    setDeleting(true);
    try {
      await programsAdminApi.remove(id);
      toast({ title: "تم حذف البرنامج" });
      nav("/admin/programs");
    } catch (err) {
      toast({ variant: "destructive", title: "فشل الحذف", description: apiErrorMessageAr(err) });
    } finally {
      setDeleting(false);
    }
  };

  const BackArrow = isAr ? ArrowRight : ArrowLeft;

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex h-[50vh] flex-col items-center justify-center gap-3 text-muted-foreground" dir="rtl">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-bold">جاري تحميل تفاصيل البرنامج…</p>
        </div>
      </AdminLayout>
    );
  }

  if (loadError) {
    return (
      <AdminLayout>
        <div className="mx-auto max-w-lg space-y-3 rounded-3xl border border-destructive/40 bg-card p-6 text-center" dir="rtl">
          <AlertTriangle className="mx-auto h-8 w-8 text-destructive" />
          <p className="text-sm font-bold text-foreground">تعذر تحميل البرنامج</p>
          <p className="text-xs text-muted-foreground">{loadError}</p>
          <div className="flex justify-center gap-2">
            <Button variant="outline" size="sm" asChild><Link to="/admin/programs">العودة للبرامج</Link></Button>
            <Button size="sm" onClick={() => void load()} className="gap-1"><RefreshCw className="h-3.5 w-3.5" /> إعادة المحاولة</Button>
          </div>
        </div>
      </AdminLayout>
    );
  }


  return (
    <AdminLayout>
      <div className="space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border/80 bg-card p-5 shadow-card sm:p-6">
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" size="icon" className="h-10 w-10 rounded-2xl border-border">
              <Link to="/admin/programs" aria-label="العودة للبرامج"><BackArrow className="h-5 w-5" /></Link>
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary"><BookOpen className="h-4 w-4" /></span>
                <h1 className="text-xl font-black text-foreground sm:text-2xl">
                  {isNew ? "إضافة برنامج جديد" : form.name_ar || "تفاصيل البرنامج"}
                </h1>
                {dirty && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-700">تعديلات غير محفوظة</span>}
              </div>
              <p className="mt-1 text-xs font-semibold text-muted-foreground">
                {isNew ? "بعد الحفظ الأول ستظهر أقسام الصفحة والباقات" : `رقم البرنامج: ${id} · ${form.slug || "-"}`}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {!isNew && form.slug && (
              <Button asChild variant="ghost" size="sm" className="gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground">
                <Link to={publicUrls.program(form.slug)} target="_blank"><ExternalLink className="h-3.5 w-3.5" /> معاينة بالموقع</Link>
              </Button>
            )}
            {!isNew && (
              <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting} className="gap-1.5 rounded-xl font-bold">
                {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} حذف
              </Button>
            )}
            <Button onClick={handleSave} disabled={saving} className="gap-1.5 rounded-xl bg-primary font-black text-primary-foreground shadow-md hover:bg-primary/95">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} حفظ التغييرات
            </Button>
          </div>
        </div>

        {notSaved.length > 0 && (
          <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
            <b>تنبيه:</b> الخادم لم يُرجع هذه الحقول بعد الحفظ، غالباً لأنها غير موجودة في الباك إند أو غير مسموح بها في التحقق: {notSaved.join("، ")}
          </div>
        )}

        {/* Quick visibility bar */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {/* What each switch does (shown under its name), so the four are never confused. */}
          <ToggleCard label="النشر" checked={form.status === "published"} onChange={(c) => set("status", c ? "published" : "draft")}
            hint={form.status === "published" ? "منشور — جاهز وبيظهر في الموقع" : "مسودة — لسه بيتجهز ومش بيظهر"} />
          <ToggleCard label="التفعيل" checked={form.is_active} onChange={(c) => set("is_active", c)}
            hint={form.is_active ? "شغّال" : "موقوف مؤقتاً — بيختفي من غير ما يتمسح"} />
          <ToggleCard label="استقبال التبرعات" checked={form.donation_available} onChange={(c) => set("donation_available", c)}
            hint={form.donation_available ? "زرار التبرع شغّال" : "الصفحة ظاهرة بس التبرع مقفول (مثلاً الموسم خلص)"} />
          <ToggleCard label="الظهور في القوائم" checked={!form.hide_from_audience} onChange={(c) => set("hide_from_audience", !c)}
            hint={form.hide_from_audience ? "مش ظاهر في قوائم البرامج — متاح بالرابط وفي فورم التبرع" : "ظاهر في صفحة البرامج والرئيسية"} />
        </div>

        <Tabs defaultValue="basic" dir="rtl" className="space-y-4">
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 rounded-2xl bg-muted/60 p-1" dir="rtl">
            <TabsTrigger value="basic" className={triggerCls}>البيانات الأساسية</TabsTrigger>
            <TabsTrigger value="hero" className={triggerCls}>أعلى الصفحة</TabsTrigger>
            <TabsTrigger value="sections" className={triggerCls}>أقسام الصفحة</TabsTrigger>
            <TabsTrigger value="content" className={triggerCls}>الوصف</TabsTrigger>
            <TabsTrigger value="packages" className={triggerCls}>التبرع والباقات</TabsTrigger>
            <TabsTrigger value="seo" className={triggerCls}>SEO والمشاركة</TabsTrigger>
            <TabsTrigger value="geo" className={triggerCls}>الموقع الجغرافي</TabsTrigger>
            <TabsTrigger value="ai" className={triggerCls}>الأسئلة الشائعة</TabsTrigger>
            <TabsTrigger value="visibility" className={triggerCls}>المحور والمواسم</TabsTrigger>
          </TabsList>

          {/* Basic */}
          <TabsContent value="basic" className="space-y-4" dir="rtl">
            <SectionCard icon={<Globe2 className="h-4 w-4 text-primary" />} title="الأسماء والعناوين">
              <BilingualField label="اسم البرنامج *" valueAr={form.name_ar} valueEn={form.name_en}
                onAr={(v) => set("name_ar", v)} onEn={(v) => set("name_en", v)} placeholderAr="مثال: كفالة طالب علم" />
              <BilingualField label="الشعار المختصر (tagline)" valueAr={form.tagline_ar} valueEn={form.tagline_en}
                onAr={(v) => set("tagline_ar", v)} onEn={(v) => set("tagline_en", v)} />
              <BilingualField label="الموسم أو الفترة (period)" valueAr={form.period_ar} valueEn={form.period_en}
                onAr={(v) => set("period_ar", v)} onEn={(v) => set("period_en", v)} placeholderAr="طوال العام" />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="الرابط المختصر (slug)" hint="يظهر في رابط الصفحة /programs/slug">
                  <Input dir="ltr" value={form.slug} placeholder="odhya" className="h-10 rounded-xl font-mono text-xs"
                    onChange={(e) => set("slug", e.target.value.trim().toLowerCase().replace(/\s+/g, "-"))} />
                </Field>
                <Field label="ترتيب العرض (sort_order)">
                  <Input dir="ltr" type="number" value={form.sort_order} className="h-10 rounded-xl" onChange={(e) => set("sort_order", e.target.value)} />
                </Field>
              </div>
            </SectionCard>
            <SectionCard icon={<ImageIcon className="h-4 w-4 text-primary" />} title="صورة البطاقة"
              description="الصورة اللي بتظهر في كروت البرامج وصورة المشاركة على السوشيال. صورة أعلى صفحة البرنامج ليها خانة منفصلة في «أعلى الصفحة».">
              <ImageUrlField label="صورة البطاقة" value={form.image} onChange={(v) => set("image", v)} collection="programs"
                hint="يفضّل 1200×900 (4:3). ارفع صورة أو الصق رابطها — الاتنين بيتحفظوا كرابط." />
            </SectionCard>
          </TabsContent>

          {/* Hero: everything shown at the top of the public program page */}
          <TabsContent value="hero" className="space-y-4" dir="rtl">
            <SectionCard icon={<LayoutTemplate className="h-4 w-4 text-primary" />} title="أعلى صفحة البرنامج"
              description="اللي بيظهر أول ما الزائر يفتح صفحة البرنامج. أي خانة فاضية بتاخد قيمتها من البيانات الأساسية (الاسم والشعار وصورة البطاقة).">
              <BilingualField label="العنوان الكبير (H1)" valueAr={form.hero_h1_ar} valueEn={form.hero_h1_en}
                onAr={(v) => set("hero_h1_ar", v)} onEn={(v) => set("hero_h1_en", v)}
                placeholderAr={form.name_ar || "اسم البرنامج"}
                hint="أهم سطر للسيو: حط فيه الكلمة اللي الناس بتدوّر بيها، مثال: صك أضحية 2026 بالمنصورة" />
              <BilingualField label="السطر تحت العنوان" multiline rows={2} valueAr={form.hero_h3_ar} valueEn={form.hero_h3_en}
                onAr={(v) => set("hero_h3_ar", v)} onEn={(v) => set("hero_h3_en", v)}
                placeholderAr={form.tagline_ar || "الشعار المختصر"} />
              <Field label="الشارة فوق العنوان" hint="مثال: برنامج معتمد — موسم الأضاحي 2026">
                <Input dir="rtl" value={top.badge_ar} className="h-10 rounded-xl" placeholder="برنامج معتمد" onChange={(e) => setT("badge_ar", e.target.value)} />
              </Field>
              <ImageUrlField label="صورة أعلى الصفحة" value={form.hero_image} onChange={(v) => set("hero_image", v)}
                collection="programs" aspect="wide"
                hint="يفضّل صورة عرضية 1600×900 أو أكبر. لو فاضية بتظهر صورة البطاقة." />
            </SectionCard>
          </TabsContent>

          {/* Page sections */}
          <TabsContent value="sections" className="space-y-4" dir="rtl">
            {isNew || !id ? (
              <div className="rounded-3xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">احفظ البرنامج أولاً لإدارة أقسام الصفحة.</div>
            ) : (
              <PageSectionsEditor programId={id} />
            )}
          </TabsContent>

          {/* Content: the short description only; benefits / steps / details live in «أقسام الصفحة» */}
          <TabsContent value="content" className="space-y-4" dir="rtl">
            <SectionCard icon={<Sparkles className="h-4 w-4 text-primary" />} title="الوصف القصير"
              description="بيظهر تحت العنوان في أعلى الصفحة وفي كروت البرامج ووصف جوجل لو خانة السيو فاضية.">
              <BilingualField label="الوصف القصير" multiline rows={3} valueAr={form.description_ar} valueEn={form.description_en}
                onAr={(v) => set("description_ar", v)} onEn={(v) => set("description_en", v)} />
            </SectionCard>
            <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4 text-xs font-semibold text-foreground/80">
              المزايا وخطوات «كيف يعمل البرنامج» والتفاصيل ورحلة التبرع بتتعدل من تاب <b>«أقسام الصفحة»</b> — هي اللي بتظهر في صفحة البرنامج.
            </div>
          </TabsContent>

          {/* Packages */}
          <TabsContent value="packages" className="space-y-4" dir="rtl">
            <SectionCard icon={<DollarSign className="h-4 w-4 text-primary" />} title="المبالغ">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Field label="المبلغ المستهدف (ج.م)"><Input dir="ltr" type="number" value={form.target_amount} className="h-10 rounded-xl" onChange={(e) => set("target_amount", e.target.value)} /></Field>
                <Field label="الحد الأدنى / السعر يبدأ من (ج.م)"><Input dir="ltr" type="number" value={form.minimum_amount} className="h-10 rounded-xl" onChange={(e) => set("minimum_amount", e.target.value)} /></Field>
                <Field label="المحصّل حتى الآن"><Input dir="ltr" disabled value={record?.collected_amount ? String(Number(record.collected_amount)) : "0"} className="h-10 rounded-xl" /></Field>
              </div>
            </SectionCard>
            <SectionCard icon={<DollarSign className="h-4 w-4 text-primary" />} title="باقات وأسهم التبرع"
              description="إضافة وتعديل وحذف وترتيب الباقات بتتحفظ على السيرفر مباشرة.">
              <PackagesEditor kind="programs" ownerId={isNew ? null : id ?? null} />
            </SectionCard>
          </TabsContent>

          {/* SEO */}
          <TabsContent value="seo" className="space-y-4" dir="rtl">
            <SeoFields value={form.seo} onChange={setSeo} previewImage={form.image} previewTitleAr={form.name_ar}
              previewDescAr={form.description_ar} previewPath={`/programs/${form.slug || "slug"}`} />
          </TabsContent>

          {/* Geo */}
          <TabsContent value="geo" className="space-y-4" dir="rtl">
            <GeoFields value={form.seo} onChange={setSeo} />
          </TabsContent>

          {/* AI */}
          <TabsContent value="ai" className="space-y-4" dir="rtl">
            <EntityFaqManager
              kind="program"
              saved={!isNew && !!id}
              linkedCategoryId={record?.faq_category_id}
              slug={form.slug}
              nameAr={form.name_ar}
              onLink={async (faq_category_id) => {
                const updated = await programsAdminApi.update(id!, { faq_category_id });
                setRecord((r) => (r ? { ...r, faq_category_id: updated.faq_category_id ?? faq_category_id } : r));
              }}
            />
            <AiFields value={form.seo} onChange={setSeo} nameAr={form.name_ar} nameEn={form.name_en} descAr={form.description_ar} showFaq={false} />
          </TabsContent>

          {/* Visibility & classification */}
          <TabsContent value="visibility" className="space-y-4" dir="rtl">
            <SectionCard icon={<Compass className="h-4 w-4 text-primary" />} title="المحور والمواسم">
              <Field label="المحور (axis_id)">
                <ChoiceSelect value={form.axis_id} onChange={(v) => set("axis_id", v)} noneLabel="بدون محور" ariaLabel="المحور"
                  options={axes.map((ax) => ({ value: String(ax.id), label: ax.name_ar }))} />
              </Field>
              <div>
                <Label className="text-xs font-bold">المواسم المرتبطة (season_ids)</Label>
                {seasons.length === 0 ? (
                  <p className="mt-1 text-[11px] text-muted-foreground">لا توجد مواسم في الخادم.</p>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {seasons.map((s) => {
                      const checked = form.season_ids.includes(Number(s.id));
                      return (
                        <label key={s.id} className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition ${checked ? "border-primary bg-primary/10 font-bold text-primary" : "border-border bg-card text-muted-foreground hover:bg-muted"}`}>
                          <Switch checked={checked} onCheckedChange={(c) => set("season_ids", c ? [...form.season_ids, Number(s.id)] : form.season_ids.filter((x) => x !== Number(s.id)))} />
                          {s.name_ar}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </SectionCard>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
