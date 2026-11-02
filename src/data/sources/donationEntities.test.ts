import { describe, expect, it } from "vitest";
import { DONATION_ENTITIES, ENTITY_MAP } from "@/data/donationEntities";
import { entityIdOf, findEntityForLink, mapApiCase, mapApiEntity, mapApiPackage, resolveDonationEntities } from "./donationEntities";
import { targetOfBasket, targetOfItem } from "@/data/donationTarget";
import { mapApiProject } from "./projects";
import { API_CAMPAIGN_ZELL, API_PROGRAM_ORPHANS, API_PROGRAM_ZAKAT_INACTIVE, API_PROJECT_WATER_STATION } from "./_testFixtures";

const OPTIONAL_KEYS = ["color", "isMarkoun", "isSeasonal", "apiId", "slug"];
const ENTITY_KEYS = Object.keys(ENTITY_MAP.general).filter((k) => !OPTIONAL_KEYS.includes(k)).sort();

describe("donation entities source", () => {
  it("maps an API campaign to a DonationEntity, aliasing the backend slug to the static id", () => {
    expect(entityIdOf(API_CAMPAIGN_ZELL)).toBe("dhill");
    const e = mapApiEntity(API_CAMPAIGN_ZELL, "campaign", ENTITY_MAP.dhill);
    expect(e.id).toBe("dhill");
    expect(e.entityType).toBe("campaign");
    expect(e.ar).toBe("حملة ظل");
    expect(e.priceFrom).toBe(500);
    // inactive package dropped, sorted by sort_order
    expect(e.shares.map((s) => s.price)).toEqual([500, 7500]);
    expect(e.shares[0]).toMatchObject({ id: "pkg-48", nameAr: "سهم سقف خشبي", nameEn: "Roof Share" });
    expect(Object.keys(e).filter((k) => !OPTIONAL_KEYS.includes(k)).sort()).toEqual(ENTITY_KEYS);
    expect(e).toMatchObject({ apiId: API_CAMPAIGN_ZELL.id, slug: "zell" });
  });

  it("falls back to static fields (color, category) when the API lacks them, never to sample cases", () => {
    const fb = ENTITY_MAP.dhill;
    const e = mapApiEntity(API_CAMPAIGN_ZELL, "campaign", fb);
    expect(e.cases).toEqual([]); // API cases: [] → no sample cases
    expect(e.color).toBe(fb.color);
    expect(e.categoryAr).toBe(fb.categoryAr);
    expect(e.donationType).toBe(fb.donationType);
    const bare = mapApiEntity({ slug: "dhill" }, "campaign", fb);
    expect(bare.shares).toBe(fb.shares);
    expect(bare.image).toBe(fb.image);
    expect(bare.priceFrom).toBe(fb.priceFrom);
  });

  it("maps a program with packages (keeps static share id when the Arabic name matches)", () => {
    const fb = ENTITY_MAP.orphans;
    const e = mapApiEntity(API_PROGRAM_ORPHANS, "program", fb);
    expect(e.id).toBe("orphans");
    expect(e.categoryAr).toBe("التعليم");
    expect(e.priceFrom).toBe(150); // cheapest active package (the donate form shows "from")
    const same = mapApiPackage({ id: 1, name_ar: fb.shares[0].nameAr, amount: "999" }, fb.shares);
    expect(same.id).toBe(fb.shares[0].id);
    expect(same.price).toBe(999);
    expect(mapApiPackage({ id: 7, key: "custom-key", name_ar: "x", amount: 5 }).id).toBe("custom-key");
  });

  it("maps a project and its cases", () => {
    const e = mapApiProject(API_PROJECT_WATER_STATION);
    expect(e.entityType).toBe("project");
    expect(e.id).toBe("water-station-dakahlia-39280");
    expect(e.ar).toBe("محطة مياه الاسماعليه");
    expect(e.en).toBe("Clean Water Station");
    expect(e.taglineAr).toBe("محطة مياه");
    expect(e.priceFrom).toBe(100);
    expect(e.shares[0]).toMatchObject({ nameAr: "باقة المحطات", nameEn: "باقة المحطات", price: 80000 });
    expect(e.cases[0]).toEqual(mapApiCase(API_PROJECT_WATER_STATION.cases[0]));
    expect(e.cases[0]).toMatchObject({ refCode: "hjd0vvn350", neededAmount: 500000, raisedAmount: 0, governorate: "Dakahlia" });
  });

  it("returns the static array unchanged when the flag is static", () => {
    const raw = { programs: [API_PROGRAM_ORPHANS], projects: [], campaigns: [API_CAMPAIGN_ZELL] };
    expect(resolveDonationEntities(undefined)).toBe(DONATION_ENTITIES);
    expect(resolveDonationEntities(raw, "static")).toBe(DONATION_ENTITIES);
  });

  it("api mode: only active backend records, programs → projects → campaigns; static only when the API has nothing", () => {
    const raw = {
      programs: [API_PROGRAM_ORPHANS, API_PROGRAM_ZAKAT_INACTIVE],
      projects: [API_PROJECT_WATER_STATION],
      campaigns: [API_CAMPAIGN_ZELL],
    };
    const list = resolveDonationEntities(raw, "api");
    const backend = list.filter((e) => e.apiId);
    expect(backend.map((e) => [e.id, e.entityType])).toEqual([
      ["orphans", "program"],
      ["water-station-dakahlia-39280", "project"],
      ["dhill", "campaign"],
    ]);
    // the form is backend-only: every item has a backend id, and no id appears twice
    expect(list.every((e) => e.apiId)).toBe(true);
    expect(new Set(list.map((e) => e.id)).size).toBe(list.length);
    expect(list.find((e) => e.id === "dhill")!.ar).toBe("حملة ظل");
    expect(resolveDonationEntities({ programs: [], projects: [], campaigns: [] }, "api")).toBe(DONATION_ENTITIES);
  });

  it("keeps every type when slugs collide, and never takes the type from the static copy", () => {
    const list = resolveDonationEntities(
      {
        programs: [{ id: 43, slug: "general-donation", name_ar: "تبرع عام", is_active: true }, { id: 37, slug: "water", name_ar: "وصلة مياه", is_active: true }],
        projects: [{ id: 28, slug: "mosques", name: "عمارة المساجد", is_active: true }, { id: 29, slug: "water", name: "سقيا الماء", is_active: true }],
        campaigns: [],
      },
      "api",
    );
    expect(list[0].id).toBe("general"); // the form's default comes first
    expect(list.find((e) => e.id === "water")).toMatchObject({ entityType: "program", apiId: 37 });
    expect(list.find((e) => e.id === "project-water")).toMatchObject({ entityType: "project", apiId: 29 });
    // static "mosques" is a program; the backend record is a project and stays a project
    expect(list.find((e) => e.id === "mosques")).toMatchObject({ entityType: "project", apiId: 28 });
  });
});

