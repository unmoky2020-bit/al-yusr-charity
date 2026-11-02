import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Search, X, RefreshCcw, Copy, BellOff, CheckCircle2, Mail, Plus, FileText, TrendingUp, Send } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useLang } from "@/i18n/LangContext";
import { newsletterApi, type LaravelNewsletter } from "@/data/laravelApi";

type Subscriber = {
  id: string;
  email: string;
  status: "pending" | "confirmed" | "unsubscribed" | "bounced";
  lang: string;
  source: string | null;
  confirm_token?: string;
  unsubscribe_token?: string;
  confirmed_at: string | null;
  unsubscribed_at: string | null;
  created_at: string;
};

function mapLaravelSubscriber(s: LaravelNewsletter): Subscriber {
  return {
    id: String(s.id),
    email: s.email,
    status: (s.status as Subscriber["status"]) || "pending",
    lang: s.language || "ar",
    source: s.source || null,
    confirmed_at: s.confirmed_at || null,
    unsubscribed_at: s.unsubscribed_at || null,
    created_at: s.created_at || new Date().toISOString(),
  };
}

const STATUS_STYLE: Record<Subscriber["status"], string> = {
  pending: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  confirmed: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  unsubscribed: "bg-muted text-muted-foreground border-border",
  bounced: "bg-destructive/15 text-destructive border-destructive/30",
};

type DateRange = "all" | "7" | "30" | "90";

