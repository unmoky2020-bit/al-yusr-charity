import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ALL_GEO_PAIRS } from "./geoPages";
import { DAKAHLIA_CITIES } from "./dakahliaCities";
import { localPageRobots } from "./seoIndexable";

/** The NOINDEX_LOCAL pattern from public/seo.php, as a JS RegExp. */
function phpNoindex(): RegExp {
  const php = readFileSync(resolve(__dirname, "../../public/seo.php"), "utf8");
  const m = /const NOINDEX_LOCAL = '#(.+)#';/.exec(php);
  if (!m) throw new Error("NOINDEX_LOCAL not found in seo.php");
  return new RegExp(m[1]);
}

describe("local pages kept in search", () => {
  const paths = [
    ...ALL_GEO_PAIRS.map((g) => `/geo/${g.governorate}/${g.program}`),
    ...DAKAHLIA_CITIES.flatMap((c) => [`/qurbani/${c.slug}`, ...c.programs.map((p) => `/dakahlia/${c.slug}/${p}`)]),
  ];

  it("keeps Mansoura, drops the templated copies", () => {
    expect(localPageRobots("/qurbani/mansoura")).toBe("index");
    expect(localPageRobots("/dakahlia/mansoura/box")).toBe("index");
    expect(localPageRobots("/dakahlia/aga/box")).toBe("noindex");
    expect(localPageRobots("/geo/cairo/water")).toBe("noindex");
    expect(localPageRobots("/qurbani/confirm")).toBeNull();
    expect(localPageRobots("/qurbani")).toBeNull();
    expect(localPageRobots("/programs/water")).toBeNull();
  });

  it("seo.php gives crawlers the same answer for every local page", () => {
    const re = phpNoindex();
    for (const p of [...paths, "/qurbani/confirm", "/qurbani", "/programs/water"]) {
      expect(re.test(p), p).toBe(localPageRobots(p) === "noindex");
    }
  });
});

describe("seo.php knows every route of the app", () => {
  it("APP_ROOTS has the first segment of each <Route path>", () => {
    const php = readFileSync(resolve(__dirname, "../../public/seo.php"), "utf8");
    const roots = new Set((/const APP_ROOTS = '([^']+)';/.exec(php)?.[1] ?? "").split("|"));
    const app = readFileSync(resolve(__dirname, "../App.tsx"), "utf8");
    const used = [...app.matchAll(/path="\/([^"/:*]+)/g)].map((m) => m[1]);
    expect(used.length).toBeGreaterThan(40);
    for (const seg of used) expect(roots.has(seg), seg).toBe(true);
  });
});
