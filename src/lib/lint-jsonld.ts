/**
 * Mirrors the Article JSON-LD that BlogPost.tsx emits and validates required
 * fields per Schema.org Article + Google's "Article" rich result rules.
 */
import type { BlogPost } from "@/data/blog";

export type SchemaIssue = { field: string; level: "error" | "warn"; message: string };

export function buildArticleSchema(post: BlogPost) {
  const baseUrl = "https://elyusr.org";
  const url = `${baseUrl}/blog/${post.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.ar.title,
    description: post.ar.excerpt,
    image: post.image ? [post.image] : [],
    datePublished: post.date,
    dateModified: post.date,
    inLanguage: "ar-EG",
    articleSection: post.category?.ar,
    keywords: (post.ar.tags || []).join(", "),
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    author: { "@type": "Organization", name: "مؤسسة اليسر الخيرية" },
    publisher: { "@type": "Organization", name: "مؤسسة اليسر الخيرية" },
  };
}

export function lintArticleSchema(post: BlogPost): SchemaIssue[] {
  const s = buildArticleSchema(post);
  const issues: SchemaIssue[] = [];

  if (!s.headline || s.headline.length < 10) issues.push({ field: "headline", level: "error", message: "العنوان قصير أو فاضي." });
  if (s.headline && s.headline.length > 110) issues.push({ field: "headline", level: "warn", message: "العنوان طويل جدًا (>110 حرف)." });
  if (!s.description || s.description.length < 50) issues.push({ field: "description", level: "warn", message: "وصف قصير — اكتب 80–170 حرف." });
  if (!s.image || s.image.length === 0) issues.push({ field: "image", level: "error", message: "Schema بدون صورة (og:image مفقود)." });
  if (!s.datePublished) issues.push({ field: "datePublished", level: "error", message: "ناقص datePublished." });
  else if (isNaN(Date.parse(s.datePublished))) issues.push({ field: "datePublished", level: "error", message: "تاريخ النشر صياغته غلط." });
  if (!s.author?.name) issues.push({ field: "author", level: "error", message: "ناقص author.name." });
  if (!s.publisher?.name) issues.push({ field: "publisher", level: "error", message: "ناقص publisher.name." });
  if (!s.mainEntityOfPage?.["@id"]) issues.push({ field: "mainEntityOfPage", level: "error", message: "ناقص mainEntityOfPage." });

  // JSON syntactic validity: serialize and re-parse — catches non-JSON values.
  try { JSON.parse(JSON.stringify(s)); } catch (e) {
    issues.push({ field: "json", level: "error", message: "فشل serialization للـ JSON-LD." });
  }
  return issues;
}