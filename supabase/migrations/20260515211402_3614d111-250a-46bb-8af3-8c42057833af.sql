REVOKE ALL ON FUNCTION public.audit_donation_status_change() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.audit_donation_status_change() FROM anon;
REVOKE ALL ON FUNCTION public.audit_donation_status_change() FROM authenticated;

DROP FUNCTION IF EXISTS public.set_donation_payment_status(uuid, text, text);