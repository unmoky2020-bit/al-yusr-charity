import { describe, expect, it } from "vitest";
import { JOURNEY, journeyDates, journeyIndex, parseDelivery } from "./deliveryJourney";

describe("delivery journey", () => {
  it("unpaid, failed and refunded donations stay at the first step", () => {
    expect(journeyIndex("pending", null)).toBe(0);
    expect(journeyIndex("failed", null)).toBe(0);
    expect(journeyIndex("refunded", null)).toBe(0);
  });

  it("a paid donation is at «paid» until the team records a delivery step", () => {
    expect(journeyIndex("paid", null)).toBe(1);
    const d = parseDelivery({ stage: "preparing", history: [{ stage: "family_identified", at: "2026-11-09T10:00:00Z" }, { stage: "preparing", at: "2026-11-10T10:00:00Z" }] });
    expect(journeyIndex("paid", d)).toBe(JOURNEY.indexOf("preparing"));
    expect(journeyIndex("PAID", parseDelivery({ stage: "delivered", history: [] }))).toBe(JOURNEY.length - 1);
  });

  it("rejects unknown stages and keeps only known history entries", () => {
    expect(parseDelivery({ stage: "shipped" })).toBeNull();
    expect(parseDelivery(null)).toBeNull();
    const d = parseDelivery({ stage: "delivered", history: [{ stage: "nope", at: "x" }, { stage: "delivered", at: "2026-11-11T09:00:00Z", note: "تم" }] });
    expect(d?.history).toEqual([{ stage: "delivered", at: "2026-11-11T09:00:00Z", note: "تم" }]);
  });

  it("dates: creation for the first step, history for the delivery steps", () => {
    const d = parseDelivery({ stage: "family_identified", history: [{ stage: "family_identified", at: "2026-11-09T10:00:00Z" }] });
    expect(journeyDates("2026-11-08T08:00:00Z", d)).toEqual({ registered: "2026-11-08T08:00:00Z", family_identified: "2026-11-09T10:00:00Z" });
  });
});
