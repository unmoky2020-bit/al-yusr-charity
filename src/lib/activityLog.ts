import { supabase } from "@/integrations/supabase/client";

/**
 * Insert an activity_log row for the current user.
 * Best-effort: failures are swallowed and logged to console only.
 */
export async function logActivity(input: {
  action: string;
  entityType?: string;
  entityId?: string | null;
  summary?: string;
  details?: Record<string, unknown>;
}) {
  try {
    const { data: sess } = await supabase.auth.getSession();
    const u = sess.session?.user;
    if (!u) return;
    const meta = (u.user_metadata || {}) as Record<string, unknown>;
    const { data: roleRows } = await supabase
      .from("user_roles").select("role").eq("user_id", u.id).limit(1);
    const role = roleRows?.[0]?.role ?? null;
    await supabase.from("activity_log" as any).insert({
      actor_id: u.id,
      actor_name: (meta.full_name as string) || u.email || "",
      actor_role: role,
      action: input.action,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      summary: input.summary ?? null,
      details: input.details ?? {},
    });
  } catch (e) {
    if (import.meta.env.DEV) {
      console.warn("activity log failed", e);
    }
  }
}
