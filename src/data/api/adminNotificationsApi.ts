/**
 * Sending in-app notifications to users from the admin panel — replaces
 * `supabase.from("notifications").insert(...)`.
 *
 * EXISTING (Postman): GET /notifications, GET /notifications/unread-count,
 *                     PATCH /notifications/{id}/read, PATCH /notifications/read-all
 * PROPOSED:           POST /notifications   (admin / case_manager / volunteer_manager only)
 * See backend-handoff/02-replace-supabase-admin.md.
 */
import { sendJson } from "./adminApiHelpers";

export interface SendNotificationInput {
  /** One or more recipient user ids. */
  user_ids: Array<string | number>;
  type?: "info" | "success" | "warning" | "error" | string;
  title_ar: string;
  title_en?: string;
  message_ar: string;
  message_en?: string;
  /** Frontend route opened when the notification is clicked, e.g. "/admin/my-tasks". */
  link?: string | null;
  entity_type?: string | null;
  entity_id?: string | number | null;
}

export const adminNotificationsApi = {
  /** Returns how many notifications the server created (falls back to the number of recipients). */
  async send(input: SendNotificationInput): Promise<number> {
    const res = await sendJson<{ count?: number; sent?: number } | null>("/notifications", "POST", {
      type: "info",
      ...input,
      title_en: input.title_en ?? input.title_ar,
      message_en: input.message_en ?? input.message_ar,
    });
    return Number(res?.count ?? res?.sent ?? input.user_ids.length) || input.user_ids.length;
  },
};
