
DROP POLICY IF EXISTS "khabia_public_insert" ON public.khabia_requests;

CREATE POLICY "khabia_public_insert" ON public.khabia_requests
  FOR INSERT TO public
  WITH CHECK (
    char_length(full_name) BETWEEN 2 AND 80
    AND phone ~ '^01[0-9]{9}$'
    AND char_length(city) BETWEEN 2 AND 60
  );
