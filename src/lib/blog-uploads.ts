import { apiFetch, formatServerImageUrl } from "@/data/laravelApi";
import { generateOg } from "./og-generator";

const safeName = (s: string) =>
  s.toLowerCase().replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "file";

/**
 * Upload a media blob to Laravel /upload and return its public URL.
 * Falls back to a local data URL if upload fails.
 */
export async function uploadBlogMedia(file: Blob, suggestedName: string): Promise<string> {
  const ext = suggestedName.includes(".") ? suggestedName.split(".").pop() : "jpg";
  const fileName = `${Date.now()}-${safeName(suggestedName.replace(/\.[^.]+$/, ""))}.${ext}`;

  try {
    const formData = new FormData();
    formData.append("file", file, fileName);
    formData.append("collection", "blog-media");

    const res = await apiFetch<{ url?: string; path?: string; data?: { url?: string } }>("/upload", {
      method: "POST",
      formData,
    });

    const url = (res as any)?.url || (res as any)?.data?.url || (res as any)?.path || null;
    if (url) return formatServerImageUrl(url) || url;
  } catch (e) {
    if (import.meta.env.DEV) console.warn("uploadBlogMedia: Laravel upload failed", e);
  }

  // Fallback: return a blob object URL (works locally, not persisted after reload)
  return URL.createObjectURL(file);
}

/** Generate an OG image (1200x630) for a post and upload it; returns its URL. */
export async function generateAndUploadOg(input: {
  slug: string;
  title: string;
  category: string;
}): Promise<string> {
  const dataUrl = await generateOg({
    title: input.title,
    category: input.category,
    url: `elyusr.org/blog/${input.slug}`,
  });
  const blob = await (await fetch(dataUrl)).blob();
  return uploadBlogMedia(blob, `og-${input.slug}.jpg`);
}
