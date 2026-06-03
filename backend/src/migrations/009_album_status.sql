-- Migration: Add status column to albums table
ALTER TABLE public.albums
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'ready', 'ordered'));

CREATE INDEX IF NOT EXISTS idx_albums_status ON public.albums(status);