const AdminNewsletter = () => {
  const { lang } = useLang();
  const isRTL = lang === "ar";
  const [rows, setRows] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | Subscriber["status"]>("all");
  const [source, setSource] = useState<string>("all");
  const [range, setRange] = useState<DateRange>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [addOpen, setAddOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newLang, setNewLang] = useState<"ar" | "en">("ar");
  const [newSource, setNewSource] = useState("admin");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const laravelData = await newsletterApi.listAll({ per_page: 1000 });
      if (Array.isArray(laravelData) && laravelData.length > 0) {
        setRows(laravelData.map(mapLaravelSubscriber));
      } else {
        setRows([]);
      }
    } catch {
      setRows([]);
    } finally {
      setSelected(new Set());
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const safeRows = Array.isArray(rows) ? rows : [];

  const sources = useMemo(() => {
    const s = new Set<string>();
    for (const r of safeRows) if (r.source) s.add(r.source);
    return Array.from(s).sort();
  }, [safeRows]);

  const filtered = useMemo(() => {
    const cutoff =
      range === "all" ? 0 : Date.now() - parseInt(range, 10) * 86400000;
    return safeRows.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (source !== "all" && r.source !== source) return false;
      if (q && !r.email.toLowerCase().includes(q.toLowerCase())) return false;
      if (cutoff && new Date(r.created_at).getTime() < cutoff) return false;
      return true;
    });
  }, [safeRows, q, status, source, range]);

  const counts = useMemo(() => {
    const c = { all: safeRows.length, pending: 0, confirmed: 0, unsubscribed: 0, bounced: 0 };
    for (const r of safeRows) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [safeRows]);

  // Trend: last 30 days, signups per day
  const trend = useMemo(() => {
    const days = 30;
    const buckets = new Array<number>(days).fill(0);
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (days - 1));
    for (const r of safeRows) {
      const t = new Date(r.created_at).getTime();
      const idx = Math.floor((t - start.getTime()) / 86400000);
      if (idx >= 0 && idx < days) buckets[idx]++;
    }
    const max = Math.max(1, ...buckets);
    return { buckets, max, total: buckets.reduce((a, b) => a + b, 0) };
  }, [safeRows]);

  const toggleAll = (checked: boolean) => {
    if (!checked) return setSelected(new Set());
    setSelected(new Set(filtered.map((r) => r.id)));
  };
  const toggleOne = (id: string, checked: boolean) => {
    const next = new Set(selected);
    if (checked) next.add(id); else next.delete(id);
    setSelected(next);
  };
  const allChecked = filtered.length > 0 && filtered.every((r) => selected.has(r.id));

  const exportCsv = (rowsArg?: Subscriber[]) => {
    const data = rowsArg ?? filtered;
    const header = ["email", "status", "lang", "source", "created_at", "confirmed_at", "unsubscribed_at"];
    const lines = [header.join(",")];
    for (const r of data) {
      lines.push(
        [r.email, r.status, r.lang, r.source ?? "", r.created_at, r.confirmed_at ?? "", r.unsubscribed_at ?? ""]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(","),
      );
    }
    const blob = new Blob(["\ufeff" + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(isRTL ? "تم تصدير CSV" : "CSV exported");
  };

  const exportEmailsTxt = () => {
    const data = filtered.filter((r) => r.status === "confirmed").map((r) => r.email);
    if (!data.length) return toast.error(isRTL ? "لا توجد بريد مؤكد" : "No confirmed emails");
    const blob = new Blob([data.join("\r\n")], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `confirmed-emails-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(isRTL ? "تم تصدير البريد المؤكد" : "Confirmed emails exported");
  };

  const copyConfirm = async (r: Subscriber) => {
    const link = `${window.location.origin}/newsletter/confirm?token=${r.confirm_token}`;
    await navigator.clipboard.writeText(link);
    toast.success(isRTL ? "تم نسخ رابط التأكيد" : "Confirm link copied");
  };

  const manualConfirm = async (r: Subscriber) => {
    try {
      await newsletterApi.update(r.id, { status: "confirmed", confirmed_at: new Date().toISOString() } as any);
      toast.success(isRTL ? "تم تأكيد الاشتراك" : "Confirmed");
      void load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : (isRTL ? "فشل تأكيد الاشتراك" : "Confirmation failed"));
    }
  };

  const unsubscribe = async (r: Subscriber) => {
    if (!confirm(isRTL ? `إلغاء اشتراك ${r.email}؟` : `Unsubscribe ${r.email}?`)) return;
    try {
      await newsletterApi.update(r.id, { status: "unsubscribed", unsubscribed_at: new Date().toISOString() } as any);
      toast.success(isRTL ? "تم إلغاء الاشتراك" : "Unsubscribed");
      void load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : (isRTL ? "فشل إلغاء الاشتراك" : "Unsubscribe failed"));
    }
  };

  const remove = async (r: Subscriber) => {
    if (!confirm(isRTL ? `حذف ${r.email}؟` : `Delete ${r.email}?`)) return;
    try {
      await newsletterApi.remove(r.id);
      toast.success(isRTL ? "تم الحذف" : "Deleted");
      void load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : (isRTL ? "فشل الحذف" : "Delete failed"));
    }
  };

  const bulkApply = async (action: "confirm" | "unsubscribe" | "delete") => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    const labels = {
      confirm: isRTL ? `تأكيد ${ids.length} مشترك؟` : `Confirm ${ids.length} subscribers?`,
      unsubscribe: isRTL ? `إلغاء ${ids.length} اشتراك؟` : `Unsubscribe ${ids.length}?`,
      delete: isRTL ? `حذف ${ids.length} مشترك؟ لا يمكن التراجع.` : `Delete ${ids.length}? Cannot be undone.`,
    };
    if (!confirm(labels[action])) return;
    setBusy(true);
    try {
      if (action === "delete") {
        for (const id of ids) await newsletterApi.remove(id).catch(() => {});
      } else if (action === "confirm") {
        for (const id of ids) await newsletterApi.update(id, { status: "confirmed", confirmed_at: new Date().toISOString() } as any).catch(() => {});
      } else {
        for (const id of ids) await newsletterApi.update(id, { status: "unsubscribed", unsubscribed_at: new Date().toISOString() } as any).catch(() => {});
      }
      toast.success(isRTL ? "تم التنفيذ" : "Done");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : (isRTL ? "حدث خطأ" : "Error"));
    } finally {
      setBusy(false);
    }
    void load();
  };

  const copySelectedEmails = async () => {
    const emails = filtered.filter((r) => selected.has(r.id)).map((r) => r.email);
    if (!emails.length) return;
    await navigator.clipboard.writeText(emails.join(", "));
    toast.success(isRTL ? `تم نسخ ${emails.length} بريد` : `Copied ${emails.length} emails`);
  };

  const mailtoSelected = () => {
    const emails = filtered.filter((r) => selected.has(r.id) && r.status === "confirmed").map((r) => r.email);
    if (!emails.length) return toast.error(isRTL ? "لا يوجد بريد مؤكد محدد" : "No confirmed emails selected");
    window.location.href = `mailto:?bcc=${encodeURIComponent(emails.join(","))}`;
  };

  const addSubscriber = async () => {
    const email = newEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast.error(isRTL ? "بريد غير صالح" : "Invalid email");
    setBusy(true);
    try {
      await newsletterApi.adminAdd(email, newLang as "ar" | "en");
      toast.success(isRTL ? "تمت الإضافة" : "Added");
      setAddOpen(false);
      setNewEmail("");
      void load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : (isRTL ? "فشل إضافة المشترك" : "Failed to add subscriber"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminLayout title={{ ar: "النشرة البريدية", en: "Newsletter" }}>
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        {([
          ["all", isRTL ? "الكل" : "All", counts.all],
          ["confirmed", isRTL ? "مؤكدون" : "Confirmed", counts.confirmed],
          ["pending", isRTL ? "قيد التأكيد" : "Pending", counts.pending],
          ["unsubscribed", isRTL ? "ألغوا الاشتراك" : "Unsubscribed", counts.unsubscribed],
          ["bounced", isRTL ? "مرتد" : "Bounced", counts.bounced],
        ] as const).map(([key, label, value]) => (
          <button
            key={key}
            onClick={() => setStatus(key as typeof status)}
            className={`rounded-2xl border p-3 text-start shadow-soft transition ${
              status === key ? "border-secondary bg-secondary/10" : "border-border bg-card hover:border-secondary/40"
            }`}
          >
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
            <div className="mt-1 text-2xl font-black text-primary">{value}</div>
          </button>
        ))}
      </div>

      {/* Trend sparkline */}
      <div className="mb-4 rounded-2xl border border-border bg-card p-4 shadow-soft">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <TrendingUp className="h-4 w-4" />
            {isRTL ? "اشتراكات آخر 30 يومًا" : "Last 30 days signups"}
          </div>
          <div className="text-xs text-muted-foreground">
            {isRTL ? "الإجمالي" : "Total"}: <span className="font-bold text-primary">{trend.total}</span>
          </div>
        </div>
        <div className="flex h-16 items-end gap-[2px]">
          {trend.buckets.map((v, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm bg-secondary/40 hover:bg-secondary transition-colors"
              style={{ height: `${(v / trend.max) * 100}%`, minHeight: v > 0 ? "4px" : "2px" }}
              title={`${v} ${isRTL ? "اشتراك" : "signups"}`}
            />
          ))}
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={isRTL ? "ابحث بالبريد..." : "Search email..."}
            className="ps-9"
          />
        </div>
        <Select value={source} onValueChange={setSource}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder={isRTL ? "المصدر" : "Source"} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isRTL ? "كل المصادر" : "All sources"}</SelectItem>
            {sources.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={range} onValueChange={(v) => setRange(v as DateRange)}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isRTL ? "كل الفترات" : "All time"}</SelectItem>
            <SelectItem value="7">{isRTL ? "آخر 7 أيام" : "Last 7 days"}</SelectItem>
            <SelectItem value="30">{isRTL ? "آخر 30 يوم" : "Last 30 days"}</SelectItem>
            <SelectItem value="90">{isRTL ? "آخر 90 يوم" : "Last 90 days"}</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCcw className="h-4 w-4" /> {isRTL ? "تحديث" : "Refresh"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" /> {isRTL ? "إضافة" : "Add"}
        </Button>
        <Button size="sm" variant="outline" onClick={exportEmailsTxt}>
          <FileText className="h-4 w-4" /> {isRTL ? "تصدير المؤكدين" : "Export confirmed"}
        </Button>
        <Button size="sm" onClick={() => exportCsv()}>
          <Download className="h-4 w-4" /> {isRTL ? "تصدير CSV" : "Export CSV"}
        </Button>
        <Link to="/admin/newsletter/campaigns">
          <Button size="sm" className="bg-primary">
            <Send className="h-4 w-4" /> {isRTL ? "حملات الإرسال" : "Campaigns"}
          </Button>
        </Link>
      </div>

      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-secondary/40 bg-secondary/10 px-3 py-2">
          <div className="text-sm font-semibold text-primary">
            {isRTL ? `${selected.size} محدد` : `${selected.size} selected`}
          </div>
          <Button size="sm" variant="outline" onClick={() => void bulkApply("confirm")} disabled={busy}>
            <CheckCircle2 className="h-3.5 w-3.5" /> {isRTL ? "تأكيد" : "Confirm"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => void bulkApply("unsubscribe")} disabled={busy}>
            <BellOff className="h-3.5 w-3.5" /> {isRTL ? "إلغاء الاشتراك" : "Unsubscribe"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => void copySelectedEmails()}>
            <Copy className="h-3.5 w-3.5" /> {isRTL ? "نسخ" : "Copy"}
          </Button>
          <Button size="sm" variant="outline" onClick={mailtoSelected}>
            <Mail className="h-3.5 w-3.5" /> {isRTL ? "بريد جماعي" : "Mailto"}
          </Button>
          <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => void bulkApply("delete")} disabled={busy}>
            <X className="h-3.5 w-3.5" /> {isRTL ? "حذف" : "Delete"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())} className="ms-auto">
            {isRTL ? "إلغاء التحديد" : "Clear"}
          </Button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="w-10 p-3">
                <Checkbox checked={allChecked} onCheckedChange={(c) => toggleAll(!!c)} />
              </th>
              <th className="p-3 text-start">{isRTL ? "البريد" : "Email"}</th>
              <th className="p-3 text-start">{isRTL ? "الحالة" : "Status"}</th>
              <th className="p-3 text-start">{isRTL ? "المصدر" : "Source"}</th>
              <th className="p-3 text-start">{isRTL ? "اللغة" : "Lang"}</th>
              <th className="p-3 text-start">{isRTL ? "اشترك" : "Joined"}</th>
              <th className="p-3 text-end">{isRTL ? "إجراءات" : "Actions"}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-center text-sm text-muted-foreground">
                {loading ? (isRTL ? "جاري التحميل..." : "Loading...") : (isRTL ? "لا توجد بيانات" : "No subscribers yet")}
              </td></tr>
            )}
            {filtered.map((r) => (
              <tr key={r.id} className="border-t border-border/60 hover:bg-muted/30">
                <td className="p-3">
                  <Checkbox checked={selected.has(r.id)} onCheckedChange={(c) => toggleOne(r.id, !!c)} />
                </td>
                <td className="p-3 font-semibold text-primary" dir="ltr">{r.email}</td>
                <td className="p-3">
                  <Badge variant="outline" className={STATUS_STYLE[r.status]}>{r.status}</Badge>
                </td>
                <td className="p-3 text-xs text-muted-foreground">{r.source ?? "—"}</td>
                <td className="p-3 text-xs uppercase">{r.lang}</td>
                <td className="p-3 text-xs text-muted-foreground" title={new Date(r.created_at).toLocaleString(isRTL ? "ar-EG" : "en-GB")}>
                  {new Date(r.created_at).toLocaleDateString(isRTL ? "ar-EG" : "en-GB")}
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap items-center justify-end gap-1.5">
                    {r.status === "pending" && (
                      <Button size="sm" variant="outline" onClick={() => void manualConfirm(r)} title={isRTL ? "تأكيد يدوي" : "Manual confirm"}>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => void copyConfirm(r)} title={isRTL ? "نسخ رابط التأكيد" : "Copy confirm link"}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="outline" asChild title={isRTL ? "إرسال بريد" : "Send email"}>
                      <a href={`mailto:${r.email}`}><Mail className="h-3.5 w-3.5" /></a>
                    </Button>
                    {r.status !== "unsubscribed" && (
                      <Button size="sm" variant="outline" onClick={() => void unsubscribe(r)}>
                        <BellOff className="h-3.5 w-3.5" /> {isRTL ? "إلغاء" : "Unsub"}
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => void remove(r)} className="text-destructive hover:bg-destructive/10">
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-xs text-muted-foreground">
        {isRTL ? `عرض ${filtered.length} من ${rows.length}` : `Showing ${filtered.length} of ${rows.length}`}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isRTL ? "إضافة مشترك يدويًا" : "Add subscriber manually"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-bold text-muted-foreground">{isRTL ? "البريد" : "Email"}</label>
              <Input dir="ltr" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="user@example.com" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-muted-foreground">{isRTL ? "اللغة" : "Language"}</label>
                <Select value={newLang} onValueChange={(v) => setNewLang(v as "ar" | "en")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ar">العربية</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-muted-foreground">{isRTL ? "المصدر" : "Source"}</label>
                <Input value={newSource} onChange={(e) => setNewSource(e.target.value)} placeholder="admin" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {isRTL ? "سيتم إضافته بحالة «مؤكد» مباشرة." : "Added directly as confirmed."}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>{isRTL ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={() => void addSubscriber()} disabled={busy}>{isRTL ? "إضافة" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminNewsletter;
