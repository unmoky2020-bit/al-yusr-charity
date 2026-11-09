/**
 * Impact & transparency — one typed client for everything that shows where the money went.
 *
 * Public (no sign-in):
 *   GET /impact                      the impact report: totals, programs/campaigns, distribution days, finished cases
 *   GET /impact/{kind}/{key}         one program / project / campaign / case
 *   GET /cases/{case}/file           a case's transparency file (lines, receipts, follower, outcome)
 * Team:
 *   case lines, follower, outcome, history · delivery photos + undo · distribution days
 *
 * The backend sends money as strings ("1500.00"); everything is turned into numbers here.
 */
import { apiFetch, invalidateApiCache, ApiError } from "@/data/laravelApi";
import { parseDelivery, type DeliveryInfo, type DeliveryLineStage } from "@/lib/deliveryJourney";

export type ImpactKind = "program" | "project" | "campaign" | "case";
export const IMPACT_KINDS: ImpactKind[] = ["program", "project", "campaign", "case"];

const num = (v: unknown): number => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : 0;
};
const numOrNull = (v: unknown): number | null => (v === null || v === undefined || v === "" ? null : num(v));
const str = (v: unknown): string | undefined => (v === null || v === undefined || v === "" ? undefined : String(v));
const strs = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.length > 0) : []);
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === "object" ? (v as Record<string, unknown>) : {});
const list = (v: unknown): Record<string, unknown>[] => (Array.isArray(v) ? v.map(obj) : []);
const data = (res: unknown) => obj(res).data;

/* ── public report ────────────────────────────────────────────────────────── */

export interface ImpactTarget {
  kind: ImpactKind;
  id: number;
  slug?: string;
  landing_slug?: string;
  name?: string;
  image?: string;
}

export interface DonationNumbers {
  collected: number;
  donations: number;
  donors: number;
  delivered: number;
  on_the_way: number;
}

export interface CaseNumbers {
  cases: number;
  completed: number;
  spent: number;
  items_delivered: number;
}

export type ImpactNumbers = DonationNumbers & CaseNumbers & { families: number; distributions: number };

export interface ImpactTargetRow extends ImpactTarget, DonationNumbers {
  families: number;
  distributions: number;
  last_distribution_on: string | null;
}

export interface DistributionCard {
  id: number;
  title: string;
  happened_on?: string;
  place?: string;
  stage: DeliveryLineStage;
  note?: string;
  photos: string[];
  families_count: number;
  donations_count: number;
  target?: ImpactTarget;
}

export type CaseResult = "completed" | "cancelled" | "transferred";
export interface CaseOutcome {
  result: CaseResult;
  summary: string;
  before_url?: string;
  after_url?: string;
  transfer_note?: string;
  completed_on?: string;
}

export interface ImpactCaseCard {
  code: string;
  title: string;
  place?: string;
  status: string;
  cover?: string;
  target: number;
  collected: number;
  spent: number;
  outcome?: CaseOutcome;
}

export interface ImpactOverview {
  totals: ImpactNumbers;
  targets: ImpactTargetRow[];
  distributions: DistributionCard[];
  finished_cases: ImpactCaseCard[];
  updated_at?: string;
}

export interface ImpactTargetReport {
  target: ImpactTarget;
  numbers: ImpactNumbers;
  monthly: { month: string; amount: number; count: number }[];
  distributions: DistributionCard[];
  cases: ImpactCaseCard[];
}

function toTarget(raw: unknown): ImpactTarget | undefined {
  const r = obj(raw);
  if (!r.kind || r.id === undefined) return undefined;
  return { kind: r.kind as ImpactKind, id: num(r.id), slug: str(r.slug), landing_slug: str(r.landing_slug), name: str(r.name), image: str(r.image) };
}

const toDonationNumbers = (r: Record<string, unknown>): DonationNumbers => ({
  collected: num(r.collected), donations: num(r.donations), donors: num(r.donors), delivered: num(r.delivered), on_the_way: num(r.on_the_way),
});

const toNumbers = (raw: unknown): ImpactNumbers => {
  const r = obj(raw);
  return {
    ...toDonationNumbers(r),
    families: num(r.families), distributions: num(r.distributions),
    cases: num(r.cases), completed: num(r.completed), spent: num(r.spent), items_delivered: num(r.items_delivered),
  };
};