describe("donation entities: seeder row shapes (backend-handoff/seeders/data)", () => {
  it("resolves ids through donation_entity_id / landing_slug / aliases and lifts `extra`", () => {
    expect(entityIdOf({ slug: "sitr", landing_slug: "setr", aliases: ["setr", "ster", "shelter"] })).toBe("shelter");
    expect(entityIdOf({ slug: "markoon", landing_slug: "markoun" })).toBe("markoun");
    expect(entityIdOf({ slug: "general-donation", aliases: ["general"] })).toBe("general");
    expect(entityIdOf({ slug: "odhya", extra: { donation_entity_id: "odhya" } })).toBe("odhya");
    expect(entityIdOf({ slug: "food", aliases: ["monthly-food"] })).toBe("food");
    const e = mapApiEntity(
      { slug: "general-donation", name_ar: "تبرع عام", extra: { color: "#123456", donation_type: "both", is_seasonal: true } },
      "program",
    );
    expect(e).toMatchObject({ id: "general", color: "#123456", donationType: "both", isSeasonal: true });
  });

  it("prefers the record whose resource matches the static entity type", () => {
    const list = resolveDonationEntities(
      {
        programs: [{ slug: "shelter", name_ar: "ستر (برنامج)", status: "published", is_active: true }],
        projects: [],
        campaigns: [{ slug: "sitr", aliases: ["shelter"], name_ar: "حملة ستر", is_active: true }],
      },
      "api",
    );
    const shelter = list.find((x) => x.id === "shelter")!;
    expect(shelter.ar).toBe("حملة ستر");
    expect(shelter.entityType).toBe("campaign");
    expect(list.find((x) => x.id === "program-shelter")!.entityType).toBe("program");
  });

  it("hidden_from_audience does not remove a donate-form entity (only inactive/unpublished do)", () => {
    const list = resolveDonationEntities(
      { programs: [{ slug: "general-donation", name_ar: "تبرع عام API", status: "published", is_active: true, hide_from_audience: true }], projects: [], campaigns: [] },
      "api",
    );
    expect(list.find((x) => x.id === "general")!.ar).toBe("تبرع عام API");
  });
});

