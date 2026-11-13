/**
 * Site-wide blocks edited from the dashboard (backend bundle deploy-2026-11-13-extras):
 *   org_info          the organisation's contact data      → applied over src/data/orgInfo.ts
 *   about_milestones  the About-page timeline              → replaces the built-in timeline
 *   nav_links         header links + footer columns        → replace the built-in menus
 * GET /site-blocks is public; PUT/DELETE /admin/site-blocks/{key} need settings.update.
 * Until the bundle is deployed (404) or when a block is empty, the site keeps its built-in copy.
 */
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch, invalidateApiCache } from "@/data/laravelApi";
import { applyOrgInfo, type RemoteOrgInfo } from "@/data/orgInfo";

export type Milestone = { year: string; title_ar: string; title_en?: string; text_ar?: string; text_en?: string };
export type NavLink = { label_ar: string; label_en?: string; href: string };
export type FooterLink = NavLink & { column: "quick" | "campaigns" };
export type NavLinks = { header?: NavLink[]; footer?: FooterLink[] };
/** The SEO map (dashboard «خريطة السيو»): keyword → Google position (null = not in the top 100). */
export type SeoProgressEntry = { pos: number | null; date?: string; page?: string; note?: string };
export type SeoProgress = Record<string, SeoProgressEntry>;
export type SiteBlocks = { org_info?: RemoteOrgInfo; about_milestones?: Milestone[]; nav_links?: NavLinks; seo_progress?: SeoProgress };
export type SiteBlockKey = keyof SiteBlocks;

const str = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined);
/** Same rule as the backend: an internal path (not //host) or an https link. */
export const isSafeHref = (h: string) => /^(\/(?!\/)\S*|https:\/\/\S+)$/.test(h);

export function parseMilestones(v: unknown): Milestone[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((m): Milestone | null => {
      if (!m || typeof m !== "object") return null;
      const r = m as Record<string, unknown>;
      const year = str(r.year, 20);
      const title = str(r.title_ar, 200);
      if (!year || !title) return null;
      const out: Milestone = { year, title_ar: title };
      const te = str(r.title_en, 200), ta = str(r.text_ar, 1500), tx = str(r.text_en, 1500);
      if (te) out.title_en = te;
      if (ta) out.text_ar = ta;
      if (tx) out.text_en = tx;
      return out;
    })
    .filter((m): m is Milestone => !!m);
}

function parseLink(v: unknown): NavLink | null {
  if (!v || typeof v !== "object") return null;
  const r = v as Record<string, unknown>;
  const label = str(r.label_ar, 80);
  const href = str(r.href, 500);
  if (!label || !href || !isSafeHref(href)) return null;
  const out: NavLink = { label_ar: label, href };
  const en = str(r.label_en, 80);
  if (en) out.label_en = en;
  return out;
}

export function parseNavLinks(v: unknown): NavLinks {
  if (!v || typeof v !== "object") return {};
  const r = v as Record<string, unknown>;
  const out: NavLinks = {};
  if (Array.isArray(r.header)) out.header = r.header.map(parseLink).filter((l): l is NavLink => !!l);
  if (Array.isArray(r.footer)) {
    out.footer = r.footer
      .map((x): FooterLink | null => {
        const l = parseLink(x);
        if (!l) return null;
        const col = (x as Record<string, unknown>).column;
        return { ...l, column: col === "campaigns" ? "campaigns" : "quick" };
      })
      .filter((l): l is FooterLink => !!l);
  }
  return out;
}

export function parseSeoProgress(v: unknown): SeoProgress {
  if (!v || typeof v !== "object" || Array.isArray(v)) return {};
  const out: SeoProgress = {};
  for (const [kw, e] of Object.entries(v as Record<string, unknown>)) {
    if (!kw.trim() || !e || typeof e !== "object") continue;
    const r = e as Record<string, unknown>;
    const n = Number(r.pos);
    const row: SeoProgressEntry = { pos: r.pos === null || r.pos === undefined || r.pos === "" || !Number.isFinite(n) ? null : Math.max(1, Math.min(100, Math.round(n))) };
    const d = str(r.date, 10), pg = str(r.page, 300), nt = str(r.note, 300);
    if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) row.date = d;
    if (pg) row.page = pg;
    if (nt) row.note = nt;
    out[kw.trim()] = row;
  }
  return out;
}

export function parseSiteBlocks(res: unknown): SiteBlocks {
  const body = res && typeof res === "object" && "data" in (res as object) ? (res as { data: unknown }).data : res;
  if (!body || typeof body !== "object" || Array.isArray(body)) return {};
  const b = body as Record<string, unknown>;
  const out: SiteBlocks = {};
  if (b.org_info && typeof b.org_info === "object" && !Array.isArray(b.org_info)) out.org_info = b.org_info as RemoteOrgInfo;
  const ms = parseMilestones(b.about_milestones);
  if (ms.length) out.about_milestones = ms;
  const nav = parseNavLinks(b.nav_links);
  if (nav.header?.length || nav.footer?.length) out.nav_links = nav;
  const seo = parseSeoProgress(b.seo_progress);
  if (Object.keys(seo).length) out.seo_progress = seo;
  return out;
}

export async function fetchSiteBlocks(): Promise<SiteBlocks> {
  try {
    return parseSiteBlocks(await apiFetch<unknown>("/site-blocks", { method: "GET", ttlMs: 60_000 }));
  } catch {
    return {};
  }
}

export const SITE_BLOCKS_QUERY = ["site-blocks"] as const;

export function useSiteBlocks(): SiteBlocks {
  const q = useQuery({ queryKey: SITE_BLOCKS_QUERY, queryFn: fetchSiteBlocks, staleTime: 5 * 60_000, retry: false });
  return q.data ?? EMPTY;
}
const EMPTY: SiteBlocks = {};

/** Mounted once at the app root: puts the dashboard's organisation data over the built-in copy. */
export function SiteBlocksSync() {
  const { org_info } = useSiteBlocks();
  useEffect(() => { applyOrgInfo(org_info); }, [org_info]);
  return null;
}

export const siteBlocksAdminApi = {
  async load(): Promise<SiteBlocks> {
    return parseSiteBlocks(await apiFetch<unknown>("/site-blocks", { method: "GET", useCache: false }));
  },
  async save<K extends SiteBlockKey>(key: K, value: NonNullable<SiteBlocks[K]>): Promise<void> {
    await apiFetch(`/admin/site-blocks/${key}`, { method: "PUT", body: { value } });
    invalidateApiCache("/site-blocks");
  },
  async reset(key: SiteBlockKey): Promise<void> {
    await apiFetch(`/admin/site-blocks/${key}`, { method: "DELETE" });
    invalidateApiCache("/site-blocks");
  },
};
