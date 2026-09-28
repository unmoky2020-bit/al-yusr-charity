CREATE OR REPLACE FUNCTION public.create_public_donation(
  p_case_id uuid DEFAULT NULL,
  p_category_id uuid DEFAULT NULL,
  p_amount numeric DEFAULT NULL,
  p_currency text DEFAULT 'EGP',
  p_donor_name text DEFAULT NULL,
  p_donor_email text DEFAULT NULL,
  p_donor_phone text DEFAULT NULL,
  p_message text DEFAULT NULL,
  p_payment_method text DEFAULT NULL,
  p_payment_status text DEFAULT 'pending',
  p_idempotency_key text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  ref_code text,
  amount numeric,
  currency text,
  payment_status text,
  payment_method text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_existing public.donations%ROWTYPE;
  v_inserted public.donations%ROWTYPE;
  v_name text := nullif(trim(coalesce(p_donor_name, '')), '');
  v_email text := nullif(trim(coalesce(p_donor_email, '')), '');
  v_phone text := nullif(regexp_replace(coalesce(p_donor_phone, ''), '\s+', '', 'g'), '');
  v_method text := nullif(trim(coalesce(p_payment_method, '')), '');
  v_currency text := upper(nullif(trim(coalesce(p_currency, 'EGP')), ''));
  v_status text := coalesce(nullif(trim(p_payment_status), ''), 'pending');
  v_message text := nullif(trim(coalesce(p_message, '')), '');
  v_key text := nullif(trim(coalesce(p_idempotency_key, '')), '');
BEGIN
  IF p_amount IS NULL OR p_amount < 10 OR p_amount > 1000000 THEN
    RAISE EXCEPTION 'Invalid donation amount' USING ERRCODE = '22023';
  END IF;

  IF v_name IS NULL OR char_length(v_name) < 2 OR char_length(v_name) > 120 THEN
    RAISE EXCEPTION 'Invalid donor name' USING ERRCODE = '22023';
  END IF;

  IF v_phone IS NULL OR v_phone !~ '^01[0-9]{9}$' THEN
    RAISE EXCEPTION 'Invalid donor phone' USING ERRCODE = '22023';
  END IF;

  IF v_email IS NOT NULL AND (char_length(v_email) > 255 OR v_email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$') THEN
    RAISE EXCEPTION 'Invalid donor email' USING ERRCODE = '22023';
  END IF;

  IF v_method IS NULL OR char_length(v_method) > 80 OR v_method !~ '^[A-Za-z0-9_-]+$' THEN
    RAISE EXCEPTION 'Invalid payment method' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.payment_methods pm WHERE pm.key = v_method AND pm.active = true) THEN
    RAISE EXCEPTION 'Payment method is unavailable' USING ERRCODE = '22023';
  END IF;

  IF v_currency IS NULL OR v_currency <> 'EGP' THEN
    RAISE EXCEPTION 'Invalid currency' USING ERRCODE = '22023';
  END IF;

  IF v_status IS NULL OR v_status <> 'pending' THEN
    RAISE EXCEPTION 'Invalid payment status' USING ERRCODE = '22023';
  END IF;

  IF v_key IS NOT NULL THEN
    SELECT * INTO v_existing
    FROM public.donations d
    WHERE d.idempotency_key = v_key
    LIMIT 1;

    IF FOUND THEN
      RETURN QUERY SELECT v_existing.id, v_existing.ref_code, v_existing.amount, v_existing.currency, v_existing.payment_status, v_existing.payment_method, v_existing.created_at;
      RETURN;
    END IF;
  END IF;

  INSERT INTO public.donations (
    donor_id,
    case_id,
    category_id,
    amount,
    currency,
    donor_name,
    donor_email,
    donor_phone,
    message,
    payment_method,
    payment_status,
    idempotency_key
  ) VALUES (
    v_user_id,
    p_case_id,
    p_category_id,
    p_amount,
    v_currency,
    v_name,
    v_email,
    v_phone,
    v_message,
    v_method,
    v_status,
    v_key
  )
  RETURNING * INTO v_inserted;

  RETURN QUERY SELECT v_inserted.id, v_inserted.ref_code, v_inserted.amount, v_inserted.currency, v_inserted.payment_status, v_inserted.payment_method, v_inserted.created_at;
END;
$$;

REVOKE ALL ON FUNCTION public.create_public_donation(uuid, uuid, numeric, text, text, text, text, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_public_donation(uuid, uuid, numeric, text, text, text, text, text, text, text, text) TO anon, authenticated;