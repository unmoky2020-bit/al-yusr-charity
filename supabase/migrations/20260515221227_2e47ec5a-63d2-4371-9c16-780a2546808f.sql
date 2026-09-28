
DROP VIEW IF EXISTS public.public_impact_feed;
CREATE VIEW public.public_impact_feed
WITH (security_invoker = true) AS
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
