/**
 * Generates public/sitemap.xml from a static base + every active
 * `donation_nodes` row (programs + their option children) so each
 * /programs/:slug and /programs/:slug/:option page is indexable with
 * proper hreflang pairs (ar-EG ↔ /en mirror).
 *
 * Runs on `predev` and `prebuild` so dev preview and prod publish stay
 * in sync with the database.
 */
import { writeFileSync, readFileSync } from "fs";
import { resolve } from "path";
import { ALL_GEO_PAIRS } from "../src/data/geoPages";
import { DAKAHLIA_CITIES } from "../src/data/dakahliaCities";

const BASE_URL = "https://elyusr.org";
// Laravel API (Supabase is no longer used). Public endpoints only, no token.
const BACKEND = process.env.VITE_BACKEND_URL || "https://api.elyusr.org";

/** GET a public Laravel list endpoint; returns [] on any failure (the sitemap must never break dev/build). */
async function laravelList(path: string): Promise<any[]> {
  try {
    // Follow Laravel pagination (meta.last_page / last_page): blog-seo pages 20 rows at a time.
    const out: any[] = [];
    for (let page = 1; page <= 50; page++) {
      const sep = path.includes("?") ? "&" : "?";
      const res = await fetch(`${BACKEND}/api/v1${path}${sep}per_page=100&page=${page}`, { headers: { Accept: "application/json" } });
      if (!res.ok) break;
      const json: any = await res.json();
      const list = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : Array.isArray(json?.data?.data) ? json.data.data : [];
      out.push(...list);
      const last = Number(json?.meta?.last_page ?? json?.last_page ?? json?.data?.last_page ?? 1);
      if (Array.isArray(json) || page >= last || !list.length) break;
    }
    return out;
  } catch (e) {
    console.warn(`[sitemap] could not fetch ${path} from Laravel:`, (e as Error).message);
    return [];
  }
}

type Entry = { path: string; lastmod?: string; changefreq?: string; priority?: string; noindex?: boolean };

const today = new Date().toISOString().slice(0, 10);

const staticEntries: Entry[] = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/qurbani", changefreq: "daily", priority: "0.95" },
  { path: "/donate", changefreq: "weekly", priority: "0.9" },
  { path: "/programs", changefreq: "weekly", priority: "0.85" },
  { path: "/zakat", changefreq: "weekly", priority: "0.85" },
  { path: "/blog", changefreq: "weekly", priority: "0.6" },
  { path: "/about", changefreq: "monthly", priority: "0.7" },
  { path: "/contact", changefreq: "monthly", priority: "0.7" },
  { path: "/stories", changefreq: "weekly", priority: "0.7" },
  { path: "/projects", changefreq: "weekly", priority: "0.85" },
  { path: "/cases", changefreq: "daily", priority: "0.9" },
  { path: "/gallery", changefreq: "weekly", priority: "0.6" },
  { path: "/services-map", changefreq: "weekly", priority: "0.7" },
  // Campaign hub + the six named campaign landings (canonical slugs only —
  // /education-campaign → /athar, /freelancers → /arboun, /campaign → /campaigns).
  { path: "/campaigns", changefreq: "weekly", priority: "0.85" },
  { path: "/dhill", changefreq: "weekly", priority: "0.8" },
  { path: "/setr", changefreq: "weekly", priority: "0.8" },
  { path: "/athar", changefreq: "weekly", priority: "0.8" },
  { path: "/ramadan", changefreq: "weekly", priority: "0.8" },
  { path: "/markoun", changefreq: "weekly", priority: "0.8" },
  { path: "/arboun", changefreq: "weekly", priority: "0.8" },
  // Product-style landings
  { path: "/food-box", changefreq: "weekly", priority: "0.8" },
  { path: "/khabia", changefreq: "weekly", priority: "0.8" },
  { path: "/qurbani-guarantee", changefreq: "weekly", priority: "0.8" },
  { path: "/farm", changefreq: "monthly", priority: "0.7" },
  // Project landings (linked from /projects)
  { path: "/takrim", changefreq: "monthly", priority: "0.8" },
  { path: "/water", changefreq: "monthly", priority: "0.8" },
  { path: "/nurseries", changefreq: "monthly", priority: "0.8" },
  { path: "/medical", changefreq: "monthly", priority: "0.8" },
  { path: "/ten-days", changefreq: "weekly", priority: "0.8" },
  { path: "/misbaha", changefreq: "monthly", priority: "0.7" },
  // Trust / help / participation
  { path: "/trust", changefreq: "monthly", priority: "0.7" },
  { path: "/faqs", changefreq: "monthly", priority: "0.7" },
  { path: "/volunteer", changefreq: "monthly", priority: "0.6" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
];

