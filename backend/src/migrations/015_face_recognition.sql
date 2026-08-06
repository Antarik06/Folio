-- Migration: Real facial recognition engine.
--
-- Until now "AI face matching" was a selfie stored in a bucket and nothing
-- else: the personal gallery filtered on uploader_id / is_shared alone. This
-- adds the storage the actual engine needs — a 128-float embedding per enrolled
-- guest, one row per face detected in a photo, and a materialised match table so
-- gallery reads stay a single indexed join instead of an N x M distance scan.

-- 1. Enrolled guest embedding ------------------------------------------------
ALTER TABLE public.event_guests
  ADD COLUMN IF NOT EXISTS face_descriptor DOUBLE PRECISION[],
  ADD COLUMN IF NOT EXISTS face_enrolled_at TIMESTAMPTZ;

-- The original schema shipped an unused JSONB placeholder for this. Drop it so
-- there is exactly one column that means "this guest's face embedding".
ALTER TABLE public.event_guests DROP COLUMN IF EXISTS face_embedding;
ALTER TABLE public.photos DROP COLUMN IF EXISTS face_embeddings;

-- Existing rows have a selfie URL but no embedding, so they must be re-enrolled
-- before matching can work. Mark them as not enrolled rather than leaving a
-- half-enrolled state that silently never matches anything.
UPDATE public.event_guests
SET face_enrolled = FALSE
WHERE face_enrolled = TRUE AND face_descriptor IS NULL;

-- 2. Per-photo scan bookkeeping ----------------------------------------------
ALTER TABLE public.photos
  ADD COLUMN IF NOT EXISTS face_scan_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS face_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS face_scanned_at TIMESTAMPTZ;

DO $$
BEGIN
  ALTER TABLE public.photos
    ADD CONSTRAINT photos_face_scan_status_check
    CHECK (face_scan_status IN ('pending', 'done', 'failed', 'unsupported'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Drives the "index remaining photos" queue on the host dashboard.
CREATE INDEX IF NOT EXISTS idx_photos_face_scan_pending
  ON public.photos(event_id)
  WHERE face_scan_status = 'pending';

-- 3. Detected faces ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.photo_faces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  photo_id UUID NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  descriptor DOUBLE PRECISION[] NOT NULL,
  box JSONB,
  detection_score REAL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_photo_faces_photo ON public.photo_faces(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_faces_event ON public.photo_faces(event_id);

-- 4. Materialised matches ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.photo_face_matches (
  photo_id UUID NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  distance DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (photo_id, user_id)
);

-- The gallery read is "photos in this event matching me", so lead with user_id.
CREATE INDEX IF NOT EXISTS idx_photo_face_matches_user_event
  ON public.photo_face_matches(user_id, event_id);
CREATE INDEX IF NOT EXISTS idx_photo_face_matches_photo
  ON public.photo_face_matches(photo_id);

-- 5. RLS ---------------------------------------------------------------------
-- Writes only ever happen through the service-role backend, which bypasses RLS.
-- These policies exist so a leaked anon key cannot read other people's faces.
ALTER TABLE public.photo_faces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_face_matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "photo_faces_event_manager_read" ON public.photo_faces;
CREATE POLICY "photo_faces_event_manager_read" ON public.photo_faces
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = photo_faces.event_id AND e.host_id = auth.uid())
  );

DROP POLICY IF EXISTS "photo_face_matches_self_read" ON public.photo_face_matches;
CREATE POLICY "photo_face_matches_self_read" ON public.photo_face_matches
  FOR SELECT USING (auth.uid() = user_id);
