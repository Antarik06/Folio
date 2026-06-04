-- Migration 013: Template System, Artist dashboard, Orders, Premium, and Print pipelines tables.

-- 1. Extend profiles to support roles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'artist', 'admin'));

-- Update default accounts role
UPDATE public.profiles SET role = 'admin' WHERE id = '11111111-2222-3333-4444-444444444444';
UPDATE public.profiles SET role = 'artist' WHERE id = '22222222-3333-4444-5555-555555555555';

-- 2. Create Artists table
CREATE TABLE IF NOT EXISTS public.artists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  bio TEXT,
  specialty_categories JSONB DEFAULT '[]',
  portfolio_url TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  max_concurrent_orders INTEGER DEFAULT 5,
  current_order_count INTEGER DEFAULT 0,
  notification_email BOOLEAN DEFAULT TRUE,
  notification_in_app BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default artist in artists table
INSERT INTO public.artists (user_id, name, bio, is_available)
VALUES ('22222222-3333-4444-5555-555555555555', 'Independent Artist', 'Professional layout designer.', TRUE)
ON CONFLICT (user_id) DO NOTHING;

-- 3. Extend templates
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS artist_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]';
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending-review', 'published', 'archived'));
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS page_count INTEGER DEFAULT 2;
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS total_photo_slots INTEGER DEFAULT 0;
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS schema_path TEXT;
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS background_pdf_path TEXT;
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS page_previews_urls JSONB DEFAULT '[]';
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS price_tier TEXT DEFAULT 'free' CHECK (price_tier IN ('free', 'standard', 'premium'));
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS color_profile TEXT DEFAULT 'sRGB';
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS print_process TEXT DEFAULT 'digital-inkjet' CHECK (print_process IN ('offset', 'digital-inkjet', 'photo-lab'));
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS available_sizes JSONB DEFAULT '[]';
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS paper_options JSONB DEFAULT '[]';
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS cover_options JSONB DEFAULT '[]';
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS version TEXT DEFAULT '1.0.0';
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS featured_label TEXT CHECK (featured_label IN ('Popular', 'Staff Pick', 'New', NULL));

-- Update seeded/existing templates
UPDATE public.templates SET status = 'published' WHERE status IS NULL;
UPDATE public.templates SET artist_id = '22222222-3333-4444-5555-555555555555' WHERE artist_id IS NULL;

-- 4. Extend orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS artist_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_type TEXT DEFAULT 'standard' CHECK (order_type IN ('standard', 'premium'));
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending-review' CHECK (status IN ('pending-review', 'changes-requested', 'approved', 'sent-to-print', 'printing', 'preflight-failed', 'completed'));
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS album_layout_json JSONB DEFAULT '{}';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS image_references JSONB DEFAULT '[]';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS contact_details_json JSONB DEFAULT '{}';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS special_instructions TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS print_job_id UUID;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS vendor_order_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS preflight_report_path TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS print_ready_pdf_path TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS amount_paid INTEGER DEFAULT 0;

-- Create indices on extended tables
CREATE INDEX IF NOT EXISTS idx_artists_user ON public.artists(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_artist ON public.templates(artist_id);
CREATE INDEX IF NOT EXISTS idx_templates_status ON public.templates(status);
CREATE INDEX IF NOT EXISTS idx_orders_artist ON public.orders(artist_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_type ON public.orders(order_type);

-- 5. Create Revision Rounds table
CREATE TABLE IF NOT EXISTS public.revision_rounds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  artist_comment TEXT,
  user_response TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'changes-requested', 'approved'))
);
CREATE INDEX IF NOT EXISTS idx_revision_rounds_order ON public.revision_rounds(order_id);

-- 6. Create Premium Packages table
CREATE TABLE IF NOT EXISTS public.premium_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  features JSONB DEFAULT '[]',
  base_price INTEGER NOT NULL,
  advance_percentage INTEGER DEFAULT 50,
  estimated_turnaround_days INTEGER DEFAULT 7,
  max_revisions INTEGER DEFAULT 3,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default premium packages
