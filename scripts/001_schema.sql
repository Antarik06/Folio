-- Folio App Database Schema
-- Sprint 0: Core Tables

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CREATE ALL TABLES FIRST (no policies yet)
-- ============================================

-- PROFILES TABLE (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- EVENTS TABLE (event hosts create these)
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE,
  cover_image_url TEXT,
  invite_code TEXT UNIQUE,
  settings JSONB DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'processing', 'completed', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- EVENT GUESTS TABLE
CREATE TABLE IF NOT EXISTS public.event_guests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'guest' CHECK (role IN ('guest', 'contributor', 'admin')),
  face_embedding JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- PHOTOS TABLE
CREATE TABLE IF NOT EXISTS public.photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  uploader_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blob_url TEXT NOT NULL,
  blob_pathname TEXT NOT NULL,
  thumbnail_url TEXT,
  original_filename TEXT,
  file_size INTEGER,
  width INTEGER,
  height INTEGER,
  taken_at TIMESTAMPTZ,
  exif_data JSONB DEFAULT '{}',
  ai_analysis JSONB DEFAULT '{}',
  face_embeddings JSONB DEFAULT '[]',
  is_host_photo BOOLEAN DEFAULT FALSE,
  is_shared BOOLEAN DEFAULT FALSE,
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TEMPLATES TABLE
CREATE TABLE IF NOT EXISTS public.templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  category TEXT,
  layout_schema JSONB NOT NULL DEFAULT '{}',
  style_schema JSONB NOT NULL DEFAULT '{}',
  is_premium BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ALBUMS TABLE
CREATE TABLE IF NOT EXISTS public.albums (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cover_photo_id UUID REFERENCES public.photos(id) ON DELETE SET NULL,
  template_id UUID REFERENCES public.templates(id) ON DELETE SET NULL,
  layout_data JSONB DEFAULT '{}',
  style_data JSONB DEFAULT '{}',
  ai_generated BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ALBUM PAGES TABLE
CREATE TABLE IF NOT EXISTS public.album_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  album_id UUID NOT NULL REFERENCES public.albums(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  layout_type TEXT DEFAULT 'single',
  content JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(album_id, page_number)
);

-- ALBUM PHOTOS TABLE (junction)
CREATE TABLE IF NOT EXISTS public.album_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  album_id UUID NOT NULL REFERENCES public.albums(id) ON DELETE CASCADE,
  photo_id UUID NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
  page_id UUID REFERENCES public.album_pages(id) ON DELETE SET NULL,
  position INTEGER DEFAULT 0,
  transform JSONB DEFAULT '{}',
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(album_id, photo_id)
);

-- ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  album_id UUID NOT NULL REFERENCES public.albums(id) ON DELETE CASCADE,
  product_type TEXT NOT NULL CHECK (product_type IN ('softcover_small', 'softcover_large', 'hardcover_small', 'hardcover_large', 'magazine_small', 'magazine_large')),
  quantity INTEGER DEFAULT 1,
  unit_price INTEGER NOT NULL,
  total_price INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'paid', 'failed', 'refunded')),
  shipping_address JSONB DEFAULT '{}',
  shipping_status TEXT DEFAULT 'pending' CHECK (shipping_status IN ('pending', 'printing', 'shipped', 'delivered')),
  tracking_number TEXT,
  print_file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CREATE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_events_host ON public.events(host_id);
CREATE INDEX IF NOT EXISTS idx_events_invite_code ON public.events(invite_code);
CREATE INDEX IF NOT EXISTS idx_event_guests_event ON public.event_guests(event_id);
CREATE INDEX IF NOT EXISTS idx_event_guests_user ON public.event_guests(user_id);
CREATE INDEX IF NOT EXISTS idx_photos_event ON public.photos(event_id);
CREATE INDEX IF NOT EXISTS idx_photos_uploader ON public.photos(uploader_id);
CREATE INDEX IF NOT EXISTS idx_photos_processing ON public.photos(processing_status);
CREATE INDEX IF NOT EXISTS idx_albums_event ON public.albums(event_id);
CREATE INDEX IF NOT EXISTS idx_albums_owner ON public.albums(owner_id);
CREATE INDEX IF NOT EXISTS idx_album_pages_album ON public.album_pages(album_id);
CREATE INDEX IF NOT EXISTS idx_album_photos_album ON public.album_photos(album_id);
CREATE INDEX IF NOT EXISTS idx_album_photos_photo ON public.album_photos(photo_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_album ON public.orders(album_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.album_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.album_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CREATE ALL RLS POLICIES (after all tables exist)
-- ============================================

-- Profiles policies
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Events policies
CREATE POLICY "events_host_all" ON public.events FOR ALL USING (auth.uid() = host_id);
CREATE POLICY "events_guest_select" ON public.events FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.event_guests 
    WHERE event_guests.event_id = events.id 
    AND event_guests.user_id = auth.uid()
  )
);

-- Event guests policies
CREATE POLICY "event_guests_host_all" ON public.event_guests FOR ALL USING (
  EXISTS (SELECT 1 FROM public.events WHERE events.id = event_guests.event_id AND events.host_id = auth.uid())
);
CREATE POLICY "event_guests_self_select" ON public.event_guests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "event_guests_self_insert" ON public.event_guests FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Photos policies
CREATE POLICY "photos_host_all" ON public.photos FOR ALL USING (
  EXISTS (SELECT 1 FROM public.events WHERE events.id = photos.event_id AND events.host_id = auth.uid())
);
CREATE POLICY "photos_uploader_all" ON public.photos FOR ALL USING (auth.uid() = uploader_id);
CREATE POLICY "photos_guest_select" ON public.photos FOR SELECT USING (
  is_shared = TRUE AND EXISTS (
    SELECT 1 FROM public.event_guests 
    WHERE event_guests.event_id = photos.event_id 
    AND event_guests.user_id = auth.uid()
  )
);

-- Templates policies (public read for authenticated users)
CREATE POLICY "templates_public_read" ON public.templates FOR SELECT TO authenticated USING (TRUE);

-- Albums policies
CREATE POLICY "albums_owner_all" ON public.albums FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "albums_host_select" ON public.albums FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.events WHERE events.id = albums.event_id AND events.host_id = auth.uid())
);

-- Album pages policies
CREATE POLICY "album_pages_owner_all" ON public.album_pages FOR ALL USING (
  EXISTS (SELECT 1 FROM public.albums WHERE albums.id = album_pages.album_id AND albums.owner_id = auth.uid())
);

-- Album photos policies
CREATE POLICY "album_photos_owner_all" ON public.album_photos FOR ALL USING (
  EXISTS (SELECT 1 FROM public.albums WHERE albums.id = album_photos.album_id AND albums.owner_id = auth.uid())
);

-- Orders policies
CREATE POLICY "orders_owner_all" ON public.orders FOR ALL USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "notifications_owner_all" ON public.notifications FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- TRIGGER: Auto-create profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NULL),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', NULL)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- TRIGGER: Updated_at columns
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_events_updated_at ON public.events;
DROP TRIGGER IF EXISTS update_albums_updated_at ON public.albums;
DROP TRIGGER IF EXISTS update_album_pages_updated_at ON public.album_pages;
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_albums_updated_at BEFORE UPDATE ON public.albums FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_album_pages_updated_at BEFORE UPDATE ON public.album_pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
