import { describe, expect, it } from "vitest";
import { caseFunding, daysLeft, filterCases, filterOpenCases, filterUrgentOpenCases, sortCases, suggestedAmounts } from "@/lib/caseFunding";
import type { CaseRow } from "@/data/casesApi";

const mk = (p: Partial<CaseRow>): CaseRow =>
  ({ id: "1", ref_code: "CASE-1", title: "", story: "", needed_amount: 1000, raised_amount: 0, status: "approved", urgency: "medium", created_at: "2026-10-01", ...p }) as CaseRow;

describe("caseFunding", () => {
  it("computes remaining and pct without passing 100", () => {
    expect(caseFunding(mk({ raised_amount: 250 }))).toMatchObject({ remaining: 750, pct: 25, done: false });
    expect(caseFunding(mk({ raised_amount: 1500 }))).toMatchObject({ remaining: 0, pct: 100, done: true });
  });
  it("treats a completed case as done even if not fully raised", () => {
    expect(caseFunding(mk({ status: "completed" as CaseRow["status"] })).done).toBe(true);
  });
  it("treats funded status aliases as done", () => {
    expect(caseFunding(mk({ status: " Funded " as CaseRow["status"] })).done).toBe(true);
  });
  it("only keeps approved, unfinished cases in linked case sections", () => {
    const cases = [
      mk({ id: "open" }),
      mk({ id: "completed", status: "completed" }),
      mk({ id: "closed", status: "closed" }),
      mk({ id: "funded-status", status: "funded" as CaseRow["status"] }),
      mk({ id: "fully-funded", raised_amount: 1000 }),
      mk({ id: "unapproved", status: "pending_review" }),
    ];
    expect(filterOpenCases(cases).map((c) => c.id)).toEqual(["open"]);
  });
  it("removes completed, closed, and fully funded cases from the urgent carousel", () => {
    const cases = [
      mk({ id: "open", is_urgent: true }),
      mk({ id: "completed", status: "completed", is_urgent: true }),
      mk({ id: "closed", status: "closed", is_urgent: true }),
      mk({ id: "funded", raised_amount: 1000, is_urgent: true }),
      mk({ id: "unapproved", status: "pending_review", is_urgent: true }),
      mk({ id: "not-urgent", is_urgent: false }),
    ];
    expect(filterUrgentOpenCases(cases).map((c) => c.id)).toEqual(["open"]);
  });
});

describe("daysLeft", () => {
  const now = new Date(2026, 10, 2, 20, 0);
  it("counts calendar days", () => {
    expect(daysLeft("2026-11-02", now)).toBe(0);
    expect(daysLeft("2026-11-12", now)).toBe(10);
    expect(daysLeft("2026-11-01", now)).toBe(-1);
    expect(daysLeft(null, now)).toBeNull();
    expect(daysLeft("bad", now)).toBeNull();
  });
});

describe("suggestedAmounts", () => {
  it("offers chips below the remainder and a closing chip when small", () => {
    expect(suggestedAmounts(800)).toEqual({ amounts: [100, 250, 500], closing: 800 });
    expect(suggestedAmounts(50000)).toEqual({ amounts: [100, 250, 500], closing: null });
    expect(suggestedAmounts(0)).toEqual({ amounts: [], closing: null });
  });
});

describe("filter + sort", () => {
  const rows = [
    mk({ id: "a", title: "عملية قلب لطفلة", urgency: "medium", raised_amount: 900 }),
    mk({ id: "b", title: "تسقيف بيت", urgency: "high", city: "المنصورة" }),
    mk({ id: "c", title: "علاج", raised_amount: 1000 }),
  ];
  it("searches Arabic loosely (ة/ه, أ/ا)", () => {
    expect(filterCases(rows, { q: "طفله" }).map((r) => r.id)).toEqual(["a"]);
    expect(filterCases(rows, { q: "المنصوره" }).map((r) => r.id)).toEqual(["b"]);
  });
  it("splits open and funded", () => {
    expect(filterCases(rows, { status: "open" }).map((r) => r.id)).toEqual(["a", "b"]);
    expect(filterCases(rows, { status: "done" }).map((r) => r.id)).toEqual(["c"]);
  });
  it("puts funded last and orders by the chosen sort", () => {
    expect(sortCases(rows, "urgent").map((r) => r.id)).toEqual(["b", "a", "c"]);
    expect(sortCases(rows, "closest").map((r) => r.id)).toEqual(["a", "b", "c"]);
  });
});
