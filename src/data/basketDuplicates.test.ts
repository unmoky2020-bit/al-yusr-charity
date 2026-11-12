import { describe, expect, it } from "vitest";
import { duplicateLines, lineKeys, takenByOthers, type BasketLine } from "./basketDuplicates";

const line = (id: string, p: Partial<BasketLine>): BasketLine => ({
  id,
  entityId: "food",
  donationMode: "general",
  selectedShares: {},
  selectedCaseId: null,
  ...p,
});

describe("basket duplicates", () => {
  it("keys a line by what it holds", () => {
    expect(lineKeys(line("a", { donationMode: "shares", selectedShares: { carton: 2, half: 0 } }))).toEqual(["share:food:carton"]);
    expect(lineKeys(line("a", { donationMode: "case", selectedCaseId: "case-7" }))).toEqual(["case:case-7"]);
    expect(lineKeys(line("a", { donationMode: "general" }))).toEqual(["general:food"]);
    expect(lineKeys(line("a", { donationMode: "in_kind" }))).toEqual([]);
  });

  it("finds the same share, case or general amount in two lines", () => {
    const items = [
      line("a", { donationMode: "shares", selectedShares: { carton: 1 } }),
      line("b", { donationMode: "shares", selectedShares: { carton: 3 } }),
      line("c", { donationMode: "case", selectedCaseId: "case-1", entityId: "x" }),
      line("d", { donationMode: "case", selectedCaseId: "case-1", entityId: "y" }),
      line("e", { donationMode: "general", entityId: "water" }),
      line("f", { donationMode: "general", entityId: "water" }),
    ];
    expect(duplicateLines(items)).toEqual({ b: 1, d: 3, f: 5 });
  });

  it("allows different shares of one program, and the same share name on another program", () => {
    const items = [
      line("a", { donationMode: "shares", selectedShares: { carton: 1 } }),
      line("b", { donationMode: "shares", selectedShares: { half: 1 } }),
      line("c", { donationMode: "shares", entityId: "zakat", selectedShares: { carton: 1 } }),
      line("d", { donationMode: "general" }),
    ];
    expect(duplicateLines(items)).toEqual({});
  });

  it("tells a line what the other lines already hold", () => {
    const items = [
      line("a", { donationMode: "case", selectedCaseId: "case-1" }),
      line("b", { donationMode: "shares", selectedShares: { carton: 1 } }),
    ];
    const t = takenByOthers(items, "b");
    expect(t.get("case:case-1")).toBe(1);
    expect(t.has("share:food:carton")).toBe(false);
  });
});
