import { describe, expect, it } from "vitest";
import { buildUserFromSession } from "./authUtils";

describe("buildUserFromSession", () => {
  it("creates a fallback donor profile from the active session", () => {
    const session = {
      access_token: "token",
      user: {
        id: "user-1",
        email: "donor@example.com",
        created_at: "2024-01-01T00:00:00.000Z",
      },
    } as any;

    const user = buildUserFromSession(session);

    expect(user.id).toBe("user-1");
    expect(user.email).toBe("donor@example.com");
    expect(user.name).toBe("donor");
    expect(user.roles).toEqual(["donor"]);
  });

  it("uses the profile and roles when they are available", () => {
    const session = {
      access_token: "token",
      user: {
        id: "user-2",
        email: "admin@example.com",
        created_at: "2024-01-01T00:00:00.000Z",
      },
    } as any;

    const user = buildUserFromSession(session, {
      full_name: "Admin User",
      phone: "01000000000",
      city: "Cairo",
      bio: "Ops",
      avatar_url: "https://example.com/avatar.png",
      skills: ["shipping"],
      preferred_program: "food",
      total_donated: 100,
      donations_count: 2,
      created_at: "2024-01-01T00:00:00.000Z",
    } as any, [{ role: "admin" }] as any);

    expect(user.name).toBe("Admin User");
    expect(user.roles).toEqual(["admin"]);
    expect(user.phone).toBe("01000000000");
    expect(user.totalDonated).toBe(100);
  });
});
