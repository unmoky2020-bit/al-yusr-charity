/**
 * Donation entities content source (the items of the donate form / donate hero / projects page).
 *   static: `DONATION_ENTITIES` from src/data/donationEntities.ts — also used when the API is unreachable.
 *   api:    exactly the active records of GET /programs + GET /projects + GET /donation-campaigns, each with
 *           its real type, backend id, packages and cases. Static data only fills fields the record lacks,
 *           and only from the static entity of the same id AND type.
 */
import {
  DONATION_ENTITIES as STATIC_ENTITIES,
  type DonationEntity,
  type DonationShare,
  type EntityType,
  type LinkedCase,
} from "@/data/donationEntities";
import { CONTENT_SOURCE, type ContentSource } from "@/lib/contentSource";
import {
  type ApiRecord,
  fetchPublicList,
  image,
  isActiveRecord,
  normalizeSlug,
  num,
  pick,
  resolveRecordKey,
  str,
  useSourced,
  withExtra,
} from "./_shared";

/** Backend slug -> static entity id, where the two differ. */
export const ENTITY_ID_ALIASES: Record<string, string> = {
  "general-donation": "general",
  zell: "dhill",
  sitr: "shelter",
  markoon: "markoun",
};

const STATIC_IDS = new Set(STATIC_ENTITIES.map((e) => e.id));

/**
 * Entity id of an API record: `donation_entity_id` (seeders) or slug / landing_slug / aliases[] when one of them
 * is a static id; otherwise ENTITY_ID_ALIASES[slug]; otherwise the slug (or the numeric id).
 */
export function entityIdOf(r: ApiRecord): string {
  const key = resolveRecordKey(r, STATIC_IDS, ENTITY_ID_ALIASES, ["donation_entity_id"]);
  return key || (r.id !== undefined && r.id !== null ? String(r.id) : "");
}

/** Map a donation_packages[] item to a DonationShare. Keeps the static share id when the key or Arabic name matches. */
export function mapApiPackage(p: ApiRecord, fallbackShares: DonationShare[] = []): DonationShare {
  const nameAr = pick(p.name_ar, p.name) ?? "";
  const key = str(p.key);
  const fb = fallbackShares.find((s) => (key && s.id === key) || (nameAr && s.nameAr === nameAr));
  const share: DonationShare = {
    id: key ?? fb?.id ?? `pkg-${p.id ?? normalizeSlug(nameAr)}`,
    nameAr: nameAr || fb?.nameAr || "",
    nameEn: pick(p.name_en, fb?.nameEn, nameAr) ?? "",
    price: num(p.amount) ?? fb?.price ?? 0,
  };
  const apiId = num(p.id);
  if (apiId) share.apiId = apiId;
  const descAr = pick(p.description_ar, fb?.descAr);
  const descEn = pick(p.description_en, fb?.descEn);
  if (descAr) share.descAr = descAr;
  if (descEn) share.descEn = descEn;
  const popular = p.is_popular ?? p.popular ?? fb?.popular;
  if (popular) share.popular = true;
  return share;
}

/** Map a cases[] item to a LinkedCase. */
export function mapApiCase(c: ApiRecord): LinkedCase {
  const out: LinkedCase = {
    id: `case-${c.id ?? c.code}`,
    refCode: pick(c.code, c.ref_code) ?? String(c.id ?? ""),
    titleAr: pick(c.title_ar, c.title) ?? "",
    titleEn: pick(c.title_en, c.title_ar, c.title) ?? "",
    beneficiaryName: pick(c.beneficiary_name) ?? "",
    governorate: pick(c.governorate) ?? "",
    neededAmount: num(c.target_amount) ?? 0,
    raisedAmount: num(c.collected_amount) ?? 0,
  };
  const apiId = num(c.id);
  if (apiId) out.apiId = apiId;
  const city = pick(c.city);
  if (city) out.city = city;
  if (c.priority === "high" || c.priority === "urgent" || c.is_urgent === true) out.urgent = true;
  const story = pick(c.story_ar, c.description_ar, c.description);
  if (story) out.storyAr = story;
  return out;
}

const activeSorted = (list: unknown): ApiRecord[] =>
  (Array.isArray(list) ? (list as ApiRecord[]) : [])
    .filter((x) => x && x.is_active !== false)
    .sort((a, b) => (num(a.sort_order) ?? 0) - (num(b.sort_order) ?? 0));

