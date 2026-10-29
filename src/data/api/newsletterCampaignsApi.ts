/**
 * Newsletter campaigns (compose + send e-mails to confirmed subscribers) — replaces the Supabase
 * table `newsletter_campaigns` and the edge function `newsletter-send`.
 *
 * EXISTING:  GET /newsletter/statistics   (confirmed subscriber count)
 * PROPOSED:  GET/POST /newsletter-campaigns, GET/PUT/DELETE /newsletter-campaigns/{id},
 *            POST /newsletter-campaigns/{id}/send, POST /newsletter-campaigns/{id}/send-test
 * See backend-handoff/02-replace-supabase-admin.md.
 */
import { apiFetch } from "@/data/laravelApi";
import { fetchItem, fetchList, sendJson } from "./adminApiHelpers";

export interface NewsletterCampaign {
  id: string;
  subject: string;
  preheader: string | null;
  html: string;
  text_body: string | null;
  from_name: string;
  from_email: string | null;
  reply_to: string | null;
  status: string;
  scheduled_at: string | null;
  sent_at: string | null;
  recipients_count: number;
  sent_count: number;
  failed_count: number;
  opened_count: number;
  clicked_count: number;
  created_at: string;
}

export type NewsletterCampaignInput = Pick<NewsletterCampaign,
  "subject" | "preheader" | "html" | "text_body" | "from_name" | "from_email" | "reply_to" | "status" | "scheduled_at">;

export interface NewsletterSendResult {
  sent: number;
  failed: number;
  message?: string;
}

function normalize(r: Record<string, unknown>): NewsletterCampaign {
  const n = (v: unknown) => Number(v ?? 0) || 0;
  const s = (v: unknown) => (v === null || v === undefined ? null : String(v));
  return {
    id: String(r.id),
    subject: String(r.subject ?? ""),
    preheader: s(r.preheader),
    html: String(r.html ?? ""),
    text_body: s(r.text_body),
    from_name: String(r.from_name ?? "مؤسسة اليسر"),
    from_email: s(r.from_email),
    reply_to: s(r.reply_to),
    status: String(r.status ?? "draft"),
    scheduled_at: s(r.scheduled_at),
    sent_at: s(r.sent_at),
    recipients_count: n(r.recipients_count),
    sent_count: n(r.sent_count),
    failed_count: n(r.failed_count),
    opened_count: n(r.opened_count),
    clicked_count: n(r.clicked_count),
    created_at: String(r.created_at ?? ""),
  };
}

export const newsletterCampaignsApi = {
  async list(): Promise<NewsletterCampaign[]> {
    const rows = await fetchList<Record<string, unknown>>("/newsletter-campaigns", { per_page: 200 });
    return rows.map(normalize).sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
  },
  async get(id: string): Promise<NewsletterCampaign> {
    return normalize(await fetchItem<Record<string, unknown>>(`/newsletter-campaigns/${id}`));
  },
  async create(input: NewsletterCampaignInput): Promise<NewsletterCampaign> {
    return normalize(await sendJson<Record<string, unknown>>("/newsletter-campaigns", "POST", input));
  },
  async update(id: string, input: NewsletterCampaignInput): Promise<NewsletterCampaign> {
    return normalize(await sendJson<Record<string, unknown>>(`/newsletter-campaigns/${id}`, "PUT", input));
  },
  remove(id: string) {
    return sendJson<void>(`/newsletter-campaigns/${id}`, "DELETE");
  },
  /** Queue the campaign for every confirmed subscriber. */
  async send(id: string): Promise<NewsletterSendResult> {
    const res = await apiFetch<Record<string, unknown>>(`/newsletter-campaigns/${id}/send`, { method: "POST", body: {} });
    const d = ((res?.data as Record<string, unknown>) ?? res ?? {}) as Record<string, unknown>;
    return { sent: Number(d.sent ?? d.sent_count ?? 0), failed: Number(d.failed ?? d.failed_count ?? 0), message: res?.message as string | undefined };
  },
  /** Send one test copy to `email`. */
  async sendTest(id: string, email: string): Promise<NewsletterSendResult> {
    const res = await apiFetch<Record<string, unknown>>(`/newsletter-campaigns/${id}/send-test`, { method: "POST", body: { email } });
    const d = ((res?.data as Record<string, unknown>) ?? res ?? {}) as Record<string, unknown>;
    return { sent: Number(d.sent ?? 1), failed: Number(d.failed ?? 0), message: res?.message as string | undefined };
  },
  /** Confirmed subscribers (existing endpoint GET /newsletter/statistics). */
  async confirmedCount(): Promise<number> {
    const res = await apiFetch<Record<string, unknown>>("/newsletter/statistics", { method: "GET", useCache: false });
    const d = ((res?.data as Record<string, unknown>) ?? res ?? {}) as Record<string, unknown>;
    return Number(d.confirmed ?? 0) || 0;
  },
};
