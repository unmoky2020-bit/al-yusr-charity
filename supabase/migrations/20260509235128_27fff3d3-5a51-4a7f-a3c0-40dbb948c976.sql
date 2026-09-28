
-- Enums
CREATE TYPE public.campaign_status AS ENUM ('draft','open','closed','completed','cancelled');
CREATE TYPE public.application_status AS ENUM ('pending','approved','rejected','waitlist','attended','noshow','cancelled');

-- Campaigns
CREATE TABLE public.volunteer_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  description_ar TEXT NOT NULL DEFAULT '',
  description_en TEXT NOT NULL DEFAULT '',
  event_date DATE NOT NULL,
  event_time TEXT,
  location TEXT NOT NULL DEFAULT '',
  governorate TEXT NOT NULL DEFAULT 'الدقهلية',
  city TEXT,
  slots_needed INTEGER NOT NULL DEFAULT 0 CHECK (slots_needed >= 0),
  slots_filled INTEGER NOT NULL DEFAULT 0 CHECK (slots_filled >= 0),
  required_skills TEXT[] NOT NULL DEFAULT '{}',
  cover_image_url TEXT,
  status public.campaign_status NOT NULL DEFAULT 'draft',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_campaigns_status ON public.volunteer_campaigns(status);
CREATE INDEX idx_campaigns_event_date ON public.volunteer_campaigns(event_date);

ALTER TABLE public.volunteer_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaigns_public_read" ON public.volunteer_campaigns
  FOR SELECT USING (status IN ('open','closed','completed'));
CREATE POLICY "campaigns_staff_read" ON public.volunteer_campaigns
  FOR SELECT USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'case_manager'));
CREATE POLICY "campaigns_staff_insert" ON public.volunteer_campaigns
  FOR INSERT WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'case_manager'));
CREATE POLICY "campaigns_staff_update" ON public.volunteer_campaigns
  FOR UPDATE USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'case_manager'));
CREATE POLICY "campaigns_admin_delete" ON public.volunteer_campaigns
  FOR DELETE USING (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_campaigns_updated_at
BEFORE UPDATE ON public.volunteer_campaigns
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Applications
CREATE TABLE public.volunteer_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.volunteer_campaigns(id) ON DELETE CASCADE,
  volunteer_id UUID,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  city TEXT,
  skills TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT,
  assigned_role TEXT,
  shift TEXT,
  status public.application_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_applications_campaign ON public.volunteer_applications(campaign_id);
CREATE INDEX idx_applications_volunteer ON public.volunteer_applications(volunteer_id);
CREATE INDEX idx_applications_status ON public.volunteer_applications(status);

ALTER TABLE public.volunteer_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "applications_self_read" ON public.volunteer_applications
  FOR SELECT USING (auth.uid() = volunteer_id);
CREATE POLICY "applications_staff_read" ON public.volunteer_applications
  FOR SELECT USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'case_manager'));
CREATE POLICY "applications_insert_self_or_anon" ON public.volunteer_applications
  FOR INSERT WITH CHECK (volunteer_id IS NULL OR volunteer_id = auth.uid());
CREATE POLICY "applications_staff_update" ON public.volunteer_applications
  FOR UPDATE USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'case_manager'));
CREATE POLICY "applications_admin_delete" ON public.volunteer_applications
  FOR DELETE USING (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_applications_updated_at
BEFORE UPDATE ON public.volunteer_applications
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Slots auto-counter
CREATE OR REPLACE FUNCTION public.recount_campaign_slots()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE cid UUID;
BEGIN
  cid := COALESCE(NEW.campaign_id, OLD.campaign_id);
  UPDATE public.volunteer_campaigns
     SET slots_filled = (
       SELECT COUNT(*) FROM public.volunteer_applications
        WHERE campaign_id = cid AND status IN ('approved','attended')
     )
   WHERE id = cid;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_app_slots_ins
AFTER INSERT ON public.volunteer_applications
FOR EACH ROW EXECUTE FUNCTION public.recount_campaign_slots();

CREATE TRIGGER trg_app_slots_upd
AFTER UPDATE OF status ON public.volunteer_applications
FOR EACH ROW EXECUTE FUNCTION public.recount_campaign_slots();

CREATE TRIGGER trg_app_slots_del
AFTER DELETE ON public.volunteer_applications
FOR EACH ROW EXECUTE FUNCTION public.recount_campaign_slots();
