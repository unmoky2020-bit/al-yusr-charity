import type { ReactNode } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { LandingPageSkeleton } from "@/components/common/ContentSkeletons";
import { CONTENT_MAX_WAIT_MS, useCampaignPageReady, useSettled } from "@/hooks/useCampaignPage";
import { useProjectDetail } from "@/data/sources/projects";
import { fetchProgramRecords } from "@/data/sources/programs";
import { fetchProjectRecords } from "@/data/entityShares";
import { useSourced, type ApiRecord } from "@/data/sources/_shared";

const NO_RECORDS: ApiRecord[] = [];
const asIs = (records: ApiRecord[]) => records;

/**
 * Route wrappers for pages built from code defaults + dashboard content: a skeleton until the
 * dashboard answers (or a short timeout), so visitors never see the built-in copy and images first
 * and then the real ones.
 */
export function CampaignPageGate({ slug, children }: { slug: string; children: ReactNode }) {
  const ready = useCampaignPageReady(slug);
  if (!ready) return <PageLayout><LandingPageSkeleton /></PageLayout>;
  return <>{children}</>;
}

export function ProjectPageGate({ slug, children }: { slug: string; children: ReactNode }) {
  const { isLoading } = useProjectDetail(slug);
  const ready = useSettled(!isLoading, CONTENT_MAX_WAIT_MS, slug);
  if (!ready) return <PageLayout><LandingPageSkeleton /></PageLayout>;
  return <>{children}</>;
}

/**
 * For pages whose top section and packages come from the dashboard's programs (and projects):
 * /takrim, /nurseries, /medical. Same query keys as useTakrimContent / useEntityShares, so the page
 * reuses this request instead of making its own.
 */
export function ProgramsPageGate({ withProjects = false, children }: { withProjects?: boolean; children: ReactNode }) {
  const programs = useSourced(["programs"], fetchProgramRecords, NO_RECORDS, asIs);
  const projects = useSourced(["projects-raw"], fetchProjectRecords, NO_RECORDS, asIs, { enabled: withProjects });
  const ready = useSettled(!programs.isLoading && (!withProjects || !projects.isLoading));
  if (!ready) return <PageLayout><LandingPageSkeleton /></PageLayout>;
  return <>{children}</>;
}