export function toDistributionCard(raw: unknown): DistributionCard {
  const r = obj(raw);
  return {
    id: num(r.id),
    title: String(r.title ?? ""),
    happened_on: str(r.happened_on),
    place: str(r.place),
    stage: (str(r.stage) ?? "delivered") as DeliveryLineStage,
    note: str(r.note),
    photos: strs(r.photos),
    families_count: num(r.families_count),
    donations_count: num(r.donations_count),
    target: toTarget(r.target),
  };
}

function toOutcome(raw: unknown): CaseOutcome | undefined {
  const r = obj(raw);
  if (!r.result) return undefined;
  return {
    result: r.result as CaseResult, summary: String(r.summary ?? ""), before_url: str(r.before_url), after_url: str(r.after_url),
    transfer_note: str(r.transfer_note), completed_on: str(r.completed_on)?.slice(0, 10),
  };
}

const toCaseCard = (r: Record<string, unknown>): ImpactCaseCard => ({
  code: String(r.code ?? ""), title: String(r.title ?? ""), place: str(r.place), status: String(r.status ?? ""), cover: str(r.cover),
  target: num(r.target), collected: num(r.collected), spent: num(r.spent), outcome: toOutcome(r.outcome),
});

export async function fetchImpactOverview(): Promise<ImpactOverview> {
  const d = obj(data(await apiFetch<unknown>("/impact", { ttlMs: 60_000 })));
  return {
    totals: toNumbers(d.totals),
    targets: list(d.targets).map((r) => ({
      ...(toTarget(r) as ImpactTarget), ...toDonationNumbers(r),
      families: num(r.families), distributions: num(r.distributions), last_distribution_on: str(r.last_distribution_on) ?? null,
    })),
    distributions: list(d.distributions).map(toDistributionCard),
    finished_cases: list(d.finished_cases).map(toCaseCard),
    updated_at: str(d.updated_at),
  };
}

export async function fetchImpactTarget(kind: ImpactKind, key: string | number): Promise<ImpactTargetReport> {
  const d = obj(data(await apiFetch<unknown>(`/impact/${kind}/${encodeURIComponent(String(key))}`, { ttlMs: 60_000 })));
  const target = toTarget(d.target);
  if (!target) throw new ApiError("مش لاقيين التقرير ده", 404);
  return {
    target,
    numbers: toNumbers(d.numbers),
    monthly: list(d.monthly).map((m) => ({ month: String(m.month ?? ""), amount: num(m.amount), count: num(m.count) })),
    distributions: list(d.distributions).map(toDistributionCard),
    cases: list(d.cases).map(toCaseCard),
  };
}

/* ── a case's transparency file ───────────────────────────────────────────── */

export type CaseItemStatus = "planned" | "purchased" | "delivered" | "cancelled";
export const CASE_ITEM_STATUSES: CaseItemStatus[] = ["planned", "purchased", "delivered", "cancelled"];

export interface CaseItem {
  id: number;
  title: string;
  quantity: number;
  estimated_cost: number;
  actual_cost: number | null;
  status: CaseItemStatus;
  receipt_url?: string;
  photo_url?: string;
  note?: string;
  purchased_on?: string;
  delivered_on?: string;
}

export interface PersonCard {
  id?: number;
  name: string;
  email?: string;
  avatar_url?: string;
}

export interface CaseFile {
  case_id: number;
  items: CaseItem[];
  totals: {
    target: number;
    collected: number;
    budget: number;
    spent: number;
    balance: number;
    funded_pct: number | null;
    items: { all: number; purchased: number; delivered: number; planned: number };
  };
  follower: { user: PersonCard | null; note?: string; since?: string } | null;
  outcome: CaseOutcome | null;
}

/** Money already spent on a line (bought or handed over), the same rule as the backend. */
export const itemSpent = (i: CaseItem): number => (i.status === "purchased" || i.status === "delivered" ? (i.actual_cost ?? i.estimated_cost) : 0);

const toPerson = (raw: unknown): PersonCard | null => {
  const r = obj(raw);
  if (!r.name) return null;
  return { id: r.id === undefined ? undefined : num(r.id), name: String(r.name), email: str(r.email), avatar_url: str(r.avatar_url) };
};

