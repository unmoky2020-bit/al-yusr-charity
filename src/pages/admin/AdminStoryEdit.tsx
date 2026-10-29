import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, ExternalLink, Loader2, Save, Eye, EyeOff, Star, StarOff, Send, Trash2, Wand2 } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { RequireAuth } from "@/auth/RequireAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useLang } from "@/i18n/LangContext";
import { toast } from "@/hooks/use-toast";
import { getStoryById, upsertStory, deleteStory, type StoryCard } from "@/data/storiesApi";
import { programsApiV1 } from "@/data/laravelApi";
import { apiErrorMessage } from "@/data/api/adminApiHelpers";
import { casesApiV1, type LaravelCase } from "@/data/laravelApi";
import { publicUrls } from "@/lib/publicUrls";
import { ImageUrlField } from "@/components/admin/programs/FormKit";

type Story = any;
type Program = { id: string; slug: string; title_ar: string; title_en: string };

const PILLARS = [
  { slug: "food",      ar: "محور الإطعام / الغذاء", en: "Food" },
  { slug: "health",    ar: "محور الصحة",            en: "Health" },
  { slug: "education", ar: "محور التعليم",          en: "Education" },
];

const slugify = (s: string) =>
  s.toLowerCase().trim()
    .replace(/[^\u0600-\u06FFa-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);

const blank = (): Story => ({
  slug: "", title_ar: "", title_en: "", role_ar: "", role_en: "",
  quote_ar: "", quote_en: "", body_ar: "", body_en: "",
  beneficiary_name: "", location_ar: "", location_en: "",
  image_url: "", program_id: null, pillar_slug: null, case_id: null,
  is_published: false, is_featured: false, sort_order: 0, seo: {},
});

const Inner = () => {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const fromCaseId = params.get("from_case");
  const nav = useNavigate();
  const isNew = !id || id === "new";

  const [data, setData] = useState<Story>(blank());
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(!isNew || !!fromCaseId);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      // Programs for the "link to program" select (GET /programs, stored as stories.program_id).
      programsApiV1.listAll()
        .then((rows) => setPrograms(rows.map((p) => ({
          id: String(p.id), slug: String(p.slug ?? ""), title_ar: String(p.name_ar || p.name || ""), title_en: String(p.name_en || ""),
        }))))
        .catch(() => setPrograms([]));

      if (!isNew) {
        try {
          const row = await getStoryById(String(id));
          setData({ ...row, seo: row.seo || {} });
        } catch (e) {
          toast({ variant: "destructive", title: t("تعذر تحميل القصة", "Could not load story"), description: apiErrorMessage(e) });
          nav("/admin/stories", { replace: true });
          return;
        }
        setLoading(false);
        return;
      }

      if (fromCaseId) {
        try {
          const c: LaravelCase & Record<string, any> = await casesApiV1.get(fromCaseId);
          setData({
            ...blank(),
            slug: slugify(`${c.beneficiary_name || c.title}-${c.code || ""}`).slice(0, 60),
            title_ar: c.title || "", title_en: "",
            role_ar: "حالة مكتملة", role_en: "Completed case",
            quote_ar: "", quote_en: "",
            body_ar: c.story || c.description || "", body_en: "",
            beneficiary_name: c.beneficiary_name || "",
            location_ar: [c.city, c.governorate].filter(Boolean).join(" - "),
            location_en: "",
            image_url: c.cover_image_url || c.cover_image || "",
            case_id: String(c.id),
            is_published: false, is_featured: false,
          });
        } catch (e) {
          toast({ variant: "destructive", title: t("تعذر تحميل الحالة", "Could not load case"), description: apiErrorMessage(e) });
        }
        setLoading(false);
        return;
      }
      setLoading(false);
    })();
  }, [id]);

  const upd = (k: string, v: any) => setData((d: any) => ({ ...d, [k]: v }));
  const updSeo = (k: string, v: any) => setData((d: any) => ({ ...d, seo: { ...(d.seo || {}), [k]: v } }));

  const seoLen = useMemo(() => ({
    titleAr: (data.seo?.meta_title_ar || data.title_ar || "").length,
    titleEn: (data.seo?.meta_title_en || data.title_en || "").length,
    descAr: (data.seo?.meta_desc_ar || data.quote_ar || "").length,
    descEn: (data.seo?.meta_desc_en || data.quote_en || "").length,
  }), [data]);

  const save = async (extra?: Partial<Story>) => {
    if (!data.slug || !data.title_ar) {
      toast({ title: t("أدخل المعرّف والعنوان العربي", "Enter slug and Arabic title") });
      return null;
    }
    setSaving(true);
    const payload: Partial<StoryCard> & { slug: string } = {
      ...(isNew ? {} : { id: String(id) }),
      slug: data.slug,
      title_ar: data.title_ar || "", title_en: data.title_en || "",
      role_ar: data.role_ar || "",   role_en: data.role_en || "",
      quote_ar: data.quote_ar || "", quote_en: data.quote_en || "",
      body_ar: data.body_ar || "",   body_en: data.body_en || "",
      beneficiary_name: data.beneficiary_name || null,
      location_ar: data.location_ar || null, location_en: data.location_en || null,
      image_url: data.image_url || null,
      program_id: data.program_id || null,
      pillar_slug: data.pillar_slug || null,
      case_id: data.case_id || null,
      is_published: data.is_published ?? false,
      is_featured: data.is_featured ?? false,
      pending_review: data.pending_review ?? false,
      sort_order: data.sort_order ?? 0,
      seo: data.seo || {},
      ...(extra || {}),
    };
    // PUT /stories/{id} or POST /stories (Laravel)
    const { error, story: row } = await upsertStory(payload);
    setSaving(false);
    if (error) { toast({ variant: "destructive", title: t("فشل الحفظ", "Save failed"), description: error }); return null; }
    toast({ title: t("تم الحفظ", "Saved") });
    if (isNew && row?.id) { nav(`/admin/stories/${row.id}`, { replace: true }); return row; }
    if (row) setData({ ...row, seo: row.seo || {} });
    else setData((d: any) => ({ ...d, ...payload }));
    return row ?? payload;
  };

  const publish = async () => { await save({ is_published: true, pending_review: false }); };
  const unpublish = async () => { await save({ is_published: false }); };
  const submitReview = async () => { await save({ pending_review: true }); };

  const remove = async () => {
    if (isNew) return;
    if (!confirm(t("حذف هذه القصة نهائيًا؟", "Delete this story permanently?"))) return;
    const { error } = await deleteStory(String(id), data.slug);
    if (error) { toast({ variant: "destructive", title: t("فشل الحذف", "Delete failed"), description: error }); return; }
    toast({ title: t("تم الحذف", "Deleted") });
    nav("/admin/stories");
  };

  const Back = isAr ? ArrowRight : ArrowLeft;

  return (
    <AdminLayout title={{ ar: isNew ? "قصة جديدة" : "تعديل قصة", en: isNew ? "New story" : "Edit story" }}>
      <div dir={isAr ? "rtl" : "ltr"} className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-card p-3 shadow-soft">
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin/stories">
                <Back className="me-1.5 h-4 w-4" />
                {t("رجوع للقصص", "Back to stories")}
              </Link>
            </Button>
            {!isNew && data.slug && (
              <Button asChild variant="ghost" size="sm">
                <a href={publicUrls.story(data.slug)} target="_blank" rel="noreferrer">
                  {t("معاينة", "Preview")} <ExternalLink className="ms-1 h-3.5 w-3.5" />
                </a>
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {!isNew && (
              <Button variant="ghost" size="sm" onClick={remove} className="text-destructive"><Trash2 className="me-1 h-3.5 w-3.5" /> {t("حذف", "Delete")}</Button>
            )}
            {!data.is_published && !data.pending_review && (
              <Button variant="outline" size="sm" onClick={submitReview} disabled={saving}><Send className="me-1 h-3.5 w-3.5" /> {t("للمراجعة", "Submit for review")}</Button>
            )}
            {data.is_published ? (
              <Button variant="outline" size="sm" onClick={unpublish} disabled={saving}><EyeOff className="me-1 h-3.5 w-3.5" /> {t("سحب النشر", "Unpublish")}</Button>
            ) : (
              <Button variant="outline" size="sm" onClick={publish} disabled={saving}><Eye className="me-1 h-3.5 w-3.5" /> {t("نشر مباشر", "Publish")}</Button>
            )}
            <Button onClick={() => save()} disabled={saving} className="bg-orange-grad font-extrabold text-accent-foreground">
              {saving ? <Loader2 className="me-1 h-4 w-4 animate-spin" /> : <Save className="me-1 h-4 w-4" />}
              {t("حفظ", "Save")}
            </Button>
          </div>
        </div>

        {data.case_id && (
          <div className="flex items-center justify-between rounded-xl border border-secondary/40 bg-secondary/10 p-3 text-xs">
            <span className="font-bold text-secondary-foreground">{t("هذه القصة موثقة من حالة مكتملة", "This story is documented from a completed case")}</span>
            <Link to={`/admin/cases?id=${data.case_id}`} className="font-extrabold text-secondary underline">{t("فتح الحالة", "Open case")}</Link>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <Tabs defaultValue="basic" dir={isAr ? "rtl" : "ltr"} className="w-full">
            <TabsList className="grid w-full grid-cols-4" dir={isAr ? "rtl" : "ltr"}>
              <TabsTrigger value="basic">{t("أساسي", "Basics")}</TabsTrigger>
              <TabsTrigger value="content">{t("المحتوى", "Content")}</TabsTrigger>
              <TabsTrigger value="links">{t("روابط ونشر", "Links & publish")}</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-3 pt-3">
              <div className="grid gap-3 rounded-2xl bg-card p-4 shadow-soft sm:grid-cols-2">
                <div>
                  <Label>{t("المعرّف (slug)", "Slug")}</Label>
                  <div className="flex gap-1">
                    <Input value={data.slug || ""} onChange={(e) => upd("slug", slugify(e.target.value))} placeholder="umm-soad-mansoura" />
                    <Button type="button" variant="outline" size="sm" onClick={() => upd("slug", slugify(data.title_ar || data.title_en || ""))} title={t("توليد من العنوان", "Generate from title")}><Wand2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
                <div><Label>{t("الترتيب", "Sort order")}</Label>
                  <Input type="number" value={data.sort_order ?? 0} onChange={(e) => upd("sort_order", Number(e.target.value))} />
                </div>
                <div><Label>{t("العنوان (عربي)", "Title (AR)")}</Label>
                  <Input dir="rtl" value={data.title_ar || ""} onChange={(e) => upd("title_ar", e.target.value)} placeholder="أم سعاد — المنصورة" />
                </div>
                <div><Label>{t("العنوان (إنجليزي)", "Title (EN)")}</Label>
                  <Input dir="ltr" value={data.title_en || ""} onChange={(e) => upd("title_en", e.target.value)} placeholder="Umm Soad — Mansoura" />
                </div>
                <div><Label>{t("اسم المستفيد", "Beneficiary name")}</Label>
                  <Input value={data.beneficiary_name || ""} onChange={(e) => upd("beneficiary_name", e.target.value)} />
                </div>
                <div><Label>{t("الفئة (عربي)", "Role / Category (AR)")}</Label>
                  <Input dir="rtl" value={data.role_ar || ""} onChange={(e) => upd("role_ar", e.target.value)} placeholder="كرتونة العزومة" />
                </div>
                <div><Label>Role / Category (EN)</Label>
                  <Input dir="ltr" value={data.role_en || ""} onChange={(e) => upd("role_en", e.target.value)} />
                </div>
                <div><Label>{t("المحافظة/الموقع (عربي)", "Location (AR)")}</Label>
                  <Input dir="rtl" value={data.location_ar || ""} onChange={(e) => upd("location_ar", e.target.value)} />
                </div>
                <div><Label>Location (EN)</Label>
                  <Input dir="ltr" value={data.location_en || ""} onChange={(e) => upd("location_en", e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <ImageUrlField
                    label={t("صورة القصة", "Story image")}
                    hint={t("ارفع صورة من جهازك أو اختار من مكتبة الوسائط أو الصق رابط — بتظهر في الرئيسية وصفحة القصة.", "Upload from your device, pick from the media library, or paste a link.")}
                    value={data.image_url || ""}
                    onChange={(v) => upd("image_url", v)}
                    collection="general"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="content" className="space-y-3 pt-3">
              <div className="space-y-3 rounded-2xl bg-card p-4 shadow-soft">
                <div><Label>{t("القصة القصيرة (عربي) — بتظهر في الرئيسية في «أثرنا في حياة أسرة»", "Short story (AR) — shown on the home page")}</Label>
                  <Textarea rows={2} maxLength={300} dir="rtl" value={data.quote_ar || ""} onChange={(e) => upd("quote_ar", e.target.value)}
                    placeholder={t("سطرين: إزاي اتغيرت حياة الأسرة بتبرعكم", "Two lines: how the family's life changed")} />
                  <p className="mt-1 text-[11px] text-muted-foreground">{(data.quote_ar || "").length}/300 — {t("الأفضل سطرين تقريباً (حوالي 150 حرف)", "About two lines (~150 characters) reads best")}</p>
                </div>
                <div><Label>Short story (EN)</Label>
                  <Textarea rows={2} maxLength={300} dir="ltr" value={data.quote_en || ""} onChange={(e) => upd("quote_en", e.target.value)} />
                </div>
                <div><Label>{t("نص القصة الكامل (عربي)", "Full story body (AR)")}</Label>
                  <Textarea rows={10} dir="rtl" value={data.body_ar || ""} onChange={(e) => upd("body_ar", e.target.value)} />
                </div>
                <div><Label>Full story body (EN)</Label>
                  <Textarea rows={10} dir="ltr" value={data.body_en || ""} onChange={(e) => upd("body_en", e.target.value)} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="links" className="space-y-3 pt-3">
              <div className="space-y-3 rounded-2xl bg-card p-4 shadow-soft">
                <div><Label>{t("اربط ببرنامج", "Link to program")}</Label>
                  <Select value={data.program_id || "__none__"} onValueChange={(v) => upd("program_id", v === "__none__" ? null : v)}>
                    <SelectTrigger dir={isAr ? "rtl" : "ltr"}><SelectValue placeholder={t("بدون", "None")} /></SelectTrigger>
                    <SelectContent dir={isAr ? "rtl" : "ltr"}>
                      <SelectItem value="__none__">{t("بدون", "None")}</SelectItem>
                      {programs.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{isAr ? p.title_ar : (p.title_en || p.title_ar)} · /{p.slug}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>{t("اربط بمحور عمل", "Link to work axis (pillar)")}</Label>
                  <Select value={data.pillar_slug || "__none__"} onValueChange={(v) => upd("pillar_slug", v === "__none__" ? null : v)}>
                    <SelectTrigger dir={isAr ? "rtl" : "ltr"}><SelectValue placeholder={t("بدون", "None")} /></SelectTrigger>
                    <SelectContent dir={isAr ? "rtl" : "ltr"}>
                      <SelectItem value="__none__">{t("بدون", "None")}</SelectItem>
                      {PILLARS.map((p) => (
                        <SelectItem key={p.slug} value={p.slug}>{isAr ? p.ar : p.en}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>{t("ربط بحالة (Case ID — اختياري)", "Link to case (Case ID — optional)")}</Label>
                  <Input dir="ltr" className="font-mono" value={data.case_id || ""} onChange={(e) => upd("case_id", e.target.value || null)} placeholder="UUID" />
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border p-3">
                  <div>
                    <p className="font-bold text-primary">{t("نشر للجمهور", "Publish")}</p>
                    <p className="text-[11px] text-muted-foreground">{t("عند التشغيل تظهر في قسم القصص.", "When on, the story is shown publicly.")}</p>
                  </div>
                  <Switch checked={!!data.is_published} onCheckedChange={(v) => upd("is_published", v)} />
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border p-3">
                  <div>
                    <p className="font-bold text-primary">{t("تمييز", "Featured")}</p>
                    <p className="text-[11px] text-muted-foreground">{t("تظهر بالمواضع المميّزة على الواجهة.", "Shown in highlighted slots on the homepage.")}</p>
                  </div>
                  <Switch checked={!!data.is_featured} onCheckedChange={(v) => upd("is_featured", v)} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="seo" className="space-y-3 pt-3">
              <div className="grid gap-3 rounded-2xl bg-card p-4 shadow-soft sm:grid-cols-2">
                <div>
                  <Label>Meta title (AR) <span className="text-[10px] text-muted-foreground">({seoLen.titleAr}/60)</span></Label>
                  <Input maxLength={60} dir="rtl" value={data.seo?.meta_title_ar || ""} onChange={(e) => updSeo("meta_title_ar", e.target.value)} placeholder={data.title_ar} />
                </div>
                <div>
                  <Label>Meta title (EN) <span className="text-[10px] text-muted-foreground">({seoLen.titleEn}/60)</span></Label>
                  <Input maxLength={60} dir="ltr" value={data.seo?.meta_title_en || ""} onChange={(e) => updSeo("meta_title_en", e.target.value)} placeholder={data.title_en} />
                </div>
                <div>
                  <Label>Meta description (AR) <span className="text-[10px] text-muted-foreground">({seoLen.descAr}/160)</span></Label>
                  <Textarea rows={2} maxLength={160} dir="rtl" value={data.seo?.meta_desc_ar || ""} onChange={(e) => updSeo("meta_desc_ar", e.target.value)} placeholder={data.quote_ar} />
                </div>
                <div>
                  <Label>Meta description (EN) <span className="text-[10px] text-muted-foreground">({seoLen.descEn}/160)</span></Label>
                  <Textarea rows={2} maxLength={160} dir="ltr" value={data.seo?.meta_desc_en || ""} onChange={(e) => updSeo("meta_desc_en", e.target.value)} placeholder={data.quote_en} />
                </div>
                <div className="sm:col-span-2"><Label>Open Graph image URL</Label>
                  <Input value={data.seo?.og_image_url || ""} onChange={(e) => updSeo("og_image_url", e.target.value)} placeholder={data.image_url} />
                </div>
                <div className="sm:col-span-2"><Label>{t("الكلمة المفتاحية", "Focus keyword")}</Label>
                  <Input value={data.seo?.focus_keyword || ""} onChange={(e) => updSeo("focus_keyword", e.target.value)} />
                </div>
                <div className="sm:col-span-2 rounded-xl border border-border bg-muted/20 p-3 text-xs text-muted-foreground">
                  {t("نصيحة: أبقِ العنوان أقل من 60 حرفًا والوصف أقل من 160 حرفًا للحصول على أفضل ظهور بمحركات البحث.", "Tip: keep titles under 60 chars and descriptions under 160 chars for best search appearance.")}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AdminLayout>
  );
};

const AdminStoryEdit = () => <RequireAuth roles={["admin","editor"]}><Inner /></RequireAuth>;
export default AdminStoryEdit;