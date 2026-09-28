
ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS pending_review BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS submitted_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_by    UUID,
  ADD COLUMN IF NOT EXISTS review_notes   TEXT;

CREATE INDEX IF NOT EXISTS idx_stories_pending_review
  ON public.stories(pending_review) WHERE pending_review = true;

CREATE OR REPLACE FUNCTION public.stories_review_sync()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Publishing clears the review flag
    IF NEW.is_published = true AND OLD.is_published = false THEN
      NEW.pending_review := false;
      NEW.reviewed_at := COALESCE(NEW.reviewed_at, now());
      NEW.reviewed_by := COALESCE(NEW.reviewed_by, auth.uid());
    END IF;
    -- Submitting for review records timestamp
    IF NEW.pending_review = true AND COALESCE(OLD.pending_review,false) = false THEN
      NEW.submitted_at := COALESCE(NEW.submitted_at, now());
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_stories_review_sync ON public.stories;
CREATE TRIGGER trg_stories_review_sync
  BEFORE UPDATE ON public.stories
  FOR EACH ROW EXECUTE FUNCTION public.stories_review_sync();
