
-- Khabia (savings can) requests
CREATE TYPE public.khabia_status AS ENUM ('pending','preparing','delivered','collected','cancelled');

CREATE TABLE public.khabia_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_code TEXT NOT NULL DEFAULT ('KH-' || to_char(now(),'YYMMDD') || '-' || lpad(floor(random()*99999)::text, 5, '0')),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT,
  notes TEXT,
  status public.khabia_status NOT NULL DEFAULT 'pending',
  delegate_name TEXT,
  scheduled_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  collected_at TIMESTAMPTZ,
  amount_collected NUMERIC,
  ip_hash TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_khabia_status ON public.khabia_requests(status);
CREATE INDEX idx_khabia_created ON public.khabia_requests(created_at DESC);

ALTER TABLE public.khabia_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "khabia_public_insert" ON public.khabia_requests
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "khabia_staff_read" ON public.khabia_requests
  FOR SELECT TO public
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'case_manager'));

CREATE POLICY "khabia_staff_update" ON public.khabia_requests
  FOR UPDATE TO public
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'case_manager'));

CREATE POLICY "khabia_admin_delete" ON public.khabia_requests
  FOR DELETE TO public USING (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER khabia_touch_updated_at
  BEFORE UPDATE ON public.khabia_requests
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


-- Contact messages
CREATE TABLE public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_code TEXT NOT NULL DEFAULT ('M-' || to_char(now(),'YYMMDD') || '-' || lpad(floor(random()*99999)::text, 5, '0')),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  section TEXT NOT NULL DEFAULT 'general',
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  replied_at TIMESTAMPTZ,
  ip_hash TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_contact_created ON public.contact_messages(created_at DESC);
CREATE INDEX idx_contact_read ON public.contact_messages(is_read);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contact_public_insert" ON public.contact_messages
  FOR INSERT TO public
  WITH CHECK (
    char_length(name) BETWEEN 2 AND 100
    AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    AND char_length(message) BETWEEN 5 AND 2000
  );

CREATE POLICY "contact_staff_read" ON public.contact_messages
  FOR SELECT TO public
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'case_manager'));

CREATE POLICY "contact_staff_update" ON public.contact_messages
  FOR UPDATE TO public
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'case_manager'));

CREATE POLICY "contact_admin_delete" ON public.contact_messages
  FOR DELETE TO public USING (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER contact_touch_updated_at
  BEFORE UPDATE ON public.contact_messages
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
