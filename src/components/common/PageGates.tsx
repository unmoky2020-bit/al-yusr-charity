import type { ReactNode } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { LandingPageSkeleton } from "@/components/common/ContentSkeletons";
import { useCampaignPageReady, useSettled } from "@/hooks/useCampaignPage";
import { useProjectDetail } from "@/data/sources/projects";

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
  const ready = useSettled(!isLoading);
  if (!ready) return <PageLayout><LandingPageSkeleton /></PageLayout>;
  return <>{children}</>;
}
