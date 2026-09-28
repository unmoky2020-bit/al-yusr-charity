/**
 * REST adapter — يتكلم مع backend/node أو backend/php عبر VITE_API_BASE_URL
 * نفس contract `casesApi.ts` بالظبط.
 */
const BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080").replace(/\/$/, "");
const TOK_KEY = "alyusr_token";

export const setToken = (t: string | null) => {
  if (t) localStorage.setItem(TOK_KEY, t);
  else localStorage.removeItem(TOK_KEY);
};
export const getToken = () => localStorage.getItem(TOK_KEY);

async function http<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const tok = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(tok ? { Authorization: `Bearer ${tok}` } : {}),
      ...(init.headers || {}),
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { error?: string }).error || `HTTP ${res.status}`);
  return (json as { data: T }).data;
}

export const restApi = {
  /* categories */
  listCategories: () => http("/api/categories"),
  /* cases */
  listPublicCases: (opts?: { categorySlug?: string; limit?: number }) => {
    const q = new URLSearchParams();
    if (opts?.categorySlug) q.set("cat", opts.categorySlug);
    if (opts?.limit) q.set("limit", String(opts.limit));
    return http(`/api/cases${q.toString() ? `?${q}` : ""}`);
  },
  listAllCasesForStaff: () => http("/api/cases/all"),
  getCaseByRef: (ref: string) => http(`/api/cases/${encodeURIComponent(ref)}`),
  createCase: (input: unknown) => http("/api/cases", { method: "POST", body: JSON.stringify(input) }),
  setCaseStatus: (id: string, status: string, reason?: string) =>
    http(`/api/cases/${id}/status`, { method: "PATCH", body: JSON.stringify({ status, reason }) }),
  deleteCase: (id: string) => http(`/api/cases/${id}`, { method: "DELETE" }),
  /* updates */
  listCaseUpdates: (caseId: string) => http(`/api/cases/${caseId}/updates`),
  addCaseUpdate: (caseId: string, body: string, image_url?: string | null) =>
    http(`/api/cases/${caseId}/updates`, { method: "POST", body: JSON.stringify({ body, image_url }) }),
  /* donations */
  listMyDonations: () => http("/api/donations/me"),
  createDonation: (input: unknown) => http("/api/donations", { method: "POST", body: JSON.stringify(input) }),
  /* auth */
  login: (email: string, password: string) => http<{ user: { id: string; email: string; name: string }; token: string }>(
    "/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  register: (input: { email: string; password: string; name?: string; phone?: string; city?: string; role?: "donor"|"volunteer"|"admin"|"case_manager" }) =>
    http<{ user: { id: string; email: string; name: string }; token: string }>(
    "/api/auth/register", { method: "POST", body: JSON.stringify(input) }),
};

export const isRestProvider = () => (import.meta.env.VITE_DATA_PROVIDER || "supabase") === "rest";