-- Migration: Cards — a template-driven card engine for the Profile tab.
--
-- Replaces the two hard-coded looks in share_cards (occasion / profile) with a
-- catalogue the backend owns: a base style supplies visual tokens, a template
-- version supplies a declarative layout tree, and a card is one user's binding
-- of the two plus their own customisation. Adding "Retro Film" later is an
-- INSERT here, never a frontend deploy.
--
-- share_cards is deliberately left in place. Its rows are copied into cards by
-- the catalogue seeder (see services/cardCatalog.ts), which is idempotent via
-- cards.legacy_share_card_id, so nothing a user already made is lost.

-- ─── 1. Base styles ─────────────────────────────────────────────────────────
-- A palette + type + spacing token set. Templates consume these by name, so
-- Editorial + Paper and Editorial + Darkroom are one template, two results.
CREATE TABLE IF NOT EXISTS public.card_styles (
  id TEXT PRIMARY KEY CHECK (id ~ '^[a-z0-9_]{2,40}$'),
  name TEXT NOT NULL,
  description TEXT,
  tokens JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'published'
    CHECK (status IN ('draft', 'published', 'archived')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  -- Seeded rows are re-synced on boot; hand-authored ones are never touched.
  is_seed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 2. Templates ───────────────────────────────────────────────────────────
-- The row is the catalogue entry; the layout lives in its versions. Publishing
-- is pointing current_version at a version, so a template can be edited without
-- disturbing what users are already rendering.
CREATE TABLE IF NOT EXISTS public.card_templates (
  id TEXT PRIMARY KEY CHECK (id ~ '^[a-z0-9_]{2,40}$'),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  thumbnail_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  current_version INTEGER NOT NULL DEFAULT 0,
  default_style_id TEXT REFERENCES public.card_styles(id) ON DELETE SET NULL,
  -- Empty means every published style is offered.
  allowed_style_ids TEXT[] NOT NULL DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_premium BOOLEAN NOT NULL DEFAULT FALSE,
  is_seed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_card_templates_catalogue
  ON public.card_templates(status, sort_order);

-- ─── 3. Template versions ───────────────────────────────────────────────────
-- definition holds the whole declarative document: canvas, layout tree,
-- capabilities, text styles. Never executable — see schema/cardSchema.ts.
CREATE TABLE IF NOT EXISTS public.card_template_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id TEXT NOT NULL REFERENCES public.card_templates(id) ON DELETE CASCADE,
  version INTEGER NOT NULL CHECK (version > 0),
  definition JSONB NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (template_id, version)
);

CREATE INDEX IF NOT EXISTS idx_card_template_versions_lookup
  ON public.card_template_versions(template_id, version DESC);

-- ─── 4. Card profile ────────────────────────────────────────────────────────
-- The richer self-description a card draws on: interests, timeline, stats,
-- goals. JSONB because this shape grows with every new template; the zod
-- schema in schema/cardSchema.ts is what validates it.
CREATE TABLE IF NOT EXISTS public.card_profiles (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 5. Cards ───────────────────────────────────────────────────────────────
-- template_version is pinned at creation: publishing v3 must not restyle a
-- card someone already shared. profile_snapshot is the same promise for data.
CREATE TABLE IF NOT EXISTS public.cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled card',
  template_id TEXT NOT NULL REFERENCES public.card_templates(id) ON DELETE RESTRICT,
  template_version INTEGER NOT NULL,
  style_id TEXT REFERENCES public.card_styles(id) ON DELETE SET NULL,
  customization JSONB NOT NULL DEFAULT '{}'::jsonb,
  profile_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  share_slug TEXT UNIQUE,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  -- The one card the profile page leads with.
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  legacy_share_card_id UUID UNIQUE REFERENCES public.share_cards(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cards_owner
  ON public.cards(owner_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cards_share_slug
  ON public.cards(share_slug)
  WHERE share_slug IS NOT NULL;

-- At most one primary card per owner.
CREATE UNIQUE INDEX IF NOT EXISTS idx_cards_one_primary
  ON public.cards(owner_id)
  WHERE is_primary = TRUE;

-- ─── 6. Row level security ──────────────────────────────────────────────────
-- The catalogue is world-readable once published: a shared card has to open for
-- a signed-out visitor. Writes are staff-only and go through the API, which
-- checks the application role on public.profiles.
ALTER TABLE public.card_styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_template_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "card_styles_public_read" ON public.card_styles;
CREATE POLICY "card_styles_public_read" ON public.card_styles
  FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "card_templates_public_read" ON public.card_templates;
CREATE POLICY "card_templates_public_read" ON public.card_templates
  FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "card_template_versions_public_read" ON public.card_template_versions;
CREATE POLICY "card_template_versions_public_read" ON public.card_template_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.card_templates t
       WHERE t.id = card_template_versions.template_id
         AND t.status = 'published'
    )
  );

DROP POLICY IF EXISTS "card_profiles_owner_all" ON public.card_profiles;
CREATE POLICY "card_profiles_owner_all" ON public.card_profiles
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "cards_owner_all" ON public.cards;
CREATE POLICY "cards_owner_all" ON public.cards
  FOR ALL USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- A public card is readable by anyone, but only while its owner's page is on —
-- the same rule share_cards carries, so switching a page off still takes its
-- cards with it.
DROP POLICY IF EXISTS "cards_public_read" ON public.cards;
CREATE POLICY "cards_public_read" ON public.cards
  FOR SELECT USING (
    is_public = TRUE
    AND EXISTS (
      SELECT 1 FROM public.profiles p
       WHERE p.id = cards.owner_id AND p.page_is_public = TRUE
    )
  );
