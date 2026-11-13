/**
 * «مراجعة المحتوى»: every change an editor sent waits here until the team approves it (then it runs)
 * or rejects it (with a reason the editor sees). Each request shows what it does, field by field:
 * the value now and the value after approval (GET /admin/change-requests/details).
 * Cases waiting for review are listed too.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useLang } from "@/i18n/LangContext";
import { RequireAuth } from "@/auth/RequireAuth";
import { toast } from "@/lib/notify";
import { askConfirm } from "@/components/common/confirm";
import {
  ClipboardCheck, Clock4, CheckCircle2, XCircle, FileEdit, Search, Filter, MessageSquare, RefreshCw,
  ChevronDown, ExternalLink, UserRound, AlertTriangle, Paperclip, Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { listAllCasesForStaff, setCaseStatus, type CaseRow } from "@/data/casesApi";
import {
  ApiError, changeRequestDetailsApi, contentChangeRequestsApi,
  type ChangeRequestDetails, type LaravelContentChangeRequest,
} from "@/data/laravelApi";
import { errorReason } from "@/lib/notify";
import { arabicServerMessage } from "@/lib/serverMessages";
import { actionLabel, adminLink, fieldLabel, readableValue, sectionKey, sectionLabel } from "@/lib/changeRequestLabels";

type ReviewStatus = "pending" | "approved" | "rejected";

type ReviewItem = {
  key: string;
  id: string;
  src: "change" | "case";
  section: string;
  action: string;
  title: string;
  author: string;
  authorNote?: string;
  submittedAt: string;
  status: ReviewStatus;
  notes?: string;
  reviewedAt?: string;
  details?: ChangeRequestDetails;
  cr?: LaravelContentChangeRequest;
  caseRow?: CaseRow;
  link?: string | null;
};

const ROLE_AR: Record<string, string> = {
  "super-admin": "مدير عام", admin: "مدير", editor: "محرر", "case-editor": "محرر حالات",
  "media-library": "مكتبة الوسائط", donor: "متبرع", volunteer: "متطوع",
};

const STATUS_META: Record<ReviewStatus, { ar: string; icon: typeof Clock4; cls: string }> = {
  pending: { ar: "معلّق", icon: Clock4, cls: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300" },
  approved: { ar: "مقبول", icon: CheckCircle2, cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300" },
  rejected: { ar: "مرفوض", icon: XCircle, cls: "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300" },
};

const when = (s?: string | null) => (s || "").slice(0, 16).replace("T", " ");
const statusOf = (s: string): ReviewStatus => (s === "approved" ? "approved" : s === "rejected" ? "rejected" : "pending");

function fromChange(cr: LaravelContentChangeRequest, d?: ChangeRequestDetails): ReviewItem {
  const payload = (cr.payload || {}) as Record<string, unknown>;
  const section = sectionKey(cr.route_uri, cr.module);
  const pick = (...k: string[]) => k.map((x) => payload[x]).find((v) => typeof v === "string" && v.trim()) as string | undefined;
  const title = d?.target.title || pick("name_ar", "title_ar", "name", "title") || `${sectionLabel(section)} #${cr.record_id ?? cr.id}`;
  const a = d?.author;
  const roles = (a?.roles ?? []).map((r) => ROLE_AR[r] ?? r).join("، ");
  return {
    key: `cr-${cr.id}`,
    id: String(cr.id),
    src: "change",
    section,
    action: actionLabel(cr.method, cr.action),
    title,
    author: a ? `${a.name}${roles ? ` (${roles})` : ""}` : cr.user?.name || "—",
    authorNote: a?.deleted ? "حساب صاحب التعديل اتمسح" : a && a.active === false ? "حساب صاحب التعديل مش مفعّل" : undefined,
    submittedAt: when(cr.created_at),
    status: statusOf(cr.status),
    notes: cr.review_note || cr.reason || undefined,
    reviewedAt: when(cr.reviewed_at),
    details: d,
    cr,
    link: section === "editor-registration" ? adminLink("users", cr.record_id) : adminLink(d?.target.table ?? section, d?.target.id ?? cr.record_id),
  };
}

function fromCase(c: CaseRow): ReviewItem {
  return {
    key: `case-${c.id}`,
    id: c.id,
    src: "case",
    section: "cases",
    action: "حالة جديدة",
    title: c.title,
    author: c.created_by ?? "—",
    submittedAt: when(c.created_at),
    status: c.status === "approved" || c.status === "funded" || c.status === "closed" ? "approved" : c.status === "rejected" ? "rejected" : "pending",
    notes: c.rejection_reason ?? undefined,
    caseRow: c,
    link: adminLink("cases", c.id),
  };
}

/** Why an approved change could not run (the server's own validation answer), in Arabic. */
function approvalFailure(e: unknown): string {
  if (e instanceof ApiError) {
    const d = e.data as { execution_response?: { message?: string; errors?: Record<string, string[]> } } | undefined;
    const ex = d?.execution_response;
    if (ex) return `الموافقة ما اتنفذتش: ${arabicServerMessage(ex.message, ex.errors)}`;
  }
  return errorReason(e);
}

