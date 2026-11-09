import { describe, expect, it } from "vitest";
import { accessAllows, allowedAdminPaths, canOpenAdminPath } from "./adminAccess";

describe("admin access from role permissions", () => {
  const blogOnly = allowedAdminPaths({
    superAdmin: false,
    permissions: ["blog_seo.view", "blog_seo.create", "blog_seo.update", "blog_seo.delete", "media.view", "media.upload"],
  });

  it("a blog-only editor gets the blog, the media library and the common pages", () => {
    expect(blogOnly).not.toBe("all");
    expect([...(blogOnly as Set<string>)].sort()).toEqual(["/admin", "/admin/blog", "/admin/media", "/admin/notifications", "/admin/profile"]);
  });

  it("sub-pages open with their section, other sections stay closed", () => {
    expect(canOpenAdminPath("/admin/blog/new", blogOnly)).toBe(true);
    expect(canOpenAdminPath("/admin/blog/zakat-fitr-2026", blogOnly)).toBe(true);
    expect(canOpenAdminPath("/admin/", blogOnly)).toBe(true);
    expect(canOpenAdminPath("/admin/cases", blogOnly)).toBe(false);
    expect(canOpenAdminPath("/admin/programs/41", blogOnly)).toBe(false);
    expect(canOpenAdminPath("/admin/blogger", blogOnly)).toBe(false);
  });

  it("the case-editor add-on role opens cases", () => {
    const withCases = allowedAdminPaths({ superAdmin: false, permissions: ["blog_seo.update", "cases.create", "cases.update"] });
    expect(canOpenAdminPath("/admin/cases", withCases)).toBe(true);
    expect(canOpenAdminPath("/admin/cases/12", withCases)).toBe(true);
    expect(canOpenAdminPath("/admin/donations", withCases)).toBe(false);
  });

  it("uploading alone doesn't open the media library (browsing needs media.view)", () => {
    const uploadOnly = allowedAdminPaths({ superAdmin: false, permissions: ["blog_seo.update", "media.upload"] });
    expect(canOpenAdminPath("/admin/media", uploadOnly)).toBe(false);
    expect(canOpenAdminPath("/admin/blog", uploadOnly)).toBe(true);
  });

  it("accessAllows: yes / no from the roles, unknown while loading", () => {
    const editor = { superAdmin: false, permissions: ["media.upload"] };
    expect(accessAllows(editor, "media.upload")).toBe(true);
    expect(accessAllows(editor, "media.view")).toBe(false);
    expect(accessAllows({ superAdmin: true, permissions: [] }, "media.delete")).toBe(true);
    expect(accessAllows(undefined, "media.view")).toBeUndefined();
    expect(accessAllows(null, "media.view")).toBeUndefined();
  });

  it("the super admin opens everything", () => {
    const all = allowedAdminPaths({ superAdmin: true, permissions: [] });
    expect(all).toBe("all");
    expect(canOpenAdminPath("/admin/users/5", all)).toBe(true);
  });
});
