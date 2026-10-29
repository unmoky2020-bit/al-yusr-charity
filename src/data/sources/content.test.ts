import { describe, expect, it } from "vitest";
import { blogPosts } from "@/data/blog";
import { GALLERY_STATIC_IMAGES } from "@/data/galleryImages";
import { findBlogPost, mapApiBlogPost, resolveBlogPosts } from "./blog";
import { gallerySlug, legacyRowToImage, mapApiGalleryImage, mergeLegacy, resolveGalleryImages } from "./gallery";
import { API_BLOG_SEO_DRAFT, API_BLOG_SEO_PUBLISHED, API_GALLERY } from "./_testFixtures";

describe("blog source", () => {
  it("maps a /blog-seo record to BlogPost", () => {
    const p = mapApiBlogPost(API_BLOG_SEO_PUBLISHED);
    expect(p.slug).toBe("importance-of-zakat");
    expect(p.date).toBe("2026-09-10");
    expect(p.category).toEqual({ ar: "مجتمع", en: "Zakat" });
    expect(p.ar.body).toEqual(["الفقرة الأولى.", "الفقرة الثانية."]);
    expect(p.en.tags).toEqual(["zakat", "charity", "islam"]);
    expect(p.image).toBe("/placeholder.svg");
    expect(Object.keys(p).sort()).toEqual(Object.keys(blogPosts[0]).sort());
  });

  it("falls back to the static post for missing fields", () => {
    const fb = blogPosts[0];
    const p = mapApiBlogPost({ slug: fb.slug, title_ar: "عنوان جديد" }, fb);
    expect(p.ar.title).toBe("عنوان جديد");
    expect(p.image).toBe(fb.image);
    expect(p.date).toBe(fb.date);
    expect(p.ar.body).toEqual(fb.ar.body);
    expect(p.en).toEqual(fb.en);
  });

  it("static flag returns the base list unchanged", () => {
    expect(resolveBlogPosts(blogPosts, undefined)).toBe(blogPosts);
    expect(resolveBlogPosts(blogPosts, { blogSeo: [API_BLOG_SEO_PUBLISHED], articles: [] }, "static")).toBe(blogPosts);
    expect(findBlogPost([], blogPosts[0].slug)).toBe(blogPosts[0]);
  });

  it("api mode adds published records only, sorted by date", () => {
    const list = resolveBlogPosts(blogPosts, { blogSeo: [API_BLOG_SEO_PUBLISHED, API_BLOG_SEO_DRAFT], articles: [] }, "api");
    expect(list).toHaveLength(blogPosts.length + 1);
    expect(list.some((p) => p.slug === "water-project-2026")).toBe(false);
    expect(list.some((p) => p.slug === "importance-of-zakat")).toBe(true);
    for (let i = 1; i < list.length; i++) expect(list[i - 1].date >= list[i].date).toBe(true);
    expect(resolveBlogPosts(blogPosts, { blogSeo: [API_BLOG_SEO_DRAFT], articles: [] }, "api")).toBe(blogPosts);
  });
});

describe("gallery source", () => {
  it("maps a /gallery record to GalleryImage", () => {
    const g = mapApiGalleryImage(API_GALLERY[0]);
    expect(g).toMatchObject({
      id: "1",
      alt: "Image description for search",
      altAr: "وصف الصورة للبحث",
      programSlug: "general",
      donateProgram: "odhya",
      category: "qurbani",
      city: "Mansoura",
    });
    expect(g.src).toContain("/storage/gallery/");
    expect(gallerySlug("odhya, box, water")).toBe("odhya");
    expect(gallerySlug("عام")).toBe("general");
  });

  it("builds alt text and falls back to static fields when the API record is sparse", () => {
    const g = mapApiGalleryImage(API_GALLERY[1]);
    expect(g.alt).toBe("projects");
    expect(g.category).toBe("campaigns");
    const fb = GALLERY_STATIC_IMAGES[0];
    const withFb = mapApiGalleryImage({ id: 5, key: fb.id }, fb);
    expect(withFb).toEqual(fb);
  });

  it("static flag returns GALLERY_STATIC_IMAGES; api mode puts public API images first", () => {
    expect(resolveGalleryImages(undefined)).toBe(GALLERY_STATIC_IMAGES);
    expect(resolveGalleryImages(API_GALLERY, "static")).toBe(GALLERY_STATIC_IMAGES);
    const list = resolveGalleryImages(API_GALLERY, "api");
    expect(list).toHaveLength(GALLERY_STATIC_IMAGES.length + 2); // hidden record dropped
    expect(list[0].id).toBe("94"); // sort_order 0 first
  });

  it("legacy (static-flag) merge is identical to the old Gallery.tsx logic", () => {
    expect(mergeLegacy(null)).toEqual(GALLERY_STATIC_IMAGES);
    const row = legacyRowToImage({
      id: "7", title_ar: "ت", title_en: "", caption_ar: null, caption_en: null, alt_ar: null, alt_en: null,
      image_url: "https://x/y.jpg", storage_path: null, program_slug: "box", city: "Talkha", is_published: true,
      is_featured: false, sort_order: 1, donate_program: null, width: null, height: null, created_at: "", updated_at: "",
    });
    expect(row).toEqual({
      id: "7", src: "https://x/y.jpg", alt: "ت — Food box — Talkha", altAr: "ت — كرتونة عزومة — Talkha",
      category: "campaigns", programSlug: "box", city: "Talkha", donateProgram: "box",
    });
    expect(mergeLegacy([row])[0]).toEqual(row);
    expect(mergeLegacy([row])).toHaveLength(GALLERY_STATIC_IMAGES.length + 1);
  });
});

describe("gallery: seeder row shape (program = static category, extra.static_id)", () => {
  it("maps back to the identical static image", () => {
    const fb = GALLERY_STATIC_IMAGES.find((g) => g.id === "markoun-01")!;
    const seeded = {
      id: 501,
      image: null,
      title_ar: fb.altAr,
      title_en: fb.alt,
      alt_ar: fb.altAr,
      alt_en: fb.alt,
      city: fb.city,
      program: fb.category,
      donation_program: fb.donateProgram,
      is_public: true,
      extra: { static_id: "markoun-01", program_slug: "markoun" },
    };
    expect(mapApiGalleryImage(seeded, fb)).toEqual(fb);
    expect(mapApiGalleryImage(seeded).category).toBe("campaigns");
    expect(mapApiGalleryImage(seeded).programSlug).toBe("markoun");
  });
});
