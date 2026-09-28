import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ExternalLink, Plus, Pencil, Trash2, Loader2, Save, X, Search, Eye, EyeOff, Image as ImageIcon, Globe2, RefreshCw, Sparkles, Link2, AlertTriangle } from "lucide-react";
import { AdminLayout, StatCard } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useLang } from "@/i18n/LangContext";

import { toast } from "@/hooks/use-toast";
import { programs as staticPrograms, type ProgramContent } from "@/data/programs";
import { programsApiV1, axesApi } from "@/data/laravelApi";

type NodeType = "program" | "project" | "campaign";
type SeoMeta = {
  meta_title_ar?: string; meta_title_en?: string;
  meta_desc_ar?: string;  meta_desc_en?: string;
  keywords_ar?: string;   keywords_en?: string;
  og_image_url?: string;
  canonical_slug?: string;
  long_content_ar?: string[];
  long_content_en?: string[];
  benefits_ar?: string[];
  benefits_en?: string[];
  hidden_from_public?: boolean;
  // Extended SEO / GEO / AEO / AIO
  canonical_url?: string;
  og_title_ar?: string; og_title_en?: string;
  og_desc_ar?: string;  og_desc_en?: string;
  twitter_card?: "summary" | "summary_large_image";
  noindex?: boolean;
  nofollow?: boolean;
  geo_region?: string;        // e.g. EG-DK
  geo_placename?: string;     // e.g. المنصورة
  geo_position?: string;      // "lat;lon"
  service_cities?: string;    // comma list (Arabic city names)
  ai_summary_ar?: string;     // AEO/AIO: short AI-friendly answer
  ai_summary_en?: string;
  faq_ar?: string;            // "Q | A" per line
  faq_en?: string;
  schema_type?: "Service" | "Product" | "DonateAction" | "Event";
};
type Node = {
  id: string;
  type: NodeType;
  parent_id: string | null;
  slug: string;
  title_ar: string;
  title_en: string;
  description_ar: string | null;
  description_en: string | null;
  image_url: string | null;
  target_amount: number | null;
  collected_amount: number;
  amount: number | null;
  active: boolean;
  direct_checkout: boolean;
  sort_order: number;
  metadata: SeoMeta | null;
  created_at: string;
  updated_at: string;
};

const t = (lang: "ar" | "en", ar: string, en: string) => (lang === "ar" ? ar : en);

const emptyDraft = (type: NodeType): Partial<Node> => ({
  type,
  slug: "",
  title_ar: "",
  title_en: "",
  description_ar: "",
  description_en: "",
  image_url: "",
  target_amount: null,
  amount: null,
  active: true,
  direct_checkout: false,
  sort_order: 0,
  metadata: { long_content_ar: [], long_content_en: [], benefits_ar: [], benefits_en: [] },
});

type ProgramSeed = ProgramContent & { adminSlug?: string; canonicalSlug?: string };

const cloneProgramForAdmin = (slug: string, sourceSlug: string, arName?: string, enName?: string): ProgramSeed | null => {
  const source = staticPrograms.find((p) => p.slug === sourceSlug);
  if (!source) return null;
  return {
    ...source,
    adminSlug: slug,
    canonicalSlug: sourceSlug,
    ar: { ...source.ar, name: arName || source.ar.name },
    en: { ...source.en, name: enName || source.en.name },
  };
};

const generalProgram: ProgramSeed = {
  slug: "general",
  adminSlug: "general",
  image: "",
  priceFrom: 0,
  ar: {
    name: "تبرع عام",
    tagline: "تبرع مرن يوجَّه للأكثر احتياجًا حسب أولوية الحالات والبرامج.",
    desc: "اختيار مناسب لو حابب تسيب التوجيه لفريق اليسر بعد البحث الميداني ومراجعة الاحتياج العاجل.",
    benefits: ["توجيه للأولوية الأعلى", "بحث ميداني قبل الصرف", "إيصال وتوثيق للتبرع"],
    longContent: ["التبرع العام يساعدنا نتحرك بسرعة مع الحالات العاجلة ونغطي الفجوات بين البرامج المختلفة بدون تأخير."],
  },
  en: {
    name: "General Donation",
    tagline: "Flexible giving directed to the highest-priority needs.",
    desc: "A good choice when you want Al-Yusr to route your donation after field assessment and urgent-need review.",
    benefits: ["Routed to top priority", "Field assessment before spending", "Donation receipt and documentation"],
    longContent: ["General donations let us respond quickly to urgent cases and bridge gaps between programs without delay."],
  },
};

const adminProgramSeeds: ProgramSeed[] = [
  generalProgram,
  ...staticPrograms,
].filter(Boolean) as ProgramSeed[];

