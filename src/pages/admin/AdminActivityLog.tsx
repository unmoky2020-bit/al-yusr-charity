import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { NiceSelect } from "@/components/common/NiceSelect";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { RequireAuth } from "@/auth/RequireAuth";
import { useLang } from "@/i18n/LangContext";
import { apiFetch, type LaravelActivityLog } from "@/data/laravelApi";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Loader2, RefreshCw, Search, Activity, ShieldCheck,
  FileEdit, Users, ChevronLeft, ChevronRight,
  Monitor, Globe, Clock, Layers, Eye, EyeOff,
  Trash2, PlusCircle, Pencil, AlertCircle,
} from "lucide-react";

// --- Types ---
type Row = {
  id: string;
  actor_id: string | null;
  actor_name: string | null;
  actor_email: string | null;
  actor_role: string | null;
  action: string;
  module: string | null;
  entity_type: string | null;
  entity_id: string | null;
  summary: string | null;
  ip: string | null;
  user_agent: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

// --- Helpers ---
function mapItem(item: LaravelActivityLog, isAr: boolean): Row {
  return {
    id: String(item.id),
    actor_id: item.user_id ? String(item.user_id) : null,
    actor_name: item.user?.name || (isAr ? "النظام" : "System"),
    actor_email: item.user?.email || null,
    actor_role:
      item.role ||
      item.user?.roles?.[0]?.slug ||
      item.user?.roles?.[0]?.name ||
      null,
    action: item.action || item.description || (isAr ? "إجراء" : "Action"),
    module: item.module || item.entity_type || null,
    entity_type: item.entity_type || item.module || null,
    entity_id: item.entity_id ? String(item.entity_id) : null,
    summary: item.summary || item.description || null,
    ip: item.ip || null,
    user_agent: item.user_agent || null,
    old_values: (item.old_values as Record<string, unknown> | null) ?? null,
    new_values:
      (item.new_values as Record<string, unknown> | null) ??
      (item.metadata as Record<string, unknown> | null) ??
      null,
    metadata: (item.metadata as Record<string, unknown> | null) ?? null,
    created_at: item.created_at || new Date().toISOString(),
  };
}

function actionIcon(action: string) {
  const a = action.toLowerCase();
  if (a === "create" || a === "add") return <PlusCircle className="h-3.5 w-3.5" />;
  if (a === "update" || a === "edit") return <Pencil className="h-3.5 w-3.5" />;
  if (a === "delete" || a === "remove") return <Trash2 className="h-3.5 w-3.5" />;
  if (a === "login") return <ShieldCheck className="h-3.5 w-3.5" />;
  return <Activity className="h-3.5 w-3.5" />;
}

function actionBadgeCls(action: string) {
  const a = action.toLowerCase();
  if (a === "create" || a === "add") return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20";
  if (a === "update" || a === "edit") return "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20";
  if (a === "delete" || a === "remove") return "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/20";
  if (a === "login") return "bg-primary/15 text-primary border-primary/20";
  return "bg-muted text-muted-foreground border-border";
}

function roleBadgeCls(role: string | null) {
  if (!role) return "bg-muted text-muted-foreground";
  const r = role.toLowerCase();
  if (r.includes("super") || r === "admin") return "bg-primary/15 text-primary border-primary/20";
  if (r.includes("editor") || r.includes("content")) return "bg-amber-500/15 text-amber-800 border-amber-500/30";
  if (r.includes("delegate") || r.includes("field")) return "bg-sky-500/15 text-sky-800 border-sky-500/30";
  return "bg-muted/70 text-muted-foreground border-border";
}

const MODULE_LABELS: Record<string, { ar: string; en: string }> = {
  Program: { ar: "برنامج", en: "Program" },
  Project: { ar: "مشروع", en: "Project" },
  User: { ar: "مستخدم", en: "User" },
  Case: { ar: "حالة", en: "Case" },
  CaseModel: { ar: "حالة", en: "Case" },
  Donation: { ar: "تبرع", en: "Donation" },
  Campaign: { ar: "حملة", en: "Campaign" },
  DonationCampaign: { ar: "حملة", en: "Campaign" },
  Blog: { ar: "مقال", en: "Blog" },
  Article: { ar: "مقال", en: "Article" },
  Story: { ar: "قصة", en: "Story" },
  Gallery: { ar: "معرض الصور", en: "Gallery" },
  GalleryImage: { ar: "معرض الصور", en: "Gallery" },
  Media: { ar: "مكتبة الوسائط", en: "Media" },
  PaymentMethod: { ar: "طريقة دفع", en: "Payment method" },
  Volunteer: { ar: "تطوع", en: "Volunteer" },
  Newsletter: { ar: "النشرة", en: "Newsletter" },
  Settings: { ar: "إعدادات", en: "Settings" },
  Setting: { ar: "إعدادات", en: "Settings" },
  Auth: { ar: "الدخول", en: "Auth" },
};

/** "donation_status", "CaseModel", "case-models" → one key for the label maps. */
const keyOf = (v: string) => v.replace(/[-\s]+/g, "_").replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();
const moduleLabel = (m: string, isAr: boolean) => {
  const hit = Object.entries(MODULE_LABELS).find(([k]) => keyOf(k) === keyOf(m) || keyOf(k) + "s" === keyOf(m));
  return hit ? (isAr ? hit[1].ar : hit[1].en) : m.replace(/[_-]+/g, " ");
};

const ACTION_LABELS: Record<string, { ar: string; en: string }> = {
  create: { ar: "إضافة", en: "Create" },
  created: { ar: "إضافة", en: "Create" },
  update: { ar: "تعديل", en: "Update" },
  updated: { ar: "تعديل", en: "Update" },
  delete: { ar: "حذف", en: "Delete" },
  deleted: { ar: "حذف", en: "Delete" },
  restore: { ar: "استرجاع", en: "Restore" },
  login: { ar: "تسجيل دخول", en: "Login" },
  logout: { ar: "تسجيل خروج", en: "Logout" },
  donation_status: { ar: "تغيير حالة تبرع", en: "Donation status" },
  status_change: { ar: "تغيير حالة", en: "Status change" },
  approve: { ar: "اعتماد", en: "Approve" },
  approved: { ar: "اعتماد", en: "Approve" },
  reject: { ar: "رفض", en: "Reject" },
  rejected: { ar: "رفض", en: "Reject" },
  publish: { ar: "نشر", en: "Publish" },
  upload: { ar: "رفع ملف", en: "Upload" },
  export: { ar: "تصدير", en: "Export" },
  payment: { ar: "دفع", en: "Payment" },
  refund: { ar: "استرداد", en: "Refund" },
};
const actionLabel = (a: string, isAr: boolean) => {
  const hit = ACTION_LABELS[keyOf(a)];
  return hit ? (isAr ? hit.ar : hit.en) : a.replace(/[_-]+/g, " ");
};
/** Where an entity opens in the dashboard. */
const entityHref = (module: string | null, id: string | null): string | null => {
  if (!module || !id) return null;
  const k = keyOf(module);
  if (k.startsWith("donation_campaign") || k === "campaign" || k === "campaigns") return "/admin/campaigns";
  if (k.startsWith("donation")) return `/admin/donations/${id}`;
  if (k.startsWith("case")) return `/admin/cases/${id}`;
  if (k.startsWith("project")) return `/admin/projects/${id}`;
  if (k.startsWith("program")) return `/admin/programs/${id}`;
  if (k.startsWith("user")) return "/admin/users";
  return null;
};
const showValue = (v: unknown) => (v === null || v === undefined || v === "" ? "—" : typeof v === "object" ? JSON.stringify(v) : String(v));

function fmtRelative(dateStr: string, isAr: boolean): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return isAr ? "الآن" : "Just now";
    if (mins < 60) return isAr ? `منذ ${mins} دقيقة` : `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return isAr ? `منذ ${hrs} ساعة` : `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return isAr ? `منذ ${days} يوم` : `${days}d ago`;
  } catch {
    return dateStr;
  }
}

