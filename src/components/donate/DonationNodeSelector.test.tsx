import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import { DonationNodeSelector } from "./DonationNodeSelector";

const odhyaSector = { id: "s1", parent_id: null, type: "sector", slug: "sector-odhya", title_ar: "صك الأضحية", title_en: "Udhiya", description_ar: null, description_en: null, image_url: null, amount: null, target_amount: null, collected_amount: 0, active: true, direct_checkout: false, sort_order: 7 };
const odhyaProgram = { id: "p1", parent_id: "s1", type: "program", slug: "odhya", title_ar: "صك الأضحية", title_en: "Udhiya", description_ar: null, description_en: null, image_url: null, amount: null, target_amount: null, collected_amount: 0, active: true, direct_checkout: false, sort_order: 3 };
const zakatSector = { id: "s2", parent_id: null, type: "sector", slug: "sector-zakat", title_ar: "الزكاة", title_en: "Zakat", description_ar: null, description_en: null, image_url: null, amount: null, target_amount: null, collected_amount: 0, active: true, direct_checkout: false, sort_order: 8 };

function makeQuery(rows: any[]) {
  const q: any = {
    _rows: rows, _filters: [] as any[],
    select: vi.fn(function (this: any) { return this; }),
    eq: vi.fn(function (this: any, c: string, v: any) { this._filters.push(["eq", c, v]); return this; }),
    in: vi.fn(function (this: any, c: string, v: any[]) { this._filters.push(["in", c, v]); return this; }),
    is: vi.fn(function (this: any, c: string, v: any) { this._filters.push(["is", c, v]); return this; }),
    order: vi.fn(function (this: any) { return this; }),
    limit: vi.fn(function (this: any) { return this; }),
    maybeSingle: vi.fn(function (this: any) { return Promise.resolve({ data: apply(this._rows, this._filters)[0] ?? null }); }),
    then: function (r: any) { return Promise.resolve({ data: apply(this._rows, this._filters) }).then(r); },
  };
  return q;
}
function apply(rows: any[], filters: any[]) {
  return rows.filter((r) => filters.every(([op, c, v]) => op === "eq" ? r[c] === v : op === "is" ? r[c] === v : op === "in" ? (v as any[]).includes(r[c]) : true));
}

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: () => makeQuery([odhyaSector, odhyaProgram, zakatSector]) },
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
