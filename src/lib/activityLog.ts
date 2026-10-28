import { apiFetch, getApiToken } from "@/data/laravelApi";

/**
 * Insert an activity_log row via Laravel API.
 * Best-effort: failures are swallowed.
 */
export async function logActivity(input: {
  action: string;
  entityType?: string;
  entityId?: string | null;
  summary?: string;
  details?: Record<string, unknown>;
}) {
  if (!getApiToken()) return; // Only log if authenticated
  try {
    await apiFetch("/activity-logs", {
      method: "POST",
      body: {
        action: input.action,
        entity_type: input.entityType ?? null,
        entity_id: input.entityId ?? null,
        summary: input.summary ?? null,
        details: input.details ?? {},
      },
    });
  } catch (e) {
    if (import.meta.env.DEV) {
      console.warn("activity log failed", e);
    }
  }
}
