/**
 * Helpers to emit responsive `srcset` / `sizes` for images.
 *
 * - Supabase Storage public URLs are transformed via the built-in image
 *   render endpoint (`/storage/v1/render/image/public/...`) which resizes
 *   on the fly and serves WebP when supported. We emit a 320–1600 ladder.
 * - Bundled Vite assets (already hashed and pre-compressed at build time)
 *   pass through unchanged — a single descriptor is enough.
 * - External URLs pass through as-is.
 *
 * The companion `compressImage` helper already caps uploaded files at
 * ~1600px on the long edge, so 1600 is the natural top of the ladder.
 */

const SUPABASE_PUBLIC_RE = /\/storage\/v1\/object\/public\//;
const DEFAULT_WIDTHS = [320, 480, 640, 800, 1024, 1280, 1600];

export type SrcSet = { src: string; srcSet?: string; sizes?: string };

/** Build srcset for a Supabase storage public URL using the render endpoint. */
export function buildSupabaseSrcSet(
  url: string,
  widths: number[] = DEFAULT_WIDTHS,
  quality = 78,
): string {
  if (!SUPABASE_PUBLIC_RE.test(url)) return "";
  const rendered = url.replace(SUPABASE_PUBLIC_RE, "/storage/v1/render/image/public/");
  return widths
    .map((w) => {
      const sep = rendered.includes("?") ? "&" : "?";
      return `${rendered}${sep}width=${w}&quality=${quality} ${w}w`;
    })
    .join(", ");
}

/**
 * Best-effort responsive descriptor for any image URL.
 * Returns `{ src, srcSet, sizes }` for Supabase-hosted images,
 * `{ src }` otherwise (caller's plain src + lazy load is still useful).
 */
export function responsiveImage(
  url: string,
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
): SrcSet {
  if (SUPABASE_PUBLIC_RE.test(url)) {
    return { src: url, srcSet: buildSupabaseSrcSet(url), sizes };
  }
  return { src: url };
}
