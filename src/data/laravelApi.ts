/**
 * Laravel Charity API Client (v1) — High Performance & Cached
 *
 * Base URL: https://elyusr-api.pyramedx.com/api/v1
 * Authentication: Laravel Sanctum Bearer Token stored in localStorage (`alyusr_api_token`).
 * Performance: In-memory cache + Request deduplication + Fast SWR (Stale-While-Revalidate).
 */

export const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "/api/v1"
    : "https://elyusr-api.pyramedx.com/api/v1");

export const TOKEN_STORAGE_KEY = "alyusr_api_token";

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;
  data?: unknown;

  constructor(message: string, status: number, errors?: Record<string, string[]>, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
    this.data = data;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// In-Memory Fast Cache & Request Deduplication
// ─────────────────────────────────────────────────────────────────────────────

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();
const pendingRequests = new Map<string, Promise<unknown>>();

export function invalidateApiCache(prefix?: string): void {
  if (!prefix) {
    memoryCache.clear();
    return;
  }
  for (const key of memoryCache.keys()) {
    if (key.includes(prefix)) {
      memoryCache.delete(key);
    }
  }
}

/** @internal Used only as anonymous read-only fallback for public API calls. NEVER use for auth checks. */
const DEFAULT_API_TOKEN = import.meta.env.VITE_LARAVEL_READONLY_API_TOKEN ?? "";

/**
 * Returns the authenticated user's saved token, or null if the user is not logged in.
 * Anonymous visitors get null — they are never auto-assigned the default admin token.
 */
export function getApiToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem(TOKEN_STORAGE_KEY);
    // Reject old/invalid tokens that were persisted from previous sessions
    if (saved && saved.trim() && saved.startsWith("Bearer ")) return null;
    // Reject and purge default fallback token if it was ever saved to storage
    if (saved && saved.trim() === DEFAULT_API_TOKEN) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      return null;
    }
    if (saved && saved.trim()) return saved.trim();
    return null;
  } catch {
    return null;
  }
}

export function setApiToken(token: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    invalidateApiCache("/profile");
  } catch {}
}

export function clearApiToken(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    invalidateApiCache();
  } catch {}
}

export function getCurrentLang(): "ar" | "en" {
  if (typeof window === "undefined") return "ar";
  try {
    const saved = localStorage.getItem("alyusr_lang");
    if (saved === "en" || saved === "ar") return saved;
  } catch {}
  return "ar";
}

/** Formats image URL to a clean server URL, stripping any mock internal domains */
export function formatServerImageUrl(url?: string | null): string {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.includes("elyusr-local-mock.internal")) return "";

  // In development mode, proxy through Vite to prevent CORS, OpaqueResponseBlocking (ORB), and cross-site cookie warnings
  if (import.meta.env.DEV && trimmed.startsWith("https://elyusr-api.pyramedx.com/")) {
    return trimmed.replace("https://elyusr-api.pyramedx.com", "");
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    return trimmed;
  }
  const clean = trimmed.replace(/^\/+/, "");
  const base = import.meta.env.DEV ? "" : "https://elyusr-api.pyramedx.com";
  return clean.startsWith("storage/")
    ? `${base}/${clean}`
    : `${base}/storage/${clean}`;
}

export const resolveStorageUrl = formatServerImageUrl;

export interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  params?: Record<string, unknown>;
  token?: string | null;
  skipAuthClear?: boolean;
  useCache?: boolean;
  ttlMs?: number;
}

/** Core fetch wrapper for Laravel Charity API with fast in-memory caching and deduplication */
export async function apiFetch<T = unknown>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const {
    params,
    body,
    token: explicitToken,
    headers: customHeaders,
    skipAuthClear,
    useCache = true,
    ttlMs = 45000, // 45 seconds cache by default for GET
    ...customOptions
  } = options;

  const method = (customOptions.method || "GET").toUpperCase();
  let url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  if (params && Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        searchParams.append(key, String(val));
      }
    });
    const qs = searchParams.toString();
    if (qs) {
      url += (url.includes("?") ? "&" : "?") + qs;
    }
  }

  // Use user's explicit token, or the anonymous read-only fallback for public API calls
  const token = explicitToken !== undefined ? explicitToken : (getApiToken() ?? DEFAULT_API_TOKEN);
  const lang = getCurrentLang();
  const cacheKey = `${method}:${url}:${token || "anon"}:${lang}`;

  // Serve from memory cache for GET if still fresh
  if (method === "GET" && useCache) {
    const cached = memoryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data as T;
    }

    // Deduplicate in-flight concurrent requests for the exact same URL
    if (pendingRequests.has(cacheKey)) {
      return pendingRequests.get(cacheKey) as Promise<T>;
    }
  }

  // Mutating methods (POST/PUT/DELETE/PATCH) invalidate related cache
  if (method !== "GET") {
    const resourcePrefix = endpoint.split("/")[1] || endpoint;
    invalidateApiCache(resourcePrefix);
  }

  const fetchPromise = (async () => {
    const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
    const headers = new Headers(customHeaders || {});
    headers.set("Accept", "application/json");
    headers.set("Accept-Language", lang);

    if (!isFormData && !headers.has("Content-Type") && body !== undefined) {
      headers.set("Content-Type", "application/json");
    }

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    let finalBody: BodyInit | undefined = undefined;
    if (body !== undefined) {
      if (isFormData) {
        finalBody = body as FormData;
      } else if (typeof body === "string") {
        finalBody = body;
      } else {
        finalBody = JSON.stringify(body);
      }
    }

    let res: Response;
    try {
      res = await fetch(url, {
        ...customOptions,
        method,
        headers,
        body: finalBody,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error";
      throw new ApiError(`تعذر الاتصال بالخادم: ${msg}`, 0);
    }


    if (res.status === 401 && !skipAuthClear) {
      if (typeof window !== "undefined") {
        const storedExplicit = localStorage.getItem(TOKEN_STORAGE_KEY);
        // Only dispatch unauthorized + clear if there was a real user token (not empty)
        if (storedExplicit && storedExplicit.trim()) {
          clearApiToken();
          window.dispatchEvent(new CustomEvent("auth:unauthorized"));
        }
      }
    }

    // Parse response
    let json: unknown = null;
    const text = await res.text();
    if (text) {
      try {
        json = JSON.parse(text);
      } catch {
        json = { raw: text };
      }
    }

    if (!res.ok) {
      const errorObj = json as { message?: string; error?: string; errors?: Record<string, string[]> } | null;
      let message = errorObj?.message || errorObj?.error || `HTTP error ${res.status}`;
      if (errorObj?.errors) {
        const firstKey = Object.keys(errorObj.errors)[0];
        if (firstKey && errorObj.errors[firstKey]?.length) {
          message = `${message}: ${errorObj.errors[firstKey][0]}`;
        }
      }
      throw new ApiError(message, res.status, errorObj?.errors, json);
    }

    // Cache successful GET responses
    if (method === "GET" && useCache) {
      memoryCache.set(cacheKey, {
        data: json,
        timestamp: Date.now(),
        ttl: ttlMs,
      });
    }

    return json as T;
  })();

  if (method === "GET" && useCache) {
    pendingRequests.set(cacheKey, fetchPromise);
    fetchPromise
      .finally(() => {
        pendingRequests.delete(cacheKey);
      })
      .catch(() => {});
  }

  return fetchPromise;
}

// ─────────────────────────────────────────────────────────────────────────────
// Resource Factory for standard Laravel CRUD
// ─────────────────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total?: number;
  current_page?: number;
  last_page?: number;
  per_page?: number;
}

