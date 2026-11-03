import { UiSelect } from "@/components/common/UiSelect";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Plus, Megaphone, Users2, MapPin, CalendarDays, Trash2, Pencil, Search, X, CheckCircle2, XCircle, Clock, Phone, Mail } from "lucide-react";
import { AdminLayout, StatCard } from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RequireAuth } from "@/auth/RequireAuth";
import { useLang } from "@/i18n/LangContext";
import { toast } from "@/hooks/use-toast";
import {
  Campaign, Application, ApplicationStatus, CampaignStatus,
  listAllCampaigns, upsertCampaign, deleteCampaign, listApplications,
  setApplicationStatus, deleteApplication, slugify,
} from "@/data/campaignsApi";

const STATUS_LABEL: Record<CampaignStatus, { ar: string; en: string; cls: string }> = {
  draft:     { ar: "مسودة",  en: "Draft",     cls: "bg-muted text-muted-foreground" },
  open:      { ar: "مفتوحة", en: "Open",      cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" },
  closed:    { ar: "مغلقة",  en: "Closed",    cls: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
  completed: { ar: "مكتملة", en: "Completed", cls: "bg-primary/15 text-primary" },
  cancelled: { ar: "ملغاة",  en: "Cancelled", cls: "bg-destructive/15 text-destructive" },
};

const APP_STATUS: Record<ApplicationStatus, { ar: string; en: string; cls: string }> = {
  pending:   { ar: "قيد المراجعة", en: "Pending",  cls: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
  approved:  { ar: "مقبول",        en: "Approved", cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" },
  rejected:  { ar: "مرفوض",        en: "Rejected", cls: "bg-destructive/15 text-destructive" },
  waitlist:  { ar: "قائمة انتظار", en: "Waitlist", cls: "bg-secondary/30 text-primary" },
  attended:  { ar: "حضر",          en: "Attended", cls: "bg-primary/15 text-primary" },
  noshow:    { ar: "لم يحضر",      en: "No-show",  cls: "bg-muted text-muted-foreground" },
  withdrawn: { ar: "انسحب",        en: "Withdrawn", cls: "bg-muted text-muted-foreground" },
  invited:   { ar: "مدعو",         en: "Invited",   cls: "bg-secondary/20 text-primary" },
};

const emptyForm = (): Partial<Campaign> => ({
  title_ar: "", title_en: "", description_ar: "", description_en: "",
  event_date: new Date().toISOString().slice(0, 10),
  event_time: "", location: "", governorate: "الدقهلية", city: "",
  slots_needed: 50, required_skills: [], status: "draft",
});

const Inner = () => {
  const { lang } = useLang();
  const [searchParams, setSearchParams] = useSearchParams();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Partial<Campaign> | null>(null);
  const [skillsText, setSkillsText] = useState("");
  const [appsFor, setAppsFor] = useState<Campaign | null>(null);
  const [apps, setApps] = useState<Application[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setCampaigns(await listAllCampaigns()); }
    catch (e: any) { toast({ title: e.message, variant: "destructive" }); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  // Auto-open the "new campaign" dialog when navigating with ?new=1
  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setEditing(emptyForm());
      setSkillsText("");
      const next = new URLSearchParams(searchParams);
      next.delete("new");
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadApps = async (c: Campaign) => {
    setAppsFor(c); setAppsLoading(true);
    try { setApps(await listApplications(c.id)); }
    catch (e: any) { toast({ title: e.message, variant: "destructive" }); }
    setAppsLoading(false);
  };

  const safeCampaigns = Array.isArray(campaigns) ? campaigns : [];

  const filtered = useMemo(
    () => safeCampaigns.filter((c) => !q || (c.title_ar || "").includes(q) || (c.title_en || "").toLowerCase().includes(q.toLowerCase()) || (c.location || "").includes(q)),
    [safeCampaigns, q]
  );

  const stats = useMemo(() => ({
    total: safeCampaigns.length,
    open: safeCampaigns.filter((c) => c && c.status === "open").length,
    needed: safeCampaigns.reduce((s, c: any) => s + (c?.status === "open" ? Math.max(0, Number(c.slots_needed || c.capacity || 0) - Number(c.slots_filled || c.accepted_count || 0)) : 0), 0),
    filled: safeCampaigns.reduce((s, c: any) => s + Number(c?.slots_filled || c?.accepted_count || 0), 0),
  }), [safeCampaigns]);

  const startNew = () => { setEditing(emptyForm()); setSkillsText(""); };
  const startEdit = (c: Campaign) => { setEditing(c); setSkillsText((c.required_skills || []).join(", ")); };

  const save = async () => {
    if (!editing) return;
    if (!editing.title_ar || !editing.title_en || !editing.event_date) {
      toast({ title: lang === "ar" ? "العنوان والتاريخ مطلوبان" : "Title & date required", variant: "destructive" });
      return;
    }
    const payload: any = {
      ...editing,
      slug: editing.slug || slugify(editing.title_en || editing.title_ar || "campaign"),
      required_skills: skillsText.split(",").map((s) => s.trim()).filter(Boolean),
      slots_needed: Number(editing.slots_needed || 0),
    };
    try {
      await upsertCampaign(payload);
      toast({ title: lang === "ar" ? " تم الحفظ" : " Saved" });
      setEditing(null);
      load();
    } catch (e: any) { toast({ title: e.message, variant: "destructive" }); }
  };

  const remove = async (id: string) => {
    if (!confirm(lang === "ar" ? "حذف الحملة؟" : "Delete campaign?")) return;
    try { await deleteCampaign(id); load(); toast({ title: lang === "ar" ? " محذوفة" : " Deleted" }); }
    catch (e: any) { toast({ title: e.message, variant: "destructive" }); }
  };

  const updateApp = async (a: Application, status: ApplicationStatus) => {
    try {
      await setApplicationStatus(a.id, status);
      if (appsFor) await loadApps(appsFor);
      load();
    } catch (e: any) { toast({ title: e.message, variant: "destructive" }); }
  };
  const removeApp = async (id: string) => {
    if (!confirm("Delete?")) return;
    try { await deleteApplication(id); if (appsFor) await loadApps(appsFor); load(); } catch (e: any) { toast({ title: e.message, variant: "destructive" }); }
  };

  return (
    <AdminLayout title={{ ar: "حملات التطوع", en: "Volunteer Campaigns" }}>
      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-secondary/10 p-4">
          <div className="flex items-start gap-3">
            <Megaphone className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
            <div>
              <h2 className="text-sm font-extrabold text-primary">
                {lang === "ar" ? "إدارة حملات تجنيد المتطوعين" : "Volunteer recruitment campaigns"}
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {lang === "ar"
                  ? "هذه الشاشة مستقلة تمامًا عن البرامج والمشاريع — تُستخدم فقط لإنشاء فعاليات ميدانية واستقبال طلبات التطوع وإدارة المقاعد والمراجعة."
                  : "This screen is fully independent from programs and projects — it's only for creating field events, collecting volunteer applications, managing slots and review."}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard accent label={lang === "ar" ? "إجمالي الحملات" : "Total"} value={stats.total} />
          <StatCard label={lang === "ar" ? "مفتوحة الآن" : "Open now"} value={stats.open} />
          <StatCard label={lang === "ar" ? "مقاعد متبقية" : "Slots remaining"} value={stats.needed} />
          <StatCard label={lang === "ar" ? "متطوعون مؤكدون" : "Confirmed volunteers"} value={stats.filled} />
        </div>

        <div className="rounded-2xl bg-card p-3 shadow-soft">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="ps-9" placeholder={lang === "ar" ? "بحث…" : "Search…"} value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <Button asChild className="bg-orange-grad font-extrabold text-accent-foreground">
              <Link to="/admin/campaigns/new">
                <Plus className="me-1 h-4 w-4" /> {lang === "ar" ? "حملة جديدة" : "New campaign"}
              </Link>
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="grid place-items-center py-10 text-muted-foreground">…</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl bg-card p-10 text-center shadow-soft">
            <Megaphone className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              {lang === "ar" ? "لا توجد حملات بعد. أنشئ أول حملة لجذب المتطوعين." : "No campaigns yet."}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((c) => {
              const remaining = Math.max(0, c.slots_needed - c.slots_filled);
              const pct = c.slots_needed ? Math.min(100, Math.round((c.slots_filled / c.slots_needed) * 100)) : 0;
              const st = STATUS_LABEL[c.status];
              return (
                <div key={c.id} className="flex flex-col rounded-2xl bg-card p-4 shadow-soft">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-extrabold text-primary">{lang === "ar" ? c.title_ar : c.title_en}</h3>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-extrabold ${st.cls}`}>{st[lang]}</span>
                  </div>
                  <div className="mt-2 grid gap-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> {c.event_date} {c.event_time && `• ${c.event_time}`}</div>
                    <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {c.location || c.city || c.governorate}</div>
                    <div className="flex items-center gap-1.5"><Users2 className="h-3.5 w-3.5" /> {c.slots_filled}/{c.slots_needed} {lang === "ar" ? "متطوع" : "volunteers"}</div>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-gradient-to-r from-primary to-primary-glow" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">{remaining} {lang === "ar" ? "مقعد متبقٍ" : "slots remaining"}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <button onClick={() => loadApps(c)} className="rounded-lg bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground hover:opacity-90">
                      {lang === "ar" ? "الطلبات" : "Applications"}
                    </button>
                    <Link to={`/admin/campaigns/${c.id}`} className="rounded-lg bg-secondary/15 px-2.5 py-1 text-xs font-extrabold text-primary hover:bg-secondary/30 flex items-center gap-1">
                      <Pencil className="h-3 w-3" />
                      <span>{lang === "ar" ? "تفاصيل وتعديل" : "Details & Edit"}</span>
                    </Link>
                    <button onClick={() => remove(c.id)} className="rounded-lg bg-destructive/10 px-2.5 py-1 text-xs font-bold text-destructive hover:bg-destructive/20">
                      <Trash2 className="me-1 inline h-3 w-3" /> {lang === "ar" ? "حذف" : "Delete"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit dialog */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" onClick={() => setEditing(null)}>
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-card p-5 shadow-2xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-primary">{editing.id ? (lang === "ar" ? "تعديل حملة" : "Edit campaign") : (lang === "ar" ? "حملة جديدة" : "New campaign")}</h3>
              <button onClick={() => setEditing(null)} className="rounded-md p-1 text-muted-foreground hover:bg-muted"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label={lang === "ar" ? "العنوان (عربي)" : "Title (AR)"} v={editing.title_ar || ""} onChange={(v) => setEditing({ ...editing, title_ar: v })} />
              <Field label={lang === "ar" ? "العنوان (إنجليزي)" : "Title (EN)"} v={editing.title_en || ""} onChange={(v) => setEditing({ ...editing, title_en: v })} />
              <Field label={lang === "ar" ? "تاريخ الحدث" : "Event date"} type="date" v={editing.event_date || ""} onChange={(v) => setEditing({ ...editing, event_date: v })} />
              <Field label={lang === "ar" ? "الوقت" : "Time"} v={editing.event_time || ""} onChange={(v) => setEditing({ ...editing, event_time: v })} placeholder="06:00" />
              <Field label={lang === "ar" ? "المحافظة" : "Governorate"} v={editing.governorate || ""} onChange={(v) => setEditing({ ...editing, governorate: v })} />
              <Field label={lang === "ar" ? "المدينة" : "City"} v={editing.city || ""} onChange={(v) => setEditing({ ...editing, city: v })} />
              <div className="sm:col-span-2">
                <Field label={lang === "ar" ? "المكان (وصف تفصيلي)" : "Location"} v={editing.location || ""} onChange={(v) => setEditing({ ...editing, location: v })} />
              </div>
              <Field label={lang === "ar" ? "عدد المتطوعين المطلوب" : "Slots needed"} type="number" v={String(editing.slots_needed ?? 0)} onChange={(v) => setEditing({ ...editing, slots_needed: Number(v) })} />
              <div>
                <label className="text-[11px] font-bold uppercase text-muted-foreground">{lang === "ar" ? "الحالة" : "Status"}</label>
                <UiSelect
                  className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={editing.status || "draft"}
                  onChange={(e) => setEditing({ ...editing, status: e.target.value as CampaignStatus })}
                >
                  {(Object.keys(STATUS_LABEL) as CampaignStatus[]).map((s) => (
                    <option key={s} value={s}>{STATUS_LABEL[s][lang]}</option>
                  ))}
                </UiSelect>
              </div>
              <div className="sm:col-span-2">
                <Field label={lang === "ar" ? "المهارات المطلوبة (مفصولة بفاصلة)" : "Required skills (comma separated)"} v={skillsText} onChange={setSkillsText} placeholder="logistics, first-aid, driving" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold uppercase text-muted-foreground">{lang === "ar" ? "الوصف (عربي)" : "Description (AR)"}</label>
                <textarea className="mt-1 min-h-[80px] w-full rounded-md border border-input bg-background p-3 text-sm" value={editing.description_ar || ""} onChange={(e) => setEditing({ ...editing, description_ar: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold uppercase text-muted-foreground">{lang === "ar" ? "الوصف (إنجليزي)" : "Description (EN)"}</label>
                <textarea className="mt-1 min-h-[80px] w-full rounded-md border border-input bg-background p-3 text-sm" value={editing.description_en || ""} onChange={(e) => setEditing({ ...editing, description_en: e.target.value })} />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditing(null)}>{lang === "ar" ? "إلغاء" : "Cancel"}</Button>
              <Button onClick={save} className="bg-orange-grad font-extrabold text-accent-foreground">{lang === "ar" ? "حفظ" : "Save"}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Applications drawer */}
      {appsFor && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" onClick={() => setAppsFor(null)}>
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-card p-5 shadow-2xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-primary">{lang === "ar" ? "طلبات الحملة" : "Applications"}</h3>
                <p className="text-xs text-muted-foreground">{lang === "ar" ? appsFor.title_ar : appsFor.title_en} · {appsFor.slots_filled}/{appsFor.slots_needed}</p>
              </div>
              <button onClick={() => setAppsFor(null)} className="rounded-md p-1 text-muted-foreground hover:bg-muted"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-4 space-y-2">
              {appsLoading ? <div className="py-6 text-center text-sm text-muted-foreground">…</div> :
                apps.length === 0 ? <div className="rounded-xl bg-muted/30 p-6 text-center text-sm text-muted-foreground">{lang === "ar" ? "لا توجد طلبات بعد" : "No applications yet"}</div> :
                apps.map((a) => {
                  const st = APP_STATUS[a.status];
                  return (
                    <div key={a.id} className="rounded-xl bg-muted/30 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-primary">{a.full_name}</span>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${st.cls}`}>{st[lang]}</span>
                          </div>
                          <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> <span dir="ltr">{a.phone}</span></span>
                            {a.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> <span dir="ltr">{a.email}</span></span>}
                            {a.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {a.city}</span>}
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(a.created_at).toLocaleDateString()}</span>
                          </div>
                          {a.skills && a.skills.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {a.skills.map((s) => <span key={s} className="rounded-full bg-secondary/30 px-2 py-0.5 text-[10px] font-bold text-primary">{s}</span>)}
                            </div>
                          )}
                          {a.notes && <p className="mt-1 text-xs text-muted-foreground">{a.notes}</p>}
                      {(a.status === "approved" || a.status === "attended") && (
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-extrabold uppercase text-muted-foreground">{lang === "ar" ? "الدور:" : "Role:"}</span>
                          <Input
                            className="h-7 w-32 text-[11px]"
                            defaultValue={a.assigned_role || ""}
                            placeholder={lang === "ar" ? "تنظيم" : "logistics"}
                            onBlur={async (e) => {
                              const v = e.target.value.trim();
                              if (v === (a.assigned_role || "")) return;
                              try { await setApplicationStatus(a.id, a.status, { assigned_role: v, shift: a.shift || undefined }); if (appsFor) await loadApps(appsFor); } catch {}
                            }}
                          />
                          <span className="text-[10px] font-extrabold uppercase text-muted-foreground">{lang === "ar" ? "المناوبة:" : "Shift:"}</span>
                          <UiSelect
                            className="h-7 rounded-md border border-input bg-background px-1 text-[11px] font-bold"
                            defaultValue={a.shift || ""}
                            onChange={async (e) => {
                              const v = e.target.value;
                              try { await setApplicationStatus(a.id, a.status, { assigned_role: a.assigned_role || undefined, shift: v }); if (appsFor) await loadApps(appsFor); } catch {}
                            }}
                          >
                            <option value="">—</option>
                            <option value="morning">{lang === "ar" ? "صباحي" : "Morning"}</option>
                            <option value="noon">{lang === "ar" ? "ظهر" : "Noon"}</option>
                            <option value="evening">{lang === "ar" ? "مسائي" : "Evening"}</option>
                            <option value="night">{lang === "ar" ? "ليلي" : "Night"}</option>
                          </UiSelect>
                        </div>
                      )}
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <button onClick={() => updateApp(a, "approved")} className="rounded-md bg-emerald-500/15 px-2 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-500/25">
                          <CheckCircle2 className="me-1 inline h-3 w-3" />{lang === "ar" ? "قبول" : "Approve"}
                        </button>
                        <button onClick={() => updateApp(a, "rejected")} className="rounded-md bg-destructive/15 px-2 py-1 text-[11px] font-bold text-destructive hover:bg-destructive/25">
                          <XCircle className="me-1 inline h-3 w-3" />{lang === "ar" ? "رفض" : "Reject"}
                        </button>
                        <button onClick={() => updateApp(a, "waitlist")} className="rounded-md bg-secondary/30 px-2 py-1 text-[11px] font-bold text-primary hover:bg-secondary/50">
                          {lang === "ar" ? "انتظار" : "Waitlist"}
                        </button>
                        <button onClick={() => updateApp(a, "attended")} className="rounded-md bg-primary/15 px-2 py-1 text-[11px] font-bold text-primary hover:bg-primary/25">
                          {lang === "ar" ? "حضر" : "Attended"}
                        </button>
                        <button onClick={() => removeApp(a.id)} className="ms-auto rounded-md bg-muted px-2 py-1 text-[11px] font-bold text-muted-foreground hover:bg-destructive hover:text-destructive-foreground">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

const Field = ({ label, v, onChange, type = "text", placeholder }: { label: string; v: string; onChange: (v: string) => void; type?: string; placeholder?: string }) => (
  <div>
    <label className="text-[11px] font-bold uppercase text-muted-foreground">{label}</label>
    <Input className="mt-1 h-10" type={type} value={v} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
  </div>
);

const AdminCampaigns = () => (
  <RequireAuth roles={["admin", "caseworker", "editor"]}><Inner /></RequireAuth>
);

export default AdminCampaigns;