export default function AdminPrograms() {
  const { lang } = useLang();
  const type: NodeType = "program";
  const setType = (_v: NodeType) => {};
  const [items, setItems] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Partial<Node> | null>(null);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [sectors, setSectors] = useState<{ id: string; slug: string; title_ar: string; title_en: string }[]>([]);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkDraft, setLinkDraft] = useState<Record<string, string | null>>({});
  const [linkSaving, setLinkSaving] = useState(false);

  const loadSectors = async () => {
    try {
      const data = await axesApi.list();
      if (Array.isArray(data) && data.length > 0) {
        setSectors(data.map((a: any) => ({
          id: String(a.id),
          slug: a.slug,
          title_ar: a.name_ar,
          title_en: a.name_en || a.name_ar,
        })));
        return;
      }
    } catch {}
    setSectors([
      { id: "sec-food", slug: "food", title_ar: "الإطعام والكراتين الغذائية", title_en: "Food & Meals" },
      { id: "sec-water", slug: "water", title_ar: "سقيا الماء والوصلات", title_en: "Clean Water" },
      { id: "sec-health", slug: "health", title_ar: "العلاج والعمليات الجراحية", title_en: "Health & Medicine" },
      { id: "sec-education", slug: "education", title_ar: "كفالة الطلاب والتعليم", title_en: "Education" },
      { id: "sec-orphans", slug: "orphans", title_ar: "كفالة الأيتام وتيسير الزواج", title_en: "Orphans & Brides" },
      { id: "sec-zakat", slug: "zakat", title_ar: "زكاة المال والصدقات", title_en: "Zakat & Charity" },
    ]);
  };
  useEffect(() => { void loadSectors(); }, []);

  const reload = async () => {
    setLoading(true);
    try {
      // Primary: Laravel API
      const laravelData = await programsApiV1.listAll();
      if (Array.isArray(laravelData) && laravelData.length > 0) {
        const mapped: Node[] = laravelData.map((p: any, idx: number) => ({
          id: String(p.id),
          type: "program" as NodeType,
          parent_id: null,
          slug: p.slug || String(p.id),
          title_ar: p.title_ar || p.name_ar || p.name || "",
          title_en: p.title_en || p.name_en || p.name || "",
          description_ar: p.description_ar || p.description || null,
          description_en: p.description_en || null,
          image_url: p.image_url || p.image || p.cover_image || null,
          target_amount: p.target_amount || null,
          collected_amount: p.collected_amount || p.current_amount || 0,
          amount: p.amount || p.price || null,
          active: p.is_active ?? p.active ?? true,
          direct_checkout: p.direct_checkout ?? false,
          sort_order: p.sort_order ?? idx,
          metadata: p.metadata || {},
          created_at: p.created_at || "",
          updated_at: p.updated_at || "",
        }));
        setItems(mapped);
        setLoading(false);
        return;
      }
    } catch (e) {
      console.warn("Laravel programs fetch failed:", e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { void reload(); }, [type]);

  const openLinker = () => {
    const draft: Record<string, string | null> = {};
    items.forEach((n) => { draft[n.id] = n.parent_id ?? null; });
    setLinkDraft(draft);
    setLinkOpen(true);
  };
  const saveLinker = async () => {
    const missing = items.filter((n) => !linkDraft[n.id]);
    if (missing.length) {
      toast({ title: t(lang, "لا يمكن الحفظ — توجد برامج بدون قطاع", "Cannot save — programs without a sector"), description: missing.map((n) => n.title_ar || n.slug).join("، "), });
      return;
    }
    setLinkSaving(true);
    const changes = items.filter((n) => (n.parent_id ?? null) !== (linkDraft[n.id] ?? null));
    for (const n of changes) {
      try {
        await programsApiV1.update(n.id, { parent_id: linkDraft[n.id] } as any);
      } catch (e) {
        console.warn("Failed to update parent_id for", n.id, e);
      }
    }
    setLinkSaving(false);
    setLinkOpen(false);
    toast({ title: t(lang, "تم حفظ الربط", "Links saved"), description: `${changes.length}` });
    reload();
  };
  const orphanCount = items.filter((n) => !n.parent_id).length;

  // Deep-link support: ?focus=<slug> auto-opens the editor for the matching item.
  useEffect(() => {
    const focus = searchParams.get("focus");
    if (!focus || !items.length) return;
    const match = items.find((i) => i.slug === focus);
    if (match) {
      setEditing({ ...match, metadata: match.metadata || {} });
      const next = new URLSearchParams(searchParams);
      next.delete("focus");
      setSearchParams(next, { replace: true });
    }
  }, [items, searchParams, setSearchParams]);

  /** Upsert all static programs into the DB so the admin reflects what's
   *  actually shipped on the live site (full bilingual content, image,
   *  price, benefits, long content). Safe to re-run — by-slug merge. */
  const syncFromStatic = async () => {
    if (type !== "program") return;
    setSyncing(true);
    // Sync via Laravel API only
    let i = 0;
    let synced = 0;
    for (const p of adminProgramSeeds) {
      const slug = p.adminSlug || p.slug;
      const existing = items.find((x) => x.slug === slug);
      const payload: any = {
        slug,
        title_ar: p.ar.name,
        title_en: p.en.name,
        description_ar: p.ar.tagline,
        description_en: p.en.tagline,
        image_url: existing?.image_url || p.image || null,
        amount: p.priceFrom || null,
        active: existing?.active ?? true,
        sort_order: existing?.sort_order ?? i,
        metadata: {
          ...(existing?.metadata || {}),
          long_content_ar: p.ar.longContent || [],
          long_content_en: p.en.longContent || [],
          benefits_ar: p.ar.benefits || [],
          benefits_en: p.en.benefits || [],
          desc_ar: p.ar.desc,
          desc_en: p.en.desc,
          canonical_slug: p.canonicalSlug || p.slug,
        } as SeoMeta,
      };
      try {
        if (existing) {
          await programsApiV1.update(existing.id, payload);
        } else {
          await programsApiV1.create(payload);
        }
        synced++;
      } catch (e) {
        console.warn("Sync failed for", slug, e);
      }
      i++;
    }
    setSyncing(false);
    await reload();
    toast({ title: t(lang, "تمت المزامنة ", "Sync complete "), description: t(lang, `تمت مزامنة ${synced} برنامج`, `Synced ${synced} programs`),
    });
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((n) =>
      [n.slug, n.title_ar, n.title_en, n.description_ar, n.description_en]
        .filter(Boolean).some((v) => String(v).toLowerCase().includes(q))
    );
  }, [items, search]);

  const stats = useMemo(() => ({
    total: items.length,
    active: items.filter((i) => i.active).length,
    hidden: items.filter((i) => i.metadata?.hidden_from_public).length,
  }), [items]);

  const toggleActive = async (n: Node) => {
    try {
      await programsApiV1.update(n.id, { is_active: !n.active, active: !n.active } as any);
      toast({ title: !n.active ? t(lang, "تم التفعيل", "Activated") : t(lang, "تم التعطيل", "Deactivated") });
    } catch (e) {
      toast({ title: t(lang, "فشل تغيير الحالة", "Failed to toggle"), description: String(e), variant: "destructive" });
    }
    reload();
  };
  const toggleHidden = async (n: Node) => {
    const md = { ...(n.metadata || {}), hidden_from_public: !(n.metadata?.hidden_from_public) };
    try {
      await programsApiV1.update(n.id, { metadata: md } as any);
    } catch (e) {
      toast({ title: t(lang, "فشل التحديث", "Update failed"), description: String(e), variant: "destructive" });
    }
    reload();
  };
  const remove = async (n: Node) => {
    if (!confirm(t(lang, `حذف «${n.title_ar}»؟`, `Delete "${n.title_en || n.title_ar}"?`))) return;
    try {
      await programsApiV1.remove(n.id);
      toast({ title: t(lang, "تم الحذف", "Deleted") });
    } catch (error: any) {
      toast({ title: t(lang, "فشل الحذف", "Delete failed"), description: String(error), variant: "destructive" });
      return;
    }
    reload();
  };

  const openNew = () => setEditing(emptyDraft(type));
  const openEdit = (n: Node) => setEditing({ ...n, metadata: n.metadata || {} });

  const save = async () => {
    if (!editing) return;
    if (!editing.slug || !editing.title_ar) {
      toast({ title: t(lang, "أدخل المعرّف والاسم العربي", "Enter slug and Arabic title") });
      return;
    }
    setSaving(true);
    const payload: any = {
      slug: editing.slug,
      title_ar: editing.title_ar,
      title_en: editing.title_en || "",
      description_ar: editing.description_ar || null,
      description_en: editing.description_en || null,
      image_url: editing.image_url || null,
      target_amount: editing.target_amount || null,
      amount: editing.amount || null,
      is_active: editing.active ?? true,
      active: editing.active ?? true,
      sort_order: editing.sort_order ?? 0,
      metadata: editing.metadata || {},
    };
    try {
      if ((editing as Node).id && !isNaN(Number((editing as Node).id))) {
        // Numeric id = existing Laravel record
        await programsApiV1.update((editing as Node).id, payload);
      } else if ((editing as Node).id) {
        // String slug id — try update first, then create
        try {
          await programsApiV1.update((editing as Node).id, payload);
        } catch {
          await programsApiV1.create(payload);
        }
      } else {
        await programsApiV1.create(payload);
      }
      toast({ title: t(lang, "تم الحفظ", "Saved") });
      setEditing(null);
      reload();
    } catch (err: any) {
      toast({ title: t(lang, "فشل الحفظ", "Save failed"), description: String(err), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (k: keyof Node, v: any) => setEditing((d) => d ? { ...d, [k]: v } : d);
  const updateMeta = (k: keyof SeoMeta, v: any) => setEditing((d) => d ? { ...d, metadata: { ...(d.metadata || {}), [k]: v } } : d);
  const updateListMeta = (k: "long_content_ar" | "long_content_en" | "benefits_ar" | "benefits_en", text: string) => {
    const arr = text.split("\n").map((s) => s.trim()).filter(Boolean);
    updateMeta(k, arr);
  };
  // Normalizers for GEO fields — keep formats valid for crawlers (ISO 3166-2, "lat;lon").
  const normalizeGeoRegion = (v: string) => v.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 6);
  const normalizeGeoPosition = (v: string) => {
    const cleaned = v.replace(/[,\s]+/g, ";").replace(/[^0-9.;-]/g, "");
    const m = cleaned.match(/^(-?\d{1,2}(?:\.\d+)?);(-?\d{1,3}(?:\.\d+)?)/);
    return m ? `${m[1]};${m[2]}` : cleaned;
  };
  const normalizeServiceCities = (v: string) =>
    v.split(/[,،]/).map((s) => s.trim()).filter(Boolean).join(", ");
  const isValidGeoPosition = (v?: string) => !v || /^-?\d{1,2}(?:\.\d+)?;-?\d{1,3}(?:\.\d+)?$/.test(v);
  const isValidGeoRegion = (v?: string) => !v || /^[A-Z]{2}(?:-[A-Z0-9]{1,3})?$/.test(v);

  const [aiBusy, setAiBusy] = useState(false);
  const generateAi = async () => {
    if (!editing) return;
    setAiBusy(true);
    try {
      toast({ title: t(lang, "توليد AI غير متاح حالياً", "AI generation not available"), description: t(lang, "يرجى استخدام الباك إند لتوليد المحتوى", "Please use backend for content generation") });
    } catch (e) {
      toast({ title: t(lang, "خطأ", "Error"), description: String(e), variant: "destructive" });
    } finally {
      setAiBusy(false);
    }
  };
  const previewHref = (n: Node, previewLang: "ar" | "en") => {
    const canonical = n.metadata?.canonical_slug || (n.slug === "satr" ? "shelter" : n.slug === "food" ? "box" : n.slug);
    const path = type === "program" ? `/programs/${canonical}` : `/${type}s/${n.slug}`;
    return `${path}?lang=${previewLang}&preview=1`;
  };

  return (
    <AdminLayout>
      <div className="space-y-4" dir={lang === "ar" ? "rtl" : "ltr"}>
        <div className="flex flex-col gap-3 rounded-2xl bg-card p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-base font-extrabold text-primary md:text-lg">{t(lang, "إدارة البرامج والمشاريع والحملات", "Manage Programs, Projects & Campaigns")}</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">{t(lang, "تحكّم كامل بالمحتوى ثنائي اللغة، الـ SEO، الصور، التفعيل، والإخفاء عن الجمهور.", "Full bilingual content control, SEO, images, activation and public visibility.")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {type === "program" && (
              <Button variant="outline" onClick={syncFromStatic} disabled={syncing} className="font-bold">
                {syncing ? <Loader2 className="me-1 h-4 w-4 animate-spin" /> : <RefreshCw className="me-1 h-4 w-4" />}
                {t(lang, "مزامنة من بيانات الموقع", "Sync from site data")}
              </Button>
            )}
            {type === "program" && (
              <Button variant="outline" onClick={openLinker} className="font-bold">
                <Link2 className="me-1 h-4 w-4" />
                {t(lang, "ربط البرامج بالقطاعات", "Link programs to sectors")}
                {orphanCount > 0 && (
                  <span className="ms-2 inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-black text-destructive">
                    <AlertTriangle className="h-3 w-3" /> {orphanCount}
                  </span>
                )}
              </Button>
            )}
            <Button onClick={openNew} className="bg-orange-grad font-extrabold text-accent-foreground">
              <Plus className="me-1 h-4 w-4" /> {t(lang, "إضافة جديد", "Add new")}
            </Button>
          </div>
        </div>

        <div className="mt-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-3" dir={lang === "ar" ? "rtl" : "ltr"}>
              <StatCard accent label={t(lang, "الإجمالي", "Total")} value={stats.total} />
              <StatCard label={t(lang, "نشط", "Active")} value={stats.active} />
              <StatCard label={t(lang, "مخفي عن الجمهور", "Hidden")} value={stats.hidden} />
            </div>

            <div className="rounded-2xl bg-card p-3 shadow-soft">
              <div className="relative">
                <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t(lang, "بحث بالاسم أو المعرّف…", "Search by title or slug…")} className="ps-9" />
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl bg-card p-10 text-center text-sm text-muted-foreground shadow-soft">
                {t(lang, "لا توجد عناصر بعد. أضف أول واحد.", "Nothing here yet. Add the first one.")}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" dir={lang === "ar" ? "rtl" : "ltr"}>
                {filtered.map((n) => (
                  <article key={n.id} className="group relative overflow-hidden rounded-2xl bg-card text-start shadow-soft transition hover:shadow-cta" dir={lang === "ar" ? "rtl" : "ltr"}>
                    <div className="relative aspect-video w-full overflow-hidden bg-muted">
                      {n.image_url ? (
                        <img src={n.image_url} alt={lang === "ar" ? n.title_ar : n.title_en} className="h-full w-full object-cover transition group-hover:scale-105" loading="lazy" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                          <ImageIcon className="h-8 w-8" />
                        </div>
                      )}
                      <div className="absolute end-2 top-2 flex gap-1">
                        {!n.active && (
                          <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-black text-destructive">{t(lang, "معطّل", "Off")}</span>
                        )}
                        {n.metadata?.hidden_from_public && (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-black text-muted-foreground">{t(lang, "مخفي", "Hidden")}</span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="line-clamp-1 font-extrabold text-primary">{lang === "ar" ? n.title_ar : (n.title_en || n.title_ar)}</h3>
                        {n.amount ? (
                          <span className="shrink-0 rounded-full bg-secondary/30 px-2 py-0.5 text-[11px] font-black text-primary">{n.amount} EGP</span>
                        ) : null}
                      </div>
                      <p className="line-clamp-2 min-h-[2.5em] text-xs text-muted-foreground">
                        {(lang === "ar" ? n.description_ar : n.description_en) || ""}
                      </p>
                      <div className="flex items-center justify-between border-t border-border pt-2 text-[11px]">
                        <span className="font-mono text-muted-foreground">/{n.slug}</span>
                        {n.metadata?.hidden_from_public ? (
                          <span className="font-bold text-muted-foreground">{t(lang, "مخفي عن الجمهور", "Hidden from public")}</span>
                        ) : (
                          <span className="font-bold text-emerald-600">{t(lang, "ظاهر للزوار", "Live for visitors")}</span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 pt-2">
                        <Button asChild size="sm" variant="outline" className="h-8 text-xs">
                          <Link to={`/admin/projects/${n.id}`}>
                            <Pencil className="me-1 h-3 w-3" /> {t(lang, "تفاصيل وتعديل", "Details & edit")}
                          </Link>
                        </Button>
                        <Button asChild size="sm" variant="secondary" className="h-8 text-xs">
                          <a
                            href={previewHref(n, lang)}
                            target="_blank"
                            rel="noreferrer"
                            title={t(lang, "معاينة الصفحة العامة", "Preview public page")}
                          >
                            <ExternalLink className="me-1 h-3 w-3" />
                            {t(lang, "معاينة", "Preview")}
                          </a>
                        </Button>
                        <button type="button" onClick={() => toggleActive(n)} className="inline-flex h-8 items-center gap-1 rounded-md px-3 text-xs font-medium transition hover:bg-accent hover:text-accent-foreground">
                          <span className={`relative h-4 w-7 rounded-full ${n.active ? "bg-primary" : "bg-muted"}`} aria-hidden="true">
                            <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-background transition ${n.active ? "end-0.5" : "start-0.5"}`} />
                          </span>
                          {n.active ? t(lang, "نشط", "On") : t(lang, "إيقاف", "Off")}
                        </button>
                        <Button size="sm" variant="ghost" onClick={() => toggleHidden(n)} className="h-8 text-xs">
                          {n.metadata?.hidden_from_public ? <EyeOff className="me-1 h-3 w-3" /> : <Eye className="me-1 h-3 w-3" />}
                          {n.metadata?.hidden_from_public ? t(lang, "مخفي", "Hidden") : t(lang, "ظاهر", "Public")}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => remove(n)} className="ms-auto h-8 text-xs text-destructive hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
        </div>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-extrabold">
              {(editing as Node)?.id ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {(editing as Node)?.id
                ? t(lang, "تعديل", "Edit")
                : t(lang, "إضافة", "Add")}
              {" — "}
              {t(lang, type === "program" ? "برنامج" : type === "project" ? "مشروع" : "حملة", type)}
            </DialogTitle>
          </DialogHeader>

          {editing && (
            <Tabs defaultValue="basic" className="mt-2">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">{t(lang, "أساسي", "Basics")}</TabsTrigger>
                <TabsTrigger value="content">{t(lang, "المحتوى", "Content")}</TabsTrigger>
                <TabsTrigger value="seo">{t(lang, "SEO", "SEO")}</TabsTrigger>
                <TabsTrigger value="settings">{t(lang, "إعدادات", "Settings")}</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-3 pt-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>{t(lang, "المعرّف (slug)", "Slug")}</Label>
                    <Input value={editing.slug || ""} onChange={(e) => updateField("slug", e.target.value.replace(/\s+/g, "-").toLowerCase())} placeholder="odhya" />
                  </div>
                  <div>
                    <Label>{t(lang, "ترتيب الظهور", "Sort order")}</Label>
                    <Input type="number" value={editing.sort_order ?? 0} onChange={(e) => updateField("sort_order", Number(e.target.value))} />
                  </div>
                  <div>
                    <Label>{t(lang, "الاسم (عربي)", "Title (AR)")}</Label>
                    <Input value={editing.title_ar || ""} onChange={(e) => updateField("title_ar", e.target.value)} dir="rtl" />
                  </div>
                  <div>
                    <Label>{t(lang, "الاسم (إنجليزي)", "Title (EN)")}</Label>
                    <Input value={editing.title_en || ""} onChange={(e) => updateField("title_en", e.target.value)} dir="ltr" />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>{t(lang, "وصف قصير (عربي)", "Tagline (AR)")}</Label>
                    <Textarea rows={2} value={editing.description_ar || ""} onChange={(e) => updateField("description_ar", e.target.value)} dir="rtl" />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>{t(lang, "وصف قصير (إنجليزي)", "Tagline (EN)")}</Label>
                    <Textarea rows={2} value={editing.description_en || ""} onChange={(e) => updateField("description_en", e.target.value)} dir="ltr" />
                  </div>
                  <div>
                    <Label>{t(lang, "السعر يبدأ من (EGP)", "Price from (EGP)")}</Label>
                    <Input type="number" value={editing.amount ?? ""} onChange={(e) => updateField("amount", e.target.value ? Number(e.target.value) : null)} />
                  </div>
                  <div>
                    <Label>{t(lang, "هدف الجمع (EGP)", "Target amount (EGP)")}</Label>
                    <Input type="number" value={editing.target_amount ?? ""} onChange={(e) => updateField("target_amount", e.target.value ? Number(e.target.value) : null)} />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>{t(lang, "رابط صورة الغلاف", "Cover image URL")}</Label>
                    <Input value={editing.image_url || ""} onChange={(e) => updateField("image_url", e.target.value)} placeholder="https://…" />
                    {editing.image_url && (
                      <img src={editing.image_url} alt="" className="mt-2 h-32 w-full rounded-lg object-cover" />
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="content" className="space-y-3 pt-3">
                <div>
                  <Label>{t(lang, "المحتوى الطويل (عربي) — فقرة لكل سطر", "Long content (AR) — one paragraph per line")}</Label>
                  <Textarea rows={6} dir="rtl"
                    value={(editing.metadata?.long_content_ar || []).join("\n")}
                    onChange={(e) => updateListMeta("long_content_ar", e.target.value)} />
                </div>
                <div>
                  <Label>{t(lang, "المحتوى الطويل (إنجليزي)", "Long content (EN)")}</Label>
                  <Textarea rows={6} dir="ltr"
                    value={(editing.metadata?.long_content_en || []).join("\n")}
                    onChange={(e) => updateListMeta("long_content_en", e.target.value)} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>{t(lang, "المزايا (عربي)", "Benefits (AR)")}</Label>
                    <Textarea rows={5} dir="rtl"
                      value={(editing.metadata?.benefits_ar || []).join("\n")}
                      onChange={(e) => updateListMeta("benefits_ar", e.target.value)} />
                  </div>
                  <div>
                    <Label>{t(lang, "المزايا (إنجليزي)", "Benefits (EN)")}</Label>
                    <Textarea rows={5} dir="ltr"
                      value={(editing.metadata?.benefits_en || []).join("\n")}
                      onChange={(e) => updateListMeta("benefits_en", e.target.value)} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="seo" className="space-y-3 pt-3">
                <div className="rounded-xl border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                  <Globe2 className="me-1 inline h-3.5 w-3.5" />
                  {t(lang, "العناوين والأوصاف هتظهر في نتائج البحث ووسائل التواصل.", "Titles and descriptions will appear in search results and social cards.")}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>{t(lang, "Meta Title (عربي)", "Meta title (AR)")}</Label>
                    <Input maxLength={60} dir="rtl" value={editing.metadata?.meta_title_ar || ""} onChange={(e) => updateMeta("meta_title_ar", e.target.value)} />
                    <p className="mt-1 text-[10px] text-muted-foreground">{(editing.metadata?.meta_title_ar || "").length}/60</p>
                  </div>
                  <div>
                    <Label>Meta title (EN)</Label>
                    <Input maxLength={60} dir="ltr" value={editing.metadata?.meta_title_en || ""} onChange={(e) => updateMeta("meta_title_en", e.target.value)} />
                    <p className="mt-1 text-[10px] text-muted-foreground">{(editing.metadata?.meta_title_en || "").length}/60</p>
                  </div>
                  <div>
                    <Label>{t(lang, "Meta Description (عربي)", "Meta description (AR)")}</Label>
                    <Textarea rows={2} maxLength={160} dir="rtl" value={editing.metadata?.meta_desc_ar || ""} onChange={(e) => updateMeta("meta_desc_ar", e.target.value)} />
                    <p className="mt-1 text-[10px] text-muted-foreground">{(editing.metadata?.meta_desc_ar || "").length}/160</p>
                  </div>
                  <div>
                    <Label>Meta description (EN)</Label>
                    <Textarea rows={2} maxLength={160} dir="ltr" value={editing.metadata?.meta_desc_en || ""} onChange={(e) => updateMeta("meta_desc_en", e.target.value)} />
                    <p className="mt-1 text-[10px] text-muted-foreground">{(editing.metadata?.meta_desc_en || "").length}/160</p>
                  </div>
                  <div>
                    <Label>{t(lang, "كلمات مفتاحية (عربي)", "Keywords (AR)")}</Label>
                    <Input dir="rtl" value={editing.metadata?.keywords_ar || ""} onChange={(e) => updateMeta("keywords_ar", e.target.value)} placeholder="أضحية, لحوم, مصر" />
                  </div>
                  <div>
                    <Label>Keywords (EN)</Label>
                    <Input dir="ltr" value={editing.metadata?.keywords_en || ""} onChange={(e) => updateMeta("keywords_en", e.target.value)} placeholder="qurbani, charity, egypt" />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>{t(lang, "صورة المشاركة (Open Graph)", "Open Graph image URL")}</Label>
                    <Input value={editing.metadata?.og_image_url || ""} onChange={(e) => updateMeta("og_image_url", e.target.value)} placeholder="https://…/og.jpg" />
                  </div>
                  <div>
                    <Label>{t(lang, "OG Title (عربي)", "OG title (AR)")}</Label>
                    <Input dir="rtl" maxLength={70} value={editing.metadata?.og_title_ar || ""} onChange={(e) => updateMeta("og_title_ar", e.target.value)} />
                  </div>
                  <div>
                    <Label>OG title (EN)</Label>
                    <Input dir="ltr" maxLength={70} value={editing.metadata?.og_title_en || ""} onChange={(e) => updateMeta("og_title_en", e.target.value)} />
                  </div>
                  <div>
                    <Label>{t(lang, "OG Description (عربي)", "OG description (AR)")}</Label>
                    <Textarea rows={2} dir="rtl" maxLength={200} value={editing.metadata?.og_desc_ar || ""} onChange={(e) => updateMeta("og_desc_ar", e.target.value)} />
                  </div>
                  <div>
                    <Label>OG description (EN)</Label>
                    <Textarea rows={2} dir="ltr" maxLength={200} value={editing.metadata?.og_desc_en || ""} onChange={(e) => updateMeta("og_desc_en", e.target.value)} />
                  </div>
                  <div>
                    <Label>{t(lang, "Canonical URL", "Canonical URL")}</Label>
                    <Input dir="ltr" value={editing.metadata?.canonical_url || ""} onChange={(e) => updateMeta("canonical_url", e.target.value)} placeholder="https://elyusr.org/programs/odhya" />
                  </div>
                  <div>
                    <Label>{t(lang, "نوع الـ Schema", "Schema type")}</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      value={editing.metadata?.schema_type || "Service"}
                      onChange={(e) => updateMeta("schema_type", e.target.value as SeoMeta["schema_type"])}
                    >
                      <option value="Service">Service</option>
                      <option value="Product">Product</option>
                      <option value="DonateAction">DonateAction</option>
                      <option value="Event">Event</option>
                    </select>
                  </div>
                  <div>
                    <Label>{t(lang, "Twitter Card", "Twitter card")}</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      value={editing.metadata?.twitter_card || "summary_large_image"}
                      onChange={(e) => updateMeta("twitter_card", e.target.value as SeoMeta["twitter_card"])}
                    >
                      <option value="summary_large_image">summary_large_image</option>
                      <option value="summary">summary</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-border p-3">
                    <div>
                      <p className="text-xs font-bold text-primary">noindex</p>
                      <p className="text-[10px] text-muted-foreground">{t(lang, "منع فهرسة محركات البحث", "Block search engines from indexing")}</p>
                    </div>
                    <Switch checked={!!editing.metadata?.noindex} onCheckedChange={(v) => updateMeta("noindex", v)} />
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-border p-3">
                    <div>
                      <p className="text-xs font-bold text-primary">nofollow</p>
                      <p className="text-[10px] text-muted-foreground">{t(lang, "منع تتبع الروابط في الصفحة", "Tell crawlers not to follow links")}</p>
                    </div>
                    <Switch checked={!!editing.metadata?.nofollow} onCheckedChange={(v) => updateMeta("nofollow", v)} />
                  </div>
                </div>

                {/* GEO targeting block */}
                <div className="mt-4 rounded-xl border border-dashed border-secondary/40 bg-secondary/10 p-3">
                  <p className="mb-2 text-xs font-extrabold text-primary">{t(lang, "استهداف جغرافي (GEO)", "Geo targeting (GEO)")}</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label>geo.region</Label>
                      <Input
                        dir="ltr"
                        value={editing.metadata?.geo_region || ""}
                        onChange={(e) => updateMeta("geo_region", normalizeGeoRegion(e.target.value))}
                        placeholder="EG-DK"
                        aria-invalid={!isValidGeoRegion(editing.metadata?.geo_region)}
                      />
                      {!isValidGeoRegion(editing.metadata?.geo_region) && (
                        <p className="mt-1 text-[10px] text-destructive">{t(lang, "صيغة غير صحيحة. مثال: EG أو EG-DK", "Invalid format. Example: EG or EG-DK")}</p>
                      )}
                    </div>
                    <div>
                      <Label>geo.placename</Label>
                      <Input value={editing.metadata?.geo_placename || ""} onChange={(e) => updateMeta("geo_placename", e.target.value)} placeholder={t(lang, "المنصورة، الدقهلية", "Mansoura, Dakahlia")} />
                    </div>
                    <div>
                      <Label>geo.position</Label>
                      <Input
                        dir="ltr"
                        value={editing.metadata?.geo_position || ""}
                        onChange={(e) => updateMeta("geo_position", normalizeGeoPosition(e.target.value))}
                        placeholder="31.0409;31.3785"
                        aria-invalid={!isValidGeoPosition(editing.metadata?.geo_position)}
                      />
                      {!isValidGeoPosition(editing.metadata?.geo_position) && (
                        <p className="mt-1 text-[10px] text-destructive">{t(lang, "صيغة غير صحيحة. مثال: 31.0409;31.3785", "Invalid. Example: 31.0409;31.3785")}</p>
                      )}
                    </div>
                    <div>
                      <Label>{t(lang, "مدن الخدمة (افصل بفاصلة)", "Service cities (comma separated)")}</Label>
                      <Input
                        value={editing.metadata?.service_cities || ""}
                        onChange={(e) => updateMeta("service_cities", e.target.value)}
                        onBlur={(e) => updateMeta("service_cities", normalizeServiceCities(e.target.value))}
                        placeholder={t(lang, "المنصورة, ميت غمر, بلقاس", "Mansoura, Mit Ghamr, Belqas")}
                      />
                    </div>
                  </div>
                </div>

                {/* AEO / AIO block */}
                <div className="mt-4 rounded-xl border border-dashed border-accent/40 bg-accent/10 p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-xs font-extrabold text-primary">{t(lang, "تحسين للذكاء الاصطناعي (AEO / AIO)", "AI / Answer Engine Optimization (AEO / AIO)")}</p>
                    <Button type="button" size="sm" onClick={generateAi} disabled={aiBusy || !editing.title_ar} className="h-8 bg-orange-grad font-extrabold text-accent-foreground">
                      {aiBusy ? <Loader2 className="me-1 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="me-1 h-3.5 w-3.5" />}
                      {t(lang, "توليد بالذكاء الاصطناعي", "Generate with AI")}
                    </Button>
                  </div>
                  <p className="mb-2 text-[11px] text-muted-foreground">{t(lang, "ملخص قصير وأسئلة شائعة عشان جوجل وChatGPT وPerplexity يعرضوا إجابة مباشرة من الصفحة.", "Short summary + FAQ help Google AI Overviews, ChatGPT and Perplexity answer directly from the page.")}</p>
                  <div className="grid gap-3">
                    <div>
                      <Label>{t(lang, "ملخص للذكاء الاصطناعي (عربي)", "AI summary (AR)")}</Label>
                      <Textarea rows={3} dir="rtl" maxLength={320} value={editing.metadata?.ai_summary_ar || ""} onChange={(e) => updateMeta("ai_summary_ar", e.target.value)} />
                    </div>
                    <div>
                      <Label>AI summary (EN)</Label>
                      <Textarea rows={3} dir="ltr" maxLength={320} value={editing.metadata?.ai_summary_en || ""} onChange={(e) => updateMeta("ai_summary_en", e.target.value)} />
                    </div>
                    <div>
                      <Label>{t(lang, "أسئلة شائعة (عربي) — سطر لكل سؤال بصيغة: سؤال | إجابة", "FAQ (AR) — one line per Q in format: Question | Answer")}</Label>
                      <Textarea rows={4} dir="rtl" value={editing.metadata?.faq_ar || ""} onChange={(e) => updateMeta("faq_ar", e.target.value)} placeholder={"كم سعر صك الأضحية؟ | يبدأ من 1400 جنيه."} />
                    </div>
                    <div>
                      <Label>FAQ (EN) — Question | Answer per line</Label>
                      <Textarea rows={4} dir="ltr" value={editing.metadata?.faq_en || ""} onChange={(e) => updateMeta("faq_en", e.target.value)} placeholder={"How much is a qurbani share? | Starts at 1400 EGP."} />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="settings" className="space-y-3 pt-3">
                <div className="flex items-center justify-between rounded-xl border border-border p-3">
                  <div>
                    <p className="font-bold text-primary">{t(lang, "نشط", "Active")}</p>
                    <p className="text-[11px] text-muted-foreground">{t(lang, "الإيقاف يخفيه من واجهات المتبرعين والاختيار.", "Disabling hides it from donor interfaces and selection.")}</p>
                  </div>
                  <Switch checked={editing.active ?? true} onCheckedChange={(v) => updateField("active", v)} />
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border p-3">
                  <div>
                    <p className="font-bold text-primary">{t(lang, "إخفاء عن الجمهور", "Hide from public")}</p>
                    <p className="text-[11px] text-muted-foreground">{t(lang, "يبقى متاحًا للإدارة فقط دون عرضه في الموقع العام.", "Visible only in admin, hidden from the public site.")}</p>
                  </div>
                  <Switch checked={!!editing.metadata?.hidden_from_public} onCheckedChange={(v) => updateMeta("hidden_from_public", v)} />
                </div>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" onClick={() => setEditing(null)}><X className="me-1 h-4 w-4" /> {t(lang, "إلغاء", "Cancel")}</Button>
            <Button onClick={save} disabled={saving} className="bg-orange-grad font-extrabold text-accent-foreground">
              {saving ? <Loader2 className="me-1 h-4 w-4 animate-spin" /> : <Save className="me-1 h-4 w-4" />}
              {t(lang, "حفظ", "Save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto" dir={lang === "ar" ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-extrabold">
              <Link2 className="h-4 w-4" />
              {t(lang, "ربط البرامج بالقطاعات", "Link programs to sectors")}
            </DialogTitle>
          </DialogHeader>
          {sectors.length === 0 ? (
            <div className="rounded-xl bg-muted/30 p-4 text-sm text-muted-foreground">
              {t(lang, "لا توجد قطاعات بعد. شغّل «مزامنة من بيانات الموقع» أولًا لإنشاء القطاعات.", "No sectors yet. Run “Sync from site data” first to create sectors.")}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                {t(lang, "كل برنامج يجب أن يكون مرتبطًا بقطاع. لن يتم الحفظ إذا بقي أي برنامج بدون قطاع.", "Every program must be linked to a sector. Save is blocked while any program is unlinked.")}
              </p>
              <div className="divide-y divide-border rounded-xl border border-border">
                {items.map((n) => {
                  const val = linkDraft[n.id] ?? "";
                  const missing = !val;
                  return (
                    <div key={n.id} className="flex flex-wrap items-center gap-3 p-3">
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-bold text-primary">{lang === "ar" ? n.title_ar : (n.title_en || n.title_ar)}</div>
                        <div className="font-mono text-[11px] text-muted-foreground">/{n.slug}</div>
                      </div>
                      <select
                        value={val}
                        onChange={(e) => setLinkDraft((d) => ({ ...d, [n.id]: e.target.value || null }))}
                        className={`h-9 min-w-[180px] rounded-md border bg-background px-2 text-sm ${missing ? "border-destructive text-destructive" : "border-input"}`}
                      >
                        <option value="">{t(lang, "— اختر قطاع —", "— Pick sector —")}</option>
                        {(Array.isArray(sectors) ? sectors : []).map((s) => (
                          <option key={s.id} value={s.id}>{lang === "ar" ? (s.title_ar || s.slug) : (s.title_en || s.slug)}</option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" onClick={() => setLinkOpen(false)}>
              <X className="me-1 h-4 w-4" /> {t(lang, "إلغاء", "Cancel")}
            </Button>
            <Button onClick={saveLinker} disabled={linkSaving || sectors.length === 0} className="bg-orange-grad font-extrabold text-accent-foreground">
              {linkSaving ? <Loader2 className="me-1 h-4 w-4 animate-spin" /> : <Save className="me-1 h-4 w-4" />}
              {t(lang, "حفظ الربط", "Save links")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
