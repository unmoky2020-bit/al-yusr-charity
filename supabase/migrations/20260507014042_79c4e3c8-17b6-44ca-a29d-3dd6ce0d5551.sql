
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin', 'case_manager', 'volunteer', 'donor');
CREATE TYPE public.case_status AS ENUM ('draft', 'pending', 'approved', 'funded', 'closed', 'rejected');
CREATE TYPE public.urgency_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE public.gender AS ENUM ('male', 'female');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  city TEXT,
  avatar_url TEXT,
  bio TEXT,
  skills TEXT[] DEFAULT '{}',
  preferred_program TEXT,
  total_donated NUMERIC(12,2) NOT NULL DEFAULT 0,
  donations_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ============ has_role security definer ============
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- ============ Auto-create profile + default donor role on signup ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, city)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'city'
  );
  -- Default role from metadata, fallback donor
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'donor'::public.app_role)
  )
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ updated_at helper ============
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ CASE CATEGORIES (the 11 buckets) ============
CREATE TABLE public.case_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  icon TEXT,
  description_ar TEXT,
  description_en TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.case_categories ENABLE ROW LEVEL SECURITY;

INSERT INTO public.case_categories (slug, name_ar, name_en, icon, sort_order) VALUES
  ('medical-devices',     'حالات أجهزة طبية',                'Medical devices',         'Stethoscope', 1),
  ('medication',          'حالات علاج دوائي',                'Medication',              'Pill',        2),
  ('debt',                'حالات سداد ديون',                 'Debt relief',             'Banknote',    3),
  ('marriage',            'حالات تيسير الزواج',              'Marriage assistance',     'Heart',       4),
  ('medical-sessions',    'حالات جلسات طبية',                'Medical sessions',        'Activity',    5),
  ('prosthetics',         'حالات أطراف صناعية',              'Prosthetics',             'Accessibility', 6),
  ('irregular-medical',   'حالات خدمات طبية غير منتظمة',     'Irregular medical care',  'HeartPulse',  7),
  ('surgery',             'حالات عمليات جراحية',             'Surgery',                 'Scissors',    8),
  ('monthly-sponsorship', 'حالات كفالة شهرية',               'Monthly sponsorship',     'CalendarHeart', 9),
  ('medical-supplies',    'حالات مستلزمات طبية',             'Medical supplies',        'Package',     10),
  ('small-projects',      'حالات مشاريع صغيرة',              'Small projects',          'Briefcase',   11);

