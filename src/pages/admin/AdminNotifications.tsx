import { useCallback, useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { BellOff, BellRing, CheckCheck, ChevronLeft, ChevronRight, Inbox, Loader2, Trash2 } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
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
import { NOTIFICATION_TYPES } from "@/data/notifications/notificationLinks";
import { describeWriteError } from "@/data/api/backendPending";
import { disablePush, enablePush, getPushStatus, type PushStatus } from "@/lib/webPush";

const FILTERS = [
  { key: "all", label: "الكل" },
  { key: "unread", label: "غير مقروء" },
  ...Object.entries(NOTIFICATION_TYPES)
    .filter(([type]) => type !== "welcome")
    .map(([type, info]) => ({ key: type, label: info.labelAr })),
];

/** Full notifications screen: filters, pages, read / delete, sound and desktop alerts. */
export default function AdminNotifications() {
  const { unreadCount } = useNotifications();
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<AppNotification[]>([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [push, setPush] = useState<PushStatus | "busy">("busy");

  useEffect(() => {
    void getPushStatus().then(setPush).catch(() => setPush("unsupported"));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetchNotificationsPage({ page, unread: filter === "unread", type: filter !== "all" && filter !== "unread" ? filter : undefined });
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
    if (!window.confirm("حذف كل الإشعارات المقروءة؟")) return;
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

  return (
    <AdminLayout>
      <Helmet><title>الإشعارات — Al-Yusr</title></Helmet>
      <div className="space-y-4" dir="rtl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-primary">الإشعارات</h1>
            <p className="mt-1 text-sm text-muted-foreground">{unreadCount} غير مقروء من {meta.total}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {push !== "unsupported" && (
              <Button variant={push === "on" ? "outline" : "default"} size="sm" className="gap-1.5" disabled={push === "busy"} onClick={() => void togglePush()}
                title="إشعارات على الجهاز ده حتى لو الموقع أو المتصفح مقفول">
                {push === "busy" ? <Loader2 className="h-4 w-4 animate-spin" /> : push === "on" ? <BellOff className="h-4 w-4" /> : <BellRing className="h-4 w-4" />}
                {push === "on" ? "إيقاف إشعارات الجهاز" : "تفعيل إشعارات الجهاز"}
              </Button>
            )}
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => void readAll()} disabled={!unreadCount}>
              <CheckCheck className="h-4 w-4" /> تعليم الكل كمقروء
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-destructive" onClick={() => void clearRead()}>
              <Trash2 className="h-4 w-4" /> حذف المقروء
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <Button key={f.key} size="sm" variant={filter === f.key ? "default" : "outline"} className="rounded-full"
              onClick={() => { setFilter(f.key); setPage(1); }}>
              {f.label}
            </Button>
          ))}
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
            <div className="flex flex-col items-center gap-2 p-12 text-center text-sm text-muted-foreground">
              <Inbox className="h-10 w-10 opacity-50" /> لا توجد إشعارات هنا
            </div>
          ) : (
            rows.map((n) => <NotificationItem key={n.id} n={n} onOpen={open} onDelete={(x) => void remove(x)} />)
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
    </AdminLayout>
  );
}
