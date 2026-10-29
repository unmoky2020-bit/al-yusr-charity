import { describeWriteError } from "@/data/api/backendPending";
import { uploadMedia, type MediaCollection } from "@/data/api/mediaApi";
import { generateOg } from "./og-generator";

const safeName = (s: string) =>
  s.toLowerCase().replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "file";

/**
 * Upload an image to the media library (POST /media, collection "blog" or "og") and return its
 * public URL. Throws on failure — never returns a temporary blob: URL that would be saved as the cover.
 */
export async function uploadBlogMedia(file: Blob, suggestedName: string, collection: MediaCollection = "blog"): Promise<string> {
  const ext = suggestedName.includes(".") ? suggestedName.split(".").pop() : "jpg";
  const fileName = `${safeName(suggestedName.replace(/\.[^.]+$/, ""))}.${ext}`;
  try {
    const saved = await uploadMedia(file, fileName, collection);
    if (!saved.url) throw new Error("لم يرجع السيرفر رابط الصورة");
    return saved.url;
  } catch (e) {
    throw new Error(describeWriteError(e, "POST /media"));
  }
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
  return uploadBlogMedia(blob, `og-${input.slug}.jpg`, "og");
}
