import { createClient } from "jsr:@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SITE_URL = Deno.env.get("SITE_URL") ?? "https://elyusr.org";
const FN_URL = `${Deno.env.get("SUPABASE_URL")}/functions/v1/newsletter-track`;

function rewriteLinks(html: string, token: string): string {
  // Rewrite http(s) anchor hrefs to tracking redirect (skip unsubscribe + mailto + #)
  return html.replace(/href=("|')((https?:)?\/\/[^"']+)("|')/gi, (m, q1, url) => {
    if (url.includes("/newsletter/unsubscribe")) return `href=${q1}${url}${q1}`;
    const tracked = `${FN_URL}?t=${token}&u=${encodeURIComponent(url)}`;
    return `href=${q1}${tracked}${q1}`;
  });
}

function pixelTag(token: string): string {
  return `<img src="${FN_URL}?p=1&t=${token}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;outline:none;" />`;
}

function wrapHtml(opts: { subject: string; preheader?: string; body: string; unsubUrl: string; pixel: string; }) {
  const { subject, preheader, body, unsubUrl, pixel } = opts;
  return `<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${subject}</title></head>
<body style="margin:0;background:#f5f3ee;font-family:-apple-system,'Segoe UI',Tahoma,Arial,sans-serif;color:#1a1a1a;direction:rtl;text-align:right;">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ee;padding:24px 12px;"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.06);">
<tr><td style="background:#0c2340;padding:18px 24px;color:#fff;font-weight:800;font-size:18px;">مؤسسة اليسر الخيرية</td></tr>
<tr><td style="padding:24px;line-height:1.8;font-size:15px;">${body}</td></tr>
<tr><td style="padding:16px 24px;border-top:1px solid #eee;font-size:12px;color:#666;text-align:center;">
لاستلامك هذه الرسالة، فأنت مشترك في نشرة اليسر. <a href="${unsubUrl}" style="color:#0c2340;">إلغاء الاشتراك</a>
</td></tr></table></td></tr></table>${pixel}</body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const body = await req.json().catch(() => ({}));
    const { campaign_id, test_email } = body as { campaign_id?: string; test_email?: string };
    if (!campaign_id) {
      return new Response(JSON.stringify({ error: "campaign_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: campaign, error: cErr } = await sb
      .from("newsletter_campaigns").select("*").eq("id", campaign_id).single();
    if (cErr || !campaign) throw cErr || new Error("campaign_not_found");

    // Pick recipients
    let recipients: { id?: string; email: string; unsub: string }[] = [];
    if (test_email) {
      recipients = [{ email: test_email, unsub: `${SITE_URL}/newsletter/unsubscribe?token=test` }];
    } else {
      const { data: subs, error: sErr } = await sb
        .from("newsletter_subscribers")
        .select("id,email,unsubscribe_token")
        .eq("status", "confirmed");
      if (sErr) throw sErr;
      recipients = (subs ?? []).map((s) => ({
        id: s.id, email: s.email,
        unsub: `${SITE_URL}/newsletter/unsubscribe?token=${s.unsubscribe_token}`,
      }));
    }

    if (!recipients.length) {
      return new Response(JSON.stringify({ ok: true, sent: 0, note: "no_recipients" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await sb.from("newsletter_campaigns").update({
      status: "sending",
      recipients_count: recipients.length,
    }).eq("id", campaign_id);

    const SMTP_HOST = Deno.env.get("SMTP_HOST")!;
    const SMTP_PORT = parseInt(Deno.env.get("SMTP_PORT") || "465", 10);
    const SMTP_USER = Deno.env.get("SMTP_USER")!;
    const SMTP_PASS = Deno.env.get("SMTP_PASS")!;
    const FROM_EMAIL = campaign.from_email || Deno.env.get("SMTP_FROM_EMAIL") || SMTP_USER;
    const FROM_NAME = campaign.from_name || Deno.env.get("SMTP_FROM_NAME") || "مؤسسة اليسر";

    const client = new SMTPClient({
      connection: {
        hostname: SMTP_HOST,
        port: SMTP_PORT,
        tls: SMTP_PORT === 465,
        auth: { username: SMTP_USER, password: SMTP_PASS },
      },
    });

    let sent = 0, failed = 0;
    for (const r of recipients) {
      // Create send row to get track_token
      const sendRow = await sb.from("newsletter_sends").insert({
        campaign_id,
        subscriber_id: r.id ?? null,
        email: r.email,
        status: "queued",
      }).select("id, track_token").single();
      if (sendRow.error) { failed++; continue; }

      const token = sendRow.data.track_token as string;
      const trackedHtml = rewriteLinks(campaign.html || "", token);
      const fullHtml = wrapHtml({
        subject: campaign.subject,
        preheader: campaign.preheader ?? undefined,
        body: trackedHtml,
        unsubUrl: r.unsub,
        pixel: pixelTag(token),
      });

      try {
        await client.send({
          from: `${FROM_NAME} <${FROM_EMAIL}>`,
          to: r.email,
          replyTo: campaign.reply_to || undefined,
          subject: campaign.subject,
          content: campaign.text_body || "نسخة نصية غير متوفرة. افتح الرسالة بصيغة HTML لرؤية المحتوى.",
          html: fullHtml,
          headers: {
            "List-Unsubscribe": `<${r.unsub}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        });
        await sb.from("newsletter_sends").update({
          status: "sent", sent_at: new Date().toISOString(),
        }).eq("id", sendRow.data.id);
        sent++;
      } catch (e) {
        await sb.from("newsletter_sends").update({
          status: "failed", error: String((e as Error).message || e).slice(0, 500),
        }).eq("id", sendRow.data.id);
        failed++;
      }
    }
    try { await client.close(); } catch (_) { /* ignore */ }

    if (!test_email) {
      await sb.from("newsletter_campaigns").update({
        status: failed === recipients.length ? "failed" : "sent",
        sent_at: new Date().toISOString(),
        sent_count: sent,
        failed_count: failed,
      }).eq("id", campaign_id);
    } else {
      await sb.from("newsletter_campaigns").update({ status: campaign.status }).eq("id", campaign_id);
    }

    return new Response(JSON.stringify({ ok: true, sent, failed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("newsletter-send error", e);
    return new Response(JSON.stringify({ error: String((e as Error).message || e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});