function ValueCell({ v }: { v: string | null }) {
  const text = readableValue(v);
  const long = text.length > 220;
  const [open, setOpen] = useState(false);
  const url = typeof v === "string" && /^https?:\/\/\S+\.(webp|png|jpe?g|gif|avif)(\?.*)?$/i.test(v) ? v : null;
  return (
    <div className="min-w-0 whitespace-pre-wrap break-words text-[12.5px] leading-relaxed">
      {url && <img src={url} alt="" className="mb-1 h-16 w-24 rounded-md object-cover" loading="lazy" />}
      {long && !open ? `${text.slice(0, 220)}…` : text}
      {long && (
        <button type="button" onClick={() => setOpen(!open)} className="ms-1 text-[11px] font-bold text-primary underline">
          {open ? "أقل" : "النص كامل"}
        </button>
      )}
    </div>
  );
}

function ChangeTable({ item }: { item: ReviewItem }) {
  const d = item.details;
  const [showSame, setShowSame] = useState(false);
  if (!d) {
    const payload = (item.cr?.payload || {}) as Record<string, unknown>;
    const keys = Object.keys(payload).filter((k) => !k.startsWith("_"));
    if (!keys.length) return <p className="text-xs text-muted-foreground">مفيش بيانات مع الطلب ده.</p>;
    return (
      <div className="space-y-1">
        <p className="text-[11px] text-amber-700">القيم الحالية مش ظاهرة (حزمة «تفاصيل المراجعة» مش منشورة). دي القيم الجديدة بس:</p>
        {keys.map((k) => (
          <div key={k} className="grid grid-cols-[9rem_1fr] gap-2 border-b border-border/40 py-1">
            <span className="text-[12px] font-bold text-muted-foreground">{fieldLabel(k)}</span>
            <ValueCell v={payload[k] === null || payload[k] === undefined ? null : typeof payload[k] === "object" ? JSON.stringify(payload[k]) : String(payload[k])} />
          </div>
        ))}
      </div>
    );
  }
  const isDelete = item.cr?.method?.toUpperCase() === "DELETE";
  const isCreate = item.cr?.method?.toUpperCase() === "POST" && !d.target.exists;
  const changed = d.changes.filter((c) => c.changed);
  const same = d.changes.filter((c) => !c.changed);
  return (
    <div className="space-y-2">
      {isDelete && (
        <p className="flex items-center gap-1.5 rounded-lg bg-rose-50 p-2 text-[12px] font-bold text-rose-800 dark:bg-rose-500/10 dark:text-rose-300">
          <AlertTriangle className="h-4 w-4" /> الموافقة هتحذف العنصر ده{d.target.exists ? "" : " (العنصر مش موجود أصلًا)"}.
        </p>
      )}
      {!isDelete && item.cr?.method?.toUpperCase() !== "POST" && !d.target.exists && item.section !== "editor-registration" && (
        <p className="flex items-center gap-1.5 rounded-lg bg-amber-50 p-2 text-[12px] font-bold text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
          <AlertTriangle className="h-4 w-4" /> العنصر اللي بيتعدل مش موجود دلوقتي، فالموافقة غالبًا هتفشل.
        </p>
      )}
      <div className="overflow-hidden rounded-xl border border-border">
        <div className={`grid ${isCreate || isDelete ? "grid-cols-[9rem_1fr]" : "grid-cols-[9rem_1fr_1fr]"} bg-muted/60 text-[11px] font-black text-muted-foreground`}>
          <span className="p-2">الحقل</span>
          {!isCreate && <span className="p-2">{isDelete ? "القيمة الحالية" : "دلوقتي"}</span>}
          {!isDelete && <span className="p-2">{isCreate ? "القيمة" : "بعد الموافقة"}</span>}
        </div>
        {(showSame ? [...changed, ...same] : changed).map((c) => (
          <div key={c.field} className={`grid ${isCreate || isDelete ? "grid-cols-[9rem_1fr]" : "grid-cols-[9rem_1fr_1fr]"} border-t border-border/60`}>
            <span className="p-2 text-[12px] font-bold text-primary">{fieldLabel(c.field)}</span>
            {!isCreate && (
              <div className={`p-2 ${!isDelete && c.changed ? "bg-rose-50/60 text-rose-900 line-through decoration-rose-300 dark:bg-rose-500/5 dark:text-rose-200" : ""}`}>
                <ValueCell v={c.before} />
              </div>
            )}
            {!isDelete && (
              <div className={`p-2 ${c.changed ? "bg-emerald-50/70 text-emerald-900 dark:bg-emerald-500/5 dark:text-emerald-200" : ""}`}>
                <ValueCell v={c.after} />
              </div>
            )}
          </div>
        ))}
        {changed.length === 0 && !showSame && <p className="border-t border-border/60 p-2 text-[12px] text-muted-foreground">مفيش حقل اتغير فعلًا.</p>}
      </div>
      {same.length > 0 && (
        <button type="button" onClick={() => setShowSame(!showSame)} className="text-[11px] font-bold text-primary underline">
          {showSame ? "اخفي الحقول اللي ما اتغيرتش" : `و${same.length} حقل اتبعت من غير تغيير`}
        </button>
      )}
      {d.files.length > 0 && (
        <p className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
          <Paperclip className="h-3.5 w-3.5" /> ملفات مرفوعة مع الطلب (مش بتتحفظ مع الطلب، والمحرر لازم يرفعها تاني بعد الموافقة):
          {d.files.map((f) => <span key={f.original_name} className="rounded bg-muted px-1.5" dir="ltr">{f.original_name}</span>)}
        </p>
      )}
    </div>
  );
}

