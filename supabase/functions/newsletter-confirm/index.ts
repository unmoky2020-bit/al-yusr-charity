import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    let token = "";
    let action: "confirm" | "unsubscribe" = "confirm";
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      token = (body?.token ?? "").toString();
      if (body?.action === "unsubscribe") action = "unsubscribe";
    } else {
      const url = new URL(req.url);
      token = url.searchParams.get("token") ?? "";
      if (url.searchParams.get("action") === "unsubscribe") action = "unsubscribe";
    }
    if (!token || !/^[0-9a-f-]{36}$/i.test(token)) {
      return new Response(JSON.stringify({ error: "invalid_token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    if (action === "unsubscribe") {
      const upd = await sb
        .from("newsletter_subscribers")
        .update({ status: "unsubscribed", unsubscribed_at: new Date().toISOString() })
        .eq("unsubscribe_token", token)
        .select("email")
        .maybeSingle();
      if (upd.error) throw upd.error;
      if (!upd.data) {
        return new Response(JSON.stringify({ error: "not_found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ ok: true, action: "unsubscribed", email: upd.data.email }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const upd = await sb
      .from("newsletter_subscribers")
      .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
      .eq("confirm_token", token)
      .select("email")
      .maybeSingle();
    if (upd.error) throw upd.error;
    if (!upd.data) {
      return new Response(JSON.stringify({ error: "not_found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ ok: true, action: "confirmed", email: upd.data.email }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("newsletter-confirm error", e);
    return new Response(JSON.stringify({ error: "server_error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
