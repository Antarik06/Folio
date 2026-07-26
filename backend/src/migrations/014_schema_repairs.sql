-- Migration 014: Repairs for schema objects that the application code depends on
-- but that were never created.

-- ─── 1. premium_projects.updated_at ─────────────────────────────────────────
-- Every mutation in premiumRoutes (deposit-pay, balance-pay, message, proof,
-- approve) and adminService.assignArtistToPremiumProject writes
-- "updated_at = NOW()", but the column was never added in 013. Without it the
-- whole Concierge workspace fails with a column-does-not-exist error.
ALTER TABLE public.premium_projects
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

UPDATE public.premium_projects SET updated_at = created_at WHERE updated_at IS NULL;

DROP TRIGGER IF EXISTS update_premium_projects_updated_at ON public.premium_projects;
CREATE TRIGGER update_premium_projects_updated_at
  BEFORE UPDATE ON public.premium_projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── 2. albums updated_at trigger ───────────────────────────────────────────
-- 001_schema.sql drops this trigger but never recreates it, so albums.updated_at
-- only changed when a query set it explicitly. The dashboard and album lists
-- order by updated_at, so their ordering was wrong.
DROP TRIGGER IF EXISTS update_albums_updated_at ON public.albums;
CREATE TRIGGER update_albums_updated_at
  BEFORE UPDATE ON public.albums
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── 3. Make the 013 artists trigger idempotent ─────────────────────────────
-- 013 used a bare CREATE TRIGGER, so re-running the migration set aborted the
-- whole transaction.
DROP TRIGGER IF EXISTS update_artists_updated_at ON public.artists;
CREATE TRIGGER update_artists_updated_at
  BEFORE UPDATE ON public.artists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── 4. templates.updated_at ────────────────────────────────────────────────
-- artistRoutes and albumService both write templates.updated_at.
ALTER TABLE public.templates
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

UPDATE public.templates SET updated_at = created_at WHERE updated_at IS NULL;

DROP TRIGGER IF EXISTS update_templates_updated_at ON public.templates;
CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON public.templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── 5. Indexes for the hot read paths ──────────────────────────────────────
-- Event detail, dashboard and gallery queries all sort by created_at within an
-- event / owner, which previously required a sort over the whole partition.
CREATE INDEX IF NOT EXISTS idx_photos_event_created ON public.photos(event_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_albums_event_updated ON public.albums(event_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_albums_owner_updated ON public.albums(owner_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_host_created ON public.events(host_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_user_created ON public.orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_album_created ON public.orders(album_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_guests_user_event ON public.event_guests(user_id, event_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);

-- One live print job per order — backs the "already queued" guard in the
-- artist review route so a double submit cannot enqueue twice.
-- Collapse any pre-existing duplicates first, keeping the earliest job.
UPDATE public.print_jobs j
SET status = 'failed',
    error_message = COALESCE(j.error_message, 'Superseded by an earlier job for the same order.'),
    completed_at = COALESCE(j.completed_at, NOW())
WHERE j.status IN ('queued', 'processing')
  AND EXISTS (
    SELECT 1 FROM public.print_jobs older
    WHERE older.order_id = j.order_id
      AND older.status IN ('queued', 'processing')
      AND (older.queued_at, older.id) < (j.queued_at, j.id)
  );

CREATE UNIQUE INDEX IF NOT EXISTS idx_print_jobs_order_active
  ON public.print_jobs(order_id)
  WHERE status IN ('queued', 'processing');

-- De-duplicate premium packages created by earlier non-idempotent runs of 013:
-- keep one row per name, repoint any project that referenced a duplicate, then
-- enforce uniqueness so the seed stays idempotent.
WITH keepers AS (
  SELECT DISTINCT ON (name) name, id
  FROM public.premium_packages
  ORDER BY name, created_at ASC, id ASC
)
UPDATE public.premium_projects pp
SET package_id = k.id
FROM public.premium_packages dup
JOIN keepers k ON k.name = dup.name
WHERE pp.package_id = dup.id
  AND dup.id <> k.id;

WITH keepers AS (
  SELECT DISTINCT ON (name) id
  FROM public.premium_packages
  ORDER BY name, created_at ASC, id ASC
)
DELETE FROM public.premium_packages
WHERE id NOT IN (SELECT id FROM keepers);

CREATE UNIQUE INDEX IF NOT EXISTS idx_premium_packages_name ON public.premium_packages(name);

-- ─── 6. Guard against duplicate guest rows ──────────────────────────────────
-- event_guests already has UNIQUE(event_id, user_id) from 001; this keeps the
-- constraint present for databases created before that clause existed.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.event_guests'::regclass
      AND contype = 'u'
      AND conname = 'event_guests_event_id_user_id_key'
  ) THEN
    BEGIN
      ALTER TABLE public.event_guests
        ADD CONSTRAINT event_guests_event_id_user_id_key UNIQUE (event_id, user_id);
    EXCEPTION WHEN duplicate_table OR unique_violation THEN
      RAISE NOTICE 'Skipping event_guests unique constraint (already present or data conflicts).';
    END;
  END IF;
END
$$;

-- ─── 7. Keep seeded staff accounts on the right role ────────────────────────
-- Authorization is now driven entirely by profiles.role.
UPDATE public.profiles SET role = 'admin'  WHERE id = '11111111-2222-3333-4444-444444444444';
UPDATE public.profiles SET role = 'artist' WHERE id = '22222222-3333-4444-5555-555555555555';