export function resource<T = Record<string, unknown>>(basePath: string) {
  const cleanPath = basePath.startsWith("/") ? basePath : `/${basePath}`;

  return {
    async list(params?: Record<string, unknown>, opts?: { useCache?: boolean; ttlMs?: number }): Promise<PaginatedResponse<T>> {
      try {
        const res = await apiFetch<unknown>(cleanPath, { method: "GET", params, ...opts });
        if (Array.isArray(res)) {
          return { data: res as T[], total: res.length };
        }
        const obj = res as { data?: T[]; total?: number; current_page?: number; last_page?: number; per_page?: number };
        if (Array.isArray(obj?.data)) {
          return {
            data: obj.data,
            total: obj.total ?? obj.data.length,
            current_page: obj.current_page,
            last_page: obj.last_page,
            per_page: obj.per_page,
          };
        }
        return { data: [], total: 0 };
      } catch {
        return { data: [], total: 0 };
      }
    },

    async listAll(params?: Record<string, unknown>, opts?: { useCache?: boolean; ttlMs?: number }): Promise<T[]> {
      const first = await this.list({ ...params, per_page: 100, page: 1 }, opts);
      let all = [...first.data];
      const last = first.last_page || 1;
      if (last > 1) {
        const promises: Promise<PaginatedResponse<T>>[] = [];
        for (let p = 2; p <= Math.min(last, 10); p++) {
          promises.push(this.list({ ...params, per_page: 100, page: p }, opts));
        }
        const pages = await Promise.all(promises);
        pages.forEach((pageRes) => {
          all = all.concat(pageRes.data);
        });
      }
      return all;
    },

    async get(id: string | number, opts?: { useCache?: boolean }): Promise<T> {
      const res = await apiFetch<{ data?: T } | T>(`${cleanPath}/${id}`, { method: "GET", ...opts });
      if (res && typeof res === "object" && "data" in res && (res as { data?: T }).data) {
        return (res as { data: T }).data;
      }
      return res as T;
    },

    async create(data: Partial<T> | FormData): Promise<T> {
      const res = await apiFetch<{ data?: T } | T>(cleanPath, {
        method: "POST",
        body: data,
      });
      invalidateApiCache(cleanPath);
      if (res && typeof res === "object" && "data" in res && (res as { data?: T }).data) {
        return (res as { data: T }).data;
      }
      return res as T;
    },

    async update(id: string | number, data: Partial<T> | FormData): Promise<T> {
      const isFormData = typeof FormData !== "undefined" && data instanceof FormData;
      if (isFormData) {
        (data as FormData).append("_method", "PUT");
        const res = await apiFetch<{ data?: T } | T>(`${cleanPath}/${id}`, {
          method: "POST",
          body: data,
        });
        invalidateApiCache(cleanPath);
        if (res && typeof res === "object" && "data" in res && (res as { data?: T }).data) {
          return (res as { data: T }).data;
        }
        return res as T;
      }

      const res = await apiFetch<{ data?: T } | T>(`${cleanPath}/${id}`, {
        method: "PUT",
        body: data,
      });
      invalidateApiCache(cleanPath);
      if (res && typeof res === "object" && "data" in res && (res as { data?: T }).data) {
        return (res as { data: T }).data;
      }
      return res as T;
    },

    async remove(id: string | number): Promise<void> {
      await apiFetch(`${cleanPath}/${id}`, { method: "DELETE" });
      invalidateApiCache(cleanPath);
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Typed Models & Specific APIs
// ─────────────────────────────────────────────────────────────────────────────

export interface LaravelUser {
  id: number | string;
  name: string;
  email: string;
  phone?: string | null;
  status?: string;
  role?: string;
  roles?: Array<{ id: number; name: string; slug: string } | string>;
  role_ids?: number[];
  avatar?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface LaravelRole {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  permissions?: LaravelPermission[];
  created_at?: string;
  updated_at?: string;
}

export interface LaravelPermission {
  id: number;
  name: string;
  slug: string;
  module?: string;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
  pivot?: {
    role_id: number;
    permission_id: number;
  };
}

export interface LaravelSeason {
  id: number;
  name_ar: string;
  name_en?: string | null;
  period_ar?: string | null;
  period_en?: string | null;
  tagline_ar?: string | null;
  tagline_en?: string | null;
  description_ar?: string | null;
  description_en?: string | null;
  is_active: boolean;
  donation_available: boolean;
  sort_order?: number;
  programs?: any[];
  created_at?: string;
  updated_at?: string;
}

export interface LaravelDonor {
  id: number | string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  total_donations?: number;
  created_at?: string;
}

export interface LaravelDonation {
  id: number | string;
  donor_id?: number | string;
  donor?: string | { id: number; name: string; email?: string };
  amount: number | string;
  payment_method?: string;
  program_id?: number | string;
  project_id?: number | string;
  status?: string;
  created_at?: string;
}

export interface LaravelProgram {
  id: number | string;
  name: string;
  description?: string;
  is_active?: boolean;
  target_amount?: number | string;
  collected_amount?: number | string;
  created_at?: string;
}

export interface LaravelProject {
  id: number | string;
  name: string;
  description?: string;
  target_amount: number | string;
  collected_amount?: number | string;
  is_active?: boolean;
  program_id?: number | string;
  created_at?: string;
}

export interface LaravelCase {
  id: number | string;
  code?: string;
  title: string;
  category?: string;
  beneficiary_name?: string;
  governorate?: string;
  target_amount: number | string;
  collected_amount?: number | string;
  priority?: string;
  status?: string;
  created_at?: string;
}

export interface LaravelArticle {
  id: number | string;
  title_ar: string;
  title_en?: string;
  slug?: string;
  summary_ar?: string;
  summary_en?: string;
  content_ar: string;
  content_en?: string;
  status?: "published" | "draft";
  published_at?: string;
  image?: string | null;
  created_at?: string;
}

export interface LaravelFaq {
  id: number | string;
  question_ar: string;
  question_en?: string;
  answer_ar: string;
  answer_en?: string;
  sort_order?: number;
  is_active?: boolean;
  created_at?: string;
}

export interface LaravelPage {
  id: number | string;
  title_ar: string;
  title_en?: string;
  slug: string;
  content_ar?: string;
  content_en?: string;
  is_active?: boolean;
  created_at?: string;
}

export interface LaravelHomeNumber {
  id: number | string;
  title_ar: string;
  title_en?: string;
  number: number | string;
  number_label_ar?: string;
  number_label_en?: string;
  icon?: string;
  fallback_image?: string | null;
  sort_order?: number;
  is_visible?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LaravelHomeStat extends LaravelHomeNumber {
  suffix?: string;
}

export interface LaravelAchievement {
  id: number | string;
  title_ar: string;
  title_en?: string;
  number: number | string;
  number_suffix_ar?: string;
  number_suffix_en?: string;
  icon?: string;
  image?: string | null;
  sort_order?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LaravelUnifiedContent {
  id: number | string;
  type: "article" | "program" | "faq" | "page" | string;
  status: "published" | "draft" | string;
  slug: string;
  title_ar: string;
  title_en?: string;
  summary_ar?: string;
  summary_en?: string;
  content_ar: string;
  content_en?: string;
  cover_image?: string | null;
  svg?: string | null;
  tags?: string[];
  author_id?: number | string;
  author?: {
    id: number;
    name: string;
    email: string;
  };
  created_at?: string;
  updated_at?: string;
}

export interface LaravelStory {
  id: number | string;
  slug: string;
  title_ar: string;
  title_en?: string | null;
  category_ar: string;
  category_en?: string | null;
  beneficiary_name: string;
  location_ar?: string | null;
  location_en?: string | null;
  description_ar: string;
  description_en?: string | null;
  cover_image?: string | null;
  cover_image_url?: string | null;
  sort_order?: number;
  status?: "published" | "draft" | string;
  is_featured?: boolean | number | null;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
}

export interface LaravelGalleryItem {
  id: number | string;
  image?: string | null;
  external_url?: string | null;
  title_ar: string;
  title_en?: string | null;
  alt_ar?: string | null;
  alt_en?: string | null;
  description_ar?: string | null;
  description_en?: string | null;
  city?: string | null;
  program?: string | null;
  donation_program?: string | null;
  sort_order?: number;
  is_featured?: boolean | number;
  is_public?: boolean | number;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
}

export interface LaravelPaymentMethod {
  id: number | string;
  name_ar: string;
  name_en: string;
  slug: string;
  type: "card" | "bank_transfer" | "wallet" | "instant_payment" | "cash_pickup" | string;
  provider_ar?: string;
  provider_en?: string;
  details?: Record<string, unknown>;
  description_ar?: string;
  description_en?: string;
  sort_order?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LaravelVolunteer {
  id: number | string;
  name: string;
  email: string;
  phone: string;
  governorate?: string;
  city?: string;
  address?: string;
  skills?: string[];
  status?: "pending" | "approved" | "rejected" | string;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface LaravelVolunteerCampaign {
  id: number | string;
  title_ar: string;
  title_en?: string;
  event_date?: string;
  event_time?: string;
  governorate?: string;
  city?: string;
  location?: string;
  required_volunteers?: number;
  required_skills?: string[];
  description_ar?: string;
  description_en?: string;
  status?: "open" | "draft" | "closed" | "cancelled" | string;
  approved_volunteers_count?: number;
  remaining_volunteers?: number;
  applications_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface LaravelContentChangeRequest {
  id: number | string;
  user?: { id: number; name: string; email: string };
  module: string;
  action: string;
  method: string;
  route_uri: string;
  controller?: string;
  controller_method?: string;
  record_id?: number | string | null;
  payload?: Record<string, unknown>;
  route_parameters?: unknown[];
  reason?: string | null;
  status: "pending" | "approved" | "rejected" | string;
  reviewer?: { id: number; name: string; email: string };
  review_note?: string | null;
  reviewed_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface LaravelBlogSeo {
  id: number | string;
  content_id?: number | string;
  slug: string;
  title_ar: string;
  title_en?: string;
  summary_ar?: string;
  summary_en?: string;
  content_ar?: string;
  content_en?: string;
  cover_image?: string | null;
  primary_keyword?: string;
  category_ar?: string;
  category_en?: string;
  tags_ar?: string[];
  tags_en?: string[];
  og_image?: string | null;
  og_image_url?: string | null;
  schema_type?: string;
  schema_data?: Record<string, unknown>;
  seo_score?: number;
  workflow_status?: "draft" | "published" | "review" | string;
  created_at?: string;
  updated_at?: string;
}

export interface LaravelNewsletter {
  id: number | string;
  email: string;
  status: "confirmed" | "pending" | "unsubscribed" | string;
  language?: "ar" | "en" | string;
  source?: string;
  confirmed_at?: string | null;
  unsubscribed_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface LaravelServiceCategory {
  id: number | string;
  name: string;
  name_ar?: string;
  name_en?: string;
  slug?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LaravelService {
  id: number | string;
  title: string;
  title_ar?: string;
  title_en?: string;
  category_id?: number | string;
  description?: string;
  description_ar?: string;
  description_en?: string;
  icon?: string;
  image?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LaravelHomepageContent {
  hero_badge_ar?: string | null;
  hero_badge_en?: string | null;
  hero_title_ar?: string | null;
  hero_title_en?: string | null;
  hero_title_accent_ar?: string | null;
  hero_title_accent_en?: string | null;
  hero_description_ar?: string | null;
  hero_description_en?: string | null;
  hero_cta_primary_ar?: string | null;
  hero_cta_primary_en?: string | null;
  hero_cta_primary_link?: string | null;
  hero_cta_primary_icon?: string | null;
  hero_cta_secondary_ar?: string | null;
  hero_cta_secondary_en?: string | null;
  hero_cta_secondary_link?: string | null;
  hero_cta_secondary_icon?: string | null;
  hero_transparency_text_ar?: string | null;
  hero_transparency_text_en?: string | null;
  hero_image?: string | null;
  section2_badge_ar?: string | null;
  section2_badge_en?: string | null;
  section2_title_ar?: string | null;
  section2_title_en?: string | null;
  section2_title_accent_ar?: string | null;
  section2_title_accent_en?: string | null;
  section2_description_ar?: string | null;
  section2_description_en?: string | null;
  section2_main_image?: string | null;
  section2_left_top_image?: string | null;
  section2_left_bottom_image?: string | null;
  section2_card_cta_title_ar?: string | null;
  section2_card_cta_title_en?: string | null;
  section2_card_cta_sub_ar?: string | null;
  section2_card_cta_sub_en?: string | null;
  section2_card_cta_link?: string | null;
  section2_card_title_ar?: string | null;
  section2_card_title_en?: string | null;
  section2_card_subtitle_ar?: string | null;
  section2_card_subtitle_en?: string | null;
  section2_card_url?: string | null;
  // Section 2 Action Buttons
  section2_cta_primary_ar?: string | null;
  section2_cta_primary_en?: string | null;
  section2_cta_primary_link?: string | null;
  section2_cta_primary_icon?: string | null;
  section2_cta_secondary_ar?: string | null;
  section2_cta_secondary_en?: string | null;
  section2_cta_secondary_link?: string | null;
  section2_cta_secondary_icon?: string | null;
  // Section Axes (محاور الرسالة)
  section_axes_badge_ar?: string | null;
  section_axes_badge_en?: string | null;
  section_axes_title_ar?: string | null;
  section_axes_title_en?: string | null;
  section_axes_subtitle_ar?: string | null;
  section_axes_subtitle_en?: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth Module
// ─────────────────────────────────────────────────────────────────────────────

export const authApi = {
  async login(credentials: { email: string; password: string }) {
    const res = await apiFetch<{ token: string; user: LaravelUser; message?: string }>("/login", {
      method: "POST",
      body: credentials,
      skipAuthClear: true,
    });
    if (res.token) {
      setApiToken(res.token);
    }
    return res;
  },

  async register(data: {
    name: string;
    email: string;
    password: string;
    password_confirmation?: string;
    phone?: string;
    role?: string;
  }) {
    const res = await apiFetch<{ token?: string; user: LaravelUser; message?: string }>("/register", {
      method: "POST",
      body: {
        ...data,
        password_confirmation: data.password_confirmation || data.password,
      },
    });
    if (res.token) {
      setApiToken(res.token);
    }
    return res;
  },

  async profile(): Promise<LaravelUser> {
    const userToken = getApiToken();
    if (!userToken) {
      throw new ApiError("غير مسجل الدخول", 401);
    }
    const res = await apiFetch<{ user?: LaravelUser; data?: LaravelUser } | LaravelUser>("/profile", {
      method: "GET",
      token: userToken,
      ttlMs: 30000,
    });
    if (res && typeof res === "object") {
      if ("user" in res && res.user) return res.user;
      if ("data" in res && res.data) return res.data;
    }
    return res as LaravelUser;
  },

  async logout(): Promise<void> {
    try {
      await apiFetch("/logout", { method: "POST" });
    } finally {
      clearApiToken();
    }
  },

  async changePassword(data: {
    current_password: string;
    password: string;
    password_confirmation?: string;
  }): Promise<{ message?: string }> {
    return apiFetch("/change-password", {
      method: "POST",
      body: {
        ...data,
        password_confirmation: data.password_confirmation || data.password,
      },
    });
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard & Reports Module
// ─────────────────────────────────────────────────────────────────────────────

export const dashboardApi = {
  async getStats() {
    return await apiFetch<Record<string, unknown>>("/dashboard", { method: "GET", ttlMs: 30000 });
  },
  async reports() {
    return await apiFetch<Record<string, unknown>>("/reports", { method: "GET", ttlMs: 30000 });
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Resources
// ─────────────────────────────────────────────────────────────────────────────

export const usersApi = resource<LaravelUser>("/users");

export const permissionsApi = {
  ...resource<LaravelPermission>("/permissions"),
  async listAll(params?: Record<string, unknown>, opts?: { useCache?: boolean; ttlMs?: number }): Promise<LaravelPermission[]> {
    let page = 1;
    const all: LaravelPermission[] = [];
    while (true) {
      const res = await this.list({ ...params, page }, opts);
      const items = res.data || [];
      all.push(...items);
      if (!res.last_page || page >= res.last_page || items.length === 0) break;
      page++;
    }
    return all;
  },
};

export const rolesApi = {
  ...resource<LaravelRole>("/roles"),
  async updatePermissions(
    roleId: number | string,
    permissionIds: number[],
    extra?: { name?: string; slug?: string; description?: string }
  ): Promise<LaravelRole> {
    const existing = await this.get(roleId);
    return await this.update(roleId, {
      name: extra?.name || existing.name,
      slug: extra?.slug || existing.slug,
      description: extra?.description || existing.description,
      permission_ids: permissionIds,
    } as any);
  },
  async permissions() {
    return permissionsApi.listAll();
  },
};

export const seasonsApi = resource<LaravelSeason>("/seasons");
export const donorsApi = resource<LaravelDonor>("/donors");
export const donationsApiV1 = resource<LaravelDonation>("/donations");
export const donationsApi = donationsApiV1;
export const programsApiV1 = resource<LaravelProgram>("/programs");
export const programsApi = programsApiV1;
export const projectsApiV1 = resource<LaravelProject>("/projects");
export const projectsApi = projectsApiV1;
export const casesApiV1 = resource<LaravelCase>("/cases");
export const casesApi = casesApiV1;

// ── Content-backed resources (/content?type=...) ──
const contentArticlesResource = resource<LaravelArticle>("/content");
export const articlesApi = {
  ...contentArticlesResource,
  async list(params?: Record<string, unknown>, opts?: { useCache?: boolean; ttlMs?: number }) {
    try {
      return await contentArticlesResource.list({ type: "article", ...(params || {}) }, opts);
    } catch {
      return resource<LaravelArticle>("/articles").list(params, opts);
    }
  },
  async listAll(params?: Record<string, unknown>, opts?: { useCache?: boolean; ttlMs?: number }) {
    try {
      return await contentArticlesResource.listAll({ type: "article", ...(params || {}) }, opts);
    } catch {
      return resource<LaravelArticle>("/articles").listAll(params, opts);
    }
  },
  async create(data: Partial<LaravelArticle> | FormData) {
    if (typeof FormData !== "undefined" && data instanceof FormData) {
      if (!data.has("type")) data.append("type", "article");
      return contentArticlesResource.create(data);
    }
    return contentArticlesResource.create({ type: "article", ...(data as Partial<LaravelArticle>) });
  },
};

const contentFaqsResource = resource<LaravelFaq>("/content");
export const faqsApi = {
  ...contentFaqsResource,
  async list(params?: Record<string, unknown>, opts?: { useCache?: boolean; ttlMs?: number }) {
    try {
      return await contentFaqsResource.list({ type: "faq", ...(params || {}) }, opts);
    } catch {
      return resource<LaravelFaq>("/faqs").list(params, opts);
    }
  },
  async listAll(params?: Record<string, unknown>, opts?: { useCache?: boolean; ttlMs?: number }) {
    try {
      return await contentFaqsResource.listAll({ type: "faq", ...(params || {}) }, opts);
    } catch {
      return resource<LaravelFaq>("/faqs").listAll(params, opts);
    }
  },
  async create(data: Partial<LaravelFaq> | FormData) {
    if (typeof FormData !== "undefined" && data instanceof FormData) {
      if (!data.has("type")) data.append("type", "faq");
      return contentFaqsResource.create(data);
    }
    return contentFaqsResource.create({ type: "faq", ...(data as Partial<LaravelFaq>) });
  },
};

const contentPagesResource = resource<LaravelPage>("/content");
export const pagesApi = {
  ...contentPagesResource,
  async list(params?: Record<string, unknown>, opts?: { useCache?: boolean; ttlMs?: number }) {
    try {
      return await contentPagesResource.list({ type: "page", ...(params || {}) }, opts);
    } catch {
      return resource<LaravelPage>("/pages").list(params, opts);
    }
  },
  async listAll(params?: Record<string, unknown>, opts?: { useCache?: boolean; ttlMs?: number }) {
    try {
      return await contentPagesResource.listAll({ type: "page", ...(params || {}) }, opts);
    } catch {
      return resource<LaravelPage>("/pages").listAll(params, opts);
    }
  },
  async create(data: Partial<LaravelPage> | FormData) {
    if (typeof FormData !== "undefined" && data instanceof FormData) {
      if (!data.has("type")) data.append("type", "page");
      return contentPagesResource.create(data);
    }
    return contentPagesResource.create({ type: "page", ...(data as Partial<LaravelPage>) });
  },
};

export const serviceCategoriesApi = resource<LaravelServiceCategory>("/service-categories");
export const laravelServicesApi = resource<LaravelService>("/services");

// ── Home Numbers & Stats ──
export const homeNumbersApi = {
  ...resource<LaravelHomeNumber>("/home-numbers"),
  async create(body: Partial<LaravelHomeNumber>) {
    const payload = { ...body };
    if (payload.number !== undefined) payload.number = Number(payload.number);
    return resource<LaravelHomeNumber>("/home-numbers").create(payload);
  },
  async update(id: number | string, body: Partial<LaravelHomeNumber>) {
    const payload = { ...body };
    if (payload.number !== undefined) payload.number = Number(payload.number);
    return resource<LaravelHomeNumber>("/home-numbers").update(id, payload);
  },
};

// Backward-compatible facade for existing code expecting statsApi
export const statsApi = {
  ...homeNumbersApi,
  async listAll(params?: Record<string, unknown>, opts?: { useCache?: boolean; ttlMs?: number }) {
    try {
      const live = await homeNumbersApi.listAll(params, opts);
      if (Array.isArray(live) && live.length > 0) return live;
    } catch {}
    // Fallback to /home-statistics if backend still has legacy endpoint
    try {
      return await resource<LaravelHomeStat>("/home-statistics").listAll(params, opts);
    } catch {
      return [];
    }
  },
  async moveUp(id: number | string) {
    return apiFetch(`/home-numbers/${id}/move-up`, { method: "PATCH" }).catch(() =>
      apiFetch(`/home-statistics/${id}/move-up`, { method: "PATCH" })
    );
  },
  async moveDown(id: number | string) {
    return apiFetch(`/home-numbers/${id}/move-down`, { method: "PATCH" }).catch(() =>
      apiFetch(`/home-statistics/${id}/move-down`, { method: "PATCH" })
    );
  },
};

// ── Achievements (/achievements) ──
const baseAchievementsResource = resource<LaravelAchievement>("/achievements");
export const achievementsApi = {
  ...baseAchievementsResource,
  async create(body: Partial<LaravelAchievement>) {
    const payload = { ...body };
    if (payload.number !== undefined) payload.number = Number(payload.number);
    return baseAchievementsResource.create(payload);
  },
  async update(id: number | string, body: Partial<LaravelAchievement>) {
    const payload = { ...body };
    if (payload.number !== undefined) payload.number = Number(payload.number);
    return baseAchievementsResource.update(id, payload);
  },
};

// ── Unified Content (/content) ──
const baseUnifiedContent = resource<LaravelUnifiedContent>("/content");
export const unifiedContentApi = {
  ...baseUnifiedContent,
  async statistics() {
    return apiFetch<{
      total: number;
      published: number;
      drafts: number;
      articles: number;
      programs: number;
      faqs: number;
      pages: number;
    }>("/content/statistics", { method: "GET", ttlMs: 30000 });
  },
  async listByType(type: "article" | "program" | "faq" | "page", status?: "published" | "draft") {
    return baseUnifiedContent.listAll({ type, ...(status ? { status } : {}) });
  },
};

// ── Stories (/stories) ──
const baseStoriesResource = resource<LaravelStory>("/stories");
export const storiesApi = {
  ...baseStoriesResource,
  async statistics() {
    return apiFetch<Record<string, unknown>>("/stories/statistics", { method: "GET", ttlMs: 30000 });
  },
  async listFeatured() {
    return baseStoriesResource.listAll({ is_featured: "true", status: "published" });
  },
  async listPublished(category?: string) {
    return baseStoriesResource.listAll({ status: "published", ...(category ? { category } : {}) });
  },
};

// ── Gallery (/gallery) ──
const baseGalleryResource = resource<LaravelGalleryItem>("/gallery");
export const galleryApi = {
  ...baseGalleryResource,
  async statistics() {
    return apiFetch<Record<string, unknown>>("/gallery/statistics", { method: "GET", ttlMs: 30000 });
  },
  async listPublic(params?: { city?: string; program?: string; search?: string }) {
    return baseGalleryResource.listAll({ is_public: "true", ...params });
  },
  async uploadImage(file: File, title: string = "صورة مرفوعة"): Promise<string> {
    // 1. Try Laravel API first (saves to server storage: /api/v1/gallery)
    const formData = new FormData();
    formData.append("image", file);
    formData.append("title_ar", title);
    formData.append("title_en", title);
    formData.append("is_public", "1");
    try {
      const res = await apiFetch<{ data?: { image?: string; image_url?: string; url?: string; external_url?: string } | LaravelGalleryItem }>("/gallery", {
        method: "POST",
        body: formData,
      });
      const dataObj = (res && typeof res === "object" && "data" in res ? res.data : res) as Record<string, unknown>;
      const rawUrl = (dataObj?.image || dataObj?.image_url || dataObj?.url || dataObj?.external_url) as string | undefined;
      if (rawUrl && typeof rawUrl === "string") {
        if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
          return rawUrl;
        }
        const clean = rawUrl.replace(/^\/+/, "");
        return clean.startsWith("storage/")
          ? `https://elyusr-api.pyramedx.com/${clean}`
          : `https://elyusr-api.pyramedx.com/storage/${clean}`;
      }
    } catch (laravelErr) {
      console.warn("Laravel gallery upload failed, trying Supabase Storage:", laravelErr);
    }

    // 2. Try Supabase Storage (real bucket, returns permanent public URL)
    try {
      const { uploadToSupabaseStorage } = await import("@/integrations/supabase/client");
      const publicUrl = await uploadToSupabaseStorage(file, "homepage");
      if (publicUrl && publicUrl.startsWith("http") && !publicUrl.includes("elyusr-local-mock.internal")) {
        return publicUrl;
      }
    } catch (supabaseErr) {
      console.warn("Supabase storage upload failed, falling back to data URL:", supabaseErr);
    }

    // 3. Last resort: base64 data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },
};

// ── Payment Methods (/payment-methods) ──
const basePaymentMethods = resource<LaravelPaymentMethod>("/payment-methods");
export const paymentMethodsApi = {
  ...basePaymentMethods,
  async listActive() {
    return basePaymentMethods.listAll({ is_active: 1 });
  },
};

// ── Volunteers & Campaigns ──
export const volunteersApi = {
  ...resource<LaravelVolunteer>("/volunteers"),
  async statistics() {
    return apiFetch<{
      total: number;
      pending: number;
      approved: number;
      rejected: number;
      inactive: number;
    }>("/volunteers/statistics", { method: "GET", ttlMs: 30000 });
  },
};

export const volunteerCampaignsApi = {
  ...resource<LaravelVolunteerCampaign>("/volunteer-campaigns"),
  async statistics() {
    return apiFetch<{
      total: number;
      open: number;
      draft: number;
      closed: number;
      cancelled: number;
    }>("/volunteer-campaigns/statistics", { method: "GET", ttlMs: 30000 });
  },
};

// ── Content Change Requests (/content-change-requests) ──
export const contentChangeRequestsApi = {
  ...resource<LaravelContentChangeRequest>("/content-change-requests"),
  async approve(id: number | string, note?: string) {
    const res = await apiFetch<{ message: string; request?: LaravelContentChangeRequest }>(
      `/content-change-requests/${id}/approve`,
      {
        method: "POST",
        body: note ? { review_note: note } : {},
      }
    );
    invalidateApiCache("/content-change-requests");
    return res;
  },
  async reject(id: number | string, reason?: string) {
    const res = await apiFetch<{ message: string; request?: LaravelContentChangeRequest }>(
      `/content-change-requests/${id}/reject`,
      {
        method: "POST",
        body: reason ? { reason } : {},
      }
    );
    invalidateApiCache("/content-change-requests");
    return res;
  },
};

// ── Blog SEO (/blog-seo) ──
export const blogSeoApi = {
  ...resource<LaravelBlogSeo>("/blog-seo"),
  async statistics() {
    return apiFetch<Record<string, unknown>>("/blog-seo/statistics", { method: "GET", ttlMs: 30000 });
  },
};

// ── Newsletter (/newsletter) ──
export const newsletterApi = {
  ...resource<LaravelNewsletter>("/newsletter"),
  async subscribe(email: string, language: "ar" | "en" = "ar") {
    return apiFetch<{ message?: string; data?: LaravelNewsletter }>("/newsletter", {
      method: "POST",
      body: { email, language, source: "website", status: "confirmed" },
    });
  },
  async statistics() {
    return apiFetch<{
      total: number;
      confirmed: number;
      pending: number;
      unsubscribed: number;
      last_30_days: number;
    }>("/newsletter/statistics", { method: "GET", ttlMs: 30000 });
  },
};

// ── Axes (/axes & /admin/axes) ──
export interface LaravelAxis {
  id: number;
  slug: string;
  name_ar: string;
  name_en?: string | null;
  description_ar?: string | null;
  description_en?: string | null;
  badge_ar?: string | null;
  badge_en?: string | null;
  image?: string | null;
  statistics?: Record<string, string | number> | null;
  features_ar?: string[] | null;
  features_en?: string[] | null;
  sort_order?: number | null;
  is_active?: boolean;
  programs?: any[];
  cases?: any[];
  volunteer_campaigns?: any[];
  created_at?: string;
  updated_at?: string;
}

export const axesApi = {
  async list(): Promise<LaravelAxis[]> {
    const res = await apiFetch<{ data: LaravelAxis[] }>("/axes", { ttlMs: 30000 });
    return res?.data || [];
  },
  async getBySlug(slug: string): Promise<LaravelAxis> {
    const res = await apiFetch<{ data: LaravelAxis }>(`/axes/${slug}`, { ttlMs: 30000 });
    return res?.data;
  },
  async getById(id: number | string): Promise<LaravelAxis> {
    try {
      const res = await apiFetch<{ data: LaravelAxis }>(`/axes/${id}`);
      if (res?.data) return res.data;
    } catch {}
    const res = await apiFetch<{ data: LaravelAxis }>(`/admin/axes/${id}`);
    return res?.data;
  },
  async adminList(): Promise<LaravelAxis[]> {
    const res = await apiFetch<{ data: LaravelAxis[] }>("/admin/axes", { ttlMs: 15000 });
    return res?.data || [];
  },
  async create(body: FormData | Partial<LaravelAxis>): Promise<LaravelAxis> {
    const res = await apiFetch<{ data: LaravelAxis }>("/admin/axes", { method: "POST", body });
    invalidateApiCache("/axes");
    return res?.data;
  },
  async update(id: number | string, body: FormData | Partial<LaravelAxis>): Promise<LaravelAxis> {
    const res = await apiFetch<{ data: LaravelAxis }>(`/admin/axes/${id}`, { method: "PUT", body });
    invalidateApiCache("/axes");
    return res?.data;
  },
  // updateWithFile: accepts either a FormData or a File directly, and sends POST with _method=PUT
  async updateWithFile(id: number | string, fileOrFormData: FormData | File): Promise<LaravelAxis> {
    let formData: FormData;
    if (fileOrFormData instanceof FormData) {
      formData = fileOrFormData;
    } else {
      formData = new FormData();
      formData.append("image", fileOrFormData);
    }
    if (!formData.has("_method")) formData.append("_method", "PUT");
    const res = await apiFetch<{ data: LaravelAxis }>(`/admin/axes/${id}`, { method: "POST", body: formData });
    invalidateApiCache("/axes");
    return res?.data;
  },
  async remove(id: number | string): Promise<void> {
    await apiFetch(`/admin/axes/${id}`, { method: "DELETE" });
    invalidateApiCache("/axes");
  },
};

// ---------------------------------------------------------------------------
// About Us ("من نحن") Types, Default Data & API Client
// Matches Postman collection: /admin/about-us and sub-endpoints
// ---------------------------------------------------------------------------

export interface AboutUsHero {
  badge_ar?: string | null;
  badge_en?: string | null;
  title_ar: string;
  title_en?: string | null;
  description_ar: string;
  description_en?: string | null;
  quote_ar?: string | null;
  quote_en?: string | null;
  image?: string | null;
  donate_label_ar?: string | null;
  donate_label_en?: string | null;
  donate_url?: string | null;
  story_label_ar?: string | null;
  story_label_en?: string | null;
  registration_number?: string | null;
}

export interface AboutUsStatItem {
  number: string | number;
  suffix?: string | null;
  label_ar?: string | null;
  label_en?: string | null;
  title_ar?: string | null;
  title_en?: string | null;
}

export interface AboutUsProgramItem {
  title_ar: string;
  title_en?: string | null;
  description_ar?: string | null;
  description_en?: string | null;
  icon?: string | null;
}

export interface AboutUsTrustItem {
  title_ar: string;
  title_en?: string | null;
  description_ar: string;
  description_en?: string | null;
  icon?: string | null;
}

export interface AboutUsWhyUsItem {
  title_ar: string;
  title_en?: string | null;
  description_ar: string;
  icon?: string | null;
}

export interface AboutUsValueItem {
  title_ar: string;
  title_en?: string | null;
  description_ar: string;
  description_en?: string | null;
  icon?: string | null;
}

export interface AboutUsStory {
  title_ar: string;
  title_en?: string | null;
  description_ar: string;
  registration_ar?: string | null;
  registration_number?: string | null;
  account_ar?: string | null;
  bank_name?: string | null;
  mission_ar?: string | null;
  mission_en?: string | null;
  mission?: {
    title_ar?: string | null;
    description_ar?: string | null;
  };
  goals_ar?: string[];
  goals?: {
    title_ar?: string | null;
    items?: string[];
  };
}

export interface AboutUsVisionItem {
  title_ar: string;
  title_en?: string | null;
  description_ar: string;
  icon?: string | null;
}

export interface AboutUsVision2030 {
  title_ar: string;
  title_en?: string | null;
  description_ar?: string | null;
  progress: number;
  progress_label_ar?: string | null;
  items: AboutUsVisionItem[];
}

export interface AboutUsClosing {
  title_ar?: string | null;
  subtitle_ar?: string | null;
}

export interface AboutUsData {
  id?: number;
  hero: AboutUsHero;
  stats: AboutUsStatItem[];
  programs: AboutUsProgramItem[];
  trust: AboutUsTrustItem[];
  why_us: AboutUsWhyUsItem[];
  values: AboutUsValueItem[];
  story: AboutUsStory;
  vision_2030: AboutUsVision2030;
  closing?: AboutUsClosing;
  is_active?: boolean;
}

export const ABOUT_US_DEFAULT_DATA: AboutUsData = {
  hero: {
    badge_ar: "مؤسسة مشهرة برقم 2665 سنة 2019 – وزارة التضامن الاجتماعي",
    badge_en: "Registered NGO No. 2665 (2019) – Ministry of Social Solidarity",
    title_ar: "مؤسسة اليسر الخيرية",
    title_en: "Al Yusr Charity Foundation",
    description_ar: "مؤسسة غير ربحية تم إنشاؤها عام 2019، تابعة لوزارة التضامن الاجتماعي. هدفنا أن تصل الصدقة لمستحقيها – في المنصورة والدقهلية وكل محافظات مصر.",
    description_en: "Non-profit foundation established in 2019, registered with the Ministry of Social Solidarity. Our mission is to deliver charity directly to those who truly deserve it across Egypt.",
    quote_ar: "تبرعك يترك أثرًا ويغير حياة",
    quote_en: "Your donation leaves an impact and changes lives",
    image: null,
    donate_label_ar: "تبرع الآن",
    donate_label_en: "Donate Now",
    donate_url: "/donate",
    story_label_ar: "اعرف قصتنا",
    story_label_en: "Our Story",
    registration_number: "2665/2019",
  },
  stats: [
    { number: "1400+", label_ar: "كرتونة رمضان", title_ar: "كرتونة رمضان", label_en: "Ramadan Boxes", title_en: "Ramadan Boxes" },
    { number: "3000+", label_ar: "كرتونة غذائية", title_ar: "كرتونة غذائية", label_en: "Food Boxes", title_en: "Food Boxes" },
    { number: "122", label_ar: "سقف منزل", title_ar: "سقف منزل", label_en: "Rooftop Repairs", title_en: "Rooftop Repairs" },
    { number: "385", label_ar: "توصيلة مياه نظيفة", title_ar: "توصيلة مياه نظيفة", label_en: "Water Connections", title_en: "Water Connections" },
    { number: "354", label_ar: "طالب مساعدات تعليمية", title_ar: "طالب مساعدات تعليمية", label_en: "Students Supported", title_en: "Students Supported" },
    { number: "365", label_ar: "يوم عطاء بدون توقف", title_ar: "يوم عطاء بدون توقف", label_en: "Days of Giving", title_en: "Days of Giving" },
  ],
  programs: [
    { title_ar: "حملة جاز (سقيا وأسقها)", title_en: "Water Projects", description_ar: "توفير المياه النظيفة للأسر", icon: "Droplets" },
    { title_ar: "حملة دفء الشتاء", title_en: "Winter Warmth", description_ar: "توفير الأغطية والملابس", icon: "Home" },
    { title_ar: "باب الجنة (كفالة اليتيم)", title_en: "Orphan Sponsorship", description_ar: "رعاية ودعم الأيتام", icon: "Heart" },
    { title_ar: "مبادرة عروس خير", title_en: "Brides Support", description_ar: "تيسير زواج الفتيات اليتيمات", icon: "Sparkles" },
    { title_ar: "غذاء شهري (كراتين وسلال)", title_en: "Food Boxes", description_ar: "كراتين غذائية شهرية", icon: "Utensils" },
    { title_ar: "كفالات ومساعدات شهرية", title_en: "Monthly Aid", description_ar: "مساعدات مالية دورية", icon: "HandCoins" },
    { title_ar: "صكوك الأضاحي ومزارع الوقف", title_en: "Sacrifice Bonds", description_ar: "توزيع اللحوم وصكوك الأضحية", icon: "Beef" },
    { title_ar: "زكاة المال والصدقات", title_en: "Zakat & Charity", description_ar: "مصارف الزكاة الشرعية", icon: "HandHeart" },
    { title_ar: "مساعدات طبية طارئة وقوافل", title_en: "Medical Convoys", description_ar: "علاج وقوافل طبية مجانية", icon: "HeartPulse" },
    { title_ar: "دور وحلقات تحفيظ القرآن", title_en: "Quran Circles", description_ar: "دعم مكاتب وحلقات التحفيظ", icon: "BookOpen" },
    { title_ar: "حملة مزرعون", title_en: "Farming Campaign", description_ar: "مشروعات تنموية زراعية", icon: "Sprout" },
    { title_ar: "تيسير زواج الفتيات اليتيمات", title_en: "Orphan Brides", description_ar: "أجهزة كهربائية وإعانة زواج", icon: "Gift" },
  ],
  trust: [
    { title_ar: "ترخيص وزارة التضامن", title_en: "Ministry License", description_ar: "إشهار المؤسسة برقم 2665 لسنة 2019.", icon: "BadgeCheck" },
    { title_ar: "مراجعة محاسبية مستقلة", title_en: "Independent Audit", description_ar: "تقارير مالية سنوية معتمدة وإيصالات رسمية.", icon: "ShieldCheck" },
    { title_ar: "تغطية شاملة في مصر", title_en: "Egypt Coverage", description_ar: "مقر رئيسي بالمنصورة وقوافل خيرية في محافظات مصر.", icon: "Globe2" },
  ],
  why_us: [
    { title_ar: "الحضور بنفسك", description_ar: "يمكنك الحضور ومتابعة التبرع بنفسك والتأكد من تنفيذ العمل.", icon: "Eye" },
    { title_ar: "التوثيق الفوري", description_ar: "نوثق التبرعات بالصور والفيديو وإشعار رسمي يوضح الأثر المحقق في نفس اليوم.", icon: "Camera" },
    { title_ar: "تطوع عائلتك", description_ar: "أفراد عائلتك يمكنهم التطوع معنا ويكونون جزءًا من فرقنا والمبادرات.", icon: "Users" },
    { title_ar: "الكيان والحسابات الرسمية", description_ar: "كيان مشهر رسميًا بوزارة التضامن الاجتماعي مع حسابات بنكية رسمية.", icon: "Building2" },
  ],
  values: [
    { title_ar: "التمكين", title_en: "Empowerment", description_ar: "بناء الإنسان: تعليم وعلاج وفرص أفضل.", icon: "Target" },
    { title_ar: "الإحسان", title_en: "Benevolence", description_ar: "نسعى لباب البيت بكرامة.", icon: "Heart" },
    { title_ar: "الأمانة", title_en: "Honesty", description_ar: "كل تبرع موثق بالصور والفيديو.", icon: "ShieldCheck" },
    { title_ar: "القوة", title_en: "Strength", description_ar: "برامج تنموية متجددة ومستمرة.", icon: "Sparkles" },
    { title_ar: "الثقة", title_en: "Trust", description_ar: "كيان مشهر رسميًا.", icon: "BadgeCheck" },
  ],
  story: {
    title_ar: "قصتنا",
    title_en: "Our Story",
    description_ar: "بعد العمل لأكثر من عشر سنوات في العمل الخيري كان لابد من كيان منظم ومرخص يجمع أعمالنا ويكبر ويساعدنا في بناء العمل الخيري في جمع تبرعات وتوزيعها لمؤسسة قادرة تغير مفهوم العمل الخيري وتنمو بالأثر من خلال مبادراتنا.",
    registration_ar: "إشهار رقم 2665 لسنة 2019 – وزارة التضامن الاجتماعي",
    registration_number: "2665/2019",
    account_ar: "حساب بنك CIB: 100043605733",
    bank_name: "CIB",
    mission_ar: "بناء إنسان واعٍ جسديًا، نفسيًا وبصريًا.",
    mission_en: "We seek to create sustainable impact and improve beneficiaries' quality of life.",
    mission: {
      title_ar: "رسالتنا",
      description_ar: "بناء إنسان واعٍ جسديًا، نفسيًا وبصريًا.",
    },
    goals_ar: [
      "أن تصل الصدقة لمن يستحقها بأعلى معايير الأمانة.",
      "تغيير مفهوم العمل الخيري في مصر من إعطاء صدقة لحظية إلى تغيير حياة كاملة.",
      "الحفاظ على أموال المتبرعين وتوفير طرق تبرع آمنة وموثقة.",
    ],
    goals: {
      title_ar: "هدفنا",
      items: [
        "أن تصل الصدقة لمن يستحقها بأعلى معايير الأمانة.",
        "تغيير مفهوم العمل الخيري في مصر من إعطاء صدقة لحظية إلى تغيير حياة كاملة.",
        "الحفاظ على أموال المتبرعين وتوفير طرق تبرع آمنة وموثقة.",
      ],
    },
  },
  vision_2030: {
    title_ar: "رؤيتنا لعام 2030",
    title_en: "Our Vision 2030",
    description_ar: "مستهدفات طموحة للانتقال بالمجتمعات الأكثر احتياجًا إلى دائرة الاكتفاء الذاتي والإنتاج.",
    progress: 23.1,
    progress_label_ar: "ما تم تحقيقه حتى الآن من مستهدفات 2030",
    items: [
      {
        title_ar: "مشاريع استثمارية وقف لله",
        title_en: "Endowment Projects",
        description_ar: "بناء مشاريع استثمارية وقف لله تستمر في خدمة الأسر وتوفير دخل مستدام.",
        icon: "TrendingUp",
      },
      {
        title_ar: "مستشفى طبية متكاملة",
        title_en: "Integrated Hospital",
        description_ar: "بناء مستشفى طبي يخدم أكبر عدد ممكن من الأسر الأولى بالرعاية.",
        icon: "Hospital",
      },
      {
        title_ar: "كفالة 50 ألف طالب",
        title_en: "Sponsor 50,000 Students",
        description_ar: "كفالة تعليمية شاملة لأكثر من 50,000 طالب من الأسر الأولى بالرعاية.",
        icon: "GraduationCap",
      },
      {
        title_ar: "مشاريع صغيرة للمستحقين",
        title_en: "Small Projects",
        description_ar: "تمويل وتأسيس مشاريع إنتاجية صغيرة للمستحقين للتحول من الاحتياج إلى الإنتاج.",
        icon: "Briefcase",
      },
    ],
  },
  closing: {
    title_ar: "ازرع اليوم... ليُثمر غدًا في كل بيت في مصر",
    subtitle_ar: "مؤسسة اليسر الخيرية – المنصورة والدقهلية وكل محافظات مصر",
  },
  is_active: true,
};

function normalizeAboutUsData(raw: any): AboutUsData {
  if (!raw) return ABOUT_US_DEFAULT_DATA;

  // Unwrap possible root-level { data: {...} } from some API responses
  const src = raw?.data && typeof raw.data === "object" && !Array.isArray(raw.data) ? raw.data : raw;

  // Helper: unwrap section content — backend may return { content: {...} } or direct object
  function unwrapSection(val: any): any {
    if (!val) return null;
    if (val?.content && typeof val.content === "object" && !Array.isArray(val.content)) return val.content;
    return val;
  }

  const heroRaw = unwrapSection(src.hero) || {};
  const normalizedHero: AboutUsHero = {
    ...heroRaw,
    donate_label_ar: heroRaw.donate_label_ar || heroRaw.donate_button_text || "تبرع الآن",
    donate_label_en: heroRaw.donate_label_en || "Donate Now",
    story_label_ar: heroRaw.story_label_ar || heroRaw.story_button_text || "اعرف قصتنا",
    story_label_en: heroRaw.story_label_en || "Our Story",
    registration_number: heroRaw.registration_number || "2665/2019",
  };

  const storyRaw = unwrapSection(src.story) || {};
  const normalizedStory: AboutUsStory = {
    title_ar: storyRaw.title_ar || "قصتنا",
    title_en: storyRaw.title_en || "Our Story",
    description_ar: storyRaw.description_ar || "",
    description_en: storyRaw.description_en || "",
    registration_ar: storyRaw.registration_ar || storyRaw.registration_number || "2665/2019",
    registration_number: storyRaw.registration_number || "2665/2019",
    account_ar: storyRaw.account_ar || storyRaw.bank_name || "CIB - 100043605733",
    bank_name: storyRaw.bank_name || "CIB - 100043605733",
    mission_ar: storyRaw.mission_ar || (typeof storyRaw.mission === "object" ? storyRaw.mission?.description_ar : "") || "",
    mission_en: storyRaw.mission_en || (typeof storyRaw.mission === "object" ? storyRaw.mission?.description_en : "") || "",
    goals_ar: Array.isArray(storyRaw.goals_ar) ? storyRaw.goals_ar : (Array.isArray(storyRaw.goals?.items) ? storyRaw.goals.items : []),
  };

  const visionRaw = unwrapSection(src.vision_2030 || {});
  const normalizedVisionItems = Array.isArray(visionRaw?.items)
    ? visionRaw.items
    : (Array.isArray(visionRaw) ? visionRaw : []);
  const normalizedVision: AboutUsVision2030 = {
    title_ar: visionRaw?.title_ar || "رؤيتنا 2030",
    title_en: visionRaw?.title_en || "Our Vision 2030",
    description_ar: visionRaw?.description_ar || "",
    description_en: visionRaw?.description_en || "",
    progress: Number(visionRaw?.progress) || 0,
    progress_label_ar: visionRaw?.progress_label_ar || "",
    items: normalizedVisionItems,
  };

  const rawStats = src.stats;
  const statsRaw = unwrapSection(rawStats);
  const rawStatItems = Array.isArray(statsRaw)
    ? statsRaw
    : (Array.isArray(statsRaw?.items) ? statsRaw.items : []);
  const normalizedStats: AboutUsStatItem[] = rawStatItems.map((s: any) => ({
    number: s.number ?? "",
    suffix: s.suffix ?? "",
    title_ar: s.title_ar || s.label_ar || "",
    title_en: s.title_en || s.label_en || "",
    label_ar: s.label_ar || s.title_ar || "",
    label_en: s.label_en || s.title_en || "",
  }));

  const programsRaw = unwrapSection(src.programs);
  const normalizedPrograms = Array.isArray(programsRaw)
    ? programsRaw
    : (Array.isArray(programsRaw?.items) ? programsRaw.items : []);

  const trustRaw = unwrapSection(src.trust);
  const normalizedTrust = Array.isArray(trustRaw)
    ? trustRaw
    : (Array.isArray(trustRaw?.items) ? trustRaw.items : []);

  const whyUsRaw = unwrapSection(src.why_us);
  const normalizedWhyUs = Array.isArray(whyUsRaw)
    ? whyUsRaw
    : (Array.isArray(whyUsRaw?.items) ? whyUsRaw.items : []);

  const valuesRaw = unwrapSection(src.values);
  const normalizedValues = Array.isArray(valuesRaw)
    ? valuesRaw
    : (Array.isArray(valuesRaw?.items) ? valuesRaw.items : []);

  return {
    id: src.id,
    hero: normalizedHero,
    story: normalizedStory,
    stats: normalizedStats,
    programs: normalizedPrograms,
    trust: normalizedTrust,
    why_us: normalizedWhyUs,
    values: normalizedValues,
    vision_2030: normalizedVision,
    closing: src.closing || {},
    is_active: src.is_active ?? true,
  };
}

export const aboutUsApi = {
  async get(): Promise<AboutUsData> {
    return this.getAboutUs();
  },
  /**
   * Public About Us loader — Calls GET /about-us (Public, unauthenticated)
   */
  async getAboutUs(): Promise<AboutUsData> {
    try {
      const res = await apiFetch<{ success?: boolean; data?: any }>("/about-us", {
        ttlMs: 15000,
        skipAuthClear: true,
      });
      if (res?.data) {
        return normalizeAboutUsData(res.data);
      }
    } catch (err) {
      console.warn("Falling back to default public About Us data:", err);
    }
    return ABOUT_US_DEFAULT_DATA;
  },
  /**
   * Admin About Us loader — Calls GET /admin/about-us (Authenticated, live fresh from DB)
   */
  async adminGet(): Promise<AboutUsData> {
    try {
      const res = await apiFetch<{ success?: boolean; data?: any }>("/admin/about-us", {
        skipAuthClear: true,
        useCache: false,
      });
      if (res?.data) {
        return normalizeAboutUsData(res.data);
      }
    } catch (err) {
      console.warn("Admin About Us fetch failed, falling back to public endpoint:", err);
    }
    return this.getAboutUs();
  },
  async getSection(section: string): Promise<any> {
    const res = await apiFetch<{ success?: boolean; data?: any }>(`/about-us/${section}`, { ttlMs: 30000 });
    return res?.data;
  },
  async updateSection(section: string, content: any): Promise<any> {
    // Laravel /admin/about-us/{section} requires { content: ... } payload wrapper
    const bodyPayload = (content && typeof content === "object" && "content" in content)
      ? content
      : { content };

    try {
      const res = await apiFetch<{ success?: boolean; data?: any }>(`/admin/about-us/${section}`, {
        method: "PUT",
        body: bodyPayload,
      });
      invalidateApiCache("/about-us");
      invalidateApiCache("/admin/about-us");
      return res?.data;
    } catch (err: any) {
      // If PUT fails with 405 Method Not Allowed or 422, try POST with _method=PUT spoofing
      if (err?.status === 405 || err?.status === 422) {
        const res2 = await apiFetch<{ success?: boolean; data?: any }>(`/admin/about-us/${section}`, {
          method: "POST",
          body: { ...bodyPayload, _method: "PUT" },
        });
        invalidateApiCache("/about-us");
        invalidateApiCache("/admin/about-us");
        return res2?.data;
      }
      throw err;
    }
  },
  async updateHero(content: Partial<AboutUsHero>) {
    return this.updateSection("hero", content);
  },
  async updateStats(content: { year?: number; items: AboutUsStatItem[] }) {
    return this.updateSection("stats", content);
  },
  async updatePrograms(content: { title_ar?: string; title_en?: string; items: AboutUsProgramItem[] }) {
    return this.updateSection("programs", content);
  },
  async updateTrust(content: { title_ar?: string; title_en?: string; items: AboutUsTrustItem[] }) {
    return this.updateSection("trust", content);
  },
  async updateWhyUs(content: { title_ar?: string; title_en?: string; items: AboutUsWhyUsItem[] }) {
    return this.updateSection("why-us", content);
  },
  async updateValues(content: { title_ar?: string; title_en?: string; items: AboutUsValueItem[] }) {
    return this.updateSection("values", content);
  },
  async updateStory(content: Partial<AboutUsStory>) {
    return this.updateSection("story", content);
  },
  async updateVision2030(content: Partial<AboutUsVision2030>) {
    return this.updateSection("vision-2030", content);
  },
};

// Collage images key (kept for cleanup only — not written to anymore)
export const COLLAGE_IMAGES_STORAGE_KEY = "elyusr_collage_images";

export interface CollageImages {
  section2_main_image?: string | null;
  section2_left_top_image?: string | null;
  section2_left_bottom_image?: string | null;
}

export function getCollageImages(): CollageImages {
  if (typeof window === "undefined") return {};
  try {
    const stored = localStorage.getItem(COLLAGE_IMAGES_STORAGE_KEY);
    if (stored) return JSON.parse(stored) as CollageImages;
  } catch {}
  return {};
}

export function saveCollageImages(images: CollageImages): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getCollageImages();
    const merged = { ...existing, ...images };
    // Remove falsy/empty values
    (Object.keys(merged) as (keyof CollageImages)[]).forEach((k) => {
      if (!merged[k]) delete merged[k];
    });
    localStorage.setItem(COLLAGE_IMAGES_STORAGE_KEY, JSON.stringify(merged));
  } catch {}
}

const HOMEPAGE_DEFAULT_CONTENT: LaravelHomepageContent = {
  hero_badge_ar: "جمعية اليسر للبر والخدمات الاجتماعية",
  hero_badge_en: "Al-Yusr Charity & Social Services",
  hero_title_ar: "معًا نصل بصدقتك",
  hero_title_en: "Together We Deliver Your Charity",
  hero_title_accent_ar: "لمن يستحق",
  hero_title_accent_en: "To Those in Need",
  hero_description_ar: "تبرّعك من اليوم يوصل لأسرة مستحقة بأيدي متطوعينا الموثوقين — سريع، شفاف، وبأعلى معايير الأمانة. كل مساهمة منك بنحسبها ونوريلك أثرها خطوة بخطوة.",
  hero_description_en: "Your donation reaches a deserving family today through our trusted volunteers — fast, transparent, and documented with care. Every gift is tracked with its impact shown step by step.",
  hero_cta_primary_ar: "تبرع الآن",
  hero_cta_primary_en: "Donate Now",
  hero_cta_primary_link: "/donate",
  hero_cta_primary_icon: "Heart",
  hero_cta_secondary_ar: "تعرّف علينا",
  hero_cta_secondary_en: "About us",
  hero_cta_secondary_link: "/about",
  hero_cta_secondary_icon: "Info",
  hero_transparency_text_ar: "%99 شفافية",
  hero_transparency_text_en: "99% Transparency",
  hero_image: null,
  section2_badge_ar: "مع اليسر",
  section2_badge_en: "With Al-Yusr",
  section2_title_ar: "خيرك يوصل",
  section2_title_en: "Your good arrives",
  section2_title_accent_ar: "وأجرك يستمر",
  section2_title_accent_en: "Your reward continues",
  section2_description_ar: "تبرعك هو استثمارك في الجنة وراحتك في الدنيا، تبرعك موثّق وأثرك مرئي. بتبرع بسيط تقدر تفتح باب أمل لأسرة كاملة — خليك سبب.",
  section2_description_en: "Your donation is your investment in the hereafter and your peace in this life — documented and visible in impact. A simple gift opens a door of hope for a whole family. Be the reason.",
  section2_main_image: null,
  section2_left_top_image: null,
  section2_left_bottom_image: null,
  section2_card_cta_title_ar: "كن سبب الفرحة",
  section2_card_cta_title_en: "Be their joy",
  section2_card_cta_sub_ar: "كل تبرع موثّق و كل أثر مرئي",
  section2_card_cta_sub_en: "Every donation tracked, every impact visible",
  section2_card_cta_link: "/about#impact",
  // Section 2 CTA action buttons
  section2_cta_primary_ar: "استكشف البرامج",
  section2_cta_primary_en: "Explore programs",
  section2_cta_primary_link: "/projects",
  section2_cta_primary_icon: "Compass",
  section2_cta_secondary_ar: "احسب زكاتك",
  section2_cta_secondary_en: "Zakat calculator",
  section2_cta_secondary_link: "/zakat-calculator",
  section2_cta_secondary_icon: "Calculator",
  // Section Axes (محاور الرسالة)
  section_axes_badge_ar: "محاور رسالتنا",
  section_axes_badge_en: "Our Work Axes",
  section_axes_title_ar: "محاور رسالتنا",
  section_axes_title_en: "Our Work Axes",
  section_axes_subtitle_ar: "بناء إنسان واعٍ جسدياً، ثقافياً، وصحياً. محاورنا الأساسية تخدم رسالتنا:",
  section_axes_subtitle_en: "Building a person who is physically, culturally, and health-aware. Our core pillars serve our mission:",
};

export const contentApi = {
  items: unifiedContentApi,
  async homepage(): Promise<LaravelHomepageContent> {
    // Live Fetch: Fetch hero and content in parallel (2 requests max).
    // /homepage-content is the unified endpoint but adds a 3rd redundant request
    // since hero + content already cover all fields — skip it on every call.
    try {
      const [heroSettled, sec2Settled] = await Promise.allSettled([
        apiFetch<{ success?: boolean; data?: Record<string, unknown> }>("/homepage/hero", { ttlMs: 30000, skipAuthClear: true }),
        apiFetch<{ success?: boolean; data?: Record<string, unknown> }>("/homepage/content", { ttlMs: 30000, skipAuthClear: true }),
      ]);

      const heroData = (heroSettled.status === "fulfilled" && heroSettled.value?.data) ? heroSettled.value.data : {};
      const sec2Data = (sec2Settled.status === "fulfilled" && sec2Settled.value?.data) ? sec2Settled.value.data : {};
      // uHero / uSec2 / uCard from unified endpoint — only fetch lazily if hero+content both failed
      const uHero: Record<string, unknown> = {};
      const uSec2: Record<string, unknown> = {};
      const uCard: Record<string, unknown> = {};

      // No localStorage cache reading — always use live API data only

      const hasLiveHero = Object.keys(heroData).length > 0 || Object.keys(uHero).length > 0;
      const hasLiveSec2 = Object.keys(sec2Data).length > 0 || Object.keys(uSec2).length > 0;

      if (hasLiveHero || hasLiveSec2) {
        // Resolve card titles & links from all possible backend schemas
        const cardTitleAr = (sec2Data.section2_card_title_ar as string)
          || (sec2Data.section2_card_cta_title_ar as string)
          || (uCard.title_ar as string)
          || (uSec2.section2_card_title_ar as string)
          || HOMEPAGE_DEFAULT_CONTENT.section2_card_cta_title_ar;

        const cardTitleEn = (sec2Data.section2_card_title_en as string)
          || (sec2Data.section2_card_cta_title_en as string)
          || (uCard.title_en as string)
          || (uSec2.section2_card_title_en as string)
          || HOMEPAGE_DEFAULT_CONTENT.section2_card_cta_title_en;

        const cardSubAr = (sec2Data.section2_card_subtitle_ar as string)
          || (sec2Data.section2_card_cta_sub_ar as string)
          || (uCard.subtitle_ar as string)
          || (uSec2.section2_card_subtitle_ar as string)
          || HOMEPAGE_DEFAULT_CONTENT.section2_card_cta_sub_ar;

        const cardSubEn = (sec2Data.section2_card_subtitle_en as string)
          || (sec2Data.section2_card_cta_sub_en as string)
          || (uCard.subtitle_en as string)
          || (uSec2.section2_card_subtitle_en as string)
          || HOMEPAGE_DEFAULT_CONTENT.section2_card_cta_sub_en;

        const cardUrl = (sec2Data.section2_card_url as string)
          || (sec2Data.section2_card_cta_link as string)
          || (uCard.url as string)
          || (uSec2.section2_card_url as string)
          || HOMEPAGE_DEFAULT_CONTENT.section2_card_cta_link;

        // Always prioritize LIVE backend data first, fallback to defaults only
        const rawSec2TitleAr = (sec2Data.section2_title_ar as string) || (uSec2.title_ar as string);
        const rawSec2TitleEn = (sec2Data.section2_title_en as string) || (uSec2.title_en as string);
        const sec2AccentAr = (sec2Data.section2_title_accent_ar as string)
          || (uSec2.title_accent_ar as string)
          || HOMEPAGE_DEFAULT_CONTENT.section2_title_accent_ar;
        const sec2AccentEn = (sec2Data.section2_title_accent_en as string)
          || (uSec2.title_accent_en as string)
          || HOMEPAGE_DEFAULT_CONTENT.section2_title_accent_en;

        const rawHeroImage = (heroData.hero_image as string) || (uHero.image as string) || null;
        const rawSec2Main = (sec2Data.section2_main_image as string) || (uSec2.main_image as string) || null;
        const rawSec2Top = (sec2Data.section2_left_top_image as string) || (uSec2.left_top_image as string) || null;
        const rawSec2Bottom = (sec2Data.section2_left_bottom_image as string) || (uSec2.left_bottom_image as string) || null;

        const liveHeroDescAr = (heroData.hero_description_ar as string) || (uHero.description_ar as string);
        const liveHeroDescEn = (heroData.hero_description_en as string) || (uHero.description_en as string);
        const liveHeroTitleAr = (heroData.hero_title_line1_ar as string) || (heroData.hero_title_ar as string) || (uHero.title_line1_ar as string) || (uHero.title_ar as string);
        const liveHeroTitleEn = (heroData.hero_title_line1_en as string) || (heroData.hero_title_en as string) || (uHero.title_line1_en as string) || (uHero.title_en as string);
        const liveHeroAccentAr = (heroData.hero_title_accent_ar as string) || (uHero.title_accent_ar as string) || "";
        const liveHeroAccentEn = (heroData.hero_title_accent_en as string) || (uHero.title_accent_en as string) || "";

        const liveSec2DescAr = (sec2Data.section2_description_ar as string) || (uSec2.description_ar as string);
        const liveSec2DescEn = (sec2Data.section2_description_en as string) || (uSec2.description_en as string);

        const merged: LaravelHomepageContent = {
          ...HOMEPAGE_DEFAULT_CONTENT,
          hero_badge_ar: (heroData.hero_badge_ar as string) || (uHero.badge_ar as string) || HOMEPAGE_DEFAULT_CONTENT.hero_badge_ar,
          hero_badge_en: (heroData.hero_badge_en as string) || (uHero.badge_en as string) || HOMEPAGE_DEFAULT_CONTENT.hero_badge_en,
          hero_title_ar: liveHeroTitleAr || HOMEPAGE_DEFAULT_CONTENT.hero_title_ar,
          hero_title_en: liveHeroTitleEn || HOMEPAGE_DEFAULT_CONTENT.hero_title_en,
          hero_title_accent_ar: liveHeroAccentAr !== undefined && liveHeroAccentAr !== "" ? liveHeroAccentAr : HOMEPAGE_DEFAULT_CONTENT.hero_title_accent_ar,
          hero_title_accent_en: liveHeroAccentEn !== undefined && liveHeroAccentEn !== "" ? liveHeroAccentEn : HOMEPAGE_DEFAULT_CONTENT.hero_title_accent_en,
          hero_description_ar: liveHeroDescAr || HOMEPAGE_DEFAULT_CONTENT.hero_description_ar,
          hero_description_en: liveHeroDescEn || HOMEPAGE_DEFAULT_CONTENT.hero_description_en,
          hero_cta_primary_ar: (heroData.primary_cta_ar as string) || (uHero.primary_cta_ar as string) || HOMEPAGE_DEFAULT_CONTENT.hero_cta_primary_ar,
          hero_cta_primary_en: (heroData.primary_cta_en as string) || (uHero.primary_cta_en as string) || HOMEPAGE_DEFAULT_CONTENT.hero_cta_primary_en,
          hero_cta_primary_link: (heroData.primary_cta_url as string) || (uHero.primary_cta_url as string) || HOMEPAGE_DEFAULT_CONTENT.hero_cta_primary_link,
          hero_cta_primary_icon:
            (heroData.primary_cta_icon as string) ||
            (heroData.hero_cta_primary_icon as string) ||
            ((uHero.primary_cta as Record<string, unknown>)?.icon as string) ||
            (uHero.primary_cta_icon as string) ||
            HOMEPAGE_DEFAULT_CONTENT.hero_cta_primary_icon,
          hero_cta_secondary_ar: (heroData.secondary_cta_ar as string) || (uHero.secondary_cta_ar as string) || HOMEPAGE_DEFAULT_CONTENT.hero_cta_secondary_ar,
          hero_cta_secondary_en: (heroData.secondary_cta_en as string) || (uHero.secondary_cta_en as string) || HOMEPAGE_DEFAULT_CONTENT.hero_cta_secondary_en,
          hero_cta_secondary_link: (heroData.secondary_cta_url as string) || (uHero.secondary_cta_url as string) || HOMEPAGE_DEFAULT_CONTENT.hero_cta_secondary_link,
          hero_cta_secondary_icon:
            (heroData.secondary_cta_icon as string) ||
            (heroData.hero_cta_secondary_icon as string) ||
            ((uHero.secondary_cta as Record<string, unknown>)?.icon as string) ||
            (uHero.secondary_cta_icon as string) ||
            HOMEPAGE_DEFAULT_CONTENT.hero_cta_secondary_icon,
          hero_transparency_text_ar: (heroData.transparency_ar as string) || HOMEPAGE_DEFAULT_CONTENT.hero_transparency_text_ar,
          hero_transparency_text_en: (heroData.transparency_en as string) || HOMEPAGE_DEFAULT_CONTENT.hero_transparency_text_en,
          hero_image: formatServerImageUrl(rawHeroImage) || null,

          section2_badge_ar: (sec2Data.section2_badge_ar as string) || (uSec2.badge_ar as string) || HOMEPAGE_DEFAULT_CONTENT.section2_badge_ar,
          section2_badge_en: (sec2Data.section2_badge_en as string) || (uSec2.badge_en as string) || HOMEPAGE_DEFAULT_CONTENT.section2_badge_en,
          section2_title_ar: rawSec2TitleAr || HOMEPAGE_DEFAULT_CONTENT.section2_title_ar,
          section2_title_en: rawSec2TitleEn || HOMEPAGE_DEFAULT_CONTENT.section2_title_en,
          section2_title_accent_ar: sec2AccentAr || HOMEPAGE_DEFAULT_CONTENT.section2_title_accent_ar,
          section2_title_accent_en: sec2AccentEn || HOMEPAGE_DEFAULT_CONTENT.section2_title_accent_en,
          section2_description_ar: liveSec2DescAr || HOMEPAGE_DEFAULT_CONTENT.section2_description_ar,
          section2_description_en: liveSec2DescEn || HOMEPAGE_DEFAULT_CONTENT.section2_description_en,
          section2_main_image: formatServerImageUrl(rawSec2Main) || null,
          section2_left_top_image: formatServerImageUrl(rawSec2Top) || null,
          section2_left_bottom_image: formatServerImageUrl(rawSec2Bottom) || null,

          // Card aliases (supports both old and new backend formats)
          section2_card_cta_title_ar: cardTitleAr || HOMEPAGE_DEFAULT_CONTENT.section2_card_cta_title_ar,
          section2_card_title_ar: cardTitleAr || HOMEPAGE_DEFAULT_CONTENT.section2_card_title_ar,
          section2_card_cta_title_en: cardTitleEn || HOMEPAGE_DEFAULT_CONTENT.section2_card_cta_title_en,
          section2_card_title_en: cardTitleEn || HOMEPAGE_DEFAULT_CONTENT.section2_card_title_en,
          section2_card_cta_sub_ar: cardSubAr || HOMEPAGE_DEFAULT_CONTENT.section2_card_cta_sub_ar,
          section2_card_subtitle_ar: cardSubAr || HOMEPAGE_DEFAULT_CONTENT.section2_card_subtitle_ar,
          section2_card_cta_sub_en: cardSubEn || HOMEPAGE_DEFAULT_CONTENT.section2_card_cta_sub_en,
          section2_card_subtitle_en: cardSubEn || HOMEPAGE_DEFAULT_CONTENT.section2_card_subtitle_en,
          section2_card_cta_link: cardUrl || HOMEPAGE_DEFAULT_CONTENT.section2_card_cta_link,
          section2_card_url: cardUrl || HOMEPAGE_DEFAULT_CONTENT.section2_card_url,

          // Section 2 CTA action buttons & icons
          // Backend returns: section2_primary_cta_ar / section2_secondary_cta_ar
          // (also check old field names section2_cta_primary_ar for legacy compat)
          section2_cta_primary_ar:
            (sec2Data.section2_primary_cta_ar as string) ||
            (sec2Data.section2_cta_primary_ar as string) ||
            (uSec2.section2_primary_cta_ar as string) ||
            (uSec2.section2_cta_primary_ar as string) ||
            HOMEPAGE_DEFAULT_CONTENT.section2_cta_primary_ar,
          section2_cta_primary_en:
            (sec2Data.section2_primary_cta_en as string) ||
            (sec2Data.section2_cta_primary_en as string) ||
            (uSec2.section2_primary_cta_en as string) ||
            (uSec2.section2_cta_primary_en as string) ||
            HOMEPAGE_DEFAULT_CONTENT.section2_cta_primary_en,
          section2_cta_primary_link:
            (sec2Data.section2_primary_cta_url as string) ||
            (sec2Data.section2_primary_cta_link as string) ||
            (sec2Data.section2_cta_primary_link as string) ||
            (uSec2.section2_primary_cta_url as string) ||
            (uSec2.section2_cta_primary_link as string) ||
            HOMEPAGE_DEFAULT_CONTENT.section2_cta_primary_link,
          section2_cta_primary_icon:
            (sec2Data.section2_primary_cta_icon as string) ||
            (sec2Data.section2_cta_primary_icon as string) ||
            (uSec2.section2_primary_cta_icon as string) ||
            (uSec2.section2_cta_primary_icon as string) ||
            HOMEPAGE_DEFAULT_CONTENT.section2_cta_primary_icon,
          section2_cta_secondary_ar:
            (sec2Data.section2_secondary_cta_ar as string) ||
            (sec2Data.section2_cta_secondary_ar as string) ||
            (uSec2.section2_secondary_cta_ar as string) ||
            (uSec2.section2_cta_secondary_ar as string) ||
            HOMEPAGE_DEFAULT_CONTENT.section2_cta_secondary_ar,
          section2_cta_secondary_en:
            (sec2Data.section2_secondary_cta_en as string) ||
            (sec2Data.section2_cta_secondary_en as string) ||
            (uSec2.section2_secondary_cta_en as string) ||
            (uSec2.section2_cta_secondary_en as string) ||
            HOMEPAGE_DEFAULT_CONTENT.section2_cta_secondary_en,
          section2_cta_secondary_link:
            (sec2Data.section2_secondary_cta_url as string) ||
            (sec2Data.section2_secondary_cta_link as string) ||
            (sec2Data.section2_cta_secondary_link as string) ||
            (uSec2.section2_secondary_cta_url as string) ||
            (uSec2.section2_cta_secondary_link as string) ||
            HOMEPAGE_DEFAULT_CONTENT.section2_cta_secondary_link,
          section2_cta_secondary_icon:
            (sec2Data.section2_secondary_cta_icon as string) ||
            (sec2Data.section2_cta_secondary_icon as string) ||
            (uSec2.section2_secondary_cta_icon as string) ||
            (uSec2.section2_cta_secondary_icon as string) ||
            HOMEPAGE_DEFAULT_CONTENT.section2_cta_secondary_icon,

          // Section Axes (محاور الرسالة)
          section_axes_badge_ar: (sec2Data.section_axes_badge_ar as string) || (uSec2.section_axes_badge_ar as string) || HOMEPAGE_DEFAULT_CONTENT.section_axes_badge_ar,
          section_axes_badge_en: (sec2Data.section_axes_badge_en as string) || (uSec2.section_axes_badge_en as string) || HOMEPAGE_DEFAULT_CONTENT.section_axes_badge_en,
          section_axes_title_ar: (sec2Data.section_axes_title_ar as string) || (uSec2.section_axes_title_ar as string) || HOMEPAGE_DEFAULT_CONTENT.section_axes_title_ar,
          section_axes_title_en: (sec2Data.section_axes_title_en as string) || (uSec2.section_axes_title_en as string) || HOMEPAGE_DEFAULT_CONTENT.section_axes_title_en,
          section_axes_subtitle_ar: (sec2Data.section_axes_subtitle_ar as string) || (uSec2.section_axes_subtitle_ar as string) || HOMEPAGE_DEFAULT_CONTENT.section_axes_subtitle_ar,
          section_axes_subtitle_en: (sec2Data.section_axes_subtitle_en as string) || (uSec2.section_axes_subtitle_en as string) || HOMEPAGE_DEFAULT_CONTENT.section_axes_subtitle_en,
        };

        return merged;
      }
    } catch (e) {
      console.warn("Live homepage fetch failed, checking fallback:", e);
    }

    // 2. Backend unreachable — return defaults
    return HOMEPAGE_DEFAULT_CONTENT;
  },

  async uploadSection2Image(
    file: File,
    field: "section2_main_image" | "section2_left_top_image" | "section2_left_bottom_image",
    currentData?: Partial<LaravelHomepageContent>
  ): Promise<{ url: string; data?: any }> {
    const formData = new FormData();
    formData.append(field, file);
    if (currentData) {
      if (currentData.section2_badge_ar) formData.append("section2_badge_ar", currentData.section2_badge_ar);
      if (currentData.section2_badge_en) formData.append("section2_badge_en", currentData.section2_badge_en);
      if (currentData.section2_title_ar) formData.append("section2_title_ar", currentData.section2_title_ar);
      if (currentData.section2_title_en) formData.append("section2_title_en", currentData.section2_title_en);
      if (currentData.section2_description_ar) formData.append("section2_description_ar", currentData.section2_description_ar);
      if (currentData.section2_description_en) formData.append("section2_description_en", currentData.section2_description_en);
      const cardTitleAr = currentData.section2_card_title_ar || currentData.section2_card_cta_title_ar;
      if (cardTitleAr) formData.append("section2_card_title_ar", cardTitleAr);
      const cardTitleEn = currentData.section2_card_title_en || currentData.section2_card_cta_title_en;
      if (cardTitleEn) formData.append("section2_card_title_en", cardTitleEn);
      const cardSubAr = currentData.section2_card_subtitle_ar || currentData.section2_card_cta_sub_ar;
      if (cardSubAr) formData.append("section2_card_subtitle_ar", cardSubAr);
      const cardSubEn = currentData.section2_card_subtitle_en || currentData.section2_card_cta_sub_en;
      if (cardSubEn) formData.append("section2_card_subtitle_en", cardSubEn);
      const cardUrl = currentData.section2_card_url || currentData.section2_card_cta_link;
      if (cardUrl) formData.append("section2_card_url", cardUrl);
    }

    const res = await apiFetch<{ success?: boolean; data?: any }>("/homepage/content", {
      method: "POST",
      body: formData,
    });

    const returnedUrl = res?.data?.[field] || "";
    if (returnedUrl) {
      saveCollageImages({ [field]: returnedUrl });
    }
    return { url: returnedUrl, data: res?.data };
  },

  async updateHomepage(data: Partial<LaravelHomepageContent>): Promise<LaravelHomepageContent> {
    // 1. Update Hero on Laravel backend (PUT /homepage/hero) - JSON
    try {
      await apiFetch("/homepage/hero", {
        method: "PUT",
        body: {
          hero_badge_ar: data.hero_badge_ar,
          hero_badge_en: data.hero_badge_en,
          hero_title_line1_ar: data.hero_title_ar,
          hero_title_line1_en: data.hero_title_en,
          hero_title_accent_ar: data.hero_title_accent_ar,
          hero_title_accent_en: data.hero_title_accent_en,
          hero_description_ar: data.hero_description_ar,
          hero_description_en: data.hero_description_en,
          primary_cta_ar: data.hero_cta_primary_ar,
          primary_cta_en: data.hero_cta_primary_en,
          primary_cta_url: data.hero_cta_primary_link,
          primary_cta_icon: data.hero_cta_primary_icon,
          hero_cta_primary_icon: data.hero_cta_primary_icon,
          secondary_cta_ar: data.hero_cta_secondary_ar,
          secondary_cta_en: data.hero_cta_secondary_en,
          secondary_cta_url: data.hero_cta_secondary_link,
          secondary_cta_icon: data.hero_cta_secondary_icon,
          hero_cta_secondary_icon: data.hero_cta_secondary_icon,
          transparency_ar: data.hero_transparency_text_ar,
          transparency_en: data.hero_transparency_text_en,
          hero_image: data.hero_image || null,
        },
      });
    } catch (err) {
      console.warn("Failed to update /homepage/hero on Laravel:", err);
    }

    // 2. Update Section 2 on Laravel backend — try PUT first (semantic update), then POST fallback
    try {
      const cardTitleAr = data.section2_card_title_ar || data.section2_card_cta_title_ar;
      const cardTitleEn = data.section2_card_title_en || data.section2_card_cta_title_en;
      const cardSubAr = data.section2_card_subtitle_ar || data.section2_card_cta_sub_ar;
      const cardSubEn = data.section2_card_subtitle_en || data.section2_card_cta_sub_en;
      const cardUrl = data.section2_card_url || data.section2_card_cta_link;

      const contentPayload = {
        section2_badge_ar: data.section2_badge_ar,
        section2_badge_en: data.section2_badge_en,
        section2_title_ar: data.section2_title_ar,
        section2_title_en: data.section2_title_en,
        section2_title_accent_ar: data.section2_title_accent_ar,
        section2_title_accent_en: data.section2_title_accent_en,
        section2_description_ar: data.section2_description_ar,
        section2_description_en: data.section2_description_en,
        section2_card_title_ar: cardTitleAr,
        section2_card_title_en: cardTitleEn,
        section2_card_subtitle_ar: cardSubAr,
        section2_card_subtitle_en: cardSubEn,
        section2_card_url: cardUrl,
        // Send both field name variants to cover all backend formats
        // Backend may expect: section2_primary_cta_ar OR section2_cta_primary_ar
        section2_primary_cta_ar: data.section2_cta_primary_ar,
        section2_primary_cta_en: data.section2_cta_primary_en,
        section2_primary_cta_url: data.section2_cta_primary_link,
        section2_primary_cta_icon: data.section2_cta_primary_icon,
        section2_secondary_cta_ar: data.section2_cta_secondary_ar,
        section2_secondary_cta_en: data.section2_cta_secondary_en,
        section2_secondary_cta_url: data.section2_cta_secondary_link,
        section2_secondary_cta_icon: data.section2_cta_secondary_icon,
        // Also send old-style names as fallback
        section2_cta_primary_ar: data.section2_cta_primary_ar,
        section2_cta_primary_en: data.section2_cta_primary_en,
        section2_cta_primary_link: data.section2_cta_primary_link,
        section2_cta_primary_icon: data.section2_cta_primary_icon,
        section2_cta_secondary_ar: data.section2_cta_secondary_ar,
        section2_cta_secondary_en: data.section2_cta_secondary_en,
        section2_cta_secondary_link: data.section2_cta_secondary_link,
        section2_cta_secondary_icon: data.section2_cta_secondary_icon,
        // Section Axes
        section_axes_badge_ar: data.section_axes_badge_ar,
        section_axes_badge_en: data.section_axes_badge_en,
        section_axes_title_ar: data.section_axes_title_ar,
        section_axes_title_en: data.section_axes_title_en,
        section_axes_subtitle_ar: data.section_axes_subtitle_ar,
        section_axes_subtitle_en: data.section_axes_subtitle_en,
      };

      try {
        // Try PUT first (idempotent update)
        await apiFetch("/homepage/content", { method: "PUT", body: contentPayload });
      } catch (putErr: any) {
        if (putErr?.status === 405 || putErr?.status === 404) {
          // Fallback to POST (Laravel may use POST for upsert)
          await apiFetch("/homepage/content", { method: "POST", body: contentPayload });
        } else {
          throw putErr;
        }
      }
    } catch (err) {
      console.warn("Failed to update /homepage/content on Laravel:", err);
    }

    // Invalidate cache so the next full page load gets fresh data
    invalidateApiCache("/homepage/hero");
    invalidateApiCache("/homepage/content");
    invalidateApiCache("/homepage-content");

    // Return optimistic merge of what was saved — avoids 3 extra GET requests after every save.
    // The cache is already invalidated above so the next real homepage() call will refetch.
    const merged: LaravelHomepageContent = {
      ...HOMEPAGE_DEFAULT_CONTENT,
      ...data,
      // Ensure both alias families are populated for the CTA fields
      section2_cta_primary_ar: data.section2_cta_primary_ar ?? HOMEPAGE_DEFAULT_CONTENT.section2_cta_primary_ar,
      section2_cta_primary_en: data.section2_cta_primary_en ?? HOMEPAGE_DEFAULT_CONTENT.section2_cta_primary_en,
      section2_cta_primary_link: data.section2_cta_primary_link ?? HOMEPAGE_DEFAULT_CONTENT.section2_cta_primary_link,
      section2_cta_primary_icon: data.section2_cta_primary_icon ?? HOMEPAGE_DEFAULT_CONTENT.section2_cta_primary_icon,
      section2_cta_secondary_ar: data.section2_cta_secondary_ar ?? HOMEPAGE_DEFAULT_CONTENT.section2_cta_secondary_ar,
      section2_cta_secondary_en: data.section2_cta_secondary_en ?? HOMEPAGE_DEFAULT_CONTENT.section2_cta_secondary_en,
      section2_cta_secondary_link: data.section2_cta_secondary_link ?? HOMEPAGE_DEFAULT_CONTENT.section2_cta_secondary_link,
      section2_cta_secondary_icon: data.section2_cta_secondary_icon ?? HOMEPAGE_DEFAULT_CONTENT.section2_cta_secondary_icon,
    };
    return merged;
  },

  async settings(data?: Record<string, unknown>) {
    return apiFetch<Record<string, unknown>>("/settings", { method: "POST", body: data || {} });
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Endpoint Health Inspector (for /admin/api-integration)
// ─────────────────────────────────────────────────────────────────────────────

export interface EndpointCheck {
  path: string;
  name: string;
  method: "GET" | "POST" | "PATCH";
  status: number | "error";
  latencyMs: number;
  ok: boolean;
  error?: string;
  category: string;
}

export async function checkAllEndpoints(): Promise<EndpointCheck[]> {
  const endpoints = [
    { path: "/profile", name: "بيانات المستخدم الحالي", method: "GET" as const, category: "المصادقة والمستخدمين" },
    { path: "/dashboard", name: "إحصائيات لوحة التحكم", method: "GET" as const, category: "لوحة التحكم والتقارير" },
    { path: "/reports", name: "تقارير إجمالية", method: "GET" as const, category: "لوحة التحكم والتقارير" },
    { path: "/users", name: "المستخدمون", method: "GET" as const, category: "المصادقة والمستخدمين" },
    { path: "/roles", name: "الأدوار", method: "GET" as const, category: "المصادقة والمستخدمين" },
    { path: "/permissions", name: "الصلاحيات", method: "GET" as const, category: "المصادقة والمستخدمين" },
    { path: "/donors", name: "المتبرعون", method: "GET" as const, category: "التبرعات والبرامج" },
    { path: "/donations", name: "التبرعات", method: "GET" as const, category: "التبرعات والبرامج" },
    { path: "/programs", name: "البرامج", method: "GET" as const, category: "التبرعات والبرامج" },
    { path: "/projects", name: "المشاريع", method: "GET" as const, category: "التبرعات والبرامج" },
    { path: "/cases", name: "الحالات", method: "GET" as const, category: "التبرعات والبرامج" },
    { path: "/articles", name: "المقالات (ar/en)", method: "GET" as const, category: "المحتوى والإعلام" },
    { path: "/faqs", name: "الأسئلة الشائعة", method: "GET" as const, category: "المحتوى والإعلام" },
    { path: "/pages", name: "الصفحات الثابتة", method: "GET" as const, category: "المحتوى والإعلام" },
    { path: "/home-statistics", name: "إحصائيات الرئيسية", method: "GET" as const, category: "المحتوى والإعلام" },
    { path: "/achievements", name: "الإنجازات", method: "GET" as const, category: "المحتوى والإعلام" },
    { path: "/homepage-content", name: "محتوى الرئيسية", method: "GET" as const, category: "المحتوى والإعلام" },
    { path: "/volunteers", name: "المتطوعون", method: "GET" as const, category: "الأشخاص والتطوع" },
    { path: "/volunteer-campaigns", name: "حملات التطوع", method: "GET" as const, category: "الأشخاص والتطوع" },
    { path: "/content-change-requests", name: "طلبات مراجعة المحتوى", method: "GET" as const, category: "المحتوى والإعلام" },
    { path: "/stories", name: "القصص", method: "GET" as const, category: "المحتوى والإعلام" },
    { path: "/gallery", name: "معرض الصور", method: "GET" as const, category: "المحتوى والإعلام" },
    { path: "/newsletter", name: "النشرة البريدية", method: "GET" as const, category: "التسويق والإعلام" },
    { path: "/service-categories", name: "تصنيفات الخدمات", method: "GET" as const, category: "الخدمات والبرامج" },
    { path: "/services", name: "الخدمات", method: "GET" as const, category: "الخدمات والبرامج" },
    { path: "/settings", name: "الإعدادات", method: "POST" as const, category: "الإعدادات" },
  ];

  const checks = await Promise.all(
    endpoints.map(async (ep): Promise<EndpointCheck> => {
      const start = performance.now();
      try {
        await apiFetch(ep.path, {
          method: ep.method,
          skipAuthClear: true,
          useCache: false, // live check bypasses cache
          body: ep.method === "POST" ? {} : undefined,
        });
        const latencyMs = Math.round(performance.now() - start);
        return {
          path: ep.path,
          name: ep.name,
          method: ep.method,
          status: 200,
          latencyMs,
          ok: true,
          category: ep.category,
        };
      } catch (err: unknown) {
        const latencyMs = Math.round(performance.now() - start);
        if (err instanceof ApiError) {
          return {
            path: ep.path,
            name: ep.name,
            method: ep.method,
            status: err.status,
            latencyMs,
            ok: err.status >= 200 && err.status < 300,
            error: err.message,
            category: ep.category,
          };
        }
        return {
          path: ep.path,
          name: ep.name,
          method: ep.method,
          status: "error",
          latencyMs,
          ok: false,
          error: err instanceof Error ? err.message : "Network error",
          category: ep.category,
        };
      }
    })
  );

  return checks;
}

