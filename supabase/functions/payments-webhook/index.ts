// Unified webhook handler for Paymob, Vodafone Cash and InstaPay.
// Updates donation payment_status using the validated state machine.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { createHmac } from "node:crypto";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PAYMOB_HMAC  = Deno.env.get("PAYMOB_HMAC_SECRET") ?? "";
const VODA_SECRET  = Deno.env.get("VODAFONE_WEBHOOK_SECRET") ?? "";
const INSTA_SECRET = Deno.env.get("INSTAPAY_WEBHOOK_SECRET") ?? "";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-signature",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

type Provider = "paymob" | "vodafone" | "instapay";
type Norm = { ref: string; status: "paid" | "failed" | "refunded"; provider_ref?: string };

function verifyPaymob(payload: any, hmac: string) {
  if (!PAYMOB_HMAC) return true; // allow when not configured (dev)
  const o = payload?.obj ?? payload;
  // Paymob HMAC concatenates a fixed list of fields in order
  const fields = [
    "amount_cents","created_at","currency","error_occured","has_parent_transaction",
    "id","integration_id","is_3d_secure","is_auth","is_capture","is_refunded","is_standalone_payment",
    "is_voided","order.id","owner","pending","source_data.pan","source_data.sub_type","source_data.type","success",
  ];
  const get = (path: string) => path.split(".").reduce((a: any, k) => a?.[k], o);
  const concat = fields.map(get).join("");
  const sig = createHmac("sha512", PAYMOB_HMAC).update(concat).digest("hex");
  return sig === hmac;
}

function normalize(provider: Provider, body: any): Norm | null {
  if (provider === "paymob") {
    const o = body?.obj ?? body;
    const ref = o?.payment_key_claims?.extra?.donation_ref || o?.order?.merchant_order_id || o?.merchant_order_id;
    if (!ref) return null;
    if (o?.is_refunded) return { ref, status: "refunded", provider_ref: String(o?.id ?? "") };
    return { ref, status: o?.success ? "paid" : "failed", provider_ref: String(o?.id ?? "") };
  }
  if (provider === "vodafone") {
    // Vodafone Cash callback shape (provider-specific, conservative mapping)
    const ref = body?.merchant_ref || body?.reference || body?.donation_ref;
    const s = String(body?.status ?? body?.txn_status ?? "").toUpperCase();
    if (!ref) return null;
    const status: Norm["status"] = s.includes("SUCCESS") || s === "PAID" ? "paid" : s.includes("REFUND") ? "refunded" : "failed";
    return { ref, status, provider_ref: String(body?.transaction_id ?? "") };
  }
  // instapay
  const ref = body?.merchantOrderId || body?.reference || body?.donation_ref;
  if (!ref) return null;
  const s = String(body?.status ?? "").toUpperCase();
  const status: Norm["status"] = s === "SETTLED" || s === "SUCCESS" ? "paid" : s === "REVERSED" || s === "REFUNDED" ? "refunded" : "failed";
  return { ref, status, provider_ref: String(body?.transactionId ?? "") };
}

function verifyOther(provider: Provider, raw: string, sigHeader: string | null) {
  const secret = provider === "vodafone" ? VODA_SECRET : INSTA_SECRET;
  if (!secret) return true;
  if (!sigHeader) return false;
  const sig = createHmac("sha256", secret).update(raw).digest("hex");
  return sig === sigHeader.replace(/^sha256=/, "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const url = new URL(req.url);
    const provider = (url.searchParams.get("provider") || "paymob").toLowerCase() as Provider;
    if (!["paymob","vodafone","instapay"].includes(provider)) return json({ error: "unknown provider" }, 400);

    const raw = await req.text();
    const body = raw ? JSON.parse(raw) : {};
    const sig = req.headers.get("x-signature") ?? req.headers.get("hmac") ?? url.searchParams.get("hmac");

    const valid = provider === "paymob"
      ? verifyPaymob(body, sig ?? "")
      : verifyOther(provider, raw, sig);
    if (!valid) return json({ error: "invalid signature" }, 401);

    const norm = normalize(provider, body);
    if (!norm) return json({ error: "missing donation reference" }, 400);

    const supa = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: don, error: e1 } = await supa.from("donations")
      .select("id, payment_status").eq("ref_code", norm.ref).maybeSingle();
    if (e1) throw e1;
    if (!don) return json({ error: "donation not found", ref: norm.ref }, 404);

    const { error: e2 } = await supa.from("donations")
      .update({ payment_status: norm.status, payment_method: provider, message: norm.provider_ref ? `provider_ref:${norm.provider_ref}` : undefined })
      .eq("id", don.id);
    if (e2) return json({ error: e2.message, from: don.payment_status, to: norm.status }, 409);

    return json({ ok: true, ref: norm.ref, status: norm.status });
  } catch (e) {
    console.error("webhook error", e);
    return json({ error: (e as Error).message }, 500);
  }
});