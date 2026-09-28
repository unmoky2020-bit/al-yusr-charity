
-- Activity log
CREATE TABLE IF NOT EXISTS public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  actor_name text,
  actor_role text,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  summary text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS activity_log_created_at_idx ON public.activity_log (created_at DESC);
CREATE INDEX IF NOT EXISTS activity_log_actor_idx ON public.activity_log (actor_id);
CREATE INDEX IF NOT EXISTS activity_log_entity_idx ON public.activity_log (entity_type, entity_id);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_log_admin_read" ON public.activity_log
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "activity_log_self_read" ON public.activity_log
  FOR SELECT USING (auth.uid() = actor_id);

-- Any authenticated user can insert their own action row
CREATE POLICY "activity_log_authed_insert" ON public.activity_log
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND (actor_id IS NULL OR actor_id = auth.uid()));

-- Per-admin granular module scopes
CREATE TABLE IF NOT EXISTS public.admin_module_scopes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  module text NOT NULL,
  can_read boolean NOT NULL DEFAULT true,
  can_write boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module)
);

ALTER TABLE public.admin_module_scopes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_scopes_admin_all" ON public.admin_module_scopes
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admin_scopes_self_read" ON public.admin_module_scopes
  FOR SELECT USING (auth.uid() = user_id);

CREATE TRIGGER trg_admin_scopes_touch
  BEFORE UPDATE ON public.admin_module_scopes
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