INSERT INTO public.premium_packages (name, description, features, base_price, advance_percentage, estimated_turnaround_days, max_revisions)
VALUES 
('Concierge Standard', 'Dedicated layout design by a professional artist with standard paper choices.', '["Dedicated artist", "Matte finish", "2 revision rounds"]', 249000, 50, 10, 2),
('Concierge Elite', 'Unlimited design adjustments and premium handcrafted Layflat paper options.', '["Dedicated artist", "Unlimited revisions", "Layflat paper", "Concierge review"]', 499000, 50, 7, 5)
ON CONFLICT DO NOTHING;

-- 7. Create Premium Projects table
CREATE TABLE IF NOT EXISTS public.premium_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  editor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'briefing-received' CHECK (status IN ('briefing-received', 'editor-assigned', 'first-draft', 'revisions', 'final-approval', 'printing', 'delivered')),
  brief_json JSONB DEFAULT '{}',
  package_id UUID REFERENCES public.premium_packages(id) ON DELETE SET NULL,
  advance_payment_amount INTEGER DEFAULT 0,
  advance_paid_at TIMESTAMPTZ,
  balance_amount INTEGER DEFAULT 0,
  balance_paid_at TIMESTAMPTZ,
  photo_uploads JSONB DEFAULT '[]',
  proofs JSONB DEFAULT '[]',
  messages JSONB DEFAULT '[]',
  revision_requests JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_premium_projects_user ON public.premium_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_premium_projects_editor ON public.premium_projects(editor_id);
CREATE INDEX IF NOT EXISTS idx_premium_projects_status ON public.premium_projects(status);

-- 8. Create Print Jobs table (database backed queue)
CREATE TABLE IF NOT EXISTS public.print_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  queued_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  output_pdf_path TEXT,
  preflight_report JSONB,
  job_log TEXT
);
CREATE INDEX IF NOT EXISTS idx_print_jobs_order ON public.print_jobs(order_id);
CREATE INDEX IF NOT EXISTS idx_print_jobs_status ON public.print_jobs(status);

-- Triggers for updated_at on artists
CREATE TRIGGER update_artists_updated_at BEFORE UPDATE ON public.artists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for new tables
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revision_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premium_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premium_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.print_jobs ENABLE ROW LEVEL SECURITY;

-- Setup RLS policies
DROP POLICY IF EXISTS "artists_public_read" ON public.artists;
CREATE POLICY "artists_public_read" ON public.artists FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "artists_self_all" ON public.artists;
CREATE POLICY "artists_self_all" ON public.artists FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "revision_rounds_owner_select" ON public.revision_rounds;
CREATE POLICY "revision_rounds_owner_select" ON public.revision_rounds FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = revision_rounds.order_id AND (orders.user_id = auth.uid() OR orders.artist_id = auth.uid()))
);

DROP POLICY IF EXISTS "revision_rounds_artist_all" ON public.revision_rounds;
CREATE POLICY "revision_rounds_artist_all" ON public.revision_rounds FOR ALL USING (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = revision_rounds.order_id AND orders.artist_id = auth.uid())
);

DROP POLICY IF EXISTS "premium_packages_public_read" ON public.premium_packages;
CREATE POLICY "premium_packages_public_read" ON public.premium_packages FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "premium_projects_owner_all" ON public.premium_projects;
CREATE POLICY "premium_projects_owner_all" ON public.premium_projects FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "premium_projects_editor_all" ON public.premium_projects;
CREATE POLICY "premium_projects_editor_all" ON public.premium_projects FOR ALL USING (editor_id = auth.uid());

DROP POLICY IF EXISTS "print_jobs_admin_all" ON public.print_jobs;
CREATE POLICY "print_jobs_admin_all" ON public.print_jobs FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
