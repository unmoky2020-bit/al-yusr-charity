import { describe, expect, it } from "vitest";
import { announceHeldWrite, heldWritesCount, isHeldForApproval } from "./approval";

describe("writes held for an admin's approval", () => {
  it("202 Accepted is a held write", () => {
    expect(isHeldForApproval(202, null)).toBe(true);
  });

  it("a pending change request in the body is a held write", () => {
    const cr = { id: 9, module: "blog_seo", action: "create", method: "POST", route_uri: "api/v1/blog-seo", status: "pending" };
    expect(isHeldForApproval(200, { message: "sent", data: cr })).toBe(true);
    expect(isHeldForApproval(201, { request: cr })).toBe(true);
    expect(isHeldForApproval(200, cr)).toBe(true);
  });

  it("normal saves and reviewed requests are not", () => {
    expect(isHeldForApproval(200, { data: { id: 3, slug: "zakat" } })).toBe(false);
    expect(isHeldForApproval(201, { id: 3 })).toBe(false);
    expect(isHeldForApproval(200, { request: { route_uri: "api/v1/blog-seo", status: "approved" } })).toBe(false);
    expect(isHeldForApproval(200, [{ route_uri: "x", status: "pending" }])).toBe(false);
  });

  it("counts held writes", () => {
    const before = heldWritesCount();
    announceHeldWrite({});
    expect(heldWritesCount()).toBe(before + 1);
  });
});
