import { createClient } from "jsr:@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SITE_URL =
  Deno.env.get("SITE_URL") ?? "https://elyusr.org";

function isEmail(s: unknown): s is string {
  return typeof s === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length <= 254;
}

async function hashIp(ip: string | null): Promise<string | null> {
  if (!ip) return null;
  const data = new TextEncoder().encode(ip + "|alyusr-newsletter");
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const email = (body?.email ?? "").toString().trim().toLowerCase();
    const lang = body?.lang === "en" ? "en" : "ar";
    const source = (body?.source ?? "footer").toString().slice(0, 64);

    if (!isEmail(email)) {
      return new Response(JSON.stringify({ error: "invalid_email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = Deno.env.get("SUPABASE_URL")!;
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(url, key);

    const ip =
      req.headers.get("cf-connecting-ip") ??
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      null;
    const ip_hash = await hashIp(ip);
    const user_agent = (req.headers.get("user-agent") ?? "").slice(0, 256);

    // Upsert by email — keeps tokens stable when re-subscribing.
    const existing = await sb
      .from("newsletter_subscribers")
      .select("id, status, confirm_token, unsubscribe_token")
      .eq("email", email)
      .maybeSingle();

    let row = existing.data;
    if (!row) {
      const ins = await sb
        .from("newsletter_subscribers")
        .insert({ email, lang, source, ip_hash, user_agent })
        .select("id, status, confirm_token, unsubscribe_token")
        .single();
      if (ins.error) throw ins.error;
      row = ins.data;
    } else if (row.status === "unsubscribed" || row.status === "bounced") {
      const upd = await sb
        .from("newsletter_subscribers")
        .update({ status: "pending", lang, source, unsubscribed_at: null })
        .eq("id", row.id)
        .select("id, status, confirm_token, unsubscribe_token")
        .single();
      if (upd.error) throw upd.error;
      row = upd.data;
    }

    const confirmUrl = `${SITE_URL}/newsletter/confirm?token=${row!.confirm_token}`;
    const unsubscribeUrl = `${SITE_URL}/newsletter/unsubscribe?token=${row!.unsubscribe_token}`;

    // Try to send confirmation email via Hostinger SMTP if configured.
    let emailSent = false;
    try {
      const SMTP_HOST = Deno.env.get("SMTP_HOST");
      const SMTP_USER = Deno.env.get("SMTP_USER");
      const SMTP_PASS = Deno.env.get("SMTP_PASS");
      if (SMTP_HOST && SMTP_USER && SMTP_PASS && row!.status !== "confirmed") {
        const SMTP_PORT = parseInt(Deno.env.get("SMTP_PORT") || "465", 10);
        const FROM_EMAIL = Deno.env.get("SMTP_FROM_EMAIL") || SMTP_USER;
        const FROM_NAME = Deno.env.get("SMTP_FROM_NAME") || "مؤسسة اليسر";
        const client = new SMTPClient({
          connection: {
            hostname: SMTP_HOST, port: SMTP_PORT, tls: SMTP_PORT === 465,
            auth: { username: SMTP_USER, password: SMTP_PASS },
          },
        });
        const subject = lang === "ar" ? "أكّد اشتراكك في نشرة اليسر" : "Confirm your Al-Yusr subscription";
        const html = `<!doctype html><html dir="${lang === "ar" ? "rtl" : "ltr"}" lang="${lang}"><body style="margin:0;background:#f5f3ee;font-family:-apple-system,Segoe UI,Tahoma,Arial,sans-serif;color:#1a1a1a;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ee;padding:24px 12px;"><tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 18px rgba(0,0,0,.06);">
<tr><td style="background:#0c2340;padding:18px 24px;color:#fff;font-weight:800;">مؤسسة اليسر الخيرية</td></tr>
<tr><td style="padding:24px;line-height:1.8;">
<h2 style="margin:0 0 8px;color:#0c2340;">${lang === "ar" ? "خطوة أخيرة لتأكيد اشتراكك" : "One last step"}</h2>
<p>${lang === "ar" ? "اضغط الزر التالي لتأكيد بريدك واستلام نشرة اليسر." : "Click the button below to confirm your subscription."}</p>
<p style="text-align:center;margin:24px 0;"><a href="${confirmUrl}" style="display:inline-block;background:#c9a84c;color:#0c2340;padding:14px 28px;border-radius:12px;font-weight:800;text-decoration:none;">${lang === "ar" ? "تأكيد الاشتراك" : "Confirm subscription"}</a></p>
<p style="font-size:12px;color:#666;direction:ltr;text-align:left;">${confirmUrl}</p>
</td></tr>
<tr><td style="padding:14px 24px;border-top:1px solid #eee;font-size:12px;color:#666;text-align:center;">
${lang === "ar" ? "لو ما طلبتش الاشتراك، تجاهل الرسالة." : "If you didn't request this, ignore this email."}
 &middot; <a href="${unsubscribeUrl}" style="color:#0c2340;">${lang === "ar" ? "إلغاء" : "Unsubscribe"}</a>
</td></tr></table></td></tr></table></body></html>`;
        await client.send({
          from: `${FROM_NAME} <${FROM_EMAIL}>`,
          to: email,
          subject,
          content: `${subject}\n\n${confirmUrl}`,
          html,
          headers: { "List-Unsubscribe": `<${unsubscribeUrl}>` },
        });
        await client.close();
        emailSent = true;
      }
    } catch (e) {
      console.error("smtp send failed", e);
    }

    return new Response(
      JSON.stringify({
        ok: true,
        status: row!.status,
        confirmUrl,
        unsubscribeUrl,
        emailSent,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("newsletter-subscribe error", e);
    return new Response(JSON.stringify({ error: "server_error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
