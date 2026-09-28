CREATE TABLE IF NOT EXISTS public.donation_status_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id uuid NOT NULL REFERENCES public.donations(id) ON DELETE CASCADE,
  old_status text,
  new_status text NOT NULL,
  changed_by uuid,
  changed_by_label text,
  source text NOT NULL DEFAULT 'system',
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.donation_status_audit ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_donation_status_audit_donation_created
  ON public.donation_status_audit(donation_id, created_at DESC);

DROP POLICY IF EXISTS "Donation owners can read their status audit" ON public.donation_status_audit;
CREATE POLICY "Donation owners can read their status audit"
ON public.donation_status_audit
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.donations d
    WHERE d.id = donation_status_audit.donation_id
      AND d.donor_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Staff can read donation status audit" ON public.donation_status_audit;
CREATE POLICY "Staff can read donation status audit"
ON public.donation_status_audit
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'case_manager')
  OR public.has_role(auth.uid(), 'editor')
);

DROP POLICY IF EXISTS "Staff can add donation status audit" ON public.donation_status_audit;
CREATE POLICY "Staff can add donation status audit"
ON public.donation_status_audit
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'case_manager')
);

CREATE OR REPLACE FUNCTION public.audit_donation_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.donation_status_audit (
      donation_id, old_status, new_status, changed_by, changed_by_label, source, note
    ) VALUES (
      NEW.id,
      NULL,
      NEW.payment_status,
      auth.uid(),
      CASE WHEN auth.uid() IS NULL THEN 'system' ELSE 'authenticated user' END,
      'created',
      'Donation created'
    );
    RETURN NEW;
  END IF;

  IF OLD.payment_status IS DISTINCT FROM NEW.payment_status THEN
    INSERT INTO public.donation_status_audit (
      donation_id, old_status, new_status, changed_by, changed_by_label, source, note
    ) VALUES (
      NEW.id,
      OLD.payment_status,
      NEW.payment_status,
      auth.uid(),
      CASE WHEN auth.uid() IS NULL THEN 'system/webhook' ELSE 'authenticated user' END,
      'status_update',
      NULL
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_donation_status_insert ON public.donations;
CREATE TRIGGER trg_audit_donation_status_insert
AFTER INSERT ON public.donations
FOR EACH ROW
EXECUTE FUNCTION public.audit_donation_status_change();

DROP TRIGGER IF EXISTS trg_audit_donation_status_update ON public.donations;
CREATE TRIGGER trg_audit_donation_status_update
AFTER UPDATE OF payment_status ON public.donations
FOR EACH ROW
EXECUTE FUNCTION public.audit_donation_status_change();

CREATE OR REPLACE FUNCTION public.set_donation_payment_status(
  _donation_id uuid,
  _new_status text,
  _note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old text;
  v_name text;
BEGIN
  IF NOT (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'case_manager')
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT payment_status INTO v_old
  FROM public.donations
  WHERE id = _donation_id;

  IF v_old IS NULL THEN
    RAISE EXCEPTION 'Donation not found';
  END IF;

  UPDATE public.donations
  SET payment_status = _new_status
  WHERE id = _donation_id;

  SELECT NULLIF(full_name, '') INTO v_name
  FROM public.profiles
  WHERE id = auth.uid();

  WITH latest AS (
    SELECT id
    FROM public.donation_status_audit
    WHERE donation_id = _donation_id
      AND old_status IS NOT DISTINCT FROM v_old
      AND new_status = _new_status
      AND changed_by = auth.uid()
      AND source = 'status_update'
    ORDER BY created_at DESC
    LIMIT 1
  )
  UPDATE public.donation_status_audit a
  SET source = 'admin',
      changed_by_label = COALESCE(v_name, 'admin'),
      note = _note
  FROM latest
  WHERE a.id = latest.id;
END;
$$;