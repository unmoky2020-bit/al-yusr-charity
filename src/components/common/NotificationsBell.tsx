import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
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

/**
 * Header bell: unread badge + the latest notifications. The full list lives at `allHref`.
 * The box is drawn on <body> (a blurred header would trap a fixed box inside it): on phones it spans
 * the screen just under the header with a soft backdrop; from sm up it hangs under the bell.
 */
export const NotificationsBell = ({ allHref = "/admin/notifications", buttonClassName = DEFAULT_BUTTON }: BellProps = {}) => {
  const { lang } = useLang();
  const ar = lang === "ar";
  const { items, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(isNotificationSoundEnabled);
  const [pos, setPos] = useState({ top: 64, left: "auto", right: "auto" });
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  const place = () => {
    const b = button.current?.getBoundingClientRect();
    if (!b) return;
    const headerBottom = button.current?.closest("header")?.getBoundingClientRect().bottom ?? b.bottom;
    setPos({
      top: Math.round(Math.max(headerBottom, b.bottom) + 8),
      left: ar ? `${Math.max(12, Math.round(b.left))}px` : "auto",
      right: ar ? "auto" : `${Math.max(12, Math.round(window.innerWidth - b.right))}px`,
    });
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!panel.current?.contains(t) && !button.current?.contains(t)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onResize = () => setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setNotificationSoundEnabled(next);
    if (next) void playNotificationSound(true);
  };

  const box = (
    <>
      <div aria-hidden className="fixed inset-0 z-[59] bg-black/25 sm:hidden" />
      <div
        ref={panel}
        role="dialog"
        aria-label={ar ? "الإشعارات" : "Notifications"}
        dir={ar ? "rtl" : "ltr"}
        style={{ "--bell-top": `${pos.top}px`, "--bell-left": pos.left, "--bell-right": pos.right } as CSSProperties}
        className="fixed inset-x-3 top-[var(--bell-top)] z-[60] flex max-h-[calc(100dvh-var(--bell-top)-12px)] flex-col overflow-hidden rounded-2xl border border-border bg-card text-foreground shadow-2xl sm:left-[var(--bell-left)] sm:right-[var(--bell-right)] sm:max-h-[min(70vh,calc(100dvh-var(--bell-top)-16px))] sm:w-[24rem]"
      >
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5">
          <div className="text-sm font-extrabold text-primary">
            {ar ? "الإشعارات" : "Notifications"}
            {unreadCount > 0 && <span className="ms-2 rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-black text-rose-700">{unreadCount}</span>}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={toggleSound} title={ar ? (soundOn ? "إيقاف صوت الإشعارات" : "تشغيل صوت الإشعارات") : (soundOn ? "Mute notification sound" : "Play notification sound")}
              aria-label={ar ? "صوت الإشعارات" : "Notification sound"}
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
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {items.length === 0 ? (
            <NotificationsEmpty compact text={ar ? "لا توجد إشعارات" : "No notifications yet"} />
          ) : (
            items.map((n) => (
              <NotificationItem key={n.id} n={n} compact onOpen={(x) => { void markRead(x.id); if (x.link) setOpen(false); }} />
            ))
          )}
        </div>
        <Link to={allHref} onClick={() => setOpen(false)}
          className="block shrink-0 border-t border-border bg-muted/40 px-4 py-2.5 text-center text-xs font-black text-primary hover:bg-muted">
          {ar ? "عرض كل الإشعارات" : "See all notifications"}
        </Link>
      </div>
    </>
  );

  return (
    <div className="relative">
      <button
        ref={button}
        onClick={() => {
          if (!open) place();
          setOpen((v) => !v);
        }}
        aria-label={lang === "ar" ? "الإشعارات" : "Notifications"}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={`relative grid h-9 w-9 place-items-center rounded-lg border ${buttonClassName}`}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -end-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-600 px-1 text-[10px] font-black text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
      {open && typeof document !== "undefined" && createPortal(box, document.body)}
    </div>
  );
};

export default NotificationsBell;
