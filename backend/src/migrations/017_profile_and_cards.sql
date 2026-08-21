-- Migration: the Profile tab — a public page, and shareable occasion cards.
--
-- Third stage of the Library → Create → Share pipeline. Nothing here is public
-- by default: a profile page is hidden until its owner turns it on, and an
-- album only appears on that page once explicitly promoted. That per-item
-- promotion IS the consent mechanism for the card feature — a guest's face
-- cannot reach a public card because someone else shared an event with them.

-- ─── 1. Public page fields on the profile ───────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS handle TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS page_is_public BOOLEAN NOT NULL DEFAULT FALSE;

-- Handles are the public address of a page, so they must be unique. Partial:
-- most profiles have no handle yet and NULLs must not collide.
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_handle
  ON public.profiles(LOWER(handle))
  WHERE handle IS NOT NULL;

DO $$
BEGIN
  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_handle_format
    CHECK (handle IS NULL OR handle ~ '^[a-z0-9_]{3,30}$');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ─── 2. Promoting an album to the public page ───────────────────────────────
-- Distinct from albums.is_published, which marks an artist template offered in
-- the style catalogue — a different decision by a different persona.
ALTER TABLE public.albums
  ADD COLUMN IF NOT EXISTS on_profile BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS promoted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_albums_on_profile
  ON public.albums(owner_id, promoted_at DESC)
  WHERE on_profile = TRUE;

-- ─── 3. Share cards ─────────────────────────────────────────────────────────
-- A card is a saved composition, not a rendered image: the occasion, the one
-- photo it centres, and the words on it. Rendering happens client-side at
-- 1080×1350 so a card restyles with the rest of the app.
CREATE TABLE IF NOT EXISTS public.share_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'occasion' CHECK (kind IN ('occasion', 'profile')),
  headline TEXT NOT NULL,
  subline TEXT,
  occasion_date DATE,
  photo_id UUID REFERENCES public.photos(id) ON DELETE SET NULL,
  photo_url TEXT,
  album_id UUID REFERENCES public.albums(id) ON DELETE SET NULL,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_share_cards_owner
  ON public.share_cards(owner_id, created_at DESC);

ALTER TABLE public.share_cards ENABLE ROW LEVEL SECURITY;

-- Owners manage their own cards.
DROP POLICY IF EXISTS "share_cards_owner_all" ON public.share_cards;
CREATE POLICY "share_cards_owner_all" ON public.share_cards
  FOR ALL USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Anyone may read a card its owner marked public, and only if the owner's page
-- is public too — turning a page off must take its cards with it.
DROP POLICY IF EXISTS "share_cards_public_read" ON public.share_cards;
CREATE POLICY "share_cards_public_read" ON public.share_cards
  FOR SELECT USING (
    is_public = TRUE
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = share_cards.owner_id AND p.page_is_public = TRUE
    )
  );
