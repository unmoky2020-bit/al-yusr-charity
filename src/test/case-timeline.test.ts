import { describe, expect, it } from "vitest";
import { updatesNotInJourney } from "@/lib/caseTimeline";

describe("updatesNotInJourney", () => {
  it("does not display a backend update twice when the journey already contains it", () => {
    const occurredAt = "2026-11-04T22:46:34.000000Z";
    const updates = [
      { id: "2", case_id: "56", body: "يتم التطوير", image_url: "/storage/update.jpg", author_id: null, created_at: occurredAt },
    ];
    const journey = [
      {
        id: "executing-2", case_id: "56", donation_id: null, step_key: "executing",
        title_ar: "تحديث من الميدان", title_en: "Field update",
        note_ar: "يتم التطوير", note_en: null, media_url: "/storage/update.jpg",
        occurred_at: occurredAt, is_public: true, created_by: null, created_at: occurredAt, updated_at: occurredAt,
      },
    ];

    expect(updatesNotInJourney(journey, updates)).toEqual([]);
  });

  it("keeps updates not represented in the journey", () => {
    const update = { id: "3", case_id: "56", body: "تم الاستلام", image_url: null, author_id: null, created_at: "2026-11-05T10:00:00Z" };
    expect(updatesNotInJourney([], [update])).toEqual([update]);
  });
});
