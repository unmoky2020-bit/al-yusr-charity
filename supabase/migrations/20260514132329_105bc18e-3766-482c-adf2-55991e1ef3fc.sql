-- Restrict SECURITY DEFINER helpers from being callable by anon / authenticated users.
REVOKE EXECUTE ON FUNCTION public.publish_scheduled_posts() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_case_status_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_application_status_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.stories_review_sync() FROM PUBLIC, anon, authenticated;