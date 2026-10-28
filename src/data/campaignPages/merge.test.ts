import { describe, expect, it } from "vitest";
import { l, mergeCampaignContent, type CampaignPageContent } from "./types";

const base: CampaignPageContent = {
  hero: { eyebrow: l("أ", "a"), title: l("عنوان", "Title"), title2: l("٢", "2"), lead: l("مقدمة", "Lead"), donateLabel: l("تبرع", "Donate") },
  hadith: { text: l("حديث", "Hadith"), source: l("مسلم", "Muslim") },
  prices: [{ id: "blanket", label: l("لحاف", "Blanket"), amount: 450 }, { id: "door", label: l("باب", "Door"), amount: 2200, note: l("ملاحظة", "note") }],
  stats: [{ id: "boxes", label: l("كرتونة", "Boxes"), value: 1400, unit: l("كرتونة", "boxes") }],
  sections: { steps: { title: l("خطوات", "Steps"), items: [{ id: "a", title: l("١", "1"), desc: l("وصف", "desc") }] } },
  faq: [{ q: l("س", "Q"), a: l("ج", "A") }],
  cta: { title: l("ختام", "CTA"), sub: l("فرعي", "sub") },
};

describe("mergeCampaignContent", () => {
  it("returns defaults for null / malformed overrides", () => {
    expect(mergeCampaignContent(base, null)).toEqual(base);
    expect(mergeCampaignContent(base, "garbage")).toEqual(base);
    expect(mergeCampaignContent(base, { prices: "nope", hero: 5, faq: [] })).toEqual(base);
  });

  it("overrides amounts and texts by id, ignores unknown ids and keeps default order", () => {
    const m = mergeCampaignContent(base, { prices: [{ id: "door", amount: 2500 }, { id: "ghost", amount: 1 }], hero: { title: { ar: "جديد", en: "" } } });
    expect(m.prices.map((p) => [p.id, p.amount])).toEqual([["blanket", 450], ["door", 2500]]);
    expect(m.prices[1].note).toEqual(l("ملاحظة", "note"));
    expect(m.hero.title).toEqual(l("جديد", "Title")); // empty en falls back to default
  });

  it("rejects invalid numbers and allows null stats", () => {
    const m = mergeCampaignContent(base, { prices: [{ id: "blanket", amount: -5 }], stats: [{ id: "boxes", value: null }] });
    expect(m.prices[0].amount).toBe(450);
    expect(m.stats[0].value).toBeNull();
  });

  it("replaces FAQ wholesale only when every item is well-formed", () => {
    const good = [{ q: l("س٢", "Q2"), a: l("ج٢", "A2") }, { q: l("س٣", "Q3"), a: l("ج٣", "A3") }];
    expect(mergeCampaignContent(base, { faq: good }).faq).toEqual(good);
    expect(mergeCampaignContent(base, { faq: [{ q: "bad" }] }).faq).toEqual(base.faq);
  });

  it("dynamic sections take the saved list: order, additions and removals, dropping malformed items", () => {
    const dyn: CampaignPageContent = {
      ...base,
      sections: { carton: { dynamic: true, extraLabel: l("كيلو", "kg"), title: l("كرتونة", "Carton"), items: [
        { id: "rice", title: l("أرز", "Rice"), desc: l("٣", "3"), extra: l("3", "3") },
        { id: "sugar", title: l("سكر", "Sugar"), desc: l("٢", "2"), extra: l("2", "2") },
      ] } },
    };
    const m = mergeCampaignContent(dyn, { sections: { carton: { items: [
      { id: "dates", title: l("تمر", "Dates"), desc: l("١", "1"), extra: l("1", "1") }, // new item
      { id: "rice", extra: l("4", "4") }, // known id, blanks filled from the default
      { id: "", title: l("x", "x") }, // malformed: dropped
      { id: "ghost" }, // new id without a title: dropped
    ] } } });
    expect(m.sections.carton.dynamic).toBe(true);
    expect(m.sections.carton.extraLabel).toEqual(l("كيلو", "kg"));
    expect(m.sections.carton.items).toEqual([
      { id: "dates", title: l("تمر", "Dates"), desc: l("١", "1"), extra: l("1", "1") },
      { id: "rice", title: l("أرز", "Rice"), desc: l("٣", "3"), extra: l("4", "4") },
    ]);
    expect(mergeCampaignContent(dyn, { sections: { carton: { items: [] } } }).sections.carton.items).toEqual([]);
    expect(mergeCampaignContent(dyn, { sections: { carton: { items: "nope" } } }).sections.carton.items).toEqual(dyn.sections.carton.items);
  });

  it("merges section items by id and ignores unknown section keys", () => {
    const m = mergeCampaignContent(base, { sections: { steps: { items: [{ id: "a", desc: l("جديد", "new") }] }, nope: { title: l("x", "x"), items: [] } } });
    expect(m.sections.steps.items[0]).toEqual({ id: "a", title: l("١", "1"), desc: l("جديد", "new"), extra: undefined });
    expect(Object.keys(m.sections)).toEqual(["steps"]);
  });
});
