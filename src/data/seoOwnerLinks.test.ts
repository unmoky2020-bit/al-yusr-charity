import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { OWNER_PAGES, OWNER_RELATED, relatedOwners } from "./seoOwnerLinks";

const ownersInCsv = () =>
  new Set(
    readFileSync("docs/seo-keywords.csv", "utf8")
      .replace(/^﻿/, "")
      .split(/\r?\n/)
      .slice(1)
      .map((l) => l.split(",")[2])
      .filter(Boolean),
  );

describe("keyword owner links", () => {
  it("covers every owner page of docs/seo-keywords.csv", () => {
    for (const p of ownersInCsv()) {
      expect(OWNER_PAGES[p], p).toBeTruthy();
      expect(OWNER_RELATED[p]?.length, p).toBeGreaterThanOrEqual(3);
    }
  });

  it("only links to known owners, never to itself", () => {
    for (const [from, list] of Object.entries(OWNER_RELATED)) {
      for (const to of list) {
        expect(OWNER_PAGES[to], `${from} → ${to}`).toBeTruthy();
        expect(to).not.toBe(from);
      }
    }
  });

  it("gives every owner at least two incoming links", () => {
    const incoming = new Map<string, number>();
    for (const list of Object.values(OWNER_RELATED)) for (const to of list) incoming.set(to, (incoming.get(to) ?? 0) + 1);
    for (const p of Object.keys(OWNER_PAGES).filter((x) => x !== "/")) expect(incoming.get(p) ?? 0, p).toBeGreaterThanOrEqual(2);
  });

  it("resolves a path with a trailing slash and ignores other pages", () => {
    expect(relatedOwners("/zakat/").map((p) => p.path)).toEqual(OWNER_RELATED["/zakat"]);
    expect(relatedOwners("/blog")).toEqual([]);
  });
});
