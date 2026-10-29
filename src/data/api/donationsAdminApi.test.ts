import { describe, expect, it } from "vitest";
import { filtersFromSearch, filtersToParams } from "./donationsAdminApi";
import { donationStatusLabel, formatMonth } from "@/lib/donationDisplay";

describe("donation filters ↔ query string", () => {
  it("keeps valid values and drops empty / invalid ones", () => {
    expect(
      filtersToParams({
        status: "paid,pending",
        channel: "gateway",
        target: "project",
        project_id: "28",
        from: "2026-10-01",
        to: "not-a-date",
        q: "  YSR-1 ",
        payment_method_id: "8,1",
        case_id: "abc",
      }),
    ).toEqual({ status: "paid,pending", channel: "gateway", target: "project", project_id: "28", from: "2026-10-01", q: "YSR-1", payment_method_id: "8,1" });
  });

  it("omits the default sort and unknown enum values", () => {
    expect(filtersToParams({ sort: "-created_at" })).toEqual({});
    expect(filtersToParams({ sort: "-amount" })).toEqual({ sort: "-amount" });
    expect(filtersToParams({ channel: "bank" as never, target: "donor" as never })).toEqual({});
  });

  it("reads filters back from the URL (round trip)", () => {
    const sp = new URLSearchParams("status=failed&program_id=35&page=3&foo=bar&from=2026-01-01");
    expect(filtersFromSearch(sp)).toEqual({ status: "failed", program_id: "35", from: "2026-01-01" });
  });
});

describe("donation status label", () => {
  it("separates unfinished online payments from manual ones awaiting confirmation", () => {
    expect(donationStatusLabel("pending", true, "ar")).toBe("لم يكتمل الدفع أونلاين");
    expect(donationStatusLabel("pending", false, "ar")).toBe("بانتظار تأكيدك");
    expect(donationStatusLabel("paid", true, "ar")).toBe("مدفوع");
    expect(donationStatusLabel("failed", false, "en")).toBe("Failed");
  });

  it("formats months from the stats API", () => {
    expect(formatMonth("2026-10", "en")).toBe("Oct 2026");
    expect(formatMonth("bad", "en")).toBe("bad");
  });
});
