/**
 * Newsletter double-opt-in confirm / unsubscribe → Laravel.
 *
 * Endpoints (live since 2026-10-29; token only — an email alone is rejected):
 *   POST /newsletter/confirm      { token }
 *   POST /newsletter/unsubscribe  { token } | { email }
 *
 * Subscribing itself is `newsletterApi.subscribe` (POST /newsletter/subscribe, public) in laravelApi.ts.
 * apiFetch throws ApiError on non-2xx, so callers can show a real error state.
 */
import { apiFetch } from "@/data/laravelApi";

export interface NewsletterTokenResult {
  message?: string;
  status?: string;
  email?: string;
}

type TokenResponse = (NewsletterTokenResult & { data?: NewsletterTokenResult | null }) | null;

function unwrap(res: TokenResponse): NewsletterTokenResult {
  return { ...(res ?? {}), ...(res?.data ?? {}) };
}

export async function confirmNewsletter(token: string): Promise<NewsletterTokenResult> {
  const res = await apiFetch<TokenResponse>("/newsletter/confirm", {
    method: "POST",
    body: { token },
    useCache: false,
  });
  return unwrap(res);
}

export async function unsubscribeNewsletter(input: { token?: string; email?: string }): Promise<NewsletterTokenResult> {
  const body: Record<string, string> = {};
  if (input.token) body.token = input.token;
  if (input.email) body.email = input.email;
  const res = await apiFetch<TokenResponse>("/newsletter/unsubscribe", {
    method: "POST",
    body,
    useCache: false,
  });
  return unwrap(res);
}
