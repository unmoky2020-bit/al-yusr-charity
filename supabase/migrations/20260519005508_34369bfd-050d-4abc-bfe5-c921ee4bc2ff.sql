-- Keep the donation tree canonical: root level is sectors only.
-- Old root-level program duplicates are hidden so they no longer render as closed cards.
UPDATE public.donation_nodes root_node
SET active = false
WHERE root_node.parent_id IS NULL
  AND root_node.type = 'program'
  AND root_node.slug <> 'general'
  AND EXISTS (
    SELECT 1
    FROM public.donation_nodes child_node
    WHERE child_node.slug = root_node.slug
      AND child_node.parent_id IS NOT NULL
      AND child_node.active = true
  );

-- Hide database-level "general" duplicates; the UI renders one accurate synthetic general choice.
UPDATE public.donation_nodes
SET active = false
WHERE slug = 'general';

-- Ensure the two special sectors are active at the root.
UPDATE public.donation_nodes
SET active = true,
    direct_checkout = false
WHERE slug IN ('sector-odhya', 'sector-zakat');

-- Ensure Zakat remains a single direct donation under its sector.
UPDATE public.donation_nodes zakat
SET active = true,
    direct_checkout = true,
    parent_id = (SELECT id FROM public.donation_nodes WHERE slug = 'sector-zakat' AND parent_id IS NULL LIMIT 1)
WHERE zakat.slug = 'zakat'
  AND zakat.parent_id IS NOT NULL;

-- Ensure Udhiya remains a program under its sector and drills into voucher options.
UPDATE public.donation_nodes odhya
SET active = true,
    direct_checkout = false,
    parent_id = (SELECT id FROM public.donation_nodes WHERE slug = 'sector-odhya' AND parent_id IS NULL LIMIT 1)
WHERE odhya.slug = 'odhya'
  AND odhya.parent_id IS NOT NULL;

-- Ensure Udhiya voucher options are active final donation endpoints.
UPDATE public.donation_nodes
SET active = true,
    direct_checkout = true
WHERE slug IN ('qurbani-sheep-local','qurbani-sheep-import','qurbani-cow-share','qurbani-cow-full');

-- Ensure food sector programs and monthly food activities are active and correctly classified.
UPDATE public.donation_nodes
SET active = true,
    direct_checkout = false
WHERE slug = 'food'
  AND parent_id = (SELECT id FROM public.donation_nodes WHERE slug = 'sector-food' AND parent_id IS NULL LIMIT 1);

UPDATE public.donation_nodes
SET active = true,
    direct_checkout = true
WHERE slug IN ('kitchen','bakery')
  AND parent_id = (SELECT id FROM public.donation_nodes WHERE slug = 'sector-food' AND parent_id IS NULL LIMIT 1);

UPDATE public.donation_nodes
SET active = true,
    direct_checkout = true
WHERE slug IN ('food-box-25','food-hot-meal','food-kitchen','food-bread','food-meat-kilo')
  AND parent_id = (SELECT id FROM public.donation_nodes WHERE slug = 'food' AND parent_id IS NOT NULL LIMIT 1);

-- Keep the duplicate carton+meat program under Food hidden; monthly food already contains this as an activity.
UPDATE public.donation_nodes
SET active = false
WHERE slug = 'box'
  AND parent_id = (SELECT id FROM public.donation_nodes WHERE slug = 'sector-food' AND parent_id IS NULL LIMIT 1);