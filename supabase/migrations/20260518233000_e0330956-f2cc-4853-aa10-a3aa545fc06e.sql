DELETE FROM public.donation_nodes WHERE slug = 'food-meat-kilo';
INSERT INTO public.donation_nodes (parent_id, type, slug, title_ar, title_en, description_ar, description_en, amount, active, direct_checkout, sort_order)
VALUES (
  '683b24fc-c6f1-41b9-8f74-3daf89002a1e',
  'option',
  'food-meat-kilo',
  'كيلو لحمة بلدي',
  '1 kg of local meat',
  'كيلو لحمة بلدي طازجة لأسرة محتاجة ضمن كرتونة الغذاء الشهري.',
  '1 kg of fresh local meat for a needy family as part of the monthly food box.',
  450,
  true,
  true,
  6
);
UPDATE public.donation_nodes SET active = false WHERE slug = 'food-whole';