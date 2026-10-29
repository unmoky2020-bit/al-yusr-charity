import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ExternalLink, Plus, Pencil, Trash2, Loader2, Search, Eye, EyeOff,
  Image as ImageIcon, Star, StarOff, Send, Clock4, RefreshCcw,
  CheckCircle2, ArrowRight, AlertTriangle,
} from "lucide-react";
import { AdminLayout, StatCard } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useLang } from "@/i18n/LangContext";
import { toast } from "@/hooks/use-toast";
import {
  listAllStories,
  deleteStory,
  toggleStoryField,
  upsertStory,
  STATIC_STORIES,
  type StoryCard,
} from "@/data/storiesApi";
import { casesApi, type LaravelCase } from "@/data/laravelApi";
import { apiErrorMessage } from "@/data/api/adminApiHelpers";
import { publicUrls } from "@/lib/publicUrls";

type CompletedCase = {
  id: string; ref_code: string; title: string;
  beneficiary_name: string; city: string | null;
  governorate: string; status: string; cover_image_url: string | null;
};

const tr = (lang: "ar" | "en", ar: string, en: string) => (lang === "ar" ? ar : en);

export default function AdminStories() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const nav = useNavigate();

  const [items, setItems] = useState<StoryCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "published" | "draft" | "featured" | "review">("all");
  const [syncing, setSyncing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Case picker
  const [casePickerOpen, setCasePickerOpen] = useState(false);
  const [completedCases, setCompletedCases] = useState<CompletedCase[]>([]);
  const [casesLoading, setCasesLoading] = useState(false);

  // Delete confirm dialog
  const [deleteTarget, setDeleteTarget] = useState<StoryCard | null>(null);
  const [deleting, setDeleting] = useState(false);

  const reload = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setItems(await listAllStories());
    } catch (e) {
      setItems([]);
      setLoadError(apiErrorMessage(e, "تعذر تحميل القصص"));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { void reload(); }, []);

  /* ── Case picker ──────────────────────────────────────────────────────── */
  const openCasePicker = async () => {
    setCasePickerOpen(true);
    setCasesLoading(true);
    try {
      const allCases = await casesApi.listAll();
      const usedCases = new Set(items.map((s) => s.case_id).filter(Boolean));
      const formatted: CompletedCase[] = (allCases || [])
        .filter((c: LaravelCase) => !usedCases.has(String(c.id)))
        .map((c: LaravelCase) => ({
          id: String(c.id),
          ref_code: c.code || `CASE-${c.id}`,
          title: c.title,
          beneficiary_name: c.beneficiary_name || "",
          city: c.city || null,
          governorate: c.governorate || "",
          status: c.status || "approved",
          cover_image_url: c.cover_image || null,
        }));
      setCompletedCases(formatted);
    } catch {
      setCompletedCases([]);
    } finally {
      setCasesLoading(false);
    }
  };

  /* ── Sync defaults ───────────────────────────────────────────────────── */
  const syncFromSite = async () => {
    setSyncing(true);
    // Compare with the server's list right now (not the screen's), so an existing story is never re-sent.
    let existing: Set<string>;
    try {
      existing = new Set((await listAllStories()).map((s) => s.slug));
    } catch (err: unknown) {
      setSyncing(false);
      toast({ variant: "destructive", title: tr(lang, "تعذر قراءة القصص الحالية", "Could not read current stories"), description: apiErrorMessage(err) });
      return;
    }
    const toInsert = STATIC_STORIES.filter((s) => !existing.has(s.slug));
    if (toInsert.length === 0) {
      setSyncing(false);
      toast({ title: tr(lang, "كل القصص الافتراضية موجودة بالفعل", "All default stories already exist") });
      return;
    }
    try {
      let ok = 0;
      let lastError = "";
      for (const s of toInsert) {
        // Static ids ("static-N") are never sent: upsertStory creates a new Laravel record.
        const res = await upsertStory({ ...s, image_url: null });
        if (res.error) lastError = res.error; else ok++;
      }
      if (lastError) {
        toast({ variant: "destructive", title: tr(lang, `تمت إضافة ${ok} من ${toInsert.length} قصة`, `Added ${ok} of ${toInsert.length}`), description: lastError });
      } else {
        toast({ title: tr(lang, `تمت إضافة ${toInsert.length} قصة بنجاح`, `Added ${toInsert.length} stories successfully`) });
      }
      reload();
    } catch (err: unknown) {
      toast({ variant: "destructive", title: tr(lang, "فشل المزامنة", "Sync failed"), description: apiErrorMessage(err) });
    } finally {
      setSyncing(false);
    }
  };

  /* ── CRUD actions ─────────────────────────────────────────────────────── */
  const togglePublish = async (s: StoryCard) => {
    const next = !s.is_published;
    const { error } = await toggleStoryField(s.id, s.slug, "is_published", next);
    if (error) { toast({ variant: "destructive", title: tr(lang, "فشل التحديث", "Update failed"), description: error }); return; }
    toast({ title: next ? tr(lang, "تم النشر", "Published") : tr(lang, "تم سحب النشر", "Unpublished") });
    reload();
  };

  const submitForReview = async (s: StoryCard) => {
    const { error } = await toggleStoryField(s.id, s.slug, "pending_review", true);
    if (error) { toast({ variant: "destructive", title: tr(lang, "فشل الإرسال", "Submit failed"), description: error }); return; }
    toast({ title: tr(lang, "تم الإرسال للمراجعة", "Submitted for review") });
    reload();
  };

  const toggleFeatured = async (s: StoryCard) => {
    const { error } = await toggleStoryField(s.id, s.slug, "is_featured", !s.is_featured);
    if (error) { toast({ variant: "destructive", title: tr(lang, "فشل التحديث", "Update failed"), description: error }); return; }
    reload();
  };

  const confirmDelete = (s: StoryCard) => setDeleteTarget(s);

  const executeDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await deleteStory(deleteTarget.id, deleteTarget.slug);
    setDeleting(false);
    setDeleteTarget(null);
    if (error) { toast({ variant: "destructive", title: tr(lang, "فشل الحذف", "Delete failed"), description: error }); return; }
    toast({ title: tr(lang, "تم الحذف", "Deleted") });
    reload();
  };

  /* ── Filters ──────────────────────────────────────────────────────────── */
  const safeItems = Array.isArray(items) ? items : [];
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return safeItems.filter((s) => {
      if (filter === "published" && !s.is_published) return false;
      if (filter === "draft" && s.is_published) return false;
      if (filter === "featured" && !s.is_featured) return false;
      if (filter === "review" && !s.pending_review) return false;
      if (!q) return true;
      return [s.slug, s.title_ar, s.title_en, s.role_ar, s.role_en, s.location_ar, s.location_en]
        .filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
    });
  }, [safeItems, search, filter]);

  const stats = useMemo(() => ({
    total: safeItems.length,
    published: safeItems.filter((i) => i.is_published).length,
    draft: safeItems.filter((i) => !i.is_published).length,
    featured: safeItems.filter((i) => i.is_featured).length,
    review: safeItems.filter((i) => i.pending_review).length,
  }), [safeItems]);

  /* ── Render ────────────────────────────────────────────────────────────── */
  return (
    <AdminLayout>
      <div dir={isAr ? "rtl" : "ltr"} className="space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-3 rounded-2xl bg-card p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-base font-extrabold text-primary md:text-lg">
              {tr(lang, "إدارة محتوى القصص", "Stories CMS")}
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {tr(lang,
                "أنشئ قصص الأثر، اربطها ببرنامج أو محور، وتحكّم بظهورها في قسم «أثرنا في حياة أسرة» بالصفحة الرئيسية (القصص المميزة بتظهر هناك بالتناوب: الصورة، والقصة القصيرة، واسم الشخص).",
                "Create impact stories, link to a program or pillar, and control visibility in the homepage Testimonials section."
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={syncFromSite} disabled={syncing}>
              {syncing ? <Loader2 className="me-1 h-4 w-4 animate-spin" /> : <RefreshCcw className="me-1 h-4 w-4" />}
              {tr(lang, "مزامنة من بيانات الموقع", "Sync from site")}
            </Button>
            <Button variant="outline" onClick={openCasePicker}>
              <CheckCircle2 className="me-1 h-4 w-4" /> {tr(lang, "إنشاء من حالة مكتملة", "From completed case")}
            </Button>
            <Button onClick={() => nav("/admin/stories/new")} className="bg-orange-grad font-extrabold text-accent-foreground">
              <Plus className="me-1 h-4 w-4" /> {tr(lang, "قصة جديدة", "New story")}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-3 sm:grid-cols-5">
          <StatCard accent label={tr(lang, "الإجمالي", "Total")} value={stats.total} />
          <StatCard label={tr(lang, "منشور", "Published")} value={stats.published} />
          <StatCard label={tr(lang, "مسودات", "Drafts")} value={stats.draft} />
          <StatCard label={tr(lang, "مميّزة", "Featured")} value={stats.featured} />
          <StatCard label={tr(lang, "بانتظار المراجعة", "Pending review")} value={stats.review} />
        </div>

        {/* Search + Filter bar */}
        <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-card p-3 shadow-soft">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={tr(lang, "بحث…", "Search…")} className="ps-9" />
          </div>
          <div className="flex gap-1">
            {(["all", "published", "draft", "featured", "review"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}>
                {f === "all" ? tr(lang, "الكل", "All")
                  : f === "published" ? tr(lang, "منشور", "Published")
                  : f === "draft" ? tr(lang, "مسودات", "Drafts")
                  : f === "featured" ? tr(lang, "مميّزة", "Featured")
                  : tr(lang, "للمراجعة", "Review")}
              </button>
            ))}
          </div>
        </div>

        {/* Stories grid */}
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl bg-card p-10 text-center shadow-soft">
            {loadError && <p className="mb-2 text-sm font-bold text-destructive">{loadError}</p>}
            <p className="text-sm text-muted-foreground">
              {tr(lang, "لا توجد قصص بعد. ابدأ بإضافة أول قصة، أو وثّق قصة من حالة مكتملة.", "No stories yet. Add the first one, or document a story from a completed case.")}
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Button onClick={() => nav("/admin/stories/new")} className="bg-orange-grad font-extrabold text-accent-foreground">
                <Plus className="me-1 h-4 w-4" /> {tr(lang, "قصة جديدة", "New story")}
              </Button>
              <Button variant="outline" onClick={openCasePicker}><CheckCircle2 className="me-1 h-4 w-4" /> {tr(lang, "من حالة مكتملة", "From completed case")}</Button>
              <Button variant="outline" onClick={syncFromSite} disabled={syncing}><RefreshCcw className="me-1 h-4 w-4" /> {tr(lang, "تعبئة الافتراضي", "Seed defaults")}</Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((s) => {
              const title = isAr ? s.title_ar : (s.title_en || s.title_ar);
              const role  = isAr ? s.role_ar  : (s.role_en  || s.role_ar);
              const quote = isAr ? s.quote_ar : (s.quote_en || s.quote_ar);
              return (
                <article key={s.id} className="group overflow-hidden rounded-2xl bg-card shadow-soft transition hover:shadow-cta">
                  {/* Image */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    {s.image_url ? (
                      <img src={s.image_url} alt={title} className="h-full w-full object-cover transition group-hover:scale-105" loading="lazy" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground"><ImageIcon className="h-8 w-8" /></div>
                    )}
                    <div className="absolute end-2 top-2 flex gap-1">
                      {!s.is_published && <span className="rounded-full bg-muted/90 px-2 py-0.5 text-[10px] font-black text-muted-foreground">{tr(lang, "مسودة", "Draft")}</span>}
                      {s.pending_review && <span className="rounded-full bg-amber-500/90 px-2 py-0.5 text-[10px] font-black text-white">⏳ {tr(lang, "للمراجعة", "Review")}</span>}
                      {s.is_featured && <span className="rounded-full bg-secondary/90 px-2 py-0.5 text-[10px] font-black text-secondary-foreground">★ {tr(lang, "مميّزة", "Featured")}</span>}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="space-y-2 p-4">
                    <h3 className="line-clamp-1 font-extrabold text-primary">{title}</h3>
                    <p className="text-[11px] font-bold text-secondary-foreground/80">
                      {role}{s.location_ar ? ` · ${isAr ? s.location_ar : (s.location_en || s.location_ar)}` : ""}
                    </p>
                    <p className="line-clamp-2 min-h-[2.5em] text-xs italic text-muted-foreground">"{quote}"</p>

                    <div className="flex items-center justify-between border-t border-border pt-2 text-[11px]">
                      <span className="font-mono text-muted-foreground">/{s.slug}</span>
                      <Link to={publicUrls.story(s.slug)} target="_blank" rel="noreferrer" className="flex items-center gap-1 font-bold text-accent hover:underline">
                        {tr(lang, "معاينة", "Preview")} <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>

                    <div className="flex flex-wrap items-center gap-1 pt-2">
                      <Button size="sm" variant="outline" onClick={() => nav(`/admin/stories/${s.id}`)} className="h-8 text-xs">
                        <Pencil className="me-1 h-3 w-3" /> {tr(lang, "تعديل", "Edit")}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => togglePublish(s)} className="h-8 text-xs">
                        {s.is_published ? <Eye className="me-1 h-3 w-3" /> : <EyeOff className="me-1 h-3 w-3" />}
                        {s.is_published ? tr(lang, "منشور", "Live") : tr(lang, "مسودة", "Draft")}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => toggleFeatured(s)} className="h-8 text-xs" title={tr(lang, "تمييز / إلغاء التمييز", "Feature / unfeature")}>
                        {s.is_featured ? <Star className="me-1 h-3 w-3 fill-current text-secondary" /> : <StarOff className="me-1 h-3 w-3" />}
                      </Button>
                      {!s.is_published && !s.pending_review && (
                        <Button size="sm" variant="ghost" onClick={() => submitForReview(s)} className="h-8 text-xs text-amber-600 hover:text-amber-700">
                          <Send className="me-1 h-3 w-3" /> {tr(lang, "للمراجعة", "Submit")}
                        </Button>
                      )}
                      {s.pending_review && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-700">
                          <Clock4 className="h-3 w-3" /> {tr(lang, "بانتظار المراجعة", "In review")}
                        </span>
                      )}
                      {/* Delete — opens confirm dialog */}
                      <Button
                        size="sm" variant="ghost"
                        onClick={() => confirmDelete(s)}
                        className="ms-auto h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Delete confirmation dialog ────────────────────────────────────── */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent dir={isAr ? "rtl" : "ltr"} className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {tr(lang, "تأكيد الحذف", "Confirm delete")}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {tr(lang,
              `هل أنت متأكد من حذف قصة «${deleteTarget ? (isAr ? deleteTarget.title_ar : (deleteTarget.title_en || deleteTarget.title_ar)) : ""}»؟ لا يمكن التراجع عن هذا الإجراء.`,
              `Are you sure you want to delete "${deleteTarget ? (deleteTarget.title_en || deleteTarget.title_ar) : ""}"? This cannot be undone.`
            )}
          </p>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              {tr(lang, "إلغاء", "Cancel")}
            </Button>
            <Button variant="destructive" onClick={executeDelete} disabled={deleting}>
              {deleting ? <Loader2 className="me-1 h-4 w-4 animate-spin" /> : <Trash2 className="me-1 h-4 w-4" />}
              {tr(lang, "حذف نهائياً", "Delete permanently")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Case picker dialog ────────────────────────────────────────────── */}
      <Dialog open={casePickerOpen} onOpenChange={setCasePickerOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto" dir={isAr ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-extrabold">
              <CheckCircle2 className="h-4 w-4 text-secondary" />
              {tr(lang, "وثّق قصة من حالة مكتملة", "Document a story from a completed case")}
            </DialogTitle>
          </DialogHeader>
          {casesLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : completedCases.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {tr(lang, "لا توجد حالات مكتملة بدون قصة موثقة.", "No completed cases without a documented story.")}
            </p>
          ) : (
            <div className="space-y-2">
              {completedCases.map((c) => (
                <button key={c.id}
                  onClick={() => { setCasePickerOpen(false); nav(`/admin/stories/new?from_case=${c.id}`); }}
                  className="flex w-full items-center gap-3 rounded-xl border border-border p-3 text-start transition hover:border-primary hover:bg-primary/5">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {c.cover_image_url ? <img src={c.cover_image_url} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-muted-foreground"><ImageIcon className="h-5 w-5" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="line-clamp-1 font-bold text-primary">{c.title}</p>
                    <p className="text-[11px] text-muted-foreground">{c.beneficiary_name} · {[c.city, c.governorate].filter(Boolean).join(" - ")} · <span className="font-mono">{c.ref_code}</span></p>
                  </div>
                  <span className="rounded-full bg-secondary/15 px-2 py-0.5 text-[10px] font-extrabold text-secondary-foreground">
                    {c.status === "funded" ? tr(lang, "تم جمعها", "Funded") : tr(lang, "مغلقة", "Closed")}
                  </span>
                  <ArrowRight className={`h-4 w-4 text-muted-foreground ${isAr ? "rotate-180" : ""}`} />
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
