/**
 * «تواصل معنا» inbox for staff (backend: ContactMessageController, live since 2026-10-29).
 *   GET    /contact-messages?status=&section=&search=&page=
 *   PATCH  /contact-messages/{id}  { status: new | read | replied | archived }
 *   DELETE /contact-messages/{id}
 */
import { apiFetch } from "@/data/laravelApi";

export type ContactStatus = "new" | "read" | "replied" | "archived";

export interface ContactMessage {
  id: number;
  ref_code: string;
  name: string;
  email: string;
  phone: string | null;
  section: string;
  message: string;
  source: string | null;
  status: ContactStatus;
  replied_at: string | null;
  created_at: string;
}

export const CONTACT_STATUS_LABELS: Record<ContactStatus, string> = {
  new: "جديدة",
  read: "اتقرت",
  replied: "اترد عليها",
  archived: "مؤرشفة",
};

export const CONTACT_SECTION_LABELS: Record<string, string> = {
  general: "عام",
  donation: "تبرع",
  qurbani: "أضاحي",
  volunteer: "تطوع",
  partnership: "شراكة / شركات",
};

type Page = { data: ContactMessage[]; current_page: number; last_page: number; total: number };

export const contactMessagesApi = {
  list(params: { page?: number; status?: string; section?: string; search?: string }) {
    return apiFetch<Page>("/contact-messages", {
      params: { per_page: 25, page: params.page, status: params.status || undefined, section: params.section || undefined, search: params.search || undefined },
      useCache: false,
    });
  },
  setStatus(id: number, status: ContactStatus) {
    return apiFetch(`/contact-messages/${id}`, { method: "PATCH", body: { status } });
  },
  remove(id: number) {
    return apiFetch(`/contact-messages/${id}`, { method: "DELETE" });
  },
};
