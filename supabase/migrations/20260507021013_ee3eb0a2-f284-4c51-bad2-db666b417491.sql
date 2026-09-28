
-- Allowed transitions
CREATE OR REPLACE FUNCTION public.validate_donation_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  allowed text[];
BEGIN
  IF NEW.payment_status NOT IN ('pending','paid','failed','refunded') THEN
    RAISE EXCEPTION 'Invalid payment_status: %', NEW.payment_status;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.payment_status NOT IN ('pending','paid','failed') THEN
      RAISE EXCEPTION 'New donations may only start as pending|paid|failed';
    END IF;
    RETURN NEW;
  END IF;

  IF OLD.payment_status = NEW.payment_status THEN
    RETURN NEW;
  END IF;

  allowed := CASE OLD.payment_status
    WHEN 'pending'  THEN ARRAY['paid','failed']
    WHEN 'paid'     THEN ARRAY['refunded']
    WHEN 'failed'   THEN ARRAY['pending']  -- allow retry
    WHEN 'refunded' THEN ARRAY[]::text[]
    ELSE ARRAY[]::text[]
  END;

  IF NOT (NEW.payment_status = ANY(allowed)) THEN
    RAISE EXCEPTION 'Illegal payment_status transition: % -> %',
      OLD.payment_status, NEW.payment_status;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_donation_status ON public.donations;
CREATE TRIGGER trg_validate_donation_status
BEFORE INSERT OR UPDATE OF payment_status ON public.donations
FOR EACH ROW EXECUTE FUNCTION public.validate_donation_status();

-- Recompute raised_amount on transitions. Keeps existing bump_case_raised behavior on insert,
-- and additionally handles updates (paid->refunded subtracts, pending->paid adds, paid revert).
CREATE OR REPLACE FUNCTION public.adjust_case_raised_on_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.case_id IS NULL THEN RETURN NEW; END IF;

  IF OLD.payment_status <> 'paid' AND NEW.payment_status = 'paid' THEN
    UPDATE public.cases SET raised_amount = raised_amount + NEW.amount WHERE id = NEW.case_id;
    UPDATE public.cases SET status = 'funded'
      WHERE id = NEW.case_id AND raised_amount >= needed_amount AND status = 'approved';
  ELSIF OLD.payment_status = 'paid' AND NEW.payment_status IN ('refunded','failed','pending') THEN
    UPDATE public.cases SET raised_amount = GREATEST(0, raised_amount - OLD.amount) WHERE id = NEW.case_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_adjust_case_raised ON public.donations;
CREATE TRIGGER trg_adjust_case_raised
AFTER UPDATE OF payment_status ON public.donations
FOR EACH ROW EXECUTE FUNCTION public.adjust_case_raised_on_update();

-- Existing bump_case_raised should fire on INSERT
DROP TRIGGER IF EXISTS trg_bump_case_raised_ins ON public.donations;
CREATE TRIGGER trg_bump_case_raised_ins
AFTER INSERT ON public.donations
FOR EACH ROW EXECUTE FUNCTION public.bump_case_raised();

CREATE INDEX IF NOT EXISTS idx_donations_status ON public.donations(payment_status);
CREATE INDEX IF NOT EXISTS idx_donations_case ON public.donations(case_id);
CREATE INDEX IF NOT EXISTS idx_donations_created ON public.donations(created_at DESC);