const PER_PAGE_OPTIONS = [10, 25, 50, 100];
const MODULES = ["Program", "Project", "User", "Case", "Donation", "Campaign", "Blog", "Settings"];
const ACTIONS = ["create", "update", "delete", "login", "donation_status"];

// --- Component ---
const Inner = () => {
  const { lang } = useLang();
  const isAr = lang === "ar";

  const [rows, setRows] = useState<Row[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [filterModule, setFilterModule] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [lastPage, setLastPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // Filter options: the known ones + every value the log actually returned (e.g. "donation_status").
  const [seenModules, setSeenModules] = useState<string[]>([]);
  const [seenActions, setSeenActions] = useState<string[]>([]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Build query string manually so we can use apiFetch directly
      // (avoids resource.list() which silently swallows errors)
      const qs: Record<string, unknown> = { page, per_page: perPage };
      if (filterModule) qs.module = filterModule;
      if (filterAction) qs.action = filterAction;

      const res = await apiFetch<{
        data?: LaravelActivityLog[];
        meta?: { total?: number; last_page?: number; current_page?: number };
      } | LaravelActivityLog[]>("/activity-logs", {
        method: "GET",
        params: qs,
        useCache: false,
      });

      let items: LaravelActivityLog[] = [];
      let total = 0;
      let lp = 1;

      if (Array.isArray(res)) {
        items = res;
        total = res.length;
      } else {
        items = Array.isArray(res.data) ? res.data : [];
        total = res.meta?.total ?? items.length;
        lp = res.meta?.last_page ?? 1;
      }

      const mapped = items.map((item) => mapItem(item, isAr));
      setRows(mapped);
      setSeenModules((prev) => Array.from(new Set([...prev, ...mapped.map((r) => r.module).filter(Boolean) as string[]])));
      setSeenActions((prev) => Array.from(new Set([...prev, ...mapped.map((r) => r.action).filter(Boolean)])));
      setTotalCount(total);
      setLastPage(lp);
    } catch (err) {
      console.error("ActivityLog fetch error:", err);
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(isAr
        ? `فشل تحميل سجل النشاط: ${errMsg}`
        : `Failed to load activity log: ${errMsg}`);
      setRows([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, perPage, filterModule, filterAction, isAr]);

  useEffect(() => { void reload(); }, [reload]);
  useEffect(() => { setPage(1); }, [filterModule, filterAction, perPage]);

  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const lq = q.toLowerCase();
    return rows.filter((r) =>
      [r.actor_name, r.actor_email, r.action, r.module, r.entity_type, r.summary, r.entity_id]
        .filter(Boolean).join(" ").toLowerCase().includes(lq)
    );
  }, [rows, q]);

  const uniqueUsers = useMemo(() => new Set(rows.map((r) => r.actor_id).filter(Boolean)).size, [rows]);
  const createCount = rows.filter((r) => ["create", "created"].includes(keyOf(r.action))).length;
  const deleteCount = rows.filter((r) => ["delete", "deleted"].includes(keyOf(r.action))).length;
  const updateCount = rows.filter((r) => !["create", "created", "delete", "deleted", "login", "logout"].includes(keyOf(r.action))).length;

  const uniqBy = (list: string[]) => {
    const out = new Map<string, string>();
    list.forEach((v) => { const k = keyOf(v); if (!out.has(k)) out.set(k, v); });
    return Array.from(out.values());
  };
  const moduleOptions = useMemo(() => [
    { value: "__all", label: isAr ? "كل الوحدات" : "All modules" },
    ...uniqBy([...MODULES, ...seenModules]).map((m) => ({ value: m, label: moduleLabel(m, isAr) })),
  ], [seenModules, isAr]);
  const actionOptions = useMemo(() => [
    { value: "__all", label: isAr ? "كل الإجراءات" : "All actions" },
    ...uniqBy([...ACTIONS, ...seenActions]).map((a) => ({ value: a, label: actionLabel(a, isAr) })),
  ], [seenActions, isAr]);

  return (
    <AdminLayout title={{ ar: "سجل النشاط والتدقيق", en: "Audit Activity Log" }}>
      <div dir={isAr ? "rtl" : "ltr"} className="space-y-6">
        {/* KPI */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
          {[
            { icon: <Activity className="h-5 w-5 text-secondary" />, bg: "bg-secondary/15", label: { ar: "إجمالي السجلات", en: "Total Records" }, val: totalCount.toLocaleString() },
            { icon: <PlusCircle className="h-5 w-5 text-emerald-600" />, bg: "bg-emerald-500/15", label: { ar: "إضافات (في الصفحة)", en: "Creates (this page)" }, val: createCount },
            { icon: <Pencil className="h-5 w-5 text-amber-600" />, bg: "bg-amber-500/15", label: { ar: "تعديلات (في الصفحة)", en: "Changes (this page)" }, val: updateCount },
            { icon: <Trash2 className="h-5 w-5 text-rose-600" />, bg: "bg-rose-500/15", label: { ar: "حذف (في الصفحة)", en: "Deletions (this page)" }, val: deleteCount },
            { icon: <Users className="h-5 w-5 text-primary" />, bg: "bg-primary/15", label: { ar: "مستخدمين (في الصفحة)", en: "Users (this page)" }, val: uniqueUsers },
          ].map((kpi, i) => (
            <Card key={i} className="p-4 sm:p-5 bg-card border-border/80">
              <div className="flex items-center gap-3">
                <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${kpi.bg}`}>{kpi.icon}</div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-muted-foreground truncate">{isAr ? kpi.label.ar : kpi.label.en}</p>
                  <p className="font-mono text-xl sm:text-2xl font-black text-primary">{loading ? "…" : kpi.val}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="ps-9 h-11 rounded-2xl bg-card" placeholder={isAr ? "بحث بالمستخدم، الإجراء، الملخص…" : "Search user, action, summary…"} value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <NiceSelect value={filterModule || "__all"} onChange={(v) => setFilterModule(v === "__all" ? "" : v)} options={moduleOptions}
            ariaLabel={isAr ? "الوحدة" : "Module"} dir={isAr ? "rtl" : "ltr"} className="h-11 rounded-2xl bg-card sm:w-48" />
          <NiceSelect value={filterAction || "__all"} onChange={(v) => setFilterAction(v === "__all" ? "" : v)} options={actionOptions}
            ariaLabel={isAr ? "الإجراء" : "Action"} dir={isAr ? "rtl" : "ltr"} className="h-11 rounded-2xl bg-card sm:w-48" />
          <NiceSelect value={String(perPage)} onChange={(v) => setPerPage(Number(v))}
            options={PER_PAGE_OPTIONS.map((n) => ({ value: String(n), label: `${n} ${isAr ? "لكل صفحة" : "per page"}` }))}
            ariaLabel={isAr ? "عدد السجلات" : "Per page"} dir={isAr ? "rtl" : "ltr"} className="h-11 rounded-2xl bg-card sm:w-40" />
          <Button onClick={reload} variant="secondary" className="h-11 rounded-2xl px-5 font-bold shrink-0" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="ms-2">{isAr ? "تحديث" : "Refresh"}</span>
          </Button>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-400">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span className="font-bold">{error}</span>
          </div>
        )}

        {/* Table */}
        <Card className="overflow-hidden rounded-3xl border border-border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground border-b border-border/60">
                <tr>
                  <th className="px-4 py-3.5 text-start">{isAr ? "الوقت" : "Time"}</th>
                  <th className="px-4 py-3.5 text-start">{isAr ? "المستخدم" : "User"}</th>
                  <th className="px-4 py-3.5 text-start">{isAr ? "الدور" : "Role"}</th>
                  <th className="px-4 py-3.5 text-start">{isAr ? "الإجراء" : "Action"}</th>
                  <th className="px-4 py-3.5 text-start">{isAr ? "الوحدة" : "Module"}</th>
                  <th className="px-4 py-3.5 text-start">{isAr ? "الكيان #" : "Entity #"}</th>
                  <th className="px-4 py-3.5 text-start">{isAr ? "الملخص" : "Summary"}</th>
                  <th className="px-4 py-3.5 text-start"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 bg-card">
                {loading && (
                  <tr><td colSpan={8} className="p-12 text-center text-muted-foreground"><Loader2 className="me-2 inline h-5 w-5 animate-spin text-secondary" />{isAr ? "جارٍ تحميل سجل النشاط…" : "Loading activity log…"}</td></tr>
                )}
                {!loading && filtered.length === 0 && !error && (
                  <tr><td colSpan={8} className="p-12 text-center"><div className="mx-auto flex flex-col items-center gap-2 text-muted-foreground"><FileEdit className="h-8 w-8 opacity-40" /><p className="font-bold text-sm">{isAr ? "لا يوجد نشاط مطابق" : "No matching activity"}</p></div></td></tr>
                )}
                {!loading && filtered.map((r) => {
                  const isExpanded = expandedId === r.id;
                  const modLabel = r.module ? moduleLabel(r.module, isAr) : "—";
                  const actLabel = actionLabel(r.action, isAr);
                  const href = entityHref(r.module || r.entity_type, r.entity_id);
                  const hasDetails = true; // connection info at least
                  return (
                    <Fragment key={r.id}>
                      <tr className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : r.id)}>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5"><Clock className="h-3 w-3 opacity-60 shrink-0" /><span title={new Date(r.created_at).toLocaleString()}>{fmtRelative(r.created_at, isAr)}</span></div>
                          <span className="mt-0.5 block font-mono text-[10px] opacity-60" dir="ltr">{new Date(r.created_at).toLocaleString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-extrabold text-primary text-xs block">{r.actor_name || "—"}</span>
                          {r.actor_email && <span className="text-[10px] text-muted-foreground block">{r.actor_email}</span>}
                        </td>
                        <td className="px-4 py-3">
                          {r.actor_role ? (
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-black border ${roleBadgeCls(r.actor_role)}`}>{r.actor_role}</span>
                          ) : <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-black border ${actionBadgeCls(r.action)}`}>{actionIcon(r.action)}{actLabel}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 rounded-lg bg-muted/60 border border-border/60 px-2.5 py-1 text-[11px] font-bold text-muted-foreground"><Layers className="h-3 w-3" />{modLabel}</span>
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-muted-foreground">
                          {r.entity_id ? (
                            href ? (
                              <Link to={href} onClick={(e) => e.stopPropagation()} className="rounded border border-secondary/40 bg-secondary/10 px-1.5 py-0.5 font-bold text-primary hover:bg-secondary/25">#{r.entity_id}</Link>
                            ) : (
                              <span className="rounded border border-border/40 bg-muted/40 px-1.5 py-0.5">#{r.entity_id}</span>
                            )
                          ) : "—"}
                        </td>
                        <td className="min-w-[240px] max-w-[420px] px-4 py-3 text-xs font-medium text-foreground/80">
                          <span className="line-clamp-2" title={r.summary || ""}>{r.summary || "—"}</span>
                        </td>
                        <td className="px-4 py-3 text-end">
                          {hasDetails && (
                            <button type="button" onClick={(e) => { e.stopPropagation(); setExpandedId(isExpanded ? null : r.id); }} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors" title={isAr ? "عرض التفاصيل" : "View details"}>
                              {isExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          )}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-muted/20 border-b border-border/40">
                          <td colSpan={8} className="px-6 py-4">
                            {(() => {
                              const oldV = r.old_values || {};
                              const newV = (r.new_values && r.new_values !== r.metadata ? r.new_values : null) || {};
                              const keys = Array.from(new Set([...Object.keys(oldV), ...Object.keys(newV)]));
                              const meta = r.metadata && r.metadata !== r.new_values ? r.metadata : r.metadata && !r.old_values && !keys.length ? r.metadata : null;
                              const metaKeys = meta ? Object.keys(meta) : [];
                              return (
                                <div className="grid gap-4 text-xs lg:grid-cols-[minmax(0,1fr)_260px]">
                                  <div className="space-y-3">
                                    {r.summary && <p className="text-sm font-bold leading-6 text-foreground">{r.summary}</p>}
                                    {keys.length > 0 && (
                                      <div className="overflow-hidden rounded-xl border border-border bg-card">
                                        <table className="w-full text-xs">
                                          <thead className="bg-muted/50 text-[10.5px] font-black text-muted-foreground">
                                            <tr>
                                              <th className="px-3 py-2 text-start">{isAr ? "الحقل" : "Field"}</th>
                                              <th className="px-3 py-2 text-start text-rose-700">{isAr ? "قبل" : "Before"}</th>
                                              <th className="px-3 py-2 text-start text-emerald-700">{isAr ? "بعد" : "After"}</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-border/60 font-mono">
                                            {keys.map((k) => {
                                              const changed = showValue(oldV[k]) !== showValue(newV[k]);
                                              return (
                                                <tr key={k} className={changed ? "" : "opacity-60"}>
                                                  <td className="px-3 py-1.5 font-bold text-muted-foreground" dir="ltr">{k}</td>
                                                  <td className="max-w-[280px] break-all px-3 py-1.5 text-rose-700/90">{k in oldV ? showValue(oldV[k]) : "—"}</td>
                                                  <td className="max-w-[280px] break-all px-3 py-1.5 text-emerald-700">{k in newV ? showValue(newV[k]) : "—"}</td>
                                                </tr>
                                              );
                                            })}
                                          </tbody>
                                        </table>
                                      </div>
                                    )}
                                    {metaKeys.length > 0 && (
                                      <div className="rounded-xl border border-border bg-card p-3">
                                        <p className="mb-1.5 text-[10.5px] font-black text-muted-foreground">{isAr ? "تفاصيل إضافية" : "Details"}</p>
                                        <div className="grid gap-1 font-mono sm:grid-cols-2">
                                          {metaKeys.map((k) => (
                                            <div key={k} className="flex gap-2"><span className="shrink-0 text-muted-foreground" dir="ltr">{k}:</span><span className="break-all text-foreground">{showValue(meta?.[k])}</span></div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {!keys.length && !metaKeys.length && !r.summary && (
                                      <p className="text-muted-foreground">{isAr ? "السجل ده مفيهوش تفاصيل إضافية." : "No further details."}</p>
                                    )}
                                  </div>
                                  <div className="space-y-1.5 rounded-xl border border-border bg-card p-3">
                                    <p className="text-[10.5px] font-black text-muted-foreground">{isAr ? "معلومات الاتصال" : "Connection"}</p>
                                    <div className="flex items-center gap-2 text-muted-foreground"><Clock className="h-3.5 w-3.5 shrink-0" /><span dir="ltr" className="font-mono">{new Date(r.created_at).toLocaleString("en-GB")}</span></div>
                                    {r.ip && <div className="flex items-center gap-2 text-muted-foreground"><Globe className="h-3.5 w-3.5 shrink-0" /><span dir="ltr" className="font-mono">{r.ip}</span></div>}
                                    {r.user_agent && <div className="flex items-start gap-2 text-muted-foreground"><Monitor className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span className="line-clamp-3 break-all">{r.user_agent}</span></div>}
                                    {href && <Link to={href} className="inline-flex items-center gap-1 pt-1 font-bold text-primary underline">{isAr ? `افتح ${modLabel} #${r.entity_id}` : `Open ${modLabel} #${r.entity_id}`}</Link>}
                                  </div>
                                </div>
                              );
                            })()}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!loading && totalCount > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border/60 bg-muted/20 px-5 py-3.5">
              <p className="text-xs text-muted-foreground font-bold">
                {isAr ? `عرض ${filtered.length} من ${totalCount} سجل — صفحة ${page} من ${lastPage}` : `Showing ${filtered.length} of ${totalCount} records — Page ${page} of ${lastPage}`}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-8 rounded-xl px-3 font-bold" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || loading}>
                  {isAr ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </Button>
                {Array.from({ length: Math.min(5, lastPage) }, (_, i) => {
                  const pg = lastPage <= 5 ? i + 1 : page <= 3 ? i + 1 : page + i - 2;
                  if (pg < 1 || pg > lastPage) return null;
                  return <Button key={pg} variant={pg === page ? "default" : "outline"} size="sm" className="h-8 w-8 rounded-xl p-0 font-bold text-xs" onClick={() => setPage(pg)} disabled={loading}>{pg}</Button>;
                })}
                <Button variant="outline" size="sm" className="h-8 rounded-xl px-3 font-bold" onClick={() => setPage((p) => Math.min(lastPage, p + 1))} disabled={page >= lastPage || loading}>
                  {isAr ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
};

const AdminActivityLog = () => (
  <RequireAuth roles={["admin"]}>
    <Inner />
  </RequireAuth>
);
export default AdminActivityLog;
