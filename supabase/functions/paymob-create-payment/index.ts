// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PAYMOB_BASE = "https://accept.paymob.com/api";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const {
      amount,
      method = "card", // 'card' | 'wallet'
      donor = {},
      node_id = null,
      case_id = null,
      wallet_phone = null,
      campaign_id = null,
      utm = null,
    } = body || {};

    if (!amount || Number(amount) < 5) {
      return new Response(JSON.stringify({ error: "Invalid amount" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("PAYMOB_API_KEY");
    const integrationId =
      method === "wallet"
        ? Deno.env.get("PAYMOB_INTEGRATION_ID_WALLET")
        : Deno.env.get("PAYMOB_INTEGRATION_ID_CARD");

    if (!apiKey || !integrationId) {
      return new Response(JSON.stringify({ error: "Paymob not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1) Auth token
    const authRes = await fetch(`${PAYMOB_BASE}/auth/tokens`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: apiKey }),
    });
    const authText = await authRes.text();
    let authJson: any = {};
    try { authJson = JSON.parse(authText); } catch { /* non-JSON */ }
    const token: string | undefined = authJson?.token;
    if (!token) {
      console.error("Paymob auth failed", {
        status: authRes.status,
        body: authText?.slice(0, 500),
        apiKeyLen: apiKey?.length ?? 0,
      });
      return new Response(
        JSON.stringify({
          error: "PAYMOB_AUTH_FAILED",
          fallback: true,
          detail: authJson?.detail || authText?.slice(0, 200) || `HTTP ${authRes.status}`,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 2) Create order
    const amountCents = Math.round(Number(amount) * 100);
    const orderRes = await fetch(`${PAYMOB_BASE}/ecommerce/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_token: token,
        delivery_needed: false,
        amount_cents: amountCents,
        currency: "EGP",
        items: [],
      }),
    });
    const orderJson = await orderRes.json();
    const orderId = orderJson?.id;
    if (!orderId) throw new Error("Paymob order failed");

    // 3) Insert pending transaction (service role)
    const { data: tx, error: txErr } = await supabase
      .from("payment_transactions")
      .insert({
        node_id,
        case_id,
        donor_name: donor.name || null,
        donor_email: donor.email || null,
        donor_phone: donor.phone || null,
        amount: Number(amount),
        currency: "EGP",
        provider: "paymob",
        method,
        status: "pending",
        provider_order_id: String(orderId),
        payload: { order: orderJson, utm, campaign_id },
        campaign_id: campaign_id || null,
        utm_source: utm?.utm_source || null,
        utm_medium: utm?.utm_medium || null,
        utm_campaign: utm?.utm_campaign || null,
        utm_term: utm?.utm_term || null,
        utm_content: utm?.utm_content || null,
      })
      .select()
      .single();
    if (txErr) throw txErr;

    // 4) Payment key
    const billing = {
      first_name: (donor.name || "Donor").split(" ")[0] || "Donor",
      last_name: (donor.name || "Al-Yusr").split(" ").slice(1).join(" ") || "Al-Yusr",
      email: donor.email || "donor@elyusr.org",
      phone_number: donor.phone || "+201000000000",
      apartment: "NA", floor: "NA", street: "NA", building: "NA",
      shipping_method: "NA", postal_code: "NA", city: "Mansoura",
      country: "EG", state: "Dakahlia",
    };
    const keyRes = await fetch(`${PAYMOB_BASE}/acceptance/payment_keys`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_token: token,
        amount_cents: amountCents,
        expiration: 3600,
        order_id: orderId,
        billing_data: billing,
        currency: "EGP",
        integration_id: Number(integrationId),
      }),
    });
    const keyJson = await keyRes.json();
    const paymentToken: string | undefined = keyJson?.token;
    if (!paymentToken) throw new Error("Paymob payment key failed");

    let redirect_url: string | null = null;
    if (method === "wallet") {
      // Wallet: POST to payments/pay with source identifier (phone)
      const walletRes = await fetch(`${PAYMOB_BASE}/acceptance/payments/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: { identifier: wallet_phone || donor.phone, subtype: "WALLET" },
          payment_token: paymentToken,
        }),
      });
      const walletJson = await walletRes.json();
      redirect_url = walletJson?.redirect_url || walletJson?.iframe_redirection_url || null;
      await supabase.from("payment_transactions").update({
        payload: { order: orderJson, wallet: walletJson },
        redirect_url,
      }).eq("id", tx.id);
    } else {
      // Card: redirect into iframe
      const iframeId = Deno.env.get("PAYMOB_IFRAME_ID") || "0";
      redirect_url = `https://accept.paymob.com/api/acceptance/iframes/${iframeId}?payment_token=${paymentToken}`;
      await supabase.from("payment_transactions").update({ redirect_url }).eq("id", tx.id);
    }

    return new Response(
      JSON.stringify({
        ok: true,
        ref_code: tx.ref_code,
        transaction_id: tx.id,
        order_id: orderId,
        redirect_url,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message || e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});