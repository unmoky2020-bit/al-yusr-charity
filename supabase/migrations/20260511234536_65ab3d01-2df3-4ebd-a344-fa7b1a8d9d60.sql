
CREATE TABLE IF NOT EXISTS public.stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title_ar TEXT NOT NULL DEFAULT '',
  title_en TEXT NOT NULL DEFAULT '',
  role_ar TEXT NOT NULL DEFAULT '',
  role_en TEXT NOT NULL DEFAULT '',
  quote_ar TEXT NOT NULL DEFAULT '',
  quote_en TEXT NOT NULL DEFAULT '',
  body_ar TEXT NOT NULL DEFAULT '',
  body_en TEXT NOT NULL DEFAULT '',
  beneficiary_name TEXT,
  location_ar TEXT,
  location_en TEXT,
  image_url TEXT,
  program_node_id UUID REFERENCES public.donation_nodes(id) ON DELETE SET NULL,
  pillar_slug TEXT,
  case_id UUID REFERENCES public.cases(id) ON DELETE SET NULL,
  is_published BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  seo JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stories_published ON public.stories(is_published, sort_order);
CREATE INDEX IF NOT EXISTS idx_stories_program ON public.stories(program_node_id);
CREATE INDEX IF NOT EXISTS idx_stories_pillar ON public.stories(pillar_slug);

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS stories_public_read ON public.stories;
CREATE POLICY stories_public_read ON public.stories FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS stories_staff_read ON public.stories;
CREATE POLICY stories_staff_read ON public.stories FOR SELECT
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'case_manager'));

DROP POLICY IF EXISTS stories_staff_insert ON public.stories;
CREATE POLICY stories_staff_insert ON public.stories FOR INSERT
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'case_manager'));

DROP POLICY IF EXISTS stories_staff_update ON public.stories;
CREATE POLICY stories_staff_update ON public.stories FOR UPDATE
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'case_manager'));

DROP POLICY IF EXISTS stories_admin_delete ON public.stories;
CREATE POLICY stories_admin_delete ON public.stories FOR DELETE
USING (public.has_role(auth.uid(),'admin'));

DROP TRIGGER IF EXISTS trg_stories_touch ON public.stories;
CREATE TRIGGER trg_stories_touch BEFORE UPDATE ON public.stories
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
