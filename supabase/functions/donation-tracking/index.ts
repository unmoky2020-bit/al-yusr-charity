// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const mapDonation = (row: any) => row ? ({
  ref_code: row.ref_code,
  donor_name: row.donor_name,
  donor_email: row.donor_email,
  donor_phone: row.donor_phone,
  amount: row.amount,
  currency: row.currency,
  category_id: row.category_id,
  message: row.message,
  payment_method: row.payment_method,
  payment_status: row.payment_status,
  created_at: row.created_at,
}) : null;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const ref = String(body?.ref || "").trim().toUpperCase();
    if (!/^[A-Z]{1,4}-[A-Z0-9-]{4,40}$/.test(ref)) {
      return new Response(JSON.stringify({ error: "Invalid reference" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: donation, error } = await supabase
      .from("donations")
      .select("id, ref_code, donor_name, donor_email, donor_phone, amount, currency, category_id, message, payment_method, payment_status, created_at")
      .eq("ref_code", ref)
      .maybeSingle();
    if (error) throw error;
    if (!donation) return new Response(JSON.stringify({ donation: null, audit: [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: audit } = await supabase
      .from("donation_status_audit")
      .select("id, old_status, new_status, changed_by_label, source, note, created_at")
      .eq("donation_id", donation.id)
      .order("created_at", { ascending: true });

    return new Response(JSON.stringify({ donation: mapDonation(donation), audit: audit || [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message || e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
