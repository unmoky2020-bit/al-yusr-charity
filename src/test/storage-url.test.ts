import { describe, expect, it } from "vitest";
import { formatServerImageUrl } from "@/data/laravelApi";

describe("storage URLs", () => {
  it("collapses a doubled /storage/storage/ segment", () => {
    const out = formatServerImageUrl("https://api.elyusr.org/storage/storage/media/cases/a.jpeg");
    expect(out).toMatch(/\/storage\/media\/cases\/a\.jpeg$/);
    expect(out).not.toMatch(/storage\/storage/);
    expect(formatServerImageUrl("storage/storage/media/x.png")).toMatch(/\/storage\/media\/x\.png$/);
  });
});
