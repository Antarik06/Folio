-- Migration: Add delivery/gifting instructions to albums
ALTER TABLE public.albums
  ADD COLUMN IF NOT EXISTS delivery_instructions TEXT DEFAULT NULL;
