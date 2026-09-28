import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, CheckCheck, Inbox } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { useLang } from "@/i18n/LangContext";
import { toast } from "sonner";

const timeAgo = (iso: string, lang: "ar" | "en") => {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return lang === "ar" ? "الآن" : "now";
  if (m < 60) return lang === "ar" ? `منذ ${m} د` : `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return lang === "ar" ? `منذ ${h} س` : `${h}h ago`;
  const d = Math.floor(h / 24);
  return lang === "ar" ? `منذ ${d} يوم` : `${d}d ago`;
};

export const NotificationsBell = () => {
  const { lang } = useLang();
  const { items, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const lastSeenId = useRef<string | null>(null);

  // Toast on new notification
  useEffect(() => {
    if (!items.length) return;
    const newest = items[0];
    if (lastSeenId.current && newest.id !== lastSeenId.current && !newest.is_read) {
      const title = lang === "ar" ? newest.title_ar : newest.title_en;
      const desc = lang === "ar" ? newest.message_ar : newest.message_en;
      if (newest.type === "success") toast.success(title, { description: desc });
      else if (newest.type === "error") toast.error(title, { description: desc });
      else toast(title, { description: desc });
    }
    lastSeenId.current = newest.id;
  }, [items, lang]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={lang === "ar" ? "الإشعارات" : "Notifications"}
        className="relative grid h-9 w-9 place-items-center rounded-lg border border-secondary/30 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -end-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-600 px-1 text-[10px] font-black text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute end-0 mt-2 w-[22rem] max-w-[92vw] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl z-50"
          dir={lang === "ar" ? "rtl" : "ltr"}
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <div className="text-sm font-extrabold text-primary">
              {lang === "ar" ? "الإشعارات" : "Notifications"}
              {unreadCount > 0 && (
                <span className="ms-2 rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-black text-rose-700">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => void markAllRead()}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                {lang === "ar" ? "تعليم الكل كمقروء" : "Mark all read"}
              </button>
            )}
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 p-8 text-center text-sm text-muted-foreground">
                <Inbox className="h-8 w-8 opacity-50" />
                {lang === "ar" ? "لا توجد إشعارات بعد" : "No notifications yet"}
              </div>
            ) : (
              items.map((n) => {
                const title = lang === "ar" ? n.title_ar : n.title_en;
                const msg = lang === "ar" ? n.message_ar : n.message_en;
                const dot =
                  n.type === "success" ? "bg-emerald-500"
                  : n.type === "error" ? "bg-rose-500"
                  : "bg-primary";
                const inner = (
                  <div className={`flex gap-3 px-4 py-3 transition hover:bg-muted/60 ${!n.is_read ? "bg-secondary/10" : ""}`}>
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <div className="truncate text-sm font-extrabold text-primary">{title}</div>
                        <div className="shrink-0 text-[10px] text-muted-foreground">{timeAgo(n.created_at, lang)}</div>
                      </div>
                      {msg && <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{msg}</div>}
                    </div>
                  </div>
                );
                return (
                  <div key={n.id} className="border-b border-border/50 last:border-0">
                    {n.link ? (
                      <Link to={n.link} onClick={() => { void markRead(n.id); setOpen(false); }}>
                        {inner}
                      </Link>
                    ) : (
                      <button onClick={() => void markRead(n.id)} className="block w-full text-start">{inner}</button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsBell;