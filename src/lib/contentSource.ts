/**
 * Single switch that decides where the PUBLIC site reads its static content from.
 *
 *   VITE_CONTENT_SOURCE=static  (default) -> today's behaviour: content comes from the TS files in src/data.
 *   VITE_CONTENT_SOURCE=api                -> read from the Laravel API; an item the API does not have falls back
 *                                             to its static copy (and the whole dataset falls back on error/empty).
 *   VITE_CONTENT_SOURCE=auto               -> same as "api".
 *
 * Any other / missing value is treated as "static" so nothing visible changes by accident.
 */
export type ContentSource = "static" | "api" | "auto";

function readContentSource(raw: unknown): ContentSource {
  const v = String(raw ?? "").trim().toLowerCase();
  return v === "api" || v === "auto" ? v : "static";
}

export const CONTENT_SOURCE: ContentSource = readContentSource(import.meta.env.VITE_CONTENT_SOURCE);

/** True when the public site should try the API first (CONTENT_SOURCE is "api" or "auto"). */
export const useApiContent: boolean = CONTENT_SOURCE !== "static";

/** Exposed for tests only. */
export const __readContentSource = readContentSource;
