import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, CheckCheck, Inbox, Volume2, VolumeX } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { useLang } from "@/i18n/LangContext";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { isNotificationSoundEnabled, playNotificationSound, setNotificationSoundEnabled } from "@/lib/notificationSound";

/** Header bell: unread badge + the latest notifications. The full list lives at /admin/notifications. */
export const NotificationsBell = () => {
  const { lang } = useLang();
  const { items, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(isNotificationSoundEnabled);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setNotificationSoundEnabled(next);
    if (next) void playNotificationSound(true);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={lang === "ar" ? "الإشعارات" : "Notifications"}
        aria-expanded={open}
        className="relative grid h-9 w-9 place-items-center rounded-lg border border-secondary/30 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -end-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-600 px-1 text-[10px] font-black text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute end-0 z-[60] mt-2 w-[24rem] max-w-[92vw] overflow-hidden rounded-2xl border border-border bg-card text-foreground shadow-2xl" dir="rtl">
          <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5">
            <div className="text-sm font-extrabold text-primary">
              الإشعارات
              {unreadCount > 0 && <span className="ms-2 rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-black text-rose-700">{unreadCount}</span>}
            </div>
            <div className="flex items-center gap-1">
              <button onClick={toggleSound} title={soundOn ? "إيقاف صوت الإشعارات" : "تشغيل صوت الإشعارات"}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
                {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>
              {unreadCount > 0 && (
                <button onClick={() => void markAllRead()} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-primary hover:bg-muted">
                  <CheckCheck className="h-3.5 w-3.5" /> تعليم الكل كمقروء
                </button>
              )}
            </div>
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 p-8 text-center text-sm text-muted-foreground">
                <Inbox className="h-8 w-8 opacity-50" /> لا توجد إشعارات
              </div>
            ) : (
              items.map((n) => (
                <NotificationItem key={n.id} n={n} compact onOpen={(x) => { void markRead(x.id); if (x.link) setOpen(false); }} />
              ))
            )}
          </div>
          <Link to="/admin/notifications" onClick={() => setOpen(false)}
            className="block border-t border-border bg-muted/40 px-4 py-2.5 text-center text-xs font-black text-primary hover:bg-muted">
            عرض كل الإشعارات
          </Link>
        </div>
      )}
    </div>
  );
};

export default NotificationsBell;
