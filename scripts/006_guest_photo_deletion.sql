-- Migration: Allow guests to delete their own photos
-- Run this in your Supabase SQL editor

-- ─── 1. RLS Policy for Guest Photo Deletion ────────────────────────────────
-- Guests should be able to delete exactly their own photos.
-- Managers already have "photos_managers_delete".

DROP POLICY IF EXISTS "photos_guests_delete_own" ON public.photos;
CREATE POLICY "photos_guests_delete_own" ON public.photos
  FOR DELETE USING (
    uploader_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.event_guests eg
      WHERE eg.event_id = photos.event_id
        AND eg.user_id = auth.uid()
        AND eg.role = 'guest'
    )
  );
