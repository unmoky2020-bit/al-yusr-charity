import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, ExternalLink, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLang } from "@/i18n/LangContext";
import {
  CAMPAIGN_PAGES, campaignPagesApi, getCampaignPageMeta, mergeCampaignContent,
  type CampaignPageContent, type L,
} from "@/data/campaignPages";

type TabKey = "hero" | "hadith" | "prices" | "stats" | "sections" | "faq" | "cta";
const TABS: { key: TabKey; ar: string; en: string }[] = [
  { key: "hero", ar: "الهيرو", en: "Hero" },
  { key: "hadith", ar: "الحديث", en: "Hadith" },
  { key: "prices", ar: "الأسعار", en: "Prices" },
  { key: "stats", ar: "الأرقام", en: "Figures" },
  { key: "sections", ar: "الأقسام", en: "Sections" },
  { key: "faq", ar: "الأسئلة الشائعة", en: "FAQ" },
  { key: "cta", ar: "الختام", en: "Closing CTA" },
];

/** Bilingual field: Arabic + English side by side. */
const LField = ({ label, value, onChange, multiline, hint }: { label: string; value: L; onChange: (v: L) => void; multiline?: boolean; hint?: string }) => {
  const Cmp = multiline ? Textarea : Input;
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <div className="sm:col-span-2 flex items-baseline justify-between gap-3">
        <span className="text-sm font-black text-primary">{label}</span>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      <label className="grid gap-1 text-xs font-bold text-muted-foreground">
        عربي
        <Cmp dir="rtl" value={value.ar} onChange={(e) => onChange({ ...value, ar: e.target.value })} className={multiline ? "min-h-[88px] text-sm" : "h-10 text-sm"} />
      </label>
      <label className="grid gap-1 text-xs font-bold text-muted-foreground">
        English
        <Cmp dir="ltr" value={value.en} onChange={(e) => onChange({ ...value, en: e.target.value })} className={multiline ? "min-h-[88px] text-sm" : "h-10 text-sm"} />
      </label>
    </div>
  );
};

const Box = ({ title, children, action }: { title?: string; children: React.ReactNode; action?: React.ReactNode }) => (
  <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
    {(title || action) && (
      <div className="mb-4 flex items-center justify-between gap-3">
        {title && <h3 className="font-black text-primary">{title}</h3>}
        {action}
      </div>
    )}
    <div className="space-y-5">{children}</div>
  </div>
);

/* ───────────────────────── List view ───────────────────────── */

