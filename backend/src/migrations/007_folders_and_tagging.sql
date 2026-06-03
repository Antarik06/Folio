-- Migration: Folders, People Tagging, and Location Tagging

-- ─── 1. Create folders table ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick event folder lookups
CREATE INDEX IF NOT EXISTS idx_folders_event ON public.folders(event_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent ON public.folders(parent_id);

-- ─── 2. Alter photos table ──────────────────────────────────────────────────
ALTER TABLE public.photos
  ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS people_tags JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS location TEXT DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_photos_folder ON public.photos(folder_id);

-- ─── 3. Enable RLS on folders ───────────────────────────────────────────────
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

-- Host and collaborators have full access to folders
DROP POLICY IF EXISTS "folders_managers_all" ON public.folders;
CREATE POLICY "folders_managers_all" ON public.folders
  FOR ALL USING (
    public.is_event_manager(folders.event_id)
  );

-- Regular guests can view folders
DROP POLICY IF EXISTS "folders_guests_read" ON public.folders;
CREATE POLICY "folders_guests_read" ON public.folders
  FOR SELECT USING (
    public.is_event_guest(folders.event_id)
  );
