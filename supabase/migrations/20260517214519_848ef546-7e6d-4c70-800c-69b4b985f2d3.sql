
-- 1) Close the Qurbani sector + program + all its options (sold out / closed)
UPDATE public.donation_nodes
SET active = false
WHERE slug IN (
  'sector-odhya',
  'odhya',
  'qurbani-sheep-local',
  'qurbani-sheep-import',
  'qurbani-cow-share',
  'qurbani-cow-full'
);

-- 2) Remove "تطوع معنا" from donation tree (it's not a donation)
UPDATE public.donation_nodes
SET active = false
WHERE slug = 'volunteer';

-- 3) Remove "مركون" from donation tree (it's a reverse donation — physical items, not money)
UPDATE public.donation_nodes
SET active = false
WHERE slug = 'markoun';

-- 4) Deduplicate Shelter: deactivate the legacy 'satr' duplicate and its options;
--    canonical program is 'shelter' (already has lihaf, mattress, clothing, doors).
UPDATE public.donation_nodes
SET active = false
WHERE slug IN ('satr', 'satr-quilt', 'satr-mattress', 'satr-clothing', 'satr-doors');

-- 5) Food sector: make program 'food' direct donation (carton + meat + hot meals + bread)
--    and ensure existing options are visible. Also expose top-level direct items.
UPDATE public.donation_nodes
SET direct_checkout = false  -- still parent; show its child options
WHERE slug = 'food';

-- Ensure food options are active and ordered
UPDATE public.donation_nodes SET active = true WHERE slug IN ('food-box-25','food-hot-meal','food-kitchen','food-bread');

-- Add a "Daily bread / Bakery" program as a separate top-level food item if missing
INSERT INTO public.donation_nodes
  (parent_id, type, slug, title_ar, title_en, description_ar, description_en, amount, direct_checkout, active, sort_order)
SELECT
  (SELECT id FROM public.donation_nodes WHERE slug = 'sector-food'),
  'program', 'bakery', 'مخبز اليسر — خبز يومي', 'Al-Yusr Bakery — Daily bread',
  'دعم خط إنتاج الخبز اليومي للأسر الأكثر احتياجًا.',
  'Support the daily bread production line for the neediest families.',
  200, true, true, 11
WHERE NOT EXISTS (SELECT 1 FROM public.donation_nodes WHERE slug = 'bakery');

-- 6) Add "Support whole program" direct-checkout child to each non-direct program
--    (gives donors a one-click way to back the entire program from the options grid).
INSERT INTO public.donation_nodes
  (parent_id, type, slug, title_ar, title_en, description_ar, description_en, amount, direct_checkout, active, sort_order)
SELECT p.id, 'option',
       p.slug || '-whole',
       'دعم البرنامج بالكامل',
       'Support the whole program',
       'تبرع مرن لدعم كل أنشطة البرنامج — نحن نوزّعه على الأولويات.',
       'Flexible donation supporting all program activities — we allocate to priorities.',
       NULL, true, true, 99
FROM public.donation_nodes p
WHERE p.type = 'program'
  AND p.active = true
  AND p.slug IN ('shelter','food','treatment','prosthetics','orphans','bride','education','water','zakat','box','kitchen','bakery')
  AND NOT EXISTS (SELECT 1 FROM public.donation_nodes c WHERE c.slug = p.slug || '-whole');

-- 7) Shelter program: ensure parent shows its options grid (not direct checkout)
UPDATE public.donation_nodes SET direct_checkout = false WHERE slug = 'shelter';
