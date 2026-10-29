import { describe, expect, it } from "vitest";
import { diffPayload, keysMissingFromResponse, normalizeFaq, toKebabIcon } from "./formUtils";
import { programFormFromRecord, programPayload, topSectionFromRecord, topSectionPayload } from "./programForm";

describe("program admin form helpers", () => {
  it("diffPayload sends only changed keys and null for cleared values", () => {
    const prev = { a: "x", b: null, c: [1, 2], d: true };
    const next = { a: null, b: null, c: [1, 2], d: false };
    expect(diffPayload(next, prev)).toEqual({ a: null, d: false });
  });

  it("an untouched loaded program produces an empty diff", () => {
    const rec = {
      id: 35, slug: "odhya", name_ar: "صك الأضحية", name_en: "Qurbani Voucher", title_ar: "صك الأضحية",
      target_amount: "500000.00", minimum_amount: "1400.00", benefits_ar: ["a", "b"], seasons: [], status: "draft",
      is_active: false, hide_from_audience: true, ai_faq_ar: null, noindex: false,
    };
    const f = programFormFromRecord(rec);
    expect(diffPayload(programPayload(f), programPayload(programFormFromRecord(rec)))).toEqual({});
    expect(programPayload(f).target_amount).toBe(500000);
  });

  it("normalizeFaq accepts arrays, JSON strings and legacy 'Q | A' text", () => {
    expect(normalizeFaq([{ question: "q", answer: "a" }])).toEqual([{ question: "q", answer: "a" }]);
    expect(normalizeFaq('[{"q":"q1","a":"a1"}]')).toEqual([{ question: "q1", answer: "a1" }]);
    expect(normalizeFaq("سؤال | جواب\nQ2|A2")).toEqual([
      { question: "سؤال", answer: "جواب" },
      { question: "Q2", answer: "A2" },
    ]);
  });

  it("detects keys the backend silently dropped", () => {
    expect(keysMissingFromResponse({ name: "x", meta_title_ar: "t" }, { id: 1, name: "x" })).toEqual(["meta_title_ar"]);
    expect(keysMissingFromResponse({ name: "x" }, { message: "ok" })).toEqual([]);
  });

  it("top_section keeps unknown keys and normalizes amounts", () => {
    const orig = { title_ar: "t", minimum_amount: "1400.00", extra_flag: 1 };
    const out = topSectionPayload(topSectionFromRecord(orig), orig);
    expect(out.minimum_amount).toBe(1400);
    expect(out.extra_flag).toBe(1);
  });

  it("converts picker icon names to the stored kebab-case", () => {
    expect(toKebabIcon("HandHeart")).toBe("hand-heart");
    expect(toKebabIcon("CheckCircle2")).toBe("check-circle-2");
  });
});
