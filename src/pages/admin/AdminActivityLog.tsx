import { useCallback, useEffect, useMemo, useState } from "react";
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
  if (r.includes("editor") || r.includes("content")) return "bg-accent/15 text-accent-foreground border-accent/20";
  if (r.includes("delegate") || r.includes("field")) return "bg-secondary/15 text-secondary-foreground border-secondary/20";
  return "bg-muted/70 text-muted-foreground border-border";
}

const MODULE_LABELS: Record<string, { ar: string; en: string }> = {
  Program: { ar: "برنامج", en: "Program" },
  Project: { ar: "مشروع", en: "Project" },
  User: { ar: "مستخدم", en: "User" },
  Case: { ar: "حالة", en: "Case" },
  Donation: { ar: "تبرع", en: "Donation" },
  Campaign: { ar: "حملة", en: "Campaign" },
  Blog: { ar: "مقال", en: "Blog" },
  Settings: { ar: "إعدادات", en: "Settings" },
};

const ACTION_LABELS: Record<string, { ar: string; en: string }> = {
  create: { ar: "إضافة", en: "Create" },
  update: { ar: "تعديل", en: "Update" },
  delete: { ar: "حذف", en: "Delete" },
  login: { ar: "تسجيل دخول", en: "Login" },
  logout: { ar: "تسجيل خروج", en: "Logout" },
};

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
const MODULES = ["", "Program", "Project", "User", "Case", "Donation", "Campaign", "Blog", "Settings"];
const ACTIONS = ["", "create", "update", "delete", "login"];

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

      setRows(items.map((item) => mapItem(item, isAr)));
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
  const createCount = rows.filter((r) => r.action.toLowerCase() === "create").length;
  const deleteCount = rows.filter((r) => r.action.toLowerCase() === "delete").length;

  return (
    <AdminLayout title={{ ar: "سجل النشاط والتدقيق", en: "Audit Activity Log" }}>
      <div dir={isAr ? "rtl" : "ltr"} className="space-y-6">
        {/* KPI */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {[
            { icon: <Activity className="h-5 w-5 text-secondary" />, bg: "bg-secondary/15", label: { ar: "إجمالي السجلات", en: "Total Records" }, val: totalCount.toLocaleString() },
            { icon: <PlusCircle className="h-5 w-5 text-emerald-600" />, bg: "bg-emerald-500/15", label: { ar: "إضافات", en: "Creates" }, val: createCount },
            { icon: <Trash2 className="h-5 w-5 text-rose-600" />, bg: "bg-rose-500/15", label: { ar: "حذفيات", en: "Deletions" }, val: deleteCount },
            { icon: <Users className="h-5 w-5 text-primary" />, bg: "bg-primary/15", label: { ar: "مستخدمون نشطون", en: "Active Users" }, val: uniqueUsers },
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
          <select value={filterModule} onChange={(e) => setFilterModule(e.target.value)} className="h-11 rounded-2xl border border-border bg-card px-4 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-secondary/50">
            <option value="">{isAr ? "كل الوحدات" : "All Modules"}</option>
            {MODULES.filter(Boolean).map((m) => <option key={m} value={m}>{isAr ? MODULE_LABELS[m]?.ar || m : m}</option>)}
          </select>
          <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)} className="h-11 rounded-2xl border border-border bg-card px-4 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-secondary/50">
            <option value="">{isAr ? "كل الإجراءات" : "All Actions"}</option>
            {ACTIONS.filter(Boolean).map((a) => <option key={a} value={a}>{isAr ? ACTION_LABELS[a]?.ar || a : a}</option>)}
          </select>
          <select value={perPage} onChange={(e) => setPerPage(Number(e.target.value))} className="h-11 rounded-2xl border border-border bg-card px-4 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-secondary/50">
            {PER_PAGE_OPTIONS.map((n) => <option key={n} value={n}>{n} {isAr ? "لكل صفحة" : "per page"}</option>)}
          </select>
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
                  const modLabel = r.module ? (isAr ? MODULE_LABELS[r.module]?.ar || r.module : r.module) : "—";
                  const actLabel = ACTION_LABELS[r.action.toLowerCase()] ? (isAr ? ACTION_LABELS[r.action.toLowerCase()].ar : ACTION_LABELS[r.action.toLowerCase()].en) : r.action;
                  const hasDetails = (r.new_values && Object.keys(r.new_values).length > 0) || (r.old_values && Object.keys(r.old_values).length > 0);
                  return (
                    <>
                      <tr key={r.id} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : r.id)}>
                        <td className="px-4 py-3 text-xs text-muted-foreground font-mono whitespace-nowrap" dir="ltr">
                          <div className="flex items-center gap-1.5"><Clock className="h-3 w-3 opacity-60 shrink-0" /><span title={new Date(r.created_at).toLocaleString()}>{fmtRelative(r.created_at, isAr)}</span></div>
                          <span className="block text-[10px] opacity-60 mt-0.5">{new Date(r.created_at).toLocaleDateString("ar-EG")}</span>
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
                          {r.entity_id ? <span className="rounded bg-muted/40 px-1.5 py-0.5 border border-border/40">#{r.entity_id}</span> : "—"}
                        </td>
                        <td className="px-4 py-3 text-xs font-medium text-muted-foreground max-w-[200px]">
                          <span className="line-clamp-2">{r.summary || "—"}</span>
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
                        <tr key={`${r.id}-detail`} className="bg-muted/20 border-b border-border/40">
                          <td colSpan={8} className="px-6 py-4">
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 text-xs">
                              <div className="space-y-1.5">
                                <p className="font-black text-[11px] uppercase tracking-wider text-muted-foreground">{isAr ? "معلومات الاتصال" : "Connection Info"}</p>
                                {r.ip && <div className="flex items-center gap-2 text-muted-foreground"><Globe className="h-3.5 w-3.5 shrink-0" /><span dir="ltr" className="font-mono">{r.ip}</span></div>}
                                {r.user_agent && <div className="flex items-start gap-2 text-muted-foreground"><Monitor className="h-3.5 w-3.5 shrink-0 mt-0.5" /><span className="line-clamp-2 break-all">{r.user_agent}</span></div>}
                                {!r.ip && !r.user_agent && <span className="text-muted-foreground/50">{isAr ? "لا توجد معلومات" : "No info"}</span>}
                              </div>
                              {r.new_values && Object.keys(r.new_values).length > 0 && (
                                <div className="space-y-1.5">
                                  <p className="font-black text-[11px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400">{isAr ? "القيم الجديدة" : "New Values"}</p>
                                  <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-3 space-y-1 font-mono">
                                    {Object.entries(r.new_values).slice(0, 8).map(([k, v]) => (
                                      <div key={k} className="flex gap-2"><span className="text-emerald-600/70 shrink-0">{k}:</span><span className="text-foreground break-all">{typeof v === "object" ? JSON.stringify(v) : String(v ?? "—")}</span></div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {r.old_values && Object.keys(r.old_values).length > 0 && (
                                <div className="space-y-1.5">
                                  <p className="font-black text-[11px] uppercase tracking-wider text-rose-600 dark:text-rose-400">{isAr ? "القيم القديمة" : "Old Values"}</p>
                                  <div className="rounded-xl bg-rose-500/5 border border-rose-500/20 p-3 space-y-1 font-mono">
                                    {Object.entries(r.old_values).slice(0, 8).map(([k, v]) => (
                                      <div key={k} className="flex gap-2"><span className="text-rose-600/70 shrink-0">{k}:</span><span className="text-foreground break-all">{typeof v === "object" ? JSON.stringify(v) : String(v ?? "—")}</span></div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
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
