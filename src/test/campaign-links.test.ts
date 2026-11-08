import { describe, expect, it } from "vitest";
import { amountHref } from "@/components/campaigns/shared";

describe("campaign donation links", () => {
  it("preserves the campaign and preselects the selected backend package", () => {
    const url = new URL(amountHref("/donate?campaign=food", 375, 23), "https://elyusr.org");
    expect(url.searchParams.get("campaign")).toBe("food");
    expect(url.searchParams.get("amount")).toBe("375");
    expect(url.searchParams.get("package")).toBe("23");
  });

  it("passes the selected package quantity when there are multiple shares", () => {
    const url = new URL(amountHref("/donate?program=orphans", 750, "pkg-5", 5), "https://elyusr.org");
    expect(url.searchParams.get("package")).toBe("pkg-5");
    expect(url.searchParams.get("qty")).toBe("5");
    expect(url.searchParams.get("amount")).toBe("750");
  });
});
