/**
 * One notifications store for the whole dashboard (the bell, the page, any badge share it), so
 * navigating between screens never starts a second poller or re-announces old notifications.
 *
 * Freshness: a cheap GET /notifications/unread-count every 15 s while the tab is visible (60 s when
 * hidden). Only when `latest.id` changes is the list re-fetched; a new notification then plays the
 * chime and shows a toast. System notifications (also with the site closed) come from Web Push:
 * the backend pushes every notification and public/sw.js shows it (src/lib/webPush.ts).
 */
import { toast } from "sonner";
import { apiFetch, ApiError } from "@/data/laravelApi";
import { playNotificationSound } from "@/lib/notificationSound";
import { refreshPushSubscription } from "@/lib/webPush";
import { notificationLink, notificationTypeInfo, type NotificationCategory } from "./notificationLinks";

export interface AppNotification {
  id: string;
  type: string;
  category: NotificationCategory;
  title: string;
  message: string;
  link: string | null;
  severity: "info" | "success" | "warning" | string;
  is_read: boolean;
  created_at: string;
}

type Row = {
  id: string;
  type?: string;
  title?: string;
  message?: string;
  url?: string | null;
  severity?: string;
  data?: Record<string, unknown>;
  read_at?: string | null;
  created_at?: string;
};

export function mapNotification(r: Row): AppNotification {
  const data = r.data ?? {};
  const type = String(r.type ?? data.type ?? "info");
  return {
    id: String(r.id),
    type,
    category: notificationTypeInfo(type).category,
    title: String(r.title ?? data.title ?? ""),
    message: String(r.message ?? data.message ?? ""),
    link: notificationLink(type, (r.url ?? (data.url as string | undefined)) ?? null, data),
    severity: String(r.severity ?? data.severity ?? "info"),
    is_read: Boolean(r.read_at),
    created_at: String(r.created_at ?? ""),
  };
}

interface State {
  items: AppNotification[];
  unread: number;
  loaded: boolean;
}

const VISIBLE_POLL_MS = 15_000;
const HIDDEN_POLL_MS = 60_000;
const BELL_SIZE = 15;

let state: State = { items: [], unread: 0, loaded: false };
let latestId: string | null = null;
let timer: number | undefined;
let subscribers = 0;
const listeners = new Set<() => void>();

const emit = (patch: Partial<State>) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};

export const getNotificationsState = () => state;

export function subscribeNotifications(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

async function fetchBellList() {
  const res = await apiFetch<{ data?: Row[]; unread_count?: number }>("/notifications", {
    params: { per_page: BELL_SIZE },
    useCache: false,
  });
  emit({ items: (res.data ?? []).map(mapNotification), unread: res.unread_count ?? state.unread, loaded: true });
}

function announce(n: AppNotification) {
  void playNotificationSound();
  toast(n.title, { description: n.message });
}

async function poll() {
  try {
    const res = await apiFetch<{ unread_count?: number; latest?: { id: string } | null }>("/notifications/unread-count", { useCache: false });
    const newest = res.latest?.id ?? null;
    if (!state.loaded || newest !== latestId) {
      const isNew = state.loaded && newest !== null && newest !== latestId;
      latestId = newest;
      await fetchBellList();
      if (isNew && state.items[0] && !state.items[0].is_read) announce(state.items[0]);
    } else if (typeof res.unread_count === "number" && res.unread_count !== state.unread) {
      emit({ unread: res.unread_count });
    }
  } catch (e) {
    // Signed out / token expired: stop polling until a screen subscribes again.
    if (e instanceof ApiError && e.status === 401) stopPolling();
  } finally {
    schedule();
  }
}

function schedule() {
  if (!subscribers) return;
  window.clearTimeout(timer);
  timer = window.setTimeout(() => void poll(), typeof document !== "undefined" && document.hidden ? HIDDEN_POLL_MS : VISIBLE_POLL_MS);
}

function stopPolling() {
  window.clearTimeout(timer);
  timer = undefined;
}

const onVisible = () => {
  if (!document.hidden && subscribers) void poll();
};

/** Called by every screen that shows notifications; returns the cleanup. */
export function startNotifications(): () => void {
  subscribers += 1;
  if (subscribers === 1) {
    document.addEventListener("visibilitychange", onVisible);
    void poll();
    // Link this browser's push subscription to whoever is signed in now.
    void refreshPushSubscription();
  }
  return () => {
    subscribers -= 1;
    if (subscribers === 0) {
      stopPolling();
      document.removeEventListener("visibilitychange", onVisible);
    }
  };
}

/** Clears everything on sign-out so the next user never sees the previous user's notifications. */
export function resetNotifications() {
  stopPolling();
  latestId = null;
  emit({ items: [], unread: 0, loaded: false });
}

export async function markNotificationRead(id: string) {
  const target = state.items.find((n) => n.id === id);
  if (target && !target.is_read) {
    emit({ items: state.items.map((n) => (n.id === id ? { ...n, is_read: true } : n)), unread: Math.max(0, state.unread - 1) });
  }
  await apiFetch(`/notifications/${id}/read`, { method: "PATCH" });
}

export async function markAllNotificationsRead() {
  emit({ items: state.items.map((n) => ({ ...n, is_read: true })), unread: 0 });
  await apiFetch("/notifications/read-all", { method: "PATCH" });
}

export async function deleteNotification(id: string) {
  const wasUnread = state.items.some((n) => n.id === id && !n.is_read);
  emit({ items: state.items.filter((n) => n.id !== id), unread: wasUnread ? Math.max(0, state.unread - 1) : state.unread });
  await apiFetch(`/notifications/${id}`, { method: "DELETE" });
}

export async function deleteReadNotifications() {
  const res = await apiFetch<{ deleted?: number }>("/notifications/read", { method: "DELETE" });
  emit({ items: state.items.filter((n) => !n.is_read) });
  return res.deleted ?? 0;
}

/** One page of the full list (the notifications screen). */
export async function fetchNotificationsPage(params: { page: number; unread?: boolean; type?: string; perPage?: number }) {
  const res = await apiFetch<{ data?: Row[]; meta?: { current_page: number; last_page: number; total: number }; unread_count?: number }>(
    "/notifications",
    { params: { page: params.page, per_page: params.perPage ?? 25, unread: params.unread ? 1 : undefined, type: params.type || undefined }, useCache: false },
  );
  if (typeof res.unread_count === "number") emit({ unread: res.unread_count });
  return { items: (res.data ?? []).map(mapNotification), meta: res.meta ?? { current_page: 1, last_page: 1, total: 0 } };
}
