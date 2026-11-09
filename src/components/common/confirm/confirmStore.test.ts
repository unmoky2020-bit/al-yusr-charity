import { describe, expect, it } from "vitest";
import { splitMessage, toneOf } from "./confirmStore";

describe("confirm box: plain sentences", () => {
  it("picks the tone from the words", () => {
    expect(toneOf("هل أنت متأكد من حذف هذه الحالة؟")).toBe("danger");
    expect(toneOf("Delete campaign?")).toBe("danger");
    expect(toneOf("إلغاء اشتراك a@b.com؟")).toBe("warning");
    expect(toneOf("استعادة القيم الأصلية؟")).toBe("warning");
    expect(toneOf("إرسال الحملة لـ 40 مشترك مؤكد؟")).toBe("default");
  });

  it("splits a question from its detail", () => {
    expect(splitMessage("حذف الحالة نهائياً؟ هتتحذف معاها صورها وتحديثاتها.")).toEqual({
      title: "حذف الحالة نهائياً؟",
      description: "هتتحذف معاها صورها وتحديثاتها.",
    });
    expect(splitMessage("حذف السؤال ده؟")).toEqual({ title: "حذف السؤال ده؟" });
  });
});
