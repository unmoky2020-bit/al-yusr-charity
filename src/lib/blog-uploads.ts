import { supabase } from "@/integrations/supabase/client";
import { generateOg } from "./og-generator";

const BUCKET = "blog-media";

const dataUrlToBlob = async (dataUrl: string): Promise<Blob> => (await fetch(dataUrl)).blob();

const safeName = (s: string) =>
  s.toLowerCase().replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "file";

/** Upload an arbitrary file/blob to blog-media and return its public URL. */
export async function uploadBlogMedia(file: Blob, suggestedName: string): Promise<string> {
  const ext = suggestedName.includes(".") ? suggestedName.split(".").pop() : "jpg";
  const path = `${Date.now()}-${safeName(suggestedName.replace(/\.[^.]+$/, ""))}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || "image/jpeg",
    upsert: false,
    cacheControl: "31536000",
  });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
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
  const blob = await dataUrlToBlob(dataUrl);
  return uploadBlogMedia(blob, `og-${input.slug}.jpg`);
}
