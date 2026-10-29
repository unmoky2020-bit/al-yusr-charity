import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, Loader2, Save, Trash2, Users, MapPin, Calendar, CheckCircle2, XCircle, Search, Bell, Download, MessageSquare, UserCheck, Clock4, Send, FileText, X, Upload, Image as ImageIcon } from "lucide-react";
import { AdminLayout, StatCard } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLang } from "@/i18n/LangContext";
import { toast } from "@/hooks/use-toast";
import {
  getCampaignById, listApplications, setCampaignStatus, deleteCampaign,
  upsertCampaign, setApplicationStatus,
  type Campaign as BaseCampaign, type Application as BaseApplication, type CampaignStatus as BaseCampaignStatus,
} from "@/data/campaignsApi";
import { adminNotificationsApi } from "@/data/api/adminNotificationsApi";
import { apiErrorMessage } from "@/data/api/adminApiHelpers";

// Laravel volunteer-campaign / application statuses used by this screen.
type CampaignStatus = BaseCampaignStatus | "cancelled";
type ApplicationStatus = "pending" | "approved" | "rejected" | "attended" | "noshow";
type Campaign = Omit<BaseCampaign, "status"> & { status: CampaignStatus };
type Application = Omit<BaseApplication, "status"> & { status: ApplicationStatus };
import { logActivity } from "@/lib/activityLog";
import { uploadImage } from "@/data/laravelApi";
import { publicUrls } from "@/lib/publicUrls";

const CAMPAIGN_STATUSES: { v: CampaignStatus; ar: string; en: string; tone: string }[] = [
  { v: "draft",     ar: "مسودة",   en: "Draft",     tone: "bg-muted text-muted-foreground" },
  { v: "open",      ar: "مفتوحة",  en: "Open",      tone: "bg-primary/15 text-primary" },
  { v: "closed",    ar: "مغلقة",   en: "Closed",    tone: "bg-accent/15 text-accent" },
  { v: "completed", ar: "مكتملة",  en: "Completed", tone: "bg-secondary/20 text-primary" },
  { v: "cancelled", ar: "ملغاة",   en: "Cancelled", tone: "bg-destructive/15 text-destructive" },
];

const APP_STATUSES: { v: ApplicationStatus; ar: string; en: string; tone: string }[] = [
  { v: "pending",  ar: "بانتظار",  en: "Pending",  tone: "bg-accent/15 text-accent" },
  { v: "approved", ar: "مقبول",    en: "Approved", tone: "bg-primary/15 text-primary" },
  { v: "rejected", ar: "مرفوض",    en: "Rejected", tone: "bg-destructive/15 text-destructive" },
  { v: "attended", ar: "حضر",      en: "Attended", tone: "bg-secondary/20 text-primary" },
  { v: "noshow",  ar: "لم يحضر",  en: "No-show",  tone: "bg-muted text-muted-foreground" },
];

