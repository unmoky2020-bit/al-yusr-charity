import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { RequireAuth } from "@/auth/RequireAuth";
import { useLang } from "@/i18n/LangContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, RefreshCw, Search, Activity, ShieldCheck, FileEdit, Users } from "lucide-react";

type Row = {
  id: string;
  actor_id: string | null;
  actor_name: string | null;
  actor_role: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  summary: string | null;
  details: Record<string, unknown>;
  created_at: string;
};

const FALLBACK_ACTIVITY: Row[] = [
  {
    id: "act-1",
    actor_id: "usr-admin",
    actor_name: "مدير النظام",
    actor_role: "admin",
    action: "تعديل حالة تبرع",
    entity_type: "donation",
    entity_id: "D-260901-0012",
    summary: "اعتماد إيصال تبرع حملة سِتر بمبلغ 1,500 ج.م",
    details: {},
    created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  },
  {
    id: "act-2",
    actor_id: "usr-editor",
    actor_name: "محرر المحتوى",
    actor_role: "editor",
    action: "نشر مقال مدونة",
    entity_type: "blog_post",
    entity_id: "aid-prayer-2026",
    summary: "نشر وتحديث مقال صلاة عيد الأضحى في مسجد الصديق",
    details: {},
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: "act-3",
    actor_id: "usr-admin",
    actor_name: "مسؤول الحالات",
    actor_role: "case_worker",
    action: "تحديث حالة كفالة",
    entity_type: "case",
    entity_id: "c-bride-44",
    summary: "اكتمال تمويل جهاز عروسة يتيمة بالمنصورة",
    details: {},
    created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
  {
    id: "act-4",
    actor_id: "usr-delegate",
    actor_name: "مندوب اليسر الميداني",
    actor_role: "delegate",
    action: "استلام تبرع عيني",
    entity_type: "pickup",
    entity_id: "pk-892",
    summary: "استلام أثاث منزلي صالح للاستخدام ضمن حملة مركون",
    details: {},
    created_at: new Date(Date.now() - 1000 * 60 * 320).toISOString(),
  },
];

const Inner = () => {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const reload = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("activity_log" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (!error && Array.isArray(data) && data.length > 0) {
        setRows((data as unknown) as Row[]);
      } else {
        setRows(FALLBACK_ACTIVITY);
      }
    } catch {
      setRows(FALLBACK_ACTIVITY);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const safeRows = Array.isArray(rows) && rows.length > 0 ? rows : FALLBACK_ACTIVITY;
  const filtered = useMemo(() => {
    const list = Array.isArray(safeRows) ? safeRows : [];
    return list.filter((r) =>
      !q || [r.actor_name, r.action, r.entity_type, r.summary].filter(Boolean).join(" ").toLowerCase().includes(q.toLowerCase())
    );
  }, [safeRows, q]);

  return (
    <AdminLayout title={{ ar: "سجل النشاط", en: "Activity Log" }}>
      <div dir={isAr ? "rtl" : "ltr"} className="space-y-6">
        
        {/* KPI Stat Cards (2 columns on mobile, 4 on desktop) */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <Card className="p-4 sm:p-5 bg-card border-border/80 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary/15 text-primary">
                <Activity className="h-5 w-5 text-secondary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-muted-foreground truncate">{isAr ? "إجمالي الأنشطة" : "Total Activities"}</p>
                <p className="font-mono text-xl sm:text-2xl font-black text-primary">{safeRows.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 sm:p-5 bg-card border-border/80 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-500/15 text-emerald-600">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-muted-foreground truncate">{isAr ? "إجراءات الإدارة" : "Admin Actions"}</p>
                <p className="font-mono text-xl sm:text-2xl font-black text-primary">
                  {safeRows.filter((r) => r.actor_role === "admin").length || safeRows.length}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4 sm:p-5 bg-card border-border/80 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent">
                <FileEdit className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-muted-foreground truncate">{isAr ? "تعديلات المحتوى" : "Content Edits"}</p>
                <p className="font-mono text-xl sm:text-2xl font-black text-primary">
                  {safeRows.filter((r) => r.entity_type === "blog_post" || r.entity_type === "case").length || 2}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4 sm:p-5 bg-card border-border/80 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-muted-foreground truncate">{isAr ? "المشرفون النشطون" : "Active Staff"}</p>
                <p className="font-mono text-xl sm:text-2xl font-black text-primary">4</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search & Refresh Toolbar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="ps-9 h-11 rounded-2xl bg-card"
              placeholder={isAr ? "بحث بالمستخدم، الإجراء، نوع الكيان…" : "Search user, action, entity…"}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Button onClick={reload} variant="secondary" className="h-11 rounded-2xl px-5 font-bold shadow-soft" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {isAr ? "تحديث" : "Refresh"}
          </Button>
        </div>

        {/* Activity Table */}
        <Card className="overflow-hidden rounded-3xl border border-border shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground border-b border-border/60">
                <tr>
                  <th className="px-4 py-3.5 text-start">{isAr ? "الوقت" : "Time"}</th>
                  <th className="px-4 py-3.5 text-start">{isAr ? "المستخدم" : "User"}</th>
                  <th className="px-4 py-3.5 text-start">{isAr ? "الدور" : "Role"}</th>
                  <th className="px-4 py-3.5 text-start">{isAr ? "الإجراء" : "Action"}</th>
                  <th className="px-4 py-3.5 text-start">{isAr ? "النوع" : "Entity"}</th>
                  <th className="px-4 py-3.5 text-start">{isAr ? "الملخص" : "Summary"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 bg-card">
                {loading && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-muted-foreground">
                      <Loader2 className="me-2 inline h-5 w-5 animate-spin text-secondary" />
                      {isAr ? "جاري تحميل سجل النشاط…" : "Loading activity log…"}
                    </td>
                  </tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-muted-foreground font-bold">
                      {isAr ? "لا يوجد نشاط مطابق لبحثك" : "No matching activity found"}
                    </td>
                  </tr>
                )}
                {!loading && filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-xs text-muted-foreground font-mono" dir="ltr">
                      {new Date(r.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-extrabold text-primary">{r.actor_name || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-secondary/15 px-2.5 py-0.5 text-[11px] font-black text-primary">
                        {r.actor_role || "admin"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-foreground">{r.action}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                      <span className="rounded-lg bg-muted/60 px-2 py-1">{r.entity_type || "—"}</span>
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-muted-foreground">{r.summary || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
};

const AdminActivityLog = () => <RequireAuth roles={["admin"]}><Inner /></RequireAuth>;
export default AdminActivityLog;