/**
 * Map a /programs, /projects or /donation-campaigns record to a DonationEntity.
 * `kind` is the source resource (always the entity type); `fallback` is the static entity with the same id —
 * used only when it is of the same type. `id` overrides the computed id (slug collisions between types).
 */
export function mapApiEntity(raw: ApiRecord, kind: EntityType, fallback?: DonationEntity, id?: string): DonationEntity {
  const r = withExtra(raw);
  const fb = fallback && fallback.entityType === kind ? fallback : undefined;
  const top: ApiRecord = r.top_section && typeof r.top_section === "object" ? r.top_section : {};
  const packages = activeSorted(r.donation_packages);
  const shares = packages.length ? packages.map((p) => mapApiPackage(p, fb?.shares)) : fb?.shares ?? [];
  const casesRaw = Array.isArray(r.cases) ? (r.cases as ApiRecord[]) : [];
  // Only real backend cases: the static sample cases are never offered on a backend record.
  const cases = casesRaw.map(mapApiCase);
  const sharePrices = shares.map((s) => s.price).filter((n) => n > 0);
  const category: ApiRecord = (r.category && typeof r.category === "object" ? r.category : r.axis) || {};
  const out: DonationEntity = {
    id: id || entityIdOf(r) || fb?.id || "",
    // donation_* fields = the donate-form wording when it differs from the program page (optional columns).
    ar: pick(r.donation_name_ar, r.name_ar, r.title_ar, r.name, fb?.ar) ?? "",
    en: pick(r.donation_name_en, r.name_en, r.title_en, fb?.en, r.name_ar, r.name) ?? "",
    taglineAr:
      pick(r.donation_tagline_ar, r.tagline_ar, r.subtitle_ar, top.subtitle_ar, r.short_description, fb?.taglineAr, r.description_ar, r.description) ?? "",
    taglineEn:
      pick(r.donation_tagline_en, r.tagline_en, r.subtitle_en, top.subtitle_en, r.short_description_en, fb?.taglineEn, r.description_en) ?? "",
    image: image(r.donation_image, r.image, r.cover_image, r.image_url, top.image) ?? fb?.image ?? "/placeholder.svg",
    entityType: kind,
    donationType: (["cash", "in_kind", "both"].includes(r.donation_type) ? r.donation_type : fb?.donationType) ?? "cash",
    categoryAr: pick(r.category_ar, category.name_ar, fb?.categoryAr) ?? "",
    categoryEn: pick(r.category_en, category.name_en, fb?.categoryEn) ?? "",
    priceFrom:
      num(r.price_from) ??
      num(r.starting_price) ??
      (sharePrices.length ? Math.min(...sharePrices) : undefined) ??
      num(r.minimum_amount) ??
      fb?.priceFrom ??
      0,
    shares,
    cases,
  };
  const apiId = num(r.id);
  if (apiId) out.apiId = apiId;
  const slug = pick(r.slug);
  if (slug) out.slug = slug;
  const color = pick(r.color, fb?.color);
  if (color) out.color = color;
  if (fb?.isMarkoun || r.is_markoun === true) out.isMarkoun = true;
  if (fb?.isSeasonal || r.is_seasonal === true) out.isSeasonal = true;
  return out;
}

export type EntityRecords = { programs: ApiRecord[]; projects: ApiRecord[]; campaigns: ApiRecord[] };

const KIND_ORDER: EntityType[] = ["program", "project", "campaign"];

/**
 * Final entity list (pure; used by the hook and the tests).
 * - static source, no payload, or an API that returned nothing active → the static list (offline fallback);
 * - otherwise the active backend records, ordered by type (programs, projects, campaigns) then
 *   sort_order / display_order, with the general donation first (the form's default). The form is
 *   backend-only: an item that is missing or inactive on the backend cannot receive donations (program
 *   PAGES may still show their static copy — HIDDEN_RECORDS_FALL_BACK_TO_STATIC — so old links keep working).
 * Ids: the static-compatible id (slug / alias, see entityIdOf). When two types share it (a "water" program and
 * a "water" project), the record matching the static entity's type — else the first type — keeps it and the
 * other becomes "<type>-<slug>" (e.g. "project-water"), so every record is reachable exactly once.
 */
