// AI assistant for admin SEO: generates ai_summary (AR/EN) and FAQ pairs
// from a program/project context. Uses Lovable AI Gateway (no API key needed).
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { title_ar = "", title_en = "", description_ar = "", description_en = "", benefits_ar = [], benefits_en = [], slug = "" } = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "AI key missing" }, 500);

    const sys = `You produce concise, factual SEO content for an Egyptian charity (Al-Yusr, مؤسسة اليسر الخيرية, Mansoura/Dakahlia). Never invent statistics, prices, dates, or partner names. Stay generic when uncertain. Output VALID JSON ONLY matching the requested schema.`;
    const user = `Program slug: ${slug}
Arabic title: ${title_ar}
English title: ${title_en}
Arabic tagline: ${description_ar}
English tagline: ${description_en}
Arabic benefits: ${(benefits_ar || []).join(" | ")}
English benefits: ${(benefits_en || []).join(" | ")}

Return JSON with this exact shape:
{
  "ai_summary_ar": "2-3 short Arabic sentences (max 280 chars) directly answering: what is this program, who benefits, how to donate.",
  "ai_summary_en": "2-3 short English sentences (max 280 chars), same content as Arabic.",
  "faq_ar": ["سؤال | إجابة", "سؤال | إجابة", "سؤال | إجابة", "سؤال | إجابة"],
  "faq_en": ["Question | Answer", "Question | Answer", "Question | Answer", "Question | Answer"]
}
Rules: 4 FAQ pairs each language, each line uses ' | ' separator. Answers ≤ 240 chars. Do not include markdown.`;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: sys }, { role: "user", content: user }],
        response_format: { type: "json_object" },
      }),
    });
    if (r.status === 429) return json({ error: "rate_limited" }, 429);
    if (r.status === 402) return json({ error: "credits_exhausted" }, 402);
    if (!r.ok) return json({ error: "ai_failed", detail: await r.text() }, 500);
    const data = await r.json();
    const raw = data?.choices?.[0]?.message?.content || "{}";
    let parsed: any = {};
    try { parsed = JSON.parse(raw); } catch { parsed = {}; }
    return json({
      ai_summary_ar: String(parsed.ai_summary_ar || "").slice(0, 320),
      ai_summary_en: String(parsed.ai_summary_en || "").slice(0, 320),
      faq_ar: Array.isArray(parsed.faq_ar) ? parsed.faq_ar.join("\n") : "",
      faq_en: Array.isArray(parsed.faq_en) ? parsed.faq_en.join("\n") : "",
    });
  } catch (e) {
    return json({ error: String(e?.message || e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...corsHeaders } });
}