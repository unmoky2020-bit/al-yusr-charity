import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useLang } from "@/i18n/LangContext";
import { useAuth } from "@/auth/AuthContext";
import { RequireAuth } from "@/auth/RequireAuth";
import { toast } from "@/hooks/use-toast";
import {
  ClipboardCheck, Clock4, CheckCircle2, XCircle, FileEdit, Image as ImageIcon,
  Megaphone, FileText, Search, Filter, MessageSquare, RefreshCw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { listAllCasesForStaff, setCaseStatus, type CaseRow } from "@/data/casesApi";

import { contentChangeRequestsApi, LaravelContentChangeRequest } from "@/data/laravelApi";

type ReviewStatus = "pending" | "approved" | "rejected";
type ReviewKind = "story" | "case_update" | "campaign" | "media" | "page";

type ReviewItem = {
  id: string;
  kind: ReviewKind;
  title_ar: string;
  title_en: string;
  excerpt_ar: string;
  excerpt_en: string;
  author: string;
  submittedAt: string;
  status: ReviewStatus;
  notes?: string;
  _src?: "laravel_change_request" | "case" | "story" | "sample";
};

/** Map Laravel content-change-request into unified ReviewItem */
const fromLaravelChangeRequest = (cr: LaravelContentChangeRequest): ReviewItem => {
  const payload = cr.payload || {};
  const titleAr = (payload.title_ar as string) || (payload.title as string) || `${cr.module}: ${cr.action}`;
  const titleEn = (payload.title_en as string) || (payload.title as string) || `${cr.module}: ${cr.action}`;
  const excerptAr = (payload.description_ar as string) || (payload.content_ar as string) || (payload.summary_ar as string) || cr.route_uri || "";
  const excerptEn = (payload.description_en as string) || (payload.content_en as string) || (payload.summary_en as string) || cr.route_uri || "";

  let kind: ReviewKind = "page";
  if (cr.module?.includes("story") || cr.module?.includes("قصة")) kind = "story";
  else if (cr.module?.includes("case") || cr.module?.includes("حالة")) kind = "case_update";
  else if (cr.module?.includes("campaign") || cr.module?.includes("حملة")) kind = "campaign";
  else if (cr.module?.includes("media") || cr.module?.includes("gallery")) kind = "media";

  return {
    id: String(cr.id),
    kind,
    title_ar: titleAr,
    title_en: titleEn,
    excerpt_ar: String(excerptAr).slice(0, 220),
    excerpt_en: String(excerptEn).slice(0, 220),
    author: cr.user?.name || "مستخدم النظام",
    submittedAt: (cr.created_at || "").slice(0, 16).replace("T", " ") || new Date().toISOString().slice(0, 16).replace("T", " "),
    status: (cr.status === "approved" ? "approved" : cr.status === "rejected" ? "rejected" : "pending") as ReviewStatus,
    notes: cr.review_note || cr.reason || undefined,
    _src: "laravel_change_request",
  };
};

/** Map a DB case row into the unified ReviewItem shape used by the queue. */
const fromCase = (c: CaseRow): ReviewItem => ({
  id: c.id,
  kind: "case_update",
  title_ar: c.title,
  title_en: c.title,
  excerpt_ar: (c.story || "").slice(0, 220),
  excerpt_en: (c.story || "").slice(0, 220),
  author: c.created_by ?? "—",
  submittedAt: (c.created_at || "").slice(0, 16).replace("T", " "),
  status: (c.status === "approved" || c.status === "funded" || c.status === "closed")
    ? "approved"
    : c.status === "rejected"
      ? "rejected"
      : "pending",
  notes: c.rejection_reason ?? undefined,
  _src: "case",
});

const KIND_META: Record<ReviewKind, { ar: string; en: string; icon: typeof FileText; cls: string }> = {
  story:       { ar: "قصة",      en: "Story",        icon: FileText,   cls: "bg-secondary/20 text-primary" },
  case_update: { ar: "تحديث حالة", en: "Case update", icon: ClipboardCheck, cls: "bg-accent/15 text-accent" },
  campaign:    { ar: "حملة",     en: "Campaign",     icon: Megaphone,  cls: "bg-primary/10 text-primary" },
  media:       { ar: "وسائط",    en: "Media",        icon: ImageIcon,  cls: "bg-muted text-foreground" },
  page:        { ar: "صفحة",     en: "Page",         icon: FileEdit,   cls: "bg-secondary/20 text-primary" },
};

const STATUS_META: Record<ReviewStatus, { ar: string; en: string; icon: typeof Clock4; cls: string }> = {
  pending:  { ar: "معلّق",  en: "Pending",  icon: Clock4,        cls: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300" },
  approved: { ar: "مقبول",  en: "Approved", icon: CheckCircle2,  cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300" },
  rejected: { ar: "مرفوض",  en: "Rejected", icon: XCircle,       cls: "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300" },
};

const Inner = () => {
  const { lang } = useLang();
  const { user } = useAuth();
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ReviewStatus | "all">("pending");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");

  const refresh = async () => {
    setLoading(true);
    try {
      // 1. Try Laravel API /content-change-requests first
      let laravelItems: ReviewItem[] = [];
      try {
        const changeRequests = await contentChangeRequestsApi.listAll();
        if (Array.isArray(changeRequests) && changeRequests.length > 0) {
          laravelItems = changeRequests.map(fromLaravelChangeRequest);
        }
      } catch (e) {
        console.warn("Could not fetch from /content-change-requests:", e);
      }

      // 2. Cases fallback / extra
      let caseItems: ReviewItem[] = [];
      try {
        const rows = await listAllCasesForStaff();
        if (Array.isArray(rows)) {
          caseItems = rows.map(fromCase);
        }
      } catch {}

      const combined = [...laravelItems, ...caseItems];

      if (combined.length === 0) {
        // Fallback sample pending review items
        setItems([
          {
            id: "rev-sample-1",
            kind: "story",
            title_ar: "قصة نجاح: إعادة تأهيل منزل أم إبراهيم بقرية بساط",
            title_en: "Success Story: Um Ibrahim House Renovation",
            excerpt_ar: "بفضل تبرعاتكم الكريمة تم الانتهاء من تسقيف المنزل وتوصيل مياه الشرب النظيفة وإعادة فرشه بالكامل.",
            excerpt_en: "With your generous donations, the house was roofed, clean water was connected, and furnished.",
            author: "أحمد ممدوح (ميداني)",
            submittedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
            status: "pending",
            notes: undefined,
            _src: "sample",
          },
          {
            id: "rev-sample-2",
            kind: "case_update",
            title_ar: "تحديث حالة: تسليم جهاز العروسة ليتيمة بمركز طلخا",
            title_en: "Case Update: Bride trousseau delivery in Talkha",
            excerpt_ar: "تم تسليم الأجهزة الكهربائية وتوثيق المحضر بحضور مشرفي الجمعية.",
            excerpt_en: "Appliances delivered and documented in presence of charity supervisors.",
            author: "سارة إبراهيم (باحثة اجتماعية)",
            submittedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
            status: "pending",
            notes: undefined,
            _src: "sample",
          },
        ]);
      } else {
        setItems(combined);
      }
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void refresh(); }, []);

  const filtered = useMemo(() => {
    return items.filter((it) => {
      if (filter !== "all" && it.status !== filter) return false;
      if (!q.trim()) return true;
      const hay = `${it.title_ar} ${it.title_en} ${it.author}`.toLowerCase();
      return hay.includes(q.trim().toLowerCase());
    });
  }, [items, filter, q]);

  const counts = useMemo(() => ({
    all: items.length,
    pending: items.filter((i) => i.status === "pending").length,
    approved: items.filter((i) => i.status === "approved").length,
    rejected: items.filter((i) => i.status === "rejected").length,
  }), [items]);

  const decide = async (id: string, status: ReviewStatus) => {
    try {
      const item = items.find((i) => i.id === id);
      if (item?._src === "laravel_change_request") {
        if (status === "approved") {
          await contentChangeRequestsApi.approve(id, noteDraft || undefined);
        } else {
          await contentChangeRequestsApi.reject(id, noteDraft || undefined);
        }
      } else if (item?._src === "case") {
        await setCaseStatus(id, status === "approved" ? "approved" : "rejected", noteDraft || undefined);
      }

      setItems((prev) => prev.map((it) => it.id === id ? { ...it, status, notes: noteDraft || it.notes } : it));
      toast({ title: status === "approved" ? (lang === "ar" ? "تم قبول العنصر " : "Item approved ") : (lang === "ar" ? "تم رفض العنصر" : "Item rejected"), description: lang === "ar" ? `بواسطة ${user?.name || "محرر"}` : `By ${user?.name || "editor"}`,
      });
    } catch (e) {
      toast({ title: lang === "ar" ? "فشل التحديث" : "Update failed", description: (e as Error).message, variant: "destructive", });
    } finally {
      setNoteDraft("");
      setOpen(null);
    }
  };

  const tabs: { id: ReviewStatus | "all"; ar: string; en: string }[] = [
    { id: "pending",  ar: "معلّق",  en: "Pending" },
    { id: "approved", ar: "مقبول",  en: "Approved" },
    { id: "rejected", ar: "مرفوض",  en: "Rejected" },
    { id: "all",      ar: "الكل",   en: "All" },
  ];

  return (
    <AdminLayout title={{ ar: "مراجعة المحتوى", en: "Content Review" }}>
      {/* Stat strip */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {(["pending", "approved", "rejected", "all"] as const).map((k) => {
          const meta = k === "all"
            ? { ar: "إجمالي", en: "Total", cls: "bg-card", icon: Filter }
            : { ...STATUS_META[k] };
          const Icon = meta.icon;
          return (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`rounded-2xl border p-4 text-start shadow-soft transition ${
                filter === k ? "border-primary ring-2 ring-primary/30 bg-card" : "border-transparent bg-card hover:border-secondary/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`grid h-9 w-9 place-items-center rounded-xl ${meta.cls}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-2xl font-black text-primary">{counts[k]}</span>
              </div>
              <div className="mt-2 text-[12px] font-extrabold text-muted-foreground">
                {lang === "ar" ? (k === "all" ? "إجمالي العناصر" : STATUS_META[k as ReviewStatus].ar) : (k === "all" ? "Total items" : STATUS_META[k as ReviewStatus].en)}
              </div>
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="mt-5 flex flex-col gap-3 rounded-2xl bg-card p-3 shadow-soft md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-extrabold transition ${
                filter === t.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-secondary/30"
              }`}
            >
              {t[lang]} <span className="opacity-70">({t.id === "all" ? counts.all : counts[t.id as ReviewStatus]})</span>
            </button>
          ))}
        </div>
        <div className="flex w-full items-center gap-2 md:w-auto">
          <div className="relative w-full md:w-72">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={lang === "ar" ? "ابحث بالعنوان أو المحرر..." : "Search by title or author..."}
              className="h-10 ps-9"
            />
          </div>
          <button onClick={() => void refresh()} className="grid h-10 w-10 place-items-center rounded-md border border-border bg-background hover:bg-muted" aria-label="refresh">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="mt-4 space-y-3">
        {loading && (
          <div className="rounded-2xl bg-card p-8 text-center text-sm text-muted-foreground shadow-soft">…</div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="rounded-2xl bg-card p-8 text-center text-sm text-muted-foreground shadow-soft">
            {lang === "ar" ? "لا توجد عناصر مطابقة." : "No matching items."}
          </div>
        )}
        {!loading && filtered.map((it) => {
          const k = KIND_META[it.kind];
          const s = STATUS_META[it.status];
          const KIcon = k.icon;
          const SIcon = s.icon;
          const isOpen = open === it.id;
          return (
            <article key={it.id} className="rounded-2xl bg-card p-4 shadow-soft md:p-5">
              <header className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold ${k.cls}`}>
                      <KIcon className="h-3 w-3" /> {k[lang]}
                    </span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold ${s.cls}`}>
                      <SIcon className="h-3 w-3" /> {s[lang]}
                    </span>
                    <span className="text-[10px] text-muted-foreground" dir="ltr">#{it.id}</span>
                  </div>
                  <h3 className="mt-1.5 text-base font-extrabold text-primary md:text-lg">
                    {lang === "ar" ? it.title_ar : it.title_en}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {lang === "ar" ? it.excerpt_ar : it.excerpt_en}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                    <span dir="ltr">{it.author}</span>
                    <span>•</span>
                    <span dir="ltr">{it.submittedAt}</span>
                  </div>
                  {it.notes && (
                    <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-muted/60 p-2 text-[12px]">
                      <MessageSquare className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
                      <span>{it.notes}</span>
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {it.status !== "approved" && (
                    <button
                      onClick={() => decide(it.id, "approved")}
                      className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-extrabold text-white hover:bg-emerald-700"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {lang === "ar" ? "قبول" : "Approve"}
                    </button>
                  )}
                  {it.status !== "rejected" && (
                    <button
                      onClick={() => setOpen(isOpen ? null : it.id)}
                      className="inline-flex items-center gap-1 rounded-full bg-rose-600 px-3 py-1.5 text-xs font-extrabold text-white hover:bg-rose-700"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      {lang === "ar" ? "رفض" : "Reject"}
                    </button>
                  )}
                </div>
              </header>

              {isOpen && (
                <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50/50 p-3 dark:border-rose-500/30 dark:bg-rose-500/5">
                  <label className="block text-xs font-extrabold text-rose-700 dark:text-rose-300">
                    {lang === "ar" ? "سبب الرفض (سيُرسل للمحرر)" : "Rejection reason (sent to author)"}
                  </label>
                  <textarea
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    rows={3}
                    placeholder={lang === "ar" ? "اكتب الملاحظات بالعربية أو الإنجليزية..." : "Write notes in Arabic or English..."}
                    className="mt-1.5 w-full rounded-lg border border-border bg-background p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <div className="mt-2 flex justify-end gap-2">
                    <button
                      onClick={() => { setOpen(null); setNoteDraft(""); }}
                      className="rounded-full px-3 py-1.5 text-xs font-bold text-muted-foreground hover:bg-muted"
                    >
                      {lang === "ar" ? "إلغاء" : "Cancel"}
                    </button>
                    <button
                      onClick={() => decide(it.id, "rejected")}
                      disabled={!noteDraft.trim()}
                      className="rounded-full bg-rose-600 px-3 py-1.5 text-xs font-extrabold text-white hover:bg-rose-700 disabled:opacity-50"
                    >
                      {lang === "ar" ? "تأكيد الرفض" : "Confirm rejection"}
                    </button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </AdminLayout>
  );
};

const AdminContentReview = () => (
  <RequireAuth roles={["admin", "editor"]}>
    <Inner />
  </RequireAuth>
);

export default AdminContentReview;