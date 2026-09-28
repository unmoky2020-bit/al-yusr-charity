REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.bump_case_raised() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.adjust_case_raised_on_update() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_donation_status() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recount_campaign_slots() FROM PUBLIC, anon, authenticated;