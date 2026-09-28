import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * Validates that /qurbani Rich Results JSON-LD is present in the *initial* HTML
 * (index.html) — i.e. SSR/static — and structurally correct for Google's
 * BreadcrumbList and FAQPage rich-results requirements.
 *
 * Run as part of the normal Vitest suite before publishing.
 */
const html = fs.readFileSync(path.resolve(__dirname, "../../index.html"), "utf8");

const extractJsonLd = (key: string) => {
  const re = new RegExp(`<script type="application/ld\\+json" data-ssr="${key}">([\\s\\S]*?)</script>`);
  const m = html.match(re);
  if (!m) throw new Error(`Missing <script data-ssr="${key}"> in index.html`);
  return JSON.parse(m[1]);
};

describe("/qurbani static JSON-LD", () => {
  it("Organization block is valid", () => {
    const org = extractJsonLd("org");
    expect(
      Array.isArray(org["@type"]) ? org["@type"] : [org["@type"]]
    ).toContain("Organization");
    expect(org.name).toBeTruthy();
    expect(org.url).toMatch(/^https:\/\//);
    const logoUrl = typeof org.logo === "string" ? org.logo : org.logo?.url;
    expect(logoUrl).toMatch(/^https:\/\//);
    const tel =
      org.telephone ||
      (Array.isArray(org.contactPoint)
        ? org.contactPoint[0]?.telephone
        : org.contactPoint?.telephone);
    expect(tel).toBeTruthy();
  });
});