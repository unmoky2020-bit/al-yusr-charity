/**
 * Which programmatic local pages stay in search.
 *
 * The /geo/:governorate/:program, /dakahlia/:city/:program and /qurbani/:city pages repeat the
 * same text with another place name. Google reads such sets as doorway pages and lowers the whole
 * site (Search Console showed 141 pages "discovered – not indexed", most of them these). So only
 * the foundation's home city keeps its local pages in search; every other one stays reachable for
 * visitors but carries noindex,follow and is left out of the sitemap. Give a city its own real
 * content (projects, photos, numbers from the dashboard) before adding it here.
 *
 * seo.php applies the same rule for crawlers that do not run JavaScript (NOINDEX_LOCAL there);
 * src/data/seoIndexable.test.ts keeps the two in step.
 */
export const INDEXED_GEO_GOVERNORATES: readonly string[] = [];
export const INDEXED_DAKAHLIA_CITIES: readonly string[] = ["mansoura"];

export const isIndexedGeo = (governorate: string): boolean => INDEXED_GEO_GOVERNORATES.includes(governorate);
export const isIndexedCity = (city: string): boolean => INDEXED_DAKAHLIA_CITIES.includes(city);

/** Robots value for a local page path, or null when the path is not one of them. */
export function localPageRobots(path: string): "index" | "noindex" | null {
  const geo = /^\/geo\/([^/]+)\/[^/]+$/.exec(path);
  if (geo) return isIndexedGeo(geo[1]) ? "index" : "noindex";
  const city = /^\/dakahlia\/([^/]+)\/[^/]+$/.exec(path) ?? /^\/qurbani\/([^/]+)$/.exec(path);
  if (city && city[1] !== "confirm") return isIndexedCity(city[1]) ? "index" : "noindex";
  return null;
}
