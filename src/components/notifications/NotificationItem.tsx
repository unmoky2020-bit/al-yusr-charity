import { Link } from "react-router-dom";
import { Bell, HandCoins, Inbox, Target, Trash2, UserPlus } from "lucide-react";
import type { AppNotification } from "@/data/notifications/notificationsStore";
import type { NotificationCategory } from "@/data/notifications/notificationLinks";

const ICONS: Record<NotificationCategory, typeof Bell> = {
  donation: HandCoins,
  user: UserPlus,
  program: Target,
  inbox: Inbox,
  system: Bell,
};

const TONES: Record<string, string> = {
  success: "bg-emerald-500/15 text-emerald-700",
  warning: "bg-amber-500/15 text-amber-700",
  info: "bg-primary/10 text-primary",
};

export const timeAgoAr = (iso: string) => {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return "الآن";
  if (m < 60) return `منذ ${m} د`;
  const h = Math.floor(m / 60);
  if (h < 24) return `منذ ${h} س`;
  const d = Math.floor(h / 24);
  return d < 30 ? `منذ ${d} يوم` : new Date(iso).toLocaleDateString("ar-EG");
};

/** One notification row; used by the bell dropdown and the notifications page. */
export function NotificationItem({
  n,
  onOpen,
  onDelete,
  compact,
}: {
  n: AppNotification;
  onOpen: (n: AppNotification) => void;
  onDelete?: (n: AppNotification) => void;
  compact?: boolean;
}) {
  const Icon = ICONS[n.category] ?? Bell;
  const body = (
    <div className={`flex gap-3 ${compact ? "px-4 py-3" : "p-4"} transition hover:bg-muted/60 ${!n.is_read ? "bg-secondary/10" : ""}`}>
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${TONES[n.severity] ?? TONES.info}`}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <div className={`truncate text-sm ${n.is_read ? "font-bold text-foreground/80" : "font-black text-primary"}`}>{n.title}</div>
          <div className="shrink-0 text-[10px] text-muted-foreground">{timeAgoAr(n.created_at)}</div>
        </div>
        {n.message && <div className={`mt-0.5 text-xs text-muted-foreground ${compact ? "line-clamp-2" : ""}`}>{n.message}</div>}
      </div>
      {!n.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-rose-500" aria-label="غير مقروء" />}
    </div>
  );
  return (
    <div className="group relative border-b border-border/50 last:border-0">
      {n.link ? (
        <Link to={n.link} onClick={() => onOpen(n)} className="block">{body}</Link>
      ) : (
        <button type="button" onClick={() => onOpen(n)} className="block w-full text-start">{body}</button>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={() => onDelete(n)}
          aria-label="حذف الإشعار"
          className="absolute bottom-2 end-3 hidden rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive group-hover:block"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
