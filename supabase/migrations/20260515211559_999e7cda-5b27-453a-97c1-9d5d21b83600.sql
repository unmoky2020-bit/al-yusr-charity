CREATE OR REPLACE FUNCTION public.audit_donation_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name text;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    SELECT NULLIF(full_name, '') INTO v_name
    FROM public.profiles
    WHERE id = auth.uid();
  END IF;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.donation_status_audit (
      donation_id, old_status, new_status, changed_by, changed_by_label, source, note
    ) VALUES (
      NEW.id,
      NULL,
      NEW.payment_status,
      auth.uid(),
      COALESCE(v_name, CASE WHEN auth.uid() IS NULL THEN 'system' ELSE 'authenticated user' END),
      'created',
      'Donation created'
    );
    RETURN NEW;
  END IF;

  IF OLD.payment_status IS DISTINCT FROM NEW.payment_status THEN
    INSERT INTO public.donation_status_audit (
      donation_id, old_status, new_status, changed_by, changed_by_label, source, note
    ) VALUES (
      NEW.id,
      OLD.payment_status,
      NEW.payment_status,
      auth.uid(),
      COALESCE(v_name, CASE WHEN auth.uid() IS NULL THEN 'system/webhook' ELSE 'authenticated user' END),
      CASE WHEN auth.uid() IS NULL THEN 'webhook' ELSE 'admin' END,
      NULL
    );
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.audit_donation_status_change() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.audit_donation_status_change() FROM anon;
REVOKE ALL ON FUNCTION public.audit_donation_status_change() FROM authenticated;