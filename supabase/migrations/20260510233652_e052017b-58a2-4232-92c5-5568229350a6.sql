
-- 1) Add scheduled_at column for auto-publish
ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_blog_posts_scheduled
  ON public.blog_posts (status, scheduled_at)
  WHERE status = 'scheduled';

-- 2) Validate status values
ALTER TABLE public.blog_posts DROP CONSTRAINT IF EXISTS blog_posts_status_check;
ALTER TABLE public.blog_posts
  ADD CONSTRAINT blog_posts_status_check
  CHECK (status IN ('draft','pending_review','scheduled','published','archived'));

-- 3) Storage bucket for blog media (covers + OG)
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-media', 'blog-media', true)
ON CONFLICT (id) DO NOTHING;

-- Public read for blog-media
DROP POLICY IF EXISTS "blog_media_public_read" ON storage.objects;
CREATE POLICY "blog_media_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'blog-media');

-- Staff (admin / case_manager / editor doesn't exist as role yet — admin + case_manager)
DROP POLICY IF EXISTS "blog_media_staff_write" ON storage.objects;
CREATE POLICY "blog_media_staff_write"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'blog-media'
    AND (public.has_role(auth.uid(), 'admin'::app_role)
         OR public.has_role(auth.uid(), 'case_manager'::app_role))
  );

DROP POLICY IF EXISTS "blog_media_staff_update" ON storage.objects;
CREATE POLICY "blog_media_staff_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'blog-media'
    AND (public.has_role(auth.uid(), 'admin'::app_role)
         OR public.has_role(auth.uid(), 'case_manager'::app_role))
  );

DROP POLICY IF EXISTS "blog_media_staff_delete" ON storage.objects;
CREATE POLICY "blog_media_staff_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'blog-media'
    AND (public.has_role(auth.uid(), 'admin'::app_role)
         OR public.has_role(auth.uid(), 'case_manager'::app_role))
  );

-- 4) DB function that publishes due scheduled posts (no http needed)
CREATE OR REPLACE FUNCTION public.publish_scheduled_posts()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.blog_posts
     SET status = 'published',
         published_at = COALESCE(published_at, scheduled_at, now()),
         updated_at  = now()
   WHERE status = 'scheduled'
     AND scheduled_at IS NOT NULL
     AND scheduled_at <= now();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- 5) Schedule it via pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'publish_scheduled_blog_posts') THEN
    PERFORM cron.unschedule('publish_scheduled_blog_posts');
  END IF;
  PERFORM cron.schedule(
    'publish_scheduled_blog_posts',
    '*/5 * * * *',
    $cron$ SELECT public.publish_scheduled_posts(); $cron$
  );
END $$;
