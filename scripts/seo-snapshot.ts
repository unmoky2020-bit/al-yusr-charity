/**
 * Fills public/seo-static.json (and dist/seo-static.json) from the built site itself: every fixed
 * page in the sitemap is opened in a headless browser, in Arabic and in English, and its title,
 * description, h1, first paragraphs and section headings are saved. seo.php serves them to
 * crawlers that do not run JavaScript (Semrush, Bing, social and AI bots), so each page has its
 * own title and readable text, never the homepage's.
 *
 *   npm run build && npx tsx scripts/seo-snapshot.ts
 *
 * Pages from the API (/cases/x, /programs/x, /blog/x…) are left to seo.php's API lookup, and the
 * local pages kept out of search (src/data/seoIndexable.ts) are skipped.
 */
import { spawn } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { localPageRobots } from "../src/data/seoIndexable";

// Playwright is a tool of the build machine, not a dependency of the site: without it the
// committed seo-static.json is kept as it is.
type Browser = {
  newContext: (o: object) => Promise<{
    route: (url: RegExp, handler: (r: { abort: () => Promise<void> }) => unknown) => Promise<void>;
    newPage: () => Promise<{
      goto: (url: string, o: object) => Promise<unknown>;
      waitForFunction: (script: string, arg: null, o: object) => Promise<unknown>;
      waitForTimeout: (ms: number) => Promise<void>;
      evaluate: <T>(script: string) => Promise<T>;
    }>;
  }>;
  close: () => Promise<void>;
};
let chromium: { launch: () => Promise<Browser> };
try {
  chromium = createRequire(import.meta.url)("playwright").chromium;
} catch {
  console.warn("[seo-snapshot] Playwright not installed here — seo-static.json kept as it is.");
  process.exit(0);
}

const PORT = 4391;
const ORIGIN = `http://127.0.0.1:${PORT}`;
const DYNAMIC = /^\/(cases|programs|axes|stories|blog)\/[^/]+$/;
const SKIP = new Set(["/donate/track"]);

type Snapshot = { title: string; description: string; h1?: string; summary?: string; sections?: string[] };
type Entry = Partial<Record<"ar" | "en", Snapshot>>;

const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, "dist");
if (!existsSync(resolve(dist, "index.html"))) throw new Error("Build first: npm run build");

const locs = [...readFileSync(resolve(dist, "sitemap-base.xml"), "utf8").matchAll(/<loc>https?:\/\/[^/<]+(\/[^<]*)<\/loc>/g)].map((m) => m[1] || "/");
const paths = [...new Set(["/", ...locs])].filter((p) => !DYNAMIC.test(p) && !SKIP.has(p) && localPageRobots(p) !== "noindex");

const server = spawn("npx", ["vite", "preview", "--host", "127.0.0.1", "--port", String(PORT), "--strictPort"], { cwd: root, stdio: "ignore" });
const stop = () => server.kill("SIGTERM");
process.on("exit", stop);

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(ORIGIN)).ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("vite preview did not start");
}

const clean = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();

type Extracted = { title: string; description: string; robots: string; h1: string; summary: string; sections: string[] };
const EXTRACT = `(() => {
  const text = (el) => ((el && (el.innerText || el.textContent)) || "").replace(/\\s+/g, " ").trim();
  const scope = document.querySelector("main") || document.body;
  const paras = [...scope.querySelectorAll("p")].map(text).filter((t) => t.length >= 40);
  const sections = [...new Set([...scope.querySelectorAll("h2")].map(text).filter((t) => t.length >= 3 && t.length <= 90))];
  const meta = (sel) => (document.querySelector(sel) && document.querySelector(sel).getAttribute("content")) || "";
  return {
    title: document.title,
    description: meta('meta[name="description"]'),
    robots: meta('meta[name="robots"]'),
    h1: text(document.querySelector("h1")),
    summary: paras.slice(0, 3).join(" ").slice(0, 700),
    sections: sections.slice(0, 10),
  };
})()`;

(async () => {
  await waitForServer();
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  // The API is not needed for the fixed pages' own text; skip it so a page never waits on it.
  await context.route(/api\.elyusr\.org|googletagmanager|clarity\.ms|facebook\.net|gold-api|er-api/, (r) => r.abort());
  const page = await context.newPage();
  const out: Record<string, Entry> = JSON.parse(readFileSync(resolve(root, "public/seo-static.json"), "utf8"));
  let ok = 0;

  for (const path of paths) {
    for (const lang of ["ar", "en"] as const) {
      try {
        await page.goto(`${ORIGIN}${path}${lang === "en" ? "?lang=en" : ""}`, { waitUntil: "domcontentloaded", timeout: 20_000 });
        await page.waitForFunction('!document.getElementById("boot-splash") && !!document.querySelector("h1")', null, { timeout: 15_000 });
        await page.waitForTimeout(300); // react-helmet commits the head right after the page
        // A plain string: tsx would add helpers (__name) to a function that the page doesn't have.
        const snap = await page.evaluate<Extracted>(EXTRACT);
        if (/noindex/.test(snap.robots) || !snap.title) continue;
        out[path] = {
          ...out[path],
          [lang]: {
            title: clean(snap.title),
            description: clean(snap.description),
            h1: clean(snap.h1) || undefined,
            summary: clean(snap.summary) || undefined,
            sections: snap.sections.length ? snap.sections : undefined,
          },
        };
        ok++;
      } catch (e) {
        console.warn(`[seo-snapshot] ${path} (${lang}): ${(e as Error).message.split("\n")[0]}`);
      }
    }
  }

  await browser.close();
  const sorted = Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)));
  const json = JSON.stringify(sorted, null, 1) + "\n";
  writeFileSync(resolve(root, "public/seo-static.json"), json);
  writeFileSync(resolve(dist, "seo-static.json"), json);
  console.log(`seo-static.json: ${ok} snapshots from ${paths.length} pages`);
  stop();
  process.exit(0);
})().catch((e) => {
  console.error(e);
  stop();
  process.exit(1);
});
