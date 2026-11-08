import { describe, expect, it } from "vitest";
import { parseArticleMarkdown } from "./blog-import";

describe("blog markdown import", () => {
  it("parses bilingual metadata and article bodies", () => {
    const article = parseArticleMarkdown(`| الحقل | القيمة |
|---|---|
| العنوان | دليل الزكاة |
| العنوان بالإنجليزية | Zakat guide |
| الرابط | zakat-guide |
| الوصف | دليل مبسط لحساب الزكاة والتعرف على أحكامها الأساسية للمسلمين في مصر مع شرح خطوات التحقق من النصاب ومتى تجب الزكاة. |
| الوصف بالإنجليزية | A clear guide to calculating zakat and its basics. |
| التصنيف | زكاة |
| التصنيف بالإنجليزية | Zakat |
| الكلمة الأساسية | حساب الزكاة |
| كلمات قريبة | زكاة المال، نصاب الزكاة |
| كلمات قريبة بالإنجليزية | zakat, zakat calculation |
---
# دليل الزكاة

المحتوى العربي.

## English version
# Zakat guide

English article content.`);

    expect(article).toMatchObject({
      slug: "zakat-guide",
      title_ar: "دليل الزكاة",
      title_en: "Zakat guide",
      excerpt_en: "A clear guide to calculating zakat and its basics.",
      category_en: "Zakat",
      tags_en: ["zakat", "zakat calculation"],
      body_ar: ["المحتوى العربي."],
      body_en: ["English article content."],
      problems: [],
    });
  });

  it("keeps older Arabic-only files importable", () => {
    const article = parseArticleMarkdown(`# نصائح خيرية

محتوى المقال.`);

    expect(article).toMatchObject({
      title_ar: "نصائح خيرية",
      title_en: "",
      body_ar: ["محتوى المقال."],
      body_en: [],
    });
  });
});
