// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { createHmac } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
};

// Paymob HMAC string concatenates these fields in this exact order
const HMAC_FIELDS = [
  "amount_cents", "created_at", "currency", "error_occured", "has_parent_transaction",
  "id", "integration_id", "is_3d_secure", "is_auth", "is_capture", "is_refunded",
  "is_standalone_payment", "is_voided", "order.id", "owner", "pending",
  "source_data.pan", "source_data.sub_type", "source_data.type", "success",
];

function getPath(obj: any, path: string) {
  return path.split(".").reduce((a, k) => (a == null ? a : a[k]), obj);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const hmacFromQuery = url.searchParams.get("hmac") || "";
  const body = await req.json().catch(() => ({}));
  const obj = body?.obj || {};
  const eventType = body?.type || "transaction";
  const providerTxnId = String(getPath(obj, "id") ?? "");

  const secret = Deno.env.get("PAYMOB_HMAC_SECRET") || "";
  const concat = HMAC_FIELDS.map((f) => String(getPath(obj, f) ?? "")).join("");
  const expected = createHmac("sha512", secret).update(concat).digest("hex");
  const valid = hmacFromQuery && expected === hmacFromQuery;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // ----- Idempotency: skip if we've already processed this provider txn id -----
  if (providerTxnId) {
    const { data: existing } = await supabase
      .from("payment_webhooks")
      .select("id, processed")
      .eq("provider", "paymob")
      .filter("raw->obj->>id", "eq", providerTxnId)
      .maybeSingle();
    if (existing?.processed) {
      return new Response(JSON.stringify({ ok: true, duplicate: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  const orderId = String(getPath(obj, "order.id") ?? "");
  const success = !!obj?.success;
  const pending = !!obj?.pending;
  const errorOccured = !!obj?.error_occured;
  const errorReason =
    getPath(obj, "data.message") ||
    getPath(obj, "data.txn_response_code") ||
    (errorOccured ? "Provider reported error" : null);

  // Update matching transaction
  let txId: string | null = null;
  let updateError: string | null = null;
  if (orderId) {
    const { data: tx } = await supabase
      .from("payment_transactions")
      .select("id, status, retry_count")
      .eq("provider_order_id", orderId)
      .maybeSingle();
    if (tx) {
      txId = tx.id;
      // Don't downgrade a finalised state (paid/refunded) on a late callback.
      const finalised = tx.status === "paid" || tx.status === "refunded";
      let newStatus = tx.status;
      if (!finalised) {
        if (!valid) newStatus = "failed";
        else if (success) newStatus = "paid";
        else if (pending) newStatus = "processing";
        else newStatus = "failed";
      }
      const { error: upErr } = await supabase
        .from("payment_transactions")
        .update({
          status: newStatus,
          provider_txn_id: providerTxnId || null,
          payload: { webhook: obj },
          last_error: newStatus === "failed" ? (errorReason || (!valid ? "Invalid HMAC signature" : "Unknown error")) : null,
        })
        .eq("id", tx.id);
      if (upErr) updateError = upErr.message;
    } else {
      updateError = `No transaction matches order_id=${orderId}`;
    }
  }

  // Audit row — unique index (provider, raw->obj->>id) protects against double-insert.
  const { error: insErr } = await supabase.from("payment_webhooks").insert({
    provider: "paymob",
    event_type: eventType,
    transaction_id: txId,
    raw: { ...body, _processing: { valid, updateError, errorReason } },
    signature: hmacFromQuery,
    signature_valid: valid,
    processed: !updateError,
  });
  // duplicate insert (same provider + provider_txn_id) → swallow, idempotent
  const duplicate = insErr?.message?.includes("uq_payment_webhooks_provider_txn") || false;

  return new Response(JSON.stringify({ ok: true, valid, duplicate, error: updateError }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});