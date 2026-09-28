
-- Lock down SECURITY DEFINER fn — only postgres / pg_cron may call it
REVOKE EXECUTE ON FUNCTION public.publish_scheduled_posts() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.publish_scheduled_posts() FROM anon, authenticated;
