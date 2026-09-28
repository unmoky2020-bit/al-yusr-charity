-- Editable site statistics (Stats section + Achievements + future sections)
CREATE TABLE IF NOT EXISTS public.site_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section text NOT NULL DEFAULT 'home_stats',  -- e.g. home_stats, achievements
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  -- Display
  label_ar text NOT NULL DEFAULT '',
  label_en text NOT NULL DEFAULT '',
  value_number numeric,                         -- numeric for count-up
  value_text text,                              -- override (e.g. "75K+")
  suffix_ar text DEFAULT '',
  suffix_en text DEFAULT '',
  -- Visual
  icon_name text,                               -- lucide icon name (e.g. "Users")
  image_url text,                               -- optional uploaded image (overrides icon)
  color_hint text,                              -- optional accent
  link_url text,                                -- optional link
  -- Meta
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

CREATE INDEX IF NOT EXISTS site_stats_section_idx ON public.site_stats(section, sort_order);

ALTER TABLE public.site_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY site_stats_public_read ON public.site_stats
  FOR SELECT USING (active = true);

CREATE POLICY site_stats_staff_read ON public.site_stats
  FOR SELECT USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'case_manager'::app_role));

CREATE POLICY site_stats_admin_write ON public.site_stats
  FOR ALL USING (has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER site_stats_touch BEFORE UPDATE ON public.site_stats
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Seed: Home stats (matches current hardcoded items)
INSERT INTO public.site_stats (section, sort_order, label_ar, label_en, value_number, suffix_ar, suffix_en, icon_name) VALUES
('home_stats', 1, 'أسرة بدعم نقدي 2026', 'Families supported 2026', 700, '+', '+', 'Home'),
('home_stats', 2, 'طالب تحت الكفالة', 'Students sponsored', 354, '', '', 'Users'),
('home_stats', 3, 'منزل تم تسقيفه (8,361م²)', 'Homes roofed (8,361 m²)', 70, '', '', 'Briefcase'),
('home_stats', 4, 'محافظات تواجد دائم', 'Permanent governorates', 5, '', '', 'MapPin'),
('home_stats', 5, 'لحوم بلدي 2026', 'Tons of meat 2026', 5, ' طن', 't', 'Beef'),
('home_stats', 6, 'الشفافية', 'Transparency', 99, '%', '%', 'ShieldCheck'),
-- Seed: Achievements
('achievements', 1, 'أسرة استفادت', 'Families helped', 75000, '+', '+', 'Heart'),
('achievements', 2, 'سنوات من العطاء', 'Years of giving', 12, '+', '+', 'Calendar'),
('achievements', 3, 'متطوع نشط', 'Active volunteers', 240, '+', '+', 'Users'),
('achievements', 4, 'مشروع منفذ', 'Projects delivered', 48, '', '', 'CheckCircle2');
