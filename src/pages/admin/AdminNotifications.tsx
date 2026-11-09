import { useCallback, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { BellOff, BellRing, CheckCheck, ChevronLeft, ChevronRight, Loader2, Settings2, Trash2, Volume2, VolumeX } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdminNav } from "@/components/admin/adminNav";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/lib/notify";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { useNotifications } from "@/hooks/useNotifications";
import {
  deleteNotification,
  deleteReadNotifications,
  fetchNotificationsPage,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from "@/data/notifications/notificationsStore";
import { NOTIFICATION_CATEGORIES, typesOfCategory, type NotificationCategory } from "@/data/notifications/notificationLinks";
import { describeWriteError } from "@/data/api/backendPending";
import { disablePush, enablePush, getPushStatus, type PushStatus } from "@/lib/webPush";
import { isNotificationSoundEnabled, playNotificationSound, setNotificationSoundEnabled } from "@/lib/notificationSound";
import { NotificationsEmpty } from "@/components/notifications/NotificationsEmpty";
import { askConfirm } from "@/components/common/confirm";

/** What each kind brings, in one line (the «إيه اللي بيوصلك» card). */
const KIND_HINT: Record<NotificationCategory, string> = {
  donation: "كل تبرع جديد مستني تأكيد، وكل تبرع اتدفع.",
  case: "الحالات اللي بتتابعها: تعيينك عليها، وأي تبرع يوصلها.",
  review: "التعديلات اللي مستنية موافقة، ورد الإدارة على تعديلاتك.",
  team: "طلبات التطوع الجديدة، والتسجيل في حملات التطوع.",
  inbox: "رسائل «تواصل معنا» وطلبات الخبيئة.",
  user: "الحسابات الجديدة على الموقع.",
  program: "البرامج اللي وصلت لهدفها.",
  system: "التنبيهات المهمة، زي تغيير حسابات الاستلام.",
};

/** «النهارده» / «امبارح» / «الأحد، 8 نوفمبر». */
function dayLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((start(new Date()) - start(d)) / 86_400_000);
  if (days === 0) return "النهارده";
  if (days === 1) return "امبارح";
  return d.toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long", ...(days > 300 ? { year: "numeric" } : {}) });
}

