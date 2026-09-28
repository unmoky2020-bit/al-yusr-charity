ALTER TABLE public.donations ADD CONSTRAINT donations_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.ad_campaigns(id) ON DELETE SET NULL;
NOTIFY pgrst, 'reload schema';