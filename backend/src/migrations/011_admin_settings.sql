-- Migration 011: Admin settings table, promo codes table, user banning field, and orders table adjustments

-- 1. Create system settings table
CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default pricing configuration
INSERT INTO public.system_settings (key, value)
VALUES (
  'pricing',
  '{"softcover": 89900, "hardcover": 149900, "polaroid": 19900}'::jsonb
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Seed default page limits
INSERT INTO public.system_settings (key, value)
VALUES (
  'page_limits',
  '{"softcover": 80, "hardcover": 120}'::jsonb
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Seed default minimum pages configuration
INSERT INTO public.system_settings (key, value)
VALUES (
  'min_pages',
  '24'::jsonb
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Seed default shipping and tax rules
INSERT INTO public.system_settings (key, value)
VALUES (
  'shipping_and_tax',
  '{"tax_rate": 18, "shipping_fee": 15000, "free_shipping_threshold": 150000}'::jsonb
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Seed copy limits
INSERT INTO public.system_settings (key, value)
VALUES (
  'min_max_copies',
  '{"min": 1, "max": 10}'::jsonb
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;


-- 2. Create promo codes table
CREATE TABLE IF NOT EXISTS public.promo_codes (
  code TEXT PRIMARY KEY,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value INTEGER NOT NULL, -- in percentage (e.g. 20 for 20%) or paise/cents (e.g. 50000 for Rs. 500)
  min_order_value INTEGER DEFAULT 0, -- in paise/cents
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed a default coupon code for testing
INSERT INTO public.promo_codes (code, discount_type, discount_value, min_order_value, is_active)
VALUES ('WELCOME10', 'percentage', 10, 0, TRUE)
ON CONFLICT (code) DO NOTHING;


-- 3. Add user banned status column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;


-- 4. Adjust orders table to support Polaroids and promo codes
ALTER TABLE public.orders ALTER COLUMN album_id DROP NOT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS promo_code TEXT;
