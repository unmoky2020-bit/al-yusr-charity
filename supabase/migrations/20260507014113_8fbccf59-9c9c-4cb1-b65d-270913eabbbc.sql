
-- 1) Fix function search_path
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE OR REPLACE FUNCTION public.bump_case_raised()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN
  IF NEW.case_id IS NOT NULL AND NEW.payment_status = 'paid' THEN
    UPDATE public.cases SET raised_amount = raised_amount + NEW.amount WHERE id = NEW.case_id;
    UPDATE public.cases SET status = 'funded'
      WHERE id = NEW.case_id AND raised_amount >= needed_amount AND status = 'approved';
  END IF;
  RETURN NEW;
END;
$$;

-- 2) Tighten donations insert policy
DROP POLICY IF EXISTS "donations_public_insert" ON public.donations;
CREATE POLICY "donations_insert_self_or_anon" ON public.donations FOR INSERT
  WITH CHECK (donor_id IS NULL OR donor_id = auth.uid());

-- 3) Drop broad listing on public storage buckets (CDN public URL still works)
DROP POLICY IF EXISTS "case_media_public_read" ON storage.objects;
DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;

-- 4) Revoke execute on SECURITY DEFINER functions from API roles (still works inside RLS/triggers)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
