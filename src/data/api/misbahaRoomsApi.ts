/**
 * Shared misbaha: for someone who passed away, someone sick, or a group. Anyone with the link adds
 * to one shared total. Backend: backend-handoff/deploy-2026-11-02 (MisbahaRoomController).
 *
 *   POST /misbaha-rooms                  { kind, gender?, name, created_by?, target_total?, dhikr_id? } → room
 *   GET  /misbaha-rooms?per_page=12&kind=                               → latest visible rooms
 *   GET  /misbaha-rooms/stats                                           → { rooms, total } site-wide
 *   GET  /misbaha-rooms/{slug}                                          → room
 *   POST /misbaha-rooms/{slug}/count     { count: 1..500 }             → { total }
 */
import { apiFetch } from "@/data/laravelApi";
import { isEndpointMissing } from "./backendPending";

export type MisbahaKind = "deceased" | "sick" | "group";
export type MisbahaGender = "m" | "f";

export type MisbahaRoom = {
  slug: string;
  kind?: MisbahaKind;
  gender?: MisbahaGender | null;
  name: string;
  created_by: string | null;
  total_count: number;
  /** Optional shared goal chosen when the misbaha was created. */
  target_total?: number | null;
  /** Optional suggested dhikr (an id from src/data/adhkar.ts). */
  dhikr_id?: string | null;
  created_at: string;
};

const unwrap = (r: unknown): MisbahaRoom | null => {
  const d = (r as { data?: unknown })?.data ?? r;
  return d && typeof d === "object" && "slug" in (d as object) ? (d as MisbahaRoom) : null;
};

export const misbahaRoomsApi = {
  async create(input: { kind?: MisbahaKind; gender?: MisbahaGender; name: string; created_by?: string; target_total?: number; dhikr_id?: string }): Promise<MisbahaRoom> {
    const res = await apiFetch<unknown>("/misbaha-rooms", { method: "POST", body: input, skipAuthClear: true });
    const room = unwrap(res);
    if (!room) throw new Error("تعذر إنشاء السبحة، حاول مرة أخرى.");
    return room;
  },
  async get(slug: string): Promise<MisbahaRoom | null> {
    try {
      return unwrap(await apiFetch<unknown>(`/misbaha-rooms/${encodeURIComponent(slug)}`, { useCache: false, skipAuthClear: true }));
    } catch (err) {
      if (isEndpointMissing(err)) return null;
      throw err;
    }
  },
  async stats(): Promise<{ rooms: number; total: number } | null> {
    try {
      const res = await apiFetch<{ data?: { rooms?: number; total?: number } }>("/misbaha-rooms/stats", { useCache: false, skipAuthClear: true });
      const d = res?.data;
      return d && typeof d.total === "number" ? { rooms: Number(d.rooms) || 0, total: d.total } : null;
    } catch {
      return null;
    }
  },
  async list(perPage = 12, kind?: MisbahaKind): Promise<MisbahaRoom[]> {
    try {
      const res = await apiFetch<unknown>("/misbaha-rooms", { params: { per_page: perPage, kind }, useCache: false, skipAuthClear: true });
      const rows = (res as { data?: unknown })?.data ?? res;
      return Array.isArray(rows) ? (rows as MisbahaRoom[]) : [];
    } catch {
      return [];
    }
  },
  async add(slug: string, count: number): Promise<number | null> {
    const res = await apiFetch<{ total?: number; data?: { total?: number } }>(`/misbaha-rooms/${encodeURIComponent(slug)}/count`, {
      method: "POST",
      body: { count },
      skipAuthClear: true,
    });
    const total = res?.total ?? res?.data?.total;
    return typeof total === "number" ? total : null;
  },
};

export const MISBAHA_ROOMS_PENDING_AR = "السبح المشتركة قيد التفعيل على الخادم حاليًا. حاول بعد قليل، ويمكنك أن تسبّح هنا كالمعتاد حتى يتم تفعيلها.";
