-- 1) Idempotency keys to prevent duplicate donations / transactions
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS idempotency_key text;
CREATE UNIQUE INDEX IF NOT EXISTS donations_idempotency_key_uniq
  ON public.donations(idempotency_key) WHERE idempotency_key IS NOT NULL;

ALTER TABLE public.payment_transactions ADD COLUMN IF NOT EXISTS idempotency_key text;
CREATE UNIQUE INDEX IF NOT EXISTS payment_transactions_idempotency_key_uniq
  ON public.payment_transactions(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS payment_transactions_provider_txn_uniq
  ON public.payment_transactions(provider, provider_txn_id) WHERE provider_txn_id IS NOT NULL;

-- 2) Payment methods registry
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  kind text NOT NULL DEFAULT 'manual', -- 'manual' | 'gateway'
  provider text,                       -- e.g. 'paymob', null for manual
  label_ar text NOT NULL,
  label_en text NOT NULL,
  account_label_ar text,
  account_label_en text,
  account_value text,
  instructions_ar text,
  instructions_en text,
  qr_image_url text,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY payment_methods_public_read ON public.payment_methods
  FOR SELECT USING (active = true);

CREATE POLICY payment_methods_admin_read ON public.payment_methods
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY payment_methods_admin_write ON public.payment_methods
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER payment_methods_touch
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 3) Seed defaults (only if empty)
INSERT INTO public.payment_methods (key, kind, provider, label_ar, label_en, account_label_ar, account_label_en, account_value, instructions_ar, instructions_en, active, sort_order)
SELECT * FROM (VALUES
  ('vodafone_cash','manual', NULL, 'Vodafone Cash','Vodafone Cash','رقم المؤسسة','Foundation number','01097000137',
    'حوّل المبلغ على رقم المؤسسة عبر Vodafone Cash ثم أرسل لقطة شاشة عبر واتساب لتأكيد التبرع.',
    'Transfer to the foundation number via Vodafone Cash then send a screenshot on WhatsApp to confirm.', true, 1),
  ('bank_misr','manual', NULL, 'بنك مصر','Banque Misr','رقم الحساب','Account number','27102380000000089',
    'حوّل المبلغ إلى حساب مؤسسة اليسر الخيرية ببنك مصر، واحتفظ بإيصال التحويل.',
    'Transfer to Al-Yusr Charity account at Banque Misr and keep your receipt.', true, 2),
  ('adib','manual', NULL, 'مصرف أبو ظبي الإسلامي','Abu Dhabi Islamic Bank (ADIB)','رقم الحساب','Account number','100001059161',
    'حوّل إلى حساب المؤسسة بمصرف أبو ظبي الإسلامي.',
    'Transfer to the foundation account at ADIB.', true, 3),
  ('cib','manual', NULL, 'البنك التجاري الدولي (CIB)','Commercial International Bank (CIB)','رقم الحساب','Account number','100043605733',
    'حوّل إلى حساب المؤسسة في CIB.',
    'Transfer to the foundation account at CIB.', true, 4),
  ('instapay','manual', NULL, 'InstaPay','InstaPay','معرّف InstaPay','InstaPay handle', NULL,
    'سيتم تفعيل التحويل عبر InstaPay قريبًا.',
    'InstaPay transfers will be enabled soon.', false, 5),
  ('paymob_card','gateway','paymob','Paymob — بطاقة','Paymob — Card', NULL, NULL, NULL,
    'سيتم تفعيل الدفع بالبطاقة عبر Paymob قريبًا.',
    'Card payments via Paymob will be enabled soon.', false, 6),
  ('paymob_wallet','gateway','paymob','Paymob — محفظة','Paymob — Wallet', NULL, NULL, NULL,
    'سيتم تفعيل الدفع بالمحفظة عبر Paymob قريبًا.',
    'Wallet payments via Paymob will be enabled soon.', false, 7)
) AS v(key, kind, provider, label_ar, label_en, account_label_ar, account_label_en, account_value, instructions_ar, instructions_en, active, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.payment_methods);