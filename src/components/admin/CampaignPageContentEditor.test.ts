import { describe, expect, it } from "vitest";
import { campaignSectionTabs, sectionKeysFor } from "./CampaignPageContentEditor";
import dhill from "@/data/campaignPages/dhill";
import food from "@/data/campaignPages/food";
import arboun from "@/data/campaignPages/arboun";
import setr from "@/data/campaignPages/setr";

const ids = (c: Parameters<typeof campaignSectionTabs>[0]) => campaignSectionTabs(c).map((t) => t.id);
const allKeys = (c: Parameters<typeof campaignSectionTabs>[0]) =>
  [...campaignSectionTabs(c).flatMap((t) => t.keys), ...(["seo", "hadith", "faqs"] as const).flatMap((tab) => sectionKeysFor(c, tab))].sort();

describe("campaignSectionTabs", () => {
  it("gives Dhill one tab per section, areas_* grouped, seo/hadith2 in their own tabs", () => {
    expect(ids(dhill)).toEqual(["trust", "tracks", "dedicate", "steps", "areas", "gallery"]);
    expect(campaignSectionTabs(dhill).find((t) => t.id === "areas")?.keys).toEqual(["areas", "areas_now", "areas_before"]);
    expect(sectionKeysFor(dhill, "seo")).toEqual(["seo"]);
    expect(sectionKeysFor(dhill, "hadith")).toEqual(["hadith2"]);
  });

  it("groups pillar_details with pillars and sends faq_intro to the FAQ tab (Arboun)", () => {
    expect(campaignSectionTabs(arboun).find((t) => t.id === "pillars")?.keys).toEqual(["pillars", "pillar_details"]);
    expect(sectionKeysFor(arboun, "faqs")).toEqual(["faq_intro"]);
  });

  it("never loses a section key", () => {
    for (const c of [dhill, food, arboun, setr]) expect(allKeys(c)).toEqual(Object.keys(c.sections).sort());
  });
});
