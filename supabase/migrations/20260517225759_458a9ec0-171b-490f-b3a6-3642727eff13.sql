UPDATE public.donation_nodes
SET active = true
WHERE slug IN (
  'sector-odhya',
  'odhya',
  'qurbani-sheep-local',
  'qurbani-sheep-import',
  'qurbani-cow-share',
  'qurbani-cow-full'
);