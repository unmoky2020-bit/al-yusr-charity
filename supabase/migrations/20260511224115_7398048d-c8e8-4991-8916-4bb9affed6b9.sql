-- =========================================================
-- 1) donation_nodes: hierarchical donation tree
-- =========================================================
CREATE TYPE public.donation_node_type AS ENUM ('program','project','campaign','option');

CREATE TABLE public.donation_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES public.donation_nodes(id) ON DELETE CASCADE,
  type public.donation_node_type NOT NULL DEFAULT 'program',
  slug TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL DEFAULT '',
  description_ar TEXT,
  description_en TEXT,
  image_url TEXT,
  amount NUMERIC,                 -- fixed price for option, nullable
  target_amount NUMERIC,          -- goal
  collected_amount NUMERIC NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  direct_checkout BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (parent_id, slug)
);

CREATE INDEX idx_donation_nodes_parent ON public.donation_nodes(parent_id);
CREATE INDEX idx_donation_nodes_active ON public.donation_nodes(active) WHERE active = true;
CREATE INDEX idx_donation_nodes_type ON public.donation_nodes(type);

ALTER TABLE public.donation_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY donation_nodes_public_read ON public.donation_nodes
  FOR SELECT USING (active = true);
CREATE POLICY donation_nodes_admin_read ON public.donation_nodes
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'case_manager'::public.app_role));
CREATE POLICY donation_nodes_admin_write ON public.donation_nodes
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER trg_donation_nodes_updated
BEFORE UPDATE ON public.donation_nodes
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =========================================================
-- 2) payment_transactions
-- =========================================================
CREATE TABLE public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_code TEXT NOT NULL DEFAULT ('PT-' || to_char(now(),'YYMMDD') || '-' || lpad(floor(random()*99999)::text,5,'0')),
  donation_id UUID,                          -- optional link to donations.id
  node_id UUID REFERENCES public.donation_nodes(id) ON DELETE SET NULL,
  case_id UUID,                              -- optional link to cases.id
  donor_id UUID,                             -- nullable for guest donations
  donor_name TEXT,
  donor_email TEXT,
  donor_phone TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EGP',
  provider TEXT NOT NULL DEFAULT 'paymob',   -- paymob | vodafone | instapay | bank
  method TEXT,                                -- card | wallet | instapay | bank
  status TEXT NOT NULL DEFAULT 'pending',     -- pending|processing|paid|failed|refunded
  provider_order_id TEXT,
  provider_txn_id TEXT,
  redirect_url TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_pt_donor ON public.payment_transactions(donor_id);
CREATE INDEX idx_pt_status ON public.payment_transactions(status);
CREATE INDEX idx_pt_provider_order ON public.payment_transactions(provider_order_id);

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY pt_public_insert ON public.payment_transactions
  FOR INSERT WITH CHECK (donor_id IS NULL OR donor_id = auth.uid());
CREATE POLICY pt_self_read ON public.payment_transactions
  FOR SELECT USING (auth.uid() = donor_id);
CREATE POLICY pt_admin_all ON public.payment_transactions
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'case_manager'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'case_manager'::public.app_role));

CREATE TRIGGER trg_pt_updated BEFORE UPDATE ON public.payment_transactions
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =========================================================
-- 3) payment_webhooks (audit log)
-- =========================================================
CREATE TABLE public.payment_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL DEFAULT 'paymob',
  event_type TEXT,
  transaction_id UUID REFERENCES public.payment_transactions(id) ON DELETE SET NULL,
  raw JSONB NOT NULL,
  signature TEXT,
  signature_valid BOOLEAN,
  processed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_webhooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY pw_admin_all ON public.payment_webhooks
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- =========================================================
-- 4) Seed initial root programs (idempotent inserts via slug)
-- =========================================================
INSERT INTO public.donation_nodes (slug,type,title_ar,title_en,direct_checkout,sort_order,active) VALUES
  ('general','program','تبرع عام','General Donation', true, 0, true),
  ('water','program','وصلة مياه','Water Connection', true, 1, true),
  ('zakat','program','زكاة المال','Zakat', true, 2, true),
  ('odhya','program','صك الأضحية','Qurbani Voucher', false, 3, true),
  ('satr','program','برنامج ستر','Satr Program', false, 4, true),
  ('food','program','الغذاء الشهري','Monthly Food', false, 5, true),
  ('orphans','program','كفالة اليتيم','Orphan Sponsorship', true, 6, true),
  ('treatment','program','سهم العلاج','Treatment Share', true, 7, true)
ON CONFLICT DO NOTHING;

-- Children for Satr
WITH p AS (SELECT id FROM public.donation_nodes WHERE slug='satr' AND parent_id IS NULL)
INSERT INTO public.donation_nodes (parent_id,slug,type,title_ar,title_en,amount,sort_order)
SELECT p.id, x.slug, 'option', x.ar, x.en, x.amt, x.so FROM p, (VALUES
  ('satr-roof','سقف','Roof', 5000, 1),
  ('satr-quilt','لحاف','Quilt', 250, 2),
  ('satr-mattress','مراتب','Mattresses', 600, 3),
  ('satr-clothing','كسوة','Clothing', 350, 4),
  ('satr-doors','أبواب وشبابيك','Doors & Windows', 1500, 5)
) AS x(slug,ar,en,amt,so);

-- Children for Qurbani
WITH p AS (SELECT id FROM public.donation_nodes WHERE slug='odhya' AND parent_id IS NULL)
INSERT INTO public.donation_nodes (parent_id,slug,type,title_ar,title_en,amount,sort_order)
SELECT p.id, x.slug, 'option', x.ar, x.en, x.amt, x.so FROM p, (VALUES
  ('qurbani-sheep-local','خروف بلدي','Local Sheep', 7500, 1),
  ('qurbani-sheep-import','خروف مستورد','Imported Sheep', 5500, 2),
  ('qurbani-cow-share','سهم عجل','Cow Share', 3500, 3),
  ('qurbani-cow-full','عجل كامل','Full Cow', 28000, 4)
) AS x(slug,ar,en,amt,so);

-- Children for Food
WITH p AS (SELECT id FROM public.donation_nodes WHERE slug='food' AND parent_id IS NULL)
INSERT INTO public.donation_nodes (parent_id,slug,type,title_ar,title_en,amount,sort_order)
SELECT p.id, x.slug, 'option', x.ar, x.en, x.amt, x.so FROM p, (VALUES
  ('food-box-25','كرتونة 25 كيلو','25kg Food Box', 750, 1),
  ('food-hot-meal','وجبة ساخنة','Hot Meal', 35, 2),
  ('food-kitchen','مطبخ اليسر','Al-Yusr Kitchen', 1000, 3),
  ('food-bread','خبز يومي','Daily Bread', 200, 4)
) AS x(slug,ar,en,amt,so);
