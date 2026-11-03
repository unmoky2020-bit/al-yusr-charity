import { UiSelect } from "@/components/common/UiSelect";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  CheckCircle2, AlertTriangle, Search as SearchIcon, ExternalLink, Tag, Image as ImageIcon,
  ShieldAlert, Loader2, Wand2, Plus, X, Calendar, Clock, FileDown, FileJson, Upload, Eye,
  MoreHorizontal, Pencil, Trash2, Archive,
} from "lucide-react";
import { AdminLayout, StatCard } from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { RequireAuth } from "@/auth/RequireAuth";
import { useLang } from "@/i18n/LangContext";
import { type BlogPost } from "@/data/blog";
import { useAllBlogRowsAdmin } from "@/data/useBlogPosts";
import {
  createPost, updatePostStatus, updatePostMedia, deletePost,
  type DbBlogPost, type DbStatus, dbToBlogPost,
} from "@/data/blogApi";
import { axisOfPost, getAxis, authorOfPost, readingTime } from "@/data/blogTaxonomy";
import { generateOg, downloadDataUrl } from "@/lib/og-generator";
import { uploadBlogMedia, generateAndUploadOg } from "@/lib/blog-uploads";
import { auditPost, downloadJson, downloadPdf } from "@/lib/seo-report";
import { lintArticleSchema, type SchemaIssue } from "@/lib/lint-jsonld";
import { toast } from "@/hooks/use-toast";
import { BlogImportDialog } from "@/components/admin/BlogImportDialog";
import { publicUrls } from "@/lib/publicUrls";

type Row = {
  post: BlogPost;
  db: DbBlogPost | null;
  words: number;
  minutes: number;
  hasOg: boolean;
  hasSchema: boolean;
  hasCategory: boolean;
  hasTimeRequired: boolean;
  hasWordCountOk: boolean;
  titleLen: number;
  descLen: number;
  tagsCount: number;
  score: number;
};

const audit = (post: BlogPost, db: DbBlogPost | null): Row => {
  // Bilingual scoring (matches the SQL rubric used for DB seo_score)
  const rt = readingTime(post, "ar");
  const war = (post.ar.body || []).join(" ").split(/\s+/).filter(Boolean).length;
  const wen = (post.en.body || []).join(" ").split(/\s+/).filter(Boolean).length;
  const tar = post.ar.title.length;
  const ten = post.en.title.length;
  const ear = post.ar.excerpt.length;
  const een = post.en.excerpt.length;
  const gar = post.ar.tags?.length ?? 0;
  const gen = post.en.tags?.length ?? 0;
  const hasImg = !!(db?.image_url || post.image);
  const hasOg = !!(db?.og_image_url) || !!post.image;
  const hasFk = !!(db?.focus_keyword && db.focus_keyword.length > 0);
  const hasCat = !!(post.category?.ar && post.category?.en);
  const band = (n: number, a: number, b: number, fa: number, fb: number, full: number, partial: number) =>
    n >= a && n <= b ? full : n >= fa && n <= fb ? partial : 0;
  const score = Math.min(100,
      (war >= 600 ? 12 : war >= 300 ? 8 : war >= 120 ? 4 : 0)
    + (wen >= 600 ? 12 : wen >= 300 ? 8 : wen >= 120 ? 4 : 0)
    + band(tar, 30, 70, 20, 90, 8, 6)
    + band(ten, 30, 70, 20, 90, 8, 6)
    + band(ear, 80, 170, 60, 220, 8, 6)
    + band(een, 80, 170, 60, 220, 8, 6)
    + (gar >= 3 ? 6 : gar >= 1 ? 3 : 0)
    + (gen >= 3 ? 6 : gen >= 1 ? 3 : 0)
    + (hasImg ? 8 : 0)
    + (hasOg ? 8 : 0)
    + (hasFk ? 4 : 0)
    + (hasCat ? 6 : 0)
    + 6, // JSON-LD schema auto-emitted
  );
  return {
    post, db,
    words: rt.words, minutes: rt.minutes,
    hasOg, hasSchema: true, hasCategory: hasCat,
    hasTimeRequired: rt.minutes > 0,
    hasWordCountOk: war >= 600 && wen >= 600,
    titleLen: tar, descLen: ear, tagsCount: gar,
    score,
  };
};

