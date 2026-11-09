/** What a distribution day (or a report) can be about: programs, projects, campaigns and cases, as options. */
import { useQuery } from "@tanstack/react-query";
import { donationCampaignsApi, programsApiV1, projectsApi } from "@/data/laravelApi";
import { listAllCasesForStaff } from "@/data/casesApi";
import type { ImpactKind } from "@/data/api/impactApi";

export interface TargetOption { kind: ImpactKind; id: number; name: string }

const nameOf = (r: Record<string, unknown>) =>
  String(r.name_ar || r.title_ar || r.name || r.title || `#${r.id}`);

async function loadTargets(): Promise<Record<ImpactKind, TargetOption[]>> {
  const [programs, projects, campaigns, cases] = await Promise.all([
    programsApiV1.listAll().catch(() => []),
    projectsApi.listAll().catch(() => []),
    donationCampaignsApi.listAll().catch(() => []),
    listAllCasesForStaff().catch(() => []),
  ]);
  const opts = (kind: ImpactKind, rows: unknown[]) =>
    (Array.isArray(rows) ? rows : [])
      .map((r) => r as Record<string, unknown>)
      .filter((r) => r && r.id !== undefined && r.id !== null)
      .map((r) => ({ kind, id: Number(r.id), name: nameOf(r) }))
      .filter((o) => Number.isFinite(o.id))
      .sort((a, b) => a.name.localeCompare(b.name, "ar"));
  return {
    program: opts("program", programs),
    project: opts("project", projects),
    campaign: opts("campaign", campaigns),
    case: (Array.isArray(cases) ? cases : []).map((c) => ({
      kind: "case" as const,
      id: Number(c.id),
      name: `${c.ref_code ? `${c.ref_code} · ` : ""}${c.title || ""}`.trim(),
    })).filter((o) => Number.isFinite(o.id)),
  };
}

/** Every target the team can pick, loaded once per few minutes. */
export function useImpactTargets() {
  return useQuery({ queryKey: ["impact-targets"], queryFn: loadTargets, staleTime: 5 * 60_000 });
}
