import { afterEach, describe, expect, it } from "vitest";
import { isSafeHref, parseSiteBlocks } from "./siteBlocks";
import { applyOrgInfo, googleReviewLink, ORG, whatsappLink } from "./orgInfo";

afterEach(() => applyOrgInfo(null));

describe("site blocks", () => {
  it("keeps only valid milestones and links", () => {
    const b = parseSiteBlocks({
      data: {
        about_milestones: [{ year: "2019", title_ar: "الإشهار" }, { year: "", title_ar: "x" }, "junk"],
        nav_links: {
          header: [{ label_ar: "من نحن", href: "/about" }, { label_ar: "شر", href: "javascript:alert(1)" }, { label_ar: "بره", href: "//evil.com" }],
          footer: [{ label_ar: "ظل", href: "/dhill", column: "campaigns" }, { label_ar: "x", href: "/x", column: "??" }],
        },
      },
    });
    expect(b.about_milestones).toEqual([{ year: "2019", title_ar: "الإشهار" }]);
    expect(b.nav_links?.header).toEqual([{ label_ar: "من نحن", href: "/about" }]);
    expect(b.nav_links?.footer?.map((l) => l.column)).toEqual(["campaigns", "quick"]);
  });

  it("returns nothing for an empty or missing answer", () => {
    expect(parseSiteBlocks({ data: {} })).toEqual({});
    expect(parseSiteBlocks(null)).toEqual({});
    expect(parseSiteBlocks({ data: { about_milestones: [], nav_links: { header: [] } } })).toEqual({});
  });

  it("accepts internal paths and https only", () => {
    expect(isSafeHref("/about#x")).toBe(true);
    expect(isSafeHref("https://facebook.com/x")).toBe(true);
    expect(isSafeHref("//evil.com")).toBe(false);
    expect(isSafeHref("http://x.org")).toBe(false);
    expect(isSafeHref("/a b")).toBe(false);
  });
});

describe("organisation data from the dashboard", () => {
  it("overrides only valid fields and falls back to the built-in copy", () => {
    const phone = ORG.phoneE164;
    applyOrgInfo({ email: "hello@elyusr.org", phone: "not a phone", facebook: "http://insecure", review_url: "https://g.page/r/abc/review", whatsapp: "+20 100 000 0000" });
    expect(ORG.email).toBe("hello@elyusr.org");
    expect(ORG.phoneE164).toBe(phone);
    expect(ORG.social.facebook).toContain("https://");
    expect(googleReviewLink()).toBe("https://g.page/r/abc/review");
    expect(whatsappLink("سلام")).toContain("wa.me/201000000000");
  });

  it("goes back to the built-in copy when the block is removed", () => {
    applyOrgInfo({ email: "hello@elyusr.org" });
    applyOrgInfo(null);
    expect(ORG.email).toBe("info@elyusr.org");
  });
});
