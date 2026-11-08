import { describe, expect, it } from "vitest";
import defaults from "./defaultPageSections.json";
import { clip, planRecordFill, planSectionFill, programSlugKey, type DefaultSections } from "./fillProgramSections";

const D = defaults as unknown as DefaultSections;

describe("program page-section fill", () => {
  it("files every program under a clean slug", () => {
    expect(programSlugKey("https://elyusr.org/water")).toBe("water");
    expect(programSlugKey("/programs/zakat/")).toBe("zakat");
    expect(programSlugKey("orphans")).toBe("orphans");
  });

  it("has the five page sections for all fifteen slugs (16 programs: both water records share one)", () => {
    expect(Object.keys(D)).toHaveLength(15);
    for (const secs of Object.values(D)) {
      expect(Object.keys(secs).sort()).toEqual(["benefits", "details", "faq", "how_it_works", "impact"]);
      for (const s of Object.values(secs)) {
        expect(s.content_ar.length).toBeGreaterThan(0);
        expect(s.content_en.length).toBe(s.content_ar.length);
      }
    }
  });

  it("never overwrites a section that has content, fills empty ones and creates missing ones", () => {
    const existing = [
      { id: 1, section_key: "benefits", content_ar: [{ text: "من اللوحة" }], content_en: [] },
      { id: 2, section_key: "details", title_ar: "عنوان من اللوحة", content_ar: [], content_en: [], is_enabled: false, sort_order: 9 },
    ];
    const plan = planSectionFill(existing, D.orphans);
    expect(plan.update.map((u) => u.id)).toEqual([2]);
    expect(plan.update[0].body).toMatchObject({ title_ar: "عنوان من اللوحة", is_enabled: false, sort_order: 9 });
    expect(plan.create.map((c) => c.section_key).sort()).toEqual(["faq", "how_it_works", "impact"]);
  });

  it("writes nothing when every suggested section already has content", () => {
    const full = Object.keys(D.zakat).map((k, i) => ({ id: i + 1, section_key: k, content_ar: [{ text: "x" }] }));
    expect(planSectionFill(full, D.zakat)).toEqual({ create: [], update: [] });
  });

  it("uses no figures or prices in the suggested copy", () => {
    const text = JSON.stringify(D);
    expect(text).not.toMatch(/[0-9٠-٩]{3,}/); // no counts like 354 or prices like 300
    expect(text).not.toMatch(/ج\.م|جنيه|EGP|%/);
  });

  it("fills only the record fields that are empty, and keeps SEO descriptions short", () => {
    const fields = planRecordFill({ name_ar: "كفالة يتيم", name_en: "Orphan Sponsorship", description_ar: "وصف من اللوحة", meta_title_en: "Kept" }, D.orphans);
    expect(fields).not.toHaveProperty("description_ar");
    expect(fields).not.toHaveProperty("meta_title_en");
    expect(fields.meta_title_ar).toBe("كفالة يتيم | مؤسسة اليسر الخيرية");
    expect(String(fields.meta_description_ar).length).toBeLessThanOrEqual(155);
    expect(fields.benefits_ar).toEqual(D.orphans.benefits.content_ar.map((b) => (b as { text: string }).text));
    expect(Array.isArray(fields.ai_faq_ar)).toBe(true);
    expect(clip("كلمة ".repeat(60)).length).toBeLessThanOrEqual(155);
  });
});
