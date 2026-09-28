
CREATE TABLE IF NOT EXISTS public.newsletter_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL DEFAULT '',
  preheader text,
  html text NOT NULL DEFAULT '',
  text_body text,
  from_name text NOT NULL DEFAULT 'مؤسسة اليسر',
  from_email text,
  reply_to text,
  status text NOT NULL DEFAULT 'draft', -- draft|scheduled|sending|sent|failed
  provider text NOT NULL DEFAULT 'smtp', -- smtp|reach|lovable
  scheduled_at timestamptz,
  sent_at timestamptz,
  recipients_count int NOT NULL DEFAULT 0,
  sent_count int NOT NULL DEFAULT 0,
  failed_count int NOT NULL DEFAULT 0,
  opened_count int NOT NULL DEFAULT 0,
  clicked_count int NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.newsletter_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaigns_admin_all" ON public.newsletter_campaigns
  FOR ALL USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_newsletter_campaigns_touch
  BEFORE UPDATE ON public.newsletter_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.newsletter_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.newsletter_campaigns(id) ON DELETE CASCADE,
  subscriber_id uuid REFERENCES public.newsletter_subscribers(id) ON DELETE SET NULL,
  email text NOT NULL,
  status text NOT NULL DEFAULT 'queued', -- queued|sent|failed|bounced
  track_token uuid NOT NULL DEFAULT gen_random_uuid(),
  opened_at timestamptz,
  clicked_at timestamptz,
  click_url text,
  error text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_newsletter_sends_campaign ON public.newsletter_sends(campaign_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_sends_token ON public.newsletter_sends(track_token);

ALTER TABLE public.newsletter_sends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sends_admin_all" ON public.newsletter_sends
  FOR ALL USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
