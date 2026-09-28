ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES public.ad_campaigns(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_donations_campaign_id ON public.donations(campaign_id);
NOTIFY pgrst, 'reload schema';