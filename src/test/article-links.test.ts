import { describe, expect, it } from "vitest";
import { linkifyBarePaths, cleanArticleBody, auditArticleBody } from "@/lib/article-links";

describe("article links", () => {
  it("turns «صفحة التبرع: /path» into a link", () => {
    expect(linkifyBarePaths("ادعم الحملة الآن عبر صفحة التبرع: /donate?program=shade أو تواصل معنا"))
      .toBe("ادعم الحملة الآن عبر [صفحة التبرع](/donate?program=shade) أو تواصل معنا");
  });
  it("links other bare paths and leaves Markdown links alone", () => {
    expect(linkifyBarePaths("شوف /cases دلوقتي")).toBe("شوف [الحالات المفتوحة](/cases) دلوقتي");
    const md = "اقرا [فدية الصيام](/blog/fedyet-el-siyam).";
    expect(linkifyBarePaths(md)).toBe(md);
    expect(linkifyBarePaths("زور https://elyusr.org/donate الآن")).toBe("زور [صفحة التبرع](/donate) الآن");
    expect(linkifyBarePaths("مصدر https://www.dar-alifta.org/ar/fatwa")).toBe("مصدر https://www.dar-alifta.org/ar/fatwa");
    expect(linkifyBarePaths("و/أو")).toBe("و/أو");
  });
  it("replaces the slug written as a word, not inside links", () => {
    const body = "## أسئلة شائعة عن shade-campaign-sqya-2026\n[x](/blog/shade-campaign-sqya-2026)";
    expect(cleanArticleBody(body, "shade-campaign-sqya-2026", "حملة سقيا الماء"))
      .toBe("## أسئلة شائعة عن حملة سقيا الماء\n[x](/blog/shade-campaign-sqya-2026)");
    expect(auditArticleBody(body, "shade-campaign-sqya-2026", "").some((i) => i.id === "slug-as-text")).toBe(true);
  });
});
