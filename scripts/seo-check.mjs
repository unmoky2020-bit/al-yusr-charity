#!/usr/bin/env node
/**
 * Pre-publish SEO checker for /qurbani static JSON-LD in index.html.
 *
 * Validates Google Rich Results requirements for:
 *   - Organization (NGO)
 *   - BreadcrumbList
 *   - FAQPage
 *
 * Usage:  node scripts/seo-check.mjs
 * Exits with code 1 if any errors are found, 0 otherwise.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");

const errors = [];
const warnings = [];
const ok = [];

const extract = (key) => {
  const re = new RegExp(`<script type="application/ld\\+json" data-ssr="${key}">([\\s\\S]*?)</script>`);
  const m = html.match(re);
  if (!m) return null;
  try { return JSON.parse(m[1]); } catch (e) { errors.push(`[${key}] invalid JSON: ${e.message}`); return null; }
};

/* ---------- Organization ---------- */
const org = extract("org");
if (!org) errors.push(`[org] Missing <script data-ssr="org"> in index.html`);
else {
  const need = ["@context", "@type", "name", "url", "logo", "address", "telephone"];
  need.forEach((k) => { if (!org[k]) errors.push(`[org] missing required field: ${k}`); });
  if (org.url && !/^https:\/\//.test(org.url)) errors.push(`[org] url must be absolute https`);
  if (org.logo && !/^https:\/\//.test(org.logo)) errors.push(`[org] logo must be absolute https URL`);
  if (!org.sameAs) warnings.push(`[org] consider adding 'sameAs' (social profiles) to strengthen Knowledge Graph`);
  if (!errors.length) ok.push(`[org] Organization (${org["@type"]}) valid`);
}

/* ---------- BreadcrumbList (optional — now injected by route component) ---------- */
const bc = extract("qurbani-breadcrumb");
if (bc) {
  if (bc["@type"] !== "BreadcrumbList") errors.push(`[breadcrumb] @type must be BreadcrumbList`);
  if (!Array.isArray(bc.itemListElement) || bc.itemListElement.length < 2)
    errors.push(`[breadcrumb] itemListElement must have ≥ 2 ListItem entries`);
  else {
    bc.itemListElement.forEach((it, i) => {
      const tag = `[breadcrumb #${i + 1}]`;
      if (it["@type"] !== "ListItem") errors.push(`${tag} @type must be ListItem`);
      if (it.position !== i + 1) errors.push(`${tag} position must equal ${i + 1} (got ${it.position})`);
      if (!it.name || typeof it.name !== "string") errors.push(`${tag} missing 'name'`);
      if (!it.item || !/^https:\/\//.test(it.item)) errors.push(`${tag} 'item' must be absolute https URL`);
    });
    ok.push(`[breadcrumb] ${bc.itemListElement.length} breadcrumbs valid`);
  }
}

/* ---------- FAQPage (optional — now injected by route component) ---------- */
const faq = extract("qurbani-faq");
if (faq) {
  if (faq["@type"] !== "FAQPage") errors.push(`[faq] @type must be FAQPage`);
  if (!Array.isArray(faq.mainEntity) || faq.mainEntity.length < 5)
    warnings.push(`[faq] mainEntity has ${faq.mainEntity?.length || 0} questions; ≥ 5 recommended`);
  const seen = new Set();
  (faq.mainEntity || []).forEach((q, i) => {
    const tag = `[faq Q${i + 1}]`;
    if (q["@type"] !== "Question") errors.push(`${tag} @type must be Question`);
    if (!q.name || !q.name.trim()) errors.push(`${tag} missing 'name'`);
    if (seen.has(q.name)) warnings.push(`${tag} duplicate question text — Google flags duplicates`);
    seen.add(q.name);
    if (q.acceptedAnswer?.["@type"] !== "Answer") errors.push(`${tag} acceptedAnswer must be of @type Answer`);
    const txt = q.acceptedAnswer?.text || "";
    if (!txt.trim()) errors.push(`${tag} acceptedAnswer.text empty`);
    if (/<a\b|<script\b/i.test(txt)) errors.push(`${tag} acceptedAnswer.text contains forbidden HTML (<a>/<script>)`);
    if (txt.length > 1000) warnings.push(`${tag} answer is ${txt.length} chars — consider trimming`);
  });
  if (!errors.some((e) => e.startsWith("[faq"))) ok.push(`[faq] ${faq.mainEntity?.length || 0} FAQ entries valid`);
}

/* ---------- /about Breadcrumb + FAQ (optional — now injected by route component) ---------- */
const aboutBc = extract("about-breadcrumb");
if (aboutBc) {
  if (aboutBc["@type"] !== "BreadcrumbList") errors.push(`[about-breadcrumb] @type must be BreadcrumbList`);
  (aboutBc.itemListElement || []).forEach((it, i) => {
    const tag = `[about-bc #${i + 1}]`;
    if (it["@type"] !== "ListItem") errors.push(`${tag} @type must be ListItem`);
    if (it.position !== i + 1) errors.push(`${tag} position must equal ${i + 1}`);
    if (!it.name) errors.push(`${tag} missing 'name'`);
    if (!it.item || !/^https:\/\//.test(it.item)) errors.push(`${tag} 'item' must be absolute https URL`);
  });
  if (!errors.some((e) => e.startsWith("[about-bc"))) ok.push(`[about-breadcrumb] ${aboutBc.itemListElement.length} crumbs valid`);
}
const aboutFaq = extract("about-faq");
if (aboutFaq) {
  if (aboutFaq["@type"] !== "FAQPage") errors.push(`[about-faq] @type must be FAQPage`);
  const seenA = new Set();
  (aboutFaq.mainEntity || []).forEach((q, i) => {
    const tag = `[about-faq Q${i + 1}]`;
    if (q["@type"] !== "Question") errors.push(`${tag} @type must be Question`);
    if (!q.name) errors.push(`${tag} missing 'name'`);
    if (seenA.has(q.name)) warnings.push(`${tag} duplicate question text`);
    seenA.add(q.name);
    if (q.acceptedAnswer?.["@type"] !== "Answer") errors.push(`${tag} acceptedAnswer must be Answer`);
    if (!q.acceptedAnswer?.text?.trim()) errors.push(`${tag} acceptedAnswer.text empty`);
  });
  if (!errors.some((e) => e.startsWith("[about-faq"))) ok.push(`[about-faq] ${aboutFaq.mainEntity.length} FAQ entries valid`);
}

/* ---------- Report ---------- */
const c = (txt, color) => `\x1b[${color}m${txt}\x1b[0m`;
console.log("\nSEO Pre-publish check — /qurbani Rich Results\n" + "=".repeat(50));
ok.forEach((m) => console.log(c("✓ " + m, 32)));
warnings.forEach((m) => console.log(c("⚠ " + m, 33)));
errors.forEach((m) => console.log(c("✗ " + m, 31)));
console.log("=".repeat(50));
console.log(`${ok.length} ok · ${warnings.length} warnings · ${errors.length} errors\n`);

if (errors.length) process.exit(1);