-- 1. Cases: column-level privileges for anon role
REVOKE SELECT ON public.cases FROM anon;
GRANT SELECT (
  id, ref_code, category_id, title, story, beneficiary_name,
  governorate, city, area, cover_image_url,
  needed_amount, raised_amount, deadline, urgency, status,
  approved_at, closed_at, created_at, updated_at
) ON public.cases TO anon;

-- 2. Ad campaigns: column-level privileges for anon role
REVOKE SELECT ON public.ad_campaigns FROM anon;
GRANT SELECT (
  id, slug, name, status, channel, program_slug,
  headline_en, headline_ar, subheadline_en, subheadline_ar,
  cta_label_en, cta_label_ar, hero_image_url, target_url,
  start_date, end_date, created_at, updated_at
) ON public.ad_campaigns TO anon;

-- 3. Drop broad SELECT policies that let anyone enumerate public buckets.
-- Direct public URLs continue to work because the buckets remain marked public.
DROP POLICY IF EXISTS blog_media_public_read    ON storage.objects;
DROP POLICY IF EXISTS gallery_media_public_read ON storage.objects;