// Static service pages rendered by /services/:slug (src/data/servicePagesConfig.ts).
// Each self-canonicalizes to /services/<slug> via ServicePage → SEOHelmet.
// /services/daily-feeding is a redirect to /services-map and is intentionally omitted.
const SERVICE_SLUGS = [
  "mosques", "wells", "farm", "housing", "ster", "markoun",
  "treatment", "orphans", "marriage", "food-box",
];
const serviceEntries: Entry[] = SERVICE_SLUGS.map((slug) => ({
  path: `/services/${slug}`,
  changefreq: "weekly",
  priority: "0.75",
}));

function escapeXml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function urlEntry(e: Entry): string {
  const loc = `${BASE_URL}${e.path}`;
  const altAr = `${BASE_URL}${e.path}`;
  const altEn = `${altAr}${altAr.includes("?") ? "&" : "?"}lang=en`;
  return [
    "  <url>",
    `    <loc>${escapeXml(loc)}</loc>`,
    `    <lastmod>${e.lastmod || today}</lastmod>`,
    e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : "",
    e.priority ? `    <priority>${e.priority}</priority>` : "",
    `    <xhtml:link rel="alternate" hreflang="ar-EG" href="${escapeXml(altAr)}" />`,
    `    <xhtml:link rel="alternate" hreflang="en" href="${escapeXml(altEn)}" />`,
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(altAr)}" />`,
    "  </url>",
  ].filter(Boolean).join("\n");
}


async function fetchBlogPosts(): Promise<Entry[]> {
  const map = new Map<string, Entry>();

  // 1. Extract all 52 static blog posts from src/data/blog.ts
  try {
    const blogFile = readFileSync(resolve("src/data/blog.ts"), "utf8");
    const slugRegex = /slug:\s*["']([^"']+)["']/g;
    const dateRegex = /date:\s*["']([^"']+)["']/g;
    const slugs: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = slugRegex.exec(blogFile)) !== null) {
      slugs.push(match[1]);
    }
    const dates: string[] = [];
    while ((match = dateRegex.exec(blogFile)) !== null) {
      dates.push(match[1]);
    }
    slugs.forEach((slug, idx) => {
      const date = dates[idx] || today;
      map.set(slug, {
        path: `/blog/${slug}`,
        lastmod: date,
        changefreq: "weekly",
        priority: "0.75",
      });
    });
  } catch (e) {
    console.warn("[sitemap] could not parse static blog posts:", (e as Error).message);
  }

  // 2. Published articles from Laravel (/content?type=article and /blog-seo)
  const articles = [...(await laravelList("/content?type=article")), ...(await laravelList("/blog-seo"))];
  articles.forEach((a: any) => {
    const published = a.status === "published" || a.workflow_status === "published" || (!a.status && !a.workflow_status);
    if (a.slug && published) {
      map.set(a.slug, {
        path: `/blog/${a.slug}`,
        lastmod: (a.updated_at || a.created_at || "").slice(0, 10) || today,
        changefreq: "weekly",
        priority: "0.75",
      });
    }
  });

  return Array.from(map.values());
}

async function fetchStories(): Promise<Entry[]> {
  const map = new Map<string, Entry>();

  // Published stories from Laravel /stories
  (await laravelList("/stories")).forEach((s: any) => {
    if (s.slug && (s.status === "published" || s.is_published === true)) {
      map.set(s.slug, {
        path: `/stories/${s.slug}`,
        lastmod: (s.updated_at || s.created_at || "").slice(0, 10) || today,
        changefreq: "monthly",
        priority: "0.6",
      });
    }
  });

  return Array.from(map.values());
}

async function fetchCases(): Promise<Entry[]> {
  // Approved/active cases only (never pending_review), from Laravel /cases.
  const PUBLIC_STATUSES = ["active", "approved", "open", "funded", "completed"];
  // Real case codes look like CASE-4224; test rows ("12346", "The code field is required.") are skipped.
  const REAL_CODE = /^[A-Z]{2,8}-[A-Z0-9]{3,}$/i;
  return (await laravelList("/cases"))
    .filter((c: any) => REAL_CODE.test(String(c.ref_code || c.code || "")) && PUBLIC_STATUSES.includes(String(c.status || "").toLowerCase()))
    .map((c: any) => ({
      path: `/cases/${encodeURIComponent(String(c.ref_code || c.code))}`,
      lastmod: (c.updated_at || "").slice(0, 10) || today,
      changefreq: "weekly",
      priority: "0.75",
    }));
}

