
-- =============================================
-- Loop 1: Donation Journey infrastructure
-- =============================================

-- 1) Step key enum
DO $$ BEGIN
  CREATE TYPE public.journey_step_key AS ENUM (
    'created','paid','received','in_processing','executing','delivered','documented','completed','failed','refunded'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) Media kind enum
DO $$ BEGIN
  CREATE TYPE public.case_media_kind AS ENUM ('before','during','after','report','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================================
-- 3) donation_journey_steps
-- =============================================
CREATE TABLE IF NOT EXISTS public.donation_journey_steps (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id  uuid NULL,
  case_id      uuid NULL,
  step_key     public.journey_step_key NOT NULL,
  title_ar     text NOT NULL DEFAULT '',
  title_en     text NOT NULL DEFAULT '',
  note_ar      text NULL,
  note_en      text NULL,
  media_url    text NULL,
  is_public    boolean NOT NULL DEFAULT false,
  occurred_at  timestamptz NOT NULL DEFAULT now(),
  created_by   uuid NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT djs_target_chk CHECK (donation_id IS NOT NULL OR case_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_djs_donation ON public.donation_journey_steps(donation_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_djs_case     ON public.donation_journey_steps(case_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_djs_public   ON public.donation_journey_steps(is_public, occurred_at DESC) WHERE is_public = true;

DROP TRIGGER IF EXISTS trg_djs_touch ON public.donation_journey_steps;
CREATE TRIGGER trg_djs_touch BEFORE UPDATE ON public.donation_journey_steps
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.donation_journey_steps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS djs_staff_all ON public.donation_journey_steps;
CREATE POLICY djs_staff_all ON public.donation_journey_steps
  FOR ALL TO public
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'case_manager'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'case_manager'::app_role));

DROP POLICY IF EXISTS djs_owner_read ON public.donation_journey_steps;
CREATE POLICY djs_owner_read ON public.donation_journey_steps
  FOR SELECT TO public
  USING (
    donation_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.donations d
       WHERE d.id = donation_journey_steps.donation_id
         AND d.donor_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS djs_public_read ON public.donation_journey_steps;
CREATE POLICY djs_public_read ON public.donation_journey_steps
  FOR SELECT TO public
  USING (
    is_public = true
    AND case_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.cases c
       WHERE c.id = donation_journey_steps.case_id
         AND c.status IN ('approved'::case_status,'funded'::case_status,'closed'::case_status)
    )
  );

-- =============================================
-- 4) case_media
-- =============================================
CREATE TABLE IF NOT EXISTS public.case_media (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id      uuid NOT NULL,
  kind         public.case_media_kind NOT NULL DEFAULT 'other',
  url          text NOT NULL,
  caption_ar   text NULL,
  caption_en   text NULL,
  is_public    boolean NOT NULL DEFAULT true,
  sort_order   integer NOT NULL DEFAULT 0,
  uploaded_by  uuid NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_case_media_case ON public.case_media(case_id, sort_order);

DROP TRIGGER IF EXISTS trg_case_media_touch ON public.case_media;
CREATE TRIGGER trg_case_media_touch BEFORE UPDATE ON public.case_media
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.case_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS case_media_staff_all ON public.case_media;
CREATE POLICY case_media_staff_all ON public.case_media
  FOR ALL TO public
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'case_manager'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'case_manager'::app_role));

DROP POLICY IF EXISTS case_media_public_read ON public.case_media;
CREATE POLICY case_media_public_read ON public.case_media
  FOR SELECT TO public
  USING (
    is_public = true AND EXISTS (
      SELECT 1 FROM public.cases c
       WHERE c.id = case_media.case_id
         AND c.status IN ('approved'::case_status,'funded'::case_status,'closed'::case_status)
    )
  );

-- =============================================
-- 5) Public impact feed (view)
-- =============================================
DROP VIEW IF EXISTS public.public_impact_feed;
CREATE VIEW public.public_impact_feed AS
  SELECT
    'journey'::text                 AS source,
    s.id                            AS id,
    s.case_id                       AS case_id,
    s.step_key::text                AS kind,
    s.title_ar                      AS title_ar,
    s.title_en                      AS title_en,
    s.note_ar                       AS note_ar,
    s.note_en                       AS note_en,
    s.media_url                     AS media_url,
    s.occurred_at                   AS occurred_at
  FROM public.donation_journey_steps s
  JOIN public.cases c ON c.id = s.case_id
  WHERE s.is_public = true
    AND s.case_id IS NOT NULL
    AND c.status IN ('approved'::case_status,'funded'::case_status,'closed'::case_status)
UNION ALL
  SELECT
    'update'::text                  AS source,
    u.id                            AS id,
    u.case_id                       AS case_id,
    'update'::text                  AS kind,
    ''::text                        AS title_ar,
    ''::text                        AS title_en,
    u.body                          AS note_ar,
    u.body                          AS note_en,
    u.image_url                     AS media_url,
    u.created_at                    AS occurred_at
  FROM public.case_updates u
  JOIN public.cases c ON c.id = u.case_id
  WHERE c.status IN ('approved'::case_status,'funded'::case_status,'closed'::case_status)
  ORDER BY occurred_at DESC
  LIMIT 200;

GRANT SELECT ON public.public_impact_feed TO anon, authenticated;

-- =============================================
-- 6) Realtime
-- =============================================
ALTER TABLE public.donation_journey_steps REPLICA IDENTITY FULL;
ALTER TABLE public.case_media REPLICA IDENTITY FULL;

DO $$ BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.donation_journey_steps';
EXCEPTION WHEN duplicate_object THEN NULL; WHEN others THEN NULL; END $$;

DO $$ BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.case_media';
EXCEPTION WHEN duplicate_object THEN NULL; WHEN others THEN NULL; END $$;