describe("donate links and donation targets", () => {
  const entities = resolveDonationEntities(
    {
      programs: [{ id: 43, slug: "general-donation", name_ar: "تبرع عام", is_active: true },
        { id: 41, slug: "orphans", name_ar: "كفالة يتيم", is_active: true, donation_packages: [{ id: 5, name_ar: "كفالة شهر", amount: 500 }] }],
      projects: [{ id: 28, slug: "mosques", name: "عمارة المساجد", is_active: true, cases: [{ id: 37, code: "PRJ-1", title: "مسجد" }] },
        { id: 29, slug: "water", name: "سقيا الماء", is_active: true }],
      campaigns: [{ id: 17, slug: "zell", landing_slug: "dhill", name_ar: "حملة ظل", is_active: true }],
    },
    "api",
  );
  const byId = (id: string) => entities.find((e) => e.id === id);

  it("resolves ?entity= ids and ?program= / ?project= / ?campaign= slugs", () => {
    expect(findEntityForLink(entities, { entity: "mosques" })?.apiId).toBe(28);
    expect(findEntityForLink(entities, { project: "water" })?.apiId).toBe(29);
    expect(findEntityForLink(entities, { campaign: "zell" })?.id).toBe("dhill");
    expect(findEntityForLink(entities, { program: "orphans" })?.apiId).toBe(41);
    expect(findEntityForLink(entities, { program: "nothing-like-this" })).toBeUndefined();
  });

  it("targets the real record: project, program package, linked case, or the page case", () => {
    expect(targetOfItem({ entityId: "mosques", donationMode: "general", selectedShares: {} }, byId("mosques"))).toEqual({ kind: "project", id: 28 });
    expect(targetOfItem({ entityId: "orphans", donationMode: "shares", selectedShares: { "pkg-5": 2 } }, byId("orphans")))
      .toEqual({ kind: "program", id: 41, packageId: 5 });
    expect(targetOfItem({ entityId: "mosques", donationMode: "case", selectedShares: {}, selectedCaseId: "case-37" }, byId("mosques")))
      .toEqual({ kind: "case", id: 37 });
    expect(targetOfBasket([{ entityId: "mosques", donationMode: "general", selectedShares: {} }], byId, "12")).toEqual({ kind: "case", id: 12 });
  });

  it("a basket on different records has no single target (booked on the general program)", () => {
    const items = [
      { entityId: "mosques", donationMode: "general" as const, selectedShares: {} },
      { entityId: "orphans", donationMode: "general" as const, selectedShares: {} },
    ];
    expect(targetOfBasket(items, byId)).toBeNull();
    expect(targetOfBasket([items[0], { ...items[0] }], byId)).toEqual({ kind: "project", id: 28 });
  });
});
