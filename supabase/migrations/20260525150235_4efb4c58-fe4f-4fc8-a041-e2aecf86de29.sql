
UPDATE public.site_stats SET active=false WHERE section='home_stats';

INSERT INTO public.site_stats (section, sort_order, active, label_ar, label_en, value_number, suffix_ar, suffix_en, icon_name) VALUES
('home_stats', 1, true, 'أسرة مستحقة', 'Families supported', 13267, '', '', 'Users'),
('home_stats', 2, true, 'طالب تحت الكفالة', 'Students sponsored', 2983, '', '', 'GraduationCap'),
('home_stats', 3, true, 'سقف منزل', 'Home roofs built', 1000, '+', '+', 'Home'),
('home_stats', 4, true, 'وصلة مياه', 'Water connections', 1750, '', '', 'Droplets'),
('home_stats', 5, true, 'محافظات تواجد دائم', 'Active governorates', 5, '', '', 'MapPin'),
('home_stats', 6, true, 'لحوم بلدي سنويًا', 'Local meat per year', 5, ' طن', ' tons', 'Beef');
