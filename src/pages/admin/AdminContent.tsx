import { UiSelect } from "@/components/common/UiSelect";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, FileText, BookOpen, HelpCircle, X, Eye, Search, FileEdit, Image as ImageIcon, Sparkles, ArrowLeft } from "lucide-react";
import { AdminLayout, StatCard } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLang } from "@/i18n/LangContext";
import { useAuth } from "@/auth/AuthContext";
import { RequireAuth } from "@/auth/RequireAuth";
import { useContentStore, ContentDoc, ContentType } from "@/data/contentStore";
import { toast } from "@/hooks/use-toast";
import { LazyImage } from "@/components/common/LazyImage";
import { useAllBlogRowsAdmin } from "@/data/useBlogPosts";
import { dbToBlogPost } from "@/data/blogApi";
import type { BlogPost } from "@/data/blog";
import { useQuery } from "@tanstack/react-query";
import { FAQ_AR, FAQ_EN } from "@/data/qurbaniFaq";
import { SERVICE_PAGES } from "@/data/servicePagesConfig";
import { GEO_GOVERNORATES } from "@/data/geoPages";

import { articlesApi, programsApiV1, storiesApi, galleryApi } from "@/data/laravelApi";
import { fetchFaqsAdmin, createFaq, updateFaq, deleteFaq, type FaqItem } from "@/data/faqsApi";
import { apiErrorMessage } from "@/data/api/adminApiHelpers";

/** FAQ rows from Laravel `/faqs` are shown here with id `LARAVEL_FAQ:<id>` and saved back to `/faqs/{id}`. */
const FAQ_ID_PREFIX = "LARAVEL_FAQ:";

const TYPE_ICON: Record<ContentType, typeof BookOpen> = { article: BookOpen, program: FileText, faq: HelpCircle, page: FileEdit };

