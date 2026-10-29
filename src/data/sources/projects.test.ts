import { describe, expect, it } from "vitest";
import { mapProjectCards } from "./projects";

describe("mapProjectCards (/projects page)", () => {
  const rec = (o: Record<string, unknown>) => ({ id: 1, name: "مشروع", slug: "p", is_active: true, display_order: 1, ...o });

  it("keeps active projects in display_order", () => {
    const cards = mapProjectCards([
      rec({ id: 2, slug: "b", display_order: 2 }),
      rec({ id: 3, slug: "hidden", is_active: false }),
      rec({ id: 1, slug: "a", display_order: 1 }),
    ]);
    expect(cards.map((c) => c.slug)).toEqual(["a", "b"]);
  });

  it("uses starting_price, else the cheapest active package", () => {
    expect(mapProjectCards([rec({ starting_price: "250.00" })])[0].priceFrom).toBe(250);
    const [c] = mapProjectCards([rec({ donation_packages: [{ amount: "500" }, { amount: "300" }, { amount: "100", is_active: false }] })]);
    expect(c.priceFrom).toBe(300);
    expect(c.sharesCount).toBe(2);
  });

  it("summarises the first linked case", () => {
    const [c] = mapProjectCards([rec({ cases: [{ title: "حالة", city: "المنصورة", governorate: "الدقهلية", target_amount: "1000.00" }] })]);
    expect(c.casesCount).toBe(1);
    expect(c.firstCase).toMatchObject({ titleAr: "حالة", city: "المنصورة", target: 1000, raised: 0 });
  });
});
