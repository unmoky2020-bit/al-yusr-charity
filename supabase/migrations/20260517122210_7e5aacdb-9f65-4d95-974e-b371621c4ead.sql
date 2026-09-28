
-- Gallery images table
CREATE TABLE public.gallery_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar text NOT NULL DEFAULT '',
  title_en text NOT NULL DEFAULT '',
  caption_ar text,
  caption_en text,
  image_url text NOT NULL,
  storage_path text,
  program_slug text NOT NULL DEFAULT 'general',
  city text,
  is_published boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  donate_program text,
  width integer,
  height integer,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX gallery_images_program_idx ON public.gallery_images (program_slug);
CREATE INDEX gallery_images_published_idx ON public.gallery_images (is_published, sort_order);

ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gallery_public_read"
  ON public.gallery_images FOR SELECT
  USING (is_published = true);

CREATE POLICY "gallery_admin_read_all"
  ON public.gallery_images FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "gallery_admin_write"
  ON public.gallery_images FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_gallery_images_updated_at
  BEFORE UPDATE ON public.gallery_images
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery-media', 'gallery-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "gallery_media_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'gallery-media');

CREATE POLICY "gallery_media_admin_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'gallery-media' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "gallery_media_admin_update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'gallery-media' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "gallery_media_admin_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'gallery-media' AND public.has_role(auth.uid(), 'admin'::app_role));
