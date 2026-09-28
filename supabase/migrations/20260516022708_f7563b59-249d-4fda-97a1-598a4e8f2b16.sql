ALTER TABLE public.khabia_requests
  ADD COLUMN IF NOT EXISTS assigned_delegate_id UUID;

CREATE INDEX IF NOT EXISTS idx_khabia_assigned_delegate ON public.khabia_requests(assigned_delegate_id);

DROP POLICY IF EXISTS khabia_delegate_read ON public.khabia_requests;
CREATE POLICY khabia_delegate_read ON public.khabia_requests
  FOR SELECT USING (
    public.has_role(auth.uid(), 'delegate'::public.app_role)
    AND assigned_delegate_id = auth.uid()
  );

DROP POLICY IF EXISTS khabia_delegate_update ON public.khabia_requests;
CREATE POLICY khabia_delegate_update ON public.khabia_requests
  FOR UPDATE USING (
    public.has_role(auth.uid(), 'delegate'::public.app_role)
    AND assigned_delegate_id = auth.uid()
  ) WITH CHECK (
    public.has_role(auth.uid(), 'delegate'::public.app_role)
    AND assigned_delegate_id = auth.uid()
  );