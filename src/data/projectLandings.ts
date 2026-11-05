/**
 * Backend projects (dashboard → المشاريع, by slug) that have their own landing page on the site.
 * The /projects card links there, and /projects/:slug redirects there, so a project has one page only.
 */
export const PROJECT_LANDINGS: Record<string, string> = {
  waqf: "/farm",
  shelter: "/setr",
  water: "/water",
  medical: "/medical",
  takrim: "/takrim",
  nurseries: "/nurseries",
  mosques: "/mosques",
};
