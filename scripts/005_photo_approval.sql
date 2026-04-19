-- Migration: Photo approval workflow + role-based access
-- Run this in your Supabase SQL editor

-- ─── 0. Update event_guests role constraint ─────────────────────────────────
ALTER TABLE public.event_guests DROP CONSTRAINT IF EXISTS event_guests_role_check;
ALTER TABLE public.event_guests ADD CONSTRAINT event_guests_role_check 
  CHECK (role IN ('guest', 'collaborator', 'contributor', 'admin'));

-- ─── 1. Add status column to photos ────────────────────────────────────────
ALTER TABLE public.photos
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS uploaded_by_role TEXT DEFAULT 'host';

-- Index for fast pending photo queries
CREATE INDEX IF NOT EXISTS idx_photos_status ON public.photos(status);
CREATE INDEX IF NOT EXISTS idx_photos_event_status ON public.photos(event_id, status);

-- ─── 2. Add collaborator_invite_code as a real column on events ─────────────
-- (previously stored in settings JSONB — promoting to a proper column)
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS collaborator_invite_code TEXT UNIQUE;

-- Backfill from settings JSONB for any events that already have it
UPDATE public.events
SET collaborator_invite_code = settings->>'collaborator_invite_code'
WHERE settings->>'collaborator_invite_code' IS NOT NULL
  AND collaborator_invite_code IS NULL;

-- Index for quick collaborator code lookup
CREATE INDEX IF NOT EXISTS idx_events_collab_code ON public.events(collaborator_invite_code)
  WHERE collaborator_invite_code IS NOT NULL;

-- ─── 3. Security Definer Helper Functions ────────────────────────────────────

-- Safely check collaborator status without triggering RLS loops
CREATE OR REPLACE FUNCTION public.is_event_collaborator(check_event_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.event_guests
    WHERE event_id = check_event_id
      AND user_id = auth.uid()
      AND role = 'collaborator'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Safely check if someone is an owner OR collaborator
CREATE OR REPLACE FUNCTION public.is_event_manager(check_event_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.events
    WHERE id = check_event_id AND host_id = auth.uid()
  ) OR public.is_event_collaborator(check_event_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 4. RLS Policies for photos ─────────────────────────────────────────────

-- Drop old permissive policy if exists
DROP POLICY IF EXISTS "photos_read_all" ON public.photos;
DROP POLICY IF EXISTS "photos_event_read" ON public.photos;

-- Host and collaborators can see ALL photos in their events
DROP POLICY IF EXISTS "photos_managers_read_all" ON public.photos;
CREATE POLICY "photos_managers_read_all" ON public.photos
  FOR SELECT USING (
    public.is_event_manager(photos.event_id)
  );

-- Guests can see: approved photos OR their own uploads
DROP POLICY IF EXISTS "photos_guests_read_approved" ON public.photos;
CREATE POLICY "photos_guests_read_approved" ON public.photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.event_guests eg
      WHERE eg.event_id = photos.event_id
        AND eg.user_id = auth.uid()
        AND eg.role = 'guest'
    )
    AND (
      photos.status = 'approved'
      OR photos.uploader_id = auth.uid()
    )
  );

-- Managers can update (approve/reject) photos
DROP POLICY IF EXISTS "photos_managers_update" ON public.photos;
CREATE POLICY "photos_managers_update" ON public.photos
  FOR UPDATE USING (
    public.is_event_manager(photos.event_id)
  );

-- Users can insert photos (guests insert as pending, managers as approved)
DROP POLICY IF EXISTS "photos_insert_authenticated" ON public.photos;
CREATE POLICY "photos_insert_authenticated" ON public.photos
  FOR INSERT WITH CHECK (
    auth.uid() = uploader_id
    AND (
      public.is_event_manager(photos.event_id)
      OR EXISTS (
        SELECT 1 FROM public.event_guests eg
        WHERE eg.event_id = photos.event_id AND eg.user_id = auth.uid()
      )
    )
  );

-- Managers can delete photos
DROP POLICY IF EXISTS "photos_managers_delete" ON public.photos;
CREATE POLICY "photos_managers_delete" ON public.photos
  FOR DELETE USING (
    public.is_event_manager(photos.event_id)
  );

-- ─── 5. Allow collaborators to look up events by collaborator_invite_code ───
DROP POLICY IF EXISTS "events_collab_code_lookup" ON public.events;
CREATE POLICY "events_collab_code_lookup" ON public.events
  FOR SELECT USING (collaborator_invite_code IS NOT NULL);

-- ─── 6. Allow event_guests: host+collaborators can read all guests ───────────
DROP POLICY IF EXISTS "event_guests_managers_read" ON public.event_guests;
CREATE POLICY "event_guests_managers_read" ON public.event_guests
  FOR SELECT USING (
    public.is_event_manager(event_guests.event_id)
    -- Also allow guests to see their own record (self_view policy handles this)
  );

-- ─── 7. Only owners can remove collaborators ─────────────────────────────────
-- (Existing delete policy for event_guests only allows hosts)
-- No change needed — the removeGuest action already checks host_id = auth.uid()
