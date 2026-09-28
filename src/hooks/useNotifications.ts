import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/auth/AuthContext";

export type Notification = {
  id: string;
  user_id: string;
  type: string;
  title_ar: string;
  title_en: string;
  message_ar: string;
  message_en: string;
  link: string | null;
  entity_type: string | null;
  entity_id: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
};

const STORAGE_KEY = "alyusr_local_notifications";

export function useNotifications(limit = 20) {
  const { user } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    if (!user?.id) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_${user.id}`);
      if (stored) {
        const parsed = JSON.parse(stored) as Notification[];
        setItems(Array.isArray(parsed) ? parsed.slice(0, limit) : []);
      } else {
        // Welcome notification
        const welcome: Notification = {
          id: "welcome-1",
          user_id: user.id,
          type: "success",
          title_ar: "مرحباً بك في لوحة تحكم اليسر",
          title_en: "Welcome to Al-Yusr Dashboard",
          message_ar: "تم ربط حسابك بنجاح مع Laravel API v1.",
          message_en: "Your account is connected to Laravel API v1.",
          link: "/admin/api-integration",
          entity_type: "system",
          entity_id: null,
          is_read: false,
          read_at: null,
          created_at: new Date().toISOString(),
        };
        setItems([welcome]);
        localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify([welcome]));
      }
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, limit]);

  useEffect(() => {
    load();
  }, [load]);

  const unreadCount = items.filter((i) => !i.is_read).length;

  const markRead = async (id: string) => {
    setItems((prev) => {
      const next = prev.map((n) =>
        n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
      );
      if (user?.id) {
        try {
          localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(next));
        } catch {}
      }
      return next;
    });
  };

  const markAllRead = async () => {
    if (!user?.id) return;
    const now = new Date().toISOString();
    setItems((prev) => {
      const next = prev.map((n) => ({ ...n, is_read: true, read_at: now }));
      try {
        localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  return { items, loading, unreadCount, reload: load, markRead, markAllRead };
}