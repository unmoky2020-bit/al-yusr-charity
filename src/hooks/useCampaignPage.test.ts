import { describe, expect, it } from "vitest";
import { findCampaignPackage, type CampaignDonationPackage } from "./useCampaignPage";
import { l } from "@/data/campaignPages/types";

describe("findCampaignPackage", () => {
  it("resolves all Ramadan prices to their active backend package IDs", () => {
    const packages: CampaignDonationPackage[] = [
      { id: 60, name_ar: "زكاة الفطر عن فرد", amount: 40, sort_order: 1 },
      { id: 61, name_ar: "وجبة إفطار صائم ساخنة", amount: 75, sort_order: 2 },
      { id: 62, name_ar: "كرتونة الخير 25 كجم مع لحم بلدي", amount: 550, sort_order: 3 },
      { id: 63, name_ar: "سهم لحوم وذبائح مزارع الوقف", amount: 350, sort_order: 4 },
      { id: 64, name_ar: "كسوة وكعك العيد لطفل يتيم", amount: 400, sort_order: 5 },
      { id: 65, name_ar: "سهم تيسير زواج عروس يتيمة", amount: 1000, sort_order: 6 },
      { id: 85, name_ar: "سهم لحوم الذبائح الشهرية", amount: 350, sort_order: 7 },
    ];
    const prices = [
      { id: "iftar", label: l("وجبة إفطار صائم ساخنة", "Hot iftar meal"), backendPackageNames: ["وجبة إفطار صائم ساخنة"] },
      { id: "fitr", label: l("زكاة الفطر عن فرد", "Zakat al-Fitr per person"), backendPackageNames: ["زكاة الفطر عن فرد"] },
      { id: "box", label: l("كرتونة رمضان الكبرى (25 كجم)", "Ramadan box (25 kg)"), backendPackageNames: ["كرتونة الخير 25 كجم مع لحم بلدي"] },
      { id: "meat", label: l("سهم لحوم بلدي (1 كجم)", "Farm meat share (1 kg)"), backendPackageNames: ["سهم لحوم وذبائح مزارع الوقف"] },
      { id: "eid_clothes", label: l("كسوة عيد لطفل يتيم وعلبة كعك", "Orphan Eid outfit + cookies"), backendPackageNames: ["كسوة وكعك العيد لطفل يتيم"] },
      { id: "bride", label: l("سهم تيسير زواج عروسة يتيمة", "Orphan bride share"), backendPackageNames: ["سهم تيسير زواج عروس يتيمة"] },
      { id: "meat_monthly", label: l("سهم لحوم الذبائح الشهرية", "Monthly sacrificial meat share"), backendPackageNames: ["سهم لحوم الذبائح الشهرية"] },
    ];

    expect(prices.map((price) => findCampaignPackage(packages, price)?.id)).toEqual([61, 60, 62, 63, 64, 65, 85]);
  });

  it("does not resolve inactive packages", () => {
    const packages: CampaignDonationPackage[] = [
      { id: 99, name_ar: "باقة", amount: 100, is_active: false },
    ];
    expect(findCampaignPackage(packages, { id: "share", label: l("باقة", "Package") })).toBeUndefined();
  });
});