export default function AdminCampaignDetail() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();

  const [row, setRow] = useState<Campaign | null>(null);
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"all" | ApplicationStatus>("all");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editRole, setEditRole] = useState("");
  const [editShift, setEditShift] = useState("");
  const [broadcast, setBroadcast] = useState("");
  const [busy, setBusy] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState<Application | null>(null);
  const [notifyText, setNotifyText] = useState("");
  const [uploading, setUploading] = useState(false);
  const imgInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title_ar: "", title_en: "", description_ar: "", description_en: "",
    location: "", governorate: "الدقهلية", city: "",
    event_date: "", event_time: "",
    slots_needed: 0, cover_image_url: "", required_skills: "",
  });

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setUploading(true);
    const localUrl = URL.createObjectURL(file);
    setForm((f) => ({ ...f, cover_image_url: localUrl }));
    try {
      const serverPath = await uploadImage(file, "campaigns");
      setForm((f) => ({ ...f, cover_image_url: serverPath }));
      toast({ title: isAr ? "تم رفع الصورة بنجاح" : "Image uploaded" });
    } catch {
      toast({ title: isAr ? "تعذر رفع الصورة" : "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const reload = async () => {
    if (!id) return;
    if (id === "new") {
      setRow({
        id: "new",
        status: "draft",
        slots_filled: 0,
        slots_needed: 10,
        governorate: "الدقهلية",
        created_at: new Date().toISOString(),
      } as any);
      setApps([]);
      setForm({
        title_ar: "", title_en: "", description_ar: "", description_en: "",
        location: "", governorate: "الدقهلية", city: "",
        event_date: new Date().toISOString().slice(0, 10), event_time: "09:00",
        slots_needed: 10, cover_image_url: "", required_skills: "",
      });
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const r = await getCampaignById(id);
      if (!r) { toast({ title: isAr ? "غير موجود" : "Not found", variant: "destructive" }); nav("/admin/campaigns"); return; }
      setRow(r as Campaign);
      try {
        const appsList = await listApplications(id);
        setApps((Array.isArray(appsList) ? appsList : []) as unknown as Application[]);
      } catch (e) {
        setApps([]);
        toast({ title: isAr ? "تعذر تحميل طلبات التطوع" : "Could not load applications", description: apiErrorMessage(e), variant: "destructive" });
      }
      setForm({
        title_ar: r.title_ar || "", title_en: r.title_en || "",
        description_ar: r.description_ar || "", description_en: r.description_en || "",
        location: r.location || "", governorate: r.governorate || "الدقهلية", city: r.city || "",
        event_date: r.event_date || "", event_time: r.event_time || "",
        slots_needed: r.slots_needed || 0,
        cover_image_url: r.cover_image_url || "",
        required_skills: (r.required_skills || []).join(", "),
      });
    } catch (e) { toast({ title: isAr ? "تعذر تحميل الحملة" : "Could not load campaign", description: apiErrorMessage(e), variant: "destructive" }); }
    finally { setLoading(false); }
  };
  useEffect(() => { void reload(); /* eslint-disable-next-line */ }, [id]);

  const safeApps = Array.isArray(apps) ? apps : [];
  const counts = useMemo(() => ({
    total: safeApps.length,
    approved: safeApps.filter(a => a.status === "approved").length,
    pending: safeApps.filter(a => a.status === "pending").length,
    attended: safeApps.filter(a => a.status === "attended").length,
  }), [safeApps]);

  const save = async () => {
    if (!form.title_ar.trim()) {
      toast({ title: isAr ? "يرجى كتابة عنوان الحملة" : "Please enter title", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        title_ar: form.title_ar, title_en: form.title_en || form.title_ar,
        description_ar: form.description_ar, description_en: form.description_en,
        location: form.location, governorate: form.governorate, city: form.city || null,
        event_date: form.event_date, event_time: form.event_time || null,
        slots_needed: Number(form.slots_needed) || 0,
        cover_image_url: form.cover_image_url || null,
        required_skills: form.required_skills.split(/[,،]/).map(s => s.trim()).filter(Boolean),
      };
      if (id !== "new" && row?.id) {
        payload.id = row.id;
      }
      const savedId = await upsertCampaign(payload);
      toast({ title: isAr ? "تم الحفظ" : "Saved" });
      if (id === "new" && savedId) {
        nav(`/admin/campaigns/${savedId}`);
      } else {
        void reload();
      }
    } catch (e) { toast({ title: isAr ? "فشل حفظ الحملة" : "Save failed", description: apiErrorMessage(e), variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const changeStatus = async (next: CampaignStatus) => {
    if (!row) return;
    try { await setCampaignStatus(row.id, next); toast({ title: isAr ? "تم التحديث" : "Updated" }); void reload(); }
    catch (e) { toast({ title: apiErrorMessage(e), variant: "destructive" }); }
  };

  const remove = async () => {
    if (!row) return;
    if (!confirm(isAr ? "حذف الحملة؟" : "Delete campaign?")) return;
    try { await deleteCampaign(row.id); toast({ title: isAr ? "تم الحذف" : "Deleted" }); nav("/admin/campaigns"); }
    catch (e) { toast({ title: apiErrorMessage(e), variant: "destructive" }); }
  };

  const setAppStatus = async (a: Application, next: ApplicationStatus) => {
    try {
      await setApplicationStatus(a.id, next);
      toast({ title: isAr ? "تم التحديث" : "Updated" });
      void logActivity({ action: "application.status_change", entityType: "application", entityId: a.id,
        summary: `${a.full_name}: ${a.status} → ${next}`, details: { campaign_id: row?.id } });
      void reload();
    }
    catch (e) { toast({ title: apiErrorMessage(e), variant: "destructive" }); }
  };

  const saveAssignment = async (a: Application) => {
    try {
      await setApplicationStatus(a.id, a.status, { assigned_role: editRole || undefined, shift: editShift || undefined });
      toast({ title: isAr ? " تم حفظ التعيين" : " Assignment saved" });
      void logActivity({ action: "application.assignment", entityType: "application", entityId: a.id,
        summary: `${a.full_name} → role:${editRole || "-"} shift:${editShift || "-"}` });
      setEditing(null); void reload();
    } catch (e) { toast({ title: apiErrorMessage(e), variant: "destructive" }); }
  };

  const openNotify = (a: Application) => {
    if (!a.volunteer_id) {
      toast({ title: isAr ? "هذا المتطوع لم يُسجّل حساب — لا يمكن إرسال إشعار داخلي" : "Volunteer has no account", variant: "destructive" });
      return;
    }
    setNotifyText("");
    setNotifyOpen(a);
  };

  const sendNotify = async () => {
    const a = notifyOpen;
    if (!a || !a.volunteer_id || !notifyText.trim()) return;
    try {
      await adminNotificationsApi.send({
        user_ids: [a.volunteer_id], type: "info",
        title_ar: `حملة: ${row?.title_ar ?? ""}`,
        title_en: `Campaign: ${row?.title_en ?? ""}`,
        message_ar: notifyText, message_en: notifyText,
        link: "/admin/my-tasks", entity_type: "application", entity_id: a.id,
      });
    } catch (e) {
      toast({ title: isAr ? "فشل إرسال الإشعار" : "Notification failed", description: apiErrorMessage(e), variant: "destructive" });
      return;
    }
    toast({ title: isAr ? "تم إرسال الإشعار" : "Notification sent" });
    setNotifyOpen(null); setNotifyText("");
  };

  // قوالب رسائل جاهزة للمدير
  const tpl = (a?: Application | null) => {
    const name = a?.full_name?.split(" ")[0] ?? (isAr ? "متطوعنا الكريم" : "volunteer");
    const date = row?.event_date ?? "";
    const time = row?.event_time ?? "";
    const loc  = `${row?.location ?? ""}${row?.city ? ` — ${row.city}` : ""}`;
    const role = a?.assigned_role ? `\nالدور: ${a.assigned_role}` : "";
    const shift = a?.shift ? `\nالوردية: ${a.shift}` : "";
    return [
      { id: "approve", label: isAr ? "تأكيد القبول" : "Approval confirmation",
        text: isAr
          ? `أهلًا ${name} 👋\nتم قبول طلبك للمشاركة في حملة "${row?.title_ar ?? ""}".\nالموعد: ${date} ${time}\nالمكان: ${loc}${role}${shift}\nنرجو تأكيد الحضور بالرد أو من خلال صفحة "مهامي".`
          : `Hi ${name}, you're approved for "${row?.title_en ?? ""}". Date: ${date} ${time}. Location: ${loc}.` },
      { id: "remind", label: isAr ? "تذكير بالموعد" : "Time reminder",
        text: isAr
          ? `تذكير ودّي 🕐\nالموعد بكرة ${date} الساعة ${time} — المكان: ${loc}.\nيُرجى الحضور قبل الموعد بـ 15 دقيقة.${role}${shift}`
          : `Reminder: tomorrow ${date} at ${time}. Please arrive 15 min early. Location: ${loc}.` },
      { id: "dress", label: isAr ? "تعليمات الزي" : "Dress code",
        text: isAr
          ? `تعليمات الزي 👕\n• تيشيرت المؤسسة (يُسلَّم في المكان عند الحضور).\n• بنطلون مريح + حذاء مغلق.\n• إحضار بطاقة شخصية + زجاجة ماء.\nشكرًا لانضمامك معنا!`
          : `Dress code: Foundation t-shirt (provided on arrival), comfortable pants & closed shoes. Bring ID & water bottle.` },
      { id: "thanks", label: isAr ? "شكر بعد الحضور" : "Thank you note",
        text: isAr
          ? `شكرًا لك ${name} 🌿\nبارك الله فيك لمساهمتك في حملة "${row?.title_ar ?? ""}". وجودك صنع فرقًا حقيقيًا — نراك في حملات قادمة بإذن الله.`
          : `Thank you ${name} for joining "${row?.title_en ?? ""}" — your effort made a real difference.` },
      { id: "cancel", label: isAr ? "اعتذار/تأجيل" : "Postponement",
        text: isAr
          ? `إخطار هام 📢\nاضطررنا لتأجيل/إلغاء الحملة المقررة بتاريخ ${date}. سيتم إبلاغكم بالموعد البديل قريبًا.\nنعتذر عن أي إزعاج، وشكرًا لتفهمكم.`
          : `Important: the campaign on ${date} has been postponed. We'll share the new date soon.` },
    ];
  };

  const broadcastApproved = async () => {
    if (!broadcast.trim()) return;
    const targets = safeApps.filter(a => a.volunteer_id && (a.status === "approved" || a.status === "attended"));
    if (targets.length === 0) { toast({ title: isAr ? "لا يوجد متطوعون مقبولون مسجّلون" : "No registered approved volunteers" }); return; }
    setBusy(true);
    try {
      await adminNotificationsApi.send({
        user_ids: targets.map(a => a.volunteer_id!), type: "info",
        title_ar: `📣 ${row?.title_ar ?? ""}`, title_en: `📣 ${row?.title_en ?? ""}`,
        message_ar: broadcast, message_en: broadcast,
        link: "/admin/my-tasks", entity_type: "volunteer_campaign", entity_id: row?.id ?? null,
      });
    } catch (e) {
      toast({ title: isAr ? "فشل إرسال الإشعارات" : "Broadcast failed", description: apiErrorMessage(e), variant: "destructive" });
      return;
    } finally {
      setBusy(false);
    }
    setBroadcast("");
    toast({ title: isAr ? `تم الإرسال إلى ${targets.length} متطوع` : `Sent to ${targets.length} volunteers` });
  };

  const bulk = async (next: ApplicationStatus) => {
    const targets = filtered.filter(a => a.status === "pending");
    if (targets.length === 0) return;
    if (!confirm(isAr ? `تطبيق "${APP_STATUSES.find(s=>s.v===next)?.ar}" على ${targets.length} طلب؟` : `Apply to ${targets.length}?`)) return;
    setBusy(true);
    let failed = 0;
    let lastErr: unknown = null;
    for (const a of targets) { try { await setApplicationStatus(a.id, next); } catch (e) { failed++; lastErr = e; } }
    setBusy(false);
    if (failed) {
      toast({ title: isAr ? `فشل تحديث ${failed} من ${targets.length} طلب` : `${failed} of ${targets.length} failed`, description: apiErrorMessage(lastErr), variant: "destructive" });
    } else {
      toast({ title: isAr ? "تم" : "Done" });
    }
    void reload();
  };

  const exportCsv = () => {
    const header = ["status","full_name","phone","email","city","assigned_role","shift","skills","notes","created_at"];
    const rows = safeApps.map(a => [
      a.status, a.full_name, a.phone, a.email ?? "", a.city ?? "",
      a.assigned_role ?? "", a.shift ?? "", (a.skills ?? []).join("|"),
      (a.notes ?? "").replace(/\n/g, " "), a.created_at,
    ]);
    const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = "\ufeff" + [header, ...rows].map(r => r.map(esc).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${row?.slug || "campaign"}-applications.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return safeApps.filter(a => (tab === "all" || a.status === tab) &&
      (!t || [a.full_name, a.phone, a.email, a.city, a.assigned_role, (a.skills||[]).join(" ")].join(" ").toLowerCase().includes(t)));
  }, [safeApps, tab, q]);

  if (loading || !row) {
    return <AdminLayout><div className="grid place-items-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div></AdminLayout>;
  }
  const st = CAMPAIGN_STATUSES.find(s => s.v === row.status) || CAMPAIGN_STATUSES[0];
  const pct = form.slots_needed > 0 ? Math.min(100, Math.round((row.slots_filled / form.slots_needed) * 100)) : 0;

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-card p-4 shadow-soft">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/admin/campaigns" className="grid h-8 w-8 place-items-center rounded-md bg-muted hover:bg-muted/80"><ArrowLeft className="h-4 w-4 rtl:rotate-180" /></Link>
            <div className="min-w-0">
              <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-extrabold ${st.tone}`}>{isAr ? st.ar : st.en}</span>
              <h1 className="truncate text-lg font-black text-primary">{isAr ? form.title_ar : (form.title_en || form.title_ar)}</h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={publicUrls.volunteerCampaign(row.slug)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md bg-secondary/20 px-3 py-1.5 text-xs font-extrabold text-primary hover:bg-secondary/30">
              <ExternalLink className="h-3.5 w-3.5" />{isAr ? "معاينة عامة" : "Public preview"}
            </a>
            <Button onClick={save} disabled={saving} className="bg-orange-grad text-accent-foreground">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{isAr ? "حفظ" : "Save"}
            </Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard accent label={isAr ? "أماكن مشغولة" : "Slots filled"} value={`${row.slots_filled} / ${form.slots_needed}`} sub={`${pct}%`} />
          <StatCard label={isAr ? "إجمالي الطلبات" : "Total applications"} value={counts.total} />
          <StatCard label={isAr ? "بانتظار" : "Pending"} value={counts.pending} />
          <StatCard label={isAr ? "حضروا" : "Attended"} value={counts.attended} />
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-card p-3 shadow-soft">
          <span className="text-xs font-bold text-muted-foreground">{isAr ? "الحالة:" : "Status:"}</span>
          {CAMPAIGN_STATUSES.map(s => (
            <button key={s.v} onClick={() => changeStatus(s.v)}
              className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition ${row.status === s.v ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}>
              {isAr ? s.ar : s.en}
            </button>
          ))}
          <div className="ms-auto">
            <button onClick={remove} className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-2.5 py-1 text-[11px] font-bold text-destructive hover:bg-destructive/20">
              <Trash2 className="h-3.5 w-3.5" />{isAr ? "حذف" : "Delete"}
            </button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <section className="rounded-2xl bg-card p-4 shadow-soft">
              <h2 className="mb-3 text-sm font-black text-primary">{isAr ? "تفاصيل الحملة" : "Campaign info"}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={isAr ? "العنوان (عربي)" : "Title (AR)"}><Input value={form.title_ar} onChange={(e) => setForm({...form, title_ar: e.target.value})} dir="rtl" /></Field>
                <Field label={isAr ? "العنوان (إنجليزي)" : "Title (EN)"}><Input value={form.title_en} onChange={(e) => setForm({...form, title_en: e.target.value})} dir="ltr" /></Field>
                <Field label={isAr ? "الوصف (عربي)" : "Description (AR)"}>
                  <textarea value={form.description_ar} onChange={(e) => setForm({...form, description_ar: e.target.value})} rows={4} dir="rtl"
                    className="w-full rounded-md border border-border bg-background p-2 text-sm" />
                </Field>
                <Field label={isAr ? "الوصف (إنجليزي)" : "Description (EN)"}>
                  <textarea value={form.description_en} onChange={(e) => setForm({...form, description_en: e.target.value})} rows={4} dir="ltr"
                    className="w-full rounded-md border border-border bg-background p-2 text-sm" />
                </Field>
                <Field label={isAr ? "المحافظة" : "Governorate"}><Input value={form.governorate} onChange={(e) => setForm({...form, governorate: e.target.value})} /></Field>
                <Field label={isAr ? "المدينة" : "City"}><Input value={form.city} onChange={(e) => setForm({...form, city: e.target.value})} /></Field>
                <Field label={isAr ? "المكان (عنوان مختصر)" : "Location"}><Input value={form.location} onChange={(e) => setForm({...form, location: e.target.value})} /></Field>
                <Field label={isAr ? "أماكن مطلوبة" : "Slots needed"}><Input type="number" value={form.slots_needed} onChange={(e) => setForm({...form, slots_needed: Number(e.target.value)})} /></Field>
                <Field label={isAr ? "تاريخ" : "Date"}><Input type="date" value={form.event_date} onChange={(e) => setForm({...form, event_date: e.target.value})} /></Field>
                <Field label={isAr ? "وقت" : "Time"}><Input value={form.event_time} onChange={(e) => setForm({...form, event_time: e.target.value})} placeholder="08:00 - 12:00" /></Field>
                <Field label={isAr ? "صورة الغلاف" : "Cover image"}>
                  <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); e.target.value = ""; }} />
                  <div
                    className="relative group rounded-2xl border-2 border-dashed border-border hover:border-primary/60 bg-muted/30 transition-colors overflow-hidden"
                    style={{ minHeight: 120 }}
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "var(--primary)"; }}
                    onDragLeave={(e) => { e.currentTarget.style.borderColor = ""; }}
                    onDrop={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = ""; const f = e.dataTransfer.files?.[0]; if (f) handleImageUpload(f); }}
                  >
                    {form.cover_image_url ? (
                      <>
                        <img src={form.cover_image_url} alt="" className="w-full object-cover rounded-2xl" style={{ maxHeight: 180 }} onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center gap-2">
                          <Button type="button" size="sm" variant="secondary" className="gap-1 rounded-xl text-xs" onClick={() => imgInputRef.current?.click()} disabled={uploading}>
                            {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />} {isAr ? "تغيير" : "Change"}
                          </Button>
                          <Button type="button" size="sm" variant="destructive" className="gap-1 rounded-xl text-xs" onClick={() => setForm((f) => ({ ...f, cover_image_url: "" }))}>
                            <X className="h-3 w-3" /> {isAr ? "حذف" : "Remove"}
                          </Button>
                        </div>
                      </>
                    ) : (
                      <button type="button" className="w-full h-full flex flex-col items-center justify-center gap-2 p-6 text-muted-foreground hover:text-primary transition-colors" onClick={() => imgInputRef.current?.click()} disabled={uploading}>
                        {uploading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <ImageIcon className="h-6 w-6" />}
                        <p className="text-xs font-bold">{uploading ? (isAr ? "جاري..." : "Uploading...") : (isAr ? "انقر لرفع صورة" : "Click to upload")}</p>
                      </button>
                    )}
                  </div>
                  <div className="mt-1.5 flex gap-1.5">
                    <Input value={form.cover_image_url.startsWith("blob:") ? "" : form.cover_image_url} onChange={(e) => setForm({...form, cover_image_url: e.target.value})} dir="ltr" placeholder="https://..." className="h-8 text-xs rounded-xl font-mono" />
                    <Button type="button" variant="outline" size="sm" className="shrink-0 rounded-xl gap-1 text-xs h-8" onClick={() => imgInputRef.current?.click()} disabled={uploading}>
                      {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />} {isAr ? "رفع" : "Upload"}
                    </Button>
                  </div>
                </Field>
                <Field label={isAr ? "مهارات مطلوبة (افصل بفاصلة)" : "Required skills (comma)"}><Input value={form.required_skills} onChange={(e) => setForm({...form, required_skills: e.target.value})} /></Field>
              </div>
              <div className="mt-3 flex items-center gap-3 rounded-xl bg-muted/30 p-3 text-xs">
                <div className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /><span className="font-bold">{form.event_date || "—"}</span></div>
                <div className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /><span className="font-bold">{form.governorate} {form.city && `· ${form.city}`}</span></div>
                <div className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /><span className="font-bold">{row.slots_filled}/{form.slots_needed}</span></div>
              </div>
            </section>

            <section className="rounded-2xl bg-card p-4 shadow-soft">
              <h2 className="mb-2 text-sm font-black text-primary inline-flex items-center gap-1.5">
                <Send className="h-4 w-4" /> {isAr ? "بث إشعار للمتطوعين المقبولين" : "Broadcast to approved volunteers"}
              </h2>
              <p className="mb-2 text-[11px] text-muted-foreground">
                {isAr ? "يصل إشعار داخلي لكل متطوع مقبول مسجّل في النظام (يظهر في جرس الإشعارات وصفحة مهامي)." : "Sends an in-app notification to each approved registered volunteer."}
              </p>
              <div className="mb-2 flex flex-wrap gap-1.5">
                {tpl(null).map(t => (
                  <button key={t.id} onClick={()=>setBroadcast(t.text)}
                    className="inline-flex items-center gap-1 rounded-full bg-secondary/20 px-2.5 py-1 text-[10px] font-extrabold text-primary hover:bg-secondary/30">
                    <FileText className="h-3 w-3" />{t.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <textarea value={broadcast} onChange={(e)=>setBroadcast(e.target.value)} rows={2}
                  placeholder={isAr ? "مثال: يُرجى الحضور قبل الموعد بنصف ساعة، الزي مطلوب." : "Example: Please arrive 30 min early."}
                  className="flex-1 rounded-md border border-border bg-background p-2 text-sm" />
                <Button onClick={broadcastApproved} disabled={busy || !broadcast.trim()} className="bg-primary text-primary-foreground">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />} {isAr ? "إرسال" : "Send"}
                </Button>
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <section className="rounded-2xl bg-card p-4 shadow-soft">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-black text-primary">{isAr ? `طلبات التطوع (${apps.length})` : `Applications (${apps.length})`}</h2>
                <button onClick={exportCsv} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-[10px] font-bold text-muted-foreground hover:bg-muted/70">
                  <Download className="h-3 w-3" /> CSV
                </button>
              </div>
              <div className="mb-2 flex items-center gap-1.5 rounded-lg bg-muted/40 px-2 py-1">
                <Search className="h-3.5 w-3.5 text-muted-foreground" />
                <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder={isAr ? "بحث بالاسم/الهاتف…" : "Search…"} className="w-full bg-transparent text-xs outline-none" />
              </div>
              <div className="mb-2 flex flex-wrap gap-1">
                {(["all","pending","approved","attended","rejected","noshow"] as const).map(t => (
                  <button key={t} onClick={()=>setTab(t)}
                    className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${tab===t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}>
                    {t === "all" ? (isAr?"الكل":"All") : (isAr ? APP_STATUSES.find(s=>s.v===t)?.ar : APP_STATUSES.find(s=>s.v===t)?.en)}
                  </button>
                ))}
              </div>
              {tab === "pending" && filtered.length > 0 && (
                <div className="mb-2 flex gap-1">
                  <button onClick={()=>bulk("approved")} disabled={busy} className="flex-1 rounded bg-primary/15 px-2 py-1 text-[10px] font-extrabold text-primary hover:bg-primary/25">{isAr?"قبول الكل":"Approve all"}</button>
                  <button onClick={()=>bulk("rejected")} disabled={busy} className="flex-1 rounded bg-destructive/10 px-2 py-1 text-[10px] font-extrabold text-destructive hover:bg-destructive/20">{isAr?"رفض الكل":"Reject all"}</button>
                </div>
              )}
              <div className="max-h-[640px] space-y-2 overflow-auto pr-1">
                {filtered.length === 0 ? (
                  <p className="py-4 text-center text-xs text-muted-foreground">{isAr ? "لا توجد طلبات" : "No applications"}</p>
                ) : filtered.map((a) => {
                  const st = APP_STATUSES.find(s => s.v === a.status) || APP_STATUSES[0];
                  const isEdit = editing === a.id;
                  return (
                    <div key={a.id} className="rounded-xl border border-border bg-background p-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold">{a.full_name} {a.volunteer_id && <span title={isAr?"حساب مُسجّل":"Registered"} className="ms-1 text-primary">●</span>}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${st.tone}`}>{isAr ? st.ar : st.en}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground" dir="ltr">{a.phone} {a.email && `· ${a.email}`} · {a.city || "—"}</div>
                      {a.skills?.length > 0 && <div className="mt-1 flex flex-wrap gap-1">{a.skills.map(s => <span key={s} className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-bold">{s}</span>)}</div>}
                      {(a.assigned_role || a.shift) && !isEdit && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {a.assigned_role && <span className="inline-flex items-center gap-0.5 rounded bg-secondary/20 px-1.5 py-0.5 text-[9px] font-extrabold text-primary"><UserCheck className="h-2.5 w-2.5" />{a.assigned_role}</span>}
                          {a.shift && <span className="inline-flex items-center gap-0.5 rounded bg-accent/15 px-1.5 py-0.5 text-[9px] font-extrabold text-accent"><Clock4 className="h-2.5 w-2.5" />{a.shift}</span>}
                        </div>
                      )}
                      {isEdit && (
                        <div className="mt-2 grid grid-cols-2 gap-1.5">
                          <input value={editRole} onChange={(e)=>setEditRole(e.target.value)} placeholder={isAr?"الدور المعيّن":"Role"} className="rounded border border-border bg-background px-1.5 py-1 text-[10px]" />
                          <input value={editShift} onChange={(e)=>setEditShift(e.target.value)} placeholder={isAr?"الوردية":"Shift"} className="rounded border border-border bg-background px-1.5 py-1 text-[10px]" />
                          <button onClick={()=>saveAssignment(a)} className="col-span-2 rounded bg-primary px-2 py-1 text-[10px] font-extrabold text-primary-foreground">{isAr?"حفظ":"Save"}</button>
                        </div>
                      )}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {a.status !== "approved" && <button onClick={() => setAppStatus(a, "approved")} className="inline-flex items-center gap-1 rounded bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary"><CheckCircle2 className="h-3 w-3" />{isAr ? "قبول" : "Approve"}</button>}
                        {a.status !== "rejected" && <button onClick={() => setAppStatus(a, "rejected")} className="inline-flex items-center gap-1 rounded bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive"><XCircle className="h-3 w-3" />{isAr ? "رفض" : "Reject"}</button>}
                        {a.status === "approved" && <button onClick={() => setAppStatus(a, "attended")} className="rounded bg-secondary/20 px-2 py-0.5 text-[10px] font-bold text-primary">{isAr ? "حضر" : "Attended"}</button>}
                        {a.status === "approved" && <button onClick={() => setAppStatus(a, "noshow")} className="rounded bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">{isAr ? "لم يحضر" : "No-show"}</button>}
                        <button onClick={()=>{ setEditing(isEdit? null : a.id); setEditRole(a.assigned_role||""); setEditShift(a.shift||""); }}
                          className="inline-flex items-center gap-1 rounded bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent">
                          <UserCheck className="h-3 w-3" />{isEdit ? (isAr?"إغلاق":"Close") : (isAr?"تعيين دور/وردية":"Assign")}
                        </button>
                        {a.volunteer_id && (
                          <button onClick={()=>openNotify(a)} className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-[10px] font-bold text-foreground">
                            <MessageSquare className="h-3 w-3" />{isAr ? "إشعار" : "Notify"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </aside>
        </div>

        {notifyOpen && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={()=>setNotifyOpen(null)}>
            <div className="w-full max-w-lg rounded-2xl bg-card p-4 shadow-xl" onClick={(e)=>e.stopPropagation()} dir={isAr ? "rtl" : "ltr"}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="inline-flex items-center gap-1.5 text-sm font-black text-primary">
                  <MessageSquare className="h-4 w-4" />
                  {isAr ? `إشعار إلى ${notifyOpen.full_name}` : `Notify ${notifyOpen.full_name}`}
                </h3>
                <button onClick={()=>setNotifyOpen(null)} className="grid h-7 w-7 place-items-center rounded-md bg-muted hover:bg-muted/70"><X className="h-4 w-4" /></button>
              </div>
              <div className="mb-2 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                {isAr ? "قوالب جاهزة" : "Templates"}
              </div>
              <div className="mb-3 flex flex-wrap gap-1.5">
                {tpl(notifyOpen).map(t => (
                  <button key={t.id} onClick={()=>setNotifyText(t.text)}
                    className="inline-flex items-center gap-1 rounded-full bg-secondary/20 px-2.5 py-1 text-[11px] font-extrabold text-primary hover:bg-secondary/30">
                    <FileText className="h-3 w-3" /> {t.label}
                  </button>
                ))}
              </div>
              <textarea value={notifyText} onChange={(e)=>setNotifyText(e.target.value)} rows={7}
                placeholder={isAr ? "اختر قالبًا أو اكتب نص الرسالة…" : "Pick a template or write…"}
                className="w-full rounded-lg border border-border bg-background p-2.5 text-sm" />
              <div className="mt-3 flex justify-end gap-2">
                <button onClick={()=>setNotifyOpen(null)} className="rounded-md bg-muted px-3 py-1.5 text-xs font-bold text-muted-foreground">{isAr ? "إلغاء" : "Cancel"}</button>
                <Button onClick={sendNotify} disabled={!notifyText.trim()} className="bg-primary text-primary-foreground">
                  <Send className="h-4 w-4" /> {isAr ? "إرسال" : "Send"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="mb-1 block text-xs font-bold text-muted-foreground">{label}</span>
    {children}
  </label>
);