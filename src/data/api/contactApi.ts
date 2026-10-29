/**
 * Public form submissions (no auth) → Laravel.
 *
 * Endpoints (NEW — proposed, documented in backend-handoff/01-replace-supabase-public.md):
 *   POST /contact-messages   — "تواصل معنا" form (src/pages/site/Contact.tsx)
 *   POST /khabia-requests    — "الخبيئة" request form (src/components/sections/KhabiaProgram.tsx)
 *
 * apiFetch throws ApiError on any non-2xx / network failure, so callers only show
 * success after a real 2xx. On failure they offer a WhatsApp fallback (buildWhatsAppUrl)
 * so the visitor's message is never lost.
 */
import { apiFetch } from "@/data/laravelApi";

/** Foundation WhatsApp number (international format, no "+"). */
export const FOUNDATION_WHATSAPP = "201097000137";
/** The foundation's only public email address. */
export const FOUNDATION_EMAIL = "info@elyusr.org";

export interface ContactMessagePayload {
  name: string;
  email: string;
  phone?: string | null;
  section: string;
  message: string;
  user_agent?: string | null;
  source?: string;
}

export interface KhabiaRequestPayload {
  full_name: string;
  phone: string;
  city: string;
  address?: string | null;
  user_agent?: string | null;
  source?: string;
}

export interface PublicSubmissionResult {
  id?: number | string;
  ref_code: string | null;
}

type SubmissionResponse = {
  ref_code?: string;
  id?: number | string;
  data?: { ref_code?: string; id?: number | string } | null;
} | null;

function readRef(res: SubmissionResponse): PublicSubmissionResult {
  const inner = res?.data ?? null;
  const ref = inner?.ref_code ?? res?.ref_code ?? null;
  const id = inner?.id ?? res?.id;
  return { id, ref_code: ref ? String(ref) : id != null ? String(id) : null };
}

const userAgent = (): string | null =>
  typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 200) : null;

export async function submitContactMessage(payload: ContactMessagePayload): Promise<PublicSubmissionResult> {
  const res = await apiFetch<SubmissionResponse>("/contact-messages", {
    method: "POST",
    body: {
      ...payload,
      phone: payload.phone || null,
      user_agent: payload.user_agent ?? userAgent(),
      source: payload.source ?? "contact-page",
    },
    useCache: false,
  });
  return readRef(res);
}

export async function submitKhabiaRequest(payload: KhabiaRequestPayload): Promise<PublicSubmissionResult> {
  const res = await apiFetch<SubmissionResponse>("/khabia-requests", {
    method: "POST",
    body: {
      ...payload,
      address: payload.address || null,
      user_agent: payload.user_agent ?? userAgent(),
      source: payload.source ?? "khabia-section",
    },
    useCache: false,
  });
  return readRef(res);
}

/** wa.me link with the given text pre-filled (URL-encoded). */
export function buildWhatsAppUrl(text: string, phone: string = FOUNDATION_WHATSAPP): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}
