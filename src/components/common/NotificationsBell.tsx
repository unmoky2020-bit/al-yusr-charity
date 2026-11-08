import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, CheckCheck, Volume2, VolumeX } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { useLang } from "@/i18n/LangContext";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { isNotificationSoundEnabled, playNotificationSound, setNotificationSoundEnabled } from "@/lib/notificationSound";
import { NotificationsEmpty } from "@/components/notifications/NotificationsEmpty";

type BellProps = {
  /** Where «عرض كل الإشعارات» goes: the dashboard inbox for staff, the donor's own page for donors. */
  allHref?: string;
  /** Extra classes for the round button, so the bell matches the header it sits in. */
  buttonClassName?: string;
};

const DEFAULT_BUTTON = "border-secondary/30 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20";

/** Header bell: unread badge + the latest notifications. The full list lives at `allHref`. */
export const NotificationsBell = ({ allHref = "/admin/notifications", buttonClassName = DEFAULT_BUTTON }: BellProps = {}) => {
  const { lang } = useLang();
  const ar = lang === "ar";
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
        className={`relative grid h-9 w-9 place-items-center rounded-lg border ${buttonClassName}`}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -end-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-600 px-1 text-[10px] font-black text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute end-0 z-[60] mt-2 w-[24rem] max-w-[92vw] overflow-hidden rounded-2xl border border-border bg-card text-foreground shadow-2xl" dir={ar ? "rtl" : "ltr"}>
          <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5">
            <div className="text-sm font-extrabold text-primary">
              {ar ? "الإشعارات" : "Notifications"}
              {unreadCount > 0 && <span className="ms-2 rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-black text-rose-700">{unreadCount}</span>}
            </div>
            <div className="flex items-center gap-1">
              <button onClick={toggleSound} title={ar ? (soundOn ? "إيقاف صوت الإشعارات" : "تشغيل صوت الإشعارات") : (soundOn ? "Mute notification sound" : "Play notification sound")}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
                {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>
              {unreadCount > 0 && (
                <button onClick={() => void markAllRead()} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-primary hover:bg-muted">
                  <CheckCheck className="h-3.5 w-3.5" /> {ar ? "تعليم الكل كمقروء" : "Mark all read"}
                </button>
              )}
            </div>
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {items.length === 0 ? (
              <NotificationsEmpty compact text={ar ? "لا توجد إشعارات" : "No notifications yet"} />
            ) : (
              items.map((n) => (
                <NotificationItem key={n.id} n={n} compact onOpen={(x) => { void markRead(x.id); if (x.link) setOpen(false); }} />
              ))
            )}
          </div>
          <Link to={allHref} onClick={() => setOpen(false)}
            className="block border-t border-border bg-muted/40 px-4 py-2.5 text-center text-xs font-black text-primary hover:bg-muted">
            {ar ? "عرض كل الإشعارات" : "See all notifications"}
          </Link>
        </div>
      )}
    </div>
  );
};

export default NotificationsBell;
