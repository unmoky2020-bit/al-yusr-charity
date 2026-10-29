import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, MapPin, Clock4, CheckCircle2, XCircle, Hourglass, Award, Trash2, ExternalLink, UserCheck, StickyNote } from "lucide-react";
import { AdminLayout, StatCard } from "@/components/admin/AdminLayout";
import { useLang } from "@/i18n/LangContext";
import { useAuth } from "@/auth/AuthContext";
import { RequireAuth } from "@/auth/RequireAuth";
import { toast } from "@/hooks/use-toast";
import { volunteerApplicationsApi, type VolunteerApplication } from "@/data/api/volunteerApplicationsApi";
import { apiErrorMessage, isEndpointMissing, FEATURE_PENDING_MSG } from "@/data/api/adminApiHelpers";
import { publicUrls } from "@/lib/publicUrls";

type Joined = VolunteerApplication;

const STATUS_META: Record<string, { ar: string; en: string; cls: string; icon: typeof Clock4 }> = {
  pending:  { ar: "قيد المراجعة", en: "Pending",  cls: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300", icon: Hourglass },
  approved: { ar: "مقبولة",       en: "Approved", cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300", icon: CheckCircle2 },
  rejected: { ar: "مرفوضة",       en: "Rejected", cls: "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300", icon: XCircle },
  attended: { ar: "تم الحضور",    en: "Attended", cls: "bg-primary/15 text-primary", icon: Award },
  cancelled:{ ar: "ملغاة",        en: "Cancelled", cls: "bg-muted text-muted-foreground", icon: XCircle },
};

const Inner = () => {
  const { lang } = useLang();
  const { user } = useAuth();
  const [apps, setApps] = useState<Joined[]>([]);
  const [tab, setTab] = useState<"all" | "pending" | "approved" | "rejected" | "attended">("all");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    setLoadError(null);
    try {
      setApps(await volunteerApplicationsApi.listMine());
    } catch (e) {
      setApps([]);
      setLoadError(isEndpointMissing(e) ? FEATURE_PENDING_MSG : apiErrorMessage(e, "تعذر تحميل المهام"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user?.id]);

  const stats = useMemo(() => ({
    total: apps.length,
    pending: apps.filter((a) => a.status === "pending").length,
    approved: apps.filter((a) => a.status === "approved").length,
    attended: apps.filter((a) => a.status === "attended").length,
  }), [apps]);

  const filtered = useMemo(() => apps.filter((a) => tab === "all" || a.status === tab), [apps, tab]);

  const cancel = async (id: string) => {
    if (!confirm(lang === "ar" ? "تأكيد إلغاء طلب المشاركة؟" : "Cancel this participation request?")) return;
    try {
      await volunteerApplicationsApi.cancel(id);
    } catch (e) {
      toast({ title: lang === "ar" ? "فشل إلغاء الطلب" : "Cancel failed", description: apiErrorMessage(e), variant: "destructive" });
      return;
    }
    toast({ title: lang === "ar" ? "تم إلغاء الطلب" : "Request cancelled" });
    void load();
  };

  const TABS: { id: typeof tab; ar: string; en: string }[] = [
    { id: "all", ar: "الكل", en: "All" },
    { id: "pending", ar: "قيد المراجعة", en: "Pending" },
    { id: "approved", ar: "مقبولة", en: "Approved" },
    { id: "attended", ar: "تم الحضور", en: "Attended" },
    { id: "rejected", ar: "مرفوضة", en: "Rejected" },
  ];

  return (
    <AdminLayout title={{ ar: "مهامي", en: "My Tasks" }}>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard accent label={lang === "ar" ? "إجمالي المهام" : "Total"} value={stats.total} />
        <StatCard label={lang === "ar" ? "قيد المراجعة" : "Pending"} value={stats.pending} />
        <StatCard label={lang === "ar" ? "مقبولة" : "Approved"} value={stats.approved} />
        <StatCard label={lang === "ar" ? "تم الحضور" : "Attended"} value={stats.attended} />
      </div>

      <div className="mt-5 flex flex-wrap gap-1.5 rounded-2xl bg-card p-2 shadow-soft">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-extrabold transition ${
              tab === t.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-secondary/30"
            }`}>
            {t[lang]}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {loading && <div className="rounded-2xl bg-card p-8 text-center text-sm text-muted-foreground shadow-soft">…</div>}
        {!loading && loadError && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-center text-sm font-bold text-destructive">
            {loadError}
          </div>
        )}
        {!loading && !loadError && filtered.length === 0 && (
          <div className="rounded-2xl bg-card p-8 text-center shadow-soft">
            <p className="text-sm text-muted-foreground">
              {lang === "ar" ? "لا توجد مهام في هذا التبويب." : "No tasks in this tab."}
            </p>
            <Link to="/campaigns" className="mt-3 inline-block rounded-full bg-orange-grad px-4 py-2 text-xs font-extrabold text-accent-foreground shadow-cta">
              {lang === "ar" ? "تصفح الحملات المتاحة" : "Browse open campaigns"}
            </Link>
          </div>
        )}
        {!loading && filtered.map((a) => {
          const s = STATUS_META[a.status] ?? STATUS_META.pending;
          const Icon = s.icon;
          const c = a.campaign;
          return (
            <article key={a.id} className="rounded-2xl bg-card p-4 shadow-soft md:p-5">
              <header className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold ${s.cls}`}>
                      <Icon className="h-3 w-3" /> {s[lang]}
                    </span>
                    {a.assigned_role && (
                      <span className="rounded-full bg-secondary/20 px-2 py-0.5 text-[10px] font-extrabold text-primary">
                        {a.assigned_role}
                      </span>
                    )}
                    {a.shift && (
                      <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-extrabold text-accent">
                        {a.shift}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-1.5 text-base font-extrabold text-primary md:text-lg">
                    {c ? (lang === "ar" ? c.title_ar : c.title_en) : (lang === "ar" ? "حملة محذوفة" : "Removed campaign")}
                  </h3>
                  {c && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {lang === "ar" ? c.description_ar : c.description_en}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                    {c && (
                      <>
                        <span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {c.event_date} {c.event_time || ""}</span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {c.location} — {c.governorate}</span>
                        <span>•</span>
                      </>
                    )}
                    <span dir="ltr">{a.created_at ? new Date(a.created_at).toLocaleDateString() : ""}</span>
                  </div>

                  {/* Required docs hint */}
                  {(a.skills?.length || (c?.required_skills?.length ?? 0) > 0) && (
                    <div className="mt-3 rounded-xl bg-muted/40 p-2.5">
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                        {lang === "ar" ? "المهارات / المتطلبات" : "Skills / Requirements"}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {(c?.required_skills ?? []).map((s) => (
                          <span key={`r-${s}`} className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent">{s}</span>
                        ))}
                        {(a.skills ?? []).map((s) => (
                          <span key={`m-${s}`} className="rounded-full bg-secondary/20 px-2 py-0.5 text-[10px] font-bold text-primary">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {a.notes && (
                    <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5 dark:border-amber-500/30 dark:bg-amber-500/10">
                      <div className="mb-1 inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                        <StickyNote className="h-3 w-3" />{lang === "ar" ? "ملاحظات المنظّم" : "Organizer notes"}
                      </div>
                      <p className="text-[12px] leading-relaxed text-amber-900 dark:text-amber-100">{a.notes}</p>
                    </div>
                  )}

                  {(a.assigned_role || a.shift) && (
                    <div className="mt-2 grid gap-2 rounded-lg border border-primary/20 bg-primary/5 p-2.5 sm:grid-cols-2">
                      {a.assigned_role && (
                        <div className="flex items-center gap-2">
                          <span className="grid h-7 w-7 place-items-center rounded-full bg-primary/15 text-primary"><UserCheck className="h-3.5 w-3.5" /></span>
                          <div>
                            <div className="text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground">{lang === "ar" ? "دورك في الحملة" : "Your role"}</div>
                            <div className="text-[12px] font-extrabold text-primary">{a.assigned_role}</div>
                          </div>
                        </div>
                      )}
                      {a.shift && (
                        <div className="flex items-center gap-2">
                          <span className="grid h-7 w-7 place-items-center rounded-full bg-accent/15 text-accent"><Clock4 className="h-3.5 w-3.5" /></span>
                          <div>
                            <div className="text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground">{lang === "ar" ? "الوردية" : "Shift"}</div>
                            <div className="text-[12px] font-extrabold text-accent">{a.shift}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  {c && (
                    <Link to={publicUrls.volunteerCampaign(c.slug)} className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-extrabold text-primary-foreground hover:bg-primary/90">
                      <ExternalLink className="h-3 w-3" /> {lang === "ar" ? "تفاصيل" : "Details"}
                    </Link>
                  )}
                  {a.status === "pending" && (
                    <button onClick={() => cancel(a.id)} className="inline-flex items-center gap-1 rounded-full bg-rose-600 px-3 py-1.5 text-xs font-extrabold text-white hover:bg-rose-700">
                      <Trash2 className="h-3 w-3" /> {lang === "ar" ? "إلغاء" : "Cancel"}
                    </button>
                  )}
                </div>
              </header>
            </article>
          );
        })}
      </div>
    </AdminLayout>
  );
};

const AdminMyTasks = () => (
  <RequireAuth roles={["admin", "volunteer", "case_manager"]}>
    <Inner />
  </RequireAuth>
);

export default AdminMyTasks;