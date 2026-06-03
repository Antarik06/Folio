-- Migration: Add face enrollment columns to event_guests
-- Run this in your Supabase SQL editor

ALTER TABLE public.event_guests
  ADD COLUMN IF NOT EXISTS face_reference_url TEXT,
  ADD COLUMN IF NOT EXISTS face_enrolled BOOLEAN DEFAULT FALSE;

-- Add joined_at column if missing (original schema had it optional)
ALTER TABLE public.event_guests
  ADD COLUMN IF NOT EXISTS joined_at TIMESTAMPTZ DEFAULT NOW();

-- Index for quick lookup by invite code on events table
CREATE INDEX IF NOT EXISTS idx_events_invite_code_lookup ON public.events(invite_code) WHERE invite_code IS NOT NULL;

-- Function to generate a unique invite code on event creation (if not already set)
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invite_code IS NULL OR NEW.invite_code = '' THEN
    NEW.invite_code := upper(substring(md5(random()::text || NEW.id::text) from 1 for 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_invite_code ON public.events;
CREATE TRIGGER set_invite_code
  BEFORE INSERT ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_invite_code();

-- Backfill invite codes for any existing events that have none
UPDATE public.events
SET invite_code = upper(substring(md5(random()::text || id::text) from 1 for 8))
WHERE invite_code IS NULL OR invite_code = '';

-- Allow guests to read event info via invite code (public lookup policy)
-- We need authenticated users to be able to look up an event by invite_code
DROP POLICY IF EXISTS "events_invite_code_lookup" ON public.events;
CREATE POLICY "events_invite_code_lookup" ON public.events
  FOR SELECT USING (invite_code IS NOT NULL);

-- Allow authenticated users to insert themselves as a guest
DROP POLICY IF EXISTS "event_guests_self_join" ON public.event_guests;
CREATE POLICY "event_guests_self_join" ON public.event_guests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow guests to update their own face enrollment info
DROP POLICY IF EXISTS "event_guests_self_update_face" ON public.event_guests;
CREATE POLICY "event_guests_self_update_face" ON public.event_guests
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow guests to view their own guest record
DROP POLICY IF EXISTS "event_guests_self_view" ON public.event_guests;
CREATE POLICY "event_guests_self_view" ON public.event_guests
  FOR SELECT USING (auth.uid() = user_id);

-- Storage bucket for face selfie photos (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'face-photos',
  'face-photos',
  FALSE,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for face-photos bucket
DROP POLICY IF EXISTS "Users can upload their own face photo" ON storage.objects;
CREATE POLICY "Users can upload their own face photo" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'face-photos' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can view their own face photo" ON storage.objects;
CREATE POLICY "Users can view their own face photo" ON storage.objects
  FOR SELECT USING (bucket_id = 'face-photos' AND owner = auth.uid());
