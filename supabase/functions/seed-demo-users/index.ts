import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type DbRole = "admin" | "case_manager" | "editor" | "volunteer" | "delegate" | "donor";

const DEMO_USERS: Array<{
  email: string;
  password: string;
  full_name: string;
  role: DbRole;
  phone?: string;
  city?: string;
}> = [
  { email: "admin@elyusr.org",      password: "admin123",  full_name: "مدير اليسر",      role: "admin" },
  { email: "editor@elyusr.org",     password: "editor123", full_name: "محرّر الحالات",   role: "case_manager" },
  { email: "ahmed.v@example.com",   password: "vol123",    full_name: "أحمد متطوع",     role: "volunteer", city: "المنصورة" },
  { email: "delegate@elyusr.org",   password: "delegate123", full_name: "مندوب اليسر",   role: "delegate", city: "المنصورة", phone: "01000000001" },
  { email: "mahmoud@example.com",   password: "donor123",  full_name: "محمود متبرع",    role: "donor" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) {
    return new Response(JSON.stringify({ error: "Missing service credentials" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const results: Array<Record<string, unknown>> = [];

  for (const u of DEMO_USERS) {
    // Check if user already exists by listing (cheap – tiny dataset)
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const existing = list?.users.find((x) => x.email?.toLowerCase() === u.email.toLowerCase());

    let userId: string | undefined = existing?.id;

    if (!existing) {
      const { data: created, error } = await admin.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: {
          full_name: u.full_name,
          phone: u.phone ?? null,
          city: u.city ?? null,
          role: u.role,
        },
      });
      if (error) {
        results.push({ email: u.email, status: "error", error: error.message });
        continue;
      }
      userId = created.user?.id;
      results.push({ email: u.email, status: "created" });
    } else {
      // Reset password to the documented demo password so the credentials stay valid.
      await admin.auth.admin.updateUserById(existing.id, { password: u.password, email_confirm: true });
      results.push({ email: u.email, status: "reset" });
    }

    if (!userId) continue;

    // Ensure profile + role rows exist (handle_new_user trigger creates them on signup,
    // but admin.createUser may run before the trigger if it was disabled, so upsert here).
    await admin.from("profiles").upsert(
      { id: userId, full_name: u.full_name, phone: u.phone ?? null, city: u.city ?? null },
      { onConflict: "id" },
    );
    // Replace existing roles with the canonical demo role
    await admin.from("user_roles").delete().eq("user_id", userId);
    await admin.from("user_roles").insert({ user_id: userId, role: u.role });
  }

  return new Response(JSON.stringify({ ok: true, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});