/**
 * Which dashboard pages an account may open, from the permissions of its roles on the server
 * (GET /me/access). The server still checks every request; this decides the menu and shows a
 * clear "not in your permissions" page instead of a screen full of 403 errors.
 */
export type AdminAccess = { permissions: readonly string[]; superAdmin: boolean };

/** Pages every signed-in team member has. */
const ALWAYS: readonly string[] = ["/admin", "/admin/profile", "/admin/notifications"];

/** A page opens when the account has at least one of its permissions. */
export const PAGE_PERMISSIONS: Readonly<Record<string, readonly string[]>> = {
  "/admin/analytics": ["reports.view"],
  "/admin/reports": ["reports.view"],
  "/admin/donations": ["donations.view"],
  "/admin/distributions": ["donations.view"],
  "/admin/payment-methods": ["payment_methods.view"],
  "/admin/cases": ["cases.view", "cases.create", "cases.update"],
  "/admin/projects": ["projects.create", "projects.update"],
  "/admin/programs": ["programs.create", "programs.update"],
  "/admin/donation-campaigns": ["donation_campaigns.create", "donation_campaigns.update"],
  "/admin/campaigns": ["volunteer_campaigns.view", "volunteer_campaigns.update"],
  "/admin/seasons": ["seasons.create", "seasons.update"],
  "/admin/homepage-content": ["homepage.update"],
  "/admin/campaigns-section": ["homepage.update"],
  "/admin/about-us": ["about_us.update"],
  "/admin/axes": ["axes.update"],
  "/admin/site-stats": ["home_numbers.update", "achievements.update"],
  "/admin/stories": ["stories.create", "stories.update"],
  // Browsing the whole library is its own permission: "media.upload" alone only uploads
  // (the image pickers of the other pages), it doesn't open the library.
  "/admin/media": ["media.view"],
  "/admin/gallery": ["gallery.update"],
  "/admin/page-galleries": ["gallery.update"],
  "/admin/content": ["content.create", "content.update"],
  "/admin/blog": ["blog_seo.create", "blog_seo.update", "blog_seo.view"],
  "/admin/faqs": ["faqs.update", "faq_categories.update"],
  "/admin/inbox": ["contact_messages.view"],
  "/admin/newsletter": ["newsletter.view"],
  "/admin/review": ["content_change_requests.view"],
  "/admin/volunteers": ["volunteers.view"],
  "/admin/donors": ["donors.view"],
  "/admin/users": ["users.view"],
};

/**
 * Whether the account's roles give `perm`: true / false, or undefined while GET /me/access loads
 * or when the server can't tell (older backend). The server still checks every request.
 */
export function accessAllows(access: AdminAccess | null | undefined, perm: string): boolean | undefined {
  if (!access) return undefined;
  return access.superAdmin || access.permissions.includes(perm);
}

/** Every page the account may open; "all" for the super admin. */
export function allowedAdminPaths(access: AdminAccess): "all" | Set<string> {
  if (access.superAdmin) return "all";
  const has = new Set(access.permissions);
  const out = new Set(ALWAYS);
  for (const [path, perms] of Object.entries(PAGE_PERMISSIONS)) {
    if (perms.some((p) => has.has(p))) out.add(path);
  }
  return out;
}

/** "/admin/blog/new" opens with "/admin/blog"; "/admin" itself only matches exactly. */
export function canOpenAdminPath(pathname: string, allowed: "all" | ReadonlySet<string>): boolean {
  if (allowed === "all") return true;
  const path = pathname.replace(/\/+$/, "") || "/";
  for (const p of allowed) {
    if (path === p || (p !== "/admin" && path.startsWith(`${p}/`))) return true;
  }
  return false;
}
