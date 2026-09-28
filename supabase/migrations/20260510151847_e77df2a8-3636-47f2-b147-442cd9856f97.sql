
-- 1. notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  title_ar TEXT NOT NULL DEFAULT '',
  title_en TEXT NOT NULL DEFAULT '',
  message_ar TEXT NOT NULL DEFAULT '',
  message_en TEXT NOT NULL DEFAULT '',
  link TEXT,
  entity_type TEXT,
  entity_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications(user_id) WHERE is_read = false;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notifications_self_read ON public.notifications;
CREATE POLICY notifications_self_read ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS notifications_self_update ON public.notifications;
CREATE POLICY notifications_self_update ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS notifications_self_delete ON public.notifications;
CREATE POLICY notifications_self_delete ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS notifications_staff_insert ON public.notifications;
CREATE POLICY notifications_staff_insert ON public.notifications
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'case_manager'::app_role)
  );

DROP POLICY IF EXISTS notifications_admin_all ON public.notifications;
CREATE POLICY notifications_admin_all ON public.notifications
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. Trigger function for cases status change
CREATE OR REPLACE FUNCTION public.notify_case_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title_ar TEXT;
  v_title_en TEXT;
  v_msg_ar TEXT;
  v_msg_en TEXT;
  v_type TEXT;
BEGIN
  IF NEW.created_by IS NULL THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status IS NOT DISTINCT FROM NEW.status THEN RETURN NEW; END IF;

  IF NEW.status::text = 'approved' THEN
    v_type := 'success';
    v_title_ar := 'تم قبول الحالة ✅';
    v_title_en := 'Case approved ✅';
    v_msg_ar := 'تم قبول الحالة "' || NEW.title || '" ونشرها.';
    v_msg_en := 'Your case "' || NEW.title || '" was approved and published.';
  ELSIF NEW.status::text = 'rejected' THEN
    v_type := 'error';
    v_title_ar := 'تم رفض الحالة';
    v_title_en := 'Case rejected';
    v_msg_ar := COALESCE('سبب الرفض: ' || NEW.rejection_reason, 'تم رفض الحالة "' || NEW.title || '".');
    v_msg_en := COALESCE('Reason: ' || NEW.rejection_reason, 'Your case "' || NEW.title || '" was rejected.');
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (user_id, type, title_ar, title_en, message_ar, message_en, link, entity_type, entity_id)
  VALUES (NEW.created_by, v_type, v_title_ar, v_title_en, v_msg_ar, v_msg_en,
          '/admin/review', 'case', NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_case_status ON public.cases;
CREATE TRIGGER trg_notify_case_status
  AFTER INSERT OR UPDATE OF status ON public.cases
  FOR EACH ROW EXECUTE FUNCTION public.notify_case_status_change();

-- 3. Trigger function for volunteer_applications status change
CREATE OR REPLACE FUNCTION public.notify_application_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title_ar TEXT;
  v_title_en TEXT;
  v_msg_ar TEXT;
  v_msg_en TEXT;
  v_type TEXT;
BEGIN
  IF NEW.volunteer_id IS NULL THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status IS NOT DISTINCT FROM NEW.status THEN RETURN NEW; END IF;

  IF NEW.status::text = 'approved' THEN
    v_type := 'success';
    v_title_ar := 'تم قبول طلب التطوع 🎉';
    v_title_en := 'Volunteer application approved 🎉';
    v_msg_ar := 'تم قبول طلبك للمشاركة. تحقق من المهام.';
    v_msg_en := 'Your application was approved. Check your tasks.';
  ELSIF NEW.status::text = 'rejected' THEN
    v_type := 'error';
    v_title_ar := 'تم رفض طلب التطوع';
    v_title_en := 'Volunteer application rejected';
    v_msg_ar := COALESCE('السبب: ' || NEW.notes, 'تم رفض طلبك. يمكنك التقديم على حملات أخرى.');
    v_msg_en := COALESCE('Reason: ' || NEW.notes, 'Your application was rejected. You can apply to other campaigns.');
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (user_id, type, title_ar, title_en, message_ar, message_en, link, entity_type, entity_id)
  VALUES (NEW.volunteer_id, v_type, v_title_ar, v_title_en, v_msg_ar, v_msg_en,
          '/admin/my-tasks', 'application', NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_application_status ON public.volunteer_applications;
CREATE TRIGGER trg_notify_application_status
  AFTER INSERT OR UPDATE OF status ON public.volunteer_applications
  FOR EACH ROW EXECUTE FUNCTION public.notify_application_status_change();

-- 4. Realtime
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications';
  END IF;
END $$;