const Inner = () => {
  const { lang } = useLang();
  const { user } = useAuth();
  const navigate = useNavigate();
  // Laravel /content documents (all types). Writes go to POST/PATCH/DELETE /content.
  const { items, upsert, remove, setStatus, error: contentError } = useContentStore();
  // DB-only blog rows (no static seed) — keeps counts in sync with /admin/blog-seo.
  const { rows: blogRows } = useAllBlogRowsAdmin();
  const blogPosts = useMemo<BlogPost[]>(() => blogRows.map(dbToBlogPost), [blogRows]);

  // Laravel Articles
  const { data: laravelArticles = [] } = useQuery({
    queryKey: ["admin-content", "laravel-articles"],
    queryFn: async () => {
      try {
        return await articlesApi.listAll();
      } catch {
        return [];
      }
    },
    staleTime: 30_000,
  });

  // Laravel FAQs (GET /faqs)
  const { data: laravelFaqs = [], refetch: refetchFaqs } = useQuery({
    queryKey: ["admin-content", "laravel-faqs"],
    queryFn: async () => {
      try {
        return await fetchFaqsAdmin();
      } catch {
        return [] as FaqItem[];
      }
    },
    staleTime: 30_000,
  });

  // Live programs from Laravel API + donation_nodes fallback
  const { data: nodes = [] } = useQuery({
    queryKey: ["admin-content", "donation_nodes"],
    queryFn: async () => {
      try {
        const laravelPrograms = await programsApiV1.listAll();
        if (Array.isArray(laravelPrograms) && laravelPrograms.length > 0) {
          return laravelPrograms.map((p) => ({
            id: p.id,
            slug: `program-${p.id}`,
            parent_id: null,
            title_ar: p.name,
            title_en: p.name,
            description_ar: p.description || "",
            description_en: p.description || "",
            image_url: null,
            active: p.is_active !== false,
            updated_at: p.created_at || "",
          }));
        }
      } catch {}

      return [];
    },
    staleTime: 30_000,
  });

  // Live stories from Laravel API
  const { data: stories = [] } = useQuery({
    queryKey: ["admin-content", "stories"],
    queryFn: async () => {
      try {
        const laravelStories = await storiesApi.listAll();
        if (Array.isArray(laravelStories) && laravelStories.length > 0) {
          return laravelStories.map((s) => ({
            id: s.id,
            slug: s.slug || `story-${s.id}`,
            title_ar: s.title_ar,
            title_en: s.title_en || s.title_ar,
            body_ar: s.description_ar,
            body_en: s.description_en || s.description_ar,
            image_url: s.cover_image_url || s.cover_image || null,
            is_published: s.status === "published",
            updated_at: s.updated_at || s.created_at || "",
          }));
        }
      } catch {}

      return [];
    },
    staleTime: 30_000,
  });

  // (FAQ-type /content documents are part of useContentStore() above.)
  const [filter, setFilter] = useState<"all" | ContentType>("all");
  const [statusF, setStatusF] = useState<"all" | "published" | "draft">("all");
  const [q, setQ] = useState("");
  const [faqSource, setFaqSource] = useState<"all" | "db" | "qurbani" | "services" | "geo">("all");
  const [editing, setEditing] = useState<ContentDoc | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [preview, setPreview] = useState<ContentDoc | null>(null);

  // Bridge: DB blog posts presented as read-only article docs,
  // edited via the unified Blog SEO editor at /admin/blog-seo.
  const blogAsDocs = useMemo<ContentDoc[]>(() =>
    (Array.isArray(blogPosts) ? blogPosts : []).map((p: BlogPost, i: number) => {
      const db = blogRows[i];
      return {
      id: `BLOG:${p.slug}`,
      type: "article" as ContentType,
      slug: p.slug,
      status: (db?.status === "published" ? "published" : "draft") as ContentDoc["status"],
      author: "—",
      updatedAt: p.date,
      title: { ar: p.ar?.title || "", en: p.en?.title || "" },
      excerpt: { ar: p.ar?.excerpt || "", en: p.en?.excerpt || "" },
      body: { ar: (p.ar?.body || []).join("\n\n"), en: (p.en?.body || []).join("\n\n") },
      image: typeof p.image === "string" ? p.image : (p.image as any),
      tags: [...(p.ar?.tags || []), ...(p.en?.tags || [])],
      };
    }),
  [blogPosts, blogRows]);

  const programDocs = useMemo<ContentDoc[]>(() =>
    (Array.isArray(nodes) ? nodes : []).map((n: any) => ({
      id: `NODE:${n.id}`,
      type: "program" as ContentType,
      slug: n.parent_id ? `${n.slug}` : n.slug,
      status: (n.active ? "published" : "draft") as ContentDoc["status"],
      author: "—",
      updatedAt: (n.updated_at || "").slice(0, 10),
      title: { ar: n.title_ar || "", en: n.title_en || "" },
      excerpt: { ar: (n.description_ar || "").slice(0, 200), en: (n.description_en || "").slice(0, 200) },
      body: { ar: n.description_ar || "", en: n.description_en || "" },
      image: n.image_url || undefined,
      tags: n.parent_id ? ["sub-option"] : ["program"],
    })),
  [nodes]);

  const storyDocs = useMemo<ContentDoc[]>(() =>
    (Array.isArray(stories) ? stories : []).map((s: any) => ({
      id: `STORY:${s.id}`,
      type: "article" as ContentType,
      slug: `stories/${s.slug}`,
      status: (s.is_published ? "published" : "draft") as ContentDoc["status"],
      author: "—",
      updatedAt: (s.updated_at || "").slice(0, 10),
      title: { ar: s.title_ar || "", en: s.title_en || "" },
      excerpt: { ar: (s.body_ar || "").slice(0, 180), en: (s.body_en || "").slice(0, 180) },
      body: { ar: s.body_ar || "", en: s.body_en || "" },
      image: s.image_url || undefined,
      tags: ["story"],
    })),
  [stories]);

  const faqDocs = useMemo<ContentDoc[]>(() => {
    const out: ContentDoc[] = [];

    // Laravel FAQs from API (GET /faqs)
    (Array.isArray(laravelFaqs) ? laravelFaqs : []).forEach((f: FaqItem) => {
      out.push({
        id: `${FAQ_ID_PREFIX}${f.id}`,
        type: "faq" as ContentType,
        slug: `faqs/${f.id}`,
        status: f.is_active !== false ? "published" : "draft",
        author: "Laravel API",
        updatedAt: (f.created_at || "").slice(0, 10),
        title: { ar: f.question_ar || f.question_en || "", en: f.question_en || f.question_ar || "" },
        excerpt: { ar: f.answer_ar || "", en: f.answer_en || "" },
        body: { ar: f.answer_ar || "", en: f.answer_en || "" },
        tags: ["Laravel FAQ"],
      });
    });

    // Static: shared Qurbani FAQ
    const pairCount = Math.max((FAQ_AR || []).length, (FAQ_EN || []).length);
    for (let i = 0; i < pairCount; i++) {
      const ar = (FAQ_AR || [])[i] || (FAQ_EN || [])[i];
      const en = (FAQ_EN || [])[i] || (FAQ_AR || [])[i];
      if (ar || en) {
        out.push({
          id: `FAQ-STATIC:qurbani:${i}`,
          type: "faq",
          slug: `/qurbani#faq-${i}`,
          status: "published",
          author: "static",
          updatedAt: "",
          title: { ar: ar?.q || en?.q || "", en: en?.q || ar?.q || "" },
          excerpt: { ar: ar?.a || en?.a || "", en: en?.a || ar?.a || "" },
          body: { ar: ar?.a || en?.a || "", en: en?.a || ar?.a || "" },
          tags: ["qurbani", "static"],
        });
      }
    }

    // Static: service pages FAQs
    if (SERVICE_PAGES && typeof SERVICE_PAGES === "object") {
      Object.values(SERVICE_PAGES).forEach((sp: any) => {
        (Array.isArray(sp?.faqs) ? sp.faqs : []).forEach((q: any, idx: number) => {
          out.push({
            id: `FAQ-STATIC:svc:${sp.slug}:${idx}`,
            type: "faq",
            slug: `/services/${sp.slug}#faq-${idx}`,
            status: "published",
            author: "static",
            updatedAt: "",
            title: { ar: q.q_ar || q.q_en || "", en: q.q_en || q.q_ar || "" },
            excerpt: { ar: q.a_ar || "", en: q.a_en || "" },
            body: { ar: q.a_ar || "", en: q.a_en || "" },
            tags: [sp.title_ar || sp.slug, "service"],
          });
        });
      });
    }

    // Static: geo program FAQs
    (Array.isArray(GEO_GOVERNORATES) ? GEO_GOVERNORATES : []).forEach((g) => {
      if (g?.programs && typeof g.programs === "object") {
        Object.entries(g.programs).forEach(([progSlug, copy]: [string, any]) => {
          const arFaq = Array.isArray(copy?.ar?.faq) ? copy.ar.faq : [];
          const enFaq = Array.isArray(copy?.en?.faq) ? copy.en.faq : [];
          const len = Math.max(arFaq.length, enFaq.length);
          for (let i = 0; i < len; i++) {
            const ar = arFaq[i] || enFaq[i];
            const en = enFaq[i] || arFaq[i];
            if (ar || en) {
              out.push({
                id: `FAQ-STATIC:geo:${g.slug}:${progSlug}:${i}`,
                type: "faq",
                slug: `/geo/${g.slug}/${progSlug}#faq-${i}`,
                status: "published",
                author: "static",
                updatedAt: "",
                title: { ar: ar?.q || en?.q || "", en: en?.q || ar?.q || "" },
                excerpt: { ar: ar?.a || en?.a || "", en: en?.a || ar?.a || "" },
                body: { ar: ar?.a || en?.a || "", en: en?.a || ar?.a || "" },
                tags: [g.ar, progSlug, "geo"],
              });
            }
          }
        });
      }
    });

    return out;
  }, [laravelFaqs]);

  // Merge: blog (read-only) + local items, blog wins on slug collision.
  const merged = useMemo<ContentDoc[]>(() => {
    const slugs = new Set((Array.isArray(blogAsDocs) ? blogAsDocs : []).map((d) => d.slug));
    const safeItems = Array.isArray(items) ? items : [];
    const localFiltered = safeItems.filter((i) => !(i.type === "article" && i.slug && slugs.has(i.slug)));
    return [
      ...(Array.isArray(blogAsDocs) ? blogAsDocs : []),
      ...(Array.isArray(storyDocs) ? storyDocs : []),
      ...(Array.isArray(programDocs) ? programDocs : []),
      ...(Array.isArray(faqDocs) ? faqDocs : []),
      ...localFiltered
    ];
  }, [blogAsDocs, storyDocs, programDocs, faqDocs, items]);

  const faqSourceOf = (id: string): "db" | "qurbani" | "services" | "geo" | "other" => {
    if (id.startsWith("FAQ-STATIC:qurbani")) return "qurbani";
    if (id.startsWith("FAQ-STATIC:svc")) return "services";
    if (id.startsWith("FAQ-STATIC:geo")) return "geo";
    if (id.startsWith(FAQ_ID_PREFIX) || id.startsWith("CONTENT:")) return "db";
    return "other";
  };
  const sourceLabel = (src: string) => {
    const map: Record<string, { ar: string; en: string; cls: string }> = {
      db: { ar: "قاعدة البيانات", en: "Database", cls: "bg-primary/15 text-primary" },
      qurbani: { ar: "ثابت — أضاحي", en: "Static — Qurbani", cls: "bg-secondary/30 text-primary" },
      services: { ar: "ثابت — خدمات", en: "Static — Services", cls: "bg-accent/15 text-accent" },
      geo: { ar: "ثابت — محافظات", en: "Static — Geo", cls: "bg-muted text-foreground" },
      other: { ar: "—", en: "—", cls: "bg-muted text-muted-foreground" },
    };
    return map[src] || map.other;
  };

  const filtered = useMemo(() => merged.filter((i) => {
    const t = filter === "all" || i.type === filter;
    const s = statusF === "all" || i.status === statusF;
    const m = !q || i.title.ar.includes(q) || i.title.en.toLowerCase().includes(q.toLowerCase()) || (i.tags || []).join(" ").includes(q);
    const fs = filter !== "faq" || faqSource === "all" || faqSourceOf(i.id) === faqSource;
    return t && s && m && fs;
  }), [merged, filter, statusF, q, faqSource]);

  const faqCounts = useMemo(() => {
    const base = merged.filter((i) => i.type === "faq");
    return {
      all: base.length,
      db: base.filter((i) => faqSourceOf(i.id) === "db").length,
      qurbani: base.filter((i) => faqSourceOf(i.id) === "qurbani").length,
      services: base.filter((i) => faqSourceOf(i.id) === "services").length,
      geo: base.filter((i) => faqSourceOf(i.id) === "geo").length,
    };
  }, [merged]);

  const counts = {
    total: merged.length,
    published: merged.filter((i) => i.status === "published").length,
    drafts: merged.filter((i) => i.status === "draft").length,
    articles: merged.filter((i) => i.type === "article").length,
  };

  const failToast = (title: string, e: unknown) =>
    toast({ variant: "destructive", title, description: apiErrorMessage(e) });

  const onSave = async (doc: ContentDoc) => {
    try {
      if (doc.id.startsWith(FAQ_ID_PREFIX)) {
        // Existing FAQ → PUT /faqs/{id}
        await updateFaq(doc.id.slice(FAQ_ID_PREFIX.length), {
          question_ar: doc.title.ar, question_en: doc.title.en,
          answer_ar: doc.body?.ar || doc.excerpt?.ar || "", answer_en: doc.body?.en || doc.excerpt?.en || "",
          is_active: doc.status === "published",
        });
        void refetchFaqs();
      } else if (doc.type === "faq" && !doc.id.startsWith("CONTENT:")) {
        // New FAQ → POST /faqs
        await createFaq({
          question_ar: doc.title.ar, question_en: doc.title.en,
          answer_ar: doc.body?.ar || doc.excerpt?.ar || "", answer_en: doc.body?.en || doc.excerpt?.en || "",
          is_active: doc.status === "published",
        });
        void refetchFaqs();
      } else {
        // Content document → POST /content or PATCH /content/{id}
        await upsert({ ...doc, updatedAt: new Date().toISOString().slice(0, 10), author: doc.author || user?.name || "—" });
      }
      setEditing(null); setShowAdd(false);
      toast({ title: lang === "ar" ? " تم الحفظ" : " Saved", description: doc.title[lang] });
    } catch (e) {
      failToast(lang === "ar" ? "فشل الحفظ على الخادم" : "Save failed", e);
    }
  };
  const onDelete = async (id: string) => {
    if (id.startsWith("FAQ-STATIC:")) {
      toast({ title: lang === "ar" ? "هذا السؤال ثابت في الكود ولا يُحذف من اللوحة" : "Static FAQ — managed in code" });
      return;
    }
    if (id.startsWith("BLOG:")) {
      toast({ title: lang === "ar" ? "هذا المقال يدار من محرر سيو المدوّنة" : "This post is managed in the Blog SEO editor" });
      navigate("/admin/blog-seo");
      return;
    }
    if (id.startsWith("NODE:")) {
      navigate(`/admin/programs/${id.slice(5)}`);
      return;
    }
    if (id.startsWith("STORY:")) {
      navigate(`/admin/stories`);
      return;
    }
    if (!confirm(lang === "ar" ? "تأكيد حذف هذا العنصر؟" : "Confirm delete?")) return;
    try {
      if (id.startsWith(FAQ_ID_PREFIX)) {
        await deleteFaq(id.slice(FAQ_ID_PREFIX.length)); // DELETE /faqs/{id}
        void refetchFaqs();
      } else {
        await remove(id); // DELETE /content/{id}
      }
      toast({ title: lang === "ar" ? " تم الحذف" : " Deleted" });
    } catch (e) {
      failToast(lang === "ar" ? "فشل الحذف" : "Delete failed", e);
    }
  };

  const onEdit = (it: ContentDoc) => {
    if (it.id.startsWith("FAQ-STATIC:")) {
      toast({ title: lang === "ar" ? "هذا السؤال ثابت في الكود (يدار من ملفات البيانات)" : "Static FAQ (edited via source files)" });
      return;
    }
    if (it.id.startsWith("BLOG:")) { navigate("/admin/blog-seo"); return; }
    if (it.id.startsWith("NODE:")) { navigate(`/admin/programs/${it.id.slice(5)}`); return; }
    if (it.id.startsWith("STORY:")) { navigate(`/admin/stories`); return; }
    setEditing(it);
  };
  const onToggleStatus = async (it: ContentDoc) => {
    if (it.id.startsWith("BLOG:")) { navigate("/admin/blog-seo"); return; }
    if (it.id.startsWith("NODE:") || it.id.startsWith("STORY:") || it.id.startsWith("FAQ-STATIC:")) {
      onEdit(it);
      return;
    }
    const next = it.status === "published" ? "draft" : "published";
    try {
      if (it.id.startsWith(FAQ_ID_PREFIX)) {
        await updateFaq(it.id.slice(FAQ_ID_PREFIX.length), { is_active: next === "published" });
        void refetchFaqs();
      } else {
        await setStatus(it.id, next); // PATCH /content/{id}
      }
    } catch (e) {
      failToast(lang === "ar" ? "فشل تغيير الحالة" : "Status change failed", e);
    }
  };

  return (
    <AdminLayout title={{ ar: "إدارة المحتوى", en: "Content management" }}>
      <div className="space-y-4">
        {/* Unified blog editor banner — articles live in /admin/blog-seo (DB-backed) */}
        <Link to="/admin/blog-seo" className="group flex items-center justify-between gap-3 rounded-2xl border border-secondary/40 bg-gradient-to-r from-secondary/15 via-card to-accent/10 p-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-card">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-orange-grad text-accent-foreground"><Sparkles className="h-5 w-5" /></div>
            <div>
              <div className="text-sm font-black text-primary">{lang === "ar" ? "مقالات المدوّنة في محرر سيو موحّد" : "Blog articles live in the unified SEO editor"}</div>
              <div className="text-[11px] text-muted-foreground">{lang === "ar" ? "للنشر/الجدولة/تقارير SEO/رفع صور وتوليد OG — اذهب إلى محرر سيو المدونة." : "For publish/schedule/SEO reports/image upload & OG — open the Blog SEO editor."}</div>
            </div>
          </div>
          <ArrowLeft className={`h-4 w-4 text-accent transition-transform ${lang === "ar" ? "group-hover:-translate-x-1" : "rotate-180 group-hover:translate-x-1"}`} />
        </Link>

        {contentError && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-3 text-sm font-bold text-destructive">
            {lang === "ar" ? "تعذر تحميل مستندات المحتوى من الخادم: " : "Could not load content documents: "}{contentError}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard accent label={lang === "ar" ? "إجمالي" : "Total"} value={counts.total} />
          <StatCard label={lang === "ar" ? "منشور" : "Published"} value={counts.published} />
          <StatCard label={lang === "ar" ? "مسودات" : "Drafts"} value={counts.drafts} />
          <StatCard label={lang === "ar" ? "مقالات" : "Articles"} value={counts.articles} />
        </div>

        <div className="flex flex-col gap-2 rounded-2xl bg-card p-3 shadow-soft sm:flex-row sm:items-center sm:flex-wrap">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="ps-9" placeholder={lang === "ar" ? "بحث…" : "Search…"} value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {([
              { v: "all", ar: "كل الأنواع", en: "All types" },
              { v: "article", ar: "مقالات", en: "Articles" },
              { v: "program", ar: "برامج", en: "Programs" },
              { v: "faq", ar: "أسئلة", en: "FAQs" },
              { v: "page", ar: "صفحات", en: "Pages" },
            ] as const).map((f) => (
              <button key={f.v} onClick={() => setFilter(f.v as typeof filter)}
                className={`rounded-lg px-3 py-1.5 text-xs font-extrabold transition ${filter === f.v ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}>
                {lang === "ar" ? f.ar : f.en}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {([
              { v: "all", ar: "الكل", en: "All" },
              { v: "published", ar: "منشور", en: "Published" },
              { v: "draft", ar: "مسودة", en: "Draft" },
            ] as const).map((f) => (
              <button key={f.v} onClick={() => setStatusF(f.v)}
                className={`rounded-lg px-3 py-1.5 text-xs font-extrabold transition ${statusF === f.v ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}>
                {lang === "ar" ? f.ar : f.en}
              </button>
            ))}
          </div>
          <Button onClick={() => setShowAdd(true)} className="bg-orange-grad font-extrabold text-accent-foreground sm:ms-auto">
            <Plus className="h-4 w-4" /> {lang === "ar" ? "إضافة جديد" : "Add new"}
          </Button>
        </div>

        {filter === "faq" && (
          <div className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-card p-3 shadow-soft">
            <span className="text-[11px] font-extrabold text-muted-foreground">
              {lang === "ar" ? "مصدر الأسئلة:" : "FAQ source:"}
            </span>
            {([
              { v: "all", ar: "الكل", en: "All", n: faqCounts.all },
              { v: "db", ar: "من قاعدة البيانات", en: "Database", n: faqCounts.db },
              { v: "qurbani", ar: "ثابتة — أضاحي", en: "Static — Qurbani", n: faqCounts.qurbani },
              { v: "services", ar: "أسئلة الخدمات", en: "Services FAQs", n: faqCounts.services },
              { v: "geo", ar: "أسئلة المحافظات", en: "Governorates FAQs", n: faqCounts.geo },
            ] as const).map((f) => (
              <button key={f.v} onClick={() => setFaqSource(f.v as typeof faqSource)}
                className={`rounded-lg px-3 py-1.5 text-xs font-extrabold transition ${faqSource === f.v ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}>
                {lang === "ar" ? f.ar : f.en} <span className="opacity-70">({f.n})</span>
              </button>
            ))}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((it) => {
            const Icon = TYPE_ICON[it.type];
            return (
              <article key={it.id} className="overflow-hidden rounded-2xl bg-card shadow-soft">
                {it.image && <LazyImage src={it.image} alt="" aspect="aspect-[16/9]" wrapperClassName="w-full" />}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="grid h-9 w-9 place-items-center rounded-lg bg-secondary/30 text-primary"><Icon className="h-4 w-4" /></div>
                      <span className="text-[10px] font-extrabold uppercase text-muted-foreground">{it.type}</span>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${it.status === "published" ? "bg-secondary/30 text-primary" : "bg-accent/15 text-accent"}`}>
                      {it.status === "published" ? (lang === "ar" ? "منشور" : "Published") : (lang === "ar" ? "مسودة" : "Draft")}
                    </span>
                  </div>
                  {it.type === "faq" && (() => {
                    const src = faqSourceOf(it.id);
                    const lbl = sourceLabel(src);
                    return (
                      <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-extrabold ${lbl.cls}`}>
                        {lang === "ar" ? lbl.ar : lbl.en}
                      </span>
                    );
                  })()}
                  <h3 className="mt-3 line-clamp-2 font-extrabold text-primary">{it.title[lang]}</h3>
                  {it.excerpt && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{it.excerpt[lang]}</p>}
                  <div className="mt-2 text-[11px] text-muted-foreground">{it.author} · {it.updatedAt}</div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <button onClick={() => setPreview(it)} className="inline-flex items-center gap-1 rounded-lg bg-muted px-2 py-1.5 text-xs font-extrabold hover:bg-secondary/30"><Eye className="h-3 w-3" /> {lang === "ar" ? "معاينة" : "Preview"}</button>
                    <button onClick={() => onEdit(it)} className="inline-flex items-center gap-1 rounded-lg bg-muted px-2 py-1.5 text-xs font-extrabold hover:bg-accent/20 hover:text-accent">
                      <Pencil className="h-3 w-3" /> {lang === "ar" ? "تعديل" : "Edit"}
                      {it.id.startsWith("BLOG:") && <span className="ms-1 text-[9px] opacity-70">{lang === "ar" ? "(محرر السيو)" : "(SEO editor)"}</span>}
                      {it.id.startsWith("NODE:") && <span className="ms-1 text-[9px] opacity-70">{lang === "ar" ? "(صفحة البرنامج)" : "(Project page)"}</span>}
                      {it.id.startsWith("STORY:") && <span className="ms-1 text-[9px] opacity-70">{lang === "ar" ? "(القصص)" : "(Stories)"}</span>}
                    </button>
                    <button onClick={() => onToggleStatus(it)}
                      className="inline-flex items-center gap-1 rounded-lg bg-muted px-2 py-1.5 text-xs font-extrabold hover:bg-primary/10 hover:text-primary">
                      {it.status === "published" ? (lang === "ar" ? "حول لمسودة" : "Unpublish") : (lang === "ar" ? "نشر" : "Publish")}
                    </button>
                    <button onClick={() => onDelete(it.id)} className="ms-auto grid h-8 w-8 place-items-center rounded-lg bg-muted text-muted-foreground hover:bg-destructive/15 hover:text-destructive" aria-label="delete"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              </article>
            );
          })}
          {filtered.length === 0 && <div className="col-span-full rounded-2xl bg-card p-10 text-center text-sm text-muted-foreground">{lang === "ar" ? "لا توجد عناصر" : "No items"}</div>}
        </div>

        <div className="text-[11px] text-muted-foreground">
          {lang === "ar"
            ? "المحتوى هنا قادم من الباك إند (Laravel: ‎/content و‎/faqs و‎/stories و‎/programs) بالإضافة لأسئلة ثابتة من كود الموقع (للعرض فقط)."
            : "Content here comes from the Laravel backend (/content, /faqs, /stories, /programs) plus read-only static FAQs from the site code."}
        </div>
      </div>

      {(editing || showAdd) && (
        <ContentEditor item={editing} lang={lang} onClose={() => { setEditing(null); setShowAdd(false); }} onSave={onSave} />
      )}
      {preview && <PreviewDialog item={preview} lang={lang} onClose={() => setPreview(null)} />}
    </AdminLayout>
  );
};

const ContentEditor = ({
  item, lang, onClose, onSave,
}: { item: ContentDoc | null; lang: "ar" | "en"; onClose: () => void; onSave: (i: ContentDoc) => void }) => {
  const [form, setForm] = useState<ContentDoc>(item || {
    id: `NEW-${Math.floor(1000 + Math.random() * 9000)}`,
    type: "article",
    slug: "",
    status: "draft",
    author: "",
    updatedAt: new Date().toISOString().slice(0, 10),
    title: { ar: "", en: "" },
    excerpt: { ar: "", en: "" },
    body: { ar: "", en: "" },
    tags: [],
  });
  const [tagInput, setTagInput] = useState("");

  const upd = <K extends keyof ContentDoc>(k: K, v: ContentDoc[K]) => setForm({ ...form, [k]: v });
  const updI18n = (k: "title" | "excerpt" | "body", lng: "ar" | "en", v: string) =>
    setForm({ ...form, [k]: { ...(form[k] || { ar: "", en: "" }), [lng]: v } });

  const [uploadingImg, setUploadingImg] = useState(false);
  const onImg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setUploadingImg(true);
    try {
      // Upload to Laravel storage (POST /gallery) and keep only the returned URL.
      const url = await galleryApi.uploadImage(f, form.title.ar || "content");
      upd("image", url);
    } catch (err) {
      toast({ variant: "destructive", title: lang === "ar" ? "فشل رفع الصورة" : "Upload failed", description: apiErrorMessage(err) });
    } finally {
      setUploadingImg(false);
      e.target.value = "";
    }
  };

  const addTag = () => {
    const t = tagInput.trim(); if (!t) return;
    upd("tags", [...(form.tags || []), t]); setTagInput("");
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-2 sm:p-4" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-card p-4 shadow-2xl sm:p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-black text-primary">{item ? (lang === "ar" ? "تعديل" : "Edit") : (lang === "ar" ? "إضافة" : "Add new")}</h2>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>{lang === "ar" ? "النوع" : "Type"}</Label>
            <UiSelect value={form.type} onChange={(e) => upd("type", e.target.value as ContentType)} className="h-10 w-full rounded-md border border-border bg-background px-2.5 text-sm font-bold">
              <option value="article">{lang === "ar" ? "مقال" : "Article"}</option>
              <option value="program">{lang === "ar" ? "برنامج" : "Program"}</option>
              <option value="faq">{lang === "ar" ? "سؤال شائع" : "FAQ"}</option>
              <option value="page">{lang === "ar" ? "صفحة" : "Page"}</option>
            </UiSelect>
          </div>
          <div>
            <Label>{lang === "ar" ? "الحالة" : "Status"}</Label>
            <UiSelect value={form.status} onChange={(e) => upd("status", e.target.value as ContentDoc["status"])} className="h-10 w-full rounded-md border border-border bg-background px-2.5 text-sm font-bold">
              <option value="draft">{lang === "ar" ? "مسودة" : "Draft"}</option>
              <option value="published">{lang === "ar" ? "منشور" : "Published"}</option>
            </UiSelect>
          </div>
          <div className="sm:col-span-2"><Label>{lang === "ar" ? "Slug (URL)" : "Slug (URL)"}</Label>
            <Input value={form.slug || ""} onChange={(e) => upd("slug", e.target.value)} placeholder="my-article-slug" />
          </div>
          <div><Label>{lang === "ar" ? "العنوان (عربي)" : "Title (AR)"}</Label>
            <Input value={form.title.ar} onChange={(e) => updI18n("title", "ar", e.target.value)} />
          </div>
          <div><Label>{lang === "ar" ? "العنوان (إنجليزي)" : "Title (EN)"}</Label>
            <Input value={form.title.en} onChange={(e) => updI18n("title", "en", e.target.value)} />
          </div>
          <div className="sm:col-span-2"><Label>{lang === "ar" ? "ملخص (عربي)" : "Excerpt (AR)"}</Label>
            <textarea className="min-h-[60px] w-full rounded-md border border-input bg-background p-2 text-sm" value={form.excerpt?.ar || ""} onChange={(e) => updI18n("excerpt", "ar", e.target.value)} />
          </div>
          <div className="sm:col-span-2"><Label>{lang === "ar" ? "ملخص (إنجليزي)" : "Excerpt (EN)"}</Label>
            <textarea className="min-h-[60px] w-full rounded-md border border-input bg-background p-2 text-sm" value={form.excerpt?.en || ""} onChange={(e) => updI18n("excerpt", "en", e.target.value)} />
          </div>
          <div className="sm:col-span-2"><Label>{lang === "ar" ? "المحتوى (عربي)" : "Body (AR)"}</Label>
            <textarea className="min-h-[140px] w-full rounded-md border border-input bg-background p-2 text-sm" value={form.body?.ar || ""} onChange={(e) => updI18n("body", "ar", e.target.value)} />
          </div>
          <div className="sm:col-span-2"><Label>{lang === "ar" ? "المحتوى (إنجليزي)" : "Body (EN)"}</Label>
            <textarea className="min-h-[140px] w-full rounded-md border border-input bg-background p-2 text-sm" value={form.body?.en || ""} onChange={(e) => updI18n("body", "en", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label>{lang === "ar" ? "صورة الغلاف" : "Cover image"}</Label>
            <div className="flex items-center gap-3">
              {form.image ? <LazyImage src={form.image} alt="" wrapperClassName="h-16 w-24 rounded-lg" /> : <div className="grid h-16 w-24 place-items-center rounded-lg bg-muted text-muted-foreground"><ImageIcon className="h-5 w-5" /></div>}
              <input type="file" accept="image/*" onChange={onImg} className="text-xs" disabled={uploadingImg} />
              {uploadingImg && <span className="text-[11px] text-muted-foreground">{lang === "ar" ? "جارٍ الرفع…" : "Uploading…"}</span>}
              {form.image && <button type="button" onClick={() => upd("image", undefined)} className="text-xs text-destructive">{lang === "ar" ? "إزالة" : "Remove"}</button>}
            </div>
          </div>
          <div className="sm:col-span-2">
            <Label>{lang === "ar" ? "الوسوم" : "Tags"}</Label>
            <div className="flex gap-2">
              <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())} placeholder={lang === "ar" ? "أضف وسماً ثم Enter" : "Type and press Enter"} />
              <Button type="button" variant="outline" onClick={addTag}>{lang === "ar" ? "+" : "+"}</Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {(form.tags || []).map((t, i) => (
                <span key={i} className="inline-flex items-center gap-1 rounded-full bg-secondary/30 px-2 py-0.5 text-xs font-bold text-primary">
                  {t}
                  <button type="button" onClick={() => upd("tags", form.tags?.filter((_, j) => j !== i))} className="text-primary/60 hover:text-destructive"><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          </div>
          <div><Label>{lang === "ar" ? "المؤلف" : "Author"}</Label>
            <Input value={form.author} onChange={(e) => upd("author", e.target.value)} />
          </div>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row">
          <Button variant="outline" onClick={onClose} className="sm:flex-1">{lang === "ar" ? "إلغاء" : "Cancel"}</Button>
          <Button onClick={() => onSave(form)} className="bg-accent font-extrabold text-accent-foreground sm:flex-1" disabled={!form.title.ar || !form.title.en}>
            {lang === "ar" ? "حفظ كمسودة" : "Save"}
          </Button>
          <Button onClick={() => onSave({ ...form, status: "published" })} className="bg-orange-grad font-extrabold text-accent-foreground shadow-cta sm:flex-1" disabled={!form.title.ar || !form.title.en}>
            {lang === "ar" ? "نشر الآن" : "Publish"}
          </Button>
        </div>
      </div>
    </div>
  );
};

const PreviewDialog = ({ item, lang, onClose }: { item: ContentDoc; lang: "ar" | "en"; onClose: () => void }) => (
  <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-2 sm:p-4" onClick={onClose}>
    <article className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-card p-5 shadow-2xl sm:p-8" onClick={(e) => e.stopPropagation()}>
      <div className="mb-3 flex items-center justify-between">
        <span className="rounded-full bg-secondary/30 px-2 py-0.5 text-[10px] font-extrabold uppercase text-primary">{item.type} · {lang === "ar" ? "معاينة" : "Preview"}</span>
        <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
      </div>
      {item.image && <LazyImage src={item.image} alt="" aspect="aspect-[16/9]" wrapperClassName="mb-4 w-full rounded-xl" />}
      <h1 className="text-2xl font-black text-primary md:text-3xl">{item.title[lang]}</h1>
      <div className="mt-1 text-xs text-muted-foreground">{item.author} · {item.updatedAt}</div>
      {item.excerpt && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.excerpt[lang]}</p>}
      {item.body && <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{item.body[lang]}</div>}
      {(item.tags || []).length > 0 && (
        <div className="mt-5 flex flex-wrap gap-1">
          {item.tags!.map((t) => <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">#{t}</span>)}
        </div>
      )}
    </article>
  </div>
);

const Label = ({ children }: { children: React.ReactNode }) => <label className="mb-1 block text-xs font-extrabold text-muted-foreground">{children}</label>;

const AdminContent = () => (
  <RequireAuth roles={["admin", "editor"]}><Inner /></RequireAuth>
);

export default AdminContent;