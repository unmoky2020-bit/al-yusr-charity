ALTER TABLE public.payment_transactions
  ADD COLUMN IF NOT EXISTS internal_notes TEXT,
  ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_error TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_webhooks_provider_txn
  ON public.payment_webhooks (provider, ((raw->'obj'->>'id')))
  WHERE (raw->'obj'->>'id') IS NOT NULL;