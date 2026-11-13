/**
 * The email system (backend bundle deploy-2026-11-13e-mail-system):
 * «مركز البريد» in the dashboard, the newsletter editor's live preview, and following a misbaha by email.
 */
import { API_BASE_URL, ApiError, apiFetch, getApiToken, invalidateApiCache } from "@/data/laravelApi";
import { arabicServerMessage } from "@/lib/serverMessages";

export type MailKind =
  | "code" | "welcome" | "receipt" | "delivery" | "failed" | "case_update" | "volunteer"
  | "newsletter" | "newsletter_confirm" | "misbaha_goal" | "misbaha_weekly" | "misbaha_confirm" | "test";

export type MailStatus = "queued" | "sending" | "sent" | "failed" | "cancelled" | "skipped";

export interface MailBudget { limit: number; reserve: number; sent_24h: number; left: number; left_bulk: number }

export interface MailSettings {
  daily_limit: number;
  reserve: number;
  welcome: boolean;
  receipt: boolean;
  delivery: boolean;
  failed: boolean;
  case_update: boolean;
  volunteer: boolean;
  misbaha_goal: boolean;
  misbaha_weekly: boolean;
  track: boolean;
}

export interface MailOverview {
  mailer: string;
  ready: boolean;
  from: string;
  reply_to: string;
  budget: MailBudget;
  by_status: Partial<Record<MailStatus, number>>;
  queued_by_kind: Partial<Record<MailKind, number>>;
  last7: { d: string; c: number; o: number; k: number }[];
  cron: { last_run: string | null; ok: boolean };
  last_pump: string | null;
  settings: MailSettings;
  kinds: Record<string, string>;
  newsletter: { confirmed: number; pending: number; unsubscribed: number };
  misbaha: { active: number; pending: number };
}

export interface MailLogRow {
  id: number;
  to_email: string;
  kind: MailKind;
  subject: string;
  status: MailStatus;
  attempts: number;
  error: string | null;
  campaign_id: number | null;
  send_after: string | null;
  sent_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  created_at: string;
  has_preview: number | boolean;
}

export interface Paged<T> { data: T[]; current_page: number; last_page: number; total: number }

export interface MisbahaFollower {
  id: number;
  email: string;
  name: string | null;
  want_goal: number | boolean;
  want_weekly: number | boolean;
  confirmed_at: string | null;
  unsubscribed_at: string | null;
  goal_notified_at: string | null;
  last_weekly_at: string | null;
  created_at: string;
  room_name: string | null;
  room_slug: string | null;
  total_count: number | null;
  target_total: number | null;
}

/** Labels for every kind, same as the server's (used when the overview hasn't loaded yet). */
export const MAIL_KIND_LABELS: Record<MailKind, string> = {
  code: "رمز تأكيد/استعادة",
  welcome: "ترحيب",
  receipt: "إيصال تبرع",
  delivery: "رحلة التبرع",
  failed: "تبرع لم يكتمل",
  case_update: "تحديث حالة",
  volunteer: "طلب تطوع",
  newsletter: "نشرة بريدية",
  newsletter_confirm: "تأكيد اشتراك النشرة",
  misbaha_goal: "السبحة وصلت الهدف",
  misbaha_weekly: "ملخص السبحة الأسبوعي",
  misbaha_confirm: "اشتراك السبحة",
  test: "تجربة",
};

export const MAIL_STATUS_LABELS: Record<MailStatus, string> = {
  queued: "في الطابور",
  sending: "بيتبعت",
  sent: "اتبعت",
  failed: "فشل",
  cancelled: "اتلغى",
  skipped: "اتخطى",
};

/** Automatic emails the team can switch on/off, with what each one is for. */
export const AUTOMATIONS: { key: keyof MailSettings; kind: MailKind; title: string; when: string }[] = [
  { key: "welcome", kind: "welcome", title: "رسالة الترحيب", when: "أول ما متبرع يعمل حساب" },
  { key: "receipt", kind: "receipt", title: "إيصال التبرع", when: "لما التبرع يتأكد إنه مدفوع" },
  { key: "delivery", kind: "delivery", title: "رحلة التبرع", when: "مع كل خطوة تسليم (اختيار الأسرة، التجهيز، التسليم بالصور)" },
  { key: "case_update", kind: "case_update", title: "تحديث الحالة", when: "لما يتنشر تحديث على حالة المتبرع ساهم فيها" },
  { key: "volunteer", kind: "volunteer", title: "طلب التطوع", when: "لما حد يسجل طلب تطوع" },
  { key: "failed", kind: "failed", title: "تبرع لم يكتمل", when: "لما الدفع يفشل أو يتلغى" },
  { key: "misbaha_goal", kind: "misbaha_goal", title: "السبحة وصلت الهدف", when: "لمتابعين السبحة، مرة واحدة لما العداد يكمل" },
  { key: "misbaha_weekly", kind: "misbaha_weekly", title: "ملخص السبحة الأسبوعي", when: "كل جمعة الساعة 9 الصبح، لو في ذكر جديد" },
];