const Inner = () => {
  const { lang } = useLang();
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailsMissing, setDetailsMissing] = useState(false);
  const [filter, setFilter] = useState<ReviewStatus | "all">("pending");
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const [changes, cases] = await Promise.all([
        contentChangeRequestsApi.listAll(undefined, { useCache: false }).catch(() => [] as LaravelContentChangeRequest[]),
        listAllCasesForStaff().catch(() => [] as CaseRow[]),
      ]);
      let details: Record<string, ChangeRequestDetails> = {};
      try {
        details = await changeRequestDetailsApi.get(changes.map((c) => c.id));
        setDetailsMissing(false);
      } catch {
        setDetailsMissing(changes.length > 0);
      }
      setItems([
        ...changes.map((c) => fromChange(c, details[String(c.id)])),
        ...(Array.isArray(cases) ? cases.map(fromCase) : []),
      ].sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void refresh(); }, []);

  const filtered = useMemo(() => items.filter((it) => {
    if (filter !== "all" && it.status !== filter) return false;
    const t = q.trim().toLowerCase();
    return !t || `${it.title} ${it.author} ${sectionLabel(it.section)}`.toLowerCase().includes(t);
  }), [items, filter, q]);

  const counts = useMemo(() => ({
    all: items.length,
    pending: items.filter((i) => i.status === "pending").length,
    approved: items.filter((i) => i.status === "approved").length,
    rejected: items.filter((i) => i.status === "rejected").length,
  }), [items]);

  const approve = async (it: ReviewItem) => {
    const what = `${it.action} ${sectionLabel(it.section)} «${it.title}»`;
    if (!(await askConfirm(`توافق على ${what}؟ التعديل هيتنفذ على الموقع فورًا.`))) return;
    setBusy(it.key);
    try {
      if (it.src === "change") await contentChangeRequestsApi.approve(it.id);
      else await setCaseStatus(it.id, "approved");
      toast.success("اتوافق واتنفذ", { description: what });
      await refresh();
    } catch (e) {
      toast.error("الموافقة ما كملتش", { description: approvalFailure(e) });
    } finally {
      setBusy(null);
    }
  };

  const reject = async (it: ReviewItem) => {
    if (!noteDraft.trim()) return;
    setBusy(it.key);
    try {
      if (it.src === "change") await contentChangeRequestsApi.reject(it.id, noteDraft.trim());
      else await setCaseStatus(it.id, "rejected", noteDraft.trim());
      toast.success("اترفض، والسبب اتسجل");
      setRejecting(null);
      setNoteDraft("");
      await refresh();
    } catch (e) {
      toast.error("الرفض ما اتسجلش", { description: errorReason(e) });
    } finally {
      setBusy(null);
    }
  };

  const tabs: { id: ReviewStatus | "all"; ar: string }[] = [
    { id: "pending", ar: "معلّق" }, { id: "approved", ar: "مقبول" }, { id: "rejected", ar: "مرفوض" }, { id: "all", ar: "الكل" },
  ];

  return (
    <AdminLayout title={{ ar: "مراجعة المحتوى", en: "Content Review" }}>
      <div dir="rtl">
        <p className="mb-4 rounded-2xl border border-border bg-card p-3 text-[13px] leading-relaxed text-muted-foreground">
          أي إضافة أو تعديل أو حذف بيعمله <b className="text-primary">المحرر</b> بيستنى هنا ومش بيظهر على الموقع غير بعد الموافقة.
          افتح «التفاصيل» تشوف كل حقل: قيمته دلوقتي وقيمته بعد الموافقة. القبول بينفذ التعديل فورًا، والرفض محتاج سبب بيوصل للمحرر.
          حسابات المحررين الجديدة كمان بتتوافق من هنا.
        </p>
        {detailsMissing && (
          <p className="mb-4 rounded-xl bg-amber-50 p-3 text-[12px] font-bold text-amber-800">
            تفاصيل «قبل / بعد» مش متاحة دلوقتي (مسار /admin/change-requests/details مش بيرد). الطلبات ظاهرة بالقيم الجديدة بس.
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {(["pending", "approved", "rejected", "all"] as const).map((k) => {
            const meta = k === "all" ? { ar: "الإجمالي", cls: "bg-muted text-foreground", icon: Filter } : STATUS_META[k];
            const Icon = meta.icon;
            return (
              <button key={k} onClick={() => setFilter(k)}
                className={`rounded-2xl border p-4 text-start shadow-soft transition ${filter === k ? "border-primary bg-card ring-2 ring-primary/30" : "border-transparent bg-card hover:border-secondary/40"}`}>
                <div className="flex items-center justify-between">
                  <span className={`grid h-9 w-9 place-items-center rounded-xl ${meta.cls}`}><Icon className="h-4 w-4" /></span>
                  <span className="text-2xl font-black text-primary">{counts[k]}</span>
                </div>
                <div className="mt-2 text-[12px] font-extrabold text-muted-foreground">{meta.ar}</div>
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex flex-col gap-3 rounded-2xl bg-card p-3 shadow-soft md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {tabs.map((t) => (
              <button key={t.id} onClick={() => setFilter(t.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-extrabold transition ${filter === t.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-secondary/30"}`}>
                {t.ar} <span className="opacity-70">({t.id === "all" ? counts.all : counts[t.id]})</span>
              </button>
            ))}
          </div>
          <div className="flex w-full items-center gap-2 md:w-auto">
            <div className="relative w-full md:w-72">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث بالعنوان أو المحرر أو القسم…" className="h-10 ps-9" />
            </div>
            <button onClick={() => void refresh()} className="grid h-10 w-10 place-items-center rounded-md border border-border bg-background hover:bg-muted" aria-label="تحديث">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {loading && <div className="rounded-2xl bg-card p-8 text-center text-sm text-muted-foreground shadow-soft"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></div>}
          {!loading && filtered.length === 0 && (
            <div className="rounded-2xl bg-card p-8 text-center text-sm text-muted-foreground shadow-soft">
              {filter === "pending" ? "مفيش حاجة مستنية مراجعة." : "مفيش عناصر."}
            </div>
          )}
          {!loading && filtered.map((it) => {
            const s = STATUS_META[it.status];
            const SIcon = s.icon;
            const open = expanded[it.key] ?? it.status === "pending";
            return (
              <article key={it.key} className="rounded-2xl bg-card p-4 shadow-soft md:p-5">
                <header className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-secondary/20 px-2 py-0.5 text-[10px] font-extrabold text-primary">
                        {it.src === "case" ? <ClipboardCheck className="h-3 w-3" /> : <FileEdit className="h-3 w-3" />}
                        {it.action} {sectionLabel(it.section)}
                      </span>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold ${s.cls}`}><SIcon className="h-3 w-3" /> {s.ar}</span>
                      <span className="text-[10px] text-muted-foreground" dir="ltr">#{it.id}</span>
                    </div>
                    <h3 className="mt-1.5 text-base font-extrabold text-primary md:text-lg">{it.title}</h3>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><UserRound className="h-3.5 w-3.5" /> {it.author}</span>
                      <span dir="ltr">{it.submittedAt}</span>
                      {it.link && (
                        <Link to={it.link} className="inline-flex items-center gap-1 font-bold text-primary hover:underline">
                          <ExternalLink className="h-3.5 w-3.5" /> افتح في اللوحة
                        </Link>
                      )}
                    </div>
                    {it.authorNote && <p className="mt-1.5 text-[11.5px] font-bold text-amber-700">{it.authorNote}</p>}
                    {it.notes && (
                      <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-muted/60 p-2 text-[12px]">
                        <MessageSquare className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
                        <span>{it.status === "rejected" ? "سبب الرفض: " : "ملاحظة: "}{it.notes}{it.reviewedAt ? ` — ${it.reviewedAt}` : ""}</span>
                      </div>
                    )}
                  </div>
                  {it.status === "pending" && (
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button disabled={busy === it.key} onClick={() => void approve(it)}
                        className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-extrabold text-white hover:bg-emerald-700 disabled:opacity-50">
                        {busy === it.key ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />} قبول
                      </button>
                      <button disabled={busy === it.key} onClick={() => { setRejecting(rejecting === it.key ? null : it.key); setNoteDraft(""); }}
                        className="inline-flex items-center gap-1 rounded-full bg-rose-600 px-3 py-1.5 text-xs font-extrabold text-white hover:bg-rose-700 disabled:opacity-50">
                        <XCircle className="h-3.5 w-3.5" /> رفض
                      </button>
                    </div>
                  )}
                </header>

                {it.src === "change" ? (
                  <div className="mt-3">
                    <button type="button" onClick={() => setExpanded((m) => ({ ...m, [it.key]: !open }))}
                      className="inline-flex items-center gap-1 text-[12px] font-extrabold text-primary">
                      <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} /> التفاصيل
                      {it.details && <span className="font-bold text-muted-foreground">({it.details.changes.filter((c) => c.changed).length} حقل)</span>}
                    </button>
                    {open && <div className="mt-2"><ChangeTable item={it} /></div>}
                  </div>
                ) : (
                  it.caseRow?.story && <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{it.caseRow.story}</p>
                )}

                {rejecting === it.key && (
                  <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50/50 p-3 dark:border-rose-500/30 dark:bg-rose-500/5">
                    <label className="block text-xs font-extrabold text-rose-700 dark:text-rose-300">سبب الرفض (بيوصل للمحرر)</label>
                    <textarea value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} rows={3}
                      placeholder="مثلًا: العنوان فيه غلطة إملائية، صلّحه وابعته تاني."
                      className="mt-1.5 w-full rounded-lg border border-border bg-background p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                    <div className="mt-2 flex justify-end gap-2">
                      <button onClick={() => { setRejecting(null); setNoteDraft(""); }} className="rounded-full px-3 py-1.5 text-xs font-bold text-muted-foreground hover:bg-muted">إلغاء</button>
                      <button onClick={() => void reject(it)} disabled={!noteDraft.trim() || busy === it.key}
                        className="rounded-full bg-rose-600 px-3 py-1.5 text-xs font-extrabold text-white hover:bg-rose-700 disabled:opacity-50">تأكيد الرفض</button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
        {lang !== "ar" && <p className="mt-4 text-xs text-muted-foreground">This page is in Arabic.</p>}
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
