/**
 * Projects content source.
 *   /projects and /projects/:slug: GET /projects (one cached list shared by both pages — the API has no
 *   lookup by slug), mapped to ProjectCard / ProjectDetail.
 *   Donate form: the "project" donation entities (see ./donationEntities).
 */
import { useMemo } from "react";
import { DONATION_ENTITIES, type DonationEntity, type DonationShare } from "@/data/donationEntities";
import { fetchPublicList, image, isActiveRecord, num, pick, useSourced, type ApiRecord } from "./_shared";
import { mapApiEntity, mapApiPackage, useDonationEntities } from "./donationEntities";
import { parsePageContent } from "@/data/projectPages";

const STATIC_PROJECT_ENTITIES = DONATION_ENTITIES.filter((e) => e.entityType === "project");

/** Map one /projects record to a DonationEntity of type "project". */
export function mapApiProject(r: ApiRecord, fallback?: DonationEntity): DonationEntity {
  return mapApiEntity(r, "project", fallback);
}

/** Project entities only (static by default). */
export function useProjectEntities(): { projects: DonationEntity[]; isLoading: boolean } {
  const { entities, isLoading } = useDonationEntities();
  if (entities === DONATION_ENTITIES) return { projects: STATIC_PROJECT_ENTITIES, isLoading };
  return { projects: entities.filter((e) => e.entityType === "project"), isLoading };
}

/** One card on /projects. Everything comes from the project record (dashboard → المشاريع). */
export interface ProjectCard {
  id: number;
  slug: string;
  ar: string;
  en: string;
  descAr: string;
  descEn: string;
  image: string;
  priceFrom: number;
  sharesCount: number;
  casesCount: number;
  /** First visible linked case (highlighted on the featured card). */
  firstCase?: { titleAr: string; titleEn: string; city: string; governorate: string; target: number; raised: number };
}

const NO_PROJECTS: ProjectCard[] = [];

/** Pure mapper (exported for tests): active projects, ordered by display_order. */
export function mapProjectCards(list: ApiRecord[]): ProjectCard[] {
  return list
    .filter(isActiveRecord)
    .sort((a, b) => (num(a.display_order) ?? 0) - (num(b.display_order) ?? 0))
    .map((r) => {
      const packages = (Array.isArray(r.donation_packages) ? (r.donation_packages as ApiRecord[]) : []).filter((p) => p.is_active !== false);
      const prices = packages.map((p) => num(p.amount) ?? 0).filter((n) => n > 0);
      const ar = pick(r.name, r.name_ar) ?? "";
      const cases = Array.isArray(r.cases) ? (r.cases as ApiRecord[]) : [];
      const c = cases[0];
      return {
        id: num(r.id) ?? 0,
        slug: pick(r.slug) ?? String(r.id),
        ar,
        en: pick(r.name_en) ?? ar,
        descAr: pick(r.short_description, r.description) ?? "",
        descEn: pick(r.short_description_en, r.description_en) ?? "",
        image: image(r.cover_image, r.image) ?? "/placeholder.svg",
        priceFrom: num(r.starting_price) || (prices.length ? Math.min(...prices) : 0),
        sharesCount: packages.length,
        casesCount: cases.length,
        firstCase: c
          ? {
              titleAr: pick(c.title, c.title_ar) ?? "",
              titleEn: pick(c.title_en, c.title, c.title_ar) ?? "",
              city: pick(c.city) ?? "",
              governorate: pick(c.governorate) ?? "",
              target: num(c.target_amount) ?? 0,
              raised: num(c.collected_amount ?? c.raised_amount) ?? 0,
            }
          : undefined,
      };
    });
}

const PROJECTS_KEY = ["projects-list"] as const;
const fetchProjects = () => fetchPublicList("/projects", { per_page: 100 });

/** /projects listing: GET /projects. Empty until loaded (the page shows skeletons meanwhile). */
export function useProjectCards(): { projects: ProjectCard[]; isLoading: boolean } {
  const { data, isLoading } = useSourced(PROJECTS_KEY, fetchProjects, NO_PROJECTS, mapProjectCards, { source: "api" });
  return { projects: data, isLoading };
}

/** /projects/:slug — the card data plus everything the detail page shows. */
export interface ProjectDetail extends ProjectCard {
  description: string;
  packages: DonationShare[];
  target: number;
  collected: number;
  faqCategorySlug?: string;
  /** Landing-page content override saved from the dashboard (`page_content`, proposed column). */
  pageContent?: Record<string, unknown> | null;
}

/** Pure mapper (exported for tests): the active project with this slug, or null. */
export function mapProjectDetail(list: ApiRecord[], slug: string): ProjectDetail | null {
  const r = list.find((x) => x && x.slug === slug && isActiveRecord(x));
  if (!r) return null;
  const card = mapProjectCards([r])[0];
  const packages = (Array.isArray(r.donation_packages) ? (r.donation_packages as ApiRecord[]) : [])
    .filter((p) => p.is_active !== false)
    .sort((a, b) => (num(a.sort_order) ?? 0) - (num(b.sort_order) ?? 0))
    .map((p) => mapApiPackage(p));
  const faq = r.faq_category && typeof r.faq_category === "object" ? pick((r.faq_category as ApiRecord).slug) : undefined;
  return {
    ...card,
    description: pick(r.description, r.short_description) ?? "",
    packages,
    target: num(r.target_amount) ?? 0,
    collected: num(r.collected_amount) ?? 0,
    ...(faq ? { faqCategorySlug: faq } : {}),
    pageContent: parsePageContent(r.page_content),
  };
}

/** One project by slug, from the same cached list as /projects. `notFound` once the list is loaded. */
export function useProjectDetail(slug: string): { project: ProjectDetail | null; isLoading: boolean; notFound: boolean } {
  const { data: list, isLoading } = useSourced(PROJECTS_KEY, fetchProjects, null as ApiRecord[] | null, (l: ApiRecord[]) => l, { source: "api" });
  const project = useMemo(() => (list ? mapProjectDetail(list, slug) : null), [list, slug]);
  return { project, isLoading, notFound: !isLoading && !project };
}