/** Full notifications screen: the kinds that matter to this account, pages by day, read / delete, how they arrive. */
export default function AdminNotifications() {
  const { unreadCount } = useNotifications();
  const { navGroups } = useAdminNav();
  const [filter, setFilter] = useState<"all" | "unread" | NotificationCategory>("all");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<AppNotification[]>([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [push, setPush] = useState<PushStatus | "busy">("busy");
  const [soundOn, setSoundOn] = useState(isNotificationSoundEnabled);

  // Only the kinds this account can receive (from the sections it may open); «النظام» for everyone.
  const kinds = useMemo(() => {
    const sections = new Set(navGroups.flatMap((g) => g.items.map((i) => i.href)));
    return NOTIFICATION_CATEGORIES.filter((c) => c.sections.length === 0 || c.sections.some((s) => sections.has(s)));
  }, [navGroups]);

  useEffect(() => {
    void getPushStatus().then(setPush).catch(() => setPush("unsupported"));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetchNotificationsPage({
        page,
        unread: filter === "unread",
        types: filter !== "all" && filter !== "unread" ? typesOfCategory(filter) : undefined,
      });
      setRows(r.items);
      setMeta(r.meta);
    } catch (e) {
      toast.error(describeWriteError(e, "GET /notifications"));
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
    void load();
  }, [load]);

  const groups = useMemo(() => {
    const out: Array<{ day: string; items: AppNotification[] }> = [];
    for (const n of rows) {
      const day = dayLabel(n.created_at);
      const last = out[out.length - 1];
      if (last && last.day === day) last.items.push(n);
      else out.push({ day, items: [n] });
    }
    return out;
  }, [rows]);

  const open = (n: AppNotification) => {
    if (n.is_read) return;
    setRows((r) => r.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
    void markNotificationRead(n.id).catch((e) => toast.error(describeWriteError(e)));
  };

  const remove = async (n: AppNotification) => {
    setRows((r) => r.filter((x) => x.id !== n.id));
    try {
      await deleteNotification(n.id);
    } catch (e) {
      toast.error(describeWriteError(e));
      void load();
    }
  };

  const readAll = async () => {
    try {
      await markAllNotificationsRead();
      void load();
    } catch (e) {
      toast.error(describeWriteError(e));
    }
  };

  const clearRead = async () => {
    if (!await askConfirm("حذف كل الإشعارات المقروءة؟")) return;
    try {
      const n = await deleteReadNotifications();
      toast.success(`اتحذف ${n} إشعار`);
      void load();
    } catch (e) {
      toast.error(describeWriteError(e));
    }
  };

  /** Web Push: notifications on this device even when the site is closed. */
  const togglePush = async () => {
    const wasOn = push === "on";
    setPush("busy");
    try {
      const next = wasOn ? await disablePush() : await enablePush();
      setPush(next);
      if (next === "on") toast.success("تمام — هتوصلك الإشعارات على الجهاز ده حتى لو الموقع مقفول");
      else if (next === "denied") toast.error("المتصفح رافض الإشعارات. فعّلها من علامة القفل جنب عنوان الموقع، وبعدين جرّب تاني.");
    } catch (e) {
      setPush(wasOn ? "on" : "off");
      toast.error(describeWriteError(e, "POST /push/subscriptions"));
    }
  };

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setNotificationSoundEnabled(next);
    if (next) void playNotificationSound(true);
  };

  const chip = (key: typeof filter, label: string) => (
    <Button key={key} size="sm" variant={filter === key ? "default" : "outline"} className="h-8 shrink-0 rounded-full px-3 text-xs"
      aria-pressed={filter === key} onClick={() => { setFilter(key); setPage(1); }}>
      {label}
      {key === "unread" && unreadCount > 0 && <span className="ms-1.5 rounded-full bg-rose-600 px-1.5 text-[10px] font-black text-white">{unreadCount}</span>}
    </Button>
  );

  return (
    <AdminLayout>
      <Helmet><title>الإشعارات — Al-Yusr</title></Helmet>
      <div className="space-y-4" dir="rtl">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-primary">الإشعارات</h1>
            <p className="mt-1 text-sm text-muted-foreground">{unreadCount ? `${unreadCount} غير مقروء` : "كله مقروء"} · {meta.total} إشعار</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => void readAll()} disabled={!unreadCount}>
              <CheckCheck className="h-4 w-4" /> تعليم الكل كمقروء
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-destructive" onClick={() => void clearRead()}>
              <Trash2 className="h-4 w-4" /> حذف المقروء
            </Button>
          </div>
        </div>

        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_19rem]">
          <div className="min-w-0 space-y-3">
            {/* one row that scrolls sideways on phones instead of wrapping into a wall of buttons */}
            <div className="-mx-3 flex gap-1.5 overflow-x-auto px-3 pb-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0">
              {chip("all", "الكل")}
              {chip("unread", "غير مقروء")}
              {kinds.map((k) => chip(k.key, k.labelAr))}
            </div>

            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
              {loading ? (
                <div className="space-y-3 p-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex gap-3">
                      <Skeleton className="h-9 w-9 rounded-xl" />
                      <div className="flex-1 space-y-2"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-3 w-2/3" /></div>
                    </div>
                  ))}
                </div>
              ) : rows.length === 0 ? (
                <NotificationsEmpty text={filter === "unread" ? "مفيش إشعارات غير مقروءة" : "مفيش إشعارات هنا"} />
              ) : (
                groups.map((g) => (
                  <section key={g.day} aria-label={g.day}>
                    <h2 className="sticky top-0 z-[1] border-b border-border/60 bg-muted/60 px-4 py-1.5 text-[11px] font-black text-muted-foreground backdrop-blur">{g.day}</h2>
                    {g.items.map((n) => <NotificationItem key={n.id} n={n} onOpen={open} onDelete={(x) => void remove(x)} />)}
                  </section>
                ))
              )}
            </div>

            {meta.last_page > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button size="icon" variant="outline" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)} aria-label="السابق">
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <span className="text-sm font-bold">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : `${meta.current_page} / ${meta.last_page}`}</span>
                <Button size="icon" variant="outline" disabled={page >= meta.last_page || loading} onClick={() => setPage((p) => p + 1)} aria-label="التالي">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-0">
            <section className="rounded-2xl border border-border bg-card p-4 shadow-soft">
              <h2 className="flex items-center gap-2 text-sm font-black text-primary"><Settings2 className="h-4 w-4" /> توصلك إزاي</h2>
              <div className="mt-3 space-y-2">
                {push !== "unsupported" && (
                  <button type="button" onClick={() => void togglePush()} disabled={push === "busy"}
                    className="flex w-full items-center gap-3 rounded-xl bg-muted/40 p-3 text-start transition hover:bg-muted disabled:opacity-60">
                    {push === "busy" ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : push === "on" ? <BellRing className="h-4 w-4 shrink-0 text-emerald-600" /> : <BellOff className="h-4 w-4 shrink-0 text-muted-foreground" />}
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-extrabold text-foreground">إشعارات على الجهاز ده</span>
                      <span className="block text-[11px] text-muted-foreground">{push === "on" ? "شغالة — بتوصلك حتى لو الموقع مقفول" : push === "denied" ? "المتصفح رافضها — فعّلها من علامة القفل" : "متوقفة — دوس عشان تشغلها"}</span>
                    </span>
                  </button>
                )}
                <button type="button" onClick={toggleSound} className="flex w-full items-center gap-3 rounded-xl bg-muted/40 p-3 text-start transition hover:bg-muted">
                  {soundOn ? <Volume2 className="h-4 w-4 shrink-0 text-emerald-600" /> : <VolumeX className="h-4 w-4 shrink-0 text-muted-foreground" />}
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-extrabold text-foreground">صوت التنبيه</span>
                    <span className="block text-[11px] text-muted-foreground">{soundOn ? "شغال وانت فاتح الموقع" : "متوقف"}</span>
                  </span>
                </button>
              </div>
            </section>
            <section className="rounded-2xl border border-border bg-card p-4 shadow-soft">
              <h2 className="text-sm font-black text-primary">إيه اللي بيوصلك</h2>
              <ul className="mt-2 space-y-2">
                {kinds.map((k) => (
                  <li key={k.key} className="text-xs leading-5">
                    <span className="font-extrabold text-foreground">{k.labelAr}: </span>
                    <span className="text-muted-foreground">{KIND_HINT[k.key]}</span>
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </AdminLayout>
  );
}
