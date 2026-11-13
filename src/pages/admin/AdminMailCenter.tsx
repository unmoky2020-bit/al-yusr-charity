import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle, CheckCircle2, Clock, Eye, Inbox, Loader2, Mail, MailOpen, MousePointerClick, PenSquare, RefreshCcw, RotateCcw,
  Search, Send, Settings2, Sparkles, Trash2, X, Zap,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/lib/notify";
import { askConfirm } from "@/components/common/confirm";
import { useAuth } from "@/auth/AuthContext";
import { useCan } from "@/auth/useCan";
import { apiErrorMessage } from "@/data/api/adminApiHelpers";
import { EmailPreviewFrame } from "@/components/admin/mail/EmailPreviewFrame";
import {
  AUTOMATIONS, FIXED_TEMPLATES, MAIL_KIND_LABELS, MAIL_STATUS_LABELS, mailAdminApi,
  type MailKind, type MailLogRow, type MailOverview, type MailSettings, type MailStatus,
} from "@/data/api/mailApi";
import { cn } from "@/lib/utils";

type Tab = "overview" | "automations" | "log" | "misbaha" | "settings";
const TABS: { id: Tab; label: string; icon: typeof Mail }[] = [
  { id: "overview", label: "نظرة عامة", icon: Inbox },
  { id: "automations", label: "الرسائل التلقائية", icon: Zap },
  { id: "log", label: "سجل الإيميلات", icon: Mail },
  { id: "misbaha", label: "متابعين المسبحة", icon: Sparkles },
  { id: "settings", label: "الإعدادات", icon: Settings2 },
];

