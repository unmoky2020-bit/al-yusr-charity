import { describe, expect, it } from "vitest";
import { buildUserFromLaravel } from "./userBuilder";
import type { LaravelUser } from "@/data/laravelApi";

const u = (extra: Partial<LaravelUser>) => ({ id: 1, name: "x", email: "x@y.z", ...extra }) as LaravelUser;

describe("buildUserFromLaravel roles", () => {
  it("maps the backend's exact role names, including Super Admin", () => {
    expect(buildUserFromLaravel(u({ roles: ["Super Admin"] as never })).roles).toEqual(["admin"]);
    expect(buildUserFromLaravel(u({ roles: [{ name: "Super Admin", slug: "super-admin" }] as never })).roles).toEqual(["admin"]);
    expect(buildUserFromLaravel(u({ roles: ["Editor", "Volunteer"] as never })).roles).toEqual(["editor", "volunteer"]);
  });

  it("never infers a role from substrings or the e-mail address", () => {
    expect(buildUserFromLaravel(u({ email: "admin@alyusr.org" })).roles).toEqual(["donor"]);
    expect(buildUserFromLaravel(u({ roles: ["not-an-admin", "showcase"] as never })).roles).toEqual(["donor"]);
  });
});
