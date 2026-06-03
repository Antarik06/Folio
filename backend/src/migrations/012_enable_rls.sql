-- Migration 012: Enable Row Level Security (RLS) on system_settings and promo_codes tables

-- 1. Enable RLS on system_settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- 2. Enable RLS on promo_codes
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- 3. Create select policy for system_settings if it doesn't already exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'system_settings' 
    AND policyname = 'Allow public read access to system_settings'
  ) THEN
    CREATE POLICY "Allow public read access to system_settings" 
    ON public.system_settings 
    FOR SELECT 
    USING (true);
  END IF;
END $$;