export const toCaseItem = (r: Record<string, unknown>): CaseItem => ({
  id: num(r.id),
  title: String(r.title ?? ""),
  quantity: Math.max(1, num(r.quantity) || 1),
  estimated_cost: num(r.estimated_cost),
  actual_cost: numOrNull(r.actual_cost),
  status: (CASE_ITEM_STATUSES as string[]).includes(String(r.status)) ? (r.status as CaseItemStatus) : "planned",
  receipt_url: str(r.receipt_url),
  photo_url: str(r.photo_url),
  note: str(r.note),
  purchased_on: str(r.purchased_on)?.slice(0, 10),
  delivered_on: str(r.delivered_on)?.slice(0, 10),
});

export function toCaseFile(raw: unknown): CaseFile {
  const d = obj(raw);
  const t = obj(d.totals);
  const ti = obj(t.items);
  const f = d.follower ? obj(d.follower) : null;
  return {
    case_id: num(d.case_id),
    items: list(d.items).map(toCaseItem),
    totals: {
      target: num(t.target), collected: num(t.collected), budget: num(t.budget), spent: num(t.spent), balance: num(t.balance),
      funded_pct: numOrNull(t.funded_pct),
      items: { all: num(ti.all), purchased: num(ti.purchased), delivered: num(ti.delivered), planned: num(ti.planned) },
    },
    follower: f ? { user: toPerson(f.user), note: str(f.note), since: str(f.since) } : null,
    outcome: toOutcome(d.outcome) ?? null,
  };
}

const caseKey = (c: string | number) => encodeURIComponent(String(c));

/** The file as the viewer may see it (team members get the full names; visitors a first name). */
export async function fetchCaseFile(caseKeyOrId: string | number, opts: { fresh?: boolean } = {}): Promise<CaseFile> {
  return toCaseFile(data(await apiFetch<unknown>(`/cases/${caseKey(caseKeyOrId)}/file`, { useCache: !opts.fresh, ttlMs: 30_000 })));
}

export interface CaseItemInput {
  title?: string;
  quantity?: number;
  estimated_cost?: number;
  actual_cost?: number | null;
  status?: CaseItemStatus;
  receipt_url?: string | null;
  photo_url?: string | null;
  note?: string | null;
  purchased_on?: string | null;
  delivered_on?: string | null;
}

export interface CaseHistoryRow { id: number; action: string; summary: string; by?: string; at?: string }
export interface TeamMember { id: number; name: string; email?: string; avatar_url?: string; roles: string[]; following: number }

const dropCaseCaches = () => {
  invalidateApiCache("/cases/");
  invalidateApiCache("/impact");
};