const Pill = ({ ok, label }: { ok: boolean; label: string }) => (
  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold ${ok ? "bg-secondary/15 text-primary" : "bg-destructive/10 text-destructive"}`}>
    {ok ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />} {label}
  </span>
);

const STATUS_LABELS: Record<DbStatus | "all" | "static", { ar: string; en: string; cls: string }> = {
  all:            { ar: "الكل",         en: "All",            cls: "bg-muted text-foreground" },
  draft:          { ar: "مسودّة",       en: "Draft",          cls: "bg-amber-100 text-amber-800" },
  pending_review: { ar: "قيد المراجعة", en: "Pending review", cls: "bg-blue-100 text-blue-800" },
  scheduled:      { ar: "مجدول",        en: "Scheduled",      cls: "bg-violet-100 text-violet-800" },
  published:      { ar: "منشور",        en: "Published",      cls: "bg-emerald-100 text-emerald-800" },
  archived:       { ar: "مؤرشف",        en: "Archived",       cls: "bg-zinc-200 text-zinc-700" },
  static:         { ar: "ثابت",         en: "Seed",           cls: "bg-secondary/30 text-primary" },
};

type StatusFilter = DbStatus | "all";

const Inner = () => {
  const { lang } = useLang();
  const isRTL = lang === "ar";
  const { rows: dbRows, refetch } = useAllBlogRowsAdmin();
  const [showImport, setShowImport] = useState(false);
  const [params, setParams] = useSearchParams();

  const [q, setQ] = useState(params.get("q") ?? "");
  const [statusF, setStatusF] = useState<StatusFilter>((params.get("status") as StatusFilter) || "all");
  const [from, setFrom] = useState(params.get("from") ?? "");
  const [to, setTo] = useState(params.get("to") ?? "");
  const [sort, setSort] = useState<"score" | "date" | "updated">((params.get("sort") as any) || "score");

  // Persist filters to URL
  useEffect(() => {
    const next: Record<string, string> = {};
    if (q) next.q = q;
    if (statusF !== "all") next.status = statusF;
    if (from) next.from = from;
    if (to) next.to = to;
    if (sort !== "score") next.sort = sort;
    setParams(next, { replace: true });
  }, [q, statusF, from, to, sort, setParams]);

  // Use DB rows + static seed merged in audit.
  const safeDbRows = Array.isArray(dbRows) ? dbRows : [];
  const rows = useMemo<Row[]>(
    () => safeDbRows.map((r) => audit(dbToBlogPost(r), r)),
    [safeDbRows],
  );

  const schemaIssuesByPost = useMemo(() => {
    const m = new Map<string, SchemaIssue[]>();
    for (const r of rows) m.set(r.post.slug, lintArticleSchema(r.post));
    return m;
  }, [rows]);

  // ---------- New-post draft state ----------
  const [showNew, setShowNew] = useState(false);
  const [draft, setDraft] = useState({
    slug: "", category_ar: "", category_en: "",
    title_ar: "", title_en: "", excerpt_ar: "", excerpt_en: "",
    body_ar: "", body_en: "", tags_ar: "", tags_en: "",
    image_url: "", focus_keyword: "",
    schedule_at: "" as string,
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const draftScore = useMemo(() => {
    const tags = draft.tags_ar.split(",").map((s) => s.trim()).filter(Boolean);
    const words = draft.body_ar.split(/\s+/).filter(Boolean).length;
    let s = 0;
    if (words >= 600) s += 25; else if (words >= 300) s += 15;
    if (draft.title_ar.length >= 30 && draft.title_ar.length <= 70) s += 15;
    if (draft.excerpt_ar.length >= 80 && draft.excerpt_ar.length <= 170) s += 15;
    if (tags.length >= 3) s += 10;
    if (draft.image_url) s += 15;
    s += 10;
    if (draft.category_ar) s += 10;
    return { score: s, words, tagsCount: tags.length };
  }, [draft]);

  const saveDraft = async (mode: "draft" | "publish" | "schedule") => {
    if (!draft.slug || !draft.title_ar) {
      toast({ title: isRTL ? "العنوان والـ slug مطلوبان" : "Title and slug required", variant: "destructive" });
      return;
    }
    if (mode === "schedule" && !draft.schedule_at) {
      toast({ title: isRTL ? "اختر موعد النشر أولاً" : "Pick a schedule time", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const status: DbStatus = mode === "publish" ? "published" : mode === "schedule" ? "scheduled" : "draft";
      const slug = draft.slug.toLowerCase().replace(/\s+/g, "-");

      // Auto-generate OG if missing & a cover exists
      let og = draft.image_url || undefined;
      if (draft.image_url && draft.title_ar && draft.category_ar) {
        try {
          og = await generateAndUploadOg({ slug, title: draft.title_ar, category: draft.category_ar });
        } catch { /* fall back to image_url */ }
      }

      await createPost({
        slug,
        category_ar: draft.category_ar, category_en: draft.category_en || draft.category_ar,
        focus_keyword: draft.focus_keyword || undefined,
        title_ar: draft.title_ar, title_en: draft.title_en || draft.title_ar,
        excerpt_ar: draft.excerpt_ar, excerpt_en: draft.excerpt_en || draft.excerpt_ar,
        body_ar: draft.body_ar.split(/\n\s*\n/).filter(Boolean),
        body_en: (draft.body_en || draft.body_ar).split(/\n\s*\n/).filter(Boolean),
        tags_ar: draft.tags_ar.split(",").map((s) => s.trim()).filter(Boolean),
        tags_en: (draft.tags_en || draft.tags_ar).split(",").map((s) => s.trim()).filter(Boolean),
        image_url: draft.image_url || undefined,
        og_image_url: og,
        status,
        scheduled_at: mode === "schedule" ? new Date(draft.schedule_at).toISOString() : null,
        seo_score: draftScore.score,
      });
      toast({ title: isRTL ? mode === "publish" ? " نُشر المقال" : mode === "schedule" ? " تم جدولة المقال" : " حُفظ كمسودّة" : mode === "publish" ? " Published" : mode === "schedule" ? " Scheduled" : " Saved as draft", });
      setShowNew(false);
      setDraft({ slug:"", category_ar:"", category_en:"", title_ar:"", title_en:"", excerpt_ar:"", excerpt_en:"", body_ar:"", body_en:"", tags_ar:"", tags_en:"", image_url:"", focus_keyword:"", schedule_at:"" });
      refetch();
    } catch (e: any) {
      toast({ title: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const onPickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setUploading(true);
    try {
      const url = await uploadBlogMedia(f, f.name);
      setDraft((d) => ({ ...d, image_url: url }));
      toast({ title: isRTL ? " تم رفع الصورة" : " Image uploaded" });
    } catch (e: any) {
      toast({ title: isRTL ? "فشل الرفع" : "Upload failed", description: e.message, variant: "destructive" });
    } finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  // ---------- Per-row actions ----------
  const generateOneOg = async (row: Row) => {
    try {
      const og = await generateAndUploadOg({ slug: row.post.slug, title: row.post.ar.title, category: row.post.category.ar });
      if (row.db) await updatePostMedia(row.db.id, { og_image_url: og, image_url: row.db.image_url || og });
      toast({ title: isRTL ? " اتولّدت ورفعت OG" : " OG generated & uploaded" });
      refetch();
    } catch {
      // Fallback to local download
      const dataUrl = await generateOg({ title: row.post.ar.title, category: row.post.category.ar, url: `elyusr.org/blog/${row.post.slug}` });
      downloadDataUrl(dataUrl, `og-${row.post.slug}.jpg`);
      toast({ title: isRTL ? " تم تحميل OG محلياً" : " OG downloaded" });
    }
  };

  const scheduleRow = async (row: Row) => {
    if (!row.db) return;
    const when = window.prompt(isRTL ? "موعد النشر (YYYY-MM-DD HH:MM)" : "Publish at (YYYY-MM-DD HH:MM)", new Date(Date.now() + 60 * 60_000).toISOString().slice(0, 16).replace("T", " "));
    if (!when) return;
    try {
      const iso = new Date(when.replace(" ", "T")).toISOString();
      await updatePostStatus(row.db.id, "scheduled", iso);
      toast({ title: isRTL ? " تم الجدولة" : " Scheduled" });
      refetch();
    } catch (e: any) { toast({ title: e.message, variant: "destructive" }); }
  };

  const setStatus = async (row: Row, s: DbStatus) => {
    if (!row.db) return;
    try { await updatePostStatus(row.db.id, s); toast({ title: STATUS_LABELS[s][lang] }); refetch(); }
    catch (e: any) { toast({ title: e.message, variant: "destructive" }); }
  };

  /** OG + cover for every backend / built-in article that has none — the thumbnail next to it in Google. */
  const [bulkOg, setBulkOg] = useState<{ done: number; total: number } | null>(null);
  const generateMissingOg = async () => {
    const todo = rows.filter((r) => r.db && !r.db.og_image_url);
    if (!todo.length) { toast({ title: isRTL ? "كل المقالات ليها صورة مشاركة" : "Every article has an OG image" }); return; }
    if (!confirm(isRTL ? `هنعمل صورة مشاركة (1200×630) لـ ${todo.length} مقال من عنوانه وتصنيفه، ونحطها غلاف للي مالوش غلاف. نكمّل؟` : `Generate OG images for ${todo.length} articles?`)) return;
    let ok = 0;
    setBulkOg({ done: 0, total: todo.length });
    for (const r of todo) {
      try {
        const og = await generateAndUploadOg({ slug: r.post.slug, title: r.post.ar.title, category: r.post.category.ar });
        await updatePostMedia(r.db!.id, { og_image_url: og, image_url: r.db!.image_url || og });
        ok++;
      } catch { /* keep going */ }
      setBulkOg((b) => (b ? { ...b, done: b.done + 1 } : b));
    }
    setBulkOg(null);
    toast({ title: isRTL ? `اتعملت صورة مشاركة لـ ${ok} مقال` : `${ok} OG images generated` });
    refetch();
  };

  const removeRow = async (row: Row) => {
    if (!row.db) return;
    const builtIn = row.db.id.startsWith("static-");
    const msg = builtIn
      ? (isRTL ? `«${row.post.ar.title}» جزء من كود الموقع، فهيتأرشف ويختفي من المدونة والسايت ماب. نكمّل؟` : "This built-in article will be archived (hidden). Continue?")
      : (isRTL ? `حذف «${row.post.ar.title}» نهائيًا؟` : "Delete this article permanently?");
    if (!confirm(msg)) return;
    try {
      const r = await deletePost(row.db.id);
      toast({ title: r === "archived" ? (isRTL ? "اتأرشف المقال" : "Archived") : (isRTL ? "اتحذف المقال" : "Deleted") });
      refetch();
    } catch (e: any) { toast({ title: e.message, variant: "destructive" }); }
  };

  const downloadReport = (row: Row, kind: "pdf" | "json") => {
    const a = auditPost(row.post);
    if (kind === "pdf") downloadPdf(a); else downloadJson(a);
  };

  // ---------- Filters ----------
  const filtered = useMemo(() => {
    let out = rows;
    if (statusF !== "all") out = out.filter((r) => r.db?.status === statusF);
    if (q) {
      const needle = q.toLowerCase();
      out = out.filter((r) =>
        r.post.slug.toLowerCase().includes(needle)
        || r.post.ar.title.toLowerCase().includes(needle)
        || r.post.en.title.toLowerCase().includes(needle));
    }
    if (from) out = out.filter((r) => r.post.date >= from);
    if (to) out = out.filter((r) => r.post.date <= to);
    if (sort === "date") out = [...out].sort((a, b) => (a.post.date < b.post.date ? 1 : -1));
    else if (sort === "updated") out = [...out].sort((a, b) => ((a.db?.updated_at || "") < (b.db?.updated_at || "") ? 1 : -1));
    else out = [...out].sort((a, b) => a.score - b.score);
    return out;
  }, [rows, statusF, q, from, to, sort]);

  const totals = {
    posts: rows.length,
    avg: Math.round(rows.reduce((s, r) => s + r.score, 0) / Math.max(1, rows.length)),
    weak: rows.filter((r) => r.score < 60).length,
    great: rows.filter((r) => r.score >= 85).length,
  };

  const statusCounts: Record<StatusFilter, number> = {
    all: rows.length,
    draft: rows.filter((r) => r.db?.status === "draft").length,
    pending_review: rows.filter((r) => r.db?.status === "pending_review").length,
    scheduled: rows.filter((r) => r.db?.status === "scheduled").length,
    published: rows.filter((r) => r.db?.status === "published").length,
    archived: rows.filter((r) => r.db?.status === "archived").length,
  };

  return (
    <AdminLayout title={{ ar: "سيو المدونة", en: "Blog SEO" }}>
      <div className="mb-6 rounded-3xl border border-border bg-background/80 p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-2">
            <p className="text-sm font-semibold text-primary">
              {isRTL ? "فحص شامل لأداء السيو ومؤشرات الفهرسة في مقالات المدونة." : "A clean SEO audit for blog post health and indexing."}
            </p>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              {isRTL
                ? "استخدم الفلاتر لتحديد المقالات الأضعف، راجع نقاط السيو لكل منشور، واحصل على خطط تحسين سريعة قابلة للتنفيذ."
                : "Filter weak posts, compare SEO scores, and prioritize quick content improvements with clear actions."}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary/15 px-4 py-2 text-xs font-extrabold text-secondary shadow-sm">
            <SearchIcon className="h-4 w-4" />
            {isRTL ? "فحص سيو المدونة" : "Blog SEO Audit"}
          </div>
        </div>
      </div>
      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={isRTL ? "إجمالي المقالات" : "Total posts"} value={totals.posts} />
        <StatCard label={isRTL ? "متوسط نقاط السيو" : "Avg SEO score"} value={`${totals.avg}/100`} accent />
        <StatCard label={isRTL ? "محتاج تحسين" : "Needs work"} value={totals.weak} />
        <StatCard label={isRTL ? "ممتاز" : "Great"} value={totals.great} />
      </div>

      {/* Filters bar */}
      <div className="mt-5 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-3">
        <div className="relative min-w-[220px] flex-1">
          <SearchIcon className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={isRTL ? "ابحث بالـ slug أو العنوان..." : "Search slug or title..."} className="ps-9" />
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 w-[150px]" />
          <span className="text-xs text-muted-foreground">→</span>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9 w-[150px]" />
        </div>
        <UiSelect value={sort} onChange={(e) => setSort(e.target.value as any)} className="h-9 rounded-md border border-border bg-background px-2 text-xs font-bold">
          <option value="score">{isRTL ? "ترتيب: النقاط" : "Sort: score"}</option>
          <option value="date">{isRTL ? "ترتيب: التاريخ" : "Sort: date"}</option>
          <option value="updated">{isRTL ? "ترتيب: آخر تعديل" : "Sort: updated"}</option>
        </UiSelect>
        <Button asChild variant="outline" size="sm" className="font-extrabold">
          <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-3.5 w-3.5 me-1" /> {isRTL ? "خريطة الموقع XML" : "Sitemap XML"}
          </a>
        </Button>
        <Button size="sm" variant="outline" onClick={generateMissingOg} disabled={!!bulkOg} className="font-extrabold">
          {bulkOg ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
          {bulkOg ? `${bulkOg.done}/${bulkOg.total}` : isRTL ? "صور مشاركة للناقص" : "Missing OG images"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setShowImport(true)} className="font-extrabold">
          <Upload className="h-3.5 w-3.5" /> {isRTL ? "استيراد مقالات" : "Import"}
        </Button>
        <BlogImportDialog open={showImport} onOpenChange={setShowImport} isRTL={isRTL}
          existingSlugs={new Set(dbRows.map((r) => r.slug))} onDone={() => refetch()} />
        <Button size="sm" onClick={() => setShowNew(true)} className="bg-orange-grad font-extrabold text-accent-foreground">
          <Plus className="h-3.5 w-3.5" /> {isRTL ? "مقالة جديدة" : "New post"}
        </Button>
      </div>

      {/* Status chips */}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {(["all","draft","pending_review","scheduled","published","archived"] as StatusFilter[]).map((s) => {
          const meta = STATUS_LABELS[s];
          const active = statusF === s;
          return (
            <button key={s} onClick={() => setStatusF(s)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold transition ${active ? "bg-primary text-primary-foreground" : `${meta.cls} hover:opacity-80`}`}>
              {meta[lang]} <span className="rounded-full bg-background/40 px-1.5 text-[10px]">{statusCounts[s]}</span>
            </button>
          );
        })}
      </div>

      {/* New post editor */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" onClick={() => setShowNew(false)}>
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-t-3xl bg-card p-5 shadow-2xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-primary">{isRTL ? "محرر مقالة جديدة" : "New article editor"}</h3>
                <p className="text-xs text-muted-foreground">{isRTL ? "محرر بأسلوب AIOSEO — نقاط السيو حية، رفع صور، جدولة، توليد OG تلقائي." : "AIOSEO-style — live score, image upload, schedule, auto-OG."}</p>
              </div>
              <button onClick={() => setShowNew(false)} className="rounded-md p-1 text-muted-foreground hover:bg-muted"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-[1fr,280px]">
              <div className="grid gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input placeholder="slug (e.g. my-post-2026)" value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} />
                  <Input placeholder={isRTL ? "الكلمة المفتاحية" : "Focus keyword"} value={draft.focus_keyword} onChange={(e) => setDraft({ ...draft, focus_keyword: e.target.value })} />
                  <Input placeholder={isRTL ? "التصنيف (عربي)" : "Category (AR)"} value={draft.category_ar} onChange={(e) => setDraft({ ...draft, category_ar: e.target.value })} />
                  <Input placeholder="Category (EN)" value={draft.category_en} onChange={(e) => setDraft({ ...draft, category_en: e.target.value })} />
                  <Input placeholder={isRTL ? "العنوان (عربي)" : "Title (AR)"} value={draft.title_ar} onChange={(e) => setDraft({ ...draft, title_ar: e.target.value })} />
                  <Input placeholder="Title (EN)" value={draft.title_en} onChange={(e) => setDraft({ ...draft, title_en: e.target.value })} />
                </div>
                <textarea className="min-h-[60px] w-full rounded-md border border-input bg-background p-3 text-sm" placeholder={isRTL ? "الوصف القصير (عربي) — 80-170 حرف" : "Excerpt (AR) — 80-170 chars"} value={draft.excerpt_ar} onChange={(e) => setDraft({ ...draft, excerpt_ar: e.target.value })} />
                <textarea className="min-h-[60px] w-full rounded-md border border-input bg-background p-3 text-sm" placeholder="Excerpt (EN)" value={draft.excerpt_en} onChange={(e) => setDraft({ ...draft, excerpt_en: e.target.value })} />
                <textarea className="min-h-[200px] w-full rounded-md border border-input bg-background p-3 text-sm" placeholder={isRTL ? "نص المقال (عربي) — افصل الفقرات بسطر فارغ — اهدف ≥600 كلمة" : "Body (AR) — separate paragraphs by blank line — aim ≥600 words"} value={draft.body_ar} onChange={(e) => setDraft({ ...draft, body_ar: e.target.value })} />
                <textarea className="min-h-[120px] w-full rounded-md border border-input bg-background p-3 text-sm" placeholder="Body (EN) — paragraphs separated by blank lines" value={draft.body_en} onChange={(e) => setDraft({ ...draft, body_en: e.target.value })} />
                <Input placeholder={isRTL ? "وسوم AR (مفصولة بفاصلة) — 3+" : "Tags AR (comma) — 3+"} value={draft.tags_ar} onChange={(e) => setDraft({ ...draft, tags_ar: e.target.value })} />
                <Input placeholder="Tags EN (comma)" value={draft.tags_en} onChange={(e) => setDraft({ ...draft, tags_en: e.target.value })} />

                {/* Cover image — upload OR URL */}
                <div className="rounded-xl border border-dashed border-border bg-muted/20 p-3">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">{isRTL ? "صورة الغلاف" : "Cover image"}</label>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {draft.image_url
                      ? <img src={draft.image_url} alt="" className="h-16 w-28 rounded-lg object-cover" />
                      : <div className="grid h-16 w-28 place-items-center rounded-lg bg-muted text-muted-foreground"><ImageIcon className="h-5 w-5" /></div>}
                    <Button type="button" size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
                      {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                      {isRTL ? "رفع صورة" : "Upload"}
                    </Button>
                    <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickImage} />
                    <Input className="flex-1 min-w-[200px]" placeholder={isRTL ? "أو ألصق رابط صورة" : "Or paste image URL"} value={draft.image_url} onChange={(e) => setDraft({ ...draft, image_url: e.target.value })} />
                  </div>
                  <p className="mt-2 text-[10px] text-muted-foreground">{isRTL ? "صورة OG (1200x630) ستُولَّد وتُرفع تلقائياً عند الحفظ." : "OG image (1200x630) is generated & uploaded automatically on save."}</p>
                </div>

                {/* Scheduling */}
                <div className="rounded-xl border border-border bg-muted/20 p-3">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">{isRTL ? "جدولة النشر" : "Schedule publish"}</label>
                  <div className="mt-2 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <Input type="datetime-local" value={draft.schedule_at} onChange={(e) => setDraft({ ...draft, schedule_at: e.target.value })} className="max-w-[260px]" />
                    <span className="text-[10px] text-muted-foreground">{isRTL ? "(يتنشر تلقائياً عند الموعد)" : "(auto-publishes at this time)"}</span>
                  </div>
                </div>
              </div>

              <aside className="rounded-2xl bg-muted/30 p-4">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">{isRTL ? "نقاط السيو الحية" : "Live SEO score"}</div>
                <div className={`mt-1 text-4xl font-black ${draftScore.score >= 85 ? "text-secondary" : draftScore.score >= 60 ? "text-accent" : "text-destructive"}`}>{draftScore.score}<span className="text-base text-muted-foreground">/100</span></div>
                <ul className="mt-3 space-y-1.5 text-[11px]">
                  <li className={draftScore.words >= 600 ? "text-secondary" : "text-destructive"}>• {isRTL ? "كلمات" : "Words"}: {draftScore.words} (≥600)</li>
                  <li className={draft.title_ar.length >= 30 && draft.title_ar.length <= 70 ? "text-secondary" : "text-destructive"}>• {isRTL ? "طول العنوان" : "Title length"}: {draft.title_ar.length} (30-70)</li>
                  <li className={draft.excerpt_ar.length >= 80 && draft.excerpt_ar.length <= 170 ? "text-secondary" : "text-destructive"}>• {isRTL ? "طول الوصف" : "Desc length"}: {draft.excerpt_ar.length} (80-170)</li>
                  <li className={draftScore.tagsCount >= 3 ? "text-secondary" : "text-destructive"}>• {isRTL ? "وسوم" : "Tags"}: {draftScore.tagsCount} (≥3)</li>
                  <li className={draft.image_url ? "text-secondary" : "text-destructive"}>• {isRTL ? "صورة OG" : "OG image"}</li>
                  <li className={draft.category_ar ? "text-secondary" : "text-destructive"}>• {isRTL ? "تصنيف" : "Category"}</li>
                </ul>
                <div className="mt-4 flex flex-col gap-2">
                  <Button onClick={() => saveDraft("publish")} disabled={saving} className="bg-orange-grad font-extrabold text-accent-foreground">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} {isRTL ? "نشر" : "Publish"}
                  </Button>
                  <Button onClick={() => saveDraft("schedule")} disabled={saving || !draft.schedule_at} variant="secondary" className="font-extrabold">
                    <Calendar className="h-4 w-4" /> {isRTL ? "جدولة" : "Schedule"}
                  </Button>
                  <Button variant="outline" onClick={() => saveDraft("draft")} disabled={saving}>{isRTL ? "حفظ كمسودّة" : "Save as draft"}</Button>
                </div>
              </aside>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-muted/50 text-xs font-extrabold text-muted-foreground">
            <tr className="text-start">
              <th className="p-3 text-start">{isRTL ? "المقال" : "Article"}</th>
              <th className="p-3 text-start">{isRTL ? "الحالة" : "Status"}</th>
              <th className="hidden p-3 text-start lg:table-cell">{isRTL ? "التصنيف" : "Category"}</th>
              <th className="hidden p-3 text-start xl:table-cell">{isRTL ? "كلمات" : "Words"}</th>
              <th className="hidden p-3 text-start xl:table-cell">{isRTL ? "العنوان" : "Title"}</th>
              <th className="hidden p-3 text-start xl:table-cell">{isRTL ? "الوصف" : "Desc"}</th>
              <th className="hidden p-3 text-start lg:table-cell">{isRTL ? "إشارات" : "Signals"}</th>
              <th className="p-3 text-start">{isRTL ? "النقاط" : "Score"}</th>
              <th className="p-3 text-start">{isRTL ? "إجراء" : "Action"}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const axis = getAxis(axisOfPost(r.post));
              const author = authorOfPost(r.post);
              const titleOk = r.titleLen >= 30 && r.titleLen <= 70;
              const descOk = r.descLen >= 80 && r.descLen <= 170;
              const wordsOk = r.words >= 600;
              const tone = r.score >= 85 ? "text-secondary" : r.score >= 60 ? "text-accent" : "text-destructive";
              const status: DbStatus | "static" = r.db?.status ?? "static";
              const meta = STATUS_LABELS[status];
              return (
                <tr key={r.post.slug} className="border-t border-border align-top">
                  <td className="p-3">
                    <div className="flex items-start gap-2">
                      <img src={r.post.image} alt="" className="h-10 w-14 rounded object-cover" />
                      <div className="min-w-0">
                        <div className="font-extrabold text-foreground line-clamp-2">{r.post.ar.title}</div>
                        <div className="mt-1 text-[11px] text-muted-foreground">{r.post.date} · {author.ar.name} · <span dir="ltr">{r.post.slug}</span></div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold ${meta.cls}`}>{meta[lang]}</span>
                    {r.db?.status === "scheduled" && r.db.scheduled_at && (
                      <div className="mt-1 text-[10px] text-violet-700">⏰ {new Date(r.db.scheduled_at).toLocaleString(lang === "ar" ? "ar-EG" : "en")}</div>
                    )}
                  </td>
                  <td className="hidden p-3 lg:table-cell">
                    <Link to={`/blog/category/${axis.slug}`} className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">
                      <Tag className="h-3 w-3" /> {axis.ar.name}
                    </Link>
                  </td>
                  <td className={`hidden p-3 font-bold xl:table-cell ${wordsOk ? "text-foreground" : "text-destructive"}`}>{r.words}</td>
                  <td className={`hidden p-3 font-bold xl:table-cell ${titleOk ? "text-foreground" : "text-destructive"}`}>{r.titleLen}</td>
                  <td className={`hidden p-3 font-bold xl:table-cell ${descOk ? "text-foreground" : "text-destructive"}`}>{r.descLen}</td>
                  <td className="hidden p-3 lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      <Pill ok={r.hasSchema} label="Schema" />
                      <Pill ok={r.hasOg} label="OG" />
                      <Pill ok={r.hasCategory} label={isRTL ? "تصنيف" : "Cat"} />
                      <Pill ok={r.tagsCount >= 3} label={isRTL ? "وسوم" : "Tags"} />
                      {(schemaIssuesByPost.get(r.post.slug)?.length ?? 0) > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-extrabold text-destructive">
                          <ShieldAlert className="h-3 w-3" /> {schemaIssuesByPost.get(r.post.slug)!.length}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className={`p-3 font-black ${tone}`}>{r.score}</td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link to={`/admin/blog-seo/${r.post.slug}`} className="inline-flex items-center gap-1 rounded-md bg-orange-grad px-2 py-1 text-[11px] font-extrabold text-accent-foreground hover:opacity-90">
                        <Pencil className="h-3 w-3" /> {isRTL ? "تعديل" : "Edit"}
                      </Link>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/50 px-2 py-1 text-[11px] font-extrabold text-primary hover:bg-muted" aria-label={isRTL ? "المزيد" : "More"}>
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={isRTL ? "start" : "end"} className="text-xs">
                          <DropdownMenuItem asChild>
                            <Link to={publicUrls.blog(r.post.slug, !!r.db && r.db.status !== "published")} target="_blank" className="gap-2 font-bold">
                              <Eye className="h-3.5 w-3.5" /> {isRTL ? "معاينة" : "Preview"}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={publicUrls.blog(r.post.slug)} target="_blank" className="gap-2 font-bold">
                              <ExternalLink className="h-3.5 w-3.5" /> {isRTL ? "افتح المنشور" : "Open live"}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => generateOneOg(r)} className="gap-2 font-bold">
                            <ImageIcon className="h-3.5 w-3.5" /> {isRTL ? "توليد صورة OG" : "Generate OG"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => downloadReport(r, "pdf")} className="gap-2 font-bold">
                            <FileDown className="h-3.5 w-3.5" /> {isRTL ? "تقرير PDF" : "PDF report"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => downloadReport(r, "json")} className="gap-2 font-bold">
                            <FileJson className="h-3.5 w-3.5" /> {isRTL ? "تقرير JSON" : "JSON report"}
                          </DropdownMenuItem>
                          {r.db && r.db.status !== "scheduled" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => scheduleRow(r)} className="gap-2 font-bold text-violet-700">
                                <Calendar className="h-3.5 w-3.5" /> {isRTL ? "جدولة النشر" : "Schedule"}
                              </DropdownMenuItem>
                            </>
                          )}
                          {r.db && r.db.status !== "published" && (
                            <DropdownMenuItem onClick={() => setStatus(r, "published")} className="gap-2 font-bold text-emerald-700">
                              <CheckCircle2 className="h-3.5 w-3.5" /> {isRTL ? "نشر الآن" : "Publish now"}
                            </DropdownMenuItem>
                          )}
                          {r.db && r.db.status === "published" && (
                            <DropdownMenuItem onClick={() => setStatus(r, "draft")} className="gap-2 font-bold text-amber-800">
                              {isRTL ? "حول لمسودّة" : "Unpublish"}
                            </DropdownMenuItem>
                          )}
                          {r.db && r.db.status !== "archived" && (
                            <DropdownMenuItem onClick={() => setStatus(r, "archived")} className="gap-2 font-bold text-slate-600">
                              <Archive className="h-3.5 w-3.5" /> {isRTL ? "أرشفة (إخفاء من الموقع)" : "Archive"}
                            </DropdownMenuItem>
                          )}
                          {r.db && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => removeRow(r)} className="gap-2 font-bold text-rose-700">
                                <Trash2 className="h-3.5 w-3.5" /> {isRTL ? "حذف" : "Delete"}
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="p-10 text-center text-muted-foreground">{isRTL ? "مفيش نتائج — جرّب تغيير الفلاتر" : "No results — try clearing filters"}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};

const AdminBlogSeo = () => (
  <RequireAuth roles={["admin", "editor"]}>
    <Inner />
  </RequireAuth>
);

export default AdminBlogSeo;
