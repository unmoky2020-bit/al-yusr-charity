import { describe, expect, it } from "vitest";
import { getProgram } from "@/data/programs";
import { dedupeFaqs, faqCategoryForProgram } from "@/data/programFaqs";
import { programSeo, PROGRAM_SEO_DEFAULTS } from "@/data/programSeo";
import { mapApiProgram } from "./programs";

const base = {
  id: 35,
  slug: "odhya",
  name_ar: "صك الأضحية",
  status: "published",
  is_active: true,
};

describe("program detail fields from the dashboard", () => {
  it("maps hero overrides (H1, subtitle, badge, image)", () => {
    const p = mapApiProgram(
      { ...base, hero_h1_ar: "صك أضحية 2026 بالمنصورة", hero_h3_ar: "ضمان جودة", hero_image: "programs/hero.jpg", top_section: { badge_ar: "موسم 2026" } },
      getProgram("odhya"),
    );
    expect(p.hero?.ar).toEqual({ title: "صك أضحية 2026 بالمنصورة", subtitle: "ضمان جودة", badge: "موسم 2026" });
    expect(p.hero?.image).toContain("programs/hero.jpg");
  });

  it("leaves hero undefined when the dashboard has nothing", () => {
    expect(mapApiProgram(base, getProgram("odhya")).hero).toBeUndefined();
  });

  it("reads the FAQ category linked on the program (faq_category_id → faq_category)", () => {
    const p = mapApiProgram({ ...base, faq_category_id: 8, faq_category: { id: 8, slug: "qurbani", name_ar: "أسئلة الأضحية" } }, getProgram("odhya"));
    expect(p.faqCategory).toBe("qurbani");
    expect(mapApiProgram(base, getProgram("odhya")).faqCategory).toBeUndefined();
  });

  it("uses active page sections with items and ignores empty or hidden ones", () => {
    const p = mapApiProgram(
      {
        ...base,
        page_sections: [
          { section_key: "benefits", is_active: true, content_ar: [{ text: "معاينة بيطرية" }] },
          { section_key: "how_it_works", is_active: true, content_ar: [{ title: "اختيار", description: "بحث ميداني" }] },
          { section_key: "details", is_active: false, content_ar: [{ text: "مخفي" }] },
          { section_key: "faq", is_active: true, content_ar: [] },
        ],
      },
      getProgram("odhya"),
    );
    expect(p.sections?.benefits?.ar).toEqual(["معاينة بيطرية"]);
    expect(p.sections?.steps?.ar).toEqual([{ t: "اختيار", d: "بحث ميداني" }]);
    expect(p.sections?.details).toBeUndefined();
  });

  it("prefers dashboard SEO, then the keyword preset", () => {
    const fromDashboard = mapApiProgram({ ...base, meta_title_ar: "عنوان من اللوحة" }, getProgram("odhya"));
    expect(programSeo(fromDashboard, "ar").title).toBe("عنوان من اللوحة");
    expect(programSeo(getProgram("odhya")!, "ar").title).toBe(PROGRAM_SEO_DEFAULTS.odhya.title);
  });

  it("keeps preset titles within 60 characters", () => {
    for (const [slug, v] of Object.entries(PROGRAM_SEO_DEFAULTS)) {
      expect(v.title.length, slug).toBeLessThanOrEqual(60);
      expect(v.description.length, slug).toBeLessThanOrEqual(160);
    }
  });
});

describe("program FAQ linking", () => {
  it("maps programs to their FAQ category", () => {
    expect(faqCategoryForProgram("odhya")).toBe("qurbani");
    expect(faqCategoryForProgram("markoun")).toBe("markoun");
    expect(faqCategoryForProgram("water")).toBe("water");
  });
  it("dedupes questions ignoring spacing and case", () => {
    expect(dedupeFaqs([{ q: "سؤال  واحد", a: "1" }, { q: "سؤال واحد", a: "2" }])).toEqual([{ q: "سؤال  واحد", a: "1" }]);
  });
});
