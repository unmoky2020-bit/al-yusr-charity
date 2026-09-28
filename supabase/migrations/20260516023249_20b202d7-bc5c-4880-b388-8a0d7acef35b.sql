-- Proof columns on khabia
ALTER TABLE public.khabia_requests
  ADD COLUMN IF NOT EXISTS delivery_proof_url TEXT,
  ADD COLUMN IF NOT EXISTS collection_proof_url TEXT;

-- Private bucket for delegate proof uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('khabia-proofs', 'khabia-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- Delegate can manage files inside their own folder: <user_id>/...
DROP POLICY IF EXISTS "khabia_proofs_delegate_select" ON storage.objects;
CREATE POLICY "khabia_proofs_delegate_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'khabia-proofs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "khabia_proofs_delegate_insert" ON storage.objects;
CREATE POLICY "khabia_proofs_delegate_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'khabia-proofs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "khabia_proofs_delegate_update" ON storage.objects;
CREATE POLICY "khabia_proofs_delegate_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'khabia-proofs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "khabia_proofs_delegate_delete" ON storage.objects;
CREATE POLICY "khabia_proofs_delegate_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'khabia-proofs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Staff (admin/case_manager) can read and manage all proof files
DROP POLICY IF EXISTS "khabia_proofs_staff_all" ON storage.objects;
CREATE POLICY "khabia_proofs_staff_all" ON storage.objects
  FOR ALL USING (
    bucket_id = 'khabia-proofs'
    AND (public.has_role(auth.uid(),'admin'::public.app_role) OR public.has_role(auth.uid(),'case_manager'::public.app_role))
  ) WITH CHECK (
    bucket_id = 'khabia-proofs'
    AND (public.has_role(auth.uid(),'admin'::public.app_role) OR public.has_role(auth.uid(),'case_manager'::public.app_role))
  );