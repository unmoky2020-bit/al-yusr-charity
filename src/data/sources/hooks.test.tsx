import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { programs } from "@/data/programs";
import { DONATION_ENTITIES } from "@/data/donationEntities";
import { SERVICE_PAGES, SERVICE_PAGE_LIST } from "@/data/servicePagesConfig";
import { DONATE_SECTORS } from "@/data/servicesMap";
import { usePrograms, useProgram } from "./programs";
import { useDonationEntities } from "./donationEntities";
import { useProjectEntities } from "./projects";
import { useServicePage, useServicePages } from "./services";
import { useDonateSectors } from "./servicesMap";

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
);

describe("hooks with the default (static) flag", () => {
  it("return the static data synchronously, by reference, without any request", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const r = renderHook(
      () => ({
        programs: usePrograms(),
        orphans: useProgram("orphans"),
        entities: useDonationEntities(),
        projects: useProjectEntities(),
        pages: useServicePages(),
        wells: useServicePage("wells"),
        sectors: useDonateSectors(),
      }),
      { wrapper },
    );
    const v = r.result.current;
    expect(v.programs.programs).toBe(programs);
    expect(v.programs.isLoading).toBe(false);
    expect(v.orphans.program).toBe(programs.find((p) => p.slug === "orphans"));
    expect(v.entities.entities).toBe(DONATION_ENTITIES);
    expect(v.projects.projects).toEqual(DONATION_ENTITIES.filter((e) => e.entityType === "project"));
    expect(v.pages.servicePages).toBe(SERVICE_PAGE_LIST);
    expect(v.wells.servicePage).toBe(SERVICE_PAGES.wells);
    expect(v.sectors.sectors).toBe(DONATE_SECTORS);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
