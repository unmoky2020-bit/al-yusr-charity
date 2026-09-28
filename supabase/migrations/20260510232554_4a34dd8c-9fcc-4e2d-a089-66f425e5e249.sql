CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  published_at TIMESTAMPTZ,
  image_url TEXT,
  og_image_url TEXT,
  category_ar TEXT NOT NULL DEFAULT '',
  category_en TEXT NOT NULL DEFAULT '',
  focus_keyword TEXT,
  title_ar TEXT NOT NULL DEFAULT '',
  title_en TEXT NOT NULL DEFAULT '',
  excerpt_ar TEXT NOT NULL DEFAULT '',
  excerpt_en TEXT NOT NULL DEFAULT '',
  body_ar TEXT[] NOT NULL DEFAULT '{}',
  body_en TEXT[] NOT NULL DEFAULT '{}',
  tags_ar TEXT[] NOT NULL DEFAULT '{}',
  tags_en TEXT[] NOT NULL DEFAULT '{}',
  seo_score INTEGER NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS blog_posts_status_idx ON public.blog_posts (status, published_at DESC);
CREATE INDEX IF NOT EXISTS blog_posts_category_idx ON public.blog_posts (category_ar);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY blog_posts_public_read
  ON public.blog_posts FOR SELECT
  USING (status = 'published');

CREATE POLICY blog_posts_staff_read
  ON public.blog_posts FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'case_manager')
  );

CREATE POLICY blog_posts_staff_insert
  ON public.blog_posts FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'case_manager')
  );

CREATE POLICY blog_posts_staff_update
  ON public.blog_posts FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'case_manager')
  );

CREATE POLICY blog_posts_admin_delete
  ON public.blog_posts FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS blog_posts_touch_updated_at ON public.blog_posts;
CREATE TRIGGER blog_posts_touch_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();