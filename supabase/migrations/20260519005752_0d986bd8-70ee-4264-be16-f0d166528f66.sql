-- Root level should be sectors only; the UI renders the single synthetic general donation separately.
UPDATE public.donation_nodes
SET active = false
WHERE parent_id IS NULL
  AND type = 'program';

-- All sectors are navigation choices, not direct checkout endpoints at the root.
UPDATE public.donation_nodes
SET active = true,
    direct_checkout = false
WHERE parent_id IS NULL
  AND type = 'sector';

-- Keep non-donation/old duplicate root entries hidden explicitly.
UPDATE public.donation_nodes
SET active = false
WHERE parent_id IS NULL
  AND slug IN ('box','volunteer','markoun','general','zakat','odhya','water','education','bride','shelter','orphans','treatment','prosthetics','kitchen');