const fmt = (n: number | undefined | null) => Number(n ?? 0).toLocaleString("en-US");
const when = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString("ar-EG", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "—";
const ago = (iso?: string | null) => {
  if (!iso) return "ما اشتغلش لسه";
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "من أقل من دقيقة";
  if (m < 60) return `من ${m} دقيقة`;
  const h = Math.round(m / 60);
  return h < 24 ? `من ${h} ساعة` : `من ${Math.round(h / 24)} يوم`;
};

const STATUS_STYLE: Record<MailStatus, string> = {
  queued: "bg-amber-100 text-amber-800",
  sending: "bg-sky-100 text-sky-800",
  sent: "bg-emerald-100 text-emerald-800",
  failed: "bg-red-100 text-red-700",
  cancelled: "bg-zinc-100 text-zinc-600",
  skipped: "bg-zinc-100 text-zinc-600",
};

/**
 * «مركز البريد»: one place for every email the site sends — today's sending budget, the queue,
 * the automatic emails (preview, test, on/off), the full log, misbaha followers and settings.
 */
export default function AdminMailCenter() {
  const [tab, setTab] = useState<Tab>("overview");
  const can = useCan();
  const canManage = can("newsletter.update");
  const qc = useQueryClient();
  const overview = useQuery({ queryKey: ["mail-overview"], queryFn: mailAdminApi.overview, refetchInterval: 30000 });
  const o = overview.data;

  const pump = useMutation({
    mutationFn: mailAdminApi.pump,
    onSuccess: (r) => {
      toast.success(r?.message || "تمام");
      qc.invalidateQueries({ queryKey: ["mail-overview"] });
      qc.invalidateQueries({ queryKey: ["mail-log"] });
    },
    onError: (e) => toast.error("تعذر الإرسال", { description: apiErrorMessage(e) }),
  });

  return (
    <AdminLayout title={{ ar: "مركز البريد", en: "Mail center" }} loading={overview.isLoading}>
      <Helmet><title>مركز البريد | لوحة اليسر</title></Helmet>
      <div className="mx-auto max-w-6xl space-y-5 p-1" dir="rtl">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-primary">مركز البريد</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              كل إيميل بيطلع من الموقع: بيتبعت من <b dir="ltr">{o?.from || "support@elyusr.org"}</b>، والردود بتروح لـ <b dir="ltr">{o?.reply_to || "info@elyusr.org"}</b>.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => overview.refetch()} disabled={overview.isFetching}>
              <RefreshCcw className={cn("ml-1 h-4 w-4", overview.isFetching && "animate-spin")} /> تحديث
            </Button>
            {canManage && (
              <Button variant="outline" size="sm" onClick={() => pump.mutate()} disabled={pump.isPending}>
                {pump.isPending ? <Loader2 className="ml-1 h-4 w-4 animate-spin" /> : <Send className="ml-1 h-4 w-4" />} ابعت اللي في الطابور دلوقتي
              </Button>
            )}
            <Button asChild size="sm"><Link to="/admin/newsletter/campaigns?new=1"><PenSquare className="ml-1 h-4 w-4" /> نشرة جديدة</Link></Button>
          </div>
        </header>

        {overview.isError && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{apiErrorMessage(overview.error, "تعذر تحميل مركز البريد")}</div>
        )}

        <nav className="flex gap-1 overflow-x-auto rounded-2xl border bg-card p-1" role="tablist">
          {TABS.map((t) => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
              className={cn("flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-bold transition",
                tab === t.id ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted")}>
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </nav>

        {o && tab === "overview" && <OverviewTab o={o} onGo={setTab} />}
        {o && tab === "automations" && <AutomationsTab o={o} canManage={canManage} />}
        {tab === "log" && <LogTab kinds={o?.kinds} canManage={canManage} />}
        {tab === "misbaha" && <MisbahaTab canManage={can("newsletter.delete")} />}
        {o && tab === "settings" && <SettingsTab o={o} canManage={canManage} />}
      </div>
    </AdminLayout>
  );
}

/* ───────────── overview ───────────── */

function OverviewTab({ o, onGo }: { o: MailOverview; onGo: (t: Tab) => void }) {
  const b = o.budget;
  const used = Math.min(100, Math.round((b.sent_24h / Math.max(1, b.limit)) * 100));
  const reserveAt = Math.round(((b.limit - b.reserve) / Math.max(1, b.limit)) * 100);
  const queued = Number(o.by_status.queued ?? 0);
  const failed = Number(o.by_status.failed ?? 0);
  const week = o.last7.reduce((a, d) => ({ c: a.c + Number(d.c), o: a.o + Number(d.o), k: a.k + Number(d.k) }), { c: 0, o: 0, k: 0 });
  const openRate = week.c ? Math.round((week.o / week.c) * 100) : 0;
  const clickRate = week.c ? Math.round((week.k / week.c) * 100) : 0;
  const max = Math.max(1, ...o.last7.map((d) => Number(d.c)));

  return (
    <div className="space-y-5">
      {!o.ready && (
        <Banner tone="bad" title="الإرسال متوقف">السيرفر مضبوط إنه يكتب الإيميلات في السجل بدل ما يبعتها (MAIL_MAILER={o.mailer}). شغّل سكريبت <code>mail-setup.sh</code> على السيرفر.</Banner>
      )}
      {o.ready && !o.cron.ok && (
        <Banner tone="warn" title="المهمة المجدولة (Cron) مش شغالة">
          الإيميلات بتتبعت دلوقتي على دفعات صغيرة مع كل زيارة للموقع، فبتوصل بس ممكن تتأخر شوية. علشان النشرة والملخص الأسبوعي يمشوا بانتظام، ضيف في hPanel ← <b>Cron Jobs</b> أمر كل دقيقة:
          <code className="mt-2 block rounded-lg bg-black/5 p-2 text-[12px]" dir="ltr">cd ~/domains/api.elyusr.org/public_html &amp;&amp; php artisan schedule:run</code>
        </Banner>
      )}
      {o.ready && o.cron.ok && (
        <Banner tone="good" title="الإرسال شغال">المهمة المجدولة اشتغلت {ago(o.cron.last_run)}. الطابور بيتبعت كل دقيقة.</Banner>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border bg-card p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="font-black">حد الإرسال اليومي</h2>
            <span className="text-xs text-muted-foreground">آخر 24 ساعة</span>
          </div>
          <div className="mt-3 flex items-end gap-2">
            <span className="text-4xl font-black text-primary">{fmt(b.sent_24h)}</span>
            <span className="pb-1 text-sm text-muted-foreground">من {fmt(b.limit)} رسالة</span>
          </div>
          <div className="relative mt-4 h-3 overflow-hidden rounded-full bg-muted">
            <div className={cn("h-full rounded-full transition-all", used >= 90 ? "bg-red-500" : used >= reserveAt ? "bg-amber-500" : "bg-primary")} style={{ width: `${used}%` }} />
            <div className="absolute inset-y-0 w-0.5 bg-foreground/40" style={{ right: `${reserveAt}%` }} title="بعد الخط ده النشرة بتقف والاحتياطي للرموز والإيصالات" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <span>باقي النهارده: <b className="text-foreground">{fmt(b.left)}</b></span>
            <span>للنشرة والملخصات: <b className="text-foreground">{fmt(b.left_bulk)}</b></span>
          </div>
          <p className="mt-3 text-xs leading-6 text-muted-foreground">
            صندوق Hostinger بيسمح بـ 100 رسالة في اليوم. بنقف عند {fmt(b.limit)}، وآخر {fmt(b.reserve)} محجوزين للرموز والإيصالات علشان عمرها ما تتأخر بسبب نشرة.
          </p>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <Stat icon={Clock} label="في الطابور" value={fmt(queued)} hint={queued ? "هتتبعت تلقائي" : "مفيش حاجة مستنية"} />
          <Stat icon={AlertTriangle} label="فشل" value={fmt(failed)} hint={failed ? "افتح السجل" : "مفيش"} tone={failed ? "bad" : undefined} onClick={failed ? () => onGo("log") : undefined} />
          <Stat icon={MailOpen} label="فتح (7 أيام)" value={`${openRate}%`} hint={`${fmt(week.o)} من ${fmt(week.c)}`} />
          <Stat icon={MousePointerClick} label="ضغط (7 أيام)" value={`${clickRate}%`} hint={`${fmt(week.k)} ضغطة`} />
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border bg-card p-5">
          <h2 className="font-black">آخر 7 أيام</h2>
          {o.last7.length === 0 ? (
            <p className="mt-6 text-center text-sm text-muted-foreground">مفيش إيميلات اتبعتت الأسبوع ده لسه.</p>
          ) : (
            <div className="mt-4 flex h-36 items-end gap-2">
              {o.last7.map((d) => (
                <div key={d.d} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-[11px] font-bold">{d.c}</span>
                  <div className="w-full rounded-t-lg bg-primary/85" style={{ height: `${Math.max(6, (Number(d.c) / max) * 100)}%` }} title={`${d.c} اتبعت، ${d.o} اتفتح`} />
                  <span className="text-[10px] text-muted-foreground">{new Date(d.d).toLocaleDateString("ar-EG", { weekday: "short" })}</span>
                </div>
              ))}
            </div>
          )}
        </section>
        <section className="rounded-2xl border bg-card p-5">
          <h2 className="font-black">المشتركين</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <Link to="/admin/newsletter" className="rounded-xl bg-muted/60 p-3 transition hover:bg-muted">
              <div className="text-2xl font-black text-primary">{fmt(o.newsletter.confirmed)}</div>
              <div className="text-xs text-muted-foreground">مشترك مؤكد في النشرة</div>
              {o.newsletter.pending > 0 && <div className="mt-1 text-[11px] text-amber-700">{fmt(o.newsletter.pending)} لسه ما أكدوش</div>}
            </Link>
            <button type="button" onClick={() => onGo("misbaha")} className="rounded-xl bg-muted/60 p-3 text-right transition hover:bg-muted">
              <div className="text-2xl font-black text-primary">{fmt(o.misbaha.active)}</div>
              <div className="text-xs text-muted-foreground">متابع للسبح</div>
              {o.misbaha.pending > 0 && <div className="mt-1 text-[11px] text-amber-700">{fmt(o.misbaha.pending)} مستنيين التأكيد</div>}
            </button>
          </div>
          {Object.keys(o.queued_by_kind).length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {Object.entries(o.queued_by_kind).map(([k, n]) => (
                <span key={k} className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800">{MAIL_KIND_LABELS[k as MailKind] ?? k}: {n}</span>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Banner({ tone, title, children }: { tone: "good" | "warn" | "bad"; title: string; children: React.ReactNode }) {
  const style = tone === "good" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : tone === "warn" ? "border-amber-200 bg-amber-50 text-amber-900" : "border-red-200 bg-red-50 text-red-900";
  const Icon = tone === "good" ? CheckCircle2 : AlertTriangle;
  return (
    <div className={cn("flex gap-3 rounded-2xl border p-4 text-sm leading-7", style)}>
      <Icon className="mt-1 h-5 w-5 shrink-0" />
      <div><b className="block">{title}</b>{children}</div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, hint, tone, onClick }: { icon: typeof Mail; label: string; value: string; hint?: string; tone?: "bad"; onClick?: () => void }) {
  const C = onClick ? "button" : "div";
  return (
    <C onClick={onClick} className={cn("rounded-2xl border bg-card p-4 text-right", onClick && "transition hover:border-primary/40")}>
      <Icon className={cn("h-5 w-5", tone === "bad" ? "text-red-500" : "text-primary")} />
      <div className="mt-2 text-2xl font-black">{value}</div>
      <div className="text-xs font-bold text-muted-foreground">{label}</div>
      {hint && <div className="mt-0.5 text-[11px] text-muted-foreground">{hint}</div>}
    </C>
  );
}

/* ───────────── automations ───────────── */

function usePreview() {
  const [state, setState] = useState<{ title: string; html: string | null; loading: boolean; error: string | null } | null>(null);
  const open = async (title: string, load: () => Promise<string>) => {
    setState({ title, html: null, loading: true, error: null });
    try {
      const html = await load();
      setState({ title, html, loading: false, error: null });
    } catch (e) {
      setState({ title, html: null, loading: false, error: apiErrorMessage(e, "تعذر تحميل المعاينة") });
    }
  };
  const dialog = (
    <Dialog open={!!state} onOpenChange={(v) => !v && setState(null)}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto p-4 sm:p-6" dir="rtl">
        <DialogHeader><DialogTitle>{state?.title}</DialogTitle></DialogHeader>
        {state && <EmailPreviewFrame html={state.html} loading={state.loading} error={state.error} />}
      </DialogContent>
    </Dialog>
  );
  return { open, dialog };
}

function AutomationsTab({ o, canManage }: { o: MailOverview; canManage: boolean }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const preview = usePreview();
  const [testing, setTesting] = useState<MailKind | null>(null);
  const save = useMutation({
    mutationFn: (s: Partial<MailSettings>) => mailAdminApi.saveSettings(s),
    onSuccess: () => { toast.success("اتحفظ"); qc.invalidateQueries({ queryKey: ["mail-overview"] }); },
    onError: (e) => toast.error("تعذر الحفظ", { description: apiErrorMessage(e) }),
  });
  const test = async (kind: MailKind) => {
    const email = (user as { email?: string } | null)?.email;
    if (!email) { toast.error("حسابك مفيهوش بريد"); return; }
    setTesting(kind);
    try {
      const r = await mailAdminApi.templateTest(kind, email);
      toast.success(r?.message || "اتبعتت", { description: "بتوصل خلال دقيقة. شوف الوارد أو الرسائل غير المرغوب فيها." });
    } catch (e) {
      toast.error("تعذر الإرسال", { description: apiErrorMessage(e) });
    } finally { setTesting(null); }
  };

  const Row = ({ kind, title, whenText, toggle }: { kind: MailKind; title: string; whenText: string; toggle?: keyof MailSettings }) => (
    <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 sm:flex-row sm:items-center">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <b>{title}</b>
          {toggle && !o.settings[toggle] && <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-bold text-zinc-600">متوقفة</span>}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{whenText}</p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => preview.open(title, () => mailAdminApi.templatePreview(kind))}><Eye className="ml-1 h-4 w-4" /> معاينة</Button>
        {canManage && (
          <Button variant="outline" size="sm" onClick={() => test(kind)} disabled={testing === kind}>
            {testing === kind ? <Loader2 className="ml-1 h-4 w-4 animate-spin" /> : <Send className="ml-1 h-4 w-4" />} ابعتها لي
          </Button>
        )}
        {toggle && (
          <Switch checked={Boolean(o.settings[toggle])} disabled={!canManage || save.isPending}
            onCheckedChange={(v) => save.mutate({ [toggle]: v } as Partial<MailSettings>)} aria-label={`تشغيل ${title}`} />
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="font-black">بتتبعت لوحدها</h2>
        <p className="text-sm text-muted-foreground">كل رسالة بتتبعت مرة واحدة بس لنفس الشخص ونفس الحدث، وبتعدّي على حد الإرسال اليومي.</p>
        {AUTOMATIONS.map((a) => <Row key={a.key} kind={a.kind} title={a.title} whenText={a.when} toggle={a.key} />)}
      </section>
      <section className="space-y-3">
        <h2 className="font-black">رسائل أساسية (دايمًا شغالة)</h2>
        {FIXED_TEMPLATES.map((a) => <Row key={a.kind} kind={a.kind} title={a.title} whenText={a.when} />)}
      </section>
      {preview.dialog}
    </div>
  );
}

/* ───────────── log ───────────── */

function LogTab({ kinds, canManage }: { kinds?: Record<string, string>; canManage: boolean }) {
  const qc = useQueryClient();
  const [status, setStatus] = useState("");
  const [kind, setKind] = useState("");
  const [q, setQ] = useState("");
  const [term, setTerm] = useState("");
  const [page, setPage] = useState(1);
  const preview = usePreview();
  const log = useQuery({
    queryKey: ["mail-log", status, kind, term, page],
    queryFn: () => mailAdminApi.log({ status: status || undefined, kind: kind || undefined, q: term || undefined, page }),
    placeholderData: (prev) => prev,
  });
  const act = async (fn: () => Promise<{ message: string }>) => {
    try {
      const r = await fn();
      toast.success(r?.message || "تمام");
      qc.invalidateQueries({ queryKey: ["mail-log"] });
      qc.invalidateQueries({ queryKey: ["mail-overview"] });
    } catch (e) { toast.error("تعذر", { description: apiErrorMessage(e) }); }
  };
  const labels = useMemo(() => ({ ...MAIL_KIND_LABELS, ...(kinds ?? {}) }), [kinds]);
  const rows = log.data?.data ?? [];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <form className="relative min-w-[220px] flex-1" onSubmit={(e) => { e.preventDefault(); setTerm(q.trim()); setPage(1); }}>
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث بالبريد أو العنوان" className="pr-9" />
        </form>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="h-10 rounded-md border bg-background px-3 text-sm" aria-label="الحالة">
          <option value="">كل الحالات</option>
          {Object.entries(MAIL_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={kind} onChange={(e) => { setKind(e.target.value); setPage(1); }} className="h-10 rounded-md border bg-background px-3 text-sm" aria-label="النوع">
          <option value="">كل الأنواع</option>
          {Object.entries(labels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card">
        {log.isLoading ? (
          <div className="p-10 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" /></div>
        ) : log.isError ? (
          <div className="p-6 text-sm text-destructive">{apiErrorMessage(log.error)}</div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">مفيش إيميلات بالشروط دي.</div>
        ) : (
          <ul className="divide-y">
            {rows.map((r: MailLogRow) => (
              <li key={r.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", STATUS_STYLE[r.status])}>{MAIL_STATUS_LABELS[r.status] ?? r.status}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold">{labels[r.kind] ?? r.kind}</span>
                    {r.opened_at && <span className="text-[11px] text-emerald-700" title={when(r.opened_at)}><MailOpen className="inline h-3.5 w-3.5" /> اتفتح</span>}
                    {r.clicked_at && <span className="text-[11px] text-emerald-700"><MousePointerClick className="inline h-3.5 w-3.5" /> ضغط</span>}
                  </div>
                  <div className="mt-1 truncate text-sm font-bold">{r.subject}</div>
                  <div className="text-xs text-muted-foreground"><span dir="ltr">{r.to_email}</span> · {r.sent_at ? `اتبعت ${when(r.sent_at)}` : `اتسجل ${when(r.created_at)}`}{r.attempts > 1 ? ` · ${r.attempts} محاولات` : ""}</div>
                  {r.error && r.status !== "sent" && <div className="mt-1 line-clamp-2 text-[11px] text-red-600" dir="ltr">{r.error}</div>}
                </div>
                <div className="flex gap-1.5">
                  {Boolean(r.has_preview) && (
                    <Button variant="ghost" size="sm" onClick={() => preview.open(r.subject, () => mailAdminApi.logPreview(r.id))}><Eye className="h-4 w-4" /></Button>
                  )}
                  {canManage && (r.status === "failed" || r.status === "cancelled") && Boolean(r.has_preview) && (
                    <Button variant="ghost" size="sm" title="ابعتها تاني" onClick={() => act(() => mailAdminApi.retry(r.id))}><RotateCcw className="h-4 w-4" /></Button>
                  )}
                  {canManage && r.status === "queued" && (
                    <Button variant="ghost" size="sm" title="إلغاء" onClick={() => act(() => mailAdminApi.cancel(r.id))}><X className="h-4 w-4" /></Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {log.data && log.data.last_page > 1 && (
        <div className="flex items-center justify-center gap-2 text-sm">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>السابق</Button>
          <span>{page} من {log.data.last_page}</span>
          <Button variant="outline" size="sm" disabled={page >= log.data.last_page} onClick={() => setPage(page + 1)}>التالي</Button>
        </div>
      )}
      {preview.dialog}
    </div>
  );
}

/* ───────────── misbaha followers ───────────── */

function MisbahaTab({ canManage }: { canManage: boolean }) {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const list = useQuery({ queryKey: ["mail-misbaha", page], queryFn: () => mailAdminApi.misbahaFollowers(page) });
  const rows = list.data?.data ?? [];
  const remove = async (id: number) => {
    if (!(await askConfirm("مسح المتابع ده؟ مش هيوصله إيميلات عن السبحة تاني."))) return;
    try {
      await mailAdminApi.removeMisbahaFollower(id);
      toast.success("اتمسح");
      qc.invalidateQueries({ queryKey: ["mail-misbaha"] });
    } catch (e) { toast.error("تعذر", { description: apiErrorMessage(e) }); }
  };
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">الناس اللي كتبوا بريدهم في صفحة سبحة علشان يوصلهم خبر لما العداد يكمل وملخص كل جمعة. ما بيوصلهمش حاجة غير بعد ما يأكدوا من الإيميل.</p>
      <div className="overflow-hidden rounded-2xl border bg-card">
        {list.isLoading ? <div className="p-10 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" /></div>
          : rows.length === 0 ? <div className="p-10 text-center text-sm text-muted-foreground">لسه مفيش متابعين. الخانة ظاهرة تحت كل سبحة في الموقع.</div>
          : (
            <ul className="divide-y">
              {rows.map((r) => (
                <li key={r.id} className="flex items-center gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold" dir="ltr">{r.email}</div>
                    <div className="text-xs text-muted-foreground">
                      {r.room_slug ? <Link className="underline" to={`/misbaha/${r.room_slug}`} target="_blank">{r.room_name || r.room_slug}</Link> : "سبحة اتمسحت"}
                      {r.target_total ? ` · ${fmt(r.total_count)} / ${fmt(r.target_total)}` : ` · ${fmt(r.total_count)}`}
                    </div>
                  </div>
                  <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold",
                    r.unsubscribed_at ? "bg-zinc-100 text-zinc-600" : r.confirmed_at ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800")}>
                    {r.unsubscribed_at ? "ألغى" : r.confirmed_at ? "مؤكد" : "مستني التأكيد"}
                  </span>
                  {canManage && <Button variant="ghost" size="sm" onClick={() => remove(r.id)} aria-label="مسح"><Trash2 className="h-4 w-4" /></Button>}
                </li>
              ))}
            </ul>
          )}
      </div>
      {list.data && list.data.last_page > 1 && (
        <div className="flex items-center justify-center gap-2 text-sm">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>السابق</Button>
          <span>{page} من {list.data.last_page}</span>
          <Button variant="outline" size="sm" disabled={page >= list.data.last_page} onClick={() => setPage(page + 1)}>التالي</Button>
        </div>
      )}
    </div>
  );
}

/* ───────────── settings ───────────── */

function SettingsTab({ o, canManage }: { o: MailOverview; canManage: boolean }) {
  const qc = useQueryClient();
  const [limit, setLimit] = useState(String(o.settings.daily_limit));
  const [reserve, setReserve] = useState(String(o.settings.reserve));
  const [track, setTrack] = useState(o.settings.track);
  const save = useMutation({
    mutationFn: () => mailAdminApi.saveSettings({ daily_limit: Number(limit), reserve: Number(reserve), track }),
    onSuccess: () => { toast.success("اتحفظ"); qc.invalidateQueries({ queryKey: ["mail-overview"] }); },
    onError: (e) => toast.error("تعذر الحفظ", { description: apiErrorMessage(e) }),
  });
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="space-y-4 rounded-2xl border bg-card p-5">
        <h2 className="font-black">حدود الإرسال</h2>
        <label className="block space-y-1">
          <span className="text-sm font-bold">أقصى عدد رسايل في 24 ساعة</span>
          <Input type="number" min={1} max={2000} value={limit} onChange={(e) => setLimit(e.target.value)} disabled={!canManage} />
          <span className="block text-xs text-muted-foreground">خطة Starter Business Email بتسمح بـ 100. سيبها 95 علشان الهامش، ولو رقّيت الخطة زوّدها.</span>
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-bold">محجوز للرموز والإيصالات</span>
          <Input type="number" min={0} value={reserve} onChange={(e) => setReserve(e.target.value)} disabled={!canManage} />
          <span className="block text-xs text-muted-foreground">النشرة والملخص الأسبوعي بيقفوا قبل الرقم ده بكام رسالة ويكملوا تاني يوم.</span>
        </label>
        <label className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 p-3">
          <span><b className="block text-sm">عدّ الفتح والضغطات</b><span className="text-xs text-muted-foreground">صورة صغيرة غير مرئية وروابط بتعدّي على عدّاد. ما بتتطبقش على الرموز.</span></span>
          <Switch checked={track} onCheckedChange={setTrack} disabled={!canManage} />
        </label>
        {canManage && <Button onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending && <Loader2 className="ml-1 h-4 w-4 animate-spin" />} حفظ</Button>}
      </section>
      <section className="space-y-3 rounded-2xl border bg-card p-5 text-sm leading-7">
        <h2 className="font-black">الصناديق</h2>
        <div className="rounded-xl bg-muted/50 p-3"><b dir="ltr">{o.from}</b><div className="text-xs text-muted-foreground">الإرسال: كل الإيميلات بتطلع منه.</div></div>
        <div className="rounded-xl bg-muted/50 p-3"><b dir="ltr">{o.reply_to}</b><div className="text-xs text-muted-foreground">الدعم: أي حد يرد على إيميل، رده بيوصل هنا باسم «دعم مؤسسة اليسر». افتحه من Hostinger ← بريد ويب.</div></div>
        <p className="text-xs text-muted-foreground">SPF وDKIM وDMARC متظبطين على الدومين، فالرسايل بتوصل للوارد مش للمزعج. كل نشرة فيها رابط إلغاء اشتراك وزرار «إلغاء الاشتراك» اللي جيميل بيظهره فوق الرسالة.</p>
      </section>
    </div>
  );
}
