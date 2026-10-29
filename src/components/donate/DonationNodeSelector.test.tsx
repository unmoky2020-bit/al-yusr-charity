import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import { DonationNodeSelector } from "./DonationNodeSelector";

const odhyaSector = { id: "s1", parent_id: null, type: "sector", slug: "sector-odhya", title_ar: "صك الأضحية", title_en: "Udhiya", description_ar: null, description_en: null, image_url: null, amount: null, target_amount: null, collected_amount: 0, active: true, direct_checkout: false, sort_order: 7 };
const odhyaProgram = { id: "p1", parent_id: "s1", type: "program", slug: "odhya", title_ar: "صك الأضحية", title_en: "Udhiya", description_ar: null, description_en: null, image_url: null, amount: null, target_amount: null, collected_amount: 0, active: true, direct_checkout: false, sort_order: 3 };
const zakatSector = { id: "s2", parent_id: null, type: "sector", slug: "sector-zakat", title_ar: "الزكاة", title_en: "Zakat", description_ar: null, description_en: null, image_url: null, amount: null, target_amount: null, collected_amount: 0, active: true, direct_checkout: false, sort_order: 8 };

const rows = [odhyaSector, odhyaProgram, zakatSector];

// The selector reads the donation tree through the Laravel wrapper (no Supabase any more).
vi.mock("@/data/api/publicDonationNodesApi", () => ({
  listDonationNodeChildren: vi.fn(async (parentId: string | null) => rows.filter((r) => r.parent_id === parentId)),
  getDonationNodeBySlug: vi.fn(async (slug: string) => rows.find((r) => r.slug === slug) ?? null),
  getDonationNodeById: vi.fn(async (id: string) => rows.find((r) => r.id === id) ?? null),
  hasActiveChildren: vi.fn(async (id: string) => rows.some((r) => r.parent_id === id)),
}));
vi.mock("@/i18n/LangContext", () => ({ useLang: () => ({ lang: "ar" }) }));

function LocationDisplay() {
  const loc = useLocation();
  return <div data-testid="loc">{loc.pathname}</div>;
}

function renderSelector(props: Partial<React.ComponentProps<typeof DonationNodeSelector>> = {}) {
  return render(
    <MemoryRouter initialEntries={["/donate"]}>
      <Routes>
        <Route path="/donate" element={<><DonationNodeSelector onLeafSelect={vi.fn()} {...props} /><LocationDisplay /></>} />
        <Route path="/zakat" element={<LocationDisplay />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("DonationNodeSelector — Udhiya closed & Zakat redirect", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("shows the closed empty state when entering Udhiya sector (booking closed after Eid)", async () => {
    renderSelector({ sectorSlug: "sector-odhya" });
    await waitFor(() => expect(screen.getByTestId("empty-state")).toBeInTheDocument());
    expect(screen.queryByTestId("node-odhya")).not.toBeInTheDocument();
    expect(screen.getByText(/مغلق حاليًا/)).toBeInTheDocument();
  });

  it("redirects to /zakat when the Zakat sector chip is used", async () => {
    renderSelector({ sectorSlug: "sector-zakat" });
    await waitFor(() => expect(screen.getByTestId("loc")).toHaveTextContent("/zakat"));
  });
});
