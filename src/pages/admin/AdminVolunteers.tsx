import { UiSelect } from "@/components/common/UiSelect";
import { useEffect, useMemo, useState } from "react";
import { Search, Check, X as XIcon, Eye, Briefcase, Megaphone, Send, RefreshCw } from "lucide-react";
import { AdminLayout, StatCard } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLang } from "@/i18n/LangContext";
import { useAuth, User } from "@/auth/AuthContext";
import { RequireAuth } from "@/auth/RequireAuth";
import { programs } from "@/data/programs";
import { toast } from "@/hooks/use-toast";
import { ALL_PERMISSIONS, PERMISSION_LABEL, inferPermissions, Permission } from "@/auth/permissions";
import { Campaign, listAllCampaigns, submitApplication } from "@/data/campaignsApi";
import type { LaravelVolunteer } from "@/data/laravelApi";
import { apiErrorMessage, fetchList } from "@/data/api/adminApiHelpers";

const StatusPill = ({ s, lang }: { s?: string; lang: "ar" | "en" }) => {
  const map: Record<string, { ar: string; en: string; cls: string }> = {
    approved: { ar: "معتمد", en: "Approved", cls: "bg-secondary/30 text-primary" },
    pending:  { ar: "قيد المراجعة", en: "Pending",  cls: "bg-accent/15 text-accent" },
    rejected: { ar: "مرفوض", en: "Rejected",      cls: "bg-destructive/10 text-destructive" },
    suspended:{ ar: "موقوف", en: "Suspended",     cls: "bg-muted text-muted-foreground" },
  };
  const v = map[s || "pending"];
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${v.cls}`}>{v[lang]}</span>;
};

const Inner = () => {
  const { lang } = useLang();
  const { users, setVolunteerStatus, setUserPermissions } = useAuth();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [selected, setSelected] = useState<User | null>(null);
  const [skillFilters, setSkillFilters] = useState<string[]>([]);
  const [cityFilter, setCityFilter] = useState<string>("");
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [inviteCampaign, setInviteCampaign] = useState<string>("");
  const [inviting, setInviting] = useState(false);
  const [laravelVolunteers, setLaravelVolunteers] = useState<LaravelVolunteer[]>([]);
  const [laravelLoading, setLaravelLoading] = useState(true);

  const [loadError, setLoadError] = useState<string | null>(null);
  const reloadVolunteers = () => {
    setLaravelLoading(true);
    setLoadError(null);
    // GET /volunteers (throws on failure — no silent empty list)
    fetchList<LaravelVolunteer>("/volunteers", { per_page: 500 })
      .then((data) => setLaravelVolunteers(data))
      .catch((e) => {
        setLaravelVolunteers([]);
        setLoadError(apiErrorMessage(e, "تعذر تحميل المتطوعين"));
      })
      .finally(() => setLaravelLoading(false));
  };

  // Load Laravel volunteers
  useEffect(() => { reloadVolunteers(); }, []);

  useEffect(() => { listAllCampaigns().then(setCampaigns).catch(() => setCampaigns([])); }, []);

  // Merge: Laravel volunteers take priority, AuthContext fills remaining
  const volunteers = useMemo(() => {
    if (laravelVolunteers.length > 0) {
      // Map Laravel volunteers into User-compatible shape
      return laravelVolunteers.map((v): User => {
        const extra = v as LaravelVolunteer & { program_slug?: string | null; permissions?: Permission[] | null };
        return {
          id: String(v.id),
          name: v.name || v.email || "",
          email: v.email,
          phone: v.phone || "",
          city: v.city || "",
          roles: ["volunteer"],
          volunteerStatus: (v.status as User["volunteerStatus"]) || "pending",
          skills: Array.isArray(v.skills) ? v.skills : (v.skills ? [v.skills] : []),
          bio: v.notes || "",
          createdAt: (v.created_at || "").slice(0, 10),
          assignedProgram: extra.program_slug || undefined,
          permissions: Array.isArray(extra.permissions) ? extra.permissions : undefined,
        };
      });
    }
    // Fallback to AuthContext
    return users.filter((u) => u.roles.includes("volunteer"));
  }, [laravelVolunteers, users]);
  const allSkills = useMemo(() => {
    const set = new Set<string>();
    volunteers.forEach((v) => (v.skills || []).forEach((s) => set.add(s)));
    return Array.from(set).sort();
  }, [volunteers]);
  const allCities = useMemo(() => Array.from(new Set(volunteers.map((v) => v.city).filter(Boolean) as string[])).sort(), [volunteers]);

  const filtered = useMemo(() => volunteers.filter((u) => {
    const m = !q || u.name.includes(q) || u.email.includes(q) || (u.city || "").includes(q);
    const f = filter === "all" || u.volunteerStatus === filter;
    const sk = skillFilters.length === 0 || skillFilters.every((s) => (u.skills || []).includes(s));
    const ct = !cityFilter || u.city === cityFilter;
    return m && f && sk && ct;
  }), [volunteers, q, filter, skillFilters, cityFilter]);

  const toggleSkill = (s: string) => setSkillFilters((p) => p.includes(s) ? p.filter((x) => x !== s) : [...p, s]);
  const togglePick = (id: string) => setPicked((p) => ({ ...p, [id]: !p[id] }));
  const allChecked = filtered.length > 0 && filtered.every((v) => picked[v.id]);
  const toggleAll = () => {
    const next = { ...picked };
    if (allChecked) filtered.forEach((v) => delete next[v.id]);
    else filtered.forEach((v) => (next[v.id] = true));
    setPicked(next);
  };
  const pickedIds = Object.keys(picked).filter((k) => picked[k]);

  const bulkInvite = async () => {
    if (!inviteCampaign) { toast({ title: lang === "ar" ? "اختر حملة أولًا" : "Pick a campaign", variant: "destructive" }); return; }
    const targets = volunteers.filter((v) => picked[v.id]);
    if (targets.length === 0) return;
    setInviting(true);
    let ok = 0, fail = 0;
    let lastErr: unknown = null;
    for (const v of targets) {
      try {
        await submitApplication({
          campaign_id: inviteCampaign,
          volunteer_id: null,
          full_name: v.name,
          phone: v.phone || "01000000000",
          email: v.email,
          city: v.city || null,
          skills: v.skills || [],
          notes: lang === "ar" ? "دعوة من فريق اليسر" : "Invited by Al-Yusr team",
          status: "pending",
        });
        ok++;
      } catch (e) { fail++; lastErr = e; }
    }
    setInviting(false);
    setPicked({});
    toast({
      title: lang === "ar" ? ` تم إنشاء ${ok} طلب${fail ? ` (فشل ${fail})` : ""}` : `📨 ${ok} invites created${fail ? ` (${fail} failed)` : ""}`,
      ...(fail ? { variant: "destructive" as const, description: apiErrorMessage(lastErr) } : {}),
    });
  };

  const action = async (id: string, status: "approved" | "rejected" | "suspended") => {
    try {
      // PUT /volunteers/{id} {status}
      await setVolunteerStatus(id, status);
      toast({ title: lang === "ar" ? (status === "approved" ? " تم اعتماد المتطوع" : status === "rejected" ? " تم رفض المتطوع" : "⏸ تم تعليق المتطوع") : (status === "approved" ? " Volunteer approved" : status === "rejected" ? " Volunteer rejected" : "⏸ Volunteer suspended"), });
    } catch (err: unknown) {
      toast({ title: lang === "ar" ? "فشل تحديث الحالة" : "Status update failed", description: apiErrorMessage(err), variant: "destructive" });
    }
    if (selected?.id === id) setSelected(null);
    // Refresh from API to get latest data
    reloadVolunteers();
  };

  const assign = async (id: string, slug: string) => {
    try {
      // PUT /volunteers/{id} {status: "approved", program_slug}
      await setVolunteerStatus(id, "approved", slug);
      setSelected((s) => (s && s.id === id ? { ...s, assignedProgram: slug, volunteerStatus: "approved" } : s));
      toast({ title: lang === "ar" ? " تم تعيين البرنامج" : " Program assigned" });
      reloadVolunteers();
    } catch (err: unknown) {
      toast({ title: lang === "ar" ? "فشل تعيين البرنامج" : "Assignment failed", description: apiErrorMessage(err), variant: "destructive" });
    }
  };

  const togglePerm = async (u: User, p: Permission) => {
    const current = u.permissions || inferPermissions(u.skills);
    const next = current.includes(p) ? current.filter((x) => x !== p) : [...current, p];
    try {
      // PUT /volunteers/{id} {permissions}
      await setUserPermissions(u.id, next);
      setSelected((s) => (s && s.id === u.id ? { ...s, permissions: next } : s));
      toast({ title: lang === "ar" ? " تم تحديث الصلاحيات" : " Permissions updated" });
      reloadVolunteers();
    } catch (err: unknown) {
      toast({ title: lang === "ar" ? "فشل تحديث الصلاحيات" : "Permissions update failed", description: apiErrorMessage(err), variant: "destructive" });
    }
  };

  return (
    <AdminLayout title={{ ar: "المتطوعون", en: "Volunteers" }}>
      <div className="space-y-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {laravelLoading ? (lang === "ar" ? "جاري تحميل بيانات المتطوعين..." : "Loading volunteers...") : (lang === "ar" ? `${volunteers.length} متطوع من لارافيل API` : `${volunteers.length} volunteers from Laravel API`)}
          </div>
          {loadError && <span className="text-xs font-bold text-destructive">{loadError}</span>}
          <Button variant="outline" size="sm" disabled={laravelLoading} onClick={reloadVolunteers}>
            <RefreshCw className={`h-3.5 w-3.5 ${laravelLoading ? "animate-spin" : ""}`} />
            {lang === "ar" ? "تحديث" : "Refresh"}
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard accent label={lang === "ar" ? "إجمالي المتطوعين" : "Total"} value={volunteers.length} />
          <StatCard label={lang === "ar" ? "قيد المراجعة" : "Pending"} value={volunteers.filter((v) => v.volunteerStatus === "pending").length} />
          <StatCard label={lang === "ar" ? "معتمدون" : "Approved"} value={volunteers.filter((v) => v.volunteerStatus === "approved").length} />
          <StatCard label={lang === "ar" ? "مرفوضون" : "Rejected"} value={volunteers.filter((v) => v.volunteerStatus === "rejected").length} />
        </div>

        <div className="flex flex-col gap-2 rounded-2xl bg-card p-3 shadow-soft sm:flex-row sm:items-center sm:flex-wrap">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="ps-9" placeholder={lang === "ar" ? "بحث بالاسم أو المدينة…" : "Search…"} value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { v: "all", ar: "الكل", en: "All" },
              { v: "pending", ar: "قيد المراجعة", en: "Pending" },
              { v: "approved", ar: "معتمدون", en: "Approved" },
              { v: "rejected", ar: "مرفوضون", en: "Rejected" },
            ].map((f) => (
              <button key={f.v} onClick={() => setFilter(f.v)}
                className={`rounded-lg px-3 py-1.5 text-xs font-extrabold transition ${filter === f.v ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}>
                {lang === "ar" ? f.ar : f.en}
              </button>
            ))}
          </div>
        </div>

        {/* Skills + city + bulk invite */}
        <div className="space-y-2 rounded-2xl bg-card p-3 shadow-soft">
          {allSkills.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-extrabold uppercase text-muted-foreground">{lang === "ar" ? "المهارات:" : "Skills:"}</span>
              {allSkills.map((s) => (
                <button key={s} onClick={() => toggleSkill(s)}
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold transition ${skillFilters.includes(s) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-secondary/30"}`}>
                  {s}
                </button>
              ))}
              {skillFilters.length > 0 && (
                <button onClick={() => setSkillFilters([])} className="text-[10px] font-bold text-accent hover:underline">{lang === "ar" ? "مسح" : "Clear"}</button>
              )}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <UiSelect value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-2 text-xs font-bold">
              <option value="">{lang === "ar" ? "كل المدن" : "All cities"}</option>
              {allCities.map((c) => <option key={c} value={c}>{c}</option>)}
            </UiSelect>
            <div className="ms-auto flex flex-wrap items-center gap-1.5">
              <Megaphone className="h-3.5 w-3.5 text-accent" />
              <UiSelect value={inviteCampaign} onChange={(e) => setInviteCampaign(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-2 text-xs font-bold">
                <option value="">{lang === "ar" ? "— اختر حملة —" : "— pick campaign —"}</option>
                {(Array.isArray(campaigns) ? campaigns : []).filter((c) => c && (c.status === "open" || c.status === "draft")).map((c) => (
                  <option key={c.id} value={c.id}>{lang === "ar" ? c.title_ar : c.title_en} ({c.event_date})</option>
                ))}
              </UiSelect>
              <Button onClick={bulkInvite} disabled={inviting || pickedIds.length === 0 || !inviteCampaign}
                className="h-9 bg-orange-grad text-xs font-extrabold text-accent-foreground">
                <Send className="me-1 h-3.5 w-3.5" />
                {lang === "ar" ? `دعوة (${pickedIds.length})` : `Invite (${pickedIds.length})`}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1fr_360px]">
          <div className="overflow-x-auto rounded-2xl bg-card shadow-soft">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2.5 text-start">
                    <input type="checkbox" checked={allChecked} onChange={toggleAll} className="h-4 w-4 accent-[hsl(var(--primary))]" aria-label="select all" />
                  </th>
                  {[lang === "ar" ? "الاسم" : "Name", lang === "ar" ? "الهاتف" : "Phone", lang === "ar" ? "المدينة" : "City",
                    lang === "ar" ? "المهارات" : "Skills", lang === "ar" ? "الحالة" : "Status", lang === "ar" ? "إجراء" : "Action"].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-start">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => (
                  <tr key={v.id} className={`cursor-pointer border-t border-border/60 hover:bg-muted/30 ${selected?.id === v.id ? "bg-secondary/10" : ""}`} onClick={() => setSelected(v)}>
                    <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={!!picked[v.id]} onChange={() => togglePick(v.id)} className="h-4 w-4 accent-[hsl(var(--primary))]" />
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="font-extrabold text-primary">{v.name}</div>
                      <div className="text-[11px] text-muted-foreground" dir="ltr">{v.email}</div>
                    </td>
                    <td className="px-3 py-2.5" dir="ltr">{v.phone || "—"}</td>
                    <td className="px-3 py-2.5">{v.city || "—"}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {(v.skills || []).slice(0, 2).map((s) => (
                          <span key={s} className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold">{s}</span>
                        ))}
                        {(v.skills?.length || 0) > 2 && <span className="text-[10px] text-muted-foreground">+{(v.skills?.length || 0) - 2}</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2.5"><StatusPill s={v.volunteerStatus} lang={lang} /></td>
                    <td className="px-3 py-2.5">
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        {v.volunteerStatus !== "approved" && (
                          <button onClick={() => action(v.id, "approved")} className="grid h-7 w-7 place-items-center rounded-md bg-secondary/30 text-primary hover:bg-secondary" aria-label="approve">
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {v.volunteerStatus !== "rejected" && (
                          <button onClick={() => action(v.id, "rejected")} className="grid h-7 w-7 place-items-center rounded-md bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground" aria-label="reject">
                            <XIcon className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button onClick={() => setSelected(v)} className="grid h-7 w-7 place-items-center rounded-md bg-muted text-muted-foreground hover:bg-secondary/30" aria-label="view">
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="p-8 text-center text-sm text-muted-foreground">{lang === "ar" ? "لا توجد نتائج" : "No results"}</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Detail panel */}
          <aside className="rounded-2xl bg-card p-4 shadow-soft">
            {selected ? (
              <div>
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-primary to-primary-glow text-xl font-black text-secondary">{selected.name.charAt(0)}</div>
                  <div className="min-w-0">
                    <h3 className="truncate font-black text-primary">{selected.name}</h3>
                    <StatusPill s={selected.volunteerStatus} lang={lang} />
                  </div>
                </div>
                <dl className="mt-4 space-y-2 text-xs">
                  <Field k={lang === "ar" ? "البريد" : "Email"} v={selected.email} dir="ltr" />
                  <Field k={lang === "ar" ? "الهاتف" : "Phone"} v={selected.phone || "—"} dir="ltr" />
                  <Field k={lang === "ar" ? "المدينة" : "City"} v={selected.city || "—"} />
                  <Field k={lang === "ar" ? "تاريخ التسجيل" : "Joined"} v={selected.createdAt} />
                  {selected.bio && <div className="rounded-lg bg-muted/40 p-2.5"><div className="text-[10px] font-bold text-muted-foreground">{lang === "ar" ? "النبذة" : "Bio"}</div><div className="mt-1">{selected.bio}</div></div>}
                  <div>
                    <div className="text-[10px] font-bold text-muted-foreground">{lang === "ar" ? "المهارات" : "Skills"}</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {(selected.skills || []).map((s) => <span key={s} className="rounded-full bg-secondary/20 px-2 py-0.5 text-[10px] font-bold text-primary">{s}</span>)}
                    </div>
                  </div>
                </dl>
                <div className="mt-4">
                  <div className="mb-1 text-[10px] font-bold uppercase text-muted-foreground">{lang === "ar" ? "تعيين برنامج" : "Assign program"}</div>
                  <UiSelect value={selected.assignedProgram || ""} onChange={(e) => assign(selected.id, e.target.value)}
                    className="h-10 w-full rounded-md border border-border bg-background px-2 text-xs font-bold">
                    <option value="">{lang === "ar" ? "— اختر —" : "— pick —"}</option>
                    {programs.map((p) => <option key={p.slug} value={p.slug}>{p[lang].name}</option>)}
                  </UiSelect>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button onClick={() => action(selected.id, "approved")} className="bg-secondary text-secondary-foreground"><Check className="h-4 w-4" />{lang === "ar" ? "اعتماد" : "Approve"}</Button>
                  <Button onClick={() => action(selected.id, "rejected")} variant="outline" className="text-destructive"><XIcon className="h-4 w-4" />{lang === "ar" ? "رفض" : "Reject"}</Button>
                </div>
                {/* Permissions */}
                <div className="mt-5">
                  <div className="mb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                    {lang === "ar" ? "الصلاحيات (RBAC)" : "Permissions (RBAC)"}
                  </div>
                  <div className="rounded-xl bg-muted/30 p-2.5">
                    {ALL_PERMISSIONS.map((p) => {
                      const current = selected.permissions || inferPermissions(selected.skills);
                      const on = current.includes(p);
                      return (
                        <label key={p} className="flex cursor-pointer items-center justify-between gap-2 border-b border-border/40 py-1.5 last:border-b-0">
                          <span className="text-[11px] font-bold">{PERMISSION_LABEL[p][lang]}</span>
                          <input
                            type="checkbox"
                            checked={on}
                            onChange={() => togglePerm(selected, p)}
                            className="h-4 w-4 accent-[hsl(var(--secondary))]"
                          />
                        </label>
                      );
                    })}
                    {!selected.permissions && (
                      <p className="mt-1.5 text-[10px] text-muted-foreground">
                        {lang === "ar" ? "افتراضية مستنبطة من المهارات — عدّل لتجاوزها" : "Inferred from skills — edit to override"}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid h-full min-h-[200px] place-items-center text-center text-muted-foreground">
                <div>
                  <Briefcase className="mx-auto h-10 w-10 opacity-40" />
                  <p className="mt-2 text-sm font-bold">{lang === "ar" ? "اختر متطوعًا لعرض التفاصيل" : "Select a volunteer"}</p>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </AdminLayout>
  );
};

const Field = ({ k, v, dir }: { k: string; v: string; dir?: "ltr" | "rtl" }) => (
  <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-1.5">
    <span className="text-muted-foreground">{k}</span>
    <span className="font-extrabold text-foreground" dir={dir}>{v}</span>
  </div>
);

const AdminVolunteers = () => (
  <RequireAuth roles={["admin", "editor"]}>
    <Inner />
  </RequireAuth>
);

export default AdminVolunteers;