-- ============ CASES ============
CREATE TABLE public.cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_code TEXT UNIQUE NOT NULL DEFAULT ('C-' || to_char(now(),'YYYY') || '-' || lpad((floor(random()*99999))::TEXT, 5, '0')),
  category_id UUID NOT NULL REFERENCES public.case_categories(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  story TEXT NOT NULL DEFAULT '',
  beneficiary_name TEXT NOT NULL,
  beneficiary_age INT,
  beneficiary_gender public.gender,
  governorate TEXT NOT NULL DEFAULT 'الدقهلية',
  city TEXT,
  cover_image_url TEXT,
  needed_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  raised_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  deadline DATE,
  urgency public.urgency_level NOT NULL DEFAULT 'medium',
  status public.case_status NOT NULL DEFAULT 'draft',
  rejection_reason TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
CREATE INDEX cases_status_idx ON public.cases(status);
CREATE INDEX cases_category_idx ON public.cases(category_id);
CREATE TRIGGER cases_touch BEFORE UPDATE ON public.cases
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ CASE DOCUMENTS ============
CREATE TABLE public.case_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  doc_type TEXT NOT NULL DEFAULT 'document',
  caption TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.case_documents ENABLE ROW LEVEL SECURITY;

-- ============ CASE UPDATES (impact reports) ============
CREATE TABLE public.case_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.case_updates ENABLE ROW LEVEL SECURITY;

-- ============ DONATIONS (linked to case) ============
CREATE TABLE public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_code TEXT UNIQUE NOT NULL DEFAULT ('D-' || to_char(now(),'YYMMDD') || '-' || lpad((floor(random()*99999))::TEXT, 5, '0')),
  donor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  case_id UUID REFERENCES public.cases(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.case_categories(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'EGP',
  donor_name TEXT,
  donor_email TEXT,
  donor_phone TEXT,
  message TEXT,
  payment_method TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
CREATE INDEX donations_case_idx ON public.donations(case_id);
CREATE INDEX donations_donor_idx ON public.donations(donor_id);

-- ============ Auto-update raised_amount on donation insert ============
CREATE OR REPLACE FUNCTION public.bump_case_raised()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.case_id IS NOT NULL AND NEW.payment_status = 'paid' THEN
    UPDATE public.cases SET raised_amount = raised_amount + NEW.amount WHERE id = NEW.case_id;
    UPDATE public.cases SET status = 'funded'
      WHERE id = NEW.case_id AND raised_amount >= needed_amount AND status = 'approved';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER donations_bump AFTER INSERT ON public.donations
FOR EACH ROW EXECUTE FUNCTION public.bump_case_raised();

-- ============ RLS POLICIES ============
-- profiles: user can read/update own; admins/case_managers can read all
CREATE POLICY "profiles_self_select" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_admin_select" ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'case_manager'));
CREATE POLICY "profiles_self_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_admin_update" ON public.profiles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- user_roles: user reads own; only admins manage
CREATE POLICY "roles_self_select" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "roles_admin_all" ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- categories: public read; admin write
CREATE POLICY "categories_public_read" ON public.case_categories FOR SELECT USING (true);
CREATE POLICY "categories_admin_write" ON public.case_categories FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- cases: public reads only approved/funded; staff reads all; staff manages
CREATE POLICY "cases_public_read" ON public.cases FOR SELECT
  USING (status IN ('approved', 'funded', 'closed'));
CREATE POLICY "cases_staff_read" ON public.cases FOR SELECT
  USING (public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'case_manager')
      OR public.has_role(auth.uid(), 'volunteer'));
CREATE POLICY "cases_staff_insert" ON public.cases FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'case_manager'));
CREATE POLICY "cases_staff_update" ON public.cases FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'case_manager'));
CREATE POLICY "cases_admin_delete" ON public.cases FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- case_documents: public docs visible if parent case visible; staff full
CREATE POLICY "docs_public_read" ON public.case_documents FOR SELECT
  USING (is_public = true AND EXISTS (
    SELECT 1 FROM public.cases c WHERE c.id = case_id AND c.status IN ('approved','funded','closed')
  ));
CREATE POLICY "docs_staff_all" ON public.case_documents FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'case_manager'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'case_manager'));

-- case_updates: public read for visible cases; staff write
CREATE POLICY "updates_public_read" ON public.case_updates FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.cases c WHERE c.id = case_id AND c.status IN ('approved','funded','closed')
  ));
CREATE POLICY "updates_staff_all" ON public.case_updates FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'case_manager') OR public.has_role(auth.uid(), 'volunteer'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'case_manager') OR public.has_role(auth.uid(), 'volunteer'));

-- donations: donor reads own; staff reads all; anyone (anon) can insert (public donate form)
CREATE POLICY "donations_self_read" ON public.donations FOR SELECT USING (auth.uid() = donor_id);
CREATE POLICY "donations_staff_read" ON public.donations FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'case_manager'));
CREATE POLICY "donations_public_insert" ON public.donations FOR INSERT WITH CHECK (true);
CREATE POLICY "donations_admin_update" ON public.donations FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- ============ STORAGE BUCKETS ============
INSERT INTO storage.buckets (id, name, public) VALUES ('case-media', 'case-media', true)
  ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('case-documents', 'case-documents', false)
  ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
  ON CONFLICT (id) DO NOTHING;

-- public bucket: anyone reads case-media
CREATE POLICY "case_media_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'case-media');
CREATE POLICY "case_media_staff_write" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'case-media' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'case_manager') OR public.has_role(auth.uid(),'volunteer')));
CREATE POLICY "case_media_staff_update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'case-media' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'case_manager')));
CREATE POLICY "case_media_staff_delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'case-media' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'case_manager')));

-- private docs bucket: only staff
CREATE POLICY "case_docs_staff_all" ON storage.objects FOR ALL
  USING (bucket_id = 'case-documents' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'case_manager')))
  WITH CHECK (bucket_id = 'case-documents' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'case_manager')));

-- avatars bucket: user manages own folder; public read
CREATE POLICY "avatars_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatars_user_write" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "avatars_user_update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "avatars_user_delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