// Program pages (/programs/:slug) — the site's main donation pages. Listed inline (importing
// src/data/programs.ts pulls Vite image imports); the live /programs list adds any new published ones.
// Used only when the API is unreachable at build time (offline build).
const STATIC_PROGRAM_SLUGS = [
  "odhya", "zakat", "orphans", "box", "water", "bride", "education",
  "treatment", "shelter", "markoun", "kitchen", "prosthetics", "arboun",
];

async function fetchPrograms(): Promise<Entry[]> {
  const live = (await laravelList("/programs")).filter(
    (p: any) => p && p.status === "published" && p.is_active !== false && !p.hide_from_audience && /^[a-z0-9-]+$/.test(String(p.slug || "")),
  );
  const lastmodOf = new Map<string, string>(live.map((p: any) => [p.slug, String(p.updated_at || "").slice(0, 10)]));
  // Published backend programs only: an inactive program's page is "unavailable" (noindex), so it must
  // not be in the sitemap. The static list is a fallback for an offline build.
  const slugs = new Set<string>(live.length ? live.map((p: any) => String(p.slug)) : STATIC_PROGRAM_SLUGS);
  return [...slugs].map((slug) => ({
    path: `/programs/${slug}`,
    lastmod: lastmodOf.get(slug) || today,
    changefreq: "weekly",
    priority: "0.9",
  }));
}

// Static seed blog slugs that live in src/data/blog.ts (not in DB).
// Listed inline to avoid importing the blog module (which pulls Vite asset aliases).
const STATIC_BLOG_SLUGS: { slug: string; date: string }[] = [
  { slug: "dalil-sak-odhya-dakahlia-2026-13-yom", date: "2026-05-14" },
  { slug: "odhya-2026-mansoura", date: "2026-04-10" },
  { slug: "zakat-mal-2026-calculator", date: "2026-01-05" },
];

(async () => {
  const [blog, stories, cases, programPages] = await Promise.all([
    fetchBlogPosts(), fetchStories(), fetchCases(), fetchPrograms(),
  ]);
  const blogSlugs = new Set(blog.map((b) => b.path));
  const staticBlog: Entry[] = STATIC_BLOG_SLUGS
    .map((p) => ({ path: `/blog/${p.slug}`, lastmod: p.date, changefreq: "weekly" as const, priority: "0.7" }))
    .filter((b) => !blogSlugs.has(b.path));
  // Markoun pickup only covers Dakahlia: other governorates' markoun pages stay out of the sitemap.
  const geo: Entry[] = ALL_GEO_PAIRS.filter(({ governorate, program }) => program !== "markoun" || governorate === "dakahlia").map(({ governorate, program }) => ({
    path: `/geo/${governorate}/${program}`,
    lastmod: today,
    changefreq: "weekly",
    priority: "0.8",
  }));
  // Dakahlia city Qurbani pages — high-intent local SEO targets.
  const cities: Entry[] = DAKAHLIA_CITIES.map((c) => ({
    path: `/qurbani/${c.slug}`,
    lastmod: today,
    changefreq: "weekly",
    priority: "0.9",
  }));
  // Local-intent /donate/:city landing pages (currently MVP: Mansoura only).
  const donateCities: Entry[] = [
    { path: "/donate/mansoura", lastmod: today, changefreq: "weekly", priority: "0.9" },
  ];
  // City × program landings — /dakahlia/:city/:program
  const cityPrograms: Entry[] = DAKAHLIA_CITIES.flatMap((c) =>
    (c.programs || []).map((p) => ({
      path: `/dakahlia/${c.slug}/${p}`,
      lastmod: today,
      changefreq: "weekly" as const,
      priority: "0.8",
    })),
  );
  const dyn = [...programPages, ...blog, ...staticBlog, ...stories, ...cases, ...geo, ...cities, ...donateCities, ...cityPrograms];
  const all = [...staticEntries, ...serviceEntries, ...dyn];
  const xml = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">`,
    ...all.map(urlEntry),
    `</urlset>`,
  ].join("\n");
  writeFileSync(resolve("public/sitemap.xml"), xml);
  // The live sitemap (public/sitemap.php, served at /sitemap.xml) starts from this copy and adds what the
  // dashboard publishes after the build.
  writeFileSync(resolve("public/sitemap-base.xml"), xml);
  console.log(`sitemap.xml written (${all.length} entries; ${dyn.length} dynamic)`);
})();