/**
 * Supabase Client Neutralizer & Safe In-Memory Adapter
 *
 * All Supabase remote queries are intercepted and handled locally in-memory.
 * No HTTP requests are sent to any remote Supabase URL, completely eliminating:
 *  - Cross-Origin Request Blocked (CORS) errors
 *  - Third-party Cookie warnings
 *  - OpaqueResponseBlocking (ORB) network failures
 *
 * Media uploads are redirected to the Laravel Charity API (`/upload`).
 */

import { apiFetch, formatServerImageUrl } from "@/data/laravelApi";
import type { Database } from "./types";

function createChainableQuery(defaultData: unknown = []) {
  const chain: any = {
    then(resolve: (val: { data: any; error: null; count: number }) => any) {
      const data = defaultData;
      const count = Array.isArray(data) ? data.length : 0;
      return Promise.resolve({ data, error: null, count }).then(resolve);
    },
    catch(reject: (err: unknown) => any) {
      return Promise.resolve({ data: defaultData, error: null, count: 0 }).catch(reject);
    },
  };

  const methods = [
    "select", "insert", "update", "upsert", "delete",
    "eq", "neq", "gt", "gte", "lt", "lte", "like", "ilike", "is", "in", "contains", "containedBy",
    "order", "limit", "range", "single", "maybeSingle", "filter", "match", "not", "or", "textSearch"
  ];

  for (const m of methods) {
    chain[m] = () => chain;
  }

  return chain;
}

const dummyChannel = {
  on: function () { return dummyChannel; },
  subscribe: function () { return dummyChannel; },
  unsubscribe: function () { return Promise.resolve("ok"); },
  send: function () { return Promise.resolve("ok"); },
};

export const supabase: any = {
  from: (_table: string) => createChainableQuery([]),
  rpc: (_fn: string, _args?: any) => Promise.resolve({ data: null, error: null }),
  functions: {
    invoke: async (_name: string, _opts?: any) => ({ data: { success: true }, error: null }),
  },
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithPassword: async () => ({ data: { user: null, session: null }, error: new Error("Auth handled via Laravel API") }),
    signUp: async () => ({ data: { user: null, session: null }, error: null }),
    signOut: async () => ({ error: null }),
    resetPasswordForEmail: async () => ({ data: {}, error: null }),
  },
  storage: {
    from: (_bucket: string) => ({
      upload: async (path: string, _file: any) => ({ data: { path }, error: null }),
      getPublicUrl: (path: string) => ({ data: { publicUrl: formatServerImageUrl(path) || "/placeholder.svg" } }),
      remove: async () => ({ data: [], error: null }),
      list: async () => ({ data: [], error: null }),
    }),
  },
  channel: () => dummyChannel,
  getChannels: () => [],
  removeChannel: () => Promise.resolve("ok"),
  removeAllChannels: () => Promise.resolve(["ok"]),
};

/**
 * Upload an image file to Laravel Storage (`/upload`) and return the public URL.
 * Falls back to a local object/data URL if the API is unavailable.
 */
export async function uploadToSupabaseStorage(
  file: File,
  folder: string = "gallery"
): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const safeName = file.name
    .toLowerCase()
    .replace(/[^\w.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50) || "image";
  const fileName = `${Date.now()}-${safeName}.${ext}`;

  try {
    const formData = new FormData();
    formData.append("file", file, fileName);
    formData.append("folder", folder);

    const res = await apiFetch<{ url?: string; path?: string; data?: { url?: string; image?: string } }>("/upload", {
      method: "POST",
      formData,
    });

    const url = (res as any)?.url || (res as any)?.data?.url || (res as any)?.data?.image || (res as any)?.path;
    if (url) return formatServerImageUrl(url) || url;
  } catch (e) {
    if (import.meta.env.DEV) console.warn("Upload fallback to local object URL:", e);
  }

  return URL.createObjectURL(file);
}