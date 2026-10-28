/**
 * Client-side image compression using <canvas>.
 * - Skips SVG and GIF (animated) files — returns the original.
 * - Resizes the longest edge down to `maxEdge` while preserving aspect ratio.
 * - Re-encodes as WebP with `quality` (falls back to JPEG when needed).
 * - Iteratively reduces quality until file is under `maxSizeBytes` (default 2MB).
 * - Returns the original file if compression would *increase* the size.
 */
export async function compressImage(
  file: File,
  opts: { maxEdge?: number; quality?: number; maxSizeBytes?: number } = {},
): Promise<File> {
  const { maxEdge = 1600, quality = 0.82, maxSizeBytes = 2 * 1024 * 1024 } = opts;

  // Pass-through for vector and animated formats
  if (file.type === "image/svg+xml" || file.type === "image/gif") return file;
  if (!file.type.startsWith("image/")) return file;

  const bitmap = await createImageBitmapSafe(file);
  if (!bitmap) return file;

  const { width: w, height: h } = bitmap;
  const scale = Math.min(1, maxEdge / Math.max(w, h));
  const targetW = Math.round(w * scale);
  const targetH = Math.round(h * scale);

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, targetW, targetH);

  // Determine target MIME type — preserve PNG for icons/transparency, use JPEG for photos
  const isPng = file.type === "image/png";
  const targetMime = isPng ? "image/png" : "image/jpeg";
  const ext = isPng ? "png" : "jpg";

  // Iteratively compress until under maxSizeBytes
  let q = quality;
  let blob: Blob | null = null;
  let attempts = 0;
  while (attempts < 8) {
    blob = await canvasToBlob(canvas, targetMime, q);
    if (!blob) break;
    if (blob.size <= maxSizeBytes) break;
    q = Math.max(0.3, q - 0.1); // reduce quality by 10% each iteration
    attempts++;
  }

  if (!blob) return file;

  // If still over limit, try shrinking dimensions further
  if (blob.size > maxSizeBytes) {
    const shrinkScale = Math.sqrt(maxSizeBytes / blob.size) * 0.95;
    const sw = Math.round(targetW * shrinkScale);
    const sh = Math.round(targetH * shrinkScale);
    const canvas2 = document.createElement("canvas");
    canvas2.width = sw;
    canvas2.height = sh;
    const ctx2 = canvas2.getContext("2d");
    if (ctx2) {
      ctx2.imageSmoothingQuality = "high";
      ctx2.drawImage(canvas, 0, 0, sw, sh);
      blob = await canvasToBlob(canvas2, targetMime, q);
    }
  }

  if (!blob) return file;

  // Bail out if compression actually grew the file
  if (blob.size >= file.size && scale === 1) return file;

  const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
  return new File([blob], `${baseName}.${ext}`, { type: blob.type, lastModified: Date.now() });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

async function createImageBitmapSafe(file: File): Promise<ImageBitmap | HTMLImageElement | null> {
  try {
    if (typeof createImageBitmap === "function") return await createImageBitmap(file);
  } catch { /* fall through */ }
  // Fallback for older browsers
  return await new Promise<HTMLImageElement | null>((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}
