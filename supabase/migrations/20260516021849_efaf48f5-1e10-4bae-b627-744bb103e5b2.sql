
-- 1) Columns on cases
ALTER TABLE public.cases
  ADD COLUMN IF NOT EXISTS assigned_delegate_id uuid,
  ADD COLUMN IF NOT EXISTS scheduled_visit_at timestamptz,
  ADD COLUMN IF NOT EXISTS delegate_notes text;

CREATE INDEX IF NOT EXISTS cases_assigned_delegate_idx
  ON public.cases (assigned_delegate_id);

-- 2) Delegates can SELECT their assigned cases
DROP POLICY IF EXISTS cases_delegate_read ON public.cases;
CREATE POLICY cases_delegate_read
ON public.cases
FOR SELECT
USING (
  has_role(auth.uid(), 'delegate'::app_role)
  AND assigned_delegate_id = auth.uid()
);

-- 3) Delegates can UPDATE their assigned cases (limited surface enforced in UI;
--    full-row policy because column-level RLS is not native in postgres).
DROP POLICY IF EXISTS cases_delegate_update ON public.cases;
CREATE POLICY cases_delegate_update
ON public.cases
FOR UPDATE
USING (
  has_role(auth.uid(), 'delegate'::app_role)
  AND assigned_delegate_id = auth.uid()
)
WITH CHECK (
  has_role(auth.uid(), 'delegate'::app_role)
  AND assigned_delegate_id = auth.uid()
);

-- 4) Delegates can read & write case_updates for their assigned cases
DROP POLICY IF EXISTS case_updates_delegate_read ON public.case_updates;
CREATE POLICY case_updates_delegate_read
ON public.case_updates
FOR SELECT
USING (
  has_role(auth.uid(), 'delegate'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.cases c
    WHERE c.id = case_updates.case_id
      AND c.assigned_delegate_id = auth.uid()
  )
);

DROP POLICY IF EXISTS case_updates_delegate_insert ON public.case_updates;
CREATE POLICY case_updates_delegate_insert
ON public.case_updates
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'delegate'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.cases c
    WHERE c.id = case_updates.case_id
      AND c.assigned_delegate_id = auth.uid()
  )
);
