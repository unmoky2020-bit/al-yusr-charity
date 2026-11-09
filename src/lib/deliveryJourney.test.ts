import { describe, expect, it } from "vitest";
import { JOURNEY, journeyDates, journeyIndex, linesByStep, parseDelivery, trailPhotos } from "./deliveryJourney";

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

  it("a hold pauses without moving the donation back or forward", () => {
    const d = parseDelivery({
      stage: "family_identified",
      hold: { note: "الأسرة مسافرة", at: "2026-11-10T08:00:00Z" },
      history: [
        { stage: "family_identified", at: "2026-11-09T10:00:00Z" },
        { stage: "on_hold", at: "2026-11-10T08:00:00Z", note: "الأسرة مسافرة" },
      ],
    });
    expect(d?.hold).toEqual({ note: "الأسرة مسافرة", at: "2026-11-10T08:00:00Z" });
    expect(journeyIndex("paid", d)).toBe(JOURNEY.indexOf("family_identified"));
    expect(journeyDates(undefined, d)).toEqual({ family_identified: "2026-11-09T10:00:00Z" });
  });

  it("a hold before any step still parses (stage stays empty)", () => {
    const d = parseDelivery({ hold: { note: "مراجعة" }, history: [{ stage: "on_hold", at: "2026-11-10T08:00:00Z", note: "مراجعة" }] });
    expect(d?.stage).toBeNull();
    expect(journeyIndex("paid", d)).toBe(1);
  });

  it("keeps photos and the distribution day of each line", () => {
    const d = parseDelivery({
      stage: "delivered",
      history: [
        { stage: "preparing", at: "2026-11-09T10:00:00Z", photos: ["/storage/a.jpg", "", 5] },
        { stage: "delivered", at: "2026-11-10T10:00:00Z", photos: ["https://x/b.jpg", "/storage/a.jpg"], distribution: { id: "7", title: "قافلة", place: "المنيا" } },
      ],
    });
    expect(d?.history[0].photos).toEqual(["/storage/a.jpg"]);
    expect(linesByStep(d).delivered?.distribution).toEqual({ id: 7, title: "قافلة", place: "المنيا" });
    expect(trailPhotos(d)).toEqual(["https://x/b.jpg", "/storage/a.jpg"]);
  });
});
