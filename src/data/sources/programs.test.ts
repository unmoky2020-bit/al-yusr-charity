import { describe, expect, it } from "vitest";
import { programs, getProgram } from "@/data/programs";
import { CONTENT_SOURCE, useApiContent, __readContentSource } from "@/lib/contentSource";
import { mapApiProgram, programSlugOf, resolvePrograms } from "./programs";
import { mergeByKey, normalizeSlug, unwrapList } from "./_shared";
import { API_PROGRAM_ORPHANS, API_PROGRAM_URL_SLUG, API_PROGRAM_ZAKAT_INACTIVE } from "./_testFixtures";

describe("content source flag", () => {
  it("tests run against the static copies (VITE_CONTENT_SOURCE=static in vitest.config.ts)", () => {
    expect(CONTENT_SOURCE).toBe("static");
    expect(useApiContent).toBe(false);
  });
  it("parses the env value; a missing value means the backend", () => {
    expect(__readContentSource(undefined)).toBe("api");
    expect(__readContentSource("")).toBe("api");
    expect(__readContentSource("weird")).toBe("api");
    expect(__readContentSource(" Static ")).toBe("static");
    expect(__readContentSource("API")).toBe("api");
    expect(__readContentSource(" auto ")).toBe("auto");
  });
});

describe("shared helpers", () => {
  it("unwraps list responses", () => {
    expect(unwrapList([{ a: 1 }])).toHaveLength(1);
    expect(unwrapList({ data: [{ a: 1 }, { a: 2 }] })).toHaveLength(2);
    expect(unwrapList({ data: { data: [{ a: 1 }] } })).toHaveLength(1);
    expect(unwrapList(null)).toEqual([]);
  });
  it("normalizes URL-like slugs", () => {
    expect(normalizeSlug("https://elyusr.org/food-box")).toBe("food-box");
    expect(normalizeSlug(" Box ")).toBe("box");
  });
  it("mergeByKey keeps static order, replaces matches, appends API-only, returns static for empty", () => {
    const s = [{ k: "a", v: 1 }, { k: "b", v: 1 }];
    expect(mergeByKey(s, [], (x) => x.k)).toBe(s);
    expect(mergeByKey(s, [{ k: "b", v: 2 }, { k: "c", v: 2 }], (x) => x.k)).toEqual([
      { k: "a", v: 1 },
      { k: "b", v: 2 },
      { k: "c", v: 2 },
    ]);
  });
});

describe("programs source", () => {
  it("maps an API program to ProgramContent", () => {
    const fb = getProgram("orphans");
    const p = mapApiProgram(API_PROGRAM_ORPHANS, fb);
    expect(p.slug).toBe("orphans");
    expect(p.priceFrom).toBe(300);
    expect(p.image).toContain("/storage/programs/");
    expect(p.ar.name).toBe("كفالة يتيم");
    expect(p.en.name).toBe("Orphan Sponsorship");
    expect(p.ar.tagline).toBe(API_PROGRAM_ORPHANS.tagline_ar);
    expect(p.ar.benefits).toEqual(API_PROGRAM_ORPHANS.benefits_ar);
    expect(p.ar.longContent).toHaveLength(3);
    // shape is exactly the static type's keys
    expect(Object.keys(p.ar).sort()).toEqual(Object.keys(fb!.ar).sort());
  });

  it("falls back to the static program for missing fields", () => {
    const fb = getProgram("orphans")!;
    const p = mapApiProgram(API_PROGRAM_ORPHANS, fb);
    // benefits_en is [] and content_en is null in the API record
    expect(p.en.benefits).toEqual(fb.en.benefits);
    expect(p.en.longContent).toEqual(fb.en.longContent);
    const bare = mapApiProgram({ slug: "orphans" }, fb);
    expect(bare).toEqual({ ...fb });
  });

  it("returns the static array unchanged when the flag is static", () => {
    expect(resolvePrograms(undefined)).toBe(programs);
    expect(resolvePrograms([API_PROGRAM_ORPHANS], "static")).toBe(programs);
  });

  it("api mode: exactly the published backend programs — no static additions, inactive ones dropped", () => {
    const list = resolvePrograms([API_PROGRAM_ORPHANS, API_PROGRAM_ZAKAT_INACTIVE, API_PROGRAM_URL_SLUG], "api");
    expect(list.map((p) => p.slug).sort()).toEqual(["food-box", "orphans"]);
    expect(list.find((p) => p.slug === "zakat")).toBeUndefined();
    expect(list.find((p) => p.slug === "orphans")!.priceFrom).toBe(300);
    expect(programSlugOf({ slug: "general-donation" })).toBe("general");
  });

  it("api mode with an empty/failed response returns all static data", () => {
    expect(resolvePrograms([], "api")).toBe(programs);
  });
});
