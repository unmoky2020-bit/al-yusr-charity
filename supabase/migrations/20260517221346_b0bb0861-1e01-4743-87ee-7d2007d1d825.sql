
UPDATE public.donation_nodes
SET active = true, direct_checkout = false,
    title_ar = 'حملة مَرْكون',
    title_en = 'Markoun Campaign',
    description_ar = 'مرتبة، أجهزة كهربائية بسيطة، علاج شهري لمسنّ، أو مرتب صغير لأم معيلة — احتياجات أساسية بتغيّر يوم وعمر أسرة في الدقهلية.',
    description_en = 'A mattress, basic appliance, monthly elder meds, or small allowance for a widowed mother — life-changing essentials for Dakahlia families.',
    image_url = '/src/assets/markoun-poster-furniture.png',
    sort_order = 1
WHERE slug = 'markoun';

DO $$
DECLARE
  pid uuid;
  r record;
BEGIN
  SELECT id INTO pid FROM public.donation_nodes WHERE slug = 'markoun' LIMIT 1;
  IF pid IS NULL THEN RETURN; END IF;
  FOR r IN SELECT * FROM (VALUES
    ('markoun-meds',      'علاج شهري لمسنّ',      'Monthly meds for an elder',  'علاج شهري متكامل لمسنّ مع متابعة طبية وتسليم على الباب.',                  'Full monthly meds for an elder with follow-up and doorstep delivery.',          500,  1),
    ('markoun-mattress',  'مرتبة + لحاف',          'Mattress + duvet',           'مرتبة طبية ولحاف لبيت مفروش بالأرض — تغيّر نوم أسرة كاملة.',              'A medical mattress and duvet for a family sleeping on bare floor.',             1200, 2),
    ('markoun-appliance', 'جهاز كهربائي بسيط',    'Basic appliance',            'ثلاجة صغيرة، غسالة فول أوتوماتيك أو بوتاجاز — جهاز مجدّد بكفاءة عالية.', 'A small fridge, washer or stove — refurbished, high-efficiency.',               2500, 3),
    ('markoun-allowance', 'مرتب صغير لأم معيلة',  'Small stipend for a mother', 'دعم مالي شهري لأم تعيل أطفالها بعد فقد الزوج.',                            'Monthly stipend for a widowed mother supporting her children.',                 800,  4),
    ('markoun-furniture', 'أساسيات أثاث البيت',  'Home furniture basics',      'كنبة، طاولة، أو دولاب بسيط — أساسيات بتحفظ كرامة الأسرة.',                'Couch, table or wardrobe — basics that preserve dignity.',                      1800, 5),
    ('markoun-full-home', 'تجهيز بيت كامل',       'Full home setup',            'كفالة كاملة لتجهيز بيت أسرة (أثاث + أجهزة + مفروشات).',                    'Full sponsorship to outfit a family home (furniture + appliances + linens).',  7500, 6),
    ('markoun-any',       'أيّ مبلغ',              'Any amount',                 'ساهم بأي مبلغ يضاف لأقرب احتياج عاجل في حملة مَرْكون.',                   'Contribute any amount toward the next urgent Markoun need.',                    100,  98),
    ('markoun-whole',     'دعم الحملة كاملة',     'Support the whole campaign', 'تبرع موجّه لإدارة الحملة وتوزيعه على أكثر الحالات إلحاحًا.',                'Open donation routed to the most urgent Markoun cases.',                        250,  99)
  ) AS v(slug, title_ar, title_en, desc_ar, desc_en, amount, sort_order)
  LOOP
    IF EXISTS (SELECT 1 FROM public.donation_nodes WHERE slug = r.slug) THEN
      UPDATE public.donation_nodes
        SET parent_id = pid,
            type = 'option',
            title_ar = r.title_ar, title_en = r.title_en,
            description_ar = r.desc_ar, description_en = r.desc_en,
            amount = r.amount, sort_order = r.sort_order,
            active = true, direct_checkout = true
        WHERE slug = r.slug;
    ELSE
      INSERT INTO public.donation_nodes
        (slug, type, parent_id, title_ar, title_en, description_ar, description_en, amount, sort_order, active, direct_checkout)
        VALUES (r.slug, 'option', pid, r.title_ar, r.title_en, r.desc_ar, r.desc_en, r.amount, r.sort_order, true, true);
    END IF;
  END LOOP;
END $$;
