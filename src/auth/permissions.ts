/**
 * Volunteer permissions / capabilities.
 * Volunteers earn a default set based on declared skills.
 * Admins can override per-volunteer via the admin panel.
 */
export type Permission =
  | "content.write"        // create/edit articles, posters, gallery
  | "content.publish"      // publish (else stays as draft)
  | "distribution.manage"  // manage food box distribution lists
  | "cases.manage"         // create/edit beneficiary cases
  | "media.upload"         // upload photos / videos / receipts
  | "field.coordinate"     // coordinate on-ground volunteer teams
  | "donations.verify";    // verify manual transfer receipts

export const ALL_PERMISSIONS: Permission[] = [
  "content.write",
  "content.publish",
  "distribution.manage",
  "cases.manage",
  "media.upload",
  "field.coordinate",
  "donations.verify",
];

export const PERMISSION_LABEL: Record<Permission, { ar: string; en: string }> = {
  "content.write":       { ar: "كتابة المحتوى",      en: "Write content" },
  "content.publish":     { ar: "نشر المحتوى",        en: "Publish content" },
  "distribution.manage": { ar: "إدارة التوزيع",      en: "Manage distribution" },
  "cases.manage":        { ar: "إدارة الحالات",      en: "Manage cases" },
  "media.upload":        { ar: "رفع الصور والفيديو",  en: "Upload media" },
  "field.coordinate":    { ar: "تنسيق الفرق الميدانية", en: "Coordinate field teams" },
  "donations.verify":    { ar: "اعتماد إيصالات التبرع",  en: "Verify donation receipts" },
};

/** Default permissions inferred from a volunteer's declared skills. */
export const inferPermissions = (skills: string[] = []): Permission[] => {
  const set = new Set<Permission>(["media.upload"]);
  const has = (kw: string) => skills.some((s) => s.includes(kw));
  if (has("محتوى") || has("كتابة") || has("content")) {
    set.add("content.write");
  }
  if (has("تصوير") || has("photo") || has("فيديو")) {
    set.add("media.upload");
  }
  if (has("توزيع") || has("logistics") || has("لوجستيات")) {
    set.add("distribution.manage");
  }
  if (has("ميدان") || has("field")) {
    set.add("field.coordinate");
  }
  if (has("بحث") || has("اجتماعي") || has("case")) {
    set.add("cases.manage");
  }
  return [...set];
};