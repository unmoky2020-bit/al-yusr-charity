/**
 * Programs (dashboard → البرامج) that have their own campaign/landing page. Program cards link to the
 * landing page when there is one, otherwise to the generic /programs/:slug page (which still exists
 * for every program, so old links and the sitemap keep working).
 */
export const PROGRAM_LANDINGS: Record<string, string> = {
  odhya: "/qurbani",
  water: "/water",
  box: "/food-box",
  "monthly-meat": "/food-box",
  "food-box": "/food-box",
  kitchen: "/food-box",
  education: "/athar",
  shelter: "/setr",
  markoun: "/markoun",
  arboun: "/arboun",
  khabia: "/khabia",
  zakat: "/zakat",
  quran: "/nurseries",
  takrim: "/takrim",
  treatment: "/medical#prescriptions",
  prosthetics: "/medical#disability",
  "medical-convoys": "/medical#convoys",
};

/** Where a program card's "details" link goes. */
export const programHref = (slug: string): string => PROGRAM_LANDINGS[slug] ?? `/programs/${slug}`;
