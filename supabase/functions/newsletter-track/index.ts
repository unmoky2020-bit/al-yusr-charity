import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

// 1x1 transparent gif
const PIXEL = Uint8Array.from(atob(
  "R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==",
), (c) => c.charCodeAt(0));

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const t = url.searchParams.get("t") || "";
    const isPixel = url.searchParams.get("p") === "1";
    const target = url.searchParams.get("u");

    if (!/^[0-9a-f-]{36}$/i.test(t)) {
      // ignore invalid tokens but still respond gracefully
      if (isPixel) return new Response(PIXEL, { headers: { "Content-Type": "image/gif" } });
      return Response.redirect(target || "https://elyusr.org", 302);
    }

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const send = await sb.from("newsletter_sends")
      .select("id, campaign_id, opened_at, clicked_at")
      .eq("track_token", t).maybeSingle();

    if (send.data) {
      if (isPixel && !send.data.opened_at) {
        await sb.from("newsletter_sends").update({ opened_at: new Date().toISOString() })
          .eq("id", send.data.id);
        const cur = await sb.from("newsletter_campaigns")
          .select("opened_count").eq("id", send.data.campaign_id).maybeSingle();
        await sb.from("newsletter_campaigns")
          .update({ opened_count: (cur.data?.opened_count ?? 0) + 1 })
          .eq("id", send.data.campaign_id);
      } else if (!isPixel && target) {
        if (!send.data.clicked_at) {
          await sb.from("newsletter_sends").update({
            clicked_at: new Date().toISOString(),
            click_url: target.slice(0, 500),
          }).eq("id", send.data.id);
          const cur = await sb.from("newsletter_campaigns")
            .select("clicked_count").eq("id", send.data.campaign_id).maybeSingle();
          await sb.from("newsletter_campaigns")
            .update({ clicked_count: (cur.data?.clicked_count ?? 0) + 1 })
            .eq("id", send.data.campaign_id);
        }
      }
    }

    if (isPixel) {
      return new Response(PIXEL, {
        headers: {
          "Content-Type": "image/gif",
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      });
    }
    return Response.redirect(target || "https://elyusr.org", 302);
  } catch (e) {
    console.error("newsletter-track error", e);
    return new Response(PIXEL, { headers: { "Content-Type": "image/gif" } });
  }
});