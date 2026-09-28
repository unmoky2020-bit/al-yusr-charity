// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const amount = Number(body.amount);
    const donorName = String(body.donor_name || "").trim();
    const donorEmail = body.donor_email ? String(body.donor_email).trim() : null;
    const donorPhone = String(body.donor_phone || "").replace(/\s+/g, "");
    const paymentMethod = String(body.payment_method || "").trim();
    const paymentStatus = String(body.payment_status || "pending").trim();
    const currency = String(body.currency || "EGP").trim().toUpperCase();
    const idempotencyKey = body.idempotency_key ? String(body.idempotency_key).trim() : null;

    if (!Number.isFinite(amount) || amount < 10 || amount > 1_000_000) return json({ error: "Invalid donation amount" }, 400);
    if (donorName.length < 2 || donorName.length > 120) return json({ error: "Invalid donor name" }, 400);
    if (!/^01[0-9]{9}$/.test(donorPhone)) return json({ error: "Invalid donor phone" }, 400);
    if (donorEmail && (donorEmail.length > 255 || !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(donorEmail))) return json({ error: "Invalid donor email" }, 400);
    if (!/^[A-Za-z0-9_-]{1,80}$/.test(paymentMethod)) return json({ error: "Invalid payment method" }, 400);
    if (currency !== "EGP" || paymentStatus !== "pending") return json({ error: "Invalid donation request" }, 400);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || serviceKey;
    const service = createClient(supabaseUrl, serviceKey);

    const { data: activeMethod, error: methodError } = await service
      .from("payment_methods")
      .select("key")
      .eq("key", paymentMethod)
      .eq("active", true)
      .maybeSingle();
    if (methodError) throw methodError;
    if (!activeMethod) return json({ error: "Payment method is unavailable" }, 400);

    let donorId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const authClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
      const { data: authData } = await authClient.auth.getUser();
      donorId = authData.user?.id ?? null;
    }

    if (idempotencyKey) {
      const { data: existing } = await service
        .from("donations")
        .select("id,ref_code,amount,currency,payment_status,payment_method,created_at")
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle();
      if (existing) return json({ donation: existing });
    }

    const payload = {
      donor_id: donorId,
      case_id: body.case_id || null,
      category_id: body.category_id || null,
      amount,
      currency,
      donor_name: donorName,
      donor_email: donorEmail,
      donor_phone: donorPhone,
      message: body.message ? String(body.message).trim().slice(0, 500) : null,
      payment_method: paymentMethod,
      payment_status: paymentStatus,
      idempotency_key: idempotencyKey,
    };

    const { data, error } = await service
      .from("donations")
      .insert(payload)
      .select("id,ref_code,amount,currency,payment_status,payment_method,created_at")
      .single();

    if (error) {
      if (idempotencyKey && error.code === "23505") {
        const { data: existing } = await service
          .from("donations")
          .select("id,ref_code,amount,currency,payment_status,payment_method,created_at")
          .eq("idempotency_key", idempotencyKey)
          .maybeSingle();
        if (existing) return json({ donation: existing });
      }
      throw error;
    }

    return json({ donation: data });
  } catch (e) {
    console.error("create-public-donation failed", e);
    return json({ error: String((e as Error).message || e) }, 500);
  }
});