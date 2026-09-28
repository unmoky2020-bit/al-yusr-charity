// Authenticated upload for case media. Stores under either `case-media` (public)
// or `case-documents` (private) and returns the URL + storage path.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON         = Deno.env.get("SUPABASE_ANON_KEY")!;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const j = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const auth = req.headers.get("Authorization") || "";
    const userClient = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: auth } } });
    const { data: u } = await userClient.auth.getUser();
    if (!u.user) return j({ error: "unauthorized" }, 401);

    // role check (admin / case_manager / volunteer)
    const svc = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: roles } = await svc.from("user_roles").select("role").eq("user_id", u.user.id);
    const allowed = (roles ?? []).some((r: any) => ["admin","case_manager","volunteer"].includes(r.role));
    if (!allowed) return j({ error: "forbidden" }, 403);

    const form = await req.formData();
    const file = form.get("file") as File | null;
    const caseId = String(form.get("case_id") ?? "");
    const visibility = (String(form.get("visibility") ?? "public")) as "public" | "private";
    const docType = String(form.get("doc_type") ?? "image");
    const caption = String(form.get("caption") ?? "");
    if (!file) return j({ error: "file required" }, 400);

    const bucket = visibility === "private" ? "case-documents" : "case-media";
    const ext = (file.name.split(".").pop() || "bin").toLowerCase();
    const path = `${caseId || "misc"}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const buf = new Uint8Array(await file.arrayBuffer());

    const { error: upErr } = await svc.storage.from(bucket).upload(path, buf, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
    if (upErr) return j({ error: upErr.message }, 500);

    let url: string | null = null;
    if (visibility === "public") {
      url = svc.storage.from(bucket).getPublicUrl(path).data.publicUrl;
    } else {
      const { data: signed } = await svc.storage.from(bucket).createSignedUrl(path, 60 * 60 * 24);
      url = signed?.signedUrl ?? null;
    }

    if (caseId) {
      await svc.from("case_documents").insert({
        case_id: caseId,
        storage_path: `${bucket}/${path}`,
        doc_type: docType,
        caption: caption || null,
        is_public: visibility === "public",
        uploaded_by: u.user.id,
      });
    }
    return j({ ok: true, url, bucket, path, visibility });
  } catch (e) {
    console.error(e);
    return j({ error: (e as Error).message }, 500);
  }
});