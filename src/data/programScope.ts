/**
 * What the /programs page lists. Programs come from the backend (GET /programs); anything that is
 * really a campaign (/arboun, /setr, /markoun…) or a project (/water, /farm, /medical…) has its own
 * page and must not be repeated as a «program» card, even if a stale record or the offline copy has it.
 */
export const NOT_A_PROGRAM_SLUGS = new Set<string>([
  // donation campaigns (slug and landing slug)
  "arboun", "arboun-kheir", "markoun", "markoon", "setr", "sitr", "dhill", "zell", "athar", "ramadan", "food", "ten-days", "ashr",
  // projects
  "shelter", "water", "waqf", "farm", "medical", "mosques", "takrim", "nurseries",
]);

export const isListedProgram = (slug: string) => !!slug && !NOT_A_PROGRAM_SLUGS.has(slug);
