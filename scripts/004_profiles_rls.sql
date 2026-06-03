-- Migration: Allow authenticated users to read basic profile information.
-- This ensures that when a Host looks at their guest list, they can actually
-- fetch and see the guest's name and email. The original rule only allowed
-- you to view your own profile.

-- Run this in your Supabase SQL editor

-- Drop existing restricted select policy if it exists
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;

-- Create an open read policy for anyone who is logged into the application
CREATE POLICY "profiles_public_read" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');
