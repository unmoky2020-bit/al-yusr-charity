import { Link } from "react-router-dom";
import { Bell, ChevronLeft, ChevronRight } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { NotificationsEmpty } from "@/components/notifications/NotificationsEmpty";

/** «آخر الإشعارات» on the dashboard home: the newest few (shared store with the header bell). */
export function LatestNotificationsCard({ lang, count = 4 }: { lang: "ar" | "en"; count?: number }) {
  const ar = lang === "ar";
  const { items, unreadCount, loaded, markRead } = useNotifications();
  const More = ar ? ChevronLeft : ChevronRight;
  return (
    <section className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-soft">
      <header className="flex items-center justify-between gap-2 border-b border-border/60 px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-black text-primary">
          <Bell className="h-4 w-4" />
          {ar ? "آخر الإشعارات" : "Latest notifications"}
          {unreadCount > 0 && <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-black text-rose-700">{unreadCount}</span>}
        </h3>
        <Link to="/admin/notifications" className="inline-flex items-center gap-0.5 text-xs font-bold text-accent hover:underline">
          {ar ? "الكل" : "All"}<More className="h-3.5 w-3.5" />
        </Link>
      </header>
      {!loaded ? (
        <div className="space-y-3 p-4" aria-busy="true">
          {[0, 1, 2].map((i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : items.length === 0 ? (
        <NotificationsEmpty compact text={ar ? "مفيش إشعارات لسه" : "No notifications yet"} />
      ) : (
        <div>{items.slice(0, count).map((n) => <NotificationItem key={n.id} n={n} compact onOpen={(x) => void markRead(x.id)} />)}</div>
      )}
    </section>
  );
}