/** Other templates that always go out (no switch): previewable too. */
export const FIXED_TEMPLATES: { kind: MailKind; title: string; when: string }[] = [
  { kind: "code", title: "رمز التأكيد / استعادة كلمة المرور", when: "بيتبعت فورًا ومش بيقف على الحد اليومي" },
  { kind: "newsletter_confirm", title: "تأكيد الاشتراك في النشرة", when: "لما حد يشترك من الموقع" },
  { kind: "misbaha_confirm", title: "تأكيد متابعة سبحة", when: "لما حد يكتب بريده في صفحة سبحة" },
];

function unwrap<T>(res: unknown): T {
  const r = res as { data?: unknown } | null;
  return (r && typeof r === "object" && "data" in r ? r.data : res) as T;
}

/** Fetches an HTML preview with the admin's token (apiFetch only speaks JSON). */
export async function fetchMailHtml(endpoint: string, body?: unknown): Promise<string> {
  const token = getApiToken();
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      Accept: "text/html,application/json",
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    let msg = "تعذر تحميل المعاينة";
    try {
      const j = JSON.parse(text);
      msg = arabicServerMessage(j?.message, j?.errors) || msg;
    } catch { /* not JSON */ }
    throw new ApiError(msg, res.status);
  }
  return text;
}

export const mailAdminApi = {
  async overview(): Promise<MailOverview> {
    return unwrap<MailOverview>(await apiFetch("/admin/mail/overview", { useCache: false }));
  },
  async log(params: { status?: string; kind?: string; q?: string; page?: number; campaign_id?: string | number } = {}): Promise<Paged<MailLogRow>> {
    return (await apiFetch<Paged<MailLogRow>>("/admin/mail/log", { params: params as Record<string, string>, useCache: false })) as Paged<MailLogRow>;
  },
  logPreview(id: number) {
    return fetchMailHtml(`/admin/mail/log/${id}/preview`);
  },
  async retry(id: number) {
    return apiFetch<{ message: string }>(`/admin/mail/log/${id}/retry`, { method: "POST", body: {} });
  },
  async cancel(id: number) {
    return apiFetch<{ message: string }>(`/admin/mail/log/${id}/cancel`, { method: "POST", body: {} });
  },
  async pump() {
    return apiFetch<{ message: string; data: { sent: number; failed: number; budget: MailBudget } }>("/admin/mail/pump", { method: "POST", body: {} });
  },
  async saveSettings(input: Partial<MailSettings>): Promise<MailSettings> {
    return unwrap<MailSettings>(await apiFetch("/admin/mail/settings", { method: "PUT", body: input }));
  },
  templatePreview(kind: MailKind) {
    return fetchMailHtml(`/admin/mail/templates/${kind}/preview`);
  },
  async templateTest(kind: MailKind, email: string) {
    return apiFetch<{ message: string }>(`/admin/mail/templates/${kind}/test`, { method: "POST", body: { email } });
  },
  /** Live preview of a newsletter being written. */
  preview(doc: { title?: string; preheader?: string | null; eyebrow?: string; hero?: { image: string; alt?: string; link?: string } | null; items: unknown[] }) {
    return fetchMailHtml("/admin/mail/preview", doc);
  },
  async misbahaFollowers(page = 1): Promise<Paged<MisbahaFollower>> {
    return (await apiFetch<Paged<MisbahaFollower>>("/admin/mail/misbaha-subscriptions", { params: { page: String(page) }, useCache: false })) as Paged<MisbahaFollower>;
  },
  async removeMisbahaFollower(id: number) {
    return apiFetch(`/admin/mail/misbaha-subscriptions/${id}`, { method: "DELETE" });
  },
};

export const misbahaMailApi = {
  async subscribe(slug: string, input: { email: string; name?: string; goal?: boolean; weekly?: boolean }) {
    const res = await apiFetch<{ message: string; data: { confirmed: boolean } }>(`/misbaha-rooms/${encodeURIComponent(slug)}/subscribe`, { method: "POST", body: input });
    return { message: res?.message ?? "", confirmed: Boolean(res?.data?.confirmed) };
  },
  async confirm(token: string) {
    const res = await apiFetch<{ message: string; data: { room: { slug: string; name: string } | null } }>("/misbaha-subscriptions/confirm", { method: "POST", body: { token } });
    invalidateApiCache("/misbaha");
    return res?.data?.room ?? null;
  },
  async unsubscribe(token: string) {
    const res = await apiFetch<{ message: string; data: { room: { slug: string; name: string } | null } }>("/misbaha-subscriptions/unsubscribe", { method: "POST", body: { token } });
    return res?.data?.room ?? null;
  },
};