export const caseFileApi = {
  async addItem(caseId: string | number, input: CaseItemInput): Promise<void> {
    await apiFetch(`/cases/${caseKey(caseId)}/items`, { method: "POST", body: input });
    dropCaseCaches();
  },
  async updateItem(itemId: number, input: CaseItemInput): Promise<void> {
    await apiFetch(`/case-items/${itemId}`, { method: "PUT", body: input });
    dropCaseCaches();
  },
  async removeItem(itemId: number): Promise<void> {
    await apiFetch(`/case-items/${itemId}`, { method: "DELETE" });
    dropCaseCaches();
  },
  async reorder(caseId: string | number, ids: number[]): Promise<CaseFile> {
    const res = await apiFetch<unknown>(`/cases/${caseKey(caseId)}/items/reorder`, { method: "POST", body: { ids } });
    dropCaseCaches();
    return toCaseFile(data(res));
  },
  async setFollower(caseId: string | number, userId: number | null, note?: string): Promise<CaseFile> {
    const res = await apiFetch<unknown>(`/cases/${caseKey(caseId)}/follower`, { method: "PUT", body: { user_id: userId, note: note?.trim() || null } });
    dropCaseCaches();
    return toCaseFile(data(res));
  },
  async saveOutcome(caseId: string | number, input: CaseOutcome & { mark_case_completed?: boolean }): Promise<CaseFile> {
    const res = await apiFetch<unknown>(`/cases/${caseKey(caseId)}/outcome`, {
      method: "PUT",
      body: {
        result: input.result, summary: input.summary.trim(), before_url: input.before_url || null, after_url: input.after_url || null,
        transfer_note: input.transfer_note?.trim() || null, completed_on: input.completed_on || null,
        mark_case_completed: input.mark_case_completed ?? true,
      },
    });
    dropCaseCaches();
    invalidateApiCache("/cases");
    return toCaseFile(data(res));
  },
  async clearOutcome(caseId: string | number): Promise<CaseFile> {
    const res = await apiFetch<unknown>(`/cases/${caseKey(caseId)}/outcome`, { method: "DELETE" });
    dropCaseCaches();
    return toCaseFile(data(res));
  },
  async history(caseId: string | number): Promise<CaseHistoryRow[]> {
    const res = await apiFetch<unknown>(`/cases/${caseKey(caseId)}/history`, { useCache: false });
    return list(data(res)).map((r) => ({ id: num(r.id), action: String(r.action ?? ""), summary: String(r.summary ?? ""), by: str(r.by), at: str(r.at) }));
  },
  async team(): Promise<TeamMember[]> {
    const res = await apiFetch<unknown>("/impact/team", { ttlMs: 60_000 });
    return list(data(res)).map((r) => ({
      id: num(r.id), name: String(r.name ?? ""), email: str(r.email), avatar_url: str(r.avatar_url), roles: strs(r.roles), following: num(r.following),
    }));
  },
  async myCases(): Promise<{ id: number; code: string; title: string; status: string; city?: string; file: CaseFile }[]> {
    const res = await apiFetch<unknown>("/impact/my-cases", { useCache: false });
    return list(data(res)).map((r) => ({ id: num(r.id), code: String(r.code ?? ""), title: String(r.title ?? ""), status: String(r.status ?? ""), city: str(r.city), file: toCaseFile(r.file) }));
  },
};

/* ── a donation's trail ───────────────────────────────────────────────────── */

export const deliveryApi = {
  /** Adds a line to a PAID donation's trail; on_hold needs the reason in `note`. Returns the saved trail. */
  async add(donationId: string | number, stage: DeliveryLineStage, opts: { note?: string; photos?: string[]; notify?: boolean } = {}): Promise<DeliveryInfo | null> {
    const res = await apiFetch<unknown>(`/donations/${donationId}/delivery`, {
      method: "PATCH",
      body: { stage, note: opts.note?.trim() || undefined, photos: opts.photos?.length ? opts.photos : undefined, notify: opts.notify ?? true },
    });
    invalidateApiCache("/donations");
    invalidateApiCache("/impact");
    return parseDelivery(obj(data(res)).delivery);
  },
  /** Removes the last line (a mistake). */
  async undoLast(donationId: string | number): Promise<DeliveryInfo | null> {
    const res = await apiFetch<unknown>(`/donations/${donationId}/delivery/last`, { method: "DELETE" });
    invalidateApiCache("/donations");
    invalidateApiCache("/impact");
    return parseDelivery(obj(data(res)).delivery);
  },
};

/** Uploads one (already blurred) photo for an impact record and returns its link. */
export async function uploadEvidence(file: Blob, name = "photo.jpg"): Promise<string> {
  const fd = new FormData();
  fd.append("file", file, name);
  const res = obj(await apiFetch<unknown>("/impact/upload", { method: "POST", body: fd }));
  const url = str(res.url) ?? str(obj(res.data).url);
  if (!url) throw new Error("الصورة اترفعت بس السيرفر ما رجّعش رابطها");
  return url;
}

/* ── distribution days ────────────────────────────────────────────────────── */

export interface DistributionRow extends DistributionCard {
  is_public: boolean;
  governorate?: string;
  city?: string;
  target_kind?: ImpactKind;
  target_id?: number;
  created_at?: string;
}

export interface DistributionCandidate {
  id: number;
  reference?: string;
  amount: number;
  donor?: string;
  created_at?: string;
  stage: string | null;
  eligible: boolean;
}

export interface DistributionInput {
  client_key: string;
  title: string;
  happened_on: string;
  governorate?: string;
  city?: string;
  stage: DeliveryLineStage;
  note?: string;
  families_count?: number;
  target_kind?: ImpactKind;
  target_id?: number;
  donation_ids: number[];
  photos?: string[];
  notify?: boolean;
  is_public?: boolean;
}

