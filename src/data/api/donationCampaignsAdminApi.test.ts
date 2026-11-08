import { describe, expect, it } from "vitest";
import { findIgnoredCampaignFields, imagePathKey } from "./donationCampaignsAdminApi";

describe("campaign save check", () => {
  it("compares image links by storage path", () => {
    expect(imagePathKey("https://api.elyusr.org/storage/media/campaigns/a.png?v=2")).toBe("media/campaigns/a.png");
    expect(imagePathKey("/storage/media/campaigns/a.png")).toBe("media/campaigns/a.png");
    expect(imagePathKey("media/campaigns/a.png")).toBe("media/campaigns/a.png");
  });

  it("flags a media-library link the server ignored (the old picture came back)", () => {
    const sent = { image: "https://api.elyusr.org/storage/media/campaigns/new.png" };
    expect(findIgnoredCampaignFields(sent, { image: "https://api.elyusr.org/storage/donation-campaigns/old.webp" })).toContain("image");
    expect(findIgnoredCampaignFields(sent, { image: "/storage/media/campaigns/new.png" })).not.toContain("image");
  });
});
