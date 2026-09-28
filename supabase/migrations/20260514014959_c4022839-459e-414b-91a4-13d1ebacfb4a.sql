-- Ad campaigns: track external advertising landing pages + on-site events for ROAS/CTR
CREATE TABLE IF NOT EXISTS public.ad_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  channel text NOT NULL DEFAULT 'facebook',
  status text NOT NULL DEFAULT 'draft',
  program_slug text,
  utm_source text NOT NULL DEFAULT '',
  utm_medium text NOT NULL DEFAULT 'cpc',
  utm_campaign text NOT NULL DEFAULT '',
  utm_content text,
  utm_term text,
  target_url text,
  budget_egp numeric NOT NULL DEFAULT 0,
  spend_egp numeric NOT NULL DEFAULT 0,
  start_date date,
  end_date date,
  headline_ar text NOT NULL DEFAULT '',
  headline_en text NOT NULL DEFAULT '',
  subheadline_ar text NOT NULL DEFAULT '',
  subheadline_en text NOT NULL DEFAULT '',
  cta_label_ar text NOT NULL DEFAULT 'تبرع الآن',
  cta_label_en text NOT NULL DEFAULT 'Donate now',
  hero_image_url text,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ad_campaigns_status_idx ON public.ad_campaigns(status);
CREATE INDEX IF NOT EXISTS ad_campaigns_channel_idx ON public.ad_campaigns(channel);

ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;

-- Public can read only active campaigns (needed to render the landing page)
CREATE POLICY ad_campaigns_public_read ON public.ad_campaigns
  FOR SELECT USING (status = 'active');

-- Admins (and case_managers) have full read; admins can write
CREATE POLICY ad_campaigns_staff_read ON public.ad_campaigns
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'case_manager'::public.app_role)
  );

CREATE POLICY ad_campaigns_admin_write ON public.ad_campaigns
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER ad_campaigns_touch_updated_at
  BEFORE UPDATE ON public.ad_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Event log: page_view, cta_click, donation_started, donation_completed
CREATE TABLE IF NOT EXISTS public.ad_campaign_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  session_id text,
  donation_id uuid,
  donation_amount numeric,
  referrer text,
  user_agent text,
  country text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ad_campaign_events_campaign_idx
  ON public.ad_campaign_events(campaign_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ad_campaign_events_type_idx
  ON public.ad_campaign_events(event_type);

ALTER TABLE public.ad_campaign_events ENABLE ROW LEVEL SECURITY;

-- Anyone (anon) can insert events but only for the limited event types and only
-- for active campaigns. The check constraint guarantees event_type stays whitelisted.
CREATE POLICY ad_campaign_events_public_insert ON public.ad_campaign_events
  FOR INSERT
  WITH CHECK (
    event_type IN ('page_view','cta_click','donation_started','donation_completed','impression')
    AND EXISTS (
      SELECT 1 FROM public.ad_campaigns c
      WHERE c.id = ad_campaign_events.campaign_id AND c.status = 'active'
    )
  );

-- Staff can read all events
CREATE POLICY ad_campaign_events_staff_read ON public.ad_campaign_events
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'case_manager'::public.app_role)
  );

CREATE POLICY ad_campaign_events_admin_delete ON public.ad_campaign_events
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));
