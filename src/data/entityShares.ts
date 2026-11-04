/**
 * Donation shares of one backend program or project, for landing pages that sell its packages.
 *
 * The shares are the record's active `donation_packages` (dashboard → البرامج / المشاريع → الباقات), in
 * sort_order. Each one links to the donate form on that exact package. When the record is missing, the
 * API is unreachable, the content source is "static", or the record has no active package yet, the page's
 * static defaults are shown instead.
 */
import { fetchProgramRecords, programSlugOf } from "@/data/sources/programs";
import { type ApiRecord, fetchPublicList, normalizeSlug, num, pick, useSourced } from "@/data/sources/_shared";

export type EntityKind = "program" | "project";

export type Share = {
  /** Backend package key, or `pkg-<id>`, or the static default id. */
  id: string;
  /** Backend donation_packages[].id, sent to the donate page as `package`. */
  apiId?: number;
  nameAr: string;
  nameEn: string;
  amount: number;
};

/** Active packages of a record, in dashboard order; inactive, nameless or unpriced rows are dropped. */
export function mapShares(raw: unknown): Share[] {
  if (!Array.isArray(raw)) return [];
  return (raw as ApiRecord[])
    .filter((p) => p && typeof p === "object" && p.is_active !== false && p.is_active !== 0)
    .sort((a, b) => (num(a.sort_order) ?? 0) - (num(b.sort_order) ?? 0))
    .map((p): Share => {
      const apiId = num(p.id);
      const share: Share = {
        id: pick(p.key) ?? (apiId !== undefined ? `pkg-${apiId}` : ""),
        nameAr: pick(p.name_ar, p.name) ?? "",
        nameEn: pick(p.name_en, p.name_ar, p.name) ?? "",
        amount: num(p.amount) ?? 0,
      };
      if (apiId !== undefined) share.apiId = apiId;
      return share;
    })
    .filter((s) => !!s.id && !!s.nameAr && s.amount > 0);
}

/** The record's shares, or the defaults when it has none. */
export function resolveShares(record: ApiRecord | undefined, defaults: Share[]): Share[] {
  const shares = mapShares(record?.donation_packages);
  return shares.length ? shares : defaults.map((s) => ({ ...s }));
}

/** Donate-form link for one share of a program/project (`qty` > 1 opens the form with that many shares). */
export function shareDonateHref(kind: EntityKind, slug: string, share: Share, qty = 1): string {
  const n = Math.max(1, Math.floor(qty));
  return `/donate?${kind}=${encodeURIComponent(slug)}&package=${encodeURIComponent(String(share.apiId ?? share.id))}&amount=${share.amount * n}${n > 1 ? `&qty=${n}` : ""}`;
}

/** Donate-form link for a program/project without a preselected package. */
export function entityDonateHref(kind: EntityKind, slug: string): string {
  return `/donate?${kind}=${encodeURIComponent(slug)}`;
}

/** First share whose key or names contain one of the words (used to pair a service with its package). */
export function findShare(shares: Share[], words: string[]): Share | undefined {
  const ws = words.map((w) => w.toLowerCase());
  return shares.find((s) => {
    const text = `${s.id} ${s.nameAr} ${s.nameEn}`.toLowerCase();
    return ws.some((w) => text.includes(w));
  });
}

const fetchProjectRecords = () => fetchPublicList("/projects", { per_page: 100 });

/** Shares of every record kind, read through the shared content-source switch (cache shared per kind). */
export function useEntityShares(kind: EntityKind, slug: string, defaults: Share[]): Share[] {
  const isProgram = kind === "program";
  const { data } = useSourced<ApiRecord[], Share[]>(
    isProgram ? ["programs"] : ["projects-raw"],
    isProgram ? fetchProgramRecords : fetchProjectRecords,
    defaults,
    (records) =>
      resolveShares(
        records.find((r) => (isProgram ? programSlugOf(r) : normalizeSlug(r.slug)) === slug),
        defaults,
      ),
  );
  return data;
}
