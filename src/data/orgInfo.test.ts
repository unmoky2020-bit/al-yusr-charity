import { describe, expect, it } from "vitest";
import { isOfficeOpen } from "./orgInfo";

describe("office hours (Cairo time)", () => {
  // Cairo is UTC+2 in November (no daylight saving then).
  it("is open on a Sunday afternoon and closed at night", () => {
    expect(isOfficeOpen(new Date("2026-11-08T12:00:00Z"))).toBe(true); // Sun 14:00
    expect(isOfficeOpen(new Date("2026-11-08T19:30:00Z"))).toBe(false); // Sun 21:30
    expect(isOfficeOpen(new Date("2026-11-08T07:59:00Z"))).toBe(false); // Sun 09:59
  });

  it("is closed all Friday", () => {
    expect(isOfficeOpen(new Date("2026-11-13T12:00:00Z"))).toBe(false); // Fri 14:00
  });
});
