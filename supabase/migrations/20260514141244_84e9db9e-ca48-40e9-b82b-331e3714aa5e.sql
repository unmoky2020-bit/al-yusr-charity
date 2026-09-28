CREATE INDEX IF NOT EXISTS idx_donations_campaign_id ON public.donations (campaign_id);
CREATE INDEX IF NOT EXISTS idx_donations_payment_status ON public.donations (payment_status);
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON public.donations (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donations_utm_source ON public.donations (lower(utm_source));
CREATE INDEX IF NOT EXISTS idx_donations_utm_medium ON public.donations (lower(utm_medium));
CREATE INDEX IF NOT EXISTS idx_donations_utm_campaign ON public.donations (lower(utm_campaign));
CREATE INDEX IF NOT EXISTS idx_donations_utm_term ON public.donations (lower(utm_term));
CREATE INDEX IF NOT EXISTS idx_donations_utm_content ON public.donations (lower(utm_content));

CREATE INDEX IF NOT EXISTS idx_pt_campaign_id ON public.payment_transactions (campaign_id);
CREATE INDEX IF NOT EXISTS idx_pt_status ON public.payment_transactions (status);
CREATE INDEX IF NOT EXISTS idx_pt_created_at ON public.payment_transactions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pt_utm_source ON public.payment_transactions (lower(utm_source));
CREATE INDEX IF NOT EXISTS idx_pt_utm_medium ON public.payment_transactions (lower(utm_medium));
CREATE INDEX IF NOT EXISTS idx_pt_utm_campaign ON public.payment_transactions (lower(utm_campaign));
CREATE INDEX IF NOT EXISTS idx_pt_utm_term ON public.payment_transactions (lower(utm_term));
CREATE INDEX IF NOT EXISTS idx_pt_utm_content ON public.payment_transactions (lower(utm_content));