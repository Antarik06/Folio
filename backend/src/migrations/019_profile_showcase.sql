-- Migration: the Profile tab becomes a page about a person, not a list of albums.
--
-- Three additions, all of them in service of one idea: the profile has a
-- centrepiece (a card) and a showcase (what you chose to put under it).
--
--  1. Onboarding. A card built from an empty profile is an empty card, so the
--     first visit asks a handful of questions and builds the card from the
--     answers. The flag records that we asked — not that they answered well.
--
--  2. Photographs on the page. Albums have had `on_profile` since 017; single
--     frames now get the same per-item promotion, and for the same reason:
--     nothing reaches a public page without one explicit decision about it.
--
-- Both showcases read newest-promoted first, which is the same ordering the
-- album half has always used — so putting something on the page also decides
-- where it lands, and there is no second arrangement step to forget about.

-- ─── 1. Did we ask? ─────────────────────────────────────────────────────────
-- Deliberately a timestamp, not a boolean: knowing *when* someone was
-- onboarded is what lets a later flow re-ask without a second column.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarded_at TIMESTAMPTZ;

-- ─── 2. Promoting a single photograph ───────────────────────────────────────
-- Only the uploader may promote a frame. That restriction is enforced in
-- profileService, and it is the whole consent story: being able to *see* a
-- photo inside an event someone shared with you never makes it yours to
-- publish.
ALTER TABLE public.photos
  ADD COLUMN IF NOT EXISTS on_profile BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS profile_promoted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_photos_on_profile
  ON public.photos(uploader_id, profile_promoted_at DESC)
  WHERE on_profile = TRUE;

-- ─── 3. Reading a promoted photograph ───────────────────────────────────────
-- The owner's own rows are already readable through the existing photo
-- policies. This one exists so a visitor with no session can load the frames
-- on a public page — and it withdraws them the moment the page goes private.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables
     WHERE schemaname = 'public' AND tablename = 'photos' AND rowsecurity = TRUE
  ) THEN
    DROP POLICY IF EXISTS "photos_profile_public_read" ON public.photos;
    CREATE POLICY "photos_profile_public_read" ON public.photos
      FOR SELECT USING (
        on_profile = TRUE
        AND EXISTS (
          SELECT 1 FROM public.profiles p
           WHERE p.id = photos.uploader_id AND p.page_is_public = TRUE
        )
      );
  END IF;
END $$;
