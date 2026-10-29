import { useEffect, useSyncExternalStore } from "react";
import {
  getNotificationsState,
  markAllNotificationsRead,
  markNotificationRead,
  deleteNotification,
  startNotifications,
  subscribeNotifications,
} from "@/data/notifications/notificationsStore";

export type { AppNotification } from "@/data/notifications/notificationsStore";

/**
 * Notifications for any dashboard screen. All callers share one store and one poller
 * (src/data/notifications/notificationsStore.ts).
 */
export function useNotifications() {
  const state = useSyncExternalStore(subscribeNotifications, getNotificationsState);
  useEffect(() => startNotifications(), []);
  return {
    items: state.items,
    unreadCount: state.unread,
    loaded: state.loaded,
    markRead: markNotificationRead,
    markAllRead: markAllNotificationsRead,
    remove: deleteNotification,
  };
}