export function resolveDonationEntities(
  raw: EntityRecords | undefined,
  source: ContentSource = CONTENT_SOURCE,
): DonationEntity[] {
  if (source === "static" || !raw) return STATIC_ENTITIES;
  const staticById = new Map(STATIC_ENTITIES.map((e) => [e.id, e]));
  const listOf: Record<EntityType, ApiRecord[]> = { program: raw.programs, project: raw.projects, campaign: raw.campaigns };
  const records = KIND_ORDER.flatMap((kind) =>
    (listOf[kind] ?? [])
      .filter(isActiveRecord)
      .sort((a, b) => (num(a.sort_order ?? a.display_order) ?? 0) - (num(b.sort_order ?? b.display_order) ?? 0))
      .map((r) => ({ r, kind, baseId: entityIdOf(r) }))
      .filter((x) => x.baseId),
  );
  if (!records.length) return STATIC_ENTITIES;

  const owner = new Map<string, EntityType>();
  for (const { baseId, kind } of records) {
    const preferred = staticById.get(baseId)?.entityType;
    const current = owner.get(baseId);
    if (!current || (kind === preferred && current !== preferred)) owner.set(baseId, kind);
  }

  const seen = new Set<string>();
  const out: DonationEntity[] = [];
  for (const { r, kind, baseId } of records) {
    const id = owner.get(baseId) === kind && !seen.has(baseId) ? baseId : `${kind}-${normalizeSlug(r.slug) || r.id}`;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(mapApiEntity(r, kind, staticById.get(id), id));
  }
  const general = out.findIndex((e) => e.id === "general");
  if (general > 0) out.unshift(...out.splice(general, 1));
  return out;
}

/** The entity a donate link points at: ?entity=<id>, or ?program= / ?project= / ?campaign=<slug or id>. */
export function findEntityForLink(
  entities: DonationEntity[],
  link: { entity?: string | null; program?: string | null; project?: string | null; campaign?: string | null },
): DonationEntity | undefined {
  const norm = (v?: string | null) => (v ? normalizeSlug(decodeURIComponent(v)) : "");
  const byKind: Array<[EntityType, string]> = [
    ["program", norm(link.program)],
    ["project", norm(link.project)],
    ["campaign", norm(link.campaign)],
  ];
  for (const [kind, q] of byKind) {
    if (!q) continue;
    const alias = ENTITY_ID_ALIASES[q];
    const hit =
      entities.find((e) => e.entityType === kind && (normalizeSlug(e.slug) === q || e.id === q || (alias && e.id === alias))) ||
      entities.find((e) => e.entityType === kind && e.id === `${kind}-${q}`);
    if (hit) return hit;
  }
  const q = norm(link.entity) || byKind.map(([, v]) => v).find(Boolean) || "";
  if (!q) return undefined;
  return (
    entities.find((e) => e.id === q) ||
    entities.find((e) => normalizeSlug(e.slug) === q) ||
    entities.find((e) => e.id === ENTITY_ID_ALIASES[q])
  );
}

export async function fetchEntityRecords(): Promise<EntityRecords> {
  const settle = (p: Promise<ApiRecord[]>) => p.catch((): ApiRecord[] => []);
  const [programs, projects, campaigns] = await Promise.all([
    settle(fetchPublicList("/programs", { per_page: 100 })),
    settle(fetchPublicList("/projects", { per_page: 100 })),
    settle(fetchPublicList("/donation-campaigns", { per_page: 100 })),
  ]);
  return { programs, projects, campaigns };
}

/** All donation entities. `fromApi` = the list comes from the backend (not the offline fallback). */
export function useDonationEntities(): { entities: DonationEntity[]; isLoading: boolean; fromApi: boolean } {
  const { data, isLoading, fromApi } = useSourced(["donation-entities"], fetchEntityRecords, STATIC_ENTITIES, (raw) =>
    resolveDonationEntities(raw),
  );
  return { entities: data, isLoading, fromApi: fromApi && data !== STATIC_ENTITIES };
}

/** Entities keyed by id (same semantics as ENTITY_MAP in src/data/donationEntities.ts). */
export function buildEntityMap(entities: DonationEntity[]): Record<string, DonationEntity> {
  return Object.fromEntries(entities.map((e) => [e.id, e]));
}
