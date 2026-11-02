/**
 * Single switch that decides where the PUBLIC site reads its static content from.
 *
 *   VITE_CONTENT_SOURCE=api     (default) -> the Laravel API is the one source (what elyusr.org runs); the static
 *                                           TS copies in src/data are only used when the API cannot be reached.
 *   VITE_CONTENT_SOURCE=auto              -> same as "api".
 *   VITE_CONTENT_SOURCE=static            -> offline/dev only: content comes from the TS files in src/data.
 *
 * A missing value means "api", so a build without a .env shows the same content as the live site.
 */
export type ContentSource = "static" | "api" | "auto";

function readContentSource(raw: unknown): ContentSource {
  const v = String(raw ?? "").trim().toLowerCase();
  if (v === "static") return "static";
  return v === "auto" ? "auto" : "api";
}

export const CONTENT_SOURCE: ContentSource = readContentSource(import.meta.env.VITE_CONTENT_SOURCE);

/** True when the public site should try the API first (CONTENT_SOURCE is "api" or "auto"). */
export const useApiContent: boolean = CONTENT_SOURCE !== "static";

/** Exposed for tests only. */
export const __readContentSource = readContentSource;
