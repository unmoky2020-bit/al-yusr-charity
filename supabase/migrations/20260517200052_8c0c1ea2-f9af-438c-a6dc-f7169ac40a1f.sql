INSERT INTO public.donation_nodes
  (parent_id, type, slug, title_ar, title_en, description_ar, description_en, active, direct_checkout, sort_order)
SELECT NULL, 'sector', 'sector-odhya', 'صك الأضحية', 'Qurbani',
       'صكوك أضحية موثّقة بالصور والفيديو — خروف، عجل أو سهم.',
       'Documented Qurbani shares — sheep, full cow or cow-share.',
       true, false, 7
WHERE NOT EXISTS (SELECT 1 FROM public.donation_nodes WHERE slug = 'sector-odhya');

UPDATE public.donation_nodes
SET parent_id = (SELECT id FROM public.donation_nodes WHERE slug = 'sector-odhya')
WHERE slug = 'odhya';

UPDATE public.donation_nodes SET sort_order = 8 WHERE slug = 'sector-zakat';