/** Editable after the day is saved (the step and its donations are not: undo and record it again). */
export interface DistributionPatch {
  title?: string;
  governorate?: string | null;
  city?: string | null;
  note?: string | null;
  families_count?: number;
  is_public?: boolean;
  photos?: string[];
}

export type SkipReason = "not_paid" | "already_there" | "not_found";
export interface DistributionResult { row: DistributionRow; applied: number; skipped: { id: number; reason: SkipReason }[]; repeated: boolean }

const toDistributionRow = (raw: unknown): DistributionRow => {
  const r = obj(raw);
  return {
    ...toDistributionCard(r),
    photos: strs(r.photos),
    is_public: r.is_public === undefined ? true : Boolean(r.is_public),
    governorate: str(r.governorate),
    city: str(r.city),
    target_kind: str(r.target_kind) as ImpactKind | undefined,
    target_id: r.target_id === null || r.target_id === undefined ? undefined : num(r.target_id),
    created_at: str(r.created_at),
  };
};

const dropDistributionCaches = () => {
  invalidateApiCache("/distributions");
  invalidateApiCache("/donations");
  invalidateApiCache("/impact");
};

export const distributionsApi = {
  async list(page = 1, filter?: { target_kind?: ImpactKind; target_id?: number }): Promise<{ rows: DistributionRow[]; lastPage: number; total: number }> {
    const res = obj(await apiFetch<unknown>("/distributions", { params: { page, per_page: 20, ...filter }, useCache: false }));
    const meta = obj(res.meta);
    return { rows: list(res.data).map(toDistributionRow), lastPage: num(meta.last_page) || 1, total: num(meta.total) };
  },
  async show(id: number): Promise<DistributionRow & { donations: { id: number; reference?: string; amount: number; donor?: string; stage: string | null }[] }> {
    const d = obj(data(await apiFetch<unknown>(`/distributions/${id}`, { useCache: false })));
    return {
      ...toDistributionRow(d),
      donations: list(d.donations).map((x) => ({ id: num(x.id), reference: str(x.reference), amount: num(x.amount), donor: str(x.donor), stage: str(x.stage) ?? null })),
    };
  },
  async candidates(q: { target_kind?: ImpactKind; target_id?: number; from?: string; to?: string; stage?: DeliveryLineStage }): Promise<{ rows: DistributionCandidate[]; total: number; eligible: number }> {
    const res = obj(await apiFetch<unknown>("/distributions/candidates", { params: q, useCache: false }));
    const meta = obj(res.meta);
    return {
      rows: list(res.data).map((r) => ({
        id: num(r.id), reference: str(r.reference), amount: num(r.amount), donor: str(r.donor), created_at: str(r.created_at),
        stage: str(r.stage) ?? null, eligible: Boolean(r.eligible),
      })),
      total: num(meta.total),
      eligible: num(meta.eligible),
    };
  },
  /** Safe to retry: the same client_key returns the first result instead of applying twice. */
  async create(input: DistributionInput): Promise<DistributionResult> {
    const res = obj(await apiFetch<unknown>("/distributions", { method: "POST", body: input }));
    dropDistributionCaches();
    return {
      row: toDistributionRow(res.data),
      applied: num(res.applied),
      skipped: list(res.skipped).map((s) => ({ id: num(s.id), reason: String(s.reason) as SkipReason })),
      repeated: Boolean(res.repeated),
    };
  },
  async update(id: number, input: DistributionPatch): Promise<DistributionRow> {
    const res = await apiFetch<unknown>(`/distributions/${id}`, { method: "PUT", body: input });
    dropDistributionCaches();
    return toDistributionRow(data(res));
  },
  /** Undo: its lines leave every donation's trail. */
  async remove(id: number): Promise<string> {
    const res = obj(await apiFetch<unknown>(`/distributions/${id}`, { method: "DELETE" }));
    dropDistributionCaches();
    return String(res.message ?? "");
  },
};

/** A new idempotency key for one "save" of a distribution day. */
export function newClientKey(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  } catch { /* older browsers */ }
  return `d-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