const CampaignPagesList = ({ isAr }: { isAr: boolean }) => {
  const [status, setStatus] = useState<Record<string, "custom" | "default" | "loading">>({});
  useEffect(() => {
    let alive = true;
    CAMPAIGN_PAGES.forEach(async (c) => {
      setStatus((s) => ({ ...s, [c.slug]: "loading" }));
      const rec = await campaignPagesApi.load(c.slug, { fresh: true });
      if (!alive) return;
      const custom = !!rec.content && Object.keys(rec.content).length > 0;
      setStatus((s) => ({ ...s, [c.slug]: custom ? "custom" : "default" }));
    });
    return () => { alive = false; };
  }, []);
  const Arrow = isAr ? ArrowLeft : ArrowRight;
  return (
    <div className="space-y-4">
      <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
        {isAr
          ? "من هنا تعدّل نصوص وأسعار وأرقام وأسئلة كل صفحة حملة. التصميم ثابت في الكود، والمحتوى يُحفظ على السيرفر ويظهر فوراً على الموقع. «إعادة للافتراضي» ترجع الصفحة لنصوصها الأصلية."
          : "Edit the texts, prices, figures and FAQs of each campaign page. Layout stays in code; content is saved on the server and shows on the site immediately. “Reset” restores the original texts."}
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CAMPAIGN_PAGES.map((c) => {
          const st = status[c.slug];
          return (
            <div key={c.slug} className="flex flex-col rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black text-primary">{isAr ? c.name.ar : c.name.en}</h3>
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground" dir="ltr">elyusr.org{c.path}</p>
                </div>
                <span className={`shrink-0 rounded-md px-2 py-1 text-[11px] font-black ${st === "custom" ? "bg-secondary/25 text-primary" : st === "default" ? "bg-muted text-muted-foreground" : "bg-muted text-muted-foreground animate-pulse"}`}>
                  {st === "custom" ? (isAr ? "محتوى مخصص" : "Customised") : st === "default" ? (isAr ? "افتراضي" : "Default") : "…"}
                </span>
              </div>
              <div className="mt-5 flex gap-2">
                <Button asChild className="flex-1 bg-primary font-black text-primary-foreground hover:bg-primary/90">
                  <Link to={`/admin/campaign-pages/${c.slug}`}>{isAr ? "تعديل المحتوى" : "Edit content"} <Arrow className="h-4 w-4" /></Link>
                </Button>
                <Button asChild variant="outline" aria-label={isAr ? "فتح الصفحة" : "Open page"}>
                  <a href={c.path} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /></a>
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ───────────────────────── Editor view ───────────────────────── */

const CampaignPageEditor = ({ slug, isAr }: { slug: string; isAr: boolean }) => {
  const meta = getCampaignPageMeta(slug);
  const qc = useQueryClient();
  const [defaults, setDefaults] = useState<CampaignPageContent | null>(null);
  const [form, setForm] = useState<CampaignPageContent | null>(null);
  const [hasOverride, setHasOverride] = useState(false);
  const [tab, setTab] = useState<TabKey>("hero");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!meta) return;
    setError(null);
    try {
      const [d, rec] = await Promise.all([meta.load(), campaignPagesApi.load(slug, { fresh: true })]);
      setDefaults(d);
      setForm(mergeCampaignContent(d, rec.content));
      setHasOverride(!!rec.content && Object.keys(rec.content).length > 0);
      setDirty(false);
    } catch (e: unknown) {
      setError((e as Error)?.message || "load failed");
    }
  };
  useEffect(() => { void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [slug]);

  const patch = (fn: (f: CampaignPageContent) => void) => {
    setForm((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      fn(next);
      return next;
    });
    setDirty(true);
  };

  const save = async () => {
    if (!form || !meta) return;
    setSaving(true);
    try {
      await campaignPagesApi.save(slug, form, meta.name);
      await qc.invalidateQueries({ queryKey: ["campaign-page", slug] });
      setHasOverride(true);
      setDirty(false);
      toast.success(isAr ? "تم حفظ محتوى الصفحة ونشره" : "Page content saved and published");
    } catch (e: unknown) {
      toast.error(isAr ? "تعذر الحفظ" : "Save failed", { description: (e as Error)?.message });
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    if (!meta || !window.confirm(isAr ? "إرجاع هذه الصفحة إلى النصوص الافتراضية؟ سيُحذف المحتوى المخصص." : "Restore this page to its default texts? Custom content will be removed.")) return;
    setSaving(true);
    try {
      await campaignPagesApi.reset(slug);
      await qc.invalidateQueries({ queryKey: ["campaign-page", slug] });
      await load();
      toast.success(isAr ? "تمت الإعادة إلى الافتراضي" : "Reset to defaults");
    } catch (e: unknown) {
      toast.error(isAr ? "تعذرت الإعادة" : "Reset failed", { description: (e as Error)?.message });
    } finally {
      setSaving(false);
    }
  };

  const sectionKeys = useMemo(() => (form ? Object.keys(form.sections) : []), [form]);
  const Arrow = isAr ? ArrowRight : ArrowLeft;

  if (!meta) return <p className="text-destructive">{isAr ? "صفحة غير معروفة" : "Unknown page"}: {slug}</p>;
  if (error) return <p className="text-destructive">{error}</p>;
  if (!form || !defaults) return <div className="h-40 animate-pulse rounded-2xl bg-muted" />;

  return (
    <div className="space-y-5">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm"><Link to="/admin/campaign-pages"><Arrow className="h-4 w-4" /> {isAr ? "كل الصفحات" : "All pages"}</Link></Button>
          <div>
            <h2 className="text-lg font-black text-primary">{isAr ? meta.name.ar : meta.name.en}</h2>
            <a href={meta.path} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-primary" dir="ltr">elyusr.org{meta.path} <ExternalLink className="h-3 w-3" /></a>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasOverride && (
            <Button type="button" variant="outline" disabled={saving} onClick={reset} className="gap-1.5"><RotateCcw className="h-4 w-4" /> {isAr ? "إعادة للافتراضي" : "Reset"}</Button>
          )}
          <Button type="button" disabled={saving || !dirty} onClick={save} className="gap-1.5 bg-orange-grad font-black text-accent-foreground shadow-cta hover:opacity-95">
            <Save className="h-4 w-4" /> {saving ? (isAr ? "جارٍ الحفظ..." : "Saving...") : (isAr ? "حفظ ونشر" : "Save & publish")}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div role="tablist" className="flex flex-wrap gap-1.5 rounded-2xl bg-muted p-1.5">
        {TABS.map((tb) => {
          const count = tb.key === "prices" ? form.prices.length : tb.key === "stats" ? form.stats.length : tb.key === "sections" ? sectionKeys.length : tb.key === "faq" ? form.faq.length : 0;
          if ((tb.key === "prices" || tb.key === "stats" || tb.key === "sections") && count === 0) return null;
          return (
            <button key={tb.key} role="tab" aria-selected={tab === tb.key} onClick={() => setTab(tb.key)}
              className={`min-h-[40px] rounded-xl px-4 text-sm font-black transition-colors ${tab === tb.key ? "bg-primary text-primary-foreground" : "text-primary hover:bg-background"}`}>
              {isAr ? tb.ar : tb.en}{count > 0 && <span className="ms-1.5 text-xs opacity-70">({count})</span>}
            </button>
          );
        })}
      </div>

      {tab === "hero" && (
        <Box title={isAr ? "الجزء العلوي من الصفحة" : "Page hero"}>
          <LField label={isAr ? "السطر الصغير فوق العنوان" : "Eyebrow"} value={form.hero.eyebrow} onChange={(v) => patch((f) => { f.hero.eyebrow = v; })} />
          <LField label={isAr ? "العنوان (السطر الأول)" : "Title (line 1)"} value={form.hero.title} onChange={(v) => patch((f) => { f.hero.title = v; })} />
          <LField label={isAr ? "العنوان (السطر الثاني)" : "Title (line 2)"} value={form.hero.title2} onChange={(v) => patch((f) => { f.hero.title2 = v; })} />
          <LField label={isAr ? "النص التعريفي" : "Lead paragraph"} value={form.hero.lead} onChange={(v) => patch((f) => { f.hero.lead = v; })} multiline />
          <LField label={isAr ? "نص زر التبرع" : "Donate button label"} value={form.hero.donateLabel} onChange={(v) => patch((f) => { f.hero.donateLabel = v; })} />
        </Box>
      )}

      {tab === "hadith" && (
        <Box title={isAr ? "الحديث الشريف" : "Hadith"}>
          <LField label={isAr ? "نص الحديث (بدون «قال رسول الله ﷺ»)" : "Hadith text (without the attribution)"} value={form.hadith.text} onChange={(v) => patch((f) => { f.hadith.text = v; })} multiline />
          <LField label={isAr ? "المصدر (مثال: رواه مسلم)" : "Source"} value={form.hadith.source} onChange={(v) => patch((f) => { f.hadith.source = v; })} />
        </Box>
      )}

      {tab === "prices" && (
        <Box title={isAr ? "الأسعار بالجنيه" : "Prices (EGP)"}>
          {form.prices.map((p, i) => (
            <div key={p.id} className="rounded-xl border border-border p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="font-mono text-xs text-muted-foreground" dir="ltr">#{p.id}</span>
                <label className="flex items-center gap-2 text-sm font-black text-primary">
                  {isAr ? "المبلغ" : "Amount"}
                  <Input type="number" min={0} dir="ltr" value={p.amount} onChange={(e) => patch((f) => { f.prices[i].amount = Math.max(0, Number(e.target.value) || 0); })} className="h-10 w-32 font-mono font-black" />
                </label>
              </div>
              <LField label={isAr ? "الاسم" : "Label"} value={p.label} onChange={(v) => patch((f) => { f.prices[i].label = v; })} />
              {p.note && <div className="mt-3"><LField label={isAr ? "ملاحظة صغيرة" : "Note"} value={p.note} onChange={(v) => patch((f) => { f.prices[i].note = v; })} /></div>}
            </div>
          ))}
        </Box>
      )}

      {tab === "stats" && (
        <Box title={isAr ? "الأرقام والإنجازات" : "Figures"}>
          {form.stats.map((s, i) => (
            <div key={s.id} className="rounded-xl border border-border p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="font-mono text-xs text-muted-foreground" dir="ltr">#{s.id}</span>
                <label className="flex items-center gap-2 text-sm font-black text-primary">
                  {isAr ? "الرقم" : "Value"}
                  <Input type="number" min={0} dir="ltr" value={s.value ?? ""} placeholder={isAr ? "بدون رقم" : "none"}
                    onChange={(e) => patch((f) => { f.stats[i].value = e.target.value === "" ? null : Math.max(0, Number(e.target.value) || 0); })} className="h-10 w-32 font-mono font-black" />
                </label>
              </div>
              <LField label={isAr ? "الاسم" : "Label"} value={s.label} onChange={(v) => patch((f) => { f.stats[i].label = v; })} />
              {s.unit && <div className="mt-3"><LField label={isAr ? "الوحدة (مثال: كرتونة)" : "Unit"} value={s.unit} onChange={(v) => patch((f) => { f.stats[i].unit = v; })} /></div>}
              {s.note && <div className="mt-3"><LField label={isAr ? "ملاحظة" : "Note"} value={s.note} onChange={(v) => patch((f) => { f.stats[i].note = v; })} multiline /></div>}
            </div>
          ))}
        </Box>
      )}

      {tab === "sections" && sectionKeys.map((key) => {
        const sec = form.sections[key];
        return (
          <Box key={key} title={`${isAr ? sec.title.ar : sec.title.en}  ·  ${key}`}>
            <LField label={isAr ? "عنوان القسم" : "Section title"} value={sec.title} onChange={(v) => patch((f) => { f.sections[key].title = v; })} />
            {sec.lead && <LField label={isAr ? "مقدمة القسم" : "Section lead"} value={sec.lead} onChange={(v) => patch((f) => { f.sections[key].lead = v; })} multiline />}
            {sec.items.map((it, i) => (
              <div key={it.id} className="rounded-xl border border-border p-4">
                <span className="mb-3 block font-mono text-xs text-muted-foreground" dir="ltr">#{it.id}</span>
                <LField label={isAr ? "العنوان" : "Title"} value={it.title} onChange={(v) => patch((f) => { f.sections[key].items[i].title = v; })} />
                <div className="mt-3"><LField label={isAr ? "الوصف" : "Description"} value={it.desc} onChange={(v) => patch((f) => { f.sections[key].items[i].desc = v; })} multiline /></div>
                {it.extra && <div className="mt-3"><LField label={isAr ? "نص إضافي" : "Extra"} value={it.extra} onChange={(v) => patch((f) => { f.sections[key].items[i].extra = v; })} /></div>}
              </div>
            ))}
          </Box>
        );
      })}

      {tab === "faq" && (
        <Box
          title={isAr ? "الأسئلة الشائعة (تظهر في الصفحة وفي نتائج البحث)" : "FAQ (shown on the page and to search engines)"}
          action={<Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => patch((f) => { f.faq.push({ q: { ar: "", en: "" }, a: { ar: "", en: "" } }); })}><Plus className="h-4 w-4" /> {isAr ? "سؤال جديد" : "Add question"}</Button>}
        >
          {form.faq.map((fq, i) => (
            <div key={i} className="rounded-xl border border-border p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-mono text-xs text-muted-foreground">{i + 1}</span>
                <Button type="button" variant="ghost" size="sm" className="gap-1 text-destructive hover:text-destructive" disabled={form.faq.length <= 1}
                  onClick={() => patch((f) => { f.faq.splice(i, 1); })}><Trash2 className="h-4 w-4" /> {isAr ? "حذف" : "Remove"}</Button>
              </div>
              <LField label={isAr ? "السؤال" : "Question"} value={fq.q} onChange={(v) => patch((f) => { f.faq[i].q = v; })} />
              <div className="mt-3"><LField label={isAr ? "الإجابة" : "Answer"} value={fq.a} onChange={(v) => patch((f) => { f.faq[i].a = v; })} multiline /></div>
            </div>
          ))}
        </Box>
      )}

      {tab === "cta" && (
        <Box title={isAr ? "قسم التبرع الختامي" : "Closing donate section"}>
          <LField label={isAr ? "العنوان" : "Title"} value={form.cta.title} onChange={(v) => patch((f) => { f.cta.title = v; })} />
          <LField label={isAr ? "السطر التوضيحي" : "Subtitle"} value={form.cta.sub} onChange={(v) => patch((f) => { f.cta.sub = v; })} />
        </Box>
      )}

      {dirty && <p className="text-center text-xs font-bold text-accent">{isAr ? "عندك تعديلات غير محفوظة" : "You have unsaved changes"}</p>}
    </div>
  );
};

const AdminCampaignPages = () => {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const { slug } = useParams<{ slug?: string }>();
  return (
    <AdminLayout title={{ ar: "صفحات الحملات", en: "Campaign Pages" }}>
      <Helmet><title>{isAr ? "صفحات الحملات — لوحة التحكم" : "Campaign Pages — Admin"}</title></Helmet>
      {slug ? <CampaignPageEditor slug={slug} isAr={isAr} /> : <CampaignPagesList isAr={isAr} />}
    </AdminLayout>
  );
};

export default AdminCampaignPages;
