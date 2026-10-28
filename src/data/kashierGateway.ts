/**
 * Kashier Payment Gateway Integration (frontend side)
 *
 * Public environment variables (.env) — these are inlined into the bundle,
 * so ONLY non-secret values may live here:
 *   VITE_KASHIER_MERCHANT_ID  - public Merchant ID (format: MID-XXXX-XXXX)
 *   VITE_KASHIER_MODE         - test | live  (default: test)
 *
 * The Kashier secret key NEVER reaches the browser. All signing (HMAC) and the
 * creation of the hosted-checkout session happen on the Laravel backend via
 * POST /api/v1/donations/submit, which returns `payment.session_url`.
 * The frontend only opens that URL inside the checkout iframe.
 */

import { createDonation } from "./casesApi";

export type GatewayProvider = "kashier" | "paymob" | "both";

export interface KashierSettings {
  /** Public merchant identifier (safe to expose). */
  merchantId: string;
  mode: "live" | "test";
  enabled: boolean;
}

export interface PaymobSettings {
  /** Public key only — Paymob secrets are backend-only as well. */
  publicKey: string;
  integrationId: string;
  enabled: boolean;
}

export interface GatewaySettings {
  activeGateway: GatewayProvider;
  kashier: KashierSettings;
  paymob: PaymobSettings;
}

const SETTINGS_STORAGE_KEY = "alyusr_gateway_settings";

const envMode = (): "live" | "test" =>
  ((import.meta.env.VITE_KASHIER_MODE as string) || "test") === "live" ? "live" : "test";

export const DEFAULT_GATEWAY_SETTINGS: GatewaySettings = {
  activeGateway: "kashier",
  kashier: {
    merchantId: ((import.meta.env.VITE_KASHIER_MERCHANT_ID as string) || "").trim(),
    mode: envMode(),
    enabled: true,
  },
  paymob: {
    publicKey: (import.meta.env.VITE_PAYMOB_PUBLIC_KEY as string) || "",
    integrationId: "",
    enabled: false,
  },
};

/**
 * Build the object that is allowed to be persisted in localStorage.
 * Only public, non-sensitive fields are kept; any `secretKey`-like field that a
 * caller (or an older build) may have put on the object is dropped here.
 */
function toPublicSettings(settings: Partial<GatewaySettings> | null | undefined): GatewaySettings {
  const k = (settings?.kashier || {}) as Partial<KashierSettings> & Record<string, unknown>;
  const p = (settings?.paymob || {}) as Partial<PaymobSettings> & Record<string, unknown>;
  const mid = typeof k.merchantId === "string" ? k.merchantId.trim() : "";
  return {
    activeGateway: "kashier",
    kashier: {
      merchantId: mid || DEFAULT_GATEWAY_SETTINGS.kashier.merchantId,
      mode: k.mode === "live" ? "live" : k.mode === "test" ? "test" : DEFAULT_GATEWAY_SETTINGS.kashier.mode,
      enabled: true,
    },
    paymob: {
      publicKey: typeof p.publicKey === "string" ? p.publicKey : DEFAULT_GATEWAY_SETTINGS.paymob.publicKey,
      integrationId: typeof p.integrationId === "string" ? p.integrationId : "",
      enabled: false,
    },
  };
}

export function getGatewaySettings(): GatewaySettings {
  if (typeof window === "undefined") return DEFAULT_GATEWAY_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_GATEWAY_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<GatewaySettings> & {
      kashier?: Record<string, unknown>;
      paymob?: Record<string, unknown>;
    };
    const safe = toPublicSettings(parsed);

    // One-time scrub: older builds persisted gateway secrets in the browser.
    // If any such field is present, rewrite the entry without it.
    const hadSecret =
      (parsed?.kashier && "secretKey" in parsed.kashier) ||
      (parsed?.paymob && "secretKey" in parsed.paymob);
    if (hadSecret) {
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(safe));
      } catch {
        /* ignore */
      }
    }
    return safe;
  } catch {
    return DEFAULT_GATEWAY_SETTINGS;
  }
}

/** Persist public gateway settings only (merchant id / mode). Never secrets. */
export function saveGatewaySettings(settings: GatewaySettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(toPublicSettings(settings)));
    window.dispatchEvent(new Event("gateway-settings-changed"));
  } catch (err) {
    console.warn("Could not save gateway settings:", err);
  }
}

/* ─────────────────────────────────────────────────────────────────────
   Payment Sessions
   The ONLY way to open Kashier is the backend-created hosted session:
   POST /api/v1/donations/submit  →  data.payment.session_url
   There is deliberately no client-side signed fallback.
──────────────────────────────────────────────────────────────────────*/

export const KASHIER_SESSION_ERROR_AR =
  "تعذر فتح بوابة الدفع، حاول مرة أخرى أو استخدم طريقة دفع أخرى";

export interface CreateSessionParams {
  amount: number | string;
  /** Frontend reference hint; the backend reference wins when returned. */
  orderId: string;
  currency?: string;
  donorName?: string;
  donorEmail?: string;
  donorPhone?: string;
  lang?: "ar" | "en";
  /** Donation target — only passed when it comes from the donor's actual selection. */
  caseId?: string | null;
  programId?: string | null;
  campaignId?: string | null;
  message?: string;
}

export interface KashierSessionResult {
  sessionUrl: string;
  sessionId?: string;
  orderId: string;
}

export async function createKashierSession(
  params: CreateSessionParams
): Promise<KashierSessionResult> {
  const amount = Number(params.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(KASHIER_SESSION_ERROR_AR);
  }

  let res: any = null;
  try {
    res = await createDonation({
      case_id: params.caseId || undefined,
      category_id: params.programId || undefined,
      ...(params.campaignId ? { donation_campaign_id: params.campaignId } : {}),
      amount,
      currency: params.currency || "EGP",
      donor_name: params.donorName,
      donor_email: params.donorEmail,
      donor_phone: params.donorPhone,
      payment_method: "kashier",
      payment_status: "pending",
      message: params.message,
    });
  } catch (err) {
    console.warn("[Kashier] backend session error:", err);
  }

  const payment = res?.payment;
  const sessionUrl: string | undefined = payment?.session_url;
  if (!sessionUrl || !isKashierCheckoutUrl(sessionUrl)) {
    throw new Error(KASHIER_SESSION_ERROR_AR);
  }

  return {
    sessionUrl,
    sessionId: payment?.session_id,
    orderId: res?.donation?.transaction_reference || res?.ref_code || params.orderId,
  };
}

/** Hosts that may be loaded in the checkout iframe and may post messages to us. */
export const KASHIER_CHECKOUT_ORIGINS = [
  "https://payments.kashier.io",
  "https://checkout.kashier.io",
] as const;

export function isKashierCheckoutUrl(url: string): boolean {
  try {
    const origin = new URL(url).origin;
    return (KASHIER_CHECKOUT_ORIGINS as readonly string[]).includes(origin);
  } catch {
    return false;
